import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import FoodLog from "./components/FoodLog";
import CaregiverDashboard from "./components/CaregiverDashboard";

export default function App() {
  const [session, setSession]           = useState(undefined);
  const [caregiverFor, setCaregiverFor] = useState([]); // links where user is caregiver (active)
  const [pendingInvites, setPendingInvites] = useState([]); // links where user is invited caregiver
  const [caregiverView, setCaregiverView]   = useState(null); // active caregiver_link being reviewed

  const loadCaregiverData = useCallback(async (user) => {
    const [{ data: active }, { data: pending }] = await Promise.all([
      supabase.from("caregiver_links").select("*").eq("caregiver_id", user.id).eq("status", "active"),
      supabase.from("caregiver_links").select("*").eq("caregiver_email", user.email).eq("status", "pending"),
    ]);
    setCaregiverFor(active || []);
    setPendingInvites(pending || []);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadCaregiverData(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setSession(session);
      if (session) loadCaregiverData(session.user);
      else { setCaregiverFor([]); setPendingInvites([]); setCaregiverView(null); }
    });
    return () => subscription.unsubscribe();
  }, [loadCaregiverData]);

  const handleAcceptInvite = async (invite) => {
    await supabase
      .from("caregiver_links")
      .update({ caregiver_id: session.user.id, status: "active" })
      .eq("id", invite.id);
    await loadCaregiverData(session.user);
  };

  const handleDeclineInvite = async (invite) => {
    await supabase.from("caregiver_links").delete().eq("id", invite.id);
    await loadCaregiverData(session.user);
  };

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "#edeae0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'Courier New', monospace", fontSize: 11, color: "#7a9a6a", letterSpacing: "0.14em" }}>LOADING…</span>
      </div>
    );
  }

  if (!session) return <Auth />;

  if (caregiverView) {
    return (
      <CaregiverDashboard
        session={session}
        link={caregiverView}
        onBack={() => setCaregiverView(null)}
      />
    );
  }

  return (
    <FoodLog
      session={session}
      caregiverFor={caregiverFor}
      pendingInvites={pendingInvites}
      onAcceptInvite={handleAcceptInvite}
      onDeclineInvite={handleDeclineInvite}
      onSwitchToCaregiver={setCaregiverView}
      onLinksChanged={() => loadCaregiverData(session.user)}
    />
  );
}

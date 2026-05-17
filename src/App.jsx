import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";
import { useSettings, ZOOM } from "./lib/settings";
import { THEMES } from "./lib/theme";
import Auth from "./components/Auth";
import FoodLog from "./components/FoodLog";
import CaregiverDashboard from "./components/CaregiverDashboard";

export default function App() {
  const { settings, update } = useSettings();
  const [session, setSession]               = useState(undefined);
  const [caregiverFor, setCaregiverFor]     = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [caregiverView, setCaregiverView]   = useState(null);

  // Apply theme CSS variables to :root
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const effective = settings.theme === "auto" ? (mq.matches ? "dark" : "light") : settings.theme;
      const vars = THEMES[effective];
      const root = document.documentElement;
      Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [settings.theme]);

  // Apply font family
  useEffect(() => {
    const f = settings.font === "sans"
      ? "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      : "'Georgia', serif";
    document.documentElement.style.setProperty("--c-font-serif", f);
    document.documentElement.style.setProperty("--c-font-mono", "'Courier New', monospace");
  }, [settings.font]);

  // Apply font size via zoom on body
  useEffect(() => {
    document.body.style.zoom = ZOOM[settings.fontSize] ?? 1;
  }, [settings.fontSize]);

  const loadCaregiverData = useCallback(async (user) => {
    const [{ data: active }, { data: pending }] = await Promise.all([
      supabase.from("caregiver_links").select("*").eq("caregiver_id", user.id).eq("status", "active"),
      supabase.from("caregiver_links").select("*").eq("caregiver_email", user.email).eq("status", "pending"),
    ]);
    setCaregiverFor(active || []);
    setPendingInvites(pending || []);
  }, []);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session) loadCaregiverData(session.user);
      })
      .catch(() => setSession(null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setSession(session);
      if (session) loadCaregiverData(session.user);
      else { setCaregiverFor([]); setPendingInvites([]); setCaregiverView(null); }
    });
    return () => subscription.unsubscribe();
  }, [loadCaregiverData]);

  const handleAcceptInvite = async (invite) => {
    await supabase.from("caregiver_links")
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
      <div style={{ minHeight: "100vh", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--c-font-mono)", fontSize: 11, color: "var(--c-accent-mid)", letterSpacing: "0.14em" }}>LOADING…</span>
      </div>
    );
  }

  if (!session) return <Auth />;

  if (caregiverView) {
    return (
      <CaregiverDashboard
        session={session}
        link={caregiverView}
        settings={settings}
        onUpdateSetting={update}
        onBack={() => setCaregiverView(null)}
      />
    );
  }

  return (
    <FoodLog
      session={session}
      caregiverFor={caregiverFor}
      pendingInvites={pendingInvites}
      settings={settings}
      onUpdateSetting={update}
      onAcceptInvite={handleAcceptInvite}
      onDeclineInvite={handleDeclineInvite}
      onSwitchToCaregiver={setCaregiverView}
      onLinksChanged={() => loadCaregiverData(session.user)}
    />
  );
}

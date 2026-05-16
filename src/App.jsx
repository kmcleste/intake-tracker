import { useState, useEffect } from "react";
import { supabase, supabaseMisconfigured } from "./lib/supabase";
import Auth from "./components/Auth";
import FoodLog from "./components/FoodLog";

const mono = "'Courier New', monospace";

function SetupError() {
  return (
    <div style={{ minHeight: "100vh", background: "#edeae0", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "min(500px, 100%)", background: "#f5f2ea", border: "1px solid #c8c4b4", boxShadow: "4px 4px 0 #c0bba8" }}>
        <div style={{ background: "#3d2a2a", padding: "14px 20px" }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: "#c87a7a", letterSpacing: "0.14em" }}>CONFIGURATION ERROR</div>
          <div style={{ fontFamily: "'Georgia', serif", fontSize: 15, color: "#f0dede", marginTop: 2 }}>Missing Supabase environment variables</div>
        </div>
        <div style={{ padding: 20, fontFamily: mono, fontSize: 12, color: "#3a2a2a", lineHeight: 1.8 }}>
          <p style={{ margin: "0 0 14px" }}>Add these two variables to your Vercel project settings under <strong>Settings → Environment Variables</strong>, then redeploy:</p>
          <div style={{ background: "#faf8f3", border: "1px solid #c8c4b4", padding: "10px 14px", borderLeft: "3px solid #c87a7a" }}>
            <div>VITE_SUPABASE_URL</div>
            <div style={{ marginTop: 6 }}>VITE_SUPABASE_ANON_KEY</div>
          </div>
          <p style={{ margin: "14px 0 0", color: "#7a6a6a", fontSize: 11 }}>
            Find these values in your Supabase project under <strong>Settings → API</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    if (supabaseMisconfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (supabaseMisconfigured) return <SetupError />;

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "#edeae0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'Courier New', monospace", fontSize: 11, color: "#7a9a6a", letterSpacing: "0.14em" }}>
          LOADING…
        </span>
      </div>
    );
  }

  if (!session) return <Auth />;

  return <FoodLog session={session} />;
}

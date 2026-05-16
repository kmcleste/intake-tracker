import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import FoodLog from "./components/FoodLog";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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

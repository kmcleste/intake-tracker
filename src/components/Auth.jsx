import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const inputStyle = {
    width: "100%",
    background: "#faf8f3",
    border: "1px solid #c8c4b4",
    padding: "9px 11px",
    fontFamily: "'Georgia', serif",
    fontSize: 14,
    color: "#2a2a1e",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontFamily: "'Courier New', monospace",
    fontSize: 10,
    color: "#7a7a6a",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: 5,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for a confirmation link, then sign in.");
        setMode("login");
      }
    }

    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#edeae0", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "min(420px, 100%)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: 10, color: "#7a9a6a", letterSpacing: "0.2em", marginBottom: 8 }}>
            DIETARY INTAKE LOG — MEDICAL CORRELATION
          </div>
          <h1 style={{ margin: 0, fontSize: 24, color: "#1a1a0e", fontWeight: 400, fontFamily: "'Georgia', serif" }}>
            Food & Symptom Journal
          </h1>
        </div>

        <div style={{ background: "#f5f2ea", border: "1px solid #c8c4b4", boxShadow: "4px 4px 0 #c0bba8" }}>
          <div style={{ background: "#2a3d2e", padding: "14px 20px" }}>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: 10, color: "#7a9a6a", letterSpacing: "0.14em" }}>
              {mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
            </div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 15, color: "#e8f0de", marginTop: 2 }}>
              {mode === "login" ? "Welcome back" : "Get started"}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {message && (
              <div style={{ background: "#e8f0de", border: "1px solid #7a9a6a", padding: "9px 12px", fontFamily: "'Courier New', monospace", fontSize: 11, color: "#2a3d2e", letterSpacing: "0.04em" }}>
                {message}
              </div>
            )}
            {error && (
              <div style={{ background: "#f5e8e8", border: "1px solid #c8a0a0", padding: "9px 12px", fontFamily: "'Courier New', monospace", fontSize: 11, color: "#6a2a2a", letterSpacing: "0.04em" }}>
                {error}
              </div>
            )}

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              style={{
                background: !loading && email && password ? "#2a3d2e" : "#c8c4b4",
                border: "none",
                padding: "10px 0",
                fontFamily: "'Courier New', monospace",
                fontSize: 11,
                color: !loading && email && password ? "#c8dca9" : "#8a8a7a",
                cursor: !loading && email && password ? "pointer" : "not-allowed",
                letterSpacing: "0.1em",
                width: "100%",
              }}
            >
              {loading ? "…" : mode === "login" ? "SIGN IN →" : "CREATE ACCOUNT →"}
            </button>

            <div style={{ textAlign: "center" }}>
              <button
                type="button"
                onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setError(null); setMessage(null); }}
                style={{ background: "none", border: "none", fontFamily: "'Courier New', monospace", fontSize: 10, color: "#7a7a6a", cursor: "pointer", letterSpacing: "0.06em", textDecoration: "underline" }}
              >
                {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

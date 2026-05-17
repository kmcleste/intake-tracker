import { useState } from "react";
import { supabase } from "../lib/supabase";

const mono = "var(--c-font-mono)";
const serif = "var(--c-font-serif)";

export default function Auth() {
  const [mode, setMode]       = useState("login");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [message, setMessage] = useState(null);

  const inputStyle = {
    width: "100%", background: "var(--c-bg-card)", border: "1px solid var(--c-border)",
    padding: "9px 11px", fontFamily: serif, fontSize: 14, color: "var(--c-text)",
    outline: "none", boxSizing: "border-box",
  };
  const labelStyle = {
    display: "block", fontFamily: mono, fontSize: 10, color: "var(--c-text-subtle)",
    letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 5,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setMessage(null); setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); }
      else if (data?.user?.identities?.length === 0) { setError("An account with this email already exists. Sign in instead."); setMode("login"); }
      else { setMessage("Account created — you can sign in now."); setMode("login"); }
    }
    setLoading(false);
  };

  const canSubmit = !loading && email && password;

  return (
    <div style={{ minHeight: "100vh", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "min(420px, 100%)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-accent-mid)", letterSpacing: "0.2em", marginBottom: 8 }}>
            DIETARY INTAKE LOG — MEDICAL CORRELATION
          </div>
          <h1 style={{ margin: 0, fontSize: 24, color: "var(--c-text)", fontWeight: 400, fontFamily: serif }}>
            Food & Symptom Journal
          </h1>
        </div>

        <div style={{ background: "var(--c-bg-panel)", border: `1px solid var(--c-border)`, boxShadow: `4px 4px 0 var(--c-shadow)` }}>
          <div style={{ background: "var(--c-accent)", padding: "14px 20px" }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-accent-mid)", letterSpacing: "0.14em" }}>
              {mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
            </div>
            <div style={{ fontFamily: serif, fontSize: 15, color: "var(--c-accent-hd)", marginTop: 2 }}>
              {mode === "login" ? "Welcome back" : "Get started"}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {message && (
              <div style={{ background: "var(--c-bg-success)", border: `1px solid var(--c-accent-bdr)`, padding: "9px 12px", fontFamily: mono, fontSize: 11, color: "var(--c-accent)", letterSpacing: "0.04em" }}>
                {message}
              </div>
            )}
            {error && (
              <div style={{ background: "var(--c-bg-error)", border: `1px solid var(--c-err-bdr)`, padding: "9px 12px", fontFamily: mono, fontSize: 11, color: "var(--c-err-text-dk)", letterSpacing: "0.04em" }}>
                {error}
              </div>
            )}
            <div><label style={labelStyle}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" style={inputStyle} /></div>
            <div><label style={labelStyle}>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={mode === "login" ? "current-password" : "new-password"} style={inputStyle} /></div>
            <button type="submit" disabled={!canSubmit} style={{ background: canSubmit ? "var(--c-accent)" : "var(--c-border)", border: "none", padding: "10px 0", fontFamily: mono, fontSize: 11, color: canSubmit ? "var(--c-accent-lt)" : "var(--c-text-subtle)", cursor: canSubmit ? "pointer" : "not-allowed", letterSpacing: "0.1em", width: "100%" }}>
              {loading ? "…" : mode === "login" ? "SIGN IN →" : "CREATE ACCOUNT →"}
            </button>
            <div style={{ textAlign: "center" }}>
              <button type="button" onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setError(null); setMessage(null); }} style={{ background: "none", border: "none", fontFamily: mono, fontSize: 10, color: "var(--c-text-subtle)", cursor: "pointer", letterSpacing: "0.06em", textDecoration: "underline" }}>
                {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

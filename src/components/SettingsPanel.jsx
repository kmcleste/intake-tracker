import { useState } from "react";
import { supabase } from "../lib/supabase";

const mono = "var(--c-font-mono)";
const serif = "var(--c-font-serif)";

function Row({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-text-subtle)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}

function Chip({ label, active, onClick, preview }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "var(--c-accent)" : "var(--c-bg-stat)",
        color: active ? "var(--c-accent-lt)" : "var(--c-text-mid)",
        border: `1px solid ${active ? "var(--c-accent-bdr)" : "var(--c-border)"}`,
        fontFamily: preview || mono,
        fontSize: preview ? 13 : 11,
        padding: "6px 14px",
        cursor: "pointer",
        letterSpacing: preview ? 0 : "0.06em",
        transition: "background 0.12s",
      }}
    >
      {label}
    </button>
  );
}

export default function SettingsPanel({ settings, update, onClose, notifEnabled, onToggleNotif }) {
  const [deleteStep, setDeleteStep] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--c-overlay)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
      <div style={{ background: "var(--c-bg-panel)", border: `1px solid var(--c-border)`, width: "min(420px, 95vw)", boxShadow: `4px 4px 0 var(--c-shadow)` }}>
        <div style={{ background: "var(--c-accent)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-accent-mid)", letterSpacing: "0.14em" }}>PREFERENCES</div>
            <div style={{ fontFamily: serif, fontSize: 16, color: "var(--c-accent-hd)", marginTop: 2 }}>Display Settings</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--c-accent-mid)", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
          <Row label="Theme">
            {[["light", "Light"], ["dark", "Dark"], ["auto", "Auto"]].map(([v, l]) => (
              <Chip key={v} label={l} active={settings.theme === v} onClick={() => update("theme", v)} />
            ))}
          </Row>

          <Row label="Text Size">
            {[["sm", "Small"], ["md", "Medium"], ["lg", "Large"], ["xl", "X-Large"]].map(([v, l]) => (
              <Chip key={v} label={l} active={settings.fontSize === v} onClick={() => update("fontSize", v)} />
            ))}
          </Row>

          <Row label="Font">
            <Chip label="Serif" active={settings.font === "serif"} onClick={() => update("font", "serif")} preview="'Georgia', serif" />
            <Chip label="Sans-serif" active={settings.font === "sans"} onClick={() => update("font", "sans")} preview="system-ui, sans-serif" />
          </Row>

          <Row label="Daily reminder">
            <Chip label={notifEnabled ? "ON" : "OFF"} active={notifEnabled} onClick={onToggleNotif} />
          </Row>

          <p style={{ margin: 0, fontFamily: serif, fontSize: 12, color: "var(--c-text-subtle)", fontStyle: "italic", lineHeight: 1.6 }}>
            Settings are saved automatically and persist across sessions.
          </p>

          <div style={{ borderTop: `1px solid var(--c-border)`, paddingTop: 16, marginTop: 4 }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-text-subtle)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Data & Privacy</div>
            {!deleteStep ? (
              <button onClick={() => setDeleteStep(true)}
                style={{ background: "none", border: `1px solid var(--c-err-bdr)`, color: "var(--c-err-text)", fontFamily: mono, fontSize: 10, padding: "7px 14px", cursor: "pointer", letterSpacing: "0.08em", width: "100%" }}>
                Delete my account and all data
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ margin: 0, fontFamily: serif, fontSize: 13, color: "var(--c-err-text-dk)", lineHeight: 1.6 }}>
                  This will permanently delete all your journal entries, photos, and care team connections. This cannot be undone.
                </p>
                {deleteError && <div style={{ fontFamily: mono, fontSize: 11, color: "var(--c-err-text-dk)", background: "var(--c-bg-error)", border: `1px solid var(--c-err-bdr)`, padding: "7px 10px" }}>{deleteError}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setDeleteStep(false); setDeleteError(null); }} disabled={deleting}
                    style={{ flex: 1, background: "none", border: `1px solid var(--c-border)`, color: "var(--c-text-subtle)", fontFamily: mono, fontSize: 10, padding: "7px 0", cursor: deleting ? "not-allowed" : "pointer", letterSpacing: "0.08em" }}>
                    Cancel
                  </button>
                  <button onClick={async () => {
                    setDeleting(true); setDeleteError(null);
                    const { error } = await supabase.rpc("delete_user_account");
                    if (error) { setDeleteError(error.message); setDeleting(false); }
                  }} disabled={deleting}
                    style={{ flex: 1, background: deleting ? "var(--c-border)" : "var(--c-err-bdr)", border: "none", color: deleting ? "var(--c-text-subtle)" : "#fff", fontFamily: mono, fontSize: 10, padding: "7px 0", cursor: deleting ? "not-allowed" : "pointer", letterSpacing: "0.08em" }}>
                    {deleting ? "Deleting…" : "Yes, delete everything"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

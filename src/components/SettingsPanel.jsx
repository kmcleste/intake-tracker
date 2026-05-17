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
        </div>
      </div>
    </div>
  );
}

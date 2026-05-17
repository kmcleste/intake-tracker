const mono = "var(--c-font-mono)";
const serif = "var(--c-font-serif)";

export default function PrivacyModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--c-overlay)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)", padding: 16 }}>
      <div style={{ background: "var(--c-bg-panel)", border: `1px solid var(--c-border)`, width: "min(480px, 100%)", maxHeight: "80vh", overflowY: "auto", boxShadow: `4px 4px 0 var(--c-shadow)` }}>
        <div style={{ background: "var(--c-accent)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: serif, fontSize: 16, color: "var(--c-accent-hd)" }}>Privacy</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--c-accent-mid)", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            ["What we collect", "Your food entries, wellbeing scores, symptoms, notes, and any photos you attach. Your email address for sign-in."],
            ["Who can see it", "Only you, and any care team members you explicitly invite. Care team members see your entries but only the notes they choose to share back with you."],
            ["Where it's stored", "Securely in Supabase (encrypted at rest and in transit). Photos in Supabase Storage. We don't have access to your password."],
            ["What we don't do", "We don't sell your data, share it with advertisers, or use it to train AI models."],
            ["Your rights", "You can export your data anytime using the Export button. You can delete your account and all associated data at any time from Settings."],
            ["Analytics", "We may collect anonymous page-view data (no health information) to understand how the app is used. No personal data is included."],
          ].map(([title, body]) => (
            <div key={title}>
              <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-text-subtle)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>{title}</div>
              <div style={{ fontFamily: serif, fontSize: 13, color: "var(--c-text-muted)", lineHeight: 1.7 }}>{body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

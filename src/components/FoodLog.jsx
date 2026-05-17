import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import SettingsPanel from "./SettingsPanel";

const MEAL_TYPES = ["Breakfast", "Morning Snack", "Lunch", "Afternoon Snack", "Dinner", "Evening Snack", "Other"];
const COMMON_TAGS = ["dairy-free", "gluten-free", "high-fiber", "high-fat", "high-sugar", "alcohol", "caffeine", "processed", "raw", "cooked"];
const mono = "var(--c-font-mono)";
const serif = "var(--c-font-serif)";

function formatTime(iso) { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function formatDate(iso) {
  const d = new Date(iso), today = new Date(), yest = new Date(today);
  yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}
function groupByDate(entries) {
  const groups = {};
  [...entries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).forEach(e => {
    const k = formatDate(e.timestamp); if (!groups[k]) groups[k] = []; groups[k].push(e);
  });
  return groups;
}

function Tag({ label, onRemove, onClick, active }) {
  return (
    <span onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", background: active ? "var(--c-accent)" : "var(--c-tag-bg)", color: active ? "var(--c-accent-lt)" : "var(--c-text-mid)", border: `1px solid ${active ? "var(--c-accent-bdr)" : "var(--c-border)"}`, borderRadius: 2, fontSize: 11, fontFamily: mono, letterSpacing: "0.04em", cursor: onClick ? "pointer" : "default", userSelect: "none" }}>
      {label}
      {onRemove && <span onClick={e => { e.stopPropagation(); onRemove(); }} style={{ marginLeft: 2, cursor: "pointer", opacity: 0.6, fontWeight: 700 }}>×</span>}
    </span>
  );
}

function EntryCard({ entry, careNotes, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <div style={{ background: "var(--c-bg-card)", border: `1px solid var(--c-border-card)`, borderLeft: "3px solid var(--c-accent-mid)", marginBottom: 10, opacity: deleting ? 0.5 : 1, transition: "box-shadow 0.15s, opacity 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `2px 2px 0 var(--c-border-card)`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
      <div style={{ padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }} onClick={() => setExpanded(!expanded)}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontFamily: mono, fontSize: 11, color: "var(--c-text-subtle)", letterSpacing: "0.08em" }}>{formatTime(entry.timestamp)}</span>
            <span style={{ padding: "1px 7px", background: "var(--c-accent)", color: "var(--c-accent-lt)", fontSize: 10, fontFamily: mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{entry.meal}</span>
          </div>
          <div style={{ fontFamily: serif, fontSize: 14, color: "var(--c-text)", lineHeight: 1.5 }}>{entry.foods}</div>
          {entry.tags.length > 0 && <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>{entry.tags.map(t => <Tag key={t} label={t} active />)}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 12 }}>
          {(entry.notes || careNotes.length > 0) && <span style={{ fontFamily: mono, fontSize: 10, color: "var(--c-text-subtle)", letterSpacing: "0.06em" }}>NOTE ↓</span>}
          <span style={{ color: "var(--c-text-subtle)", fontSize: 16, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▾</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 14px", borderTop: `1px dashed var(--c-border-card)` }}>
          {entry.notes && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-text-subtle)", letterSpacing: "0.1em", marginBottom: 4, textTransform: "uppercase" }}>Clinical Notes</div>
              <div style={{ fontFamily: serif, fontSize: 13, color: "var(--c-text)", lineHeight: 1.7, fontStyle: "italic", background: "var(--c-bg-note)", padding: "8px 12px", borderLeft: `2px solid var(--c-border)` }}>{entry.notes}</div>
            </div>
          )}
          {careNotes.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-text-warm)", letterSpacing: "0.1em", marginBottom: 4, textTransform: "uppercase" }}>Care Notes</div>
              {careNotes.map(n => (
                <div key={n.id} style={{ fontFamily: serif, fontSize: 13, color: "var(--c-text)", lineHeight: 1.7, fontStyle: "italic", background: "var(--c-bg-care)", padding: "8px 12px", borderLeft: `2px solid var(--c-border-care)`, marginBottom: 4 }}>{n.note}</div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={async () => { setDeleting(true); await onDelete(entry.id); }} disabled={deleting}
              style={{ background: "none", border: `1px solid var(--c-err-bdr)`, color: "var(--c-err-text)", fontFamily: mono, fontSize: 10, padding: "3px 10px", cursor: deleting ? "not-allowed" : "pointer", letterSpacing: "0.08em" }}>
              REMOVE ENTRY
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LogForm({ onAdd, onClose }) {
  const [meal, setMeal]         = useState("Breakfast");
  const [foods, setFoods]       = useState("");
  const [notes, setNotes]       = useState("");
  const [tags, setTags]         = useState([]);
  const [customTag, setCustomTag] = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const foodsRef = useRef();

  useEffect(() => { foodsRef.current?.focus(); }, []);
  const toggleTag = t => setTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
  const addCustomTag = () => { const t = customTag.trim().toLowerCase(); if (t && !tags.includes(t)) setTags(p => [...p, t]); setCustomTag(""); };

  const handleSubmit = async () => {
    if (!foods.trim() || saving) return;
    setSaving(true); setError(null);
    const err = await onAdd({ meal, foods: foods.trim(), notes: notes.trim(), tags });
    if (err) { setError(err); setSaving(false); } else onClose();
  };

  const input = { width: "100%", background: "var(--c-bg-card)", border: `1px solid var(--c-border)`, padding: "8px 10px", fontFamily: serif, fontSize: 13, color: "var(--c-text)", outline: "none", boxSizing: "border-box", resize: "vertical" };
  const lbl   = { display: "block", fontFamily: mono, fontSize: 10, color: "var(--c-text-subtle)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 5 };
  const ok = foods.trim() && !saving;

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--c-overlay)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
      <div style={{ background: "var(--c-bg-panel)", border: `1px solid var(--c-border)`, width: "min(580px, 95vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: `4px 4px 0 var(--c-shadow)` }}>
        <div style={{ background: "var(--c-accent)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-accent-mid)", letterSpacing: "0.14em" }}>NEW ENTRY</div>
            <div style={{ fontFamily: serif, fontSize: 16, color: "var(--c-accent-hd)", marginTop: 2 }}>Log Food Intake</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--c-accent-mid)", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
          {error && <div style={{ background: "var(--c-bg-error)", border: `1px solid var(--c-err-bdr)`, padding: "9px 12px", fontFamily: mono, fontSize: 11, color: "var(--c-err-text-dk)" }}>{error}</div>}
          <div><label style={lbl}>Meal / Occasion</label><select value={meal} onChange={e => setMeal(e.target.value)} style={{ ...input, cursor: "pointer" }}>{MEAL_TYPES.map(m => <option key={m}>{m}</option>)}</select></div>
          <div><label style={lbl}>Foods & Beverages</label><textarea ref={foodsRef} value={foods} onChange={e => setFoods(e.target.value)} placeholder="Describe what you ate and drank…" rows={3} style={{ ...input, lineHeight: 1.6 }} /></div>
          <div>
            <label style={lbl}>Properties / Flags</label>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>{COMMON_TAGS.map(t => <Tag key={t} label={t} active={tags.includes(t)} onClick={() => toggleTag(t)} />)}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <input value={customTag} onChange={e => setCustomTag(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustomTag()} placeholder="custom tag…" style={{ ...input, flex: 1, padding: "5px 8px" }} />
              <button onClick={addCustomTag} style={{ background: "var(--c-tag-bg)", border: `1px solid var(--c-border)`, padding: "5px 12px", fontFamily: mono, fontSize: 10, cursor: "pointer", color: "var(--c-text-mid)", letterSpacing: "0.08em" }}>ADD</button>
            </div>
            {tags.length > 0 && <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>{tags.map(t => <Tag key={t} label={t} active onRemove={() => setTags(p => p.filter(x => x !== t))} />)}</div>}
          </div>
          <div><label style={lbl}>Clinical / Observational Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any symptoms, reactions, timing of effects…" rows={4} style={{ ...input, lineHeight: 1.7, fontStyle: "italic" }} /></div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            <button onClick={onClose} style={{ background: "none", border: `1px solid var(--c-border)`, padding: "8px 18px", fontFamily: mono, fontSize: 11, color: "var(--c-text-subtle)", cursor: "pointer", letterSpacing: "0.08em" }}>CANCEL</button>
            <button onClick={handleSubmit} disabled={!ok} style={{ background: ok ? "var(--c-accent)" : "var(--c-border)", border: "none", padding: "8px 22px", fontFamily: mono, fontSize: 11, color: ok ? "var(--c-accent-lt)" : "var(--c-text-subtle)", cursor: ok ? "pointer" : "not-allowed", letterSpacing: "0.1em" }}>
              {saving ? "SAVING…" : "LOG ENTRY →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportModal({ entries, onClose }) {
  const text = Object.entries(groupByDate(entries)).map(([date, group]) =>
    `=== ${date} ===\n` + group.map(e =>
      `[${formatTime(e.timestamp)}] ${e.meal.toUpperCase()}\nFoods: ${e.foods}\n` +
      (e.tags.length ? `Tags: ${e.tags.join(", ")}\n` : "") + (e.notes ? `Notes: ${e.notes}\n` : "")
    ).join("\n") + "\n"
  ).join("\n");

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--c-overlay)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--c-bg-panel)", border: `1px solid var(--c-border)`, width: "min(560px, 95vw)", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: `4px 4px 0 var(--c-shadow)` }}>
        <div style={{ background: "var(--c-accent)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: serif, fontSize: 15, color: "var(--c-accent-hd)" }}>Export Log</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--c-accent-mid)", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
        <textarea readOnly value={text} style={{ flex: 1, minHeight: 280, background: "var(--c-bg-card)", border: "none", borderBottom: `1px solid var(--c-border)`, padding: 16, fontFamily: mono, fontSize: 12, color: "var(--c-text)", lineHeight: 1.7, resize: "none", outline: "none" }} />
        <div style={{ padding: 14, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => navigator.clipboard.writeText(text)} style={{ background: "var(--c-accent)", border: "none", padding: "8px 18px", fontFamily: mono, fontSize: 11, color: "var(--c-accent-lt)", cursor: "pointer", letterSpacing: "0.1em" }}>COPY TO CLIPBOARD</button>
          <button onClick={onClose} style={{ background: "none", border: `1px solid var(--c-border)`, padding: "8px 16px", fontFamily: mono, fontSize: 11, color: "var(--c-text-subtle)", cursor: "pointer", letterSpacing: "0.08em" }}>CLOSE</button>
        </div>
      </div>
    </div>
  );
}

function CareTeamPanel({ session, onClose, onLinksChanged }) {
  const [links, setLinks]   = useState([]);
  const [email, setEmail]   = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  const loadLinks = async () => { const { data } = await supabase.from("caregiver_links").select("*").eq("patient_id", session.user.id); setLinks(data || []); };
  useEffect(() => { loadLinks(); }, []);

  const invite = async () => {
    const addr = email.trim().toLowerCase();
    if (!addr) return;
    if (addr === session.user.email) { setError("You can't invite yourself."); return; }
    if (links.some(l => l.caregiver_email === addr)) { setError("Already invited."); return; }
    setSaving(true); setError(null);
    await supabase.from("caregiver_links").insert({ patient_id: session.user.id, patient_email: session.user.email, caregiver_email: addr, status: "pending" });
    const { error: otpError } = await supabase.auth.signInWithOtp({ email: addr, options: { emailRedirectTo: window.location.origin, shouldCreateUser: true } });
    if (otpError) { setError(`Invite saved but email failed: ${otpError.message}`); setSaving(false); return; }
    setEmail(""); await loadLinks(); onLinksChanged(); setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--c-overlay)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
      <div style={{ background: "var(--c-bg-panel)", border: `1px solid var(--c-border)`, width: "min(480px, 95vw)", maxHeight: "85vh", overflowY: "auto", boxShadow: `4px 4px 0 var(--c-shadow)` }}>
        <div style={{ background: "var(--c-accent)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-accent-mid)", letterSpacing: "0.14em" }}>MANAGE</div>
            <div style={{ fontFamily: serif, fontSize: 16, color: "var(--c-accent-hd)", marginTop: 2 }}>Care Team</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--c-accent-mid)", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
          <p style={{ margin: 0, fontFamily: serif, fontSize: 13, color: "var(--c-text-muted)", lineHeight: 1.6, fontStyle: "italic" }}>
            Invite a caregiver or family member by email. They can add private notes to your entries — you'll only see notes they choose to share with you.
          </p>
          {links.length > 0 && (
            <div>
              <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-text-subtle)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Current caregivers</div>
              {links.map(l => (
                <div key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "var(--c-bg-card)", border: `1px solid var(--c-border-card)`, marginBottom: 6 }}>
                  <div>
                    <div style={{ fontFamily: serif, fontSize: 13, color: "var(--c-text)" }}>{l.caregiver_email}</div>
                    <div style={{ fontFamily: mono, fontSize: 9, color: l.status === "active" ? "var(--c-accent-mid)" : "var(--c-text-warm)", letterSpacing: "0.1em", marginTop: 2 }}>{l.status.toUpperCase()}</div>
                  </div>
                  <button onClick={async () => { await supabase.from("caregiver_links").delete().eq("id", l.id); await loadLinks(); onLinksChanged(); }} style={{ background: "none", border: `1px solid var(--c-err-bdr)`, color: "var(--c-err-text)", fontFamily: mono, fontSize: 9, padding: "3px 8px", cursor: "pointer", letterSpacing: "0.08em" }}>REMOVE</button>
                </div>
              ))}
            </div>
          )}
          <div>
            <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-text-subtle)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Invite by email</div>
            {error && <div style={{ background: "var(--c-bg-error)", border: `1px solid var(--c-err-bdr)`, padding: "7px 10px", fontFamily: mono, fontSize: 11, color: "var(--c-err-text-dk)", marginBottom: 8 }}>{error}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <input value={email} onChange={e => { setEmail(e.target.value); setError(null); }} onKeyDown={e => e.key === "Enter" && invite()} placeholder="caregiver@example.com" type="email"
                style={{ flex: 1, background: "var(--c-bg-card)", border: `1px solid var(--c-border)`, padding: "8px 10px", fontFamily: serif, fontSize: 13, color: "var(--c-text)", outline: "none" }} />
              <button onClick={invite} disabled={!email.trim() || saving} style={{ background: email.trim() && !saving ? "var(--c-accent)" : "var(--c-border)", border: "none", padding: "8px 16px", fontFamily: mono, fontSize: 10, color: email.trim() && !saving ? "var(--c-accent-lt)" : "var(--c-text-subtle)", cursor: email.trim() && !saving ? "pointer" : "not-allowed", letterSpacing: "0.1em" }}>
                {saving ? "…" : "INVITE"}
              </button>
            </div>
            {links.some(l => l.status === "pending") && (
              <p style={{ margin: "10px 0 0", fontFamily: mono, fontSize: 10, color: "var(--c-text-subtle)", lineHeight: 1.6 }}>
                Pending invites are accepted when that person signs in with the invited email address.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FoodLog({ session, caregiverFor, pendingInvites, settings, onUpdateSetting, onAcceptInvite, onDeclineInvite, onSwitchToCaregiver, onLinksChanged }) {
  const [entries, setEntries]         = useState([]);
  const [careNoteMap, setCareNoteMap] = useState({});
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [showExport, setShowExport]   = useState(false);
  const [showCareTeam, setShowCareTeam] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filterTag, setFilterTag]     = useState(null);
  const [search, setSearch]           = useState("");

  useEffect(() => {
    const load = async () => {
      const [{ data: ents }, { data: notes }] = await Promise.all([
        supabase.from("entries").select("*").eq("user_id", session.user.id).order("timestamp", { ascending: false }),
        supabase.from("caregiver_notes").select("*").eq("patient_id", session.user.id).eq("visible_to_patient", true),
      ]);
      setEntries(ents || []);
      const map = {};
      (notes || []).forEach(n => { if (!map[n.entry_id]) map[n.entry_id] = []; map[n.entry_id].push(n); });
      setCareNoteMap(map); setLoading(false);
    };
    load();
  }, [session.user.id]);

  const handleAdd = async ({ meal, foods, notes, tags }) => {
    const { data, error } = await supabase.from("entries").insert({ user_id: session.user.id, timestamp: new Date().toISOString(), meal, foods, notes, tags, severity: null }).select().single();
    if (error) return error.message;
    setEntries(prev => [data, ...prev]); return null;
  };
  const handleDelete = async (id) => {
    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (!error) setEntries(prev => prev.filter(e => e.id !== id));
  };

  const allTags = [...new Set(entries.flatMap(e => e.tags))];
  const filtered = entries.filter(e => {
    const matchTag = !filterTag || e.tags.includes(filterTag);
    const matchSearch = !search || e.foods.toLowerCase().includes(search.toLowerCase()) || e.notes.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });
  const grouped = groupByDate(filtered);

  return (
    <div style={{ minHeight: "100vh", background: "var(--c-bg)", fontFamily: serif }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")", opacity: 0.4 }} />

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 16px 60px", position: "relative", zIndex: 1 }}>
        {pendingInvites.map(inv => (
          <div key={inv.id} style={{ background: "var(--c-bg-success)", border: `1px solid var(--c-accent-bdr)`, borderTop: "none", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontFamily: mono, fontSize: 11, color: "var(--c-accent)", letterSpacing: "0.04em" }}>
              <strong>{inv.patient_email}</strong> has added you to their care team.
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onAcceptInvite(inv)} style={{ background: "var(--c-accent)", border: "none", padding: "5px 14px", fontFamily: mono, fontSize: 10, color: "var(--c-accent-lt)", cursor: "pointer", letterSpacing: "0.1em" }}>ACCEPT</button>
              <button onClick={() => onDeclineInvite(inv)} style={{ background: "none", border: `1px solid var(--c-accent-bdr)`, padding: "5px 10px", fontFamily: mono, fontSize: 10, color: "var(--c-accent-mid)", cursor: "pointer", letterSpacing: "0.08em" }}>DECLINE</button>
            </div>
          </div>
        ))}

        <div style={{ padding: "32px 0 24px", borderBottom: `2px solid var(--c-accent)` }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-accent-mid)", letterSpacing: "0.2em", marginBottom: 6 }}>DIETARY INTAKE LOG — MEDICAL CORRELATION</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, color: "var(--c-text)", fontWeight: 400, lineHeight: 1.2 }}>Food & Symptom Journal</h1>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--c-text-muted)", fontStyle: "italic" }}>{session.user.email}</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {caregiverFor.length > 0 && (
                <button onClick={() => onSwitchToCaregiver(caregiverFor[0])} style={{ background: "none", border: `1px solid var(--c-accent-warm)`, color: "var(--c-accent-warm)", padding: "8px 14px", fontFamily: mono, fontSize: 10, cursor: "pointer", letterSpacing: "0.1em" }}>CAREGIVER VIEW</button>
              )}
              <button onClick={() => setShowSettings(true)} style={{ background: "none", border: `1px solid var(--c-border)`, color: "var(--c-text-subtle)", padding: "8px 14px", fontFamily: mono, fontSize: 10, cursor: "pointer", letterSpacing: "0.1em" }}>SETTINGS</button>
              <button onClick={() => setShowCareTeam(true)} style={{ background: "none", border: `1px solid var(--c-border)`, color: "var(--c-text-subtle)", padding: "8px 14px", fontFamily: mono, fontSize: 10, cursor: "pointer", letterSpacing: "0.1em" }}>CARE TEAM</button>
              <button onClick={() => supabase.auth.signOut()} style={{ background: "none", border: `1px solid var(--c-border)`, color: "var(--c-text-subtle)", padding: "8px 14px", fontFamily: mono, fontSize: 10, cursor: "pointer", letterSpacing: "0.1em" }}>SIGN OUT</button>
              <button onClick={() => setShowExport(true)} style={{ background: "none", border: `1px solid var(--c-accent-mid)`, color: "var(--c-accent)", padding: "8px 14px", fontFamily: mono, fontSize: 10, cursor: "pointer", letterSpacing: "0.1em" }}>EXPORT</button>
              <button onClick={() => setShowForm(true)} style={{ background: "var(--c-accent)", border: "none", color: "var(--c-accent-lt)", padding: "8px 18px", fontFamily: mono, fontSize: 10, cursor: "pointer", letterSpacing: "0.1em" }}>+ LOG ENTRY</button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", borderBottom: `1px solid var(--c-border)` }}>
          {[{ label: "Total Entries", value: entries.length }, { label: "Today", value: entries.filter(e => formatDate(e.timestamp) === "Today").length }, { label: "Tagged", value: entries.filter(e => e.tags.length > 0).length }, { label: "With Notes", value: entries.filter(e => e.notes).length }].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "10px 14px", borderRight: i < 3 ? `1px solid var(--c-border)` : "none", background: "var(--c-bg-stat)" }}>
              <div style={{ fontFamily: mono, fontSize: 18, color: "var(--c-accent)", fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontFamily: mono, fontSize: 9, color: "var(--c-text-subtle)", letterSpacing: "0.1em", marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: "14px 0 10px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entries…"
            style={{ background: "var(--c-bg-card)", border: `1px solid var(--c-border)`, padding: "6px 10px", fontFamily: serif, fontSize: 13, color: "var(--c-text)", outline: "none", flex: 1, minWidth: 160 }} />
          {allTags.map(t => <Tag key={t} label={t} active={filterTag === t} onClick={() => setFilterTag(p => p === t ? null : t)} />)}
          {filterTag && <button onClick={() => setFilterTag(null)} style={{ background: "none", border: "none", color: "var(--c-text-subtle)", fontFamily: mono, fontSize: 10, cursor: "pointer" }}>CLEAR FILTER</button>}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--c-text-subtle)", fontFamily: mono, fontSize: 11, letterSpacing: "0.12em" }}>LOADING ENTRIES…</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--c-text-subtle)", fontStyle: "italic" }}>No entries yet. Start logging your intake above.</div>
        ) : Object.entries(grouped).map(([date, group]) => (
          <div key={date} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 10px" }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: "var(--c-text-mid)", letterSpacing: "0.12em" }}>{date.toUpperCase()}</span>
              <div style={{ flex: 1, height: 1, background: "var(--c-border)" }} />
              <span style={{ fontFamily: mono, fontSize: 10, color: "var(--c-text-subtle)" }}>{group.length} {group.length === 1 ? "entry" : "entries"}</span>
            </div>
            {group.map(e => <EntryCard key={e.id} entry={e} careNotes={careNoteMap[e.id] || []} onDelete={handleDelete} />)}
          </div>
        ))}
      </div>

      {showForm     && <LogForm onAdd={handleAdd} onClose={() => setShowForm(false)} />}
      {showExport   && <ExportModal entries={entries} onClose={() => setShowExport(false)} />}
      {showCareTeam && <CareTeamPanel session={session} onClose={() => setShowCareTeam(false)} onLinksChanged={onLinksChanged} />}
      {showSettings && <SettingsPanel settings={settings} update={onUpdateSetting} onClose={() => setShowSettings(false)} />}
    </div>
  );
}

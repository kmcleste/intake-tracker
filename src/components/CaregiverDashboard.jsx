import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import SettingsPanel from "./SettingsPanel";

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

function Tag({ label }) {
  return <span style={{ display: "inline-flex", padding: "2px 8px", background: "var(--c-accent)", color: "var(--c-accent-lt)", border: "1px solid var(--c-accent-bdr)", borderRadius: 2, fontSize: 11, fontFamily: mono, letterSpacing: "0.04em" }}>{label}</span>;
}

function ReviewerNoteRow({ note, onToggle, onDelete }) {
  const [saving, setSaving] = useState(false);
  const toggle = async () => { setSaving(true); await onToggle(note); setSaving(false); };
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: `1px dashed var(--c-border-card)` }}>
      <div style={{ flex: 1, fontFamily: serif, fontSize: 13, color: "var(--c-text)", lineHeight: 1.6, fontStyle: "italic" }}>{note.note}</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
        <button onClick={toggle} disabled={saving} title={note.visible_to_patient ? "Visible to patient — click to hide" : "Hidden from patient — click to share"}
          style={{ background: note.visible_to_patient ? "var(--c-accent)" : "var(--c-bg-stat)", border: `1px solid ${note.visible_to_patient ? "var(--c-accent-bdr)" : "var(--c-border)"}`, color: note.visible_to_patient ? "var(--c-accent-lt)" : "var(--c-text-subtle)", fontFamily: mono, fontSize: 9, padding: "3px 7px", cursor: saving ? "not-allowed" : "pointer", letterSpacing: "0.08em" }}>
          {note.visible_to_patient ? "SHARED" : "HIDDEN"}
        </button>
        <button onClick={() => onDelete(note.id)} style={{ background: "none", border: "none", color: "var(--c-err-bdr)", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "2px 4px" }}>×</button>
      </div>
    </div>
  );
}

function EntryCard({ entry, notes, onNoteAdded, onNoteToggled, onNoteDeleted }) {
  const [expanded, setExpanded] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [adding, setAdding]     = useState(false);

  const handleAddNote = async () => {
    if (!noteText.trim() || adding) return;
    setAdding(true); await onNoteAdded(entry, noteText.trim()); setNoteText(""); setAdding(false);
  };

  return (
    <div style={{ background: "var(--c-bg-card)", border: `1px solid var(--c-border-card)`, borderLeft: "3px solid var(--c-accent-mid)", marginBottom: 10 }}>
      <div style={{ padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }} onClick={() => setExpanded(!expanded)}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontFamily: mono, fontSize: 11, color: "var(--c-text-subtle)", letterSpacing: "0.08em" }}>{formatTime(entry.timestamp)}</span>
            <span style={{ padding: "1px 7px", background: "var(--c-accent)", color: "var(--c-accent-lt)", fontSize: 10, fontFamily: mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{entry.meal}</span>
            {notes.length > 0 && <span style={{ fontFamily: mono, fontSize: 9, color: "var(--c-text-warm)", letterSpacing: "0.08em" }}>{notes.length} NOTE{notes.length > 1 ? "S" : ""}</span>}
          </div>
          <div style={{ fontFamily: serif, fontSize: 14, color: "var(--c-text)", lineHeight: 1.5 }}>{entry.foods}</div>
          {entry.tags.length > 0 && <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>{entry.tags.map(t => <Tag key={t} label={t} />)}</div>}
        </div>
        <span style={{ color: "var(--c-text-subtle)", fontSize: 16, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s", marginLeft: 12 }}>▾</span>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 14px", borderTop: `1px dashed var(--c-border-card)` }}>
          {entry.notes && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-text-subtle)", letterSpacing: "0.1em", marginBottom: 4, textTransform: "uppercase" }}>Patient's Notes</div>
              <div style={{ fontFamily: serif, fontSize: 13, color: "var(--c-text)", lineHeight: 1.7, fontStyle: "italic", background: "var(--c-bg-note)", padding: "8px 12px", borderLeft: `2px solid var(--c-border)` }}>{entry.notes}</div>
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-text-warm)", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>
              Your Reviewer Notes
              <span style={{ marginLeft: 8, color: "var(--c-text-subtle)", fontWeight: 400 }}>— toggle SHARED to make visible to patient</span>
            </div>
            {notes.length === 0 && <div style={{ fontFamily: serif, fontSize: 12, color: "var(--c-text-subtle)", fontStyle: "italic", marginBottom: 8 }}>No notes yet.</div>}
            {notes.map(n => <ReviewerNoteRow key={n.id} note={n} onToggle={onNoteToggled} onDelete={onNoteDeleted} />)}
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a clinical observation…" rows={2}
                style={{ flex: 1, background: "var(--c-bg-card)", border: `1px solid var(--c-border)`, padding: "7px 9px", fontFamily: serif, fontSize: 13, color: "var(--c-text)", outline: "none", resize: "vertical", fontStyle: "italic" }} />
              <button onClick={handleAddNote} disabled={!noteText.trim() || adding}
                style={{ background: noteText.trim() && !adding ? "var(--c-accent)" : "var(--c-border)", border: "none", padding: "0 14px", fontFamily: mono, fontSize: 10, color: noteText.trim() && !adding ? "var(--c-accent-lt)" : "var(--c-text-subtle)", cursor: noteText.trim() && !adding ? "pointer" : "not-allowed", letterSpacing: "0.08em", alignSelf: "flex-end", height: 34 }}>
                ADD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CaregiverDashboard({ session, link, settings, onUpdateSetting, onBack }) {
  const [entries, setEntries]   = useState([]);
  const [noteMap, setNoteMap]   = useState({});
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [{ data: ents }, { data: notes }] = await Promise.all([
        supabase.from("entries").select("*").eq("user_id", link.patient_id).order("timestamp", { ascending: false }),
        supabase.from("caregiver_notes").select("*").eq("caregiver_id", session.user.id).eq("patient_id", link.patient_id),
      ]);
      setEntries(ents || []);
      const map = {};
      (notes || []).forEach(n => { if (!map[n.entry_id]) map[n.entry_id] = []; map[n.entry_id].push(n); });
      setNoteMap(map); setLoading(false);
    };
    load();
  }, [link, session.user.id]);

  const handleNoteAdded = async (entry, text) => {
    const { data } = await supabase.from("caregiver_notes").insert({ entry_id: entry.id, caregiver_id: session.user.id, patient_id: link.patient_id, note: text, visible_to_patient: false }).select().single();
    if (data) setNoteMap(prev => ({ ...prev, [entry.id]: [...(prev[entry.id] || []), data] }));
  };
  const handleNoteToggled = async (note) => {
    const updated = { ...note, visible_to_patient: !note.visible_to_patient };
    await supabase.from("caregiver_notes").update({ visible_to_patient: updated.visible_to_patient }).eq("id", note.id);
    setNoteMap(prev => ({ ...prev, [note.entry_id]: prev[note.entry_id].map(n => n.id === note.id ? updated : n) }));
  };
  const handleNoteDeleted = async (noteId) => {
    await supabase.from("caregiver_notes").delete().eq("id", noteId);
    setNoteMap(prev => { const n = { ...prev }; for (const k in n) n[k] = n[k].filter(x => x.id !== noteId); return n; });
  };

  const filtered = entries.filter(e => !search || e.foods.toLowerCase().includes(search.toLowerCase()) || e.notes.toLowerCase().includes(search.toLowerCase()));
  const grouped = groupByDate(filtered);

  return (
    <div style={{ minHeight: "100vh", background: "var(--c-bg)", fontFamily: serif }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 16px 60px" }}>
        <div style={{ padding: "32px 0 24px", borderBottom: `2px solid var(--c-accent)` }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-accent-mid)", letterSpacing: "0.2em", marginBottom: 6 }}>CAREGIVER VIEW</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, color: "var(--c-text)", fontWeight: 400 }}>Reviewing Journal</h1>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--c-text-muted)", fontStyle: "italic" }}>{link.patient_email}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowSettings(true)} style={{ background: "none", border: `1px solid var(--c-border)`, color: "var(--c-text-subtle)", padding: "8px 14px", fontFamily: mono, fontSize: 10, cursor: "pointer", letterSpacing: "0.1em" }}>SETTINGS</button>
              <button onClick={onBack} style={{ background: "none", border: `1px solid var(--c-border)`, color: "var(--c-text-subtle)", padding: "8px 14px", fontFamily: mono, fontSize: 10, cursor: "pointer", letterSpacing: "0.1em" }}>← MY JOURNAL</button>
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 0 10px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entries…"
            style={{ background: "var(--c-bg-card)", border: `1px solid var(--c-border)`, padding: "6px 10px", fontFamily: serif, fontSize: 13, color: "var(--c-text)", outline: "none", width: "100%", boxSizing: "border-box" }} />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--c-text-subtle)", fontFamily: mono, fontSize: 11, letterSpacing: "0.12em" }}>LOADING…</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--c-text-subtle)", fontStyle: "italic" }}>No entries found.</div>
        ) : Object.entries(grouped).map(([date, group]) => (
          <div key={date} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 10px" }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: "var(--c-text-mid)", letterSpacing: "0.12em" }}>{date.toUpperCase()}</span>
              <div style={{ flex: 1, height: 1, background: "var(--c-border)" }} />
              <span style={{ fontFamily: mono, fontSize: 10, color: "var(--c-text-subtle)" }}>{group.length} {group.length === 1 ? "entry" : "entries"}</span>
            </div>
            {group.map(e => <EntryCard key={e.id} entry={e} notes={noteMap[e.id] || []} onNoteAdded={handleNoteAdded} onNoteToggled={handleNoteToggled} onNoteDeleted={handleNoteDeleted} />)}
          </div>
        ))}
      </div>
      {showSettings && <SettingsPanel settings={settings} update={onUpdateSetting} onClose={() => setShowSettings(false)} />}
    </div>
  );
}

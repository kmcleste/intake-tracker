import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import SettingsPanel from "./SettingsPanel";

const mono = "var(--c-font-mono)";
const serif = "var(--c-font-serif)";
const MEAL_TYPES = ["Breakfast", "Morning Snack", "Lunch", "Afternoon Snack", "Dinner", "Evening Snack", "Other"];
const SYMPTOM_OPTIONS = ["fatigue", "brain fog", "confusion", "headache", "nausea", "dizziness", "anxiety", "irritability", "memory lapse", "difficulty concentrating", "tremors"];
const WELLBEING = { 1: "very poor", 2: "poor", 3: "fair", 4: "good", 5: "very good" };

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

function SymptomChip({ label, active, onClick }) {
  return <span onClick={onClick} style={{ display: "inline-flex", padding: "2px 8px", background: active ? "var(--c-accent)" : "var(--c-bg-stat)", color: active ? "var(--c-accent-lt)" : "var(--c-text-mid)", border: `1px solid ${active ? "var(--c-accent-bdr)" : "var(--c-border)"}`, borderRadius: 2, fontSize: 11, fontFamily: mono, letterSpacing: "0.04em", cursor: "pointer", userSelect: "none" }}>{label}</span>;
}

function CaregiverLogForm({ session, link, onClose, onEntryAdded }) {
  const [meal, setMeal]         = useState("Breakfast");
  const [foods, setFoods]       = useState("");
  const [notes, setNotes]       = useState("");
  const [wellbeing, setWellbeing] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);

  const toggleSymptom = s => setSymptoms(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const handleSubmit = async () => {
    if (!foods.trim() || saving) return;
    setSaving(true); setError(null);
    const { data, error: err } = await supabase.from("entries").insert({
      user_id: link.patient_id,
      logged_by: session.user.id,
      timestamp: new Date().toISOString(),
      meal, foods: foods.trim(), notes: notes.trim(), tags: [],
      wellbeing: wellbeing ?? null,
      symptoms: symptoms ?? []
    }).select().single();
    if (err) { setError(err.message); setSaving(false); return; }
    onEntryAdded(data);
    onClose();
  };

  const input = { width: "100%", background: "var(--c-bg-card)", border: `1px solid var(--c-border)`, padding: "8px 10px", fontFamily: serif, fontSize: 13, color: "var(--c-text)", outline: "none", boxSizing: "border-box", resize: "vertical" };
  const lbl   = { display: "block", fontFamily: mono, fontSize: 10, color: "var(--c-text-subtle)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 5 };
  const ok = foods.trim() && !saving;

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--c-overlay)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
      <div style={{ background: "var(--c-bg-panel)", border: `1px solid var(--c-border)`, width: "min(580px, 95vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: `4px 4px 0 var(--c-shadow)` }}>
        <div style={{ background: "var(--c-accent)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-accent-mid)", letterSpacing: "0.14em" }}>LOG ON BEHALF OF PATIENT</div>
            <div style={{ fontFamily: serif, fontSize: 16, color: "var(--c-accent-hd)", marginTop: 2 }}>New entry for {link.patient_email}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--c-accent-mid)", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
          {error && <div style={{ background: "var(--c-bg-error)", border: `1px solid var(--c-err-bdr)`, padding: "9px 12px", fontFamily: mono, fontSize: 11, color: "var(--c-err-text-dk)" }}>{error}</div>}
          <div><label style={lbl}>Meal / Occasion</label><select value={meal} onChange={e => setMeal(e.target.value)} style={{ ...input, cursor: "pointer" }}>{MEAL_TYPES.map(m => <option key={m}>{m}</option>)}</select></div>
          <div><label style={lbl}>Foods & Beverages</label><textarea value={foods} onChange={e => setFoods(e.target.value)} placeholder="Describe what the patient ate and drank…" rows={3} style={{ ...input, lineHeight: 1.6 }} autoFocus /></div>
          <div>
            <label style={lbl}>Wellbeing <span style={{ opacity: 0.6, fontWeight: 400 }}>(optional)</span></label>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setWellbeing(p => p === n ? null : n)}
                  style={{ flex: 1, padding: "7px 2px", textAlign: "center", fontFamily: mono, fontSize: 10, cursor: "pointer", border: `1px solid ${wellbeing === n ? "var(--c-accent-bdr)" : "var(--c-border)"}`, background: wellbeing === n ? "var(--c-accent)" : "var(--c-bg-stat)", color: wellbeing === n ? "var(--c-accent-lt)" : "var(--c-text-mid)", letterSpacing: "0.04em", lineHeight: 1.4 }}>
                  {n}<br /><span style={{ fontSize: 8, opacity: 0.75 }}>{["", "POOR", "LOW", "FAIR", "GOOD", "GREAT"][n]}</span>
                </button>
              ))}
            </div>
            {wellbeing && <div style={{ fontFamily: serif, fontSize: 12, color: "var(--c-text-warm)", fontStyle: "italic", marginTop: 5 }}>Feeling {WELLBEING[wellbeing]}</div>}
          </div>
          <div>
            <label style={lbl}>Symptoms <span style={{ opacity: 0.6, fontWeight: 400 }}>(optional)</span></label>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {SYMPTOM_OPTIONS.map(s => <SymptomChip key={s} label={s} active={symptoms.includes(s)} onClick={() => toggleSymptom(s)} />)}
            </div>
          </div>
          <div><label style={lbl}>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything else observed — timing, reactions, context…" rows={4} style={{ ...input, lineHeight: 1.7, fontStyle: "italic" }} /></div>
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontFamily: mono, fontSize: 11, color: "var(--c-text-subtle)", letterSpacing: "0.08em" }}>{formatTime(entry.timestamp)}</span>
            <span style={{ padding: "1px 7px", background: "var(--c-accent)", color: "var(--c-accent-lt)", fontSize: 10, fontFamily: mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{entry.meal}</span>
            {entry.wellbeing && <span style={{ fontFamily: mono, fontSize: 9, color: "var(--c-text-warm)", letterSpacing: "0.08em" }}>FEELING {WELLBEING[entry.wellbeing].toUpperCase()}</span>}
            {entry.symptoms?.length > 0 && <span style={{ fontFamily: mono, fontSize: 9, color: "var(--c-text-subtle)", letterSpacing: "0.06em" }}>{entry.symptoms.length} SYMPTOM{entry.symptoms.length > 1 ? "S" : ""}</span>}
            {notes.length > 0 && <span style={{ fontFamily: mono, fontSize: 9, color: "var(--c-text-warm)", letterSpacing: "0.08em" }}>{notes.length} NOTE{notes.length > 1 ? "S" : ""}</span>}
            {entry.photo_url && <span style={{ fontFamily: mono, fontSize: 9, color: "var(--c-text-subtle)", letterSpacing: "0.08em" }}>PHOTO</span>}
            {entry.logged_by && entry.logged_by !== entry.user_id && <span style={{ fontFamily: mono, fontSize: 9, color: "var(--c-text-warm)", letterSpacing: "0.08em", border: `1px solid var(--c-text-warm)`, padding: "1px 5px" }}>LOGGED BY YOU</span>}
          </div>
          <div style={{ fontFamily: serif, fontSize: 14, color: "var(--c-text)", lineHeight: 1.5 }}>{entry.foods}</div>
          {entry.tags.length > 0 && <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>{entry.tags.map(t => <Tag key={t} label={t} />)}</div>}
        </div>
        <span style={{ color: "var(--c-text-subtle)", fontSize: 16, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s", marginLeft: 12 }}>▾</span>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 14px", borderTop: `1px dashed var(--c-border-card)` }}>
          {entry.photo_url && (
            <div style={{ marginTop: 10 }}>
              <img src={entry.photo_url} alt="meal" style={{ maxWidth: "100%", maxHeight: 260, display: "block", border: `1px solid var(--c-border-card)` }} />
            </div>
          )}
          {(entry.wellbeing || entry.symptoms?.length > 0) && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-text-subtle)", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase" }}>Wellbeing & Symptoms</div>
              <div style={{ background: "var(--c-bg-note)", padding: "8px 12px", borderLeft: `2px solid var(--c-border)` }}>
                {entry.wellbeing && <div style={{ fontFamily: mono, fontSize: 11, color: "var(--c-text-warm)", letterSpacing: "0.06em", marginBottom: entry.symptoms?.length > 0 ? 6 : 0 }}>Feeling {WELLBEING[entry.wellbeing]} ({entry.wellbeing}/5)</div>}
                {entry.symptoms?.length > 0 && <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{entry.symptoms.map(s => <span key={s} style={{ display: "inline-flex", padding: "2px 8px", background: "var(--c-accent)", color: "var(--c-accent-lt)", border: "1px solid var(--c-accent-bdr)", fontSize: 11, fontFamily: mono, letterSpacing: "0.04em" }}>{s}</span>)}</div>}
              </div>
            </div>
          )}
          {entry.notes && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-text-subtle)", letterSpacing: "0.1em", marginBottom: 4, textTransform: "uppercase" }}>Notes</div>
              <div style={{ fontFamily: serif, fontSize: 13, color: "var(--c-text)", lineHeight: 1.7, fontStyle: "italic", background: "var(--c-bg-note)", padding: "8px 12px", borderLeft: `2px solid var(--c-border)` }}>{entry.notes}</div>
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-text-warm)", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>
              Your Observations
              <span style={{ marginLeft: 8, color: "var(--c-text-subtle)", fontWeight: 400 }}>— toggle SHARED to make visible</span>
            </div>
            {notes.length === 0 && <div style={{ fontFamily: serif, fontSize: 12, color: "var(--c-text-subtle)", fontStyle: "italic", marginBottom: 8 }}>No notes yet.</div>}
            {notes.map(n => <ReviewerNoteRow key={n.id} note={n} onToggle={onNoteToggled} onDelete={onNoteDeleted} />)}
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add an observation…" rows={2}
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
  const [showLogForm, setShowLogForm]   = useState(false);

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
          <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-accent-mid)", letterSpacing: "0.2em", marginBottom: 6 }}>CARE TEAM VIEW</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, color: "var(--c-text)", fontWeight: 400 }}>Reviewing Journal</h1>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--c-text-muted)", fontStyle: "italic" }}>{link.patient_email}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowLogForm(true)} style={{ background: "var(--c-accent)", border: "none", color: "var(--c-accent-lt)", padding: "8px 14px", fontFamily: mono, fontSize: 10, cursor: "pointer", letterSpacing: "0.1em" }}>+ LOG ENTRY</button>
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
      {showLogForm && <CaregiverLogForm session={session} link={link} onClose={() => setShowLogForm(false)} onEntryAdded={entry => setEntries(prev => [entry, ...prev])} />}
    </div>
  );
}

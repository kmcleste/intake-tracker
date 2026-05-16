import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const MEAL_TYPES = ["Breakfast", "Morning Snack", "Lunch", "Afternoon Snack", "Dinner", "Evening Snack", "Other"];
const COMMON_TAGS = ["dairy-free", "gluten-free", "high-fiber", "high-fat", "high-sugar", "alcohol", "caffeine", "processed", "raw", "cooked"];

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function groupByDate(entries) {
  const groups = {};
  [...entries]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .forEach((e) => {
      const key = formatDate(e.timestamp);
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
  return groups;
}

function Tag({ label, onRemove, onClick, active }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        background: active ? "#2a3d2e" : "#e8e4db",
        color: active ? "#c8dca9" : "#4a4a3a",
        border: `1px solid ${active ? "#4a6b3a" : "#c8c4b4"}`,
        borderRadius: 2,
        fontSize: 11,
        fontFamily: "'Courier New', monospace",
        letterSpacing: "0.04em",
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
      }}
    >
      {label}
      {onRemove && (
        <span
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{ marginLeft: 2, cursor: "pointer", opacity: 0.6, fontWeight: 700 }}
        >
          ×
        </span>
      )}
    </span>
  );
}

function EntryCard({ entry, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(entry.id);
  };

  return (
    <div
      style={{
        background: "#faf8f3",
        border: "1px solid #ddd9cc",
        borderLeft: "3px solid #7a9e6a",
        marginBottom: 10,
        opacity: deleting ? 0.5 : 1,
        transition: "box-shadow 0.15s, opacity 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "2px 2px 0 #ddd9cc"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      <div
        style={{ padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Courier New', monospace", fontSize: 11, color: "#7a7a6a", letterSpacing: "0.08em" }}>
              {formatTime(entry.timestamp)}
            </span>
            <span style={{
              padding: "1px 7px",
              background: "#2a3d2e",
              color: "#c8dca9",
              fontSize: 10,
              fontFamily: "'Courier New', monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}>
              {entry.meal}
            </span>
          </div>
          <div style={{ fontFamily: "'Georgia', serif", fontSize: 14, color: "#2a2a1e", lineHeight: 1.5 }}>
            {entry.foods}
          </div>
          {entry.tags.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
              {entry.tags.map(t => <Tag key={t} label={t} active />)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 12 }}>
          {entry.notes && (
            <span style={{ fontFamily: "'Courier New', monospace", fontSize: 10, color: "#9a9a7a", letterSpacing: "0.06em" }}>
              NOTE ↓
            </span>
          )}
          <span style={{ color: "#9a9a7a", fontSize: 16, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
            ▾
          </span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px dashed #ddd9cc" }}>
          {entry.notes && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 10, color: "#7a7a6a", letterSpacing: "0.1em", marginBottom: 4, textTransform: "uppercase" }}>
                Clinical Notes
              </div>
              <div style={{ fontFamily: "'Georgia', serif", fontSize: 13, color: "#3a3a2a", lineHeight: 1.7, fontStyle: "italic", background: "#f3f0e8", padding: "8px 12px", borderLeft: "2px solid #c8c4b4" }}>
                {entry.notes}
              </div>
            </div>
          )}
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ background: "none", border: "1px solid #d4a0a0", color: "#a06060", fontFamily: "'Courier New', monospace", fontSize: 10, padding: "3px 10px", cursor: deleting ? "not-allowed" : "pointer", letterSpacing: "0.08em" }}
            >
              REMOVE ENTRY
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LogForm({ onAdd, onClose }) {
  const [meal, setMeal] = useState("Breakfast");
  const [foods, setFoods] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState([]);
  const [customTag, setCustomTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const foodsRef = useRef();

  useEffect(() => { foodsRef.current?.focus(); }, []);

  const toggleTag = (t) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleAddCustomTag = () => {
    const t = customTag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setCustomTag("");
  };

  const handleSubmit = async () => {
    if (!foods.trim() || saving) return;
    setSaving(true);
    setError(null);
    const err = await onAdd({ meal, foods: foods.trim(), notes: notes.trim(), tags });
    if (err) {
      setError(err);
      setSaving(false);
    } else {
      onClose();
    }
  };

  const inputStyle = {
    width: "100%",
    background: "#faf8f3",
    border: "1px solid #c8c4b4",
    padding: "8px 10px",
    fontFamily: "'Georgia', serif",
    fontSize: 13,
    color: "#2a2a1e",
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
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

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(20,20,14,0.55)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(2px)",
    }}>
      <div style={{
        background: "#f5f2ea",
        border: "1px solid #c8c4b4",
        width: "min(580px, 95vw)",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "4px 4px 0 #c0bba8",
      }}>
        <div style={{ background: "#2a3d2e", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: 10, color: "#7a9a6a", letterSpacing: "0.14em" }}>NEW ENTRY</div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 16, color: "#e8f0de", marginTop: 2 }}>Log Food Intake</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#7a9a6a", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
          {error && (
            <div style={{ background: "#f5e8e8", border: "1px solid #c8a0a0", padding: "9px 12px", fontFamily: "'Courier New', monospace", fontSize: 11, color: "#6a2a2a" }}>
              {error}
            </div>
          )}

          <div>
            <label style={labelStyle}>Meal / Occasion</label>
            <select value={meal} onChange={e => setMeal(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {MEAL_TYPES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Foods & Beverages</label>
            <textarea
              ref={foodsRef}
              value={foods}
              onChange={e => setFoods(e.target.value)}
              placeholder="Describe what you ate and drank, including preparation methods if relevant…"
              rows={3}
              style={{ ...inputStyle, lineHeight: 1.6 }}
            />
          </div>

          <div>
            <label style={labelStyle}>Properties / Flags</label>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
              {COMMON_TAGS.map(t => (
                <Tag key={t} label={t} active={tags.includes(t)} onClick={() => toggleTag(t)} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={customTag}
                onChange={e => setCustomTag(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddCustomTag()}
                placeholder="custom tag…"
                style={{ ...inputStyle, flex: 1, padding: "5px 8px" }}
              />
              <button
                onClick={handleAddCustomTag}
                style={{ background: "#e8e4db", border: "1px solid #c8c4b4", padding: "5px 12px", fontFamily: "'Courier New', monospace", fontSize: 10, cursor: "pointer", color: "#4a4a3a", letterSpacing: "0.08em" }}
              >
                ADD
              </button>
            </div>
            {tags.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                {tags.map(t => <Tag key={t} label={t} active onRemove={() => setTags(prev => prev.filter(x => x !== t))} />)}
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Clinical / Observational Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any symptoms, reactions, timing of effects, how you felt before or after…"
              rows={4}
              style={{ ...inputStyle, lineHeight: 1.7, fontStyle: "italic" }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            <button
              onClick={onClose}
              style={{ background: "none", border: "1px solid #c8c4b4", padding: "8px 18px", fontFamily: "'Courier New', monospace", fontSize: 11, color: "#7a7a6a", cursor: "pointer", letterSpacing: "0.08em" }}
            >
              CANCEL
            </button>
            <button
              onClick={handleSubmit}
              disabled={!foods.trim() || saving}
              style={{
                background: foods.trim() && !saving ? "#2a3d2e" : "#c8c4b4",
                border: "none",
                padding: "8px 22px",
                fontFamily: "'Courier New', monospace",
                fontSize: 11,
                color: foods.trim() && !saving ? "#c8dca9" : "#8a8a7a",
                cursor: foods.trim() && !saving ? "pointer" : "not-allowed",
                letterSpacing: "0.1em",
                transition: "background 0.15s",
              }}
            >
              {saving ? "SAVING…" : "LOG ENTRY →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportModal({ entries, onClose }) {
  const text = Object.entries(groupByDate(entries)).map(([date, group]) => {
    return `=== ${date} ===\n` + group.map(e =>
      `[${formatTime(e.timestamp)}] ${e.meal.toUpperCase()}\n` +
      `Foods: ${e.foods}\n` +
      (e.tags.length ? `Tags: ${e.tags.join(", ")}\n` : "") +
      (e.notes ? `Notes: ${e.notes}\n` : "")
    ).join("\n") + "\n";
  }).join("\n");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,20,14,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#f5f2ea", border: "1px solid #c8c4b4", width: "min(560px, 95vw)", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "4px 4px 0 #c0bba8" }}>
        <div style={{ background: "#2a3d2e", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Georgia', serif", fontSize: 15, color: "#e8f0de" }}>Export Log</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#7a9a6a", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
        <textarea
          readOnly
          value={text}
          style={{ flex: 1, minHeight: 280, background: "#faf8f3", border: "none", borderBottom: "1px solid #c8c4b4", padding: 16, fontFamily: "'Courier New', monospace", fontSize: 12, color: "#2a2a1e", lineHeight: 1.7, resize: "none", outline: "none" }}
        />
        <div style={{ padding: 14, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={() => navigator.clipboard.writeText(text)}
            style={{ background: "#2a3d2e", border: "none", padding: "8px 18px", fontFamily: "'Courier New', monospace", fontSize: 11, color: "#c8dca9", cursor: "pointer", letterSpacing: "0.1em" }}
          >
            COPY TO CLIPBOARD
          </button>
          <button
            onClick={onClose}
            style={{ background: "none", border: "1px solid #c8c4b4", padding: "8px 16px", fontFamily: "'Courier New', monospace", fontSize: 11, color: "#7a7a6a", cursor: "pointer", letterSpacing: "0.08em" }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FoodLog({ session }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [filterTag, setFilterTag] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .order("timestamp", { ascending: false });

      if (!error) setEntries(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleAdd = async ({ meal, foods, notes, tags }) => {
    const { data, error } = await supabase
      .from("entries")
      .insert({
        user_id: session.user.id,
        timestamp: new Date().toISOString(),
        meal,
        foods,
        notes,
        tags,
        severity: null,
      })
      .select()
      .single();

    if (error) return error.message;
    setEntries(prev => [data, ...prev]);
    return null;
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (!error) setEntries(prev => prev.filter(e => e.id !== id));
  };

  const allTags = [...new Set(entries.flatMap(e => e.tags))];

  const filtered = entries.filter(e => {
    const matchTag = !filterTag || e.tags.includes(filterTag);
    const matchSearch = !search ||
      e.foods.toLowerCase().includes(search.toLowerCase()) ||
      e.notes.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  const grouped = groupByDate(filtered);

  return (
    <div style={{ minHeight: "100vh", background: "#edeae0", fontFamily: "'Georgia', serif" }}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
        opacity: 0.4,
      }} />

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 16px 60px", position: "relative", zIndex: 1 }}>
        <div style={{ padding: "32px 0 24px", borderBottom: "2px solid #2a3d2e" }}>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: 10, color: "#7a9a6a", letterSpacing: "0.2em", marginBottom: 6 }}>
            DIETARY INTAKE LOG — MEDICAL CORRELATION
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, color: "#1a1a0e", fontWeight: 400, lineHeight: 1.2 }}>
                Food & Symptom Journal
              </h1>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6a6a5a", fontStyle: "italic" }}>
                {session.user.email}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => supabase.auth.signOut()}
                style={{ background: "none", border: "1px solid #c8c4b4", color: "#7a7a6a", padding: "8px 14px", fontFamily: "'Courier New', monospace", fontSize: 10, cursor: "pointer", letterSpacing: "0.1em" }}
              >
                SIGN OUT
              </button>
              <button
                onClick={() => setShowExport(true)}
                style={{ background: "none", border: "1px solid #7a9a6a", color: "#2a3d2e", padding: "8px 14px", fontFamily: "'Courier New', monospace", fontSize: 10, cursor: "pointer", letterSpacing: "0.1em" }}
              >
                EXPORT
              </button>
              <button
                onClick={() => setShowForm(true)}
                style={{ background: "#2a3d2e", border: "none", color: "#c8dca9", padding: "8px 18px", fontFamily: "'Courier New', monospace", fontSize: 10, cursor: "pointer", letterSpacing: "0.1em" }}
              >
                + LOG ENTRY
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #c8c4b4", overflow: "hidden" }}>
          {[
            { label: "Total Entries", value: entries.length },
            { label: "Today", value: entries.filter(e => formatDate(e.timestamp) === "Today").length },
            { label: "Tagged", value: entries.filter(e => e.tags.length > 0).length },
            { label: "With Notes", value: entries.filter(e => e.notes).length },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "10px 14px", borderRight: i < 3 ? "1px solid #c8c4b4" : "none", background: "#f0ece0" }}>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 18, color: "#2a3d2e", fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 9, color: "#8a8a7a", letterSpacing: "0.1em", marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: "14px 0 10px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search entries…"
            style={{ background: "#faf8f3", border: "1px solid #c8c4b4", padding: "6px 10px", fontFamily: "'Georgia', serif", fontSize: 13, color: "#2a2a1e", outline: "none", flex: 1, minWidth: 160 }}
          />
          {allTags.map(t => (
            <Tag key={t} label={t} active={filterTag === t} onClick={() => setFilterTag(prev => prev === t ? null : t)} />
          ))}
          {filterTag && (
            <button onClick={() => setFilterTag(null)} style={{ background: "none", border: "none", color: "#9a9a7a", fontFamily: "'Courier New', monospace", fontSize: 10, cursor: "pointer" }}>
              CLEAR FILTER
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9a9a7a", fontFamily: "'Courier New', monospace", fontSize: 11, letterSpacing: "0.12em" }}>
            LOADING ENTRIES…
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9a9a7a", fontStyle: "italic" }}>
            No entries yet. Start logging your intake above.
          </div>
        ) : (
          Object.entries(grouped).map(([date, group]) => (
            <div key={date} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 10px" }}>
                <span style={{ fontFamily: "'Courier New', monospace", fontSize: 11, color: "#4a4a3a", letterSpacing: "0.12em" }}>
                  {date.toUpperCase()}
                </span>
                <div style={{ flex: 1, height: 1, background: "#c8c4b4" }} />
                <span style={{ fontFamily: "'Courier New', monospace", fontSize: 10, color: "#9a9a7a" }}>
                  {group.length} {group.length === 1 ? "entry" : "entries"}
                </span>
              </div>
              {group.map(e => <EntryCard key={e.id} entry={e} onDelete={handleDelete} />)}
            </div>
          ))
        )}
      </div>

      {showForm && <LogForm onAdd={handleAdd} onClose={() => setShowForm(false)} />}
      {showExport && <ExportModal entries={entries} onClose={() => setShowExport(false)} />}
    </div>
  );
}

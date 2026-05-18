import { useState } from "react";

const MEAL_TYPES = ["Breakfast", "Morning Snack", "Lunch", "Afternoon Snack", "Dinner", "Evening Snack", "Other"];
const COMMON_TAGS = ["dairy-free", "gluten-free", "high-fiber", "high-fat", "high-sugar", "alcohol", "caffeine", "processed", "raw", "cooked"];
const SYMPTOM_OPTIONS = ["fatigue", "brain fog", "confusion", "headache", "nausea", "dizziness", "anxiety", "irritability", "memory lapse", "difficulty concentrating", "tremors"];
const WELLBEING = { 1: "very poor", 2: "poor", 3: "fair", 4: "good", 5: "very good" };

const mono = "var(--c-font-mono)";
const serif = "var(--c-font-serif)";

function Tag({ label, onRemove, onClick, active }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        background: active ? "var(--c-accent)" : "var(--c-tag-bg)",
        color: active ? "var(--c-accent-lt)" : "var(--c-text-mid)",
        border: `1px solid ${active ? "var(--c-accent-bdr)" : "var(--c-border)"}`,
        borderRadius: 2,
        fontSize: 11,
        fontFamily: mono,
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

export default function EditEntryModal({ entry, onSave, onClose }) {
  const [meal, setMeal] = useState(entry.meal ?? "Breakfast");
  const [foods, setFoods] = useState(entry.foods ?? "");
  const [notes, setNotes] = useState(entry.notes ?? "");
  const [tags, setTags] = useState(entry.tags ?? []);
  const [customTag, setCustomTag] = useState("");
  const [wellbeing, setWellbeing] = useState(entry.wellbeing ?? null);
  const [symptoms, setSymptoms] = useState(entry.symptoms ?? []);

  const toggleTag = (t) => setTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);
  const toggleSymptom = (s) => setSymptoms((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  const addCustomTag = () => {
    const t = customTag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
    setCustomTag("");
  };

  const ok = foods.trim().length > 0;

  const handleSave = () => {
    if (!ok) return;
    onSave({
      meal,
      foods: foods.trim(),
      notes: notes.trim(),
      tags,
      wellbeing,
      symptoms,
    });
  };

  const input = {
    width: "100%",
    background: "var(--c-bg-card)",
    border: `1px solid var(--c-border)`,
    padding: "8px 10px",
    fontFamily: serif,
    fontSize: 13,
    color: "var(--c-text)",
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
  };
  const lbl = {
    display: "block",
    fontFamily: mono,
    fontSize: 10,
    color: "var(--c-text-subtle)",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: 5,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--c-overlay)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          background: "var(--c-bg-panel)",
          border: `1px solid var(--c-border)`,
          width: "min(580px, 95vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: `4px 4px 0 var(--c-shadow)`,
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "var(--c-accent)",
            padding: "14px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontFamily: mono, fontSize: 10, color: "var(--c-accent-mid)", letterSpacing: "0.14em" }}>
              EDIT ENTRY
            </div>
            <div style={{ fontFamily: serif, fontSize: 16, color: "var(--c-accent-hd)", marginTop: 2 }}>
              Update your journal entry
            </div>
          </div>
          <button
            aria-label="×"
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--c-accent-mid)", fontSize: 20, cursor: "pointer" }}
          >
            ×
          </button>
        </div>

        {/* Form body */}
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Meal */}
          <div>
            <label style={lbl}>Meal / Occasion</label>
            <select
              value={meal}
              onChange={(e) => setMeal(e.target.value)}
              style={{ ...input, cursor: "pointer" }}
            >
              {MEAL_TYPES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>

          {/* Foods */}
          <div>
            <label style={lbl}>Foods &amp; Beverages</label>
            <textarea
              value={foods}
              onChange={(e) => setFoods(e.target.value)}
              placeholder="Describe what you ate and drank…"
              rows={3}
              style={{ ...input, lineHeight: 1.6 }}
            />
          </div>

          {/* Wellbeing */}
          <div>
            <label style={lbl}>
              How are you feeling?{" "}
              <span style={{ opacity: 0.6, fontWeight: 400 }}>(optional)</span>
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5].map((n) => {
                const isActive = wellbeing === n;
                return (
                  <button
                    key={n}
                    type="button"
                    data-active={isActive ? "true" : "false"}
                    onClick={() => setWellbeing((p) => (p === n ? null : n))}
                    style={{
                      flex: 1,
                      padding: "7px 2px",
                      textAlign: "center",
                      fontFamily: mono,
                      fontSize: 10,
                      cursor: "pointer",
                      border: `1px solid ${isActive ? "var(--c-accent-bdr)" : "var(--c-border)"}`,
                      background: isActive ? "var(--c-accent)" : "var(--c-bg-stat)",
                      color: isActive ? "var(--c-accent-lt)" : "var(--c-text-mid)",
                      letterSpacing: "0.04em",
                      lineHeight: 1.4,
                    }}
                  >
                    {n}
                    <br />
                    <span style={{ fontSize: 8, opacity: 0.75 }}>
                      {["", "POOR", "LOW", "FAIR", "GOOD", "GREAT"][n]}
                    </span>
                  </button>
                );
              })}
            </div>
            {wellbeing && (
              <div style={{ fontFamily: serif, fontSize: 12, color: "var(--c-text-warm)", fontStyle: "italic", marginTop: 5 }}>
                Feeling {WELLBEING[wellbeing]}
              </div>
            )}
          </div>

          {/* Symptoms */}
          <div>
            <label style={lbl}>
              Symptoms{" "}
              <span style={{ opacity: 0.6, fontWeight: 400 }}>(optional — select all that apply)</span>
            </label>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {SYMPTOM_OPTIONS.map((s) => (
                <Tag key={s} label={s} active={symptoms.includes(s)} onClick={() => toggleSymptom(s)} />
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={lbl}>Properties / Flags</label>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
              {COMMON_TAGS.map((t) => (
                <Tag key={t} label={t} active={tags.includes(t)} onClick={() => toggleTag(t)} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
                placeholder="custom tag…"
                style={{ ...input, flex: 1, padding: "5px 8px" }}
              />
              <button
                onClick={addCustomTag}
                style={{
                  background: "var(--c-tag-bg)",
                  border: `1px solid var(--c-border)`,
                  padding: "5px 12px",
                  fontFamily: mono,
                  fontSize: 10,
                  cursor: "pointer",
                  color: "var(--c-text-mid)",
                  letterSpacing: "0.08em",
                }}
              >
                ADD
              </button>
            </div>
            {tags.filter((t) => !COMMON_TAGS.includes(t)).length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                {tags.filter((t) => !COMMON_TAGS.includes(t)).map((t) => (
                  <Tag key={t} label={t} active onRemove={() => setTags((p) => p.filter((x) => x !== t))} />
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label style={lbl}>Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else you noticed — timing, how you felt, reactions…"
              rows={4}
              style={{ ...input, lineHeight: 1.7, fontStyle: "italic" }}
            />
          </div>

          {/* Footer buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            <button
              aria-label="Cancel"
              onClick={onClose}
              style={{
                background: "none",
                border: `1px solid var(--c-border)`,
                padding: "8px 18px",
                fontFamily: mono,
                fontSize: 11,
                color: "var(--c-text-subtle)",
                cursor: "pointer",
                letterSpacing: "0.08em",
              }}
            >
              CANCEL
            </button>
            <button
              aria-label="Save changes"
              onClick={handleSave}
              disabled={!ok}
              style={{
                background: ok ? "var(--c-accent)" : "var(--c-border)",
                border: "none",
                padding: "8px 22px",
                fontFamily: mono,
                fontSize: 11,
                color: ok ? "var(--c-accent-lt)" : "var(--c-text-subtle)",
                cursor: ok ? "pointer" : "not-allowed",
                letterSpacing: "0.1em",
              }}
            >
              SAVE CHANGES →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

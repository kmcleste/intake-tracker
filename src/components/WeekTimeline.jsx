export default function WeekTimeline({ entries }) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, padding: "0 0 6px", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--c-font-mono)", fontSize: 9, color: "var(--c-text-subtle)", letterSpacing: "0.12em" }}>7-DAY OVERVIEW</span>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center" }}>
          {[["#c97a7a", "low"], ["var(--c-text-warm)", "fair"], ["var(--c-accent-mid)", "good"]].map(([color, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
              <span style={{ fontFamily: "var(--c-font-mono)", fontSize: 8, color: "var(--c-text-subtle)" }}>{label}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ fontFamily: "var(--c-font-mono)", fontSize: 8, color: "#c97a7a" }}>Ns</span>
            <span style={{ fontFamily: "var(--c-font-mono)", fontSize: 8, color: "var(--c-text-subtle)" }}>symptoms</span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, padding: "12px 0", overflowX: "auto" }}>
        {days.map(day => {
          const dayStr = day.toISOString().slice(0, 10);
          const dayEntries = entries.filter(e => e.timestamp.slice(0, 10) === dayStr);
          const isToday = dayStr === new Date().toISOString().slice(0, 10);

          const wellbeingVals = dayEntries.map(e => e.wellbeing).filter(Boolean);
          const avgWellbeing = wellbeingVals.length ? Math.round(wellbeingVals.reduce((a, b) => a + b, 0) / wellbeingVals.length) : null;
          const symptomCount = dayEntries.reduce((n, e) => n + (e.symptoms?.length ?? 0), 0);

          const dotColor = !avgWellbeing ? "var(--c-border)" : avgWellbeing <= 2 ? "#c97a7a" : avgWellbeing === 3 ? "var(--c-text-warm)" : "var(--c-accent-mid)";

          return (
            <div key={dayStr} style={{
              flex: 1, minWidth: 40, display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, padding: "8px 4px",
              background: isToday ? "var(--c-bg-card)" : "transparent",
              border: `1px solid ${isToday ? "var(--c-border-card)" : "transparent"}`,
            }}>
              <div style={{ fontFamily: "var(--c-font-mono)", fontSize: 9, color: isToday ? "var(--c-accent-mid)" : "var(--c-text-subtle)", letterSpacing: "0.08em" }}>
                {day.toLocaleDateString([], { weekday: "short" }).toUpperCase()}
              </div>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
              {dayEntries.length > 0 && (
                <div style={{ fontFamily: "var(--c-font-mono)", fontSize: 9, color: "var(--c-text-subtle)" }}>
                  {dayEntries.length}
                </div>
              )}
              {symptomCount > 0 && (
                <div style={{ fontFamily: "var(--c-font-mono)", fontSize: 8, color: "#c97a7a", letterSpacing: "0.04em" }}>
                  {symptomCount}s
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

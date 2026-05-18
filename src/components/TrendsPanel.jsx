import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { getWellbeingTrend, getSymptomFrequency } from "../lib/chartData";

const mono = "var(--c-font-mono)";
const serif = "var(--c-font-serif)";

const lbl = {
  display: "block",
  fontFamily: mono,
  fontSize: 10,
  color: "var(--c-text-subtle)",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  marginBottom: 8,
};

export default function TrendsPanel({ entries, onClose }) {
  const [days, setDays] = useState(30);

  const trend = getWellbeingTrend(entries, days);
  const symptoms = getSymptomFrequency(entries);
  const hasData = trend.length > 0 || symptoms.length > 0;

  const chartData = trend.map(d => ({
    ...d,
    date: d.date.slice(5), // MM-DD
  }));
  const symptomData = symptoms.slice(0, 8);

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
          border: "1px solid var(--c-border)",
          width: "min(640px, 95vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "4px 4px 0 var(--c-shadow)",
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
            <div
              style={{
                fontFamily: mono,
                fontSize: 10,
                color: "var(--c-accent-mid)",
                letterSpacing: "0.14em",
              }}
            >
              WELLNESS TRENDS
            </div>
            <div
              style={{
                fontFamily: serif,
                fontSize: 16,
                color: "var(--c-accent-hd)",
                marginTop: 2,
              }}
            >
              Activity Analysis
            </div>
          </div>
          <button
            aria-label="×"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--c-accent-mid)",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Day range */}
          <div style={{ display: "flex", gap: 6 }}>
            {[7, 30].map((d) => {
              const active = days === d;
              return (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  data-active={active ? "true" : "false"}
                  style={{
                    padding: "5px 14px",
                    fontFamily: mono,
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                    border: `1px solid ${active ? "var(--c-accent-bdr)" : "var(--c-border)"}`,
                    background: active ? "var(--c-accent)" : "var(--c-bg-stat)",
                    color: active ? "var(--c-accent-lt)" : "var(--c-text-mid)",
                  }}
                >
                  {d} DAYS
                </button>
              );
            })}
          </div>

          {!hasData ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                fontFamily: serif,
                fontSize: 14,
                color: "var(--c-text-muted)",
                fontStyle: "italic",
              }}
            >
              No data to show yet. Log entries with wellbeing ratings and symptoms to see trends.
            </div>
          ) : (
            <>
              {/* Wellbeing trend */}
              <div>
                <label style={lbl}>Wellbeing over time</label>
                {trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontFamily: mono, fontSize: 10 }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        tick={{ fontFamily: mono, fontSize: 10 }}
                        tickLine={false}
                        width={24}
                      />
                      <Tooltip
                        formatter={(v) => [v.toFixed(1), "avg wellbeing"]}
                        labelStyle={{ fontFamily: mono, fontSize: 10 }}
                        contentStyle={{
                          fontFamily: mono,
                          fontSize: 11,
                          background: "var(--c-bg-panel)",
                          border: "1px solid var(--c-border)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="avg"
                        stroke="var(--c-accent-mid)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "var(--c-accent-mid)" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    style={{
                      fontFamily: serif,
                      fontSize: 13,
                      color: "var(--c-text-muted)",
                      fontStyle: "italic",
                      padding: "12px 0",
                    }}
                  >
                    No wellbeing ratings in this range.
                  </div>
                )}
              </div>

              {/* Symptom frequency */}
              {symptomData.length > 0 && (
                <div>
                  <label style={lbl}>Most common symptoms</label>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={symptomData} layout="vertical">
                      <XAxis
                        type="number"
                        tick={{ fontFamily: mono, fontSize: 10 }}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="symptom"
                        tick={{ fontFamily: mono, fontSize: 9 }}
                        tickLine={false}
                        width={110}
                      />
                      <Tooltip
                        formatter={(v) => [v, "occurrences"]}
                        contentStyle={{
                          fontFamily: mono,
                          fontSize: 11,
                          background: "var(--c-bg-panel)",
                          border: "1px solid var(--c-border)",
                        }}
                      />
                      <Bar dataKey="count" fill="var(--c-accent-mid)" radius={[0, 2, 2, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

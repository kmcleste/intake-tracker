import { describe, it, expect } from "vitest";
import {
  getWellbeingTrend,
  getSymptomFrequency,
  getMealSymptomCorrelation,
  getWellbeingByTag,
  getDailyStats,
} from "../../lib/chartData";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(overrides = {}) {
  return {
    id: Math.random().toString(36),
    user_id: "u1",
    timestamp: new Date().toISOString(),
    meal: "Breakfast",
    foods: "oatmeal",
    notes: "",
    tags: [],
    wellbeing: null,
    symptoms: [],
    photo_url: null,
    created_at: new Date().toISOString(),
    deleted_at: null,
    ...overrides,
  };
}

/** Returns an ISO timestamp for `daysAgo` days before "today" (noon UTC). */
function daysAgoISO(daysAgo) {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString();
}

/** Returns a YYYY-MM-DD string for `daysAgo` days before today (UTC). */
function dateStr(daysAgo = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

// ===========================================================================
// getWellbeingTrend
// ===========================================================================

describe("getWellbeingTrend", () => {
  it("returns empty array for empty entries", () => {
    expect(getWellbeingTrend([])).toEqual([]);
  });

  it("excludes entries with null wellbeing", () => {
    const entries = [makeEntry({ wellbeing: null, timestamp: daysAgoISO(1) })];
    expect(getWellbeingTrend(entries)).toEqual([]);
  });

  it("aggregates multiple entries on the same day", () => {
    const ts = daysAgoISO(1);
    const entries = [
      makeEntry({ wellbeing: 3, timestamp: ts }),
      makeEntry({ wellbeing: 5, timestamp: ts }),
    ];
    const result = getWellbeingTrend(entries);
    expect(result).toHaveLength(1);
    expect(result[0].avg).toBeCloseTo(4.0);
    expect(result[0].count).toBe(2);
    expect(result[0].date).toBe(dateStr(1));
  });

  it("returns results sorted ascending by date", () => {
    const entries = [
      makeEntry({ wellbeing: 4, timestamp: daysAgoISO(3) }),
      makeEntry({ wellbeing: 2, timestamp: daysAgoISO(1) }),
      makeEntry({ wellbeing: 5, timestamp: daysAgoISO(5) }),
    ];
    const result = getWellbeingTrend(entries);
    expect(result).toHaveLength(3);
    expect(result[0].date).toBe(dateStr(5));
    expect(result[1].date).toBe(dateStr(3));
    expect(result[2].date).toBe(dateStr(1));
  });

  it("excludes entries older than `days` days", () => {
    const entries = [
      makeEntry({ wellbeing: 3, timestamp: daysAgoISO(31) }), // outside default 30
      makeEntry({ wellbeing: 4, timestamp: daysAgoISO(29) }), // inside
    ];
    const result = getWellbeingTrend(entries, 30);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe(dateStr(29));
  });

  it("includes entry exactly at the `days` boundary", () => {
    const entries = [makeEntry({ wellbeing: 3, timestamp: daysAgoISO(30) })];
    const result = getWellbeingTrend(entries, 30);
    expect(result).toHaveLength(1);
  });

  it("respects custom `days` parameter", () => {
    const entries = [
      makeEntry({ wellbeing: 5, timestamp: daysAgoISO(6) }),
      makeEntry({ wellbeing: 2, timestamp: daysAgoISO(8) }), // outside 7-day window
    ];
    const result = getWellbeingTrend(entries, 7);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe(dateStr(6));
  });

  it("handles single entry correctly", () => {
    const entries = [makeEntry({ wellbeing: 4, timestamp: daysAgoISO(2) })];
    const result = getWellbeingTrend(entries);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ avg: 4, count: 1, date: dateStr(2) });
  });

  it("mixed: some entries with wellbeing, some without", () => {
    const ts = daysAgoISO(1);
    const entries = [
      makeEntry({ wellbeing: 4, timestamp: ts }),
      makeEntry({ wellbeing: null, timestamp: ts }),
      makeEntry({ wellbeing: 2, timestamp: ts }),
    ];
    const result = getWellbeingTrend(entries);
    expect(result).toHaveLength(1);
    expect(result[0].avg).toBeCloseTo(3.0);
    expect(result[0].count).toBe(2);
  });
});

// ===========================================================================
// getSymptomFrequency
// ===========================================================================

describe("getSymptomFrequency", () => {
  it("returns empty array for empty entries", () => {
    expect(getSymptomFrequency([])).toEqual([]);
  });

  it("returns empty array when all entries have empty symptoms", () => {
    const entries = [makeEntry({ symptoms: [] }), makeEntry({ symptoms: [] })];
    expect(getSymptomFrequency(entries)).toEqual([]);
  });

  it("counts symptoms correctly", () => {
    const entries = [
      makeEntry({ symptoms: ["fatigue", "headache"] }),
      makeEntry({ symptoms: ["fatigue"] }),
    ];
    const result = getSymptomFrequency(entries);
    const fatigue = result.find((r) => r.symptom === "fatigue");
    const headache = result.find((r) => r.symptom === "headache");
    expect(fatigue.count).toBe(2);
    expect(headache.count).toBe(1);
  });

  it("sorts by count descending", () => {
    const entries = [
      makeEntry({ symptoms: ["nausea"] }),
      makeEntry({ symptoms: ["fatigue", "fatigue"] }), // two of same in one entry counts as 2
      makeEntry({ symptoms: ["fatigue"] }),
    ];
    const result = getSymptomFrequency(entries);
    expect(result[0].symptom).toBe("fatigue");
    expect(result[0].count).toBeGreaterThan(result[1].count);
  });

  it("only returns symptoms with count > 0", () => {
    const entries = [makeEntry({ symptoms: ["headache"] })];
    const result = getSymptomFrequency(entries);
    result.forEach((r) => expect(r.count).toBeGreaterThan(0));
  });

  it("flattens symptoms from multiple entries", () => {
    const entries = [
      makeEntry({ symptoms: ["fatigue", "nausea"] }),
      makeEntry({ symptoms: ["nausea", "dizziness"] }),
    ];
    const result = getSymptomFrequency(entries);
    const nausea = result.find((r) => r.symptom === "nausea");
    expect(nausea.count).toBe(2);
    expect(result).toHaveLength(3); // fatigue, nausea, dizziness
  });

  it("result items have symptom and count properties", () => {
    const entries = [makeEntry({ symptoms: ["anxiety"] })];
    const result = getSymptomFrequency(entries);
    expect(result[0]).toHaveProperty("symptom");
    expect(result[0]).toHaveProperty("count");
  });
});

// ===========================================================================
// getMealSymptomCorrelation
// ===========================================================================

describe("getMealSymptomCorrelation", () => {
  it("returns empty object for empty entries", () => {
    expect(getMealSymptomCorrelation([])).toEqual({});
  });

  it("includes only meal types that appear at least once", () => {
    const entries = [
      makeEntry({ meal: "Breakfast", symptoms: ["fatigue"] }),
      makeEntry({ meal: "Lunch", symptoms: [] }),
    ];
    const result = getMealSymptomCorrelation(entries);
    expect(Object.keys(result)).toContain("Breakfast");
    expect(Object.keys(result)).toContain("Lunch");
    expect(Object.keys(result)).not.toContain("Dinner");
  });

  it("calculates avg symptoms correctly", () => {
    const entries = [
      makeEntry({ meal: "Dinner", symptoms: ["fatigue", "headache"] }), // 2
      makeEntry({ meal: "Dinner", symptoms: ["nausea"] }), // 1
      makeEntry({ meal: "Dinner", symptoms: [] }), // 0
    ];
    const result = getMealSymptomCorrelation(entries);
    expect(result.Dinner.avgSymptoms).toBeCloseTo(1.0);
    expect(result.Dinner.entryCount).toBe(3);
  });

  it("handles single entry per meal", () => {
    const entries = [makeEntry({ meal: "Lunch", symptoms: ["anxiety", "fatigue"] })];
    const result = getMealSymptomCorrelation(entries);
    expect(result.Lunch.avgSymptoms).toBe(2);
    expect(result.Lunch.entryCount).toBe(1);
  });

  it("each meal value has avgSymptoms and entryCount", () => {
    const entries = [makeEntry({ meal: "Breakfast", symptoms: [] })];
    const result = getMealSymptomCorrelation(entries);
    expect(result.Breakfast).toHaveProperty("avgSymptoms");
    expect(result.Breakfast).toHaveProperty("entryCount");
  });

  it("handles all known meal types", () => {
    const meals = [
      "Breakfast", "Morning Snack", "Lunch", "Afternoon Snack",
      "Dinner", "Evening Snack", "Other",
    ];
    const entries = meals.map((meal) => makeEntry({ meal, symptoms: ["fatigue"] }));
    const result = getMealSymptomCorrelation(entries);
    meals.forEach((meal) => {
      expect(result[meal]).toBeDefined();
      expect(result[meal].avgSymptoms).toBe(1);
    });
  });
});

// ===========================================================================
// getWellbeingByTag
// ===========================================================================

describe("getWellbeingByTag", () => {
  it("returns empty array for empty entries", () => {
    expect(getWellbeingByTag([])).toEqual([]);
  });

  it("returns empty array when no entries have tags", () => {
    const entries = [makeEntry({ tags: [], wellbeing: 3 })];
    expect(getWellbeingByTag(entries)).toEqual([]);
  });

  it("excludes tags where no entry has a wellbeing value", () => {
    const entries = [makeEntry({ tags: ["dairy-free"], wellbeing: null })];
    expect(getWellbeingByTag(entries)).toEqual([]);
  });

  it("calculates avgWellbeing per tag", () => {
    const entries = [
      makeEntry({ tags: ["gluten-free"], wellbeing: 4 }),
      makeEntry({ tags: ["gluten-free"], wellbeing: 2 }),
    ];
    const result = getWellbeingByTag(entries);
    expect(result).toHaveLength(1);
    expect(result[0].tag).toBe("gluten-free");
    expect(result[0].avgWellbeing).toBeCloseTo(3.0);
    expect(result[0].entryCount).toBe(2);
  });

  it("sorts by avgWellbeing descending", () => {
    const entries = [
      makeEntry({ tags: ["low-sugar"], wellbeing: 2 }),
      makeEntry({ tags: ["dairy-free"], wellbeing: 5 }),
    ];
    const result = getWellbeingByTag(entries);
    expect(result[0].avgWellbeing).toBeGreaterThan(result[1].avgWellbeing);
    expect(result[0].tag).toBe("dairy-free");
  });

  it("only counts entries with wellbeing for avgWellbeing, but entryCount is entries with the tag", () => {
    const entries = [
      makeEntry({ tags: ["vegan"], wellbeing: 4 }),
      makeEntry({ tags: ["vegan"], wellbeing: null }),
    ];
    const result = getWellbeingByTag(entries);
    expect(result).toHaveLength(1);
    expect(result[0].tag).toBe("vegan");
    expect(result[0].avgWellbeing).toBe(4);
    expect(result[0].entryCount).toBe(2); // total entries with this tag
  });

  it("handles multiple tags per entry", () => {
    const entries = [
      makeEntry({ tags: ["dairy-free", "gluten-free"], wellbeing: 5 }),
      makeEntry({ tags: ["dairy-free"], wellbeing: 3 }),
    ];
    const result = getWellbeingByTag(entries);
    const dairyFree = result.find((r) => r.tag === "dairy-free");
    const glutenFree = result.find((r) => r.tag === "gluten-free");
    expect(dairyFree.avgWellbeing).toBeCloseTo(4.0);
    expect(glutenFree.avgWellbeing).toBe(5);
  });

  it("result items have tag, avgWellbeing, and entryCount", () => {
    const entries = [makeEntry({ tags: ["low-fat"], wellbeing: 3 })];
    const result = getWellbeingByTag(entries);
    expect(result[0]).toHaveProperty("tag");
    expect(result[0]).toHaveProperty("avgWellbeing");
    expect(result[0]).toHaveProperty("entryCount");
  });
});

// ===========================================================================
// getDailyStats
// ===========================================================================

describe("getDailyStats", () => {
  it("returns 14 entries by default (one per day)", () => {
    const result = getDailyStats([]);
    expect(result).toHaveLength(14);
  });

  it("returns `days` number of entries", () => {
    expect(getDailyStats([], 7)).toHaveLength(7);
    expect(getDailyStats([], 30)).toHaveLength(30);
  });

  it("days with no entries have entryCount 0 and avgWellbeing null", () => {
    const result = getDailyStats([]);
    result.forEach((day) => {
      expect(day.entryCount).toBe(0);
      expect(day.avgWellbeing).toBeNull();
      expect(day.totalSymptoms).toBe(0);
    });
  });

  it("includes today as the last entry", () => {
    const result = getDailyStats([]);
    expect(result[result.length - 1].date).toBe(dateStr(0));
  });

  it("includes the oldest date as the first entry", () => {
    const result = getDailyStats([], 7);
    expect(result[0].date).toBe(dateStr(6));
  });

  it("result is sorted ascending by date", () => {
    const result = getDailyStats([], 5);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].date > result[i - 1].date).toBe(true);
    }
  });

  it("counts entries on the correct day", () => {
    const entries = [
      makeEntry({ timestamp: daysAgoISO(0) }),
      makeEntry({ timestamp: daysAgoISO(0) }),
      makeEntry({ timestamp: daysAgoISO(1) }),
    ];
    const result = getDailyStats(entries, 7);
    const today = result.find((d) => d.date === dateStr(0));
    const yesterday = result.find((d) => d.date === dateStr(1));
    expect(today.entryCount).toBe(2);
    expect(yesterday.entryCount).toBe(1);
  });

  it("calculates avgWellbeing per day (null when no wellbeing data)", () => {
    const entries = [
      makeEntry({ timestamp: daysAgoISO(1), wellbeing: 4 }),
      makeEntry({ timestamp: daysAgoISO(1), wellbeing: 2 }),
      makeEntry({ timestamp: daysAgoISO(2), wellbeing: null }),
    ];
    const result = getDailyStats(entries, 7);
    const day1 = result.find((d) => d.date === dateStr(1));
    const day2 = result.find((d) => d.date === dateStr(2));
    expect(day1.avgWellbeing).toBeCloseTo(3.0);
    expect(day2.avgWellbeing).toBeNull();
  });

  it("sums totalSymptoms per day", () => {
    const entries = [
      makeEntry({ timestamp: daysAgoISO(0), symptoms: ["fatigue", "nausea"] }),
      makeEntry({ timestamp: daysAgoISO(0), symptoms: ["headache"] }),
    ];
    const result = getDailyStats(entries, 7);
    const today = result.find((d) => d.date === dateStr(0));
    expect(today.totalSymptoms).toBe(3);
  });

  it("excludes entries older than `days` days", () => {
    const entries = [
      makeEntry({ timestamp: daysAgoISO(15) }), // outside 14-day window
    ];
    const result = getDailyStats(entries, 14);
    result.forEach((d) => expect(d.entryCount).toBe(0));
  });

  it("each result item has date, entryCount, avgWellbeing, totalSymptoms", () => {
    const result = getDailyStats([]);
    result.forEach((d) => {
      expect(d).toHaveProperty("date");
      expect(d).toHaveProperty("entryCount");
      expect(d).toHaveProperty("avgWellbeing");
      expect(d).toHaveProperty("totalSymptoms");
    });
  });

  it("entries exactly at boundary are included", () => {
    const entries = [makeEntry({ timestamp: daysAgoISO(13) })];
    const result = getDailyStats(entries, 14);
    const boundaryDay = result.find((d) => d.date === dateStr(13));
    expect(boundaryDay.entryCount).toBe(1);
  });
});

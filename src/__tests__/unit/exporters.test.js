import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  filterByDateRange,
  formatAsText,
  formatAsCSV,
  formatAsJSON,
  getExportFilename,
} from "../../lib/exporters";

function makeEntry(overrides = {}) {
  return {
    id: "test-id-1",
    user_id: "u1",
    timestamp: "2026-05-18T14:32:00.000Z",
    meal: "Lunch",
    foods: "chicken, rice",
    notes: "",
    tags: [],
    wellbeing: null,
    symptoms: [],
    photo_url: null,
    created_at: "2026-05-18T14:32:00.000Z",
    deleted_at: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// filterByDateRange
// ---------------------------------------------------------------------------
describe("filterByDateRange", () => {
  it("returns entries within the date range", () => {
    const entries = [
      makeEntry({ timestamp: "2026-05-17T10:00:00.000Z" }),
      makeEntry({ timestamp: "2026-05-18T14:32:00.000Z" }),
      makeEntry({ timestamp: "2026-05-19T08:00:00.000Z" }),
    ];
    const result = filterByDateRange(entries, "2026-05-17", "2026-05-19");
    expect(result).toHaveLength(3);
  });

  it("includes entries exactly on the from boundary date", () => {
    const entries = [
      makeEntry({ timestamp: "2026-05-17T00:00:00.000Z" }),
      makeEntry({ timestamp: "2026-05-16T23:59:59.999Z" }),
    ];
    const result = filterByDateRange(entries, "2026-05-17", "2026-05-20");
    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBe("2026-05-17T00:00:00.000Z");
  });

  it("includes entries exactly on the to boundary date", () => {
    const entries = [
      makeEntry({ timestamp: "2026-05-20T23:59:59.999Z" }),
      makeEntry({ timestamp: "2026-05-21T00:00:00.000Z" }),
    ];
    const result = filterByDateRange(entries, "2026-05-17", "2026-05-20");
    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBe("2026-05-20T23:59:59.999Z");
  });

  it("excludes entries outside the range", () => {
    const entries = [
      makeEntry({ id: "a", timestamp: "2026-05-10T10:00:00.000Z" }),
      makeEntry({ id: "b", timestamp: "2026-05-25T10:00:00.000Z" }),
    ];
    const result = filterByDateRange(entries, "2026-05-17", "2026-05-20");
    expect(result).toHaveLength(0);
  });

  it("returns empty array when given empty input", () => {
    expect(filterByDateRange([], "2026-05-17", "2026-05-20")).toEqual([]);
  });

  it("returns single-day range correctly (from === to)", () => {
    const entries = [
      makeEntry({ id: "a", timestamp: "2026-05-18T08:00:00.000Z" }),
      makeEntry({ id: "b", timestamp: "2026-05-18T20:00:00.000Z" }),
      makeEntry({ id: "c", timestamp: "2026-05-19T00:00:00.000Z" }),
    ];
    const result = filterByDateRange(entries, "2026-05-18", "2026-05-18");
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// formatAsText
// ---------------------------------------------------------------------------
describe("formatAsText", () => {
  it("returns empty string for empty entries", () => {
    expect(formatAsText([])).toBe("");
  });

  it("produces correct header for a single entry", () => {
    const entries = [makeEntry()];
    const text = formatAsText(entries);
    expect(text).toContain("=== 2026-05-18 ===");
  });

  it("includes the meal type in the entry line", () => {
    const entries = [makeEntry({ meal: "Lunch" })];
    const text = formatAsText(entries);
    expect(text).toContain("Lunch");
  });

  it("includes the time in [HH:MM] format", () => {
    const entries = [makeEntry({ timestamp: "2026-05-18T14:32:00.000Z" })];
    const text = formatAsText(entries);
    // The time portion should appear in [HH:MM] brackets
    expect(text).toMatch(/\[\d{2}:\d{2}\]/);
  });

  it("includes Foods line", () => {
    const entries = [makeEntry({ foods: "chicken, rice" })];
    const text = formatAsText(entries);
    expect(text).toContain("Foods: chicken, rice");
  });

  it("omits Wellbeing line when wellbeing is null", () => {
    const entries = [makeEntry({ wellbeing: null })];
    const text = formatAsText(entries);
    expect(text).not.toContain("Wellbeing:");
  });

  it("includes Wellbeing line with correct label when wellbeing is set", () => {
    const entries = [makeEntry({ wellbeing: 5 })];
    const text = formatAsText(entries);
    expect(text).toContain("Wellbeing: Very Good (5/5)");
  });

  it("maps all wellbeing labels correctly", () => {
    const labelMap = {
      1: "Very Low",
      2: "Low",
      3: "Fair",
      4: "Good",
      5: "Very Good",
    };
    for (const [score, label] of Object.entries(labelMap)) {
      const entries = [makeEntry({ wellbeing: Number(score) })];
      const text = formatAsText(entries);
      expect(text).toContain(`Wellbeing: ${label} (${score}/5)`);
    }
  });

  it("omits Symptoms line when symptoms array is empty", () => {
    const entries = [makeEntry({ symptoms: [] })];
    const text = formatAsText(entries);
    expect(text).not.toContain("Symptoms:");
  });

  it("includes Symptoms line when symptoms are present", () => {
    const entries = [makeEntry({ symptoms: ["fatigue", "headache"] })];
    const text = formatAsText(entries);
    expect(text).toContain("Symptoms: fatigue, headache");
  });

  it("omits Tags line when tags array is empty", () => {
    const entries = [makeEntry({ tags: [] })];
    const text = formatAsText(entries);
    expect(text).not.toContain("Tags:");
  });

  it("includes Tags line when tags are present", () => {
    const entries = [makeEntry({ tags: ["dairy-free", "gluten-free"] })];
    const text = formatAsText(entries);
    expect(text).toContain("Tags: dairy-free, gluten-free");
  });

  it("omits Notes line when notes is empty string", () => {
    const entries = [makeEntry({ notes: "" })];
    const text = formatAsText(entries);
    expect(text).not.toContain("Notes:");
  });

  it("includes Notes line when notes is non-empty", () => {
    const entries = [makeEntry({ notes: "Felt bloated after" })];
    const text = formatAsText(entries);
    expect(text).toContain("Notes: Felt bloated after");
  });

  it("groups entries by date in descending order (newest date first)", () => {
    const entries = [
      makeEntry({ id: "a", timestamp: "2026-05-16T08:00:00.000Z" }),
      makeEntry({ id: "b", timestamp: "2026-05-18T14:00:00.000Z" }),
      makeEntry({ id: "c", timestamp: "2026-05-17T10:00:00.000Z" }),
    ];
    const text = formatAsText(entries);
    const idx18 = text.indexOf("2026-05-18");
    const idx17 = text.indexOf("2026-05-17");
    const idx16 = text.indexOf("2026-05-16");
    expect(idx18).toBeLessThan(idx17);
    expect(idx17).toBeLessThan(idx16);
  });

  it("produces separate date sections for entries on different dates", () => {
    const entries = [
      makeEntry({ id: "a", timestamp: "2026-05-18T08:00:00.000Z" }),
      makeEntry({ id: "b", timestamp: "2026-05-17T08:00:00.000Z" }),
    ];
    const text = formatAsText(entries);
    expect(text).toContain("=== 2026-05-18 ===");
    expect(text).toContain("=== 2026-05-17 ===");
  });

  it("includes all optional fields when all are present", () => {
    const entries = [
      makeEntry({
        wellbeing: 4,
        symptoms: ["nausea"],
        tags: ["caffeine"],
        notes: "Test note",
      }),
    ];
    const text = formatAsText(entries);
    expect(text).toContain("Wellbeing: Good (4/5)");
    expect(text).toContain("Symptoms: nausea");
    expect(text).toContain("Tags: caffeine");
    expect(text).toContain("Notes: Test note");
  });
});

// ---------------------------------------------------------------------------
// formatAsCSV
// ---------------------------------------------------------------------------
describe("formatAsCSV", () => {
  it("returns only the header row for empty entries", () => {
    const csv = formatAsCSV([]);
    expect(csv.trim()).toBe("Date,Time,Meal,Foods,Wellbeing,WellbeingScore,Symptoms,Tags,Notes");
  });

  it("includes the correct header row", () => {
    const csv = formatAsCSV([makeEntry()]);
    const header = csv.split("\n")[0];
    expect(header).toBe("Date,Time,Meal,Foods,Wellbeing,WellbeingScore,Symptoms,Tags,Notes");
  });

  it("produces one data row per entry", () => {
    const entries = [
      makeEntry({ id: "a" }),
      makeEntry({ id: "b", timestamp: "2026-05-17T08:00:00.000Z" }),
    ];
    const csv = formatAsCSV(entries);
    const lines = csv.trim().split("\n");
    // header + 2 data rows
    expect(lines).toHaveLength(3);
  });

  it("sorts entries by timestamp ascending", () => {
    const entries = [
      makeEntry({ id: "a", timestamp: "2026-05-18T14:00:00.000Z", foods: "lunch item" }),
      makeEntry({ id: "b", timestamp: "2026-05-17T08:00:00.000Z", foods: "breakfast item" }),
    ];
    const csv = formatAsCSV(entries);
    const lines = csv.split("\n");
    // second row (first data row) should be the earlier entry
    expect(lines[1]).toContain("2026-05-17");
    expect(lines[2]).toContain("2026-05-18");
  });

  it("quotes fields containing commas", () => {
    const entries = [makeEntry({ foods: "chicken, rice, broccoli" })];
    const csv = formatAsCSV(entries);
    expect(csv).toContain('"chicken, rice, broccoli"');
  });

  it("joins multi-value symptoms with '; '", () => {
    const entries = [makeEntry({ symptoms: ["fatigue", "headache"] })];
    const csv = formatAsCSV(entries);
    expect(csv).toContain("fatigue; headache");
  });

  it("joins multi-value tags with '; '", () => {
    const entries = [makeEntry({ tags: ["dairy-free", "gluten-free"] })];
    const csv = formatAsCSV(entries);
    expect(csv).toContain("dairy-free; gluten-free");
  });

  it("uses empty string (not 'null' or 'undefined') for missing wellbeing", () => {
    const entries = [makeEntry({ wellbeing: null })];
    const csv = formatAsCSV(entries);
    // Should not contain literal "null" or "undefined" in the output
    expect(csv).not.toContain("null");
    expect(csv).not.toContain("undefined");
  });

  it("uses empty string for empty symptoms", () => {
    const entries = [makeEntry({ symptoms: [] })];
    const csv = formatAsCSV(entries);
    const dataRow = csv.split("\n")[1];
    // Symptoms field should be empty, not "null"
    expect(dataRow).not.toMatch(/null/);
  });

  it("uses empty string for empty tags", () => {
    const entries = [makeEntry({ tags: [] })];
    const csv = formatAsCSV(entries);
    expect(csv).not.toContain("null");
    expect(csv).not.toContain("undefined");
  });

  it("uses empty string for empty notes", () => {
    const entries = [makeEntry({ notes: "" })];
    const csv = formatAsCSV(entries);
    expect(csv).not.toContain("null");
    expect(csv).not.toContain("undefined");
  });

  it("includes wellbeing label and score when wellbeing is set", () => {
    const entries = [makeEntry({ wellbeing: 3 })];
    const csv = formatAsCSV(entries);
    expect(csv).toContain("Fair");
    expect(csv).toContain("3");
  });

  it("includes date in YYYY-MM-DD format", () => {
    const entries = [makeEntry({ timestamp: "2026-05-18T14:32:00.000Z" })];
    const csv = formatAsCSV(entries);
    expect(csv).toContain("2026-05-18");
  });
});

// ---------------------------------------------------------------------------
// formatAsJSON
// ---------------------------------------------------------------------------
describe("formatAsJSON", () => {
  it("produces valid JSON", () => {
    const entries = [makeEntry()];
    const json = formatAsJSON(entries);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("returns a JSON array", () => {
    const entries = [makeEntry()];
    const parsed = JSON.parse(formatAsJSON(entries));
    expect(Array.isArray(parsed)).toBe(true);
  });

  it("returns empty JSON array for empty entries", () => {
    const parsed = JSON.parse(formatAsJSON([]));
    expect(parsed).toEqual([]);
  });

  it("includes the correct fields on each entry", () => {
    const entries = [makeEntry()];
    const [item] = JSON.parse(formatAsJSON(entries));
    expect(item).toHaveProperty("id");
    expect(item).toHaveProperty("timestamp");
    expect(item).toHaveProperty("meal");
    expect(item).toHaveProperty("foods");
    expect(item).toHaveProperty("wellbeing");
    expect(item).toHaveProperty("symptoms");
    expect(item).toHaveProperty("tags");
    expect(item).toHaveProperty("notes");
  });

  it("excludes user_id from each entry", () => {
    const entries = [makeEntry()];
    const [item] = JSON.parse(formatAsJSON(entries));
    expect(item).not.toHaveProperty("user_id");
  });

  it("excludes deleted_at from each entry", () => {
    const entries = [makeEntry()];
    const [item] = JSON.parse(formatAsJSON(entries));
    expect(item).not.toHaveProperty("deleted_at");
  });

  it("excludes photo_url from each entry", () => {
    const entries = [makeEntry()];
    const [item] = JSON.parse(formatAsJSON(entries));
    expect(item).not.toHaveProperty("photo_url");
  });

  it("excludes created_at from each entry", () => {
    const entries = [makeEntry()];
    const [item] = JSON.parse(formatAsJSON(entries));
    expect(item).not.toHaveProperty("created_at");
  });

  it("preserves wellbeing: null (does not omit it)", () => {
    const entries = [makeEntry({ wellbeing: null })];
    const [item] = JSON.parse(formatAsJSON(entries));
    expect(item.wellbeing).toBeNull();
    // Key must exist even though value is null
    expect(Object.keys(item)).toContain("wellbeing");
  });

  it("preserves wellbeing numeric value", () => {
    const entries = [makeEntry({ wellbeing: 4 })];
    const [item] = JSON.parse(formatAsJSON(entries));
    expect(item.wellbeing).toBe(4);
  });

  it("is pretty-printed with 2-space indentation", () => {
    const entries = [makeEntry()];
    const json = formatAsJSON(entries);
    // A pretty-printed JSON array starts with "[\n  {"
    expect(json).toMatch(/^\[\n {2}\{/);
  });

  it("preserves all required field values accurately", () => {
    const entry = makeEntry({
      id: "abc-123",
      timestamp: "2026-05-18T14:32:00.000Z",
      meal: "Dinner",
      foods: "pasta",
      notes: "very good",
      tags: ["gluten-free"],
      symptoms: ["fatigue"],
      wellbeing: 5,
    });
    const [item] = JSON.parse(formatAsJSON([entry]));
    expect(item.id).toBe("abc-123");
    expect(item.timestamp).toBe("2026-05-18T14:32:00.000Z");
    expect(item.meal).toBe("Dinner");
    expect(item.foods).toBe("pasta");
    expect(item.notes).toBe("very good");
    expect(item.tags).toEqual(["gluten-free"]);
    expect(item.symptoms).toEqual(["fatigue"]);
    expect(item.wellbeing).toBe(5);
  });

  it("only has exactly the 8 expected fields (no extras)", () => {
    const entries = [makeEntry()];
    const [item] = JSON.parse(formatAsJSON(entries));
    const keys = Object.keys(item).sort();
    expect(keys).toEqual(
      ["foods", "id", "meal", "notes", "symptoms", "tags", "timestamp", "wellbeing"].sort()
    );
  });
});

// ---------------------------------------------------------------------------
// getExportFilename
// ---------------------------------------------------------------------------
describe("getExportFilename", () => {
  beforeEach(() => {
    // Fix today's date to 2026-05-18 local time
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-18T12:00:00.000"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a filename ending with .txt for ext='txt'", () => {
    const name = getExportFilename("txt");
    expect(name).toMatch(/\.txt$/);
  });

  it("returns a filename ending with .csv for ext='csv'", () => {
    const name = getExportFilename("csv");
    expect(name).toMatch(/\.csv$/);
  });

  it("returns a filename ending with .json for ext='json'", () => {
    const name = getExportFilename("json");
    expect(name).toMatch(/\.json$/);
  });

  it("starts with 'food-journal-' prefix", () => {
    const name = getExportFilename("txt");
    expect(name).toMatch(/^food-journal-/);
  });

  it("uses today's date in YYYY-MM-DD format", () => {
    const name = getExportFilename("txt");
    expect(name).toContain("2026-05-18");
  });

  it("has correct full format: food-journal-YYYY-MM-DD.ext", () => {
    expect(getExportFilename("txt")).toBe("food-journal-2026-05-18.txt");
    expect(getExportFilename("csv")).toBe("food-journal-2026-05-18.csv");
    expect(getExportFilename("json")).toBe("food-journal-2026-05-18.json");
  });
});

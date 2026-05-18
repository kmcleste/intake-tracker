/**
 * Pure-function data-export formatter layer for intake-tracker.
 * No React, no imports from other app files, no external libraries.
 */

// Wellbeing label map used in exports (title-cased, matches task spec)
const WELLBEING_LABELS = {
  1: "Very Low",
  2: "Low",
  3: "Fair",
  4: "Good",
  5: "Very Good",
};

// ---------------------------------------------------------------------------
// filterByDateRange
// ---------------------------------------------------------------------------

/**
 * Filter entries to an inclusive date range.
 * @param {object[]} entries
 * @param {string} from  "YYYY-MM-DD"
 * @param {string} to    "YYYY-MM-DD"
 * @returns {object[]}
 */
export function filterByDateRange(entries, from, to) {
  return entries.filter((e) => {
    const d = e.timestamp.slice(0, 10);
    return d >= from && d <= to;
  });
}

// ---------------------------------------------------------------------------
// formatAsText
// ---------------------------------------------------------------------------

/**
 * Format a two-digit number (pad with leading zero).
 */
function pad2(n) {
  return String(n).padStart(2, "0");
}

/**
 * Extract UTC time string "HH:MM" from an ISO timestamp.
 */
function utcTime(iso) {
  const d = new Date(iso);
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

/**
 * Format entries as a plain-text human-readable log.
 * Dates are YYYY-MM-DD (from timestamp.slice(0,10)).
 * Groups by date descending (newest first).
 * @param {object[]} entries
 * @returns {string}
 */
export function formatAsText(entries) {
  if (!entries.length) return "";

  // Sort descending by timestamp, group by date string
  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  const groups = {};
  const dateOrder = [];
  for (const e of sorted) {
    const date = e.timestamp.slice(0, 10);
    if (!groups[date]) {
      groups[date] = [];
      dateOrder.push(date);
    }
    groups[date].push(e);
  }

  return dateOrder
    .map((date) => {
      const header = `=== ${date} ===\n`;
      const body = groups[date]
        .map((e) => {
          let lines = `[${utcTime(e.timestamp)}] ${e.meal}\n`;
          lines += `Foods: ${e.foods}\n`;
          if (e.wellbeing) {
            lines += `Wellbeing: ${WELLBEING_LABELS[e.wellbeing]} (${e.wellbeing}/5)\n`;
          }
          if (e.symptoms && e.symptoms.length > 0) {
            lines += `Symptoms: ${e.symptoms.join(", ")}\n`;
          }
          if (e.tags && e.tags.length > 0) {
            lines += `Tags: ${e.tags.join(", ")}\n`;
          }
          if (e.notes) {
            lines += `Notes: ${e.notes}\n`;
          }
          return lines;
        })
        .join("\n");
      return header + body + "\n";
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// formatAsCSV
// ---------------------------------------------------------------------------

/**
 * Escape a CSV field: wrap in quotes if it contains a comma, quote, or newline.
 */
function csvField(value) {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Format entries as CSV.
 * Header: Date,Time,Meal,Foods,Wellbeing,WellbeingScore,Symptoms,Tags,Notes
 * Sorted by timestamp ascending.
 * @param {object[]} entries
 * @returns {string}
 */
export function formatAsCSV(entries) {
  const header = "Date,Time,Meal,Foods,Wellbeing,WellbeingScore,Symptoms,Tags,Notes";

  if (!entries.length) return header;

  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  const rows = sorted.map((e) => {
    const date = e.timestamp.slice(0, 10);
    const time = utcTime(e.timestamp);
    const wellbeingLabel = e.wellbeing ? WELLBEING_LABELS[e.wellbeing] : "";
    const wellbeingScore = e.wellbeing != null && e.wellbeing !== null && e.wellbeing !== undefined
      ? String(e.wellbeing)
      : "";
    const symptoms = e.symptoms && e.symptoms.length > 0 ? e.symptoms.join("; ") : "";
    const tags = e.tags && e.tags.length > 0 ? e.tags.join("; ") : "";
    const notes = e.notes || "";

    return [
      csvField(date),
      csvField(time),
      csvField(e.meal),
      csvField(e.foods),
      csvField(wellbeingLabel),
      csvField(wellbeingScore),
      csvField(symptoms),
      csvField(tags),
      csvField(notes),
    ].join(",");
  });

  return [header, ...rows].join("\n");
}

// ---------------------------------------------------------------------------
// formatAsJSON
// ---------------------------------------------------------------------------

/**
 * Format entries as a pretty-printed JSON string.
 * Only includes: id, timestamp, meal, foods, wellbeing, symptoms, tags, notes
 * @param {object[]} entries
 * @returns {string}
 */
export function formatAsJSON(entries) {
  const cleaned = entries.map(({ id, timestamp, meal, foods, wellbeing, symptoms, tags, notes }) => ({
    id,
    timestamp,
    meal,
    foods,
    wellbeing: wellbeing !== undefined ? wellbeing : null,
    symptoms,
    tags,
    notes,
  }));
  return JSON.stringify(cleaned, null, 2);
}

// ---------------------------------------------------------------------------
// getExportFilename
// ---------------------------------------------------------------------------

/**
 * Returns the default export filename using today's local date.
 * Format: "food-journal-YYYY-MM-DD.{ext}"
 * @param {"txt"|"csv"|"json"} ext
 * @returns {string}
 */
export function getExportFilename(ext) {
  const now = new Date();
  const year = now.getFullYear();
  const month = pad2(now.getMonth() + 1);
  const day = pad2(now.getDate());
  return `food-journal-${year}-${month}-${day}.${ext}`;
}

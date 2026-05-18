/**
 * chartData.js — Pure chart data aggregation functions.
 * No React, no imports from other app files, no external libraries.
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Returns "YYYY-MM-DD" from an ISO timestamp string (UTC date). */
function isoToDateStr(isoString) {
  return isoString.slice(0, 10);
}

/**
 * Returns the "YYYY-MM-DD" string for a date that is `daysAgo` calendar days
 * before today (UTC).
 */
function utcDateStr(daysAgo = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns the UTC start-of-day (midnight) as a Date object for a date that is
 * `daysAgo` calendar days before today.
 */
function utcStartOfDay(daysAgo = 0) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

/**
 * Returns [{date: "YYYY-MM-DD", avg: number, count: number}, ...]
 * sorted ascending by date.
 * Only includes days that have at least one entry WITH a wellbeing value.
 * `days` = how many days back from today to include (default 30).
 */
export function getWellbeingTrend(entries, days = 30) {
  const cutoff = utcStartOfDay(days);

  // Bucket entries by date string, keeping only those with wellbeing values
  // and within the date window.
  const byDate = {};
  for (const entry of entries) {
    if (entry.wellbeing == null) continue;
    const entryDate = new Date(entry.timestamp);
    if (entryDate < cutoff) continue;

    const dateKey = isoToDateStr(entry.timestamp);
    if (!byDate[dateKey]) {
      byDate[dateKey] = { sum: 0, count: 0 };
    }
    byDate[dateKey].sum += entry.wellbeing;
    byDate[dateKey].count += 1;
  }

  return Object.entries(byDate)
    .map(([date, { sum, count }]) => ({ date, avg: sum / count, count }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * Returns [{symptom: string, count: number}, ...] sorted by count desc.
 * Flattens all symptoms arrays across all entries.
 * Only returns symptoms with count > 0.
 */
export function getSymptomFrequency(entries) {
  const counts = {};
  for (const entry of entries) {
    for (const symptom of entry.symptoms) {
      counts[symptom] = (counts[symptom] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([symptom, count]) => ({ symptom, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Returns {MealType: {avgSymptoms: number, entryCount: number}, ...}
 * For each meal type, calculates avg symptoms.length across entries of that type.
 * Only includes meal types that appear at least once.
 */
export function getMealSymptomCorrelation(entries) {
  const byMeal = {};
  for (const entry of entries) {
    if (!byMeal[entry.meal]) {
      byMeal[entry.meal] = { totalSymptoms: 0, entryCount: 0 };
    }
    byMeal[entry.meal].totalSymptoms += entry.symptoms.length;
    byMeal[entry.meal].entryCount += 1;
  }

  const result = {};
  for (const [meal, { totalSymptoms, entryCount }] of Object.entries(byMeal)) {
    result[meal] = {
      avgSymptoms: totalSymptoms / entryCount,
      entryCount,
    };
  }
  return result;
}

/**
 * Returns [{tag: string, avgWellbeing: number, entryCount: number}, ...]
 * For each unique tag across all entries, calculates avg wellbeing for entries
 * that have that tag AND a wellbeing value.
 * Only includes tags where at least one entry with that tag also has a wellbeing value.
 * entryCount = total entries carrying that tag (with or without wellbeing).
 * Sorted by avgWellbeing desc.
 */
export function getWellbeingByTag(entries) {
  const byTag = {};

  for (const entry of entries) {
    for (const tag of entry.tags) {
      if (!byTag[tag]) {
        byTag[tag] = { wellbeingSum: 0, wellbeingCount: 0, entryCount: 0 };
      }
      byTag[tag].entryCount += 1;
      if (entry.wellbeing != null) {
        byTag[tag].wellbeingSum += entry.wellbeing;
        byTag[tag].wellbeingCount += 1;
      }
    }
  }

  return Object.entries(byTag)
    .filter(([, { wellbeingCount }]) => wellbeingCount > 0)
    .map(([tag, { wellbeingSum, wellbeingCount, entryCount }]) => ({
      tag,
      avgWellbeing: wellbeingSum / wellbeingCount,
      entryCount,
    }))
    .sort((a, b) => b.avgWellbeing - a.avgWellbeing);
}

/**
 * Returns [{date: "YYYY-MM-DD", entryCount: number, avgWellbeing: number|null, totalSymptoms: number}, ...]
 * One entry per calendar day over the last `days` days (includes days with 0 entries).
 * avgWellbeing is null for days with no wellbeing data.
 * Sorted ascending by date.
 */
export function getDailyStats(entries, days = 14) {
  // Build a map keyed by date string.
  const byDate = {};

  // Initialise all days in the window (oldest first).
  for (let i = days - 1; i >= 0; i--) {
    byDate[utcDateStr(i)] = {
      entryCount: 0,
      wellbeingSum: 0,
      wellbeingCount: 0,
      totalSymptoms: 0,
    };
  }

  const cutoff = utcStartOfDay(days - 1); // earliest day included

  for (const entry of entries) {
    const entryDate = new Date(entry.timestamp);
    // Only include entries within our window (cutoff day start through end of today).
    if (entryDate < cutoff) continue;

    const dateKey = isoToDateStr(entry.timestamp);
    if (!byDate[dateKey]) continue; // shouldn't happen, but guard anyway

    byDate[dateKey].entryCount += 1;
    byDate[dateKey].totalSymptoms += entry.symptoms.length;
    if (entry.wellbeing != null) {
      byDate[dateKey].wellbeingSum += entry.wellbeing;
      byDate[dateKey].wellbeingCount += 1;
    }
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, { entryCount, wellbeingSum, wellbeingCount, totalSymptoms }]) => ({
      date,
      entryCount,
      avgWellbeing: wellbeingCount > 0 ? wellbeingSum / wellbeingCount : null,
      totalSymptoms,
    }));
}

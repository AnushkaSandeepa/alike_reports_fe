// lib/chartData.js
export const monthKey = (y, m) =>
  `${y}-${String(m).padStart(2, "0")}`;

export function uniqueYears(rows) {
  return Array.from(new Set(rows.map(r => r.year))).sort((a,b)=>a-b);
}

/**
 * Filter raw rows by platform/metric and selected months/years.
 * Returns time-series points like:
 *   { key: "2024-01", year: 2024, month_num: 1, month_name: "Jan", value: 2442 }
 */
export function buildSeries({
  rows, platform, metric, selectedYears, selectedMonths,
}) {
  const keepYear = (y) => selectedYears.has(Number(y));
  const keepMonth = (m) => selectedMonths.has(Number(m));

  const filtered = rows.filter(r =>
    r.platform === platform &&
    r.metric === metric &&
    keepYear(r.year) &&
    keepMonth(r.month_num)
  );

  // stable sort by (year, month)
  filtered.sort((a,b) =>
    a.year - b.year || a.month_num - b.month_num
  );

  // Recharts-friendly points
  return filtered.map(r => ({
    key: monthKey(r.year, r.month_num),
    year: r.year,
    month_num: r.month_num,
    month_name: r.month_name,
    value: r.value,
  }));
}

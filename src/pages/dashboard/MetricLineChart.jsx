import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const MONTH_LABELS = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function SocialChart({ platform = "facebook", metric = "Followers", height = 360 }) {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ years: [], months: [] });
  const [selYears, setSelYears]   = useState([]);
  const [selMonths, setSelMonths] = useState([]);
  const [rows, setRows] = useState([]);

  // 1) Load available filters (years, months) and default to "all"
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await window.electronAPI.getSocialFilters(platform);
        if (!alive) return;
        if (res?.success) {
          setFilters({ years: res.years || [], months: res.months || [] });
          setSelYears(res.years || []);
          setSelMonths(res.months || []);
        } else {
          setFilters({ years: [], months: [] });
          setSelYears([]);
          setSelMonths([]);
        }
      } catch {
        setFilters({ years: [], months: [] });
      }
    })();
    return () => { alive = false; };
  }, [platform]);

  // 2) Fetch data whenever filters/metric/platform change
  useEffect(() => {
    if (!selYears.length || !selMonths.length) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const res = await window.electronAPI.getSocialData({
          platform,
          metrics: [metric],
          years: selYears,
          months: selMonths,
        });
        if (!alive) return;
        setRows(res?.success ? (res.rows || []) : []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [platform, metric, selYears, selMonths]);

  // 3) Shape for Recharts: one point per (year, month) with label "Mon YYYY"
  const chartData = useMemo(() => {
    // map key -> aggregated row
    const map = new Map();
    for (const r of rows) {
      const key = `${r.year}-${r.month_num}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          year: r.year,
          month_num: r.month_num,
          label: `${MONTH_LABELS[r.month_num]} ${r.year}`,
        });
      }
      map.get(key)[metric] = r.value;
    }
    // Sort by (year asc, month asc)
    const arr = Array.from(map.values());
    arr.sort((a, b) => (a.year - b.year) || (a.month_num - b.month_num));
    return arr;
  }, [rows, metric]);

  // Helpers for checkbox UIs
  const toggle = (arr, v, setter) =>
    setter(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v].sort((a,b) => a - b));

  const checkAllYears  = () => setSelYears(filters.years);
  const clearAllYears  = () => setSelYears([]);
  const checkAllMonths = () => setSelMonths(filters.months);
  const clearAllMonths = () => setSelMonths([]);

  return (
    <div className="grid gap-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-8 items-start">
        <div>
          <div className="font-semibold mb-1">Years</div>
          <div className="flex flex-col gap-1">
            <div className="flex gap-2 text-sm mb-1">
              <button type="button" onClick={checkAllYears}>Select all</button>
              <span>·</span>
              <button type="button" onClick={clearAllYears}>Clear</button>
            </div>
            {filters.years.map((y) => (
              <label key={y} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selYears.includes(y)}
                  onChange={() => toggle(selYears, y, setSelYears)}
                />
                {y}
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="font-semibold mb-1">Months</div>
          <div className="flex flex-col gap-1">
            <div className="flex gap-2 text-sm mb-1">
              <button type="button" onClick={checkAllMonths}>Select all</button>
              <span>·</span>
              <button type="button" onClick={clearAllMonths}>Clear</button>
            </div>
            {filters.months.map((m) => (
              <label key={m} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selMonths.includes(m)}
                  onChange={() => toggle(selMonths, m, setSelMonths)}
                />
                {MONTH_LABELS[m]}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 16, bottom: 6, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={metric} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {!loading && chartData.length === 0 && (
        <div className="text-sm text-gray-500">No data for current filters.</div>
      )}
    </div>
  );
}

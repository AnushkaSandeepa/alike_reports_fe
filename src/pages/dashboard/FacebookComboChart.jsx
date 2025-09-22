// components/FacebookComboChart.jsx
import React from "react";
import { Card, CardBody } from "reactstrap";
import {
  ResponsiveContainer, ComposedChart,
  XAxis, YAxis, Tooltip, Legend, Bar, Line, CartesianGrid,
} from "recharts";
import YearMonthFilter from "../../components/YearMonthFilter";

const MONTH_LABELS = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const COLORS = ["#1f77b4","#2ca02c","#ff7f0e","#2ca02c","#164728","#1f77b4","#d62728"];

export default function FacebookComboChart({
  platform = "facebook",
  title = "Facebook — Followers, Post Reach & Engagement Rate",
}) {
  const [filters, setFilters] = React.useState({ years: [], months: [] });
  const [selYears, setSelYears]   = React.useState([]);
  const [selMonths, setSelMonths] = React.useState([]);
  const [rows, setRows] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      const meta = await window.electronAPI.getSocialFilters(platform);
      if (meta?.success) {
        setFilters({ years: meta.years ?? [], months: meta.months ?? [] });
        setSelYears(meta.years ?? []);
        setSelMonths(meta.months ?? []);
      }
    })();
  }, [platform]);

  React.useEffect(() => {
    if (!selYears.length || !selMonths.length) return;
    (async () => {
      const res = await window.electronAPI.getSocialData({
        platform,
        metrics: ["Followers", "Post Reach", "Engagement Rate"],
        years: selYears,
        months: selMonths,
      });
      if (res?.success) setRows(res.rows || []);
    })();
  }, [platform, selYears, selMonths]);

  const chartData = React.useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const key = `${r.year}-${r.month_num}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          year: r.year,
          month: r.month_num,
          label: `${MONTH_LABELS[r.month_num]} ${r.year}`,
        });
      }
      map.get(key)[r.metric] = r.value;
    }
    return Array.from(map.values()).sort((a,b) =>
      a.year === b.year ? a.month - b.month : a.year - b.year
    );
  }, [rows]);

  const fmtPct = (v) => (v == null ? "" : `${Number(v).toFixed(0)}%`);
  const fmtNum = (v) => (v == null ? "" :
    Math.abs(v) >= 1000 ? `${Math.round(v).toLocaleString()}` : `${v}`);

  return (
    <Card>
      <CardBody>
        <div className="grid gap-4">
          <h4 className="font-semibold">{title}</h4>

          {/* ✅ Correct props for YearMonthFilter */}
          <YearMonthFilter
            years={filters.years || []}
            months={filters.months || undefined}    // optional; defaults to 1..12
            valueYears={selYears}
            valueMonths={selMonths}
            onChangeYears={setSelYears}
            onChangeMonths={setSelMonths}
            showMonthPresets
            className="mb-2"
          />

          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 25, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis yAxisId="left"  tickFormatter={fmtNum} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={fmtPct} domain={[0, 'auto']} allowDecimals={false} />
              <Tooltip formatter={(value, name) => (name === "Engagement Rate" ? fmtPct(value) : fmtNum(value))} />
              <Legend />

              <Bar  yAxisId="left"  dataKey="Followers"        name="Followers"        fill={COLORS[0]} barSize={28} radius={[4,4,0,0]} />
              <Bar  yAxisId="left"  dataKey="Post Reach"       name="Post Reach"       fill={COLORS[1]} barSize={28} radius={[4,4,0,0]} />
              <Line yAxisId="right" dataKey="Engagement Rate"  name="Engagement Rate"  type="monotone" dot stroke={COLORS[2]} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}

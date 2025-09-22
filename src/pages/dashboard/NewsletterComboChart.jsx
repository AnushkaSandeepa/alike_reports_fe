// components/NewsletterComboChart.jsx
import React from "react";
import { Card, CardBody } from "reactstrap";
import {
  ResponsiveContainer, ComposedChart,
  XAxis, YAxis, Tooltip, Legend, Bar, Line, CartesianGrid,
} from "recharts";
import YearMonthFilter from "../../components/YearMonthFilter";

const MONTH = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const COLORS = ["#1cd3a5ff", "#1f77b4", "#ff7f0e","#164728"];

export default function NewsletterComboChart({
  platform = "newsletter",
  title = "e-Newsletter — Subscribers, Open Rate & Engagement",
}) {
  const [filters, setFilters] = React.useState({ years: [], months: [] });
  const [years, setYears]   = React.useState([]);
  const [months, setMonths] = React.useState([]);
  const [rows, setRows]     = React.useState([]);

  // 1) Load available years/months (default: select all)
  React.useEffect(() => {
    (async () => {
      const meta = await window.electronAPI.getSocialFilters(platform);
      if (meta?.success) {
        setFilters({ years: meta.years ?? [], months: meta.months ?? [] });
        setYears(meta.years ?? []);
        setMonths(meta.months ?? []);
      }
    })();
  }, [platform]);

  // 2) Fetch newsletter data
  React.useEffect(() => {
    if (!years.length || !months.length) return;
    (async () => {
      const res = await window.electronAPI.getSocialData({
        platform,
        // main chart metrics; add "Opens", "Clicks" here if you want extra bars
        metrics: ["Subscribers", "Open percentage", "Engagement Rate"],
        years, months,
      });
      if (res?.success) setRows(res.rows || []);
    })();
  }, [platform, years, months]);

  // 3) Shape rows for Recharts. Also alias "Open percentage" -> "Open Rate" for cleaner legend.
  const data = React.useMemo(() => {
    const m = new Map();
    for (const r of rows) {
      const key = `${r.year}-${r.month_num}`;
      if (!m.has(key)) {
        m.set(key, { year: r.year, month: r.month_num, label: `${MONTH[r.month_num]} ${r.year}` });
      }
      const metricName = r.metric === "Open percentage" ? "Open Rate" : r.metric;
      m.get(key)[metricName] = r.value;
    }
    return Array.from(m.values()).sort((a,b) =>
      a.year === b.year ? a.month - b.month : a.year - b.year
    );
  }, [rows]);

  const fmtPct = (v) => (v == null ? "" : `${Number(v).toFixed(0)}%`);
  const fmtNum = (v) =>
    v == null ? "" : Math.abs(v) >= 1000 ? Math.round(v).toLocaleString() : `${v}`;

  return (
    <Card>
      <CardBody>
        <div className="grid gap-4">
          <h4 className="font-semibold">{title}</h4>

          {/* reusable year/month chips with presets */}
          <YearMonthFilter
            years={filters.years || []}
            valueYears={years}
            valueMonths={months}
            onChangeYears={setYears}
            onChangeMonths={setMonths}
            showMonthPresets
          />

          {/* chart */}
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={data} margin={{ top: 10, right: 25, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              {/* left: counts */}
              <YAxis yAxisId="left"  tickFormatter={fmtNum} allowDecimals={false} />
              {/* right: percentages */}
              <YAxis yAxisId="right" orientation="right" tickFormatter={fmtPct} domain={[0, "auto"]} allowDecimals={false} />

              <Tooltip formatter={(v, n) => (n === "Open Rate" || n === "Engagement Rate" ? fmtPct(v) : fmtNum(v))} />
              <Legend />

              {/* Bars (counts) */}
              <Bar  yAxisId="left"  dataKey="Subscribers" name="Subscribers" fill={COLORS[0]} barSize={28} radius={[4,4,0,0]} />

              {/* Lines (rates) */}
              <Line yAxisId="right" type="monotone" dataKey="Open Rate"        name="Open Rate"        dot stroke={COLORS[1]} strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="Engagement Rate"  name="Engagement Rate"  dot stroke={COLORS[2]} strokeWidth={2} />

              {/*
                Optional extras:
                <Bar yAxisId="left" dataKey="Opens"  name="Opens"  fill={COLORS[3]} barSize={20} radius={[4,4,0,0]} />
                <Bar yAxisId="left" dataKey="Clicks" name="Clicks" fill="#d62728"  barSize={20} radius={[4,4,0,0]} />
              */}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}

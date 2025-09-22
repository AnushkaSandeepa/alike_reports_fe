// components/InstagramCadenceChart.jsx
import React from "react";
import { Card, CardBody } from "reactstrap";
import {
  ResponsiveContainer, ComposedChart,
  XAxis, YAxis, Tooltip, Legend, Bar, Line, CartesianGrid,
} from "recharts";
import YearMonthFilter from "../../components/YearMonthFilter";

const MONTH = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const COLORS = ["#164728","#1f77b4","#ff7f0e","#2ca02c","#d62728"];

export default function InstagramCadenceChart({
  platform = "instagram",
  title = "Instagram — Posts vs Content Reach",
}) {
  const [filters, setFilters] = React.useState({ years: [], months: [] });
  const [years, setYears] = React.useState([]);
  const [months, setMonths] = React.useState([]);
  const [rows, setRows] = React.useState([]);

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

  React.useEffect(() => {
    if (!years.length || !months.length) return;
    (async () => {
      const res = await window.electronAPI.getSocialData({
        platform,
        metrics: ["Posts","Content Reach"],
        years, months,
      });
      if (res?.success) setRows(res.rows || []);
    })();
  }, [platform, years, months]);

  const data = React.useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const key = `${r.year}-${r.month_num}`;
      if (!map.has(key)) {
        map.set(key, { key, year: r.year, month: r.month_num, label: `${MONTH[r.month_num]} ${r.year}` });
      }
      map.get(key)[r.metric] = r.value;
    }
    return Array.from(map.values()).sort((a,b)=> a.year===b.year ? a.month-b.month : a.year-b.year);
  }, [rows]);

  const fmtNum = (v) => v == null ? "" : (Math.abs(v)>=1000 ? Math.round(v).toLocaleString() : `${v}`);

  return (
    <Card>
      <CardBody>
        <div className="grid gap-4">
          <h4 className="font-semibold">{title}</h4>

          <YearMonthFilter
            years={filters.years || []}
            valueYears={years}
            valueMonths={months}
            onChangeYears={setYears}
            onChangeMonths={setMonths}
            showMonthPresets
          />

          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={data} margin={{ top: 10, right: 25, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis yAxisId="left"  tickFormatter={fmtNum} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={fmtNum} allowDecimals={false} />
              <Tooltip formatter={(v, n) => fmtNum(v)} />
              <Legend />

              <Bar  yAxisId="left"  dataKey="Posts"        name="Posts"        fill={COLORS[1]} barSize={28} radius={[4,4,0,0]} />
              <Line yAxisId="right" dataKey="Content Reach" name="Content Reach" type="monotone" dot stroke={COLORS[2]} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}

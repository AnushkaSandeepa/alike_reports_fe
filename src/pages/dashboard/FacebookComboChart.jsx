// components/FacebookComboChart.LineBarAPI.jsx
import React from "react";
import ReactEcharts from "echarts-for-react";
import * as echarts from "echarts";
import { Card, CardBody } from "reactstrap";
import YearMonthFilter from "../../components/YearMonthFilter";

const MONTH_LABELS = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function FacebookLineBarFromAPI({
  platform = "facebook",
  title = "Facebook — Followers, Post Reach & Engagement",
  engagementScale = 1, // 1 if values are already 0–100, 0.01 if basis points (270=>2.7%), 100 if 0–1
}) {
  const [filters, setFilters] = React.useState({ years: [], months: [] });
  const [selYears, setSelYears] = React.useState([]);
  const [selMonths, setSelMonths] = React.useState([]);
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // 1) Load available years/months
  React.useEffect(() => {
    let ok = true;
    (async () => {
      const meta = await window.electronAPI.getSocialFilters(platform);
      if (!ok) return;
      const years = meta?.years ?? [];
      const months = meta?.months ?? [];
      setFilters({ years, months });
      setSelYears(years);
      setSelMonths(months.length ? months : [1,2,3,4,5,6,7,8,9,10,11,12]);
    })();
    return () => { ok = false; };
  }, [platform]);

  // 2) Load data for selections
  React.useEffect(() => {
    if (!selYears.length || !selMonths.length) return;
    let ok = true;
    setLoading(true);
    (async () => {
      const res = await window.electronAPI.getSocialData({
        platform,
        metrics: ["Followers", "Post Reach", "Engagement Rate"],
        years: selYears,
        months: selMonths,
      });
      if (!ok) return;
      setRows(res?.success ? (res.rows || []) : []);
      setLoading(false);
    })();
    return () => { ok = false; };
  }, [platform, selYears, selMonths]);

  // 3) Shape into arrays for the simple Line+Bar layout
  const { monthsArr, followersArr, reachArr, engagementArr } = React.useMemo(() => {
    // group by (year, month) and pivot metrics
    const map = new Map();
    for (const r of rows) {
      const key = `${r.year}-${r.month_num}`;
      if (!map.has(key)) {
        map.set(key, { year: r.year, month: r.month_num, Followers: null, "Post Reach": null, "Engagement Rate": null });
      }
      map.get(key)[r.metric] = r.value;
    }
    const ordered = Array.from(map.values()).sort((a,b) =>
      a.year === b.year ? a.month - b.month : a.year - b.year
    );
    return {
      monthsArr: ordered.map(d => `${MONTH_LABELS[d.month]} ${d.year}`),
      followersArr: ordered.map(d => d.Followers ?? 0),
      reachArr:     ordered.map(d => d["Post Reach"] ?? 0),
      engagementArr: ordered.map(d => d["Engagement Rate"] ?? 0),
    };
  }, [rows]);

  const toPct = (v) => {
    const x = Number(v) * engagementScale;
    return Number.isFinite(x) ? `${Math.round(x)}%` : "";
  };
  const fmtNum = (v) =>
    v == null ? "" : Math.abs(v) >= 1000 ? Math.round(v).toLocaleString() : `${v}`;

  const option = {
    animationDuration: 700,
    grid: { top: 56, left: 8, right: 16, bottom: 60, containLabel: true },
    legend: {
      top: 8, itemWidth: 14, itemHeight: 10, textStyle: { fontSize: 12 },
      data: ["Followers", "Post Reach", "Post Engagement"]
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#111827",
      borderWidth: 0,
      textStyle: { color: "#fff" },
      formatter: (params) => {
        const title = params?.[0]?.axisValue ?? "";
        const lines = params.map((p) => {
          const val = p.seriesName === "Post Engagement" ? toPct(p.value) : fmtNum(p.value);
          return `<div style="margin:2px 0;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px;"></span>
            ${p.seriesName}: <b>${val}</b>
          </div>`;
        });
        return `<div style="padding:2px 0 2px 0">
          <div style="font-weight:600;margin-bottom:4px">${title}</div>
          ${lines.join("")}
        </div>`;
      },
    },
    xAxis: {
      type: "category",
      data: monthsArr,
      axisTick: { show: false },
      axisLabel: { interval: 0, rotate: monthsArr.length > 8 ? 30 : 0 },
    },
    yAxis: [
      {
        type: "value",
        name: "Users",
        min: 0,
        splitLine: { show: true, lineStyle: { type: "dashed" } },
        axisLabel: { formatter: (v) => fmtNum(v) },
      },
      {
        type: "value",
        name: "Engagement",
        min: 0,
        splitLine: { show: false },
        axisLabel: { formatter: (v) => toPct(v) },
      },
    ],
    toolbox: { right: 8, feature: { dataZoom: { yAxisIndex: "none" }, restore: {}, saveAsImage: {} } },
    dataZoom: [
      { type: "inside", start: 0, end: 100 },
      {
        type: "slider",
        // bottom placement with padding:
        bottom: 16,   // move it up/down
        height: 24,   // slider thickness
        // or put it at the top:
        // top: 56,
      },
    ]    ,
    series: [
      {
        name: "Followers",
        type: "bar",
        data: followersArr,
        barWidth: 18,
        barGap: "8%",
        z: 3,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#6366F1" },
            { offset: 1, color: "rgba(99,102,241,0.55)" },
          ]),
        },
      },
      {
        name: "Post Reach",
        type: "bar",
        data: reachArr,
        barWidth: 18,
        barGap: "8%",
        z: 2,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#60A5FA" },
            { offset: 1, color: "rgba(96,165,250,0.45)" },
          ]),
        },
      },
      {
        name: "Post Engagement",
        type: "line",
        yAxisIndex: 1,
        data: engagementArr,
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        lineStyle: { width: 3, color: "#10B981" },
        itemStyle: { color: "#10B981", borderWidth: 2, borderColor: "#fff" },
        areaStyle: {
          opacity: 0.15,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#10B981" },
            { offset: 1, color: "rgba(16,185,129,0)" },
          ]),
        },
        markLine: {
          symbol: "none",
          lineStyle: { type: "dashed", color: "#10B981" },
          label: {
            formatter: ({ value }) => `Avg ${toPct(value)}`,
            color: "#059669", fontSize: 12,
          },
          data: [{ type: "average", name: "Avg" }],
        },
      },
    ],
  };

  return (
    <Card>
      <CardBody>
        <div className="grid gap-4">
          <h4 className="font-semibold">{title}</h4>

          {/* Same filter UX you use everywhere */}
          <YearMonthFilter
            years={filters.years || []}
            months={filters.months || undefined}
            valueYears={selYears}
            valueMonths={selMonths}
            onChangeYears={setSelYears}
            onChangeMonths={setSelMonths}
            showMonthPresets
            className="mb-2"
          />

          {loading ? (
            <div style={{ height: 360, display: "grid", placeItems: "center" }}>Loading…</div>
          ) : (
            <ReactEcharts style={{ height: 360 }} option={option} theme="light" />
          )}
        </div>
      </CardBody>
    </Card>
  );
}

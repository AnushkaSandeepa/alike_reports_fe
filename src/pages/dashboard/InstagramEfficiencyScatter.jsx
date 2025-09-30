// components/InstagramCadenceChartEcharts.jsx
import React from "react";
import ReactEcharts from "echarts-for-react";
import * as echarts from "echarts";
import { Card, CardBody } from "reactstrap";
import YearMonthFilter from "../../components/YearMonthFilter";

const MONTH = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function InstagramCadenceChartEcharts({
  platform = "instagram",
  title = "Instagram — Posts vs Content Reach",
}) {
  const [filters, setFilters] = React.useState({ years: [], months: [] });
  const [years, setYears]   = React.useState([]);
  const [months, setMonths] = React.useState([]);
  const [rows, setRows]     = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Load available filters
  React.useEffect(() => {
    let live = true;
    (async () => {
      const meta = await window.electronAPI.getSocialFilters(platform);
      if (!live) return;
      const ys = meta?.years ?? [];
      const ms = meta?.months ?? [];
      setFilters({ years: ys, months: ms });
      setYears(ys);
      setMonths(ms.length ? ms : [1,2,3,4,5,6,7,8,9,10,11,12]);
    })();
    return () => { live = false; };
  }, [platform]);

  // Load data for the selected filters
  React.useEffect(() => {
    if (!years.length || !months.length) return;
    let live = true;
    setLoading(true);
    (async () => {
      const res = await window.electronAPI.getSocialData({
        platform,
        metrics: ["Posts", "Content Reach"],
        years, months,
      });
      if (!live) return;
      setRows(res?.success ? (res.rows || []) : []);
      setLoading(false);
    })();
    return () => { live = false; };
  }, [platform, years, months]);

  // Shape into arrays for ECharts
  const { labels, postsArr, reachArr } = React.useMemo(() => {
    const byYm = new Map();
    for (const r of rows) {
      const key = `${r.year}-${r.month_num}`;
      if (!byYm.has(key)) {
        byYm.set(key, { year: r.year, month: r.month_num, Posts: null, "Content Reach": null });
      }
      byYm.get(key)[r.metric] = r.value;
    }
    const ordered = Array.from(byYm.values()).sort((a,b) =>
      a.year === b.year ? a.month - b.month : a.year - b.year
    );
    return {
      labels:   ordered.map(d => `${MONTH[d.month]} ${d.year}`),
      postsArr: ordered.map(d => d.Posts ?? 0),
      reachArr: ordered.map(d => d["Content Reach"] ?? 0),
    };
  }, [rows]);

  const fmtNum = (v) => v == null ? "" :
    (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString() : `${v}`);

  const option = {
    animationDuration: 700,
    grid: { top: 56, left: 8, right: 16, bottom: 60, containLabel: true },
    legend: {
      top: 8,
      itemWidth: 14,
      itemHeight: 10,
      data: ["Posts", "Content Reach"],
      textStyle: { fontSize: 12 },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#111827",
      borderWidth: 0,
      textStyle: { color: "#fff" },
      formatter: (params) => {
        const title = params?.[0]?.axisValue ?? "";
        const lines = params.map(p => {
          const val = fmtNum(p.value);
          return `<div style="margin:2px 0;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px;"></span>
            ${p.seriesName}: <b>${val}</b>
          </div>`;
        });
        return `<div style="padding:2px 0 2px 0">
          <div style="font-weight:600;margin-bottom:4px">${title}</div>
          ${lines.join("")}
        </div>`;
      }
    },
    xAxis: {
      type: "category",
      data: labels,
      axisTick: { show: false },
      axisLabel: { interval: 0, rotate: labels.length > 8 ? 30 : 0 },
    },
    yAxis: [
      {
        type: "value",
        name: "Posts",
        min: 0,
        boundaryGap: [0, 0.1], // a bit of headroom above bars
        splitLine: { show: true, lineStyle: { type: "dashed" } },
        axisLabel: { formatter: (v) => fmtNum(v) },
      },
      {
        type: "value",
        name: "Content Reach",
        min: 0,
        boundaryGap: [0, 0.1],
        splitLine: { show: false },
        axisLabel: { formatter: (v) => fmtNum(v) },
      },
    ],
    toolbox: {
      right: 8,
      feature: { dataZoom: { yAxisIndex: "none" }, restore: {}, saveAsImage: {} },
    },
    dataZoom: [
      { type: "inside", start: 0, end: 100 },
      { type: "slider", start: 0, end: 100, bottom: 20, height: 22 },
    ],
    series: [
      {
        name: "Posts",
        type: "bar",
        yAxisIndex: 0,
        data: postsArr,
        barWidth: 22,
        z: 3,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#1f77b4" },
            { offset: 1, color: "rgba(31,119,180,0.45)" },
          ]),
        },
      },
      {
        name: "Content Reach",
        type: "line",
        yAxisIndex: 1,
        data: reachArr,
        smooth: true,
        symbol: "circle",
        symbolSize: 7,
        lineStyle: { width: 3, color: "#ff7f0e" },
        itemStyle: { color: "#ff7f0e", borderWidth: 2, borderColor: "#fff" },
        areaStyle: {
          opacity: 0.12,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#ff7f0e" },
            { offset: 1, color: "rgba(255,127,14,0)" },
          ]),
        },
        markLine: {
          symbol: "none",
          lineStyle: { type: "dashed", color: "#ff7f0e" },
          label: {
            formatter: ({ value }) => `Avg ${fmtNum(value)}`,
            color: "#b45309",
            fontSize: 12,
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

          <YearMonthFilter
            years={filters.years || []}
            months={filters.months || undefined}
            valueYears={years}
            valueMonths={months}
            onChangeYears={setYears}
            onChangeMonths={setMonths}
            showMonthPresets
            className="mb-2"
          />

          {loading
            ? <div style={{ height: 360, display: "grid", placeItems: "center" }}>Loading…</div>
            : <ReactEcharts style={{ height: 360 }} option={option} theme="light" />
          }
        </div>
      </CardBody>
    </Card>
  );
}

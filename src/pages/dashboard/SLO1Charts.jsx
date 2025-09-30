// components/SLO1ChartsEcharts.jsx
// (adjust the import path if your file structure is different)
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody } from "reactstrap";
import ReactEcharts from "echarts-for-react";
import * as echarts from "echarts";
import { Chip, Section } from "../../components/YearMonthFilter"; // ← reuse SAME look & feel

// ---------- Period selector using the shared Chip & Section ----------
function PeriodFilter({ periods, value, onChange, title = "Periods" }) {
  const toggle = (p) =>
    onChange(value.includes(p) ? value.filter(x => x !== p) : [...value, p]);

  return (
    <Section
      title={title}
      right={
        <>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => onChange(periods.slice())}
          >
            All
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => onChange([])}
          >
            None
          </button>
        </>
      }
    >
      <div className="d-flex flex-wrap gap-2">
        {periods.map((p) => (
          <Chip
            key={p}
            active={value.includes(p)}
            onClick={() => toggle(p)}
            title={`Toggle ${p}`}
          >
            {p}
          </Chip>
        ))}
      </div>
    </Section>
  );
}

// ------- helpers (same logic as your Recharts version) -------
const toNumber = (v) => {
  if (v == null) return 0;
  const s = String(v).trim();
  if (!s) return 0;
  if (s.endsWith("%")) return parseFloat(s.replace("%",""));
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

function buildComparisonData(headers, rows) {
  const periodKey = headers[0] || "Period";
  const METRIC_KEYS = ["# Participants", "# Groups", "Hours of Service", "# Downloads"];
  const periods = rows.map((r) => String(r[periodKey] ?? "")).filter(Boolean);

  const data = METRIC_KEYS.map((metric) => {
    const rowObj = { metric };
    rows.forEach((r, i) => {
      const label = periods[i] || `Period ${i + 1}`;
      rowObj[label] = toNumber(r[metric]);
    });
    return rowObj;
  });

  return { data, periods };
}

function buildGeoData(headers, rows) {
  const periodKey   = headers[0] || "Period";
  const metroKey    = headers.find((h) => String(h).toLowerCase().includes("metro"))    || "Metro Focus";
  const regionalKey = headers.find((h) => String(h).toLowerCase().includes("regional")) || "Regional Focus";

  return rows.map((r) => {
    const period   = String(r[periodKey] ?? "");
    const metroRaw = toNumber(r[metroKey]);
    const regRaw   = toNumber(r[regionalKey]);
    const sumRaw   = metroRaw + regRaw;

    let mPct = 0, rPct = 0;
    const near = (a, b, tol) => Math.abs(a - b) <= tol;

    if (sumRaw <= 0) {
      mPct = 0; rPct = 0;
    } else if (metroRaw <= 1.05 && regRaw <= 1.05 && near(sumRaw, 1, 0.05)) {
      mPct = metroRaw * 100;
      rPct = regRaw   * 100;
    } else if (metroRaw >= 0 && regRaw >= 0 && metroRaw <= 100 && regRaw <= 100 && near(sumRaw, 100, 5)) {
      mPct = metroRaw;
      rPct = regRaw;
    } else {
      mPct = (metroRaw / sumRaw) * 100;
      rPct = (regRaw   / sumRaw) * 100;
    }

    return { period, Metropolitan: +mPct.toFixed(2), Regional: +rPct.toFixed(2) };
  });
}

const palette = ["#06b6d4", "#0654b4", "#34d399", "#f59e0b", "#ef4444"];
const titleStyle = { fontWeight: 800, fontSize: 24, margin: "8px 0" };
const fmtInt = (v) => (Number(v) || 0).toLocaleString();

function hexWithAlpha(hex, a = 0.55) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return hex;
  const full = hex.length === 4 ? "#" + [...hex.slice(1)].map(ch => ch + ch).join("") : hex;
  const r = parseInt(full.slice(1,3), 16);
  const g = parseInt(full.slice(3,5), 16);
  const b = parseInt(full.slice(5,7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export default function SLO1ChartsEcharts() {
  const [analytics, setAnalytics] = useState(null);
  const [err, setErr] = useState("");
  const [selectedPeriods, setSelectedPeriods] = useState([]);

  // load data once + subscribe to updates
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setErr("");
        const res = await window?.electronAPI?.readAnalytics?.();
        if (!mounted) return;
        if (!res?.success) throw new Error(res?.error || "Could not read analytics.json");
        setAnalytics(res.data);
      } catch (e) {
        if (!mounted) return;
        setErr(e.message || "Failed to load analytics.json");
        setAnalytics(null);
      }
    };
    load();
    const off = window?.electronAPI?.onAnalyticsUpdated?.(() => load());
    return () => { mounted = false; off && off(); };
  }, []);

  const headers = analytics?.table?.headers || [];
  const rows    = analytics?.table?.rows || [];

  // shape data
  const { compData, periods, geoData } = useMemo(() => {
    if (!headers.length || !rows.length) return { compData: [], periods: [], geoData: [] };
    const { data, periods } = buildComparisonData(headers, rows);
    const geo = buildGeoData(headers, rows);
    return { compData: data, periods, geoData: geo };
  }, [headers, rows]);

  // keep selection in sync with available periods
  useEffect(() => {
    if (!periods.length) { setSelectedPeriods([]); return; }
    setSelectedPeriods(prev => {
      if (!prev.length) return periods.slice();        // default: select all
      const set = new Set(periods);
      const next = prev.filter(p => set.has(p));       // drop removed periods
      return next.length ? next : periods.slice();
    });
  }, [periods]);

  const filteredPeriods = useMemo(
    () => periods.filter(p => selectedPeriods.includes(p)),
    [periods, selectedPeriods]
  );
  const geoFiltered = useMemo(
    () => geoData.filter(d => selectedPeriods.includes(d.period)),
    [geoData, selectedPeriods]
  );

  // ---- Chart 1: Grouped bar (uses filtered periods) ----
  const groupedOption = useMemo(() => {
    const metrics = compData.map(d => d.metric);
    const series = filteredPeriods.map((p, idx) => {
      const color = palette[idx % palette.length];
      const data  = compData.map(d => d[p] ?? 0);
      return {
        name: p,
        type: "bar",
        data,
        barWidth: 26,
        emphasis: { focus: "series" },
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color },
            { offset: 1, color: hexWithAlpha(color, 0.55) },
          ]),
          borderColor: color,
        },
        label: {
          show: true, position: "top",
          formatter: ({ value }) => fmtInt(value),
          fontSize: 12, color: "#374151", fontWeight: 600,
        },
      };
    });

    return {
      animationDuration: 700,
      grid: { top: 64, left: 8, right: 16, bottom: 32, containLabel: true },
      legend: { top: 8, type: filteredPeriods.length > 4 ? "scroll" : "plain", data: filteredPeriods },
      tooltip: {
        trigger: "axis", axisPointer: { type: "shadow" },
        backgroundColor: "#111827", borderWidth: 0, textStyle: { color: "#fff" },
        formatter: (params) => {
          if (!params?.length) return "";
          const title = params[0].axisValue;
          const lines = params.map(p => `
            <div style="margin:2px 0;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px;"></span>
              ${p.seriesName}: <b>${fmtInt(p.value)}</b>
            </div>`).join("");
          return `<div><div style="font-weight:600;margin-bottom:4px">${title}</div>${lines}</div>`;
        },
      },
      xAxis: {
        type: "category",
        data: metrics,
        axisTick: { show: false },
        axisLabel: { interval: 0, rotate: metrics.length > 6 ? 20 : 0, fontSize: 14 },
      },
      yAxis: {
        type: "value",
        min: 0,
        boundaryGap: [0, 0.12],
        splitLine: { show: true, lineStyle: { type: "dashed" } },
        axisLabel: { formatter: (v) => fmtInt(v) },
      },
      series,
    };
  }, [compData, filteredPeriods]);

  // ---- Chart 2: 100% stacked horizontal (uses filtered periods) ----
  const geoOption = useMemo(() => {
    const categories = geoFiltered.map(d => d.period);
    const metro     = geoFiltered.map(d => d.Metropolitan ?? 0);
    const regional  = geoFiltered.map(d => d.Regional ?? 0);
    return {
      animationDuration: 700,
      grid: { top: 40, left: 8, right: 16, bottom: 24, containLabel: true },
      legend: { top: 8, data: ["Metropolitan", "Regional"] },
      tooltip: {
        trigger: "axis", axisPointer: { type: "shadow" },
        backgroundColor: "#111827", borderWidth: 0, textStyle: { color: "#fff" },
        formatter: (params) => {
          const title = params?.[0]?.axisValue ?? "";
          const lines = params.map(p => `
            <div style="margin:2px 0;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px;"></span>
              ${p.seriesName}: <b>${Math.round(p.value)}%</b>
            </div>`).join("");
          return `<div><div style="font-weight:600;margin-bottom:4px">${title}</div>${lines}</div>`;
        },
      },
      xAxis: {
        type: "value", min: 0, max: 100,
        axisLabel: { formatter: (v) => `${v}%` },
        splitLine: { show: true, lineStyle: { type: "dashed" } },
      },
      yAxis: { type: "category", data: categories, axisTick: { show: false } },
      series: [
        {
          name: "Metropolitan",
          type: "bar",
          stack: "focus",
          data: metro,
          barWidth: 50,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: palette[0] },
              { offset: 1, color: hexWithAlpha(palette[0], 0.55) },
            ]),
            borderColor: palette[0],
          },
          label: {
            show: true, position: "inside", color: "#fff", fontWeight: 600,
            formatter: ({ value }) => (value ? `${Math.round(value)}%` : ""),
          },
          emphasis: { focus: "series" },
        },
        {
          name: "Regional",
          type: "bar",
          stack: "focus",
          data: regional,
          barWidth: 50,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: palette[1] },
              { offset: 1, color: hexWithAlpha(palette[1], 0.55) },
            ]),
            borderColor: palette[1],
          },
          label: {
            show: true, position: "inside", color: "#fff", fontWeight: 600,
            formatter: ({ value }) => (value ? `${Math.round(value)}%` : ""),
          },
          emphasis: { focus: "series" },
        },
      ],
    };
  }, [geoFiltered]);

  const noData = !headers.length || !rows.length;
  const nothingSelected = !filteredPeriods.length;

  return (
    <Card>
      <CardBody>
        <div className="flex flex-col gap-10">
          {/* Title + Period Selector (applies to BOTH charts) */}
          <div>
            <div style={titleStyle}>SOL Analysis</div>
            <h5 className="mb-0" style={{ fontWeight: 700 }}>
              COMPARISON OF KEY INDICATORS&nbsp;&nbsp;BETWEEN REPORTING PERIODS - SLO 1
            </h5>

            {!!periods.length && (
              <PeriodFilter
                periods={periods}
                value={selectedPeriods}
                onChange={setSelectedPeriods}
                title="Semesters / Periods"
              />
            )}

            {err ? (
              <div className="text-danger mt-3">{err}</div>
            ) : noData ? (
              <div className="text-muted mt-3">No data found.</div>
            ) : nothingSelected ? (
              <div className="text-muted mt-3">Select at least one period to display.</div>
            ) : (
              <div style={{ width: "100%", height: 420 }}>
                <ReactEcharts option={groupedOption} echarts={echarts} style={{ height: "100%" }} />
              </div>
            )}
          </div>

          {/* GEOGRAPHICAL FOCUS */}
          <div>
            <h5 className="mb-0" style={{ fontWeight: 700 }}>GEOGRAPHICAL FOCUS</h5>
            {err ? (
              <div className="text-danger mt-3">{err}</div>
            ) : noData ? (
              <div className="text-muted mt-3">No data found.</div>
            ) : nothingSelected ? (
              <div className="text-muted mt-3">Select at least one period to display.</div>
            ) : (
              <div style={{ width: "100%", height: 260 }}>
                <ReactEcharts option={geoOption} echarts={echarts} style={{ height: "100%" }} />
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

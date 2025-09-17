// components/SLO1Charts.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody } from "reactstrap";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, CartesianGrid, LabelList
} from "recharts";

const toNumber = (v) => {
  if (v == null) return 0;
  const s = String(v).trim();
  if (!s) return 0;
  if (s.endsWith("%")) return parseFloat(s.replace("%", ""));
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
  const periodKey = headers[0] || "Period";
  const metroKey = headers.find((h) => String(h).toLowerCase().includes("metro")) || "Metro Focus";
  const regionalKey = headers.find((h) => String(h).toLowerCase().includes("regional")) || "Regional Focus";

  return rows.map((r) => {
    const period = String(r[periodKey] ?? "");
    const metro = toNumber(r[metroKey]);
    const regional = toNumber(r[regionalKey]);
    const total = metro + regional;

    let mPct = metro, rPct = regional;
    if (total > 0 && (metro > 100 || regional > 100)) {
      mPct = (metro / total) * 100;
      rPct = (regional / total) * 100;
    }
    return { period, Metropolitan: +mPct.toFixed(2), Regional: +rPct.toFixed(2) };
  });
}

const palette = ["#06b6d4", "#0654b4ff", "#34d399", "#f59e0b", "#ef4444"];
const titleStyle = { fontWeight: 800, fontSize: 24, margin: "8px 0" };

export default function SLO1Charts() {
  const [analytics, setAnalytics] = useState(null);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setErr("");
      const res = await window?.electronAPI?.readAnalytics?.();
      if (!res?.success) throw new Error(res?.error || "Could not read analytics.json");
      setAnalytics(res.data);
    } catch (e) {
      setErr(e.message || "Failed to load analytics.json");
      setAnalytics(null);
    }
  };

  useEffect(() => {
    load();
    const off = window?.electronAPI?.onAnalyticsUpdated?.(() => load());
    return () => off && off();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headers = analytics?.table?.headers || [];
  const rows = analytics?.table?.rows || [];

  const { compData, periods, geoData } = useMemo(() => {
    if (!headers.length || !rows.length) return { compData: [], periods: [], geoData: [] };
    const { data, periods } = buildComparisonData(headers, rows);
    const geo = buildGeoData(headers, rows);
    return { compData: data, periods, geoData: geo };
  }, [headers, rows]);

  if (err) return <div className="text-danger">{err}</div>;
  if (!headers.length || !rows.length) return <div className="text-muted">No data found.</div>;

  return (
    <Card>
      <CardBody>
    
        <div className="flex flex-col gap-10">
          {/* SLO 1 – Key Indicators */}
          <div>
            <div style={titleStyle}>
              SOL Analysis
            </div>
            <h5 className="mb-0" style={{ fontWeight: 700 }}>
                COMPARISON OF KEY INDICATORS&nbsp;&nbsp;BETWEEN REPORTING PERIODS - SLO 1
            </h5>
            
            <div style={{ width: "100%", height: 420 }}>
              <ResponsiveContainer>
                <BarChart data={compData} margin={{ top: 24, right: 24, bottom: 24, left: 8 }}>
                  {/* same-color gradient (top -> bottom), high -> lower opacity */}
                  <defs>
                    {periods.map((p, idx) => {
                      const c = palette[idx % palette.length];
                      return (
                        <linearGradient id={`grad-${idx}`} key={p} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={c} stopOpacity={0.95} />
                          <stop offset="100%" stopColor={c} stopOpacity={0.55} />
                        </linearGradient>
                      );
                    })}
                  </defs>

                  <XAxis dataKey="metric" tick={{ fontSize: 14 }} interval={0} />
                  <YAxis />
                  <Tooltip />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Legend verticalAlign="top" height={36} />

                  {periods.map((p, idx) => (
                    <Bar
                      key={p}
                      dataKey={p}
                      name={p}
                      fill={`url(#grad-${idx})`}   // use the gradient
                      stroke={palette[idx % palette.length]}
                      radius={[6, 6, 0, 0]}
                    >
                      <LabelList
                        dataKey={p}
                        position="top"
                        formatter={(v) => (v == null ? "" : v)}
                        style={{ fontSize: 12, fill: "#374151", fontWeight: 600 }}
                      />
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* SLO 1 – Geographical Focus */}
          <div>
            <h5 className="mb-0" style={{ fontWeight: 700 }}>
                GEOGRAPHICAL FOCUS
            </h5>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart
                  data={geoData}
                  layout="vertical"
                  margin={{ top: 8, right: 24, bottom: 8, left: 10 }}
                  stackOffset="expand"
                >
                  {/* same-color gradient (left -> right), high -> lower opacity */}
                  <defs>
                    <linearGradient id="g-metro" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%"   stopColor={palette[0]} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={palette[0]} stopOpacity={0.55} />
                    </linearGradient>
                    <linearGradient id="g-reg" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%"   stopColor={palette[1]} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={palette[1]} stopOpacity={0.55} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="period" />
                  <Tooltip formatter={(v) => `${(v ?? 0)}%`} />
                  <Legend />

                  <Bar dataKey="Metropolitan" name="Metropolitan" stackId="a"
                      fill="url(#g-metro)" stroke={palette[0]}>
                    <LabelList
                      dataKey="Metropolitan"
                      position="center"
                      formatter={(v) => (v == null ? "" : `${Number(v)}%`)}
                      fill="#fff"
                      style={{ fontWeight: 600 }}
                    />
                  </Bar>

                  <Bar dataKey="Regional" name="Regional" stackId="a"
                      fill="url(#g-reg)" stroke={palette[1]}>
                    <LabelList
                      dataKey="Regional"
                      position="center"
                      formatter={(v) => (v == null ? "" : `${Number(v)}%`)}
                      fill="#fff"
                      style={{ fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      </CardBody>
    </Card>
  );
}

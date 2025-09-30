import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, Row, Col, Badge } from "reactstrap";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, LabelList, PieChart, Pie, Cell, ReferenceLine,
} from "recharts";

export default function PlatformBySocialType() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]); // [{platform,label,totalReach}]

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await window.electronAPI.getSocialReachSummary({
        years: [2025],                          // <= choose your period
        months: [1,2,3,4,5,6,7,8,9,10,11,12],  // <= or leave empty to include all
      });
      console.log("Social reach summary", res);
      if (!alive) return;
      if (res?.success) setSummary(res.rows || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const fmtInt = (v) => (Number(v) || 0).toLocaleString();

  // Build chart datasets from summary
  const { bars, pie, avgOfAvgReach, platformToColor } = useMemo(() => {
    const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#0ea5e9", "#8b5cf6", "#14b8a6"];
    const platformToColor = {};
    summary.forEach((d, i) => (platformToColor[d.label] = COLORS[i % COLORS.length]));

    const bars = summary.map((d) => ({
      platform: d.label,
      avgReach: d.totalReach,          // single bar value per platform (you can rename)
      sumReach: d.totalReach,
    }));

    const pieData = summary.map((d) => ({ name: d.label, value: d.totalReach }));
    const total = summary.reduce((s, d) => s + d.totalReach, 0);
    const avg = bars.length ? Math.round(total / bars.length) : 0;

    return {
      bars,
      pie: { data: pieData, totalReach: total },
      avgOfAvgReach: avg,
      platformToColor,
    };
  }, [summary]);

  return (
    <Card>
      <CardBody>
        <h5 className="mb-0" style={{ fontWeight: 700 }}>Social Media Reach</h5>
        <small className="text-mute">Sum of reach by platform (desc)</small>

        {loading ? (
          <div className="text-muted small mt-3">Loading…</div>
        ) : (
          <Row className="g-4">
            {/* Bar chart */}
            <Col xs="12" md="7" className="mt-4">
              <div style={{ width: "100%", height: 360 }}>
                <ResponsiveContainer>
                  <BarChart data={bars} margin={{ top: 10, right: 16, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={fmtInt} width={50} />
                    <Tooltip formatter={(v, n) => [fmtInt(v), n]} />
                    <Legend />
                    <ReferenceLine
                      y={avgOfAvgReach}
                      stroke="#6b7280"
                      strokeDasharray="4 4"
                      label={{ value: `Avg ${fmtInt(avgOfAvgReach)}`, position: "insideTopRight", fill: "#6b7280", fontSize: 12 }}
                    />
                    <Bar dataKey="avgReach" name="Total Reach" radius={[6, 6, 0, 0]}>
                      {bars.map((entry) => (
                        <Cell key={entry.platform} fill={platformToColor[entry.platform]} />
                      ))}
                      <LabelList dataKey="avgReach" position="top" formatter={fmtInt} style={{ fontSize: 11, fill: "#374151", fontWeight: 600 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Col>

            {/* Pie chart */}
            <Col xs="12" md="5" className="mt-4">
              <div style={{ width: "100%", height: 360 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Tooltip formatter={(v, n) => [fmtInt(v), `${n} (reach)`]} />
                    <Legend />
                    <Pie
                      data={pie.data}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pie.data.map((seg) => (
                        <Cell key={seg.name} fill={platformToColor[seg.name]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-muted small mt-2">
                Total reach: <strong>{fmtInt(pie.totalReach)}</strong>
              </div>
            </Col>
          </Row>
        )}
      </CardBody>
    </Card>
  );
}

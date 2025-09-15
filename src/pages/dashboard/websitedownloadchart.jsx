// src/components/WebsiteDownloadsViz.jsx
import React, { useMemo } from "react";
import { Card, CardBody, Row, Col, Badge } from "reactstrap";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  LabelList,
  Legend,
} from "recharts";

function num(n) {
  const x = Number(n) || 0;
  return x.toLocaleString();
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].value;
  return (
    <div
      style={{
        background: "#1f2937",
        color: "white",
        padding: "8px 10px",
        borderRadius: 8,
        boxShadow: "0 6px 16px rgba(0,0,0,.2)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div>Downloads: <strong>{num(d)}</strong></div>
    </div>
  );
}

export default function WebsiteDownloadsViz({ rows = [] }) {
  const data = useMemo(
    () =>
      (rows || [])
        .map((r) => ({ name: r.name, downloads: Number(r.downloads) || 0 }))
        .sort((a, b) => b.downloads - a.downloads),
    [rows]
  );

  const total = useMemo(() => data.reduce((s, d) => s + d.downloads, 0), [data]);
  const avg = useMemo(() => (data.length ? total / data.length : 0), [data, total]);
  const top = data[0] || { name: "—", downloads: 0 };

  return (
    <Card className="shadow-sm">
      <CardBody>
        <Row className="g-3 align-items-center mb-2">
          <Col xs="12" md="6">
            <h5 className="mb-0" style={{ fontWeight: 700 }}>
              Website Downloads Overview
            </h5>
            <small className="text-muted">Sorted by downloads (desc)</small>
          </Col>
          <Col xs="12" md="6">
            <Row className="g-2">
              <Col xs="4">
                <div
                  className="p-2 rounded"
                  style={{ background: "#f3f4f6", textAlign: "center" }}
                >
                  <div className="text-muted small">Total</div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{num(total)}</div>
                </div>
              </Col>
              <Col xs="4">
                <div
                  className="p-2 rounded"
                  style={{ background: "#f3f4f6", textAlign: "center" }}
                >
                  <div className="text-muted small">Average</div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>
                    {num(Math.round(avg))}
                  </div>
                </div>
              </Col>
              <Col xs="4">
                <div
                  className="p-2 rounded"
                  style={{ background: "#f3f4f6", textAlign: "center" }}
                >
                  <div className="text-muted small">Top Item</div>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>
                    <Badge color="primary">{top.name}</Badge>
                  </div>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>

        <div style={{ width: "100%", height: 360 }}>
          {data.length ? (
            <ResponsiveContainer>
              <BarChart
                data={data}
                margin={{ top: 10, right: 18, bottom: 4, left: 0 }}
              >
                <defs>
                  <linearGradient id="wdBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.55} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  height={60}
                  tickFormatter={(t) => (t.length > 14 ? t.slice(0, 14) + "…" : t)}
                />
                <YAxis tickFormatter={num} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <ReferenceLine
                  y={avg}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{
                    value: `Avg ${Math.round(avg)}`,
                    position: "insideTopRight",
                    fill: "#059669",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="downloads" name="Downloads" fill="url(#wdBar)" radius={[6, 6, 0, 0]}>
                  <LabelList
                    dataKey="downloads"
                    position="top"
                    formatter={(v) => num(v)}
                    style={{ fontSize: 12, fill: "#374151", fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted py-5">No data</div>
          )}
        </div>

        <div className="mt-3 small text-muted">
          Tip: hover bars for details. The green line shows the average across items.
        </div>
      </CardBody>
    </Card>
  );
}

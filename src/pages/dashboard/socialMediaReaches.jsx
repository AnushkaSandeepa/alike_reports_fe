import React, { useMemo } from "react";
import { Card, CardBody, CardTitle, Row, Col } from "reactstrap";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from "recharts";

export default function PlatformBySocialType() {
  // ---- Hardcoded rows ----
  const rows = [
    { date: "23/01/2023", platform: "Facebook",     type: "Launch Video",            reach: 177, er: "6%"  },
    { date: "23/01/2023", platform: "Instagram",    type: "Launch Video",            reach: 101, er: "6%"  },
    { date: "23/01/2023", platform: "LinkedIn",     type: "Launch Video",            reach: 227, er: "9%"  },
    { date: "31/01/2023", platform: "e-Newsletter", type: "Promotion",               reach: 309, er: "12%" },
    { date: "02/02/2023", platform: "Facebook",     type: "Project Feature",         reach: 80,  er: "4%"  },
    { date: "09/02/2023", platform: "Facebook",     type: "Project Feature",         reach: 75,  er: "7%"  },
    { date: "16/02/2023", platform: "Facebook",     type: "Project Feature",         reach: 86,  er: "6%"  },
    { date: "23/02/2023", platform: "Facebook",     type: "Project Feature",         reach: 79,  er: "4%"  },
    { date: "28/02/2023", platform: "e-Newsletter", type: "Promotion",               reach: 359, er: "3%"  },
    { date: "02/03/2023", platform: "Facebook",     type: "Project Feature",         reach: 70,  er: "19%" },
    { date: "09/03/2023", platform: "Facebook",     type: "Project Feature",         reach: 51,  er: "0%"  },
    { date: "17/03/2023", platform: "Facebook",     type: "Round Closing Soon Post", reach: 61,  er: "13%" },
  ];

  // ---- Aggregate (bar + pie share), keep a shared color per platform ----
  const { bars, pie, avgOfAvgReach, platformToColor } = useMemo(() => {
    const toPct = (s) => {
      const n = Number(String(s).replace("%", "").trim());
      return Number.isFinite(n) ? n : 0;
    };

    const map = new Map();
    for (const r of rows) {
      const k = r.platform;
      const curr = map.get(k) || { platform: k, posts: 0, sumReach: 0, sumER: 0 };
      curr.posts += 1;
      curr.sumReach += Number(r.reach) || 0;
      curr.sumER += toPct(r.er);
      map.set(k, curr);
    }

    const arr = [...map.values()].map((g) => ({
      platform: g.platform,
      posts: g.posts,
      sumReach: g.sumReach,
      avgReach: g.posts ? Math.round(g.sumReach / g.posts) : 0,
      avgER: g.posts ? +(g.sumER / g.posts).toFixed(1) : 0,
    }));

    // sort bars by avgReach desc
    arr.sort((a, b) => b.avgReach - a.avgReach);

    // consistent colors per platform (same for bar + pie)
    const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#0ea5e9", "#8b5cf6", "#14b8a6"];
    const platformToColor = {};
    arr.forEach((d, i) => (platformToColor[d.platform] = COLORS[i % COLORS.length]));

    // pie data in the SAME order as bars (so colors align)
    const pieData = arr.map((d) => ({ name: d.platform, value: d.sumReach }));

    const avgAvgReach = arr.length ? Math.round(arr.reduce((s, d) => s + d.avgReach, 0) / arr.length) : 0;

    return {
      bars: arr,
      pie: { data: pieData, totalReach: arr.reduce((s, d) => s + d.sumReach, 0) },
      avgOfAvgReach: avgAvgReach,
      platformToColor,
    };
  }, []);

  const fmtInt = (v) => (Number(v) || 0).toLocaleString();

  return (
    <Card>
      <CardBody>
        {/* <CardTitle className="mb-3">Platform Performance</CardTitle> */}
        <h5 className="mb-0" style={{ fontWeight: 700 }}>
            Social Media Marketing 
        </h5>
        <small className="text-mute">Sorted by reached count (desc)</small>
        <Row className="g-4">
          {/* Left: Bar chart (Avg Reach per platform) */}
          <Col xs="12" md="7" className="mt-5">
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
                  <Bar dataKey="avgReach" name="Avg Reach" radius={[6, 6, 0, 0]}>
                    {bars.map((entry) => (
                      <Cell key={entry.platform} fill={platformToColor[entry.platform]} />
                    ))}
                    <LabelList dataKey="avgReach" position="top" formatter={fmtInt} style={{ fontSize: 11, fill: "#374151", fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Col>

          {/* Right: Pie chart (Share of TOTAL Reach by platform) */}
          <Col xs="12" md="5">
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
      </CardBody>
    </Card>
  );
}

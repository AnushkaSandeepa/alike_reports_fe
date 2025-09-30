// components/PlatformBySocialTypeEcharts.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, Row, Col } from "reactstrap";
import ReactEcharts from "echarts-for-react";
import * as echarts from "echarts";

export default function PlatformBySocialTypeEcharts({
  years = [2025],
  months = [1,2,3,4,5,6,7,8,9,10,11,12],
}) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]); // [{ label, totalReach }]

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await window.electronAPI.getSocialReachSummary({ years, months });
      if (!alive) return;
      if (res?.success) setSummary(res.rows || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [years.join(","), months.join(",")]);

  const fmtInt = (v) => (Number(v) || 0).toLocaleString();

  const { categories, values, colors, totalReach, avgReach, palette } = useMemo(() => {
    const palette = ["#6366f1","#10b981","#f59e0b","#ef4444","#0ea5e9","#8b5cf6","#14b8a6"];
    const colors = {};
    const cats   = summary.map((d,i) => {
      colors[d.label] = palette[i % palette.length];
      return d.label;
    });
    const vals   = summary.map(d => d.totalReach || 0);
    const total  = vals.reduce((a,b)=>a+b, 0);
    const avg    = vals.length ? Math.round(total / vals.length) : 0;
    return { categories: cats, values: vals, colors, totalReach: total, avgReach: avg, palette };
  }, [summary]);

  // ----- Bar chart option -----
  const barOption = useMemo(() => ({
    animationDuration: 700,
    grid: { top: 56, left: 8, right: 16, bottom: 40, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#111827",
      borderWidth: 0,
      textStyle: { color: "#fff" },
      formatter: (params) => {
        const p = params?.[0];
        if (!p) return "";
        return `<div><div style="font-weight:600;margin-bottom:4px">${p.axisValue}</div>
                <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px;"></span>
                Total Reach: <b>${fmtInt(p.value)}</b></div></div>`;
      }
    },
    xAxis: {
      type: "category",
      data: categories,
      axisTick: { show: false },
      axisLabel: { interval: 0, rotate: categories.length > 6 ? 20 : 0 },
    },
    yAxis: {
      type: "value",
      min: 0,
      boundaryGap: [0, 0.1],
      splitLine: { show: true, lineStyle: { type: "dashed" } },
      axisLabel: { formatter: (v) => fmtInt(v) },
    },
    toolbox: {
      right: 8,
      feature: { dataZoom: { yAxisIndex: "none" }, restore: {}, saveAsImage: {} },
    },
    series: [{
      name: "Total Reach",
      type: "bar",
      data: values,
      barWidth: 26,
      itemStyle: {
        borderRadius: [6,6,0,0],
        color: (p) => colors[categories[p.dataIndex]],
      },
      label: {
        show: true, position: "top",
        formatter: ({ value }) => fmtInt(value),
        fontSize: 11, color: "#374151", fontWeight: 600,
      },
      // Average line:
      markLine: {
        symbol: "none",
        lineStyle: { type: "dashed", color: "#6b7280" },
        label: {
          formatter: () => `Avg ${fmtInt(avgReach)}`,
          color: "#6b7280", fontSize: 12,
        },
        data: [{ yAxis: avgReach }],
      },
    }],
  }), [categories, values, colors, avgReach]);

  // ----- Pie (donut) option -----
  const pieData = useMemo(
    () => summary.map(d => ({ name: d.label, value: d.totalReach })),
    [summary]
  );

  const pieOption = useMemo(() => ({
    animationDuration: 700,
    legend: { top: 8, orient: "horizontal" },
    tooltip: {
      trigger: "item",
      backgroundColor: "#111827",
      borderWidth: 0,
      textStyle: { color: "#fff" },
      formatter: ({ name, value, percent }) =>
        `<div><div style="font-weight:600;margin-bottom:4px">${name}</div>
         <div>Reach: <b>${fmtInt(value)}</b></div>
         <div>Share: <b>${percent}%</b></div></div>`
    },
    series: [{
      type: "pie",
      radius: ["48%","72%"],
      center: ["50%","55%"],
      avoidLabelOverlap: true,
      labelLine: { show: false },
      label: {
        show: true,
        formatter: ({ name, percent }) => `${name}: ${percent}%`,
        fontSize: 12,
      },
      itemStyle: {
        color: (p) => {
          const name = pieData[p.dataIndex]?.name;
          return (name && colors[name]) || palette[p.dataIndex % palette.length];
        }
      },
      data: pieData,
    }],
    graphic: [
      {
        type: "text",
        left: "center",
        top: "middle",
        style: {
          text: `Total\n${fmtInt(totalReach)}`,
          textAlign: "center",
          fill: "#374151",
          fontSize: 14,
          fontWeight: 600,
        }
      }
    ]
  }), [pieData, colors, palette, totalReach]);

  return (
    <Card>
      <CardBody>
        <h5 className="mb-0" style={{ fontWeight: 700 }}>Social Media Reach</h5>
        <small className="text-mute">Sum of reach by platform (desc)</small>

        {loading ? (
          <div className="text-muted small mt-3">Loading…</div>
        ) : (
          <Row className="g-4 mt-3">
            <Col xs="12" md="7">
              <div style={{ width: "100%", height: 360 }}>
                <ReactEcharts option={barOption} echarts={echarts} style={{ height: "100%" }} />
              </div>
            </Col>
            <Col xs="12" md="5">
              <div style={{ width: "100%", height: 360 }}>
                <ReactEcharts option={pieOption} echarts={echarts} style={{ height: "100%" }} />
              </div>
              <div className="text-muted small mt-2">
                Total reach: <strong>{fmtInt(totalReach)}</strong>
              </div>
            </Col>
          </Row>
        )}
      </CardBody>
    </Card>
  );
}

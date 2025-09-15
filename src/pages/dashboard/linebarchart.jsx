import React from "react";
import ReactEcharts from "echarts-for-react";
import * as echarts from "echarts";

const LineBar = () => {
  const months = ["July", "August", "September", "October", "November", "December"];
  const followers = [2500, 2600, 550, 2600, 2650, 1700];
  const reach     = [2100, 1800, 4300, 2400, 1600, 1100];
  const engagement= [270, 230, 620, 420, 390, 80];

  const options = {
    animationDuration: 700,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#111827",
      borderWidth: 0,
      textStyle: { color: "#fff" },
      formatter: (params) =>
        params
          .map(p => {
            const val = Number(p.value).toLocaleString();
            return `<div style="margin:2px 0;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px;"></span>${p.seriesName}: <b>${val}</b></div>`;
          })
          .join("")
    },
    legend: {
      top: 0,
      itemWidth: 14,
      itemHeight: 10,
      textStyle: { fontSize: 12 },
      data: ["Followers", "Post Reach", "Post Engagement"]
    },
    grid: { top: 48, left: 8, right: 16, bottom: 20, containLabel: true },
    xAxis: {
      type: "category",
      data: months,
      axisTick: { show: false },
      axisLabel: { interval: 0, rotate: 0 }
    },
    yAxis: [
      {
        type: "value",
        name: "Users",
        splitLine: { show: true, lineStyle: { type: "dashed" } }
      },
      {
        type: "value",
        name: "Engagement",
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: "Followers",
        type: "bar",
        data: followers,
        barWidth: 18,
        z: 3,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#6366F1" },
            { offset: 1, color: "rgba(99,102,241,0.55)" }
          ])
        },
        
      },
      {
        name: "Post Reach",
        type: "bar",
        data: reach,
        barWidth: 18,
        z: 2,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#60A5FA" },
            { offset: 1, color: "rgba(96,165,250,0.45)" }
          ])
        },
      },
      {
        name: "Post Engagement",
        type: "line",
        yAxisIndex: 1,
        data: engagement,
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        lineStyle: { width: 3, color: "#10B981" },
        itemStyle: { color: "#10B981", borderWidth: 2, borderColor: "#fff" },
        areaStyle: {
          opacity: 0.15,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#10B981" },
            { offset: 1, color: "rgba(16,185,129,0)" }
          ])
        },
        markLine: {
          symbol: "none",
          lineStyle: { type: "dashed", color: "#10B981" },
          label: {
            formatter: ({ value }) => `Avg ${Math.round(value)}`,
            color: "#059669",
            fontSize: 12
          },
          data: [{ type: "average", name: "Avg" }]
        }
      }
    ]
  };

  return <ReactEcharts style={{ height: 360 }} option={options} theme="light" />;
};

export default LineBar;

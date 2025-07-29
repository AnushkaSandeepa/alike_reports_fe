import React from "react";
import ReactEcharts from "echarts-for-react";
import getChartColorsArray from "@/components/Common/ChartsDynamicColor";

const LineBar = ({}) => {

  const options = {
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: ["Followers", "Post Reach", "Post Engagement"],
    },
    xAxis: {
      type: "category",
      data: ["July", "August", "September", "October", "November", "December"],
    },
    yAxis: [
      {
        type: "value",
        name: "Users",
      },
      {
        type: "value",
        name: "Engagement",
      },
    ],
    series: [
      {
        name: "Followers",
        type: "bar",
        data: [2500, 2600, 550, 2600, 2650, 1700],
        itemStyle: {
          color: "#3B82F6" // Blue
        },
      },
      {
        name: "Post Reach",
        type: "bar",
        data: [2100, 1800, 4300, 2400, 1600, 1100],
        itemStyle: {
          color: "#BDBDBD" // Light gray
        },
      },
      {
        name: "Post Engagement",
        type: "line",
        yAxisIndex: 1,
        data: [270, 230, 620, 420, 390, 80],
        lineStyle: {
          color: "#60A5FA", // Line color
          width: 3,
        },
        symbol: "circle",
        symbolSize: 8,
      },
    ],
    grid: {
      left: "10%",
      right: "10%",
      bottom: "10%",
      containLabel: true,
    },
     
  }


  return (
    <React.Fragment>
      <ReactEcharts style={{ height: "350px" }} option={options} theme="light" />
    </React.Fragment>
  );
};

export default LineBar;

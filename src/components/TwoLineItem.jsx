import React from "react";
export default function TwoLineItem({
  title,
  subtitle,
  titleStyle = {},
  subtitleStyle = {},
}) {
  return (
    <div className="text-start">
      <div
        className="fw-bold opacity-80"
        style={{ color: "#374957", ...titleStyle }}
      >
        {title}
      </div>
      <div style={{ ...subtitleStyle }}>{subtitle}</div>
    </div>
  );
}

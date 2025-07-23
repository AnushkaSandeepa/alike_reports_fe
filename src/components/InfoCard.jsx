import React from "react";
import { Col, Row } from "reactstrap";
import { Avatar, Stack } from "rsuite";
export default function InfoCard({ icon, title, body }) {
  return (
    <Stack spacing={16} className="ms-5">
      <Avatar size="lg" circle style={{ background: "white", color: "black" }}>
        {icon}
      </Avatar>
      <Stack.Item grow={1} className="d-flex align-items-center">
        <div className="fw-bold" style={{ fontSize: "12px", color: "white" }}>
          {title}
        </div>
        <div style={{ fontSize: "30px", color: "white" }} className="ms-5">{body}</div>
      </Stack.Item>
    </Stack>
  );
}

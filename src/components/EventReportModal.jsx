import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ReactApexChart from "react-apexcharts";
import { Col, Row } from "reactstrap";

const ViewReportModal = ({ isOpen, onClose, data, size = "xl" }) => {
  const contentRef = useRef(null);
  const [hiddenIndexes, setHiddenIndexes] = useState([]);

  const modalWidths = {
    sm: "540px",
    md: "720px",
    lg: "960px",
    xl: "1140px",
    xxl: "1320px",
  };
  const width = modalWidths[size] || "720px";

  const handleDownloadAsImage = async () => {
    if (!contentRef.current) return;
    const canvas = await html2canvas(contentRef.current);
    const link = document.createElement("a");
    const fileName = `${data?.spreadsheet_name || "report-summary"}.png`;
    link.download = fileName;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleDownloadAsPDF = async () => {
    if (!contentRef.current) return;
    const canvas = await html2canvas(contentRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    const fileName = `${data?.spreadsheet_name || "report-summary"}.pdf`;
    pdf.save(fileName);
  };

  if (!data) return null;

  // --- safe number helpers ---
  const toNum = (x) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : null; // null if missing/NaN
  };
  const fmt = (n, d = 1) => (n === null ? "" : n.toFixed(d));

  // pull values safely (don’t default to 0 if you want “missing” detection)
  const pre = toNum(data?.confidence_data?.pre_percent);
  const post = toNum(data?.confidence_data?.post_percent);
  const increase = toNum(
    data?.confidence_data?.increase_percent ??
      (pre !== null && post !== null ? post - pre : null)
  );
  const satisfaction = toNum(data?.confidence_data?.satisfaction_rate);

  const hasStats = [pre, post, increase, satisfaction].some((v) => v !== null);

  // --- ApexCharts: series + options (guarded) ---
  const series =
    pre !== null && post !== null
      ? [{ name: "Confidence Level", data: [pre, post] }]
      : [];

  const chartOptions = {
    chart: { type: "bar", height: 350, toolbar: { show: false } },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
        endingShape: "rounded",
        distributed: true,
      },
    },
    dataLabels: { enabled: true, formatter: (val) => `${val}%` },
    xaxis: { categories: ["Pre-Workshop", "Post-Workshop"] },
    yaxis: { max: 100, title: { text: "Confidence Level (%)" } },
    colors: ["#ff2949ff", "#00d17aff"],
    annotations:
      post !== null && increase !== null
        ? {
            yaxis: [
              {
                y: post,
                borderColor: "#008FFB",
                label: {
                  text: `+${fmt(increase)}% confidence increment`,
                  style: { background: "#008FFB", color: "#fff" },
                },
              },
            ],
          }
        : {},
  };

  // --- Satisfaction (radial) ---
  const satisfactionOptions = {
    chart: { type: "radialBar" },
    plotOptions: {
      radialBar: {
        hollow: { size: "65%" },
        dataLabels: {
          name: { show: true, fontSize: "16px" },
          value: {
            show: true,
            fontSize: "22px",
            formatter: (val) => `${val}%`,
          },
        },
      },
    },
    labels: ["Satisfaction"],
    colors: ["#00E396"],
  };
  const satisfactionSeries = satisfaction !== null ? [satisfaction] : [];

  // --- Donut: satisfaction counts (% share) ---
  const satisfactionCounts = data?.satisfaction_counts || {};
  const donutLabelsRaw = Object.keys(satisfactionCounts);
  const donutCountsRaw = Object.values(satisfactionCounts);

  const donutCounts = donutCountsRaw
    .map((c) => Number(c))
    .filter((n) => Number.isFinite(n) && n >= 0);

  const donutLabels = donutLabelsRaw.slice(0, donutCounts.length);
  const totalCount = donutCounts.reduce((a, b) => a + b, 0);
  const donutSeries =
    totalCount > 0 ? donutCounts.map((c) => (c / totalCount) * 100) : [];

  const donutOptions = {
    chart: { type: "donut" },
    labels: donutLabels,
    plotOptions: { pie: { donut: { size: "60%" } } },
    tooltip: {
      y: {
        formatter: (val, opts) => {
          const count = donutCounts[opts.seriesIndex] ?? 0;
          return `${(Number(val) || 0).toFixed(1)}% (${count} votes)`;
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${(Number(val) || 0).toFixed(1)}%`,
    },
    colors: ["#00E396", "#FEB019", "#008FFB", "#775DD0", "#f73939ff"],
    legend: { position: "bottom" },
  };

  const toggleFeedbackVisibility = (index) => {
    setHiddenIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Workshop Report"
      style={{
        overlay: { zIndex: 9999, backgroundColor: "rgba(0, 0, 0, 0.5)" },
        content: {
          width: "90%",
          maxWidth: width,
          margin: "auto",
          padding: "0",
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          maxHeight: "800px",
        },
      }}
    >
      <div
        className="modal-header"
        style={{
          padding: "15px",
          background: "#f5f5f5",
          borderBottom: "1px solid #ddd",
        }}
      >
        <h5 className="modal-title">
          Summary for {data?.spreadsheet_name}
        </h5>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          &times;
        </button>
      </div>

      <div ref={contentRef} className="modal-body" style={{ padding: "20px 50px" }}>
        <Row>
          {/* Bar chart */}
          {data.program_type === "workshop" && series.length > 0 && (
            <Col xs={12} md={6}>
              <div style={{ maxWidth: "600px", margin: "auto" }}>
                <ReactApexChart options={chartOptions} series={series} type="bar" />
              </div>
            </Col>
          )}

          {/* Donut for Satisfaction Counts */}
          {donutSeries.length > 0 && (
            <Col
              xs={12}
              md={6}
              style={{ display: "flex", flexDirection: "column", marginTop: "30px" }}
            >
              <ReactApexChart
                options={donutOptions}
                series={donutSeries}
                type="donut"
                height={300}
              />
            </Col>
          )}

          {/* Radial Bar for Satisfaction Rate */}
          {satisfactionSeries.length > 0 && (
            <Col
              xs={12}
              md={6}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: data.program_type === "networking_events" ? "50px" : "20px",
              }}
            >
              <div style={{ margin: "0 auto" }}>
                <ReactApexChart
                  options={satisfactionOptions}
                  series={satisfactionSeries}
                  type="radialBar"
                  height={190}
                />
              </div>
            </Col>
          )}
        </Row>

        {/* Statistics */}
        {hasStats && (
          <div style={{ marginTop: "40px" }}>
            {pre !== null && (
              <p>
                <strong>Average pre-workshop confidence level:</strong> {fmt(pre)}%
              </p>
            )}
            {post !== null && (
              <p>
                <strong>Average post-workshop confidence level:</strong> {fmt(post)}%
              </p>
            )}
            {increase !== null && (
              <p>
                <strong>Confidence level increase:</strong> {fmt(increase)}%
              </p>
            )}
            {satisfaction !== null && (
              <p>
                <strong>Workshop satisfaction rate:</strong> {fmt(satisfaction)}%
              </p>
            )}
          </div>
        )}

        {/* Participant Feedback */}
        {Array.isArray(data.additional_feedback) &&
          data.additional_feedback.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h6>Participant Feedback:</h6>
              <div style={{ display: "grid", gap: "10px" }}>
                {data.additional_feedback.map(
                  (c, i) =>
                    !hiddenIndexes.includes(i) && (
                      <div
                        key={i}
                        style={{
                          background: "#f9f9f9",
                          padding: "10px 15px",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span
                            style={{ fontSize: "18px", marginRight: "20px", cursor: "pointer" }}
                            title="Click to hide this comment"
                            onClick={() => toggleFeedbackVisibility(i)}
                          >
                            💬
                          </span>
                          <span>{c}</span>
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          )}
      </div>

      <div
        className="modal-footer"
        style={{
          padding: "15px",
          background: "#f5f5f5",
          borderTop: "1px solid #ddd",
          textAlign: "right",
        }}
      >
        <button className="btn btn-outline-primary me-2" onClick={handleDownloadAsImage}>
          Download as Image
        </button>
        <button className="btn btn-outline-danger me-2" onClick={handleDownloadAsPDF}>
          Download as PDF
        </button>
        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
};

ViewReportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.object,
  size: PropTypes.string,
};

export default ViewReportModal;

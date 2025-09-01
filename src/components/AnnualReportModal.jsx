import React, { useRef } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ReactApexChart from "react-apexcharts";

const ViewAnnualReportModal = ({ isOpen, onClose, data, size = "xl" }) => {
  const contentRef = useRef(null);

  // ----- Helpers -----
  const toPct = (n) =>
    typeof n === "number" && isFinite(n) ? Math.round(n * 100) / 100 : null;

  // Guard: if no data yet
  if (!data) return null;

  // Shape we expect (from your sample)
  const {
    reportType,
    start_date,
    end_date,
    generated_date,
    included_report_ids = [],
    counts = {},
    aggregates = {},
    periodReportId,
  } = data;

  // Pull aggregates safely
  const ne = aggregates.networking_events || {};
  const ws = aggregates.workshop || {};
  const ov = aggregates.overall || {};

  const networkingSatisfaction = toPct(ne.avg_satisfaction_percent);
  const workshopPre = toPct(ws.avg_pre_percent);
  const workshopPost = toPct(ws.avg_post_percent);
  const workshopIncrease = toPct(ws.avg_increase_percent);
  const workshopSatisfaction = toPct(ws.avg_satisfaction_percent);
  const overallSatisfaction = toPct(ov.avg_satisfaction_percent);

  // Chart 1: Networking Satisfaction (single bar if present)
  const networkingSeries = [
    {
      name: "Avg Satisfaction",
      data: networkingSatisfaction != null ? [networkingSatisfaction] : [],
    },
  ];
  const networkingOptions = {
    chart: { type: "bar", toolbar: { show: false } },
    plotOptions: {
      bar: { horizontal: false, columnWidth: "50%", endingShape: "rounded" },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val}%`,
    },
    xaxis: {
      categories: ["Networking Satisfaction"],
    },
    yaxis: { max: 100, title: { text: "Percentage (%)" } },
  };

  // Chart 2: Workshop metrics (up to four bars if present)
  const workshopCategories = [];
  const workshopData = [];
  if (workshopPre != null) { workshopCategories.push("Workshop Pre"); workshopData.push(workshopPre); }
  if (workshopPost != null) { workshopCategories.push("Workshop Post"); workshopData.push(workshopPost); }
  if (workshopIncrease != null) { workshopCategories.push("Workshop Increase"); workshopData.push(workshopIncrease); }
  if (workshopSatisfaction != null) { workshopCategories.push("Workshop Satisfaction"); workshopData.push(workshopSatisfaction); }

  // Derive numbers for the chart (fallbacks keep the chart stable)
  const pre = Number.isFinite(workshopPre) ? workshopPre : 0;
  const post = Number.isFinite(workshopPost) ? workshopPost : 0;
  const increase = Number.isFinite(workshopIncrease) ? workshopIncrease : (post - pre);

  // The series used by the Pre/Post bar chart
  const confidenceSeries = [{ name: "Confidence", data: [workshopPre , workshopPost] }];


  const workshopSeries = [{ name: "Workshop", data: workshopData }];
  const confidenceOptions = {
    chart: { type: "bar", height: 350, toolbar: { show: false } },
    plotOptions: {
      bar: { horizontal: false, columnWidth: "50%", endingShape: "rounded", distributed: true }
    },
    dataLabels: { enabled: true, formatter: (val) => `${val}%` },
    xaxis: { categories: ["Pre-Workshop", "Post-Workshop"] },
    yaxis: { max: 100, title: { text: "Confidence Level (%)" } },
    colors: ["#ff2949ff", "#00d17aff"],
    annotations: {
      yaxis: [
        {
          y: workshopPost,
          borderColor: "#008FFB",
          label: {
            text: `+${increase.toFixed(1)}% confidence increment`,
            style: { background: "#008FFB", color: "#fff" }
          }
        }
      ]
    }
  };

  // Downloads
  const handleDownloadAsImage = async () => {
    if (!contentRef.current) return;
    const canvas = await html2canvas(contentRef.current);
    const link = document.createElement("a");
    link.download = `period-report-${periodReportId || "summary"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleDownloadAsPDF = async () => {
    if (!contentRef.current) return;
    const canvas = await html2canvas(contentRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
    const imgW = imgProps.width * ratio;
    const imgH = imgProps.height * ratio;
    const x = (pageWidth - imgW) / 2;
    const y = 20;
    pdf.addImage(imgData, "PNG", x, y, imgW, imgH);
    pdf.save(`period-report-${periodReportId || "summary"}.pdf`);
  };

  const makeRadialOptions = (label, color) => ({
    chart: { type: "radialBar" },
    plotOptions: {
      radialBar: {
        hollow: { size: "65%" },
        dataLabels: {
          name: { show: true, fontSize: "14px", offsetY: 0 },
          value: { show: true, fontSize: "22px", formatter: (val) => `${val}%` },
        },
      },
    },
    labels: [label],
    colors: [color],
  });

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Period Report"
      style={{
        overlay: { zIndex: 9999, backgroundColor: "rgba(0,0,0,0.5)" },
        content: {
          width: "90%",
          maxWidth: "1000px",
          margin: "auto",
          padding: 0,
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        },
      }}
    >
      {/* Header */}
      <div
        className="modal-header"
        style={{ padding: 15, background: "#f5f5f5", borderBottom: "1px solid #ddd" }}
      >
        <div>
          <h5 className="modal-title" style={{ marginBottom: 4 }}>
            Period Report {periodReportId ? `— ${periodReportId}` : ""}
          </h5>
          <div className="small text-muted">
            Range: <strong>{start_date}</strong> to <strong>{end_date}</strong> &middot; Generated on: {generated_date}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: "transparent", border: "none", fontSize: 18, cursor: "pointer" }}
          aria-label="Close"
        >
          &times;
        </button>
      </div>

      {/* Body */}
      <div ref={contentRef} className="modal-body" style={{ padding: 20, overflowY: "auto" }}>
        {/* High-level counts */}
        <div className="row g-3" style={{ marginBottom: 12 }}>
          <div className="col-auto">
            <div className="badge bg-success-subtle text-success  p-2">
              Total Reports: <strong>{counts.total_reports ?? 0}</strong>
            </div>
          </div>
          <div className="col-auto">
            <div className="badge  bg-primary-subtle text-primary p-2">
              Networking: <strong>{counts.networking_events ?? 0}</strong>
            </div>
          </div>
          <div className="col-auto">
            <div className="badge bg-warning-subtle text-warning p-2">
              Workshops: <strong>{counts.workshops ?? 0}</strong>
            </div>
          </div>
        </div>

        {/* Included report IDs */}
        <div style={{ marginBottom: 20 }}>
          <h6 className="mb-2">Included report IDs</h6>
          <div style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
            {included_report_ids && included_report_ids.length
              ? included_report_ids.join(", ")
              : "—"}
          </div>
        </div>


        <div className="row g-3 mt-3">
          <h6 className="mb-2">Satisfaction</h6>
          {overallSatisfaction != null && (
            <div className="col-md-3 col-6 d-flex justify-content-center">
              <ReactApexChart
                options={makeRadialOptions("Overall", "#00E396")}
                series={[overallSatisfaction]}
                type="radialBar"
                height={190}
              />    
            </div>  
          )}

          {networkingSatisfaction != null && (
            <div className="col-md-3 col-6 d-flex justify-content-center">
              <ReactApexChart
                options={makeRadialOptions("Networking", "#008FFB")}
                series={[networkingSatisfaction]}
                type="radialBar"
                height={190}
              />
            </div>
          )}

          {workshopSatisfaction != null && (
            <div className="col-md-3 col-6 d-flex justify-content-center">
              <ReactApexChart
                options={makeRadialOptions("Workshop", "#FEB019")}
                series={[workshopSatisfaction]}
                type="radialBar"
                height={190}
              />
            </div>
          )}
        </div>

        <h6 className="mb-2">Overall Workshop Confidence (Pre vs Post)</h6>
        {workshopPre != null && workshopPost != null && (
          <div style={{ maxWidth: 800, margin: "20px auto" }}>
            <ReactApexChart
              options={confidenceOptions}
              series={confidenceSeries}
              type="bar"
              height={350}
            />
          </div>
        )}

        {/* Quick numeric summary (useful alongside charts) */}
        <div style={{ marginTop: 24 }}>
          <div className="row g-3">
            {networkingSatisfaction != null && (
              <div className="col-md-3 col-6">
                <div className="p-3 border rounded">
                  <div className="small text-muted">Networking Satisfaction</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {networkingSatisfaction}%
                  </div>
                </div>
              </div>
            )}
            {workshopSatisfaction != null && (
              <div className="col-md-3 col-6">
                <div className="p-3 border rounded">
                  <div className="small text-muted">Workshop Satisfaction</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{workshopSatisfaction}%</div>
                </div>
              </div>
            )}
            {workshopPre != null && (
              <div className="col-md-3 col-6">
                <div className="p-3 border rounded">
                  <div className="small text-muted">Workshop Pre</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{workshopPre}%</div>
                </div>
              </div>
            )}
            {workshopPost != null && (
              <div className="col-md-3 col-6">
                <div className="p-3 border rounded">
                  <div className="small text-muted">Workshop Post</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{workshopPost}%</div>
                </div>
              </div>
            )}
            {workshopIncrease != null && (
              <div className="col-md-3 col-6">
                <div className="p-3 border rounded">
                  <div className="small text-muted">Workshop Increase</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{workshopIncrease}%</div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="modal-footer"
        style={{ padding: 15, background: "#f5f5f5", borderTop: "1px solid #ddd", textAlign: "right" }}
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

ViewAnnualReportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.shape({
    reportType: PropTypes.string,
    start_date: PropTypes.string,
    end_date: PropTypes.string,
    generated_date: PropTypes.string,
    included_report_ids: PropTypes.arrayOf(PropTypes.string),
    counts: PropTypes.object,
    aggregates: PropTypes.shape({
      networking_events: PropTypes.object,
      workshop: PropTypes.object,
    }),
    periodReportId: PropTypes.string,
  }),
  size: PropTypes.string,
};

export default ViewAnnualReportModal;

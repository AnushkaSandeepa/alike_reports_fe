import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ReactApexChart from "react-apexcharts";


const ViewAnnualReportModal = ({ isOpen, onClose, data, size = "xl" }) => {
  const contentRef = useRef(null);

  const modalWidths = {
    sm: "540px",
    md: "720px",
    lg: "960px",
    xl: "1140px",
    xxl: "1320px"
  };

  const width = modalWidths[size] || "720px";

  const handleDownloadAsImage = async () => {
    const canvas = await html2canvas(contentRef.current);
    const link = document.createElement("a");
    link.download = "report-summary.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleDownloadAsPDF = async () => {
    const canvas = await html2canvas(contentRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("report-summary.pdf");
  };

  if (!data) return null;

  // Fallback or dynamic stats from `data`
  const stats = data?.feedback || {
    satisfaction: 83,
    connected: 80,
    equipped: 78
  };

  const chartOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
        endingShape: 'rounded',
        distributed: true
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val}%`
    },
    xaxis: {
      categories: [
        'Networking Satisfaction',
        'Felt More Connected',
        'Felt More Equipped'
      ]
    },
    yaxis: {
      max: 100,
      title: {
        text: 'Percentage (%)'
      }
    },
    colors: ['#008FFB', '#00E396', '#FEB019']
  };

  const series = [
    {
      name: "Feedback Score",
      data: [stats.satisfaction, stats.connected, stats.equipped]
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Annual Networking Report"
      style={{
        overlay: {
          zIndex: 9999,
          backgroundColor: "rgba(0, 0, 0, 0.5)"
        },
        content: {
          width: "90%",
          maxWidth: "900px",
          margin: "auto",
          padding: "0",
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          maxHeight: "800px",
        }
      }}
    >
      {/* Header */}
      <div
        className="modal-header"
        style={{
          padding: "15px",
          background: "#f5f5f5",
          borderBottom: "1px solid #ddd"
        }}
      >
        <h5 className="modal-title">Networking Session Feedback</h5>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            fontSize: "18px",
            cursor: "pointer"
          }}
        >
          &times;
        </button>
      </div>

      {/* Body */}
      <div ref={contentRef} className="modal-body" style={{ padding: "20px" }}>
        {/* Bar Chart */}
        <div style={{ maxWidth: "700px", margin: "auto" }}>
          <ReactApexChart
            options={chartOptions}
            series={series}
            type="bar"
            height={350}
          />
        </div>

        {/* Statistics */}
        <div style={{ marginTop: "30px" }}>
          <p>
            <strong>Networking Satisfaction Rate:</strong>{" "}
            {stats.satisfaction}%
          </p>
          <p>
            <strong>Felt More Connected:</strong> {stats.connected}%
          </p>
          <p>
            <strong>Felt More Equipped:</strong> {stats.equipped}%
          </p>
        </div>

        {/* Comments */}
        <div style={{ marginTop: "20px" }}>
            <h6>Comments:</h6>
            <ul>
                <li>“I found the conflict resolution hints and tips most valuable”</li>
                <li>“An interesting, informative workshop!”</li>
            </ul>
        </div>

      </div>

      {/* Footer */}
      <div
        className="modal-footer"
        style={{
          padding: "15px",
          background: "#f5f5f5",
          borderTop: "1px solid #ddd",
          textAlign: "right"
        }}
      >
        <button
          className="btn btn-outline-primary me-2"
          onClick={handleDownloadAsImage}
        >
          Download as Image
        </button>
        <button
          className="btn btn-outline-danger me-2"
          onClick={handleDownloadAsPDF}
        >
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
  data: PropTypes.object, // should contain a `feedback` field
  size: PropTypes.string
};

export default ViewAnnualReportModal;

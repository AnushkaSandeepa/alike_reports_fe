import React, { useRef } from "react"; 
import PropTypes from "prop-types";
import Modal from "react-modal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ReactApexChart from "react-apexcharts";
import { Col, Row } from "reactstrap";

const ViewReportModal = ({ isOpen, onClose, data, size = "xl" }) => {
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

  // ✅ Safely extract confidence data
  const confidence = data;
  if (!confidence) {
    return (
      <Modal isOpen={isOpen} onRequestClose={onClose}>
        <div style={{ padding: "20px", color: "red" }}>
          <h5>⚠️ There is an issue in data mapping</h5>
          <p>Please contact administration / developer team to sort out the issue.</p>
          <button onClick={onClose}>Close</button>
          
        </div>
      </Modal>
    );
  }

  // Extract values safely from data.confidence_data
  const pre = data?.confidence_data?.pre_percent ?? 0;
  const post = data?.confidence_data?.post_percent ?? 0;
  const increase = data?.confidence_data?.increase_percent ?? 0;
  const satisfaction = data?.confidence_data?.satisfaction_rate ?? 0;

  const chartOptions = {
    chart: { type: "bar", height: 350, toolbar: { show: false } },
    plotOptions: {
        bar: { horizontal: false, columnWidth: "50%", endingShape: "rounded", distributed: true }
      },
    dataLabels: { enabled: true, formatter: (val) => `${val}%` },
    xaxis: { categories: ["Pre-Workshop", "Post-Workshop"] },
    yaxis: { max: 100, title: { text: "Confidence Level (%)" } },
    colors: ["#ff2949ff", "#00d17aff"],
    annotations: {
    yaxis: [{
      y: post,
      borderColor: '#008FFB',
      label: {
        text: `+${increase.toFixed(1)}% confidence increment`,
        style: { background: '#008FFB', color: "#fff" }
      }
    }]
    }
  };

  // Satisfaction Radial Chart
  const satisfactionOptions = {
    chart: { type: "radialBar" },
    plotOptions: {
      radialBar: {
        hollow: { size: "65%" },
        dataLabels: {
          name: {
            show: true,
            fontSize: "16px",
          },
          value: {
            show: true,
            fontSize: "22px",
            formatter: (val) => `${val}%`,
          },
        },
      },
    },
    labels: ["Satisfaction"],
    colors: ["#00E396"], // green theme
  };

const satisfactionCounts = data.satisfaction_counts || {};
const donutLabels = Object.keys(satisfactionCounts);
const donutCounts = Object.values(satisfactionCounts);
const totalCount = donutCounts.reduce((a, b) => a + b, 0);
const donutSeries = donutCounts.map(count => (count / totalCount * 100)); // % for chart

const donutOptions = {
  chart: { type: "donut" },
  labels: donutLabels,
  plotOptions: {
    pie: { donut: { size: "60%" } },
  },
  tooltip: {
    y: {
      formatter: (val, opts) => {
        const count = donutCounts[opts.seriesIndex];
        return `${val.toFixed(1)}% (${count} votes)`; // safe tooltip
      }
    }
  },
  dataLabels: {
    enabled: true,
    formatter: (val) => `${val.toFixed(1)}%`, // show % on slices
  },
  colors: ["#00E396", "#FEB019", "#008FFB", "#775DD0", "#f73939ff"], // fixed colors
  legend: { position: "bottom" },
};





  const satisfactionSeries = [data.confidence_data.satisfaction_rate];
  const series = [{ name: "Confidence Level", data: [pre, post] }];

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
          maxHeight: "800px"
        }
      }}
    >
      <div className="modal-header" style={{ padding: "15px", background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
        <h5 className="modal-title">{data.spreadsheetName} — Workshop Summary</h5>
        <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: "18px", cursor: "pointer" }}>
          &times;
        </button>
      </div>

      <div ref={contentRef} className="modal-body" style={{ padding: "20px 50px" }}>
        <Row>
          <Col xs={12} md={6}>
            {/* Chart */}
            <div style={{ maxWidth: "600px", margin: "auto" }}>
              <ReactApexChart options={chartOptions} series={series} type="bar"  />
            </div>
          </Col>
          <Col xs={12} md={4} style={{ display: "flex", flexDirection: "column", marginTop: "50px" }}>
            {/* Donut for Satisfaction Counts */}
              <ReactApexChart
                options={donutOptions}
                series={donutSeries}
                type="donut"
              />
          </Col>
          {/* <Col xs={12} md={2} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          
          </Col> */}
          <Col xs={12} md={3} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ margin: "0 auto" }}>
              {/* Radial Bar for Satisfaction Rate */}
              <ReactApexChart
                options={satisfactionOptions}
                series={satisfactionSeries}
                type="radialBar"
                height={190}
              />  
            </div>
          </Col>
        </Row>
        


        


        {/* Statistics */}
        {/* Statistics */}
        <div style={{ marginTop: "20px" }}>
          <p><strong>Average pre-workshop confidence level:</strong> {pre.toFixed(1)}%</p>
          <p><strong>Average post-workshop confidence level:</strong> {post.toFixed(1)}%</p>
          <p><strong>Confidence level increase:</strong> {increase.toFixed(1)}%</p>
          <p><strong>Workshop satisfaction rate:</strong> {satisfaction.toFixed(1)}%</p>
        {/* <div style={{ background: "#f5f5f5", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
          <strong>Average pre-workshop confidence level:</strong> {pre.toFixed(1)}%
        </div> */}
        </div>


        {/* Feedback (optional if exists) */}
        {data.generatedData?.comments?.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h6>Additional feedback:</h6>
            <ul>
              {data.generatedData.comments.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="modal-footer" style={{ padding: "15px", background: "#f5f5f5", borderTop: "1px solid #ddd", textAlign: "right" }}>
        <button className="btn btn-outline-primary me-2" onClick={handleDownloadAsImage}>Download as Image</button>
        <button className="btn btn-outline-danger me-2" onClick={handleDownloadAsPDF}>Download as PDF</button>
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
};

ViewReportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.object,
  size: PropTypes.string
};

export default ViewReportModal;

import React, { useRef } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Bar } from "react-chartjs-2";
import ReactApexChart from "react-apexcharts";

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

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
        categories: ['Pre-Workshop', 'Post-Workshop'],
      },
      yaxis: {
        max: 100,
        title: {
      text: 'Confidence Level (%)'
    }
  },
  colors: ['#FF4560', '#00E396']
};

const series = [
  {
    name: "Confidence Level",
    data: [52, 94]
  }
];


    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            contentLabel="Workshop Report"
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
            <div className="modal-header" style={{ padding: "15px", background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
                <h5 className="modal-title">Workshop Summary</h5>
                <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: "18px", cursor: "pointer" }}>
                    &times;
                </button>
            </div>

            <div ref={contentRef} className="modal-body" style={{ padding: "20px" }}>
                {/* Bar Chart */}
                <div style={{ maxWidth: "600px", margin: "auto" }}>
                  <ReactApexChart
                    options={chartOptions}
                    series={series}
                    type="bar"
                    height={350}
                  />
                </div>


                {/* Statistics */}
                <div style={{ marginTop: "20px" }}>
                    <p><strong>Average pre-workshop confidence level:</strong> 52%</p>
                    <p><strong>Average post-workshop confidence level:</strong> 94%</p>
                    <p><strong>Confidence level increase:</strong> 43%</p>
                    <p><strong>Workshop satisfaction rate:</strong> 92%</p>
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

            <div className="modal-footer" style={{ padding: "15px", background: "#f5f5f5", borderTop: "1px solid #ddd", textAlign: "right" }}>
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
    size: PropTypes.string
};

export default ViewReportModal;

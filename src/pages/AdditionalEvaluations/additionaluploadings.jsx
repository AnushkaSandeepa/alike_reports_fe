import React, { useState } from "react";
import { Card, CardBody, Row, Col, Form } from "reactstrap";
import { FaUpload } from "react-icons/fa";
import ExcelIcon from "../../assets/images/File/Excel.png"; // Update path as needed

const MEDIA_TYPES = [
    { value: "", label: "Select type" },
    { value: "csv", label: "CSV" },
    { value: "excel", label: "Excel" },
];

const AdditionalUploadings = () => {
    const [mediaType, setMediaType] = useState("");
    const [selectedFilePath, setSelectedFilePath] = useState(null);
    const [fileName, setFileName] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const uploadDateLabel = new Date().toLocaleDateString();

    const handlePickFile = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".xlsx,.xls,.csv";
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                setSelectedFilePath(file);
                setFileName(file.name);
            }
        };
        input.click();
    };

    const handleUpload = async () => {
        if (!selectedFilePath) return;
        setIsUploading(true);
        // Simulate upload
        setTimeout(() => {
            setIsUploading(false);
            alert("File uploaded and report generated!");
            setSelectedFilePath(null);
            setFileName(null);
        }, 1500);
    };

    return (
        <Card>
            <CardBody>
                <Form>
                    <Row className="g-3">
                        {/* Media Type */}
                        <h3 className="mb-3">Upload Additional Evaluation Data</h3>
                        <Col md={4}>
                            <h6 className="card-title">
                                Select Media Type <small className="text-danger ms-1">*</small>
                            </h6>
                            <select
                                value={mediaType}
                                className="form-select"
                                onChange={(e) => setMediaType(e.target.value)}
                            >
                                {MEDIA_TYPES.map((pt) => (
                                    <option key={pt.value} value={pt.value}>
                                        {pt.label}
                                    </option>
                                ))}
                            </select>
                        </Col>

                        {/* Upload date (today, read-only) */}
                        <Col md={4}>
                            <h6 className="card-title">Upload Date</h6>
                            <input
                                type="text"
                                className="form-control"
                                value={uploadDateLabel}
                                readOnly
                                aria-label="Upload date"
                            />
                            <small className="text-muted">Auto-filled as today</small>
                        </Col>

                        {/* File picker */}
                        <Col md={12} className="mt-2">
                            <h6 className="card-title">
                                Upload Your CSV/Excel File <small className="text-danger ms-1">*</small>
                            </h6>

                            <div className="d-flex flex-column gap-2">
                                <div
                                    onClick={handlePickFile}
                                    style={{
                                        border: "2px dashed #6c757d",
                                        borderRadius: 6,
                                        padding: 30,
                                        textAlign: "center",
                                        cursor: "pointer",
                                        color: "#164728ff",
                                        backgroundColor: "#e7f3ebff",
                                        transition: "background-color 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e7f3ebff")}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#e7f3ebff")}
                                    title="Click to select a spreadsheet"
                                >
                                    <div style={{ fontSize: 50, marginBottom: 10 }}>
                                        <FaUpload />
                                    </div>
                                    <div style={{ fontSize: 16, fontWeight: 500 }}>
                                        Click to Select File
                                    </div>
                                    <div style={{ fontSize: 12, color: "#164728ff", marginTop: 5 }}>
                                        Only .xlsx, .xls, .csv files are allowed
                                    </div>
                                </div>

                                {fileName && (
                                    <div
                                        className="d-flex align-items-center justify-content-between gap-2 p-2 mt-2"
                                        style={{
                                            border: "1px solid #e7f3ebff",
                                            borderRadius: 6,
                                            backgroundColor: "#e7f3ebff",
                                        }}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            <img src={ExcelIcon} alt="Excel" style={{ width: 34, height: 34 }} />
                                            <span>{fileName}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedFilePath(null);
                                                setFileName(null);
                                            }}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                fontSize: 20,
                                                color: "#dc3545",
                                                cursor: "pointer",
                                                lineHeight: 1,
                                            }}
                                            title="Remove file"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                )}

                                {selectedFilePath && (
                                    <button
                                        type="button"
                                        className="btn btn-alike"
                                        onClick={handleUpload}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? "Uploading..." : "Upload File & Generate Report"}
                                    </button>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Form>
            </CardBody>
        </Card>
    );
};

export default AdditionalUploadings;
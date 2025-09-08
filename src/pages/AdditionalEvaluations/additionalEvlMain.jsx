import React, { useState, useEffect, useMemo } from "react";
import {
  Row, Col, Card, Form, CardBody, Container,
} from "reactstrap";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import "flatpickr/dist/themes/material_blue.css";
import ExcelIcon from "../../assets/images/File/Excel.png";
import { FaUpload } from "react-icons/fa";
import AdditionalUploadings from "./additionaluploadings";
import WebsiteDownloads from "./websiteDounloads";

const MySwal = withReactContent(Swal);

const MEDIA_TYPES = [
  { value: "", label: "Select Type" },
  { value: "fb", label: "Facebook" },
  { value: "ld", label: "LinkedIn" },
];

const AdditionalEvaluations = () => {
  useEffect(() => {
    document.title = "Additional Evaluations | Alike WA";
  }, []);

  const [mediaType, setMediaType] = useState("");
  const [selectedFilePath, setSelectedFilePath] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- Upload date: today, shown read-only ---
  const today = useMemo(() => new Date(), []);
  const fmtISO = (d) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const dayName = (d) =>
    d.toLocaleDateString(undefined, { weekday: "long" }); // respects user locale
  const uploadDateISO = fmtISO(today);
  const uploadDateLabel = `${uploadDateISO} (${dayName(today)})`;

  // --- Pick file (via Electron) ---
  const handlePickFile = async () => {
    try {
      const result = await window.electronAPI.pickSpreadsheet();
      if (!result?.success) return;

      const p = result.filePath;
      const ext = (p.match(/\.[^./\\]+$/)?.[0] || "").toLowerCase();
      const allowed = [".xlsx", ".xls", ".csv"];
      if (!allowed.includes(ext)) {
        await MySwal.fire({
          icon: "warning",
          title: "Unsupported file",
          text: "Only .xlsx, .xls, .csv files are allowed.",
        });
        return;
      }

      setSelectedFilePath(p);
      setFileName(p.split(/[/\\]/).pop());
    } catch (e) {
      console.error(e);
      MySwal.fire({ icon: "error", title: "File picker failed", text: String(e?.message || e) });
    }
  };

  // --- Upload handler ---
  const handleUpload = async () => {
    if (!mediaType || !selectedFilePath) {
      MySwal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Please select media type and file.",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Reuse IPC `storeSpreadsheet` contract:
      // - programType  -> mediaType
      // - programDate  -> uploadDateISO (today)
      // - fundingBody -> null (not applicable here)
      // - dateRange -> nulls (not applicable here)
      const res = await window.electronAPI.storeSpreadsheet({
        sourcePath: selectedFilePath,
        programType: mediaType,
        programDate: uploadDateISO,
        fundingBody: null,
        dateRange: { start: null, end: null },
      });

      if (res?.success) {
        await MySwal.fire({
          icon: "success",
          title: "Upload Successful",
          text: `Saved to: ${res.metadata?.storedAt || "destination folder"}`,
          timer: 2500,
          timerProgressBar: true,
          showConfirmButton: false,
        });

        // Reset form
        setMediaType("");
        setSelectedFilePath(null);
        setFileName(null);
      } else {
        MySwal.fire({
          icon: "error",
          title: "Upload Failed",
          text: res?.error || "Unknown error",
        });
      }
    } catch (err) {
      console.error(err);
      MySwal.fire({ icon: "error", title: "Upload Failed", text: String(err?.message || err) });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Row className="py-3 align-items-center">
          <div className="fs-5" style={{ fontSize: "24px", fontWeight: 700 }}>
            Additional Evaluations
          </div>
        </Row>

        <Row style={{ marginTop: 20 }}>
          <Col className="col-12">
            <AdditionalUploadings/>
          </Col>
        </Row>

        <Row style={{ marginTop: 20 }}>
          <Col sm="12"  lg="6">
            <WebsiteDownloads />
          </Col>
        </Row>  

      </Container>
    </div>
  );
};

export default AdditionalEvaluations;

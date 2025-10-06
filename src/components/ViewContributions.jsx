// src/components/ViewContributions.jsx
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  ModalHeader,
  ModalBody,
  Table as RSTable,
  Spinner,
  Alert,
} from "reactstrap";
import Swal from "sweetalert2";

function ViewContributions({ isOpen, onClose, period }) {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setErrMsg("");
      setPayload(null);

      if (!isOpen || !period?.periodReportId) return;

      if (!window.electronAPI || typeof window.electronAPI.getPeriodContributionById !== "function") {
        setErrMsg("Contributions API not available in this build.");
        return;
      }

      try {
        setLoading(true);
        const resp = await window.electronAPI.getPeriodContributionById(period.periodReportId);
        if (!resp || resp.success !== true) {
          const msg = resp?.error || "Unknown error from main process.";
          setErrMsg(msg);
          return;
        }
        if (mounted) setPayload(resp.data || { contributions: [] });
      } catch (e) {
        console.error(e);
        if (mounted) {
          const msg = e?.message || "Failed to load contributions.";
          setErrMsg(msg);
          Swal.fire({ icon: "error", title: "Error", text: msg });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => { mounted = false; };
  }, [isOpen, period?.periodReportId]);

  const items = payload?.contributions || [];

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="xl">
      <ModalHeader toggle={onClose}>
        Contributions for {period?.periodReportId || "—"}
      </ModalHeader>
      <ModalBody>
        {errMsg && (
          <Alert color="danger" className="mb-3">
            {errMsg}
          </Alert>
        )}

        <div className="mb-2 small text-muted">
          Range: {payload?.start_date || "—"} → {payload?.end_date || "—"}{" "}
          {payload?.filters?.fundingBody ? `| ${payload.filters.fundingBody}` : ""}
        </div>

        {loading ? (
          <div className="d-flex align-items-center gap-2">
            <Spinner size="sm" /> <span>Loading contributions…</span>
          </div>
        ) : !payload || items.length === 0 ? (
          <div className="text-muted">No contributions found.</div>
        ) : (
          <div className="table-responsive">
            <RSTable bordered hover>
              <thead className="table-light">
                <tr>
                  <th>Report ID</th>
                  <th>Spreadsheet</th> {/* NEW */}
                  <th>Type</th>
                  <th>Event Date</th>
                  <th>Pre%</th>
                  <th>Post%</th>
                  <th>Δ%</th>
                  <th>Satisfaction%</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.reportId}>
                    <td>{it.reportId}</td>
                    <td>{it.spreadsheet_name ?? "—"}</td> {/* NEW */}
                    <td>{it.program_type ?? "-"}</td>
                    <td>{it.event_date ?? "-"}</td>
                    <td>{it.pre_percent ?? "-"}</td>
                    <td>{it.post_percent ?? "-"}</td>
                    <td>{it.increase_percent ?? "-"}</td>
                    <td>{it.satisfaction_rate ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </RSTable>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}

ViewContributions.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  period: PropTypes.object, // expects { periodReportId, ... }
};

export default ViewContributions;

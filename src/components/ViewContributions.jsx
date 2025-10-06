import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  ModalHeader,
  ModalBody,
  Table as RSTable,
  Spinner,
  Alert,
  Input,
  Button,
  UncontrolledTooltip,
  Badge,
} from "reactstrap";
import Swal from "sweetalert2";

const pct = (v) => (v === null || v === undefined || isNaN(Number(v)) ? null : Number(v));
const fmtPct = (v) => (v === null || v === undefined || isNaN(Number(v)) ? "—" : `${Number(v).toFixed(2).replace(/\.00$/, "")}%`);
const barW = (v) => {
  const n = pct(v);
  if (n === null) return 0;
  if (!isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
};
const deltaColor = (v) => {
  const n = pct(v);
  if (n === null) return "#adb5bd"; // muted
  if (n > 0) return "#198754"; // green
  if (n < 0) return "#dc3545"; // red (just in case)
  return "#6c757d";
};
const typeBadge = (t) =>
  t === "workshop" ? "primary" : t === "networking_events" ? "info" : "secondary";

function ViewContributions({ isOpen, onClose, period }) {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState(null);
  const [errMsg, setErrMsg] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

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
    return () => {
      mounted = false;
    };
  }, [isOpen, period?.periodReportId]);

  const items = payload?.contributions || [];

  // derived stats for header chips
  const stats = useMemo(() => {
    const total = items.length;
    const workshops = items.filter((i) => i.program_type === "workshop").length;
    const networking = items.filter((i) => i.program_type === "networking_events").length;
    const avg = (arr) => (arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : null);

    const sats = items.map((i) => pct(i.satisfaction_rate)).filter((v) => v !== null);
    const deltas = items.map((i) => pct(i.increase_percent)).filter((v) => v !== null);

    return {
      total,
      workshops,
      networking,
      avgSat: avg(sats),
      avgDelta: avg(deltas),
    };
  }, [items]);

  // search + filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (typeFilter !== "all" && it.program_type !== typeFilter) return false;
      if (!q) return true;
      const hay = [
        it.reportId,
        it.program_type,
        it.event_date,
        it.workshop_name,
        it.spreadsheet_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, typeFilter, search]);

  // CSV export
  const downloadCsv = () => {
    if (!payload) return;
    const headers = [
      "periodReportId",
      "start_date",
      "end_date",
      "fundingBody",
      "reportId",
      "program_type",
      "spreadsheet_name",
      "event_date",
      "evaluation_start",
      "evaluation_end",
      "workshop_name",
      "satisfaction_rate",
      "pre_percent",
      "post_percent",
      "increase_percent",
    ];
    const fb = payload?.filters?.fundingBody ?? "";
    const rows = filtered.map((it) => [
      payload.periodReportId,
      payload.start_date,
      payload.end_date,
      fb,
      it.reportId,
      it.program_type ?? "",
      it.spreadsheet_name ?? "",
      it.event_date ?? "",
      it.evaluation_start ?? "",
      it.evaluation_end ?? "",
      (it.workshop_name ?? "").toString().replace(/"/g, '""'),
      it.satisfaction_rate ?? "",
      it.pre_percent ?? "",
      it.post_percent ?? "",
      it.increase_percent ?? "",
    ]);
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fbSuffix = fb ? `_${fb}` : "";
    a.download = `${payload.periodReportId}${fbSuffix}_contributions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

        {/* top chips / meta */}
        <div className="d-flex flex-wrap gap-2 align-items-center mb-4">
          <span className="small text-muted">
            Range: <strong>{payload?.start_date || "—"}</strong> →{" "}
            <strong>{payload?.end_date || "—"}</strong>
          </span>
          {payload?.filters?.fundingBody && (
            <Badge color="secondary" pill className="ms-2">
              {payload.filters.fundingBody}
            </Badge>
          )}
          <div className="vr mx-2 d-none d-md-block mt-4" />
          <Badge color="dark" pill>Items: {stats.total ?? 0}</Badge>
          <Badge color="primary" pill>Workshops: {stats.workshops ?? 0}</Badge>
          <Badge color="info" pill>Networking: {stats.networking ?? 0}</Badge>
          <Badge color="success" pill>Avg Sat: {fmtPct(stats.avgSat)}</Badge>
          <Badge color="success" pill>Avg Δ: {fmtPct(stats.avgDelta)}</Badge>

          {/* toolbar */}
          <div className="ms-auto d-flex gap-2 align-items-center w-100 w-md-auto mt-2 mt-md-0">
            <div className="btn-group" role="group" aria-label="Type filter">
              <Button
                size="sm"
                color={typeFilter === "all" ? "primary" : "outline-primary"}
                onClick={() => setTypeFilter("all")}
              >
                All
              </Button>
              <Button
                size="sm"
                color={typeFilter === "workshop" ? "primary" : "outline-primary"}
                onClick={() => setTypeFilter("workshop")}
              >
                Workshops
              </Button>
              <Button
                size="sm"
                color={typeFilter === "networking_events" ? "primary" : "outline-primary"}
                onClick={() => setTypeFilter("networking_events")}
              >
                Networking
              </Button>
            </div>
            <Input
              bsSize="sm"
              placeholder="Search report id, title, sheet…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 260 }}
            />
            <Button size="sm" color="secondary" onClick={downloadCsv}>
              Export CSV
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="d-flex align-items-center gap-2">
            <Spinner size="sm" /> <span>Loading contributions…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-muted">No contributions found.</div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: 480, overflow: "auto" }}>
            <RSTable bordered hover responsive className="align-middle table-sm table-striped">
              <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <tr>
                  <th style={{ whiteSpace: "nowrap" }}>Report ID</th>
                  <th style={{ whiteSpace: "nowrap" }}>Spreadsheet</th>
                  <th style={{ whiteSpace: "nowrap", textAlign: "center" }}>Type</th>
                  <th style={{ whiteSpace: "nowrap" }}>Event Date</th>
                  <th style={{ whiteSpace: "nowrap", width: 140, textAlign: "right" }}>Pre%</th>
                  <th style={{ whiteSpace: "nowrap", width: 140, textAlign: "right" }}>Post%</th>
                  <th style={{ whiteSpace: "nowrap", width: 140, textAlign: "right" }}>Δ%</th>
                  <th style={{ whiteSpace: "nowrap", width: 160, textAlign: "right" }}>Satisfaction%</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it, idx) => {
                  const idTip = `sheet-tip-${idx}`;
                  return (
                    <tr key={it.reportId || idx}>
                      <td style={{ whiteSpace: "nowrap" }}>{it.reportId}</td>
                      <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>
                        <span id={idTip} className="text-truncate d-inline-block" style={{ maxWidth: 280 }}>
                          {it.spreadsheet_name ?? "—"}
                        </span>
                        {it.spreadsheet_name && (
                          <UncontrolledTooltip target={idTip} placement="top">
                            {it.spreadsheet_name}
                          </UncontrolledTooltip>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Badge color={typeBadge(it.program_type)} pill>
                          {it.program_type ?? "-"}
                        </Badge>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{it.event_date ?? "-"}</td>

                      {/* Pre% */}
                      <td style={{ textAlign: "right" }}>
                        <div className="small">{fmtPct(it.pre_percent)}</div>
                        <div className="progress" style={{ height: 6 }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{ width: `${barW(it.pre_percent)}%` }}
                            aria-valuenow={barW(it.pre_percent)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                      </td>

                      {/* Post% */}
                      <td style={{ textAlign: "right" }}>
                        <div className="small">{fmtPct(it.post_percent)}</div>
                        <div className="progress" style={{ height: 6 }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{ width: `${barW(it.post_percent)}%` }}
                            aria-valuenow={barW(it.post_percent)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                      </td>

                      {/* Delta% */}
                      <td style={{ textAlign: "right" }}>
                        <div className="small" style={{ color: deltaColor(it.increase_percent) }}>
                          {fmtPct(it.increase_percent)}
                        </div>
                        <div className="progress" style={{ height: 6, background: "#e9ecef" }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{
                              width: `${Math.abs(barW(it.increase_percent))}%`,
                              backgroundColor: deltaColor(it.increase_percent),
                            }}
                            aria-valuenow={barW(it.increase_percent)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                      </td>

                      {/* Satisfaction% */}
                      <td style={{ textAlign: "right" }}>
                        <div className="small">{fmtPct(it.satisfaction_rate)}</div>
                        <div className="progress" style={{ height: 6 }}>
                          <div
                            className="progress-bar bg-success"
                            role="progressbar"
                            style={{ width: `${barW(it.satisfaction_rate)}%` }}
                            aria-valuenow={barW(it.satisfaction_rate)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

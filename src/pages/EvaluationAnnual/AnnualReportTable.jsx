// src/components/filter/AnnualReportGenerate.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import AnnualReportTableContainer from "./AnnualReports";
import { FaEye, FaTrashAlt } from "react-icons/fa"; // <-- import trash icon
import Swal from "sweetalert2";
import ViewAnnualReportModal from "@/components/AnnualReportModal";

function EventReportGenerate() {
  const [annualModalIsOpen, setAnnualModalIsOpen] = useState(false);
  const [annualSelectedRow, setAnnualSelectedRow] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // fetch all saved period reports
  const fetchPeriodReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await window.electronAPI.getPeriodReports();
      const arr = Array.isArray(res) ? res : (res?.data || []);
      setRows(arr);
    } catch (e) {
      console.error(e);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load period reports." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPeriodReports(); }, [fetchPeriodReports]);

  // auto-refresh when main sends updates (generation or deletion)
  useEffect(() => {
    const offUpdated = window.electronAPI.on?.("period-updated", () => fetchPeriodReports()) || (() => {});
    return () => offUpdated();
  }, [fetchPeriodReports]);

  // delete handler
  const handleDelete = useCallback(async (periodReportId) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete this period report?",
      text: periodReportId,
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await window.electronAPI.deletePeriodReport(periodReportId);
      if (!res?.success) throw new Error(res?.error || "Delete failed.");
      Swal.fire({ icon: "success", title: "Deleted", timer: 1200, showConfirmButton: false });
      // The "period-updated" event from main will also trigger a refresh,
      // but we can optimistically update the list too:
      setRows((prev) => prev.filter((r) => r.periodReportId !== periodReportId));
    } catch (e) {
      console.error(e);
      Swal.fire({ icon: "error", title: "Error", text: e?.message || "Delete failed." });
    }
  }, []);

  // columns (now use real period report fields)
  const columns = useMemo(
    () => [
      { Header: "Report ID", accessor: "periodReportId" },
      { Header: "Generated date", accessor: "generated_date", minWidth: 150, maxWidth: 250 },
      {
        Header: "Generated Date Range",
        id: "date_range",
        accessor: (row) => {
          const s = row.start_date ?? "—";
          const e = row.end_date ?? "—";
          return `${s} to ${e}`;
        },
      },
      {
        Header: "Used Reports",
        id: "used_files",
        accessor: (row) => (row.included_report_ids || []).join(", "),
        width: 200,
      },
      {
        Header: "View",
        width: 80,
        Cell: ({ row }) => (
          <FaEye
            title="View"
            style={{ cursor: "pointer", color: "#007bff" }}
            onClick={() => {
              setAnnualSelectedRow(row.original);
              setAnnualModalIsOpen(true);
            }}
          />
        ),
      },
      {
        Header: "Delete",
        width: 80,
        Cell: ({ row }) => {
          const r = row.original;
          return (
            <FaTrashAlt
              title="Delete"
              style={{ cursor: "pointer", color: "#dc3545" }}
              onClick={() => handleDelete(r.periodReportId)} // <-- wire it here
            />
          );
        },
      },
    ],
    [handleDelete]
  );

  // meta title (optional)
  document.title = "Period Reports | Alike";

  return (
    <div className="page-content">
      <div className="container-fluid">
        <AnnualReportTableContainer
          columns={columns}
          data={rows}                 // <-- use live data
          isGlobalFilter={true}
          isAddOptions={false}
          customPageSize={8}
          className="custom-header-css"
          loading={loading}           // if your container supports it
        />
      </div>

      <ViewAnnualReportModal
        isOpen={annualModalIsOpen}
        onClose={() => setAnnualModalIsOpen(false)}
        data={annualSelectedRow}
      />
    </div>
  );
}

EventReportGenerate.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default EventReportGenerate;

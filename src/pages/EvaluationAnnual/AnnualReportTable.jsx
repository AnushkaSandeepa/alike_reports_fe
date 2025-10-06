import React, { useMemo, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import AnnualReportTableContainer from "./AnnualReports";
import { FaEye, FaTrashAlt, FaList } from "react-icons/fa";
import Swal from "sweetalert2";
import ViewAnnualReportModal from "@/components/AnnualReportModal";
import ViewContributions from "@/components/ViewContributions";

function AnnualReportTable() {
  const [annualModalIsOpen, setAnnualModalIsOpen] = useState(false);
  const [annualSelectedRow, setAnnualSelectedRow] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [contribOpen, setContribOpen] = useState(false);
  const [contribPeriod, setContribPeriod] = useState(null);

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

  useEffect(() => {
    const offUpdated = window.electronAPI.on?.("period-updated", () => fetchPeriodReports()) || (() => {});
    return () => offUpdated();
  }, [fetchPeriodReports]);

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
      setRows((prev) => prev.filter((r) => r.periodReportId !== periodReportId));
    } catch (e) {
      console.error(e);
      Swal.fire({ icon: "error", title: "Error", text: e?.message || "Delete failed." });
    }
  }, []);

  const openContributions = useCallback((row) => {
    setContribPeriod(row);
    setContribOpen(true);
  }, []);

  const columns = useMemo(
    () => [
      { Header: "Report ID", accessor: "periodReportId" },
      { Header: "Generated date", accessor: "generated_date", minWidth: 150, maxWidth: 250 },
      {
        Header: "Generated Date Range",
        id: "date_range",
        accessor: (row) => `${row.start_date ?? "—"} to ${row.end_date ?? "—"}`,
      },
      {
        Header: "Used Reports",
        id: "used_files",
        accessor: (row) => (row.included_report_ids || []).join(", "),
        width: 200,
      },
      {
        Header: "Funding Body",
        id: "fundingBody",
        accessor: (row) => row?.filters?.fundingBody ?? "",
        width: 140,
      },
      {
        Header: "Contributions",
        width: 130,
        Cell: ({ row }) => (
          <FaList
            title="View contributions"
            style={{ cursor: "pointer", color: "#17a2b8" }}
            onClick={() => openContributions(row.original)}
          />
        ),
      },
      {
        Header: "View",
        width: 80,
        Cell: ({ row }) => (
          <FaEye
            title="View"
            style={{ cursor: "pointer", color: "#007bff" }}
            onClick={() => { setAnnualSelectedRow(row.original); setAnnualModalIsOpen(true); }}
          />
        ),
      },
      {
        Header: "Delete",
        width: 80,
        Cell: ({ row }) => (
          <FaTrashAlt
            title="Delete"
            style={{ cursor: "pointer", color: "#dc3545" }}
            onClick={() => handleDelete(row.original.periodReportId)}
          />
        ),
      },
    ],
    [handleDelete, openContributions]
  );

  document.title = "Period Reports | Alike";

  return (
    <div className="page-content">
      <div className="container-fluid">
        <AnnualReportTableContainer
          columns={columns}
          data={rows}
          isGlobalFilter={true}
          isAddOptions={false}
          customPageSize={8}
          className="custom-header-css"
          loading={loading}
        />
      </div>

      <ViewAnnualReportModal
        isOpen={annualModalIsOpen}
        onClose={() => setAnnualModalIsOpen(false)}
        data={annualSelectedRow}
      />

      <ViewContributions
        isOpen={contribOpen}
        onClose={() => setContribOpen(false)}
        period={contribPeriod}
      />
    </div>
  );
}

AnnualReportTable.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default AnnualReportTable;

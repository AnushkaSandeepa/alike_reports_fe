import React, { Fragment, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  useTable,
  useGlobalFilter,
  useAsyncDebounce,
  useSortBy,
  useFilters,
  useExpanded,
  usePagination,
} from "react-table";
import {
  Table,
  Row,
  Col,
  Button,
  Input,
  Card,
  CardTitle,
  InputGroup,
  FormGroup,
} from "reactstrap";
import { Filter, DefaultColumnFilter } from "../../components/Common/filters";
import JobListGlobalFilter from "../../components/Common/GlobalSearchFilter";
import { Stack } from "rsuite";
import Swal from "sweetalert2";

// Flatpickr
import "flatpickr/dist/themes/material_blue.css";
import Flatpickr from "react-flatpickr";
import "react-datepicker/dist/react-datepicker.css";

// --- Global filter (kept minimal; you already render JobListGlobalFilter) ---
function GlobalFilter({ preGlobalFilteredRows, globalFilter, setGlobalFilter, isJobListGlobalFilter }) {
  const [value, setValue] = useState(globalFilter);
  const onChange = useAsyncDebounce((v) => setGlobalFilter(v || undefined), 200);
  useEffect(() => { onChange(value); }, [value]); // sync on type
  return (
    <Fragment>
      {isJobListGlobalFilter && <JobListGlobalFilter />}
    </Fragment>
  );
}

// --- Default columns for period reports (used if 'columns' prop not provided) ---
const useDefaultPeriodColumns = () =>
  useMemo(
    () => [
      { Header: "Period ID", accessor: "periodReportId" },
      { Header: "Start", accessor: "start_date" },
      { Header: "End", accessor: "end_date" },
      { Header: "Generated", accessor: "generated_date" },
      {
        Header: "Counts",
        id: "counts_total",
        Cell: ({ row }) => {
          const c = row.original?.counts || {};
          return `Total: ${c.total_reports ?? 0} | NE: ${c.networking_events ?? 0} | WS: ${c.workshops ?? 0}`;
        },
      },
      {
        Header: "Networking Avg Sat %",
        accessor: (r) => r?.aggregates?.networking_events?.avg_satisfaction_percent ?? null,
        id: "ne_avg_sat",
      },
      {
        Header: "Workshop Avg Δ %",
        accessor: (r) => r?.aggregates?.workshop?.avg_increase_percent ?? null,
        id: "ws_avg_inc",
      },
      {
        Header: "Actions",
        id: "actions",
        disableSortBy: true,
        Cell: ({ row }) => row.original?._renderActions?.(row.original) ?? null,
      },
    ],
    []
  );

const AnnualReportTableContainer = ({
  columns,
  isGlobalFilter,
  isJobListGlobalFilter,
  customPageSize = 10,
  className,
}) => {
  // ---------- State ----------
  const [range, setRange] = useState([]); // [Date|undefined, Date|undefined]
  const [periodReports, setPeriodReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(null); // {id, stage, percent}

  const defaultColumns = useDefaultPeriodColumns();

  // Inject row-level action renderers without mutating server data
  const tableData = useMemo(
    () =>
      (periodReports || []).map((r) => ({
        ...r,
        _renderActions: (row) => (
          <div className="d-flex gap-2">
            <Button size="sm" color="danger" onClick={() => handleDelete(row.periodReportId)}>
              Delete
            </Button>
          </div>
        ),
      })),
    [periodReports]
  );

  // ---------- Helpers ----------
  const showError = (msg) => Swal.fire({ icon: "error", title: "Error", text: msg || "Something went wrong." });
  const showSuccess = (msg) => Swal.fire({ icon: "success", title: "Success", text: msg || "Done." });

  const fetchPeriodReports = async () => {
    try {
      setLoading(true);
      const res = await window.electronAPI.getPeriodReports();
      const arr = Array.isArray(res) ? res : (res?.data || []);
      setPeriodReports(arr);
    } catch (e) {
      console.error(e);
      showError(e?.message || "Failed to load period reports.");
    } finally {
      setLoading(false);
    }
  };

  const fmtISO = (d) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  // ---------- Effects: initial load & subscribe to main events ----------
  useEffect(() => { fetchPeriodReports(); }, []);

  useEffect(() => {
    const offUpdated = window.electronAPI.on?.("period-updated", () => fetchPeriodReports()) || (() => {});
    const offProgress = window.electronAPI.on?.("period-progress", (p) => setProgress(p)) || (() => {});
    return () => { offUpdated(); offProgress(); };
  }, []);

  // ---------- Actions ----------
  const handleGenerate = async () => {
    if (!range || range.length < 2 || !range[0] || !range[1]) {
      return showError("Please select a start and end date.");
    }
    const start = fmtISO(range[0]);
    const end = fmtISO(range[1]);

    try {
      setIsGenerating(true);
      setProgress({ id: null, stage: "starting", percent: 5 });

      const res = await window.electronAPI.generatePeriodReport({ start, end });
      if (!res?.success) {
        throw new Error(res?.error || "Period report generation failed.");
      }
      showSuccess("Period report generated.");
      // fetchPeriodReports() will also be triggered by 'period-updated'
    } catch (e) {
      console.error(e);
      showError(e?.message || "Failed to generate period report.");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(null), 1500);
    }
  };

  const handleDelete = async (periodReportId) => {
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
      if (!res?.success) {
        throw new Error(res?.error || "Delete failed.");
      }
      showSuccess("Deleted.");
      await fetchPeriodReports();
    } catch (e) {
      console.error(e);
      showError(e?.message || "Delete failed.");
    }
  };

  // ---------- React Table ----------
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state,
    preGlobalFilteredRows,
    setGlobalFilter,
  } = useTable(
    {
      columns: columns && columns.length ? columns : defaultColumns,
      data: tableData,
      defaultColumn: { Filter: DefaultColumnFilter },
      initialState: {
        pageIndex: 0,
        pageSize: customPageSize,
        sortBy: [{ id: "generated_date", desc: true }],
      },
      autoResetSortBy: false,
      autoResetPage: false,
    },
    useGlobalFilter,
    useFilters,
    useSortBy,
    useExpanded,
    usePagination
  );

  const { pageIndex, pageSize } = state;

  const generateSortingIndicator = (column) =>
    column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : "";

  const onChangeInInput = (e) => {
    const p = e.target.value ? Number(e.target.value) - 1 : 0;
    gotoPage(p);
  };

  return (
    <Fragment>
      <Stack className="py-3 mb-3" alignItems="center" justifyContent="space-between">
        <div className="fs-5" style={{ fontSize: "24px", fontWeight: "700" }}>
          Annual/Period Evaluation
        </div>
        {progress && (
          <div style={{ minWidth: 260 }}>
            <div className="small text-muted">
              {progress.stage === "finished" ? "Finished" : "Generating…"}
            </div>
            <div className="progress" style={{ height: 6 }}>
              <div
                className="progress-bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress.percent ?? 0}
                style={{ width: `${Math.min(progress.percent ?? 0, 100)}%` }}
              />
            </div>
          </div>
        )}
      </Stack>

      <Card className="p-3">
        <CardTitle tag="h5" className="mb-3">
          Generate Your Annual/Period Report
        </CardTitle>

        <Row className="mb-2 g-3">
          <h6 className="card-title">Select Date Range</h6>
          <FormGroup className="mb-0">
            <InputGroup>
              <Flatpickr
                className="form-control d-block date-buttion-alike"
                placeholder="yyyy-mm-dd to yyyy-mm-dd"
                options={{ mode: "range", dateFormat: "Y-m-d" }}
                onChange={(dates) => setRange(dates)}
              />
            </InputGroup>
          </FormGroup>

          <div className="mt-3">
            <button
              className="btn-alike"
              onClick={handleGenerate}
              disabled={isGenerating || !(range && range.length === 2 && range[0] && range[1])}
            >
              {isGenerating ? "Generating..." : "Generate"}
            </button>
          </div>
        </Row>
      </Card>

      <Card className="p-3">
        <CardTitle tag="h5" className="mb-3">
          Generated Period Based Reports
        </CardTitle>

        {isGlobalFilter && (
          <GlobalFilter
            preGlobalFilteredRows={preGlobalFilteredRows}
            globalFilter={state.globalFilter}
            setGlobalFilter={setGlobalFilter}
            isJobListGlobalFilter={isJobListGlobalFilter}
          />
        )}

        <div className="table-responsive react-table">
          <Table bordered hover {...getTableProps()} className={className}>
            <thead className="table-light table-nowrap">
              {headerGroups.map((hg) => (
                <tr key={hg.id} {...hg.getHeaderGroupProps()}>
                  {hg.headers.map((col) => (
                    <th key={col.id}>
                      <div className="mb-2" {...col.getSortByToggleProps()}>
                        {col.render("Header")}
                        {generateSortingIndicator(col)}
                      </div>
                      <Filter column={col} />
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody {...getTableBodyProps()}>
              {loading ? (
                <tr>
                  <td colSpan={(columns && columns.length) || defaultColumns.length} className="text-center py-4">
                    Loading…
                  </td>
                </tr>
              ) : page.length === 0 ? (
                <tr>
                  <td colSpan={(columns && columns.length) || defaultColumns.length} className="text-center py-4">
                    No period reports yet.
                  </td>
                </tr>
              ) : (
                page.map((row) => {
                  prepareRow(row);
                  return (
                    <Fragment key={row.id || row.getRowProps().key}>
                      <tr {...row.getRowProps()}>
                        {row.cells.map((cell) => (
                          <td key={cell.column.id} {...cell.getCellProps()}>
                            {cell.render("Cell")}
                          </td>
                        ))}
                      </tr>
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>

        {/* Pagination */}
        <Row className="justify-content-md-end justify-content-center align-items-center g-2">
          <Col className="col-md-auto">
            <div className="d-flex gap-1">
              <Button color="primary" onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
                {"<<"}
              </Button>
              <Button color="primary" onClick={previousPage} disabled={!canPreviousPage}>
                {"<"}
              </Button>
            </div>
          </Col>

          <Col className="col-md-auto d-none d-md-block">
            Page <strong>{pageIndex + 1} of {pageOptions.length || 1}</strong>
          </Col>

          <Col className="col-md-auto">
            <Input
              type="number"
              min={1}
              style={{ width: 70 }}
              max={Math.max(pageOptions.length, 1)}
              value={pageOptions.length ? pageIndex + 1 : 1}
              onChange={onChangeInInput}
            />
          </Col>

          <Col className="col-md-auto">
            <div className="d-flex gap-1">
              <Button color="primary" onClick={nextPage} disabled={!canNextPage}>
                {">"}
              </Button>
              <Button color="primary" onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
                {">>"}
              </Button>
            </div>
          </Col>
        </Row>
      </Card>
    </Fragment>
  );
};

AnnualReportTableContainer.propTypes = {
  columns: PropTypes.array,
  isGlobalFilter: PropTypes.bool,
  isJobListGlobalFilter: PropTypes.bool,
  customPageSize: PropTypes.number,
  className: PropTypes.string,
};

export default AnnualReportTableContainer;

import React, { Fragment, useState, useEffect } from "react";
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
import { Table, Row, Col, Button, Input, CardBody, Card, CardTitle } from "reactstrap";
import { Filter, DefaultColumnFilter } from "../../components/Common/filters";
import JobListGlobalFilter from "../../components/Common/GlobalSearchFilter";
import CustomerSearchBox from "@/pages/SheetList/CustomerSearchBox";
import {  Stack,  } from 'rsuite';

// Define a default UI for filtering
function GlobalFilter({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
  isJobListGlobalFilter
}) {
  const count = preGlobalFilteredRows.length;
  const [value, setValue] = React.useState(globalFilter);
  const onChange = useAsyncDebounce(value => {
    setGlobalFilter(value || undefined);
  }, 200);

  return (
    <React.Fragment>
      {isJobListGlobalFilter && (
        <JobListGlobalFilter />
      )}

    </React.Fragment>
  );
}

const EventReportTableContainer = ({
  columns,
  data,
  isGlobalFilter,
  isJobListGlobalFilter,
  isAddOptions,
  isAddUserList,
  handleOrderClicks,
  handleUserClick,
  handleCustomerClick,
  isAddCustList,
  customPageSize,
  className,
  customPageSizeOptions,

}) => {
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
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      defaultColumn: { Filter: DefaultColumnFilter },
      initialState: {
        pageIndex: 0,
        pageSize: customPageSize,
        sortBy: [
          {
            desc: true,
          },
        ],
      },
    },
    useGlobalFilter,
    useFilters,
    useSortBy,
    useExpanded,
    usePagination
  );

  const generateSortingIndicator = column => {
    return column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : "";
  };

  const onChangeInSelect = event => {
    setPageSize(Number(event.target.value));
  };

  const onChangeInInput = event => {
    const page = event.target.value ? Number(event.target.value) - 1 : 0;
    gotoPage(page);
  };

  const [programType, setProgramType] = useState("");
  const [spreadsheet, setSpreadsheet] = useState("");
  const [allSheets, setAllSheets] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(false);

  // Fetch uploaded spreadsheets on mount
  useEffect(() => {
    const fetchSheets = async () => {
      setLoadingSheets(true);
      const result = await window.electronAPI.getUploadedSheets();
      console.log("Fetched sheets:", result.data);
      if (result.success) {
        setAllSheets(result.data); // array of { fileId, programType, storedAt, ... }
      } else {
        console.error(result.error);
      }
      setLoadingSheets(false);
    };

    fetchSheets();
  }, []);

  // Filter spreadsheets for the selected program type
  const filteredSheets = programType
    ? allSheets.filter(sheet => String(sheet.programType) === programType)
    : [];

  return (
    <Fragment>
      <Stack className="py-3 mb-3" alignItems="center" justifyContent="space-between">
        <div className="fs-5" style={{ fontSize: '24px', fontWeight: '700' }}>
          Program Evaluation 
        </div>
      
      </Stack>
      <Card className="p-3">
        <CardTitle tag="h5" className="mb-3">
          Generate Your Program Evaluation Report
        </CardTitle>
        <Row>
          {/* Program Type */}
          <Col md={3}>
            <h6>Select Program Type</h6>
            <select
              value={programType}
              onChange={(e) => {
                setProgramType(e.target.value);
                setSpreadsheet("");
              }}
              className="form-select"
            >
              <option value="">Select Type</option>
              <option value="networking_events">Networking Events</option>
              <option value="workshop">Workshop</option>
              {/* add more if needed */}
            </select>
          </Col>

          {/* Spreadsheet */}
          <Col md={6}>
            <h6>Select Program's Spreadsheet</h6>
            <select
              value={spreadsheet}
              onChange={(e) => setSpreadsheet(e.target.value)}
              className="form-select"
              disabled={!programType || loadingSheets}
            >
              <option value="">
                {loadingSheets ? "Loading..." : "Select the Sheet"}
              </option>
              {filteredSheets.map(sheet => (
                <option key={sheet.fileId} value={sheet.storedAt}>
                  {sheet.fileId} — {sheet.storedAt.split(/[/\\]/).pop()}
                </option>
              ))}
            </select>
          </Col>

          {/* Generate Button */}
          <Col md="auto" className="d-flex align-items-end">
            <button
              className="btn-alike"
              onClick={() => {
                console.log("Generate report for:", spreadsheet)
                window.electronAPI.generateReport({
                  spreadsheetId: filteredSheets.find(s => s.storedAt === spreadsheet)?.fileId,
                  spreadsheetPath: spreadsheet,
                  programType: programType
                });

              }}
               disabled={!programType || !spreadsheet}
            >
              Generate
            </button>
          </Col>
        </Row>

      </Card>

      <Card className="p-3">
        <CardTitle tag="h5" className="mb-3">
          Generated Program Evaluation Reports
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
              {headerGroups.map(headerGroup => (
                <tr key={headerGroup.id} {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map(column => (
                    <th key={column.id}>
                      <div className="mb-2" {...column.getSortByToggleProps()}>
                        {column.render("Header")}
                        {generateSortingIndicator(column)}
                      </div>
                      <Filter column={column} />
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody {...getTableBodyProps()}>
              {page.map(row => {
                prepareRow(row);
                return (
                  <Fragment key={row.getRowProps().key}>
                    <tr>
                      {row.cells.map(cell => {
                        return (
                          <td key={cell.id} {...cell.getCellProps()}>
                            {cell.render("Cell")}
                          </td>
                        );
                      })}
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </Table>
        </div>

        <Row className="justify-content-md-end justify-content-center align-items-center">
          <Col className="col-md-auto">
            <div className="d-flex gap-1">
              <Button
                color="primary"
                onClick={() => gotoPage(0)}
                disabled={!canPreviousPage}
              >
                {"<<"}
              </Button>
              <Button
                color="primary"
                onClick={previousPage}
                disabled={!canPreviousPage}
              >
                {"<"}
              </Button>
            </div>
          </Col>
          <Col className="col-md-auto d-none d-md-block">
            Page{" "}
            <strong>
              {pageIndex + 1} of {pageOptions.length}
            </strong>
          </Col>
          <Col className="col-md-auto">
            <Input
              type="number"
              min={1}
              style={{ width: 70 }}
              max={pageOptions.length}
              defaultValue={pageIndex + 1}
              onChange={onChangeInInput}
            />
          </Col>

          <Col className="col-md-auto">
            <div className="d-flex gap-1">
              <Button color="primary" onClick={nextPage} disabled={!canNextPage}>
                {">"}
              </Button>
              <Button
                color="primary"
                onClick={() => gotoPage(pageCount - 1)}
                disabled={!canNextPage}
              >
                {">>"}
              </Button>
            </div>
          </Col>
        </Row>
      </Card>
    </Fragment>
  );
};

EventReportTableContainer.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default EventReportTableContainer;

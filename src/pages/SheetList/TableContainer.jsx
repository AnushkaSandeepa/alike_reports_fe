import React, { Fragment } from "react";
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
} from "reactstrap";
import { Filter, DefaultColumnFilter } from "../../components/Common/filters";
import CustomerSearchBox from "@/pages/SheetList/CustomerSearchBox";
import { Panel, Stack } from "rsuite";
import Swal from 'sweetalert2';

// Global Filter component
function GlobalFilter({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
}) {
  const count = preGlobalFilteredRows.length;
  const [value, setValue] = React.useState(globalFilter);
  const onChange = useAsyncDebounce(value => {
    setGlobalFilter(value || undefined);
  }, 200);

  return (
    <Panel bordered className="mb-3">
			<div
				className="fs-5"
				style={{
					fontSize: '24px',
					fontWeight: '700',
					marginBottom: '10px',
					marginLeft: '5px',
				}}
			>
				Search File Name
			</div>
			<Stack spacing={300} justifyContent="space-around">
				<Stack.Item grow={1}>
					<Input
						placeholder={`Search ${count} records...`}
            value={value || ""}
            onChange={(e) => {
              setValue(e.target.value);
              onChange(e.target.value);
            }}
					/>
				</Stack.Item>
				
					
			</Stack>
		</Panel>
  );
}

const TableContainer = ({
  columns,
  data,
  isGlobalFilter,
  customPageSize = 10,
  className,
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
    state: { pageIndex },
  } = useTable(
    {
      columns,
      data,
      defaultColumn: { Filter: DefaultColumnFilter },
      initialState: {
        pageIndex: 0,
        pageSize: customPageSize,
        sortBy: [{ id: "eventDate", desc: false }],
      },
    },
    useGlobalFilter,
    useFilters,
    useSortBy,
    useExpanded,
    usePagination
  );

  const generateSortingIndicator = (column) =>
    column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : "";

  const onChangeInSelect = (event) => {
    setPageSize(Number(event.target.value));
  };

  const onChangeInInput = (event) => {
    const page = event.target.value ? Number(event.target.value) - 1 : 0;
    gotoPage(page);
  };

  return (
    <Fragment>
      <Stack className="py-3" alignItems="center" justifyContent="space-between">
        <div className="fs-5 pb-3" style={{ fontSize: "24px", fontWeight: "700" }}>
          Uploaded Spreadsheets
        </div>

        <Button
          color="primary"
          onClick={() => {
            Swal.fire({
              icon: 'warning',
              title: 'Warning',
              text: 'Make sure you do not delete any spreadsheet manually from this folder.',
              confirmButtonText: 'Open Folder',
              showCancelButton: true,
              cancelButtonText: 'Cancel',
            }).then((result) => {
              if (result.isConfirmed) {
                window.electronAPI.openUploadFolder();
              }
            });
          }}
        >
          Open Upload Folder
        </Button>
      </Stack>

      


      <Card className="p-3">

        {isGlobalFilter && (
          <GlobalFilter
            preGlobalFilteredRows={preGlobalFilteredRows}
            globalFilter={state.globalFilter}
            setGlobalFilter={setGlobalFilter}
          />
        )}

        <div className="table-responsive react-table">
          <Table bordered hover {...getTableProps()} className={className}>
            <thead className="table-light table-nowrap">
              {headerGroups.map((headerGroup) => (
                <tr key={headerGroup.id} {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => (
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
              {page.length > 0 ? (
                page.map((row) => {
                  prepareRow(row);
                  return (
                    <Fragment key={row.getRowProps().key}>
                      <tr>
                        {row.cells.map((cell) => (
                          <td key={cell.id} {...cell.getCellProps()}>
                            {cell.render("Cell")}
                          </td>
                        ))}
                      </tr>
                    </Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={columns.length} className="text-center py-3">
                    No data found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {/* Pagination */}
        <Row className="justify-content-md-end justify-content-center align-items-center mt-3">
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
            Page <strong>{pageIndex + 1} of {pageOptions.length}</strong>
          </Col>

          <Col className="col-md-auto">
            <Input
              type="number"
              min={1}
              max={pageOptions.length}
              style={{ width: 70 }}
              defaultValue={pageIndex + 1}
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

TableContainer.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  isGlobalFilter: PropTypes.bool,
  customPageSize: PropTypes.number,
  className: PropTypes.string,
};

export default TableContainer;

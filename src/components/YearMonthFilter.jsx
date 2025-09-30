// components/YearMonthFilter.jsx
import React from "react";
import PropTypes from "prop-types";

/* ------------ constants ------------ */
export const MONTH_META = [
  { num: 1,  name: "Jan" }, { num: 2,  name: "Feb" }, { num: 3,  name: "Mar" },
  { num: 4,  name: "Apr" }, { num: 5,  name: "May" }, { num: 6,  name: "Jun" },
  { num: 7,  name: "Jul" }, { num: 8,  name: "Aug" }, { num: 9,  name: "Sep" },
  { num: 10, name: "Oct" }, { num: 11, name: "Nov" }, { num: 12, name: "Dec" },
];

/* ------------ tiny UI atoms (chips + section header) ------------ */
const chipBase = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  padding: "6px 12px", borderRadius: 9999, cursor: "pointer",
  border: "1px solid #d1e7dd", userSelect: "none", transition: "all .15s ease",
  fontSize: 13, lineHeight: 1, whiteSpace: "nowrap",
};
const chipOn  = { background: "#e7f3eb", color: "#164728", borderColor: "#9ad0b1" };
const chipOff = { background: "#f8f9fa", color: "#344054", borderColor: "#e5e7eb" };

export function Chip({ active, children, onClick, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      aria-pressed={active}
      style={{ ...chipBase, ...(active ? chipOn : chipOff) }}
      className="shadow-sm hover:shadow"
    >
      {children}
    </button>
  );
}

export function Section({ title, children, right }) {
  return (
    <div className="w-100">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h6 className="mb-0">{title}</h6>
        <div className="d-flex gap-2">{right}</div>
      </div>
      {children}
    </div>
  );
}

/* ------------ public reusable component ------------ */
function YearMonthFilter({
  years = [],
  months = MONTH_META.map(m => m.num),
  valueYears = [],
  valueMonths = [],
  onChangeYears,
  onChangeMonths,
  showMonthPresets = true,
  className = "",
}) {
  const toggle = (arr, v, setter) =>
    setter(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v].sort((a,b)=>a-b));

  const yearChips = (
    <div className="d-flex flex-wrap gap-2">
      {years.map((y) => (
        <Chip key={y} active={valueYears.includes(y)} onClick={() => toggle(valueYears, y, onChangeYears)} title={`Toggle ${y}`}>
          {y}
        </Chip>
      ))}
    </div>
  );

  const monthChips = (
    <div className="d-flex flex-wrap gap-2">
      {MONTH_META.map(({ num, name }) => (
        <Chip key={num} active={valueMonths.includes(num)} onClick={() => toggle(valueMonths, num, onChangeMonths)} title={`Toggle ${name}`}>
          {name}
        </Chip>
      ))}
    </div>
  );

  const allMonths = MONTH_META.map(m => m.num);

  return (
    <div className={`d-grid gap-3 ${className}`}>
      {/* Years */}
      <Section
        title="Years"
        right={
          <>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onChangeYears(years)}>
              All
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onChangeYears([])}>
              None
            </button>
          </>
        }
      >
        {yearChips}
      </Section>

      {/* Months */}
      <Section
        title="Months"
        right={
          showMonthPresets ? (
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onChangeMonths(allMonths)}>All</button>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onChangeMonths([])}>None</button>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onChangeMonths([1,2,3,4,5,6])}>H1</button>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onChangeMonths([7,8,9,10,11,12])}>H2</button>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onChangeMonths([1,2,3])}>Q1</button>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onChangeMonths([4,5,6])}>Q2</button>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onChangeMonths([7,8,9])}>Q3</button>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onChangeMonths([10,11,12])}>Q4</button>
            </>
          ) : null
        }
      >
        {monthChips}
      </Section>
    </div>
  );
}

YearMonthFilter.propTypes = {
  years: PropTypes.arrayOf(PropTypes.number),
  months: PropTypes.arrayOf(PropTypes.number),
  valueYears: PropTypes.arrayOf(PropTypes.number),
  valueMonths: PropTypes.arrayOf(PropTypes.number),
  onChangeYears: PropTypes.func.isRequired,
  onChangeMonths: PropTypes.func.isRequired,
  showMonthPresets: PropTypes.bool,
  className: PropTypes.string,
};

export default YearMonthFilter;

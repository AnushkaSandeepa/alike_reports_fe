#!/usr/bin/env python3
import argparse, json, os, sys, re
from datetime import datetime

try:
    import pandas as pd
except Exception:
    print("Missing dependency: pandas", file=sys.stderr)
    sys.exit(2)

def is_unnamed(col_name: str) -> bool:
    if col_name is None:
        return True
    s = str(col_name).strip()
    if not s:
        return True
    return bool(re.match(r"^Unnamed(:\s*\d+)?$", s, flags=re.IGNORECASE))

def split_period(val: object):
    """
    Extract Semester (e.g., 'Sem 1') and Year (e.g., 2024) from values like:
      'Sem 1 2024', 'Semester 2 - 2025', 'S1 2024', 'Sem1 2024'
    Returns (semester_str_or_None, year_or_None)
    """
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return (None, None)
    s = str(val).strip()

    # year: first 4-digit year
    m_year = re.search(r"(\d{4})", s)
    year = int(m_year.group(1)) if m_year else None

    # semester: accept 'sem', 'semester', or 's' with 1/2
    m_sem = re.search(r"\b(seme?ster?|s)\s*[-:_]?\s*([12])\b", s, flags=re.IGNORECASE)
    if m_sem:
        sem_num = m_sem.group(2)
        semester = f"Sem {sem_num}"
    else:
        # fallback: look for literal 'sem 1/2' without the prefix
        m_alt = re.search(r"\bsem\s*([12])\b", s, flags=re.IGNORECASE)
        semester = f"Sem {m_alt.group(1)}" if m_alt else None

    return (semester, year)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True, help="Path to Excel/CSV")
    p.add_argument("--outdir", required=True, help="Directory to write analytics.json")
    args = p.parse_args()

    in_path = args.input
    out_dir = args.outdir
    os.makedirs(out_dir, exist_ok=True)
    out_json = os.path.join(out_dir, "analytics.json")

    if not os.path.exists(in_path):
        print(f"[ERROR] Input not found: {in_path}", file=sys.stderr)
        sys.exit(1)

    # --- Read while skipping the first (title) row ---
    if in_path.lower().endswith((".xlsx", ".xls")):
        df = pd.read_excel(in_path, sheet_name=0, header=1)  # 2nd row as headers
    elif in_path.lower().endswith(".csv"):
        df = pd.read_csv(in_path, skiprows=1)
    else:
        print("[ERROR] Unsupported file type (.xlsx/.xls/.csv only)", file=sys.stderr)
        sys.exit(1)

    # Drop fully empty rows (keep all columns)
    df = df.dropna(how="all")

    # Ensure first column exists and is named 'Period' if blank/Unnamed
    if df.shape[1] > 0:
        cols = list(df.columns)
        if is_unnamed(cols[0]):
            cols[0] = "Period"
            df.columns = cols
    else:
        # edge case: no columns after reading
        df["Period"] = None

    # Derive Semester + Year from Period, but keep Period unchanged
    period_col = df.columns[0]  # first column (now 'Period' if unnamed)
    semesters, years = [], []
    for v in df[period_col].tolist():
        sem, yr = split_period(v)
        semesters.append(sem)
        years.append(yr)

    # Insert new columns right after Period
    insert_at = 1 if df.shape[1] >= 1 else 0
    df.insert(insert_at, "Semester", semesters)
    df.insert(insert_at + 1, "Year", years)

    # Replace NaN with None for JSON
    df = df.where(pd.notna(df), None)

    payload = {
        "created_at": datetime.utcnow().isoformat() + "Z",
        "input_file": os.path.basename(in_path),
        "table": {
            "headers": [str(c) for c in df.columns],
            "rows": df.to_dict(orient="records"),
        },
    }

    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"Wrote {out_json}")

if __name__ == "__main__":
    main()

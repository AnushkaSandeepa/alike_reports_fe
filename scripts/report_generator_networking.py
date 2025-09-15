# scripts/report_generator_networking.py
import pandas as pd
import json
import os
from pathlib import Path
import argparse
import datetime as dt

# Labels we recognize (no numeric mapping)
SAT_LABELS_DISPLAY = [
    "Strongly Agree",
    "Agree",
    "Neither Agree nor Disagree",
    "Disagree",
    "Strongly Disagree",
    "Not Applicable",
]
# Case-insensitive lookup (with a couple synonyms for N/A)
SAT_LABELS_CI = {
    "strongly agree": "Strongly Agree",
    "agree": "Agree",
    "neither agree nor disagree": "Neither Agree nor Disagree",
    "disagree": "Disagree",
    "strongly disagree": "Strongly Disagree",
    "not applicable": "Not Applicable",
    "n/a": "Not Applicable",
    "na": "Not Applicable",
}

def canonical_label(v: object):
    """Return a canonical satisfaction label or None if not recognized."""
    if v is None:
        return None
    s = str(v).strip().lower()
    return SAT_LABELS_CI.get(s)

def parse_date(s):
    if s is None or (isinstance(s, float) and pd.isna(s)):
        return None
    s = str(s).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d", "%d-%m-%Y"):
        try:
            return dt.datetime.strptime(s, fmt).date()
        except Exception:
            continue
    try:
        return pd.to_datetime(s).date()
    except Exception:
        return None

def find_event_date_series(df: pd.DataFrame):
    candidates = [
        "Event Date", "Event date", "Date of Event",
        "Session Date", "Workshop Date", "Date", "Timestamp"
    ]
    for name in candidates:
        if name in df.columns:
            s = df[name]
            if pd.api.types.is_datetime64_any_dtype(s):
                return s.dt.date
            return s.apply(parse_date)
    return None

def calculate_satisfaction_scores(file_path, spreadsheet_id, program_type, report_id,
                                  evaluation_start=None, evaluation_end=None):
    # Read Excel with native types for dates; we'll string-normalize later where needed
    df_raw = pd.read_excel(file_path)

    # Optional range filter by event date
    start = parse_date(evaluation_start) if evaluation_start else None
    end   = parse_date(evaluation_end) if evaluation_end else None

    event_dates = find_event_date_series(df_raw)
    if (start or end) and event_dates is not None:
        mask = pd.Series([True] * len(df_raw))
        if start:
            mask &= event_dates.apply(lambda d: d is not None and d >= start)
        if end:
            mask &= event_dates.apply(lambda d: d is not None and d <= end)
        df_raw = df_raw[mask].copy()

    # If nothing left after filtering
    if df_raw.empty:
        print(json.dumps({
            "success": False,
            "error": "No rows found within the selected date range.",
            "reportId": report_id,
            "spreadsheet_id": spreadsheet_id,
            "spreadsheet_name": Path(file_path).stem,
            "program_type": program_type,
            "spreadsheet_path": os.path.abspath(file_path),
            "generated_date": pd.Timestamp.now().strftime("%Y-%m-%d"),
            "evaluation_start": evaluation_start,
            "evaluation_end": evaluation_end,
        }, ensure_ascii=False))
        return

    # Work on a string-normalized copy for satisfaction detection
    df = df_raw.applymap(lambda x: str(x).strip() if pd.notna(x) else "")

    # Find the first column that contains any recognized satisfaction label
    def col_is_satisfaction(cname: str) -> bool:
        col = df[cname]
        if col.empty:
            return False
        return col.map(canonical_label).notna().any()

    first_col_idx = next((i for i, c in enumerate(df.columns) if col_is_satisfaction(c)), None)
    if first_col_idx is None:
        print(json.dumps({
            "success": False,
            "error": "No satisfaction response columns detected in this file.",
            "reportId": report_id,
            "spreadsheet_id": spreadsheet_id,
            "spreadsheet_name": Path(file_path).stem,
            "program_type": program_type,
            "spreadsheet_path": os.path.abspath(file_path),
            "generated_date": pd.Timestamp.now().strftime("%Y-%m-%d"),
            "evaluation_start": evaluation_start,
            "evaluation_end": evaluation_end,
        }, ensure_ascii=False))
        return

    # All satisfaction columns from that point on (only those that contain labels)
    satisfaction_cols = [c for c in df.columns[first_col_idx:] if col_is_satisfaction(c)]

    # Aggregate counts across all satisfaction columns (case-insensitive, canonicalized)
    satisfaction_counts = {k: 0 for k in SAT_LABELS_DISPLAY}
    for c in satisfaction_cols:
        vc = df[c].map(canonical_label).value_counts()
        for label, count in vc.items():
            if label in satisfaction_counts:
                satisfaction_counts[label] += int(count)

    # Satisfaction = (Agree + Strongly Agree) / (all valid responses excl. "Not Applicable")
    valid_labels = [
        "Strongly Agree",
        "Agree",
        "Neither Agree nor Disagree",
        "Disagree",
        "Strongly Disagree",
    ]
    numerator = satisfaction_counts["Strongly Agree"] + satisfaction_counts["Agree"]
    denominator = sum(satisfaction_counts[l] for l in valid_labels)
    satisfaction_rate = round((numerator / denominator) * 100, 2) if denominator else 0.0

    # Build result JSON
    result = {
        "success": True,
        "reportId": report_id,
        "spreadsheet_id": spreadsheet_id,
        "spreadsheet_name": Path(file_path).stem,
        "program_type": program_type,
        "spreadsheet_path": os.path.abspath(file_path),
        "confidence_data": {"satisfaction_rate": satisfaction_rate},
        "avg_satisfaction_percent": satisfaction_rate,  # kept for UI compatibility
        "satisfaction_counts": satisfaction_counts,
        "generated_date": pd.Timestamp.now().strftime("%Y-%m-%d"),
        "evaluation_start": evaluation_start,
        "evaluation_end": evaluation_end,
    }

    # Optional: collect "Additional feedback" (case-insensitive match, 2+ words)
    feedback_col = next((c for c in df.columns if c.strip().lower() == "additional feedback"), None)
    if feedback_col:
        feedback_list = [
            fb for fb in df[feedback_col].dropna().astype(str).str.strip()
            if len(fb.split()) >= 2
        ]
        if feedback_list:
            result["additional_feedback"] = feedback_list

    print(json.dumps(result, ensure_ascii=False))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("spreadsheet_path")
    parser.add_argument("spreadsheet_id")
    parser.add_argument("program_type")  # Electron passes this
    parser.add_argument("report_id")
    parser.add_argument("--evaluationStart", dest="eval_start")
    parser.add_argument("--evaluationEnd", dest="eval_end")
    args = parser.parse_args()

    calculate_satisfaction_scores(
        file_path=args.spreadsheet_path,
        spreadsheet_id=args.spreadsheet_id,
        program_type=args.program_type,
        report_id=args.report_id,
        evaluation_start=args.eval_start,
        evaluation_end=args.eval_end,
    )

if __name__ == "__main__":
    main()

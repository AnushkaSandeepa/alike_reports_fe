# scripts/report_generator_networking.py
import pandas as pd
import json
import os
import sys
from pathlib import Path
import argparse
import datetime as dt

AGREEMENT_MAP = {
    "Strongly Agree": 5,
    "Agree": 4,
    "Neither Agree nor Disagree": 3,
    "Disagree": 2,
    "Strongly Disagree": 1,
    "Not Applicable": 0,
}

def safe_float(x):
    try:
        return float(x) if pd.notna(x) else 0.0
    except Exception:
        return 0.0

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

def find_event_date_series(df):
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
    df = pd.read_excel(file_path)
    # normalize strings so value matching works
    df = df.applymap(lambda x: str(x).strip() if pd.notna(x) else "")

    # optional range filter
    start = parse_date(evaluation_start) if evaluation_start else None
    end   = parse_date(evaluation_end) if evaluation_end else None

    event_dates = find_event_date_series(df)
    if (start or end) and event_dates is not None:
        mask = pd.Series([True] * len(df))
        if start:
            mask &= event_dates.apply(lambda d: d is not None and d >= start)
        if end:
            mask &= event_dates.apply(lambda d: d is not None and d <= end)
        df = df[mask].copy()

    # if nothing left after filtering => tell Electron not to persist
    if df.empty:
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

    # find first block of satisfaction columns (columns that contain AGREEMENT_MAP values)
    first_col_idx = next(
        (i for i, col in enumerate(df.columns)
         if df[col].isin(AGREEMENT_MAP.keys()).any()), None
    )

    if first_col_idx is None:
        # no agreement columns at all – also treat as error (consistent UX)
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

    satisfaction_cols = [
        col for col in df.columns[first_col_idx:]
        if df[col].isin(AGREEMENT_MAP.keys()).any()
    ]

    # counts
    satisfaction_counts = {}
    for col in satisfaction_cols:
        col_counts = df[col].value_counts()
        for k in AGREEMENT_MAP.keys():
            satisfaction_counts[k] = satisfaction_counts.get(k, 0) + int(col_counts.get(k, 0))

    # average satisfaction %
    numeric_df = df[satisfaction_cols].applymap(lambda x: AGREEMENT_MAP.get(x, 0))
    satisfaction_rate = round(safe_float(numeric_df.mean().mean()) / 5 * 100, 2)

    result = {
        "success": True,
        "reportId": report_id,
        "spreadsheet_id": spreadsheet_id,
        "spreadsheet_name": Path(file_path).stem,
        "program_type": program_type,
        "spreadsheet_path": os.path.abspath(file_path),
        "confidence_data": {"satisfaction_rate": satisfaction_rate},
        "avg_satisfaction_percent": satisfaction_rate,
        "satisfaction_counts": satisfaction_counts,
        "generated_date": pd.Timestamp.now().strftime("%Y-%m-%d"),
        "evaluation_start": evaluation_start,
        "evaluation_end": evaluation_end,
    }

    # optional: extra comments (2+ words)
    if "Additional feedback" in df.columns:
        feedback_list = [
            fb for fb in df["Additional feedback"].dropna().astype(str).str.strip()
            if len(fb.split()) >= 2
        ]
        if feedback_list:
            result["additional_feedback"] = feedback_list

    print(json.dumps(result, ensure_ascii=False))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("spreadsheet_path")
    parser.add_argument("spreadsheet_id")
    parser.add_argument("program_type")  # keep required; Electron always passes it
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

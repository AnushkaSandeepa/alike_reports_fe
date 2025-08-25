import pandas as pd
import json
import os
import sys
from pathlib import Path

# Agreement mapping
AGREEMENT_MAP = {
    "Strongly Agree": 5,
    "Agree": 4,
    "Neither Agree nor Disagree": 3,
    "Disagree": 2,
    "Strongly Disagree": 1,
    "Not Applicable": 0
}

def safe_float(x):
    return float(x) if pd.notna(x) else 0.0

def calculate_satisfaction_scores(file_path, spreadsheet_id, program_type, report_id):
    df = pd.read_excel(file_path)
    df = df.applymap(lambda x: str(x).strip() if pd.notna(x) else "")

    # Select columns containing agreement values
    first_col_idx = next(
        (i for i, col in enumerate(df.columns)
         if df[col].isin(AGREEMENT_MAP.keys()).any()), None
    )
    if first_col_idx is None:
        print(json.dumps({"error": "No columns contain agreement values."}))
        return

    satisfaction_cols = [
        col for col in df.columns[first_col_idx:]
        if df[col].isin(AGREEMENT_MAP.keys()).any()
    ]

    # Count per column
    satisfaction_counts = {}
    for col in satisfaction_cols:
        col_counts = df[col].value_counts()
        for key in AGREEMENT_MAP.keys():
            satisfaction_counts[key] = satisfaction_counts.get(key, 0) + int(col_counts.get(key, 0))

    # Average satisfaction %
    numeric_df = df[satisfaction_cols].applymap(lambda x: AGREEMENT_MAP.get(x, 0))
    satisfaction_rate = round(safe_float(numeric_df.mean().mean()) / 5 * 100, 2)

    result = {
        "reportId": report_id,
        "spreadsheet_id": spreadsheet_id,
        "spreadsheet_name": Path(file_path).stem,
        "program_type": program_type,
        "spreadsheet_path": os.path.abspath(file_path),
        "confidence_data": {"satisfaction_rate": satisfaction_rate},
        "avg_satisfaction_percent": satisfaction_rate,
        "satisfaction_counts": satisfaction_counts,
        "generated_date": pd.Timestamp.now().strftime("%Y-%m-%d")
    }

    # Additional feedback (only 2+ words)
    if "Additional feedback" in df.columns:
        feedback_list = [fb for fb in df["Additional feedback"].dropna().astype(str).str.strip() if len(fb.split()) >= 2]
        if feedback_list:
            result["additional_feedback"] = feedback_list

    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    file_path = sys.argv[1]
    spreadsheet_id = sys.argv[2]
    program_type = sys.argv[3] if len(sys.argv) > 3 else "networking_events"
    report_id = sys.argv[4]
    calculate_satisfaction_scores(file_path, spreadsheet_id, program_type, report_id)

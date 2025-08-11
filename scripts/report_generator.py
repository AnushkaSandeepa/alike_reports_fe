import pandas as pd
import json
import os
import sys
from pathlib import Path

# Mapping for confidence levels
CONFIDENCE_MAP = {
    "Not at all Confident": 0,
    "Slightly confident": 1,
    "Moderately confident": 2,
    "Very confident": 3,
    "Extremely confident": 4
}

# Mapping for agreement levels (updated rules)
AGREEMENT_MAP = {
    "Strongly Agree": 5,
    "Agree": 4,
    "Neither Agree nor Disagree": 3,
    "Disagree": 2,
    "Strongly Disagree": 1,
    "Not Applicable": 0
}

def convert_to_numeric(df, cols):
    """Convert both confidence and agreement columns to numeric."""
    df_copy = df.copy()
    for col in cols:
        if col in df_copy:
            df_copy[col] = df_copy[col].map(CONFIDENCE_MAP).fillna(df_copy[col])
            df_copy[col] = df_copy[col].map(AGREEMENT_MAP).fillna(df_copy[col])
            df_copy[col] = pd.to_numeric(df_copy[col], errors="coerce")
    return df_copy

def calculate_confidence_scores(file_path):
    spreadsheet_path = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.abspath(file_path)
    df = pd.read_excel(spreadsheet_path)

    # Locate the workshop before/after marker column
    marker_col = "Please mark whether this feedback is for before or after the workshop."
    if marker_col not in df.columns:
        raise ValueError(f"Column '{marker_col}' not found in spreadsheet")

    marker_idx = df.columns.get_loc(marker_col)

    # Identify groups of columns
    pre_cols = df.columns[marker_idx + 1 : marker_idx + 4]
    post_cols = df.columns[marker_idx + 4 : marker_idx + 7]
    satisfaction_cols = [
        col for col in df.columns[marker_idx + 7 :] if col != "Additional feedback"
    ]

    # Convert to numeric
    df_pre = convert_to_numeric(df, pre_cols)
    df_post = convert_to_numeric(df, post_cols)
    df_satis = convert_to_numeric(df, satisfaction_cols)

    # Calculate percentages
    pre_avg_conf = df_pre[pre_cols].mean().mean() / 4 * 100 if not df_pre[pre_cols].empty else 0
    post_avg_conf = df_post[post_cols].mean().mean() / 4 * 100 if not df_post[post_cols].empty else 0
    confidence_increase = post_avg_conf - pre_avg_conf

    satisfaction_rate = df_satis[satisfaction_cols].mean().mean() / 5 * 100 if not df_satis[satisfaction_cols].empty else 0

    # Metadata
    spreadsheet_name = Path(spreadsheet_path).stem
    spreadsheet_id = sys.argv[2] if len(sys.argv) > 2 else ""
    program_type = sys.argv[3] if len(sys.argv) > 3 else ""

    result = {
        "spreadsheet_id": spreadsheet_id,
        "spreadsheet_name": spreadsheet_name,
        "program_type": program_type,
        "spreadsheet_path": spreadsheet_path,
        "confidence_data": {
            "pre_percent": round(pre_avg_conf, 3),
            "post_percent": round(post_avg_conf, 3),
            "increase_percent": round(confidence_increase, 3),
            "satisfaction_rate": round(satisfaction_rate, 3)
        }
    }

    # Save JSON DB
    json_db_path = Path(file_path).parent / "confidence_data_db.json"
    if json_db_path.exists():
        with open(json_db_path, "r") as f:
            db_data = json.load(f)
    else:
        db_data = []

    db_data.append(result)

    with open(json_db_path, "w") as f:
        json.dump(db_data, f, indent=4)

    print(f"Report saved to {json_db_path}")
    return result

if __name__ == "__main__":
    file_path = "Grants and Fundraising dd 2025-26(1-12).xlsx"  # Change if needed
    report = calculate_confidence_scores(file_path)
    print(report)

import pandas as pd
import json
import os
import sys
from pathlib import Path
import numpy as np

# Mapping for confidence levels
CONFIDENCE_MAP = {
    "Not at all Confident": 0,
    "Slightly confident": 1,
    "Moderately confident": 2,
    "Very confident": 3,
    "Extremely confident": 4
}

# Mapping for agreement levels
AGREEMENT_MAP = {
    "Strongly Agree": 5,
    "Agree": 4,
    "Neither Agree nor Disagree": 3,
    "Disagree": 2,
    "Strongly Disagree": 1,
    "Not Applicable": 0
}

def convert_to_numeric(df, cols, map_type="confidence"):
    """Convert columns to numeric based on mapping type."""
    df_copy = df.copy()
    mapping = CONFIDENCE_MAP if map_type == "confidence" else AGREEMENT_MAP
    for col in cols:
        if col in df_copy:
            df_copy[col] = df_copy[col].map(mapping).fillna(df_copy[col])
            df_copy[col] = pd.to_numeric(df_copy[col], errors="coerce")
    return df_copy

def calculate_agreement_counts(df, cols):
    """Count occurrences of each agreement level in the given columns."""
    levels = ["Strongly Agree", "Agree", "Neither Agree nor Disagree", "Disagree", "Strongly Disagree"]
    counts = {level: 0 for level in levels}
    for col in cols:
        if col in df.columns:
            col_counts = df[col].astype(str).str.strip().value_counts()
            for level in levels:
                counts[level] += int(col_counts.get(level, 0))
    return counts

def get_secure_documents_path():
    """Get secure Documents folder inside AppData/Roaming/<AppName>."""
    app_name = "hyper-react-js"  # change to your Electron app name
    base_dir = Path.home() / "AppData" / "Roaming" / app_name / "Documents"
    base_dir.mkdir(parents=True, exist_ok=True)
    return base_dir

def safe_float(x):
    """Convert numpy and NaN to Python float for JSON serialization."""
    if pd.isna(x):
        return 0.0
    if isinstance(x, np.generic):
        return float(x)
    return x

def get_pre_post_satisfaction_cols(df, marker_col):
    """Dynamically detect pre, post, and satisfaction columns."""
    marker_idx = df.columns.get_loc(marker_col)
    start_idx = marker_idx + 1

    pre_cols = []
    first_col_words = df.columns[start_idx].split()
    first_col_base = " ".join(first_col_words[:-2])

    for i in range(start_idx, len(df.columns)):
        col_words = df.columns[i].split()
        col_base = " ".join(col_words[:-2])
        if i != start_idx and col_base == first_col_base:
            break
        pre_cols.append(df.columns[i])

    n_pre = len(pre_cols)
    post_start_idx = start_idx + n_pre
    post_cols = df.columns[post_start_idx : post_start_idx + n_pre]

    satis_start_idx = post_start_idx + n_pre
    satisfaction_cols = [col for col in df.columns[satis_start_idx:] if col != "Additional feedback"]

    return pre_cols, post_cols, satisfaction_cols

def calculate_confidence_scores(file_path):
    spreadsheet_path = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.abspath(file_path)
    df = pd.read_excel(spreadsheet_path)

    # Locate the workshop before/after marker column
    marker_col = "Please mark whether this feedback is for before or after the workshop."
    if marker_col not in df.columns:
        raise ValueError(f"Column '{marker_col}' not found in spreadsheet")

    # Dynamically get pre, post, and satisfaction columns
    pre_cols, post_cols, satisfaction_cols = get_pre_post_satisfaction_cols(df, marker_col)

    # Calculate agreement counts BEFORE numeric conversion
    satisfaction_counts = calculate_agreement_counts(df, satisfaction_cols)

    # Convert columns to numeric
    df_pre = convert_to_numeric(df, pre_cols, "confidence")
    df_post = convert_to_numeric(df, post_cols, "confidence")
    df_satis = convert_to_numeric(df, satisfaction_cols, "agreement")

    # Calculate percentages
    pre_avg_conf = safe_float(df_pre[pre_cols].mean().mean() / 4 * 100) if not df_pre[pre_cols].empty else 0.0
    post_avg_conf = safe_float(df_post[post_cols].mean().mean() / 4 * 100) if not df_post[post_cols].empty else 0.0
    confidence_increase = safe_float(post_avg_conf - pre_avg_conf)

    satisfaction_rate = safe_float(df_satis[satisfaction_cols].mean().mean() / 5 * 100) if not df_satis[satisfaction_cols].empty else 0.0

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
            "pre_percent": pre_avg_conf,
            "post_percent": post_avg_conf,
            "increase_percent": confidence_increase,
            "satisfaction_rate": satisfaction_rate
        },
        "satisfaction_counts": satisfaction_counts,
        "generated_date": pd.Timestamp.now().strftime("%Y-%m-%d"),
    }

    # Add Additional feedback array if present and not empty
    if "Additional feedback" in df.columns:
        feedback_values = df["Additional feedback"].dropna().astype(str).str.strip()
        feedback_list = [fb for fb in feedback_values if fb]
        if feedback_list:
            result["additional_feedback"] = feedback_list

    # Save JSON DB in secure AppData/Roaming/<AppName>/Documents
    secure_dir = get_secure_documents_path()
    json_db_path = secure_dir / "confidence_data_db.json"

    if json_db_path.exists():
        with open(json_db_path, "r", encoding="utf-8") as f:
            db_data = json.load(f)
    else:
        db_data = []

    db_data.append(result)

    # Save safely
    with open(json_db_path, "w", encoding="utf-8") as f:
        try:
            json.dump(db_data, f, indent=4, ensure_ascii=False)
        except Exception as e:
            print("Error saving JSON:", e)

    print(f"Report saved to {json_db_path}")
    return result

if __name__ == "__main__":
    file_path = "Grants and Fundraising dd 2025-26(1-12).xlsx"  # Change if needed
    report = calculate_confidence_scores(file_path)
    print(report)

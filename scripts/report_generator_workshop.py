import pandas as pd
import json
import os
import sys
from pathlib import Path
import numpy as np

CONFIDENCE_MAP = {
    "Not at all Confident": 0,
    "Slightly confident": 1,
    "Moderately confident": 2,
    "Very confident": 3,
    "Extremely confident": 4
}

AGREEMENT_MAP = {
    "Strongly Agree": 5,
    "Agree": 4,
    "Neither Agree nor Disagree": 3,
    "Disagree": 2,
    "Strongly Disagree": 1,
    "Not Applicable": 0
}

def safe_float(x):
    if pd.isna(x):
        return 0.0
    if isinstance(x, np.generic):
        return float(x)
    return x

def convert_to_numeric(df, cols, map_type="confidence"):
    mapping = CONFIDENCE_MAP if map_type == "confidence" else AGREEMENT_MAP
    for col in cols:
        if col in df:
            df[col] = df[col].map(mapping).fillna(df[col])
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df

def get_pre_post_satisfaction_cols(df, marker_col):
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

def calculate_workshop_scores(file_path, spreadsheet_id, program_type, report_id):
    df = pd.read_excel(file_path)

    # Get pre/post/satisfaction columns
    pre_cols, post_cols, satisfaction_cols = get_pre_post_satisfaction_cols(
        df, "Please mark whether this feedback is for before or after the workshop."
    )

    # Calculate satisfaction counts using your preferred method
    satisfaction_counts = {}
    for col in satisfaction_cols:
        col_values = df[col].dropna().astype(str).str.strip()
        col_counts = col_values.value_counts()
        for key in AGREEMENT_MAP.keys():
            satisfaction_counts[key] = satisfaction_counts.get(key, 0) + int(col_counts.get(key, 0))


    # Convert numeric
    df_pre = convert_to_numeric(df, pre_cols, "confidence")
    df_post = convert_to_numeric(df, post_cols, "confidence")
    df_satis = convert_to_numeric(df, satisfaction_cols, "agreement")

    # Calculate averages
    pre_avg = round(safe_float(df_pre[pre_cols].mean().mean() / 4 * 100), 2) if not df_pre.empty else 0.0
    post_avg = round(safe_float(df_post[post_cols].mean().mean() / 4 * 100), 2) if not df_post.empty else 0.0
    increase = round(post_avg - pre_avg, 2)
    satisfaction_rate = round(safe_float(df_satis[satisfaction_cols].mean().mean() / 5 * 100), 2)

    
    # Additional feedback
    feedback_list = [fb for fb in df.get("Additional feedback", pd.Series()).dropna().astype(str).str.strip() if len(fb.split()) >= 2]

    # Build result
    result = {
        "reportId": report_id,
        "spreadsheet_id": spreadsheet_id,
        "spreadsheet_name": Path(file_path).stem,
        "program_type": program_type,
        "spreadsheet_path": os.path.abspath(file_path),
        "confidence_data": {
            "pre_percent": pre_avg,
            "post_percent": post_avg,
            "increase_percent": increase,
            "satisfaction_rate": satisfaction_rate
        },
        "satisfaction_counts": satisfaction_counts,
        "generated_date": pd.Timestamp.now().strftime("%Y-%m-%d")
    }

    if feedback_list:
        result["additional_feedback"] = feedback_list

    # Save to JSON DB
    secure_dir = Path.home() / "AppData" / "Roaming" / "hyper-react-js" / "Documents"
    secure_dir.mkdir(parents=True, exist_ok=True)
    json_db_path = secure_dir / "confidence_data_db.json"

    try:
        if json_db_path.exists():
            with open(json_db_path, "r", encoding="utf-8") as f:
                db_data = json.load(f)
                if not isinstance(db_data, list):
                    db_data = []
        else:
            db_data = []

        db_data.append(result)

        with open(json_db_path, "w", encoding="utf-8") as f:
            json.dump(db_data, f, indent=4, ensure_ascii=False)

        print("✅ Result saved:", result)
    except Exception as e:
        print("❌ Error saving JSON:", e)

    return result

if __name__ == "__main__":
    file_path = sys.argv[1]
    spreadsheet_id = sys.argv[2]
    program_type = sys.argv[3]
    report_id = sys.argv[4]
    calculate_workshop_scores(file_path, spreadsheet_id, program_type, report_id)

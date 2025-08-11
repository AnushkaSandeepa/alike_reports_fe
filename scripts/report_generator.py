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

def calculate_confidence_scores(file_path):
    # Read Excel file
    spreadsheet_path = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.abspath(file_path)
    df = pd.read_excel(spreadsheet_path)

    # Identify the before/after indicator column
    before_after_col = "Please mark whether this feedback is for before or after the workshop."
    if before_after_col not in df.columns:
        raise ValueError(f"Column '{before_after_col}' not found in spreadsheet")

    # Get all columns after before/after (excluding Additional feedback)
    start_index = df.columns.get_loc(before_after_col) + 1
    selected_cols = [
        col for col in df.columns[start_index:]
        if col != "Additional feedback"
    ]

    # Keep only text-based columns (exclude numeric)
    selected_cols = [
        col for col in selected_cols
        if not pd.api.types.is_numeric_dtype(df[col])
    ]

    # Split into before and after groups
    before_df = df[df[before_after_col] == "Before"]
    after_df = df[df[before_after_col] == "After"]

    # Keep only non-empty columns for each group
    pre_cols = [col for col in selected_cols if before_df[col].notnull().any()]
    post_cols = [col for col in selected_cols if after_df[col].notnull().any()]

    # Map responses according to correct scale
    def convert_responses(df_group, cols):
        df_copy = df_group.copy()
        for col in cols:
            unique_vals = set(df_copy[col].dropna().unique())
            if unique_vals.issubset(CONFIDENCE_MAP.keys()):
                df_copy[col] = df_copy[col].map(CONFIDENCE_MAP)
            elif unique_vals.issubset(AGREEMENT_MAP.keys()):
                df_copy[col] = df_copy[col].map(AGREEMENT_MAP)
        return df_copy[cols]

    pre_df = convert_responses(before_df, pre_cols)
    post_df = convert_responses(after_df, post_cols)

    # Separate confidence and agreement columns
    confidence_pre_cols = [col for col in pre_cols if set(before_df[col].dropna().unique()).issubset(CONFIDENCE_MAP.keys())]
    confidence_post_cols = [col for col in post_cols if set(after_df[col].dropna().unique()).issubset(CONFIDENCE_MAP.keys())]

    agreement_cols = [
        col for col in selected_cols
        if set(df[col].dropna().unique()).issubset(AGREEMENT_MAP.keys())
    ]

    # Calculate pre/post confidence percentages
    pre_avg_conf = pre_df[confidence_pre_cols].mean(axis=1).mean() / 4 * 100 if confidence_pre_cols else 0
    post_avg_conf = post_df[confidence_post_cols].mean(axis=1).mean() / 4 * 100 if confidence_post_cols else 0
    confidence_increase = post_avg_conf - pre_avg_conf

    # Calculate satisfaction rate
    agreement_df = df[agreement_cols].apply(lambda col: col.map(AGREEMENT_MAP))
    satisfaction_rate = agreement_df.mean(axis=1).mean() / 5 * 100 if not agreement_df.empty else 0

    # Metadata
    spreadsheet_name = Path(file_path).stem
    spreadsheet_path = sys.argv[1]
    spreadsheet_id = sys.argv[2]
    program_type = sys.argv[3]

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
    file_path = "Grants and Fundraising 2025-26(1-12).xlsx"  # Change if needed
    report = calculate_confidence_scores(file_path)
    print(report)
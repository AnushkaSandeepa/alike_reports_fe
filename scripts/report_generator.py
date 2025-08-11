import pandas as pd
import json
import os
from pathlib import Path

# Mapping for confidence levels
CONFIDENCE_MAP = {
    "Not at all Confident": 0,
    "Slightly confident": 1,
    "Moderately confident": 2,
    "Very confident": 3,
    "Extremely confident": 4
}

def calculate_confidence_scores(file_path):
    # Read Excel file
    df = pd.read_excel(file_path)

    # Identify the relevant columns
    before_after_col = "Please mark whether this feedback is for before or after the workshop."
    pre_cols = [
        "Building and maintaining a fundraising program",
        "Identifying suitable funding opportunities",
        "Preparing a strong grant application"
    ]
    post_cols = [
        "Building and maintaining a fundraising program2",
        "Identifying suitable funding opportunities2",
        "Preparing a strong grant application2"
    ]

    # Convert text confidence levels to numeric
    for col in pre_cols + post_cols:
        df[col] = df[col].map(CONFIDENCE_MAP)

    # Separate before & after workshop
    pre_df = df[df[before_after_col] == "Before"][pre_cols]
    post_df = df[df[before_after_col] == "After"][post_cols]

    # Calculate totals and possible maximums
    total_pre = pre_df.sum().sum()
    total_possible_pre = pre_df.count().sum() * 4  # max is 4

    total_post = post_df.sum().sum()
    total_possible_post = post_df.count().sum() * 4

    # Calculate percentages and increase
    pre_percent = total_pre / total_possible_pre if total_possible_pre > 0 else 0
    post_percent = total_post / total_possible_post if total_possible_post > 0 else 0
    average_increase = post_percent - pre_percent

    # Metadata
    spreadsheet_id = os.path.basename(file_path)
    spreadsheet_name = Path(file_path).stem
    program_type = df["Region"].iloc[0] if "Region" in df.columns else "Unknown"

    result = {
        "spreadsheet_id": spreadsheet_id,
        "spreadsheet_name": spreadsheet_name,
        "program_type": program_type,
        "confidence_data": {
            "total_pre_percent": round(pre_percent, 3),
            "total_post_percent": round(post_percent, 3),
            "average_increase": round(average_increase, 3)
        }
    }

    # Save to JSON "database"
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

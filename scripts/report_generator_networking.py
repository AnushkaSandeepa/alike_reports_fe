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

def get_secure_documents_path():
    app_name = "hyper-react-js"
    base_dir = Path.home() / "AppData" / "Roaming" / app_name / "Documents"
    base_dir.mkdir(parents=True, exist_ok=True)
    return base_dir

def safe_float(x):
    return float(x) if pd.notna(x) else 0.0

def calculate_satisfaction_scores(file_path):
    df = pd.read_excel(file_path)

    # Normalize all columns to string for safe comparison
    df = df.applymap(lambda x: str(x).strip() if pd.notna(x) else "")

    # Find first column containing at least one AGREEMENT_MAP value
    first_col_idx = next(
        (i for i, col in enumerate(df.columns)
         if df[col].isin(AGREEMENT_MAP.keys()).any()),
        None
    )
    if first_col_idx is None:
        print("No columns contain agreement values. Skipping file.")
        return None

    # Select all columns from first_col_idx which contain at least one AGREEMENT_MAP value
    satisfaction_cols = [
        col for col in df.columns[first_col_idx:]
        if df[col].isin(AGREEMENT_MAP.keys()).any()
    ]

    # Calculate per-column counts
    satisfaction_counts = {}
    for col in satisfaction_cols:
        col_counts = df[col].value_counts()
        for key in AGREEMENT_MAP.keys():
            satisfaction_counts[key] = satisfaction_counts.get(key, 0) + int(col_counts.get(key, 0))

    # Calculate average satisfaction percentage
    numeric_df = df[satisfaction_cols].applymap(lambda x: AGREEMENT_MAP.get(x, 0))
    avg_satisfaction = safe_float(numeric_df.mean().mean())

    # Metadata
    spreadsheet_name = Path(file_path).stem
    spreadsheet_id = sys.argv[2] if len(sys.argv) > 2 else ""
    program_type = sys.argv[3] if len(sys.argv) > 3 else "networking_events"

    result = {
        "spreadsheet_id": spreadsheet_id,
        "spreadsheet_name": spreadsheet_name,
        "program_type": program_type,
        "spreadsheet_path": os.path.abspath(file_path),
        "avg_satisfaction_percent": round(avg_satisfaction / 5 * 100, 2),
        "satisfaction_counts": satisfaction_counts,
        "generated_date": pd.Timestamp.now().strftime("%Y-%m-%d"),
    }

    # Extract Additional feedback if present
    if "Additional feedback" in df.columns:
        feedback_values = df["Additional feedback"].dropna().astype(str).str.strip()
        feedback_list = [fb for fb in feedback_values if fb]
        if feedback_list:
            result["additional_feedback"] = feedback_list

    # Save to JSON DB
    secure_dir = get_secure_documents_path()
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
    file_path = sys.argv[1] if len(sys.argv) > 1 else "example_networking.xlsx"
    calculate_satisfaction_scores(file_path)

# scripts/report_generator_workshop.py
import sys, json, os, argparse, datetime as dt
from pathlib import Path
import pandas as pd
import numpy as np

CONFIDENCE_MAP = {
    "Not at all Confident": 0,
    "Slightly confident": 1,
    "Moderately confident": 2,
    "Very confident": 3,
    "Extremely confident": 4,
}

AGREEMENT_MAP = {
    "Strongly Agree": 5,
    "Agree": 4,
    "Neither Agree nor Disagree": 3,
    "Disagree": 2,
    "Strongly Disagree": 1,
    "Not Applicable": 0,
}

def safe_float(x):
    if pd.isna(x): return 0.0
    if isinstance(x, np.generic): return float(x)
    try: return float(x)
    except Exception: return 0.0

def parse_date(s):
    if s is None or (isinstance(s, float) and pd.isna(s)): return None
    s = str(s).strip()
    for fmt in ("%Y-%m-%d","%d/%m/%Y","%m/%d/%Y","%Y/%m/%d","%d-%m-%Y"):
        try: return dt.datetime.strptime(s, fmt).date()
        except Exception: pass
    try: return pd.to_datetime(s).date()
    except Exception: return None

def find_event_date_series(df):
    candidates = [
        "Event Date","Event date","Date of Event","Session Date","Workshop Date"
    ]
    for name in df.columns:
        for cand in candidates:
            if str(name).strip().lower() == cand.lower():
                s = df[name]
                if pd.api.types.is_datetime64_any_dtype(s): return s.dt.date
                return s.apply(parse_date)
    return None

def to_numeric_map(df, cols, which="confidence"):
    mapping = CONFIDENCE_MAP if which == "confidence" else AGREEMENT_MAP
    out = df.copy()
    for c in cols:
        if c in out:
            out[c] = out[c].map(mapping).fillna(out[c])
            out[c] = pd.to_numeric(out[c], errors="coerce")
    return out

def infer_pre_post_by_marker(df):
    """Try to locate a 'before/after' marker column and split questions accordingly."""
    marker_variants = [
        "Please mark whether this feedback is for before or after the workshop.",
        "Please mark whether this feedback is for before or after the session.",
        "Before/After",
        "Before or After",
        "Is this BEFORE or AFTER the workshop?",
    ]
    for col in df.columns:
        for mv in marker_variants:
            if str(col).strip().lower() == mv.lower():
                # Assume questions follow in the sequence: all-pre then all-post, with same length
                start_idx = df.columns.get_loc(col) + 1
                if start_idx >= len(df.columns): return [], [], []
                # Try to determine the length of the "pre" block by comparing base labels
                pre_cols = []
                first = df.columns[start_idx]
                base0 = " ".join(str(first).split()[:-2]) or str(first)
                for i in range(start_idx, len(df.columns)):
                    name = df.columns[i]
                    base = " ".join(str(name).split()[:-2]) or str(name)
                    if i != start_idx and base == base0:
                        break
                    pre_cols.append(name)
                n_pre = len(pre_cols)
                post_start = start_idx + n_pre
                post_cols = list(df.columns[post_start: post_start + n_pre])

                # Satisfaction columns: scan beyond that for agreement-mapped values
                tail = list(df.columns[post_start + n_pre:])
                satisfaction_cols = []
                for c in tail:
                    s = df[c].dropna().astype(str).str.strip()
                    if s.isin(AGREEMENT_MAP.keys()).any():
                        satisfaction_cols.append(c)
                return pre_cols, post_cols, satisfaction_cols
    return None  # no marker match

def infer_pre_post_by_pattern(df):
    """Fallback: detect pairs of columns ending with Before/After markers."""
    pre_tokens  = ["(Before)","- Before","Before the workshop","Before"]
    post_tokens = ["(After)","- After","After the workshop","After"]

    def norm(s): return str(s).strip().lower()

    # Build base-> (pre_col, post_col)
    pairs = {}
    for col in df.columns:
        label = str(col)
        l = norm(label)
        for t in pre_tokens:
            if l.endswith(t.lower()):
                base = l[:-len(t)].strip()
                pairs.setdefault(base, {})["pre"] = col
        for t in post_tokens:
            if l.endswith(t.lower()):
                base = l[:-len(t)].strip()
                pairs.setdefault(base, {})["post"] = col

    pre_cols, post_cols = [], []
    for base, d in pairs.items():
        if "pre" in d and "post" in d:
            pre_cols.append(d["pre"])
            post_cols.append(d["post"])

    # Satisfaction columns: anything with AGREEMENT_MAP values
    satisfaction_cols = []
    for c in df.columns:
        s = df[c].dropna().astype(str).str.strip()
        if s.isin(AGREEMENT_MAP.keys()).any():
            satisfaction_cols.append(c)

    # Remove any pre/post columns from satisfaction list if they overlap
    satisfaction_cols = [c for c in satisfaction_cols if c not in pre_cols + post_cols]
    return pre_cols, post_cols, satisfaction_cols

def zero_report(file_path, spreadsheet_id, program_type, report_id, eval_start, eval_end):
    return {
        "reportId": report_id,
        "spreadsheet_id": spreadsheet_id,
        "spreadsheet_name": Path(file_path).stem,
        "program_type": program_type,
        "spreadsheet_path": os.path.abspath(file_path),
        "confidence_data": {
            "pre_percent": 0.0,
            "post_percent": 0.0,
            "increase_percent": 0.0,
            "satisfaction_rate": 0.0,
        },
        "satisfaction_counts": {k: 0 for k in AGREEMENT_MAP.keys()},
        "generated_date": pd.Timestamp.now().strftime("%Y-%m-%d"),
        "evaluation_start": eval_start,
        "evaluation_end": eval_end,
    }

def main():
    p = argparse.ArgumentParser()
    p.add_argument("spreadsheet_path")
    p.add_argument("spreadsheet_id")
    p.add_argument("program_type")
    p.add_argument("report_id")
    p.add_argument("--evaluationStart", dest="eval_start")
    p.add_argument("--evaluationEnd",   dest="eval_end")
    args = p.parse_args()

    df = pd.read_excel(args.spreadsheet_path)

    # Optional filter by date range
    start = parse_date(args.eval_start) if args.eval_start else None
    end   = parse_date(args.eval_end)   if args.eval_end   else None
    if start or end:
        ed = find_event_date_series(df)
        if ed is not None:
            mask = pd.Series([True]*len(df))
            if start: mask &= ed.apply(lambda d: d is not None and d >= start)
            if end:   mask &= ed.apply(lambda d: d is not None and d <= end)
            df = df[mask].copy()

    if df.empty:
        print(json.dumps(zero_report(args.spreadsheet_path, args.spreadsheet_id,
                                     args.program_type, args.report_id,
                                     args.eval_start, args.eval_end),
                         ensure_ascii=False))
        return

    # Try marker method, else pattern method
    found = infer_pre_post_by_marker(df)
    if found is None:
        pre_cols, post_cols, satisfaction_cols = infer_pre_post_by_pattern(df)
    else:
        pre_cols, post_cols, satisfaction_cols = found

    # If we still can't infer anything, return a safe zero report
    if not pre_cols and not post_cols and not satisfaction_cols:
        print(json.dumps(zero_report(args.spreadsheet_path, args.spreadsheet_id,
                                     args.program_type, args.report_id,
                                     args.eval_start, args.eval_end),
                         ensure_ascii=False))
        return

    # Satisfaction counts
    satisfaction_counts = {k:0 for k in AGREEMENT_MAP.keys()}
    for c in satisfaction_cols:
        if c not in df: continue
        s = df[c].dropna().astype(str).str.strip()
        vc = s.value_counts()
        for k in AGREEMENT_MAP.keys():
            satisfaction_counts[k] += int(vc.get(k, 0))

    # Numerics
    df_pre  = to_numeric_map(df, pre_cols,  "confidence")
    df_post = to_numeric_map(df, post_cols, "confidence")
    df_sat  = to_numeric_map(df, satisfaction_cols, "agreement")

    pre_pct  = round(safe_float(df_pre[pre_cols].mean().mean()  / 4 * 100), 2) if pre_cols else 0.0
    post_pct = round(safe_float(df_post[post_cols].mean().mean() / 4 * 100), 2) if post_cols else 0.0
    inc_pct  = round(post_pct - pre_pct, 2)
    sat_pct  = round(safe_float(df_sat[satisfaction_cols].mean().mean() / 5 * 100), 2) if satisfaction_cols else 0.0

    # Additional feedback (2+ words)
    feedback = []
    if "Additional feedback" in df.columns:
        feedback = [fb for fb in df["Additional feedback"].dropna().astype(str).str.strip()
                    if len(fb.split()) >= 2]

    result = {
        "reportId": args.report_id,
        "spreadsheet_id": args.spreadsheet_id,
        "spreadsheet_name": Path(args.spreadsheet_path).stem,
        "program_type": args.program_type,
        "spreadsheet_path": os.path.abspath(args.spreadsheet_path),
        "confidence_data": {
            "pre_percent": pre_pct,
            "post_percent": post_pct,
            "increase_percent": inc_pct,
            "satisfaction_rate": sat_pct,
        },
        "satisfaction_counts": satisfaction_counts,
        "generated_date": pd.Timestamp.now().strftime("%Y-%m-%d"),
        "evaluation_start": args.eval_start,
        "evaluation_end": args.eval_end,
    }
    if feedback: result["additional_feedback"] = feedback

    # IMPORTANT: only print JSON
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()

# electron/scripts/social_media_store.py
from __future__ import annotations
import argparse, json, re
from pathlib import Path
import pandas as pd

# ---- month helpers (accept "Jan", "January", "Jan-20", etc.) ----
MONTHS_ABBR  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
MONTHS_FULL  = ["January","February","March","April","May","June","July","August","September","October","November","December"]
MONTH_TO_NUM = {m:i for i,m in enumerate(MONTHS_ABBR, 1)} | {m:i for i,m in enumerate(MONTHS_FULL, 1)}
MONTH_REGEX  = re.compile(
    r"^\s*(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|"
    r"Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b",
    re.I,
)

def month_from_cell(x):
    """Return (month_name, month_num) or (None, None)."""
    if pd.isna(x):
        return (None, None)
    s = str(x).strip()
    m = MONTH_REGEX.match(s)
    if not m:
        return (None, None)
    name = m.group(1)
    # Normalise case
    name_norm = name[0].upper() + name[1:].lower()
    # Map September variants to canonical
    if name_norm.startswith("Sept"):
        name_norm = "September"
    # Prefer abbr key if present
    key = name_norm[:3] if name_norm[:3] in MONTH_TO_NUM else name_norm
    return (name_norm, int(MONTH_TO_NUM[key]))

# ---- misc helpers ----
def _sheet_name(xlsx: Path, rx: str, default: str) -> str:
    xl = pd.ExcelFile(xlsx)
    cand = [s for s in xl.sheet_names if re.fullmatch(rx, s, flags=re.I)]
    return cand[0] if cand else default

def _coerce_float(x):
    if pd.isna(x): return None
    s = str(x).strip().replace(",", "").replace("\u200f", "")
    if not s or s.lower() in {"na","n/a","nan","none","null","-"} or "div/0" in s.lower():
        return None
    if s.endswith("%"):
        s = s[:-1].strip()
    try:
        return float(s)
    except Exception:
        return None

def _norm_metric(label: str) -> str:
    s = re.sub(r"\s+", " ", str(label or "")).strip()
    if re.search(r"engagement\s*rate", s, flags=re.I): return "Engagement Rate"
    if re.search(r"open\s*percentage", s, flags=re.I): return "Open percentage"
    return s

def _parse_common(xlsx_path: Path, sheet: str) -> pd.DataFrame:
    """Layout:
       row0: big title (ignored)
       row1: metric names (may be merged across year subcolumns)
       row2: year numbers below each subcolumn (2024, 2025, ...)
       rows 3..: months in short/long or 'Jan-20' form
    """
    raw = pd.read_excel(xlsx_path, sheet_name=sheet, header=None)
    if raw.shape[0] < 4:
        return pd.DataFrame(columns=["metric","year","Month"])

    metric_row = raw.iloc[1].copy()
    year_row   = raw.iloc[2].copy()
    # merged headers → forward-fill metric names
    metric_row = metric_row.where(metric_row.notna(), None).fillna(method="ffill")

    data = raw.iloc[3:].reset_index(drop=True)

    # derive month columns robustly
    months = data[0].apply(month_from_cell)
    data = data.assign(month_name=months.apply(lambda t: t[0]), month_num=months.apply(lambda t: t[1]))
    data = data[data["month_num"].notna()].copy()
    data.rename(columns={0: "Month"}, inplace=True)

    recs = []
    for _, r in data.iterrows():
        mname = str(r["month_name"]).strip()
        mnum  = int(r["month_num"])
        for c in range(1, raw.shape[1]):
            metric_label = _norm_metric(metric_row[c])
            if not metric_label:
                continue
            y = _coerce_float(year_row[c])
            year = int(y) if y and y >= 1900 else None
            if year is None:
                continue
            val = _coerce_float(r[c])
            if val is None:
                continue

            vtype = "count"
            if metric_label in {"Engagement Rate", "Open percentage"}:
                vtype = "percent"
                if val <= 1.0:
                    val *= 100.0

            recs.append((metric_label, year, mname, mnum, float(val), vtype))
    return pd.DataFrame(recs, columns=["metric","year","month_name","month_num","value","value_type"])

# ---- per-platform parsers ----
def parse_facebook(xlsx_path: Path) -> list[dict]:
    sheet = _sheet_name(xlsx_path, r"\s*facebook\s*", "Facebook")
    df = _parse_common(xlsx_path, sheet)
    df.insert(0, "platform", "facebook")
    return df.to_dict(orient="records")

def parse_instagram(xlsx_path: Path) -> list[dict]:
    sheet = _sheet_name(xlsx_path, r"\s*instagram\s*", "Instagram")
    df = _parse_common(xlsx_path, sheet)
    df.insert(0, "platform", "instagram")
    return df.to_dict(orient="records")

def parse_linkedin(xlsx_path: Path) -> list[dict]:
    sheet = _sheet_name(xlsx_path, r"\s*linkedin\s*", "LinkedIn")
    df = _parse_common(xlsx_path, sheet)
    df.insert(0, "platform", "linkedin")
    return df.to_dict(orient="records")

def parse_newsletter(xlsx_path: Path) -> list[dict]:
    # accept ENEWSLETTER / E-NEWSLETTER / NEWSLETTER
    sheet = _sheet_name(xlsx_path, r"\s*(e-?\s*newsletter|enewsletter|newsletter)\s*", "ENEWSLETTER")
    df = _parse_common(xlsx_path, sheet)
    df.insert(0, "platform", "newsletter")
    return df.to_dict(orient="records")

def parse_podbean(xlsx_path: Path) -> list[dict]:
    sheet = _sheet_name(xlsx_path, r"\s*podbean\s*", "PODBEAN")
    df = _parse_common(xlsx_path, sheet)
    df.insert(0, "platform", "podbean")
    return df.to_dict(orient="records")

# ---- merge/write helpers ----
def _merge(out_json: Path, new_rows: list[dict]):
    old = json.loads(out_json.read_text(encoding="utf-8") or "[]") if out_json.exists() else []
    key = lambda r: (r["platform"], r["metric"], int(r["year"]), int(r["month_num"]))
    idx = { key(r): r for r in old }
    for r in new_rows:
        idx[key(r)] = r
    out_json.write_text(json.dumps(list(idx.values()), ensure_ascii=False, indent=2), encoding="utf-8")

# ---- main ----
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input",  required=True, help="Path to workbook")
    ap.add_argument("--outdir", required=True, help="Directory to write JSONs")
    ap.add_argument("--platform", default="all",
                    choices=["facebook","instagram","linkedin","newsletter","podbean","all"])
    ap.add_argument("--mode", choices=["merge","overwrite"], default="merge")
    args = ap.parse_args()

    xlsx = Path(args.input).expanduser().resolve()
    outd = Path(args.outdir).expanduser().resolve()
    outd.mkdir(parents=True, exist_ok=True)
    if not xlsx.exists():
        raise FileNotFoundError(xlsx)

    platforms = (["facebook","instagram","linkedin","newsletter","podbean"]
                 if args.platform == "all" else [args.platform])

    for p in platforms:
        if p == "facebook":    rows = parse_facebook(xlsx)
        elif p == "instagram": rows = parse_instagram(xlsx)
        elif p == "linkedin":  rows = parse_linkedin(xlsx)
        elif p == "newsletter":rows = parse_newsletter(xlsx)
        elif p == "podbean":   rows = parse_podbean(xlsx)
        else:                  rows = []

        out_json = outd / f"{p}_all.json"
        if args.mode == "merge" and out_json.exists():
            _merge(out_json, rows)
        else:
            out_json.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Wrote {out_json} ({len(rows)} rows)")

if __name__ == "__main__":
    main()

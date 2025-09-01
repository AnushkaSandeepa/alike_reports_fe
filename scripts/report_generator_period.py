# scripts/report_generator_period.py
import sys, json, datetime, statistics, os

def parse_date(s):
    try:
        return datetime.datetime.strptime(s, "%Y-%m-%d").date()
    except Exception:
        return None

def safe_num(x):
    try:
        return float(x)
    except Exception:
        return None

def main():
    if len(sys.argv) < 4:
        print("Usage: period_report_generator.py START_DATE END_DATE DB_PATH", file=sys.stderr)
        sys.exit(2)

    start_s, end_s, db_path = sys.argv[1], sys.argv[2], sys.argv[3]
    start = parse_date(start_s)
    end   = parse_date(end_s)
    if not start or not end or start > end:
        print("Invalid date range", file=sys.stderr)
        sys.exit(3)

    if not os.path.exists(db_path):
        print("DB not found: " + db_path, file=sys.stderr)
        sys.exit(4)

    with open(db_path, "r", encoding="utf-8") as f:
        rows = json.load(f) or []

    # filter by event_date (fallback generated_date)
    selected = []
    for r in rows:
        ds = r.get("event_date") or r.get("generated_date")
        d  = parse_date(ds) if ds else None
        if d and start <= d <= end:
            selected.append(r)

    # Aggregate
    networking_rates = []
    workshop_pre, workshop_post, workshop_inc, workshop_sat = [], [], [], []

    for r in selected:
        pt = r.get("program_type")
        cd = r.get("confidence_data") or {}
        if pt == "networking_events":
            sr = safe_num(cd.get("satisfaction_rate"))
            if sr is not None:
                networking_rates.append(sr)
        elif pt == "workshop":
            pre = safe_num(cd.get("pre_percent"))
            post = safe_num(cd.get("post_percent"))
            inc = safe_num(cd.get("increase_percent"))
            sat = safe_num(cd.get("satisfaction_rate"))
            if pre is not None:  workshop_pre.append(pre)
            if post is not None: workshop_post.append(post)
            if inc is not None:  workshop_inc.append(inc)
            if sat is not None:  workshop_sat.append(sat)

    def avg(lst):
        return round(statistics.fmean(lst), 2) if lst else None

    # overall satisfaction across networking + workshop
    all_satisfaction = networking_rates + workshop_sat
    overall_satisfaction = avg(all_satisfaction)

    result = {
        "reportType": "period",
        "start_date": start_s,
        "end_date": end_s,
        "generated_date": datetime.date.today().isoformat(),
        "included_report_ids": [r.get("reportId") for r in selected],
        "counts": {
            "total_reports": len(selected),
            "networking_events": sum(1 for r in selected if r.get("program_type")=="networking_events"),
            "workshops": sum(1 for r in selected if r.get("program_type")=="workshop"),
            "with_satisfaction": len(all_satisfaction), 
        },
        "aggregates": {
            "overall": {  
                "avg_satisfaction_percent": overall_satisfaction,
            },
            "networking_events": {
                "avg_satisfaction_percent": avg(networking_rates),
            },
            "workshop": {
                "avg_pre_percent":  avg(workshop_pre),
                "avg_post_percent": avg(workshop_post),
                "avg_increase_percent": avg(workshop_inc),
                "avg_satisfaction_percent": avg(workshop_sat),
            },
        },
    }

    print("===RESULT===")
    print(json.dumps(result, ensure_ascii=False))
    print("===END===")

if __name__ == "__main__":
    main()

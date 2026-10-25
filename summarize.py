import json
import glob
import os

print("=" * 80)
print("SHIFTGUARD-6G BENCHMARK EXPERIMENTAL SUMMARY (10 SEEDS MEAN)")
print("=" * 80)

for f in sorted(glob.glob("results/exp*.json")):
    with open(f, "r", encoding="utf-8") as fp:
        d = json.load(fp)

    print(f"\n=======================================================")
    print(f"EXPERIMENT: {d.get('experiment_name', f)}")
    print(f"ID: {d.get('experiment_id')} | Seeds: {d.get('n_seeds')} | Drift: {d.get('is_drift_experiment')}")
    print(f"=======================================================")

    for aid, a in d["approaches"].items():
        m = a["metrics"]
        print(f"\n[{a['name']}]")
        
        # Base violation note
        b_rate = m.get("base_violation_rate")
        if isinstance(b_rate, dict) and "mean" in b_rate:
            unrel = m.get("classification_unreliable", False)
            unrel_str = " (UNRELIABLE: skew >95% or <5%)" if unrel else ""
            print(f"  {'base_violation_rate':32s} {round(b_rate['mean'], 3)}{unrel_str}")

        # Core regression
        for metric in ["mae", "mae_retained", "rmse", "rmse_retained", "retained_fraction", "aurc"]:
            if metric in m and m[metric] is not None and "mean" in m[metric]:
                print(f"  {metric:32s} {round(m[metric]['mean'], 3)}")

        # Matched rate comparisons
        for metric in ["mae_at_10pct_abstention", "mae_at_20pct_abstention", "mae_at_30pct_abstention"]:
            if metric in m and m[metric] is not None and "mean" in m[metric]:
                print(f"  {metric:32s} {round(m[metric]['mean'], 3)}")

        # Conformal intervals
        for metric in ["coverage", "calibration_error", "interval_width_mean"]:
            if metric in m:
                if m[metric] is None:
                    print(f"  {metric:32s} None (no interval mechanism)")
                elif "mean" in m[metric]:
                    print(f"  {metric:32s} {round(m[metric]['mean'], 3)}")

        # Abstention & warning quality (dual versions)
        for metric in [
            "abstention_rate",
            "missed_risk_rate_retained",
            "missed_risk_rate_inclusive",
            "false_alarm_rate_retained",
            "false_alarm_rate_inclusive",
            "precision_retained",
            "precision_inclusive",
            "recall_retained",
            "recall_inclusive",
            "f1_retained",
            "f1_inclusive",
            "detection_delay",
            "runtime_ms_per_1k",
        ]:
            if metric in m and m[metric] is not None and "mean" in m[metric]:
                print(f"  {metric:32s} {round(m[metric]['mean'], 3)}")
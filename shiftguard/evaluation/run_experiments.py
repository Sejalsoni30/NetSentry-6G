"""Component D: Benchmark Experiment Runner for ShiftGuard-6G.

Executes all experimental regimes across predictive approaches and ablations:
Approaches:
1. approach1_conventional: Baseline point regressor with zero uncertainty warning
2. approach2_conformal: Normalized split conformal prediction (coverage target 90%)
3. approach3_shiftguard: Proposed ShiftGuard (conformal width + unfamiliarity score)
4. ablation_width_only: Abstention based exclusively on conformal interval width
5. ablation_ood_only: Abstention based exclusively on Isolation Forest OOD score
6. ablation_random: Uniform random abstention matching ShiftGuard rate (control)
7. ablation_shiftguard_missing: ShiftGuard with explicit missing-telemetry awareness

Experiments:
1. exp1_normal: Normal conditions (baseline test)
2. exp2_single_shift: Single disturbance (traffic surge)
3. exp3_compound_shift: Multi-factor compound shift (surge + noise + handovers)
4. exp4_temporal_drift: Gradual non-stationary drift over time
5. exp5_missing_telemetry: Intermittent packet/telemetry dropouts
6. exp6_unfamiliar_extreme: Unfamiliar combinations & epistemic stress
7. exp7_matched_severity: Single vs. Compound shifts at the exact same total severity budget

All outputs contain {"simulated": true} and are computed from actual execution across >= 10 seeds.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

from shiftguard.simulator.scenarios import (
    Scenario,
    generate_scenario_data,
    generate_drift_scenario_data,
    get_scenario_catalog,
)
from shiftguard.models.baseline import BaselinePredictor
from shiftguard.reliability.conformal import NormalizedConformalPredictor
from shiftguard.reliability.ood import UnfamiliarityDetector
from shiftguard.reliability.abstain import (
    ShiftGuardReliabilityEngine,
    WidthOnlyEngine,
    OodOnlyEngine,
    RandomAbstainEngine,
    ShiftGuardMissingAwareEngine,
)
from shiftguard.evaluation.metrics import evaluate_approach_on_dataset

DEFAULT_SEEDS = [42, 107, 211, 313, 419, 521, 631, 733, 839, 941]
RESULTS_DIR = Path("results")


def aggregate_seed_metrics(seed_records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Aggregate metric dictionaries across multiple seeds.
    
    Preserves None for non-existent metrics (e.g. coverage in point prediction models).
    """
    if not seed_records:
        return {}

    metric_keys = seed_records[0].keys()
    agg = {}

    for k in metric_keys:
        # Check if values are boolean or None
        sample_val = seed_records[0][k]
        if sample_val is None:
            agg[k] = None
            continue
        if isinstance(sample_val, bool):
            agg[k] = any(r[k] for r in seed_records if r.get(k) is not None)
            continue

        values = [r[k] for r in seed_records if r.get(k) is not None and not np.isnan(r[k])]
        if values:
            agg[k] = {
                "mean": float(np.mean(values)),
                "std": float(np.std(values)),
                "min": float(np.min(values)),
                "max": float(np.max(values)),
            }
        else:
            agg[k] = None

    return agg


def run_benchmark_suite(
    seeds: List[int] = DEFAULT_SEEDS,
    output_dir: Path = RESULTS_DIR,
    n_train: int = 1500,
    n_calib: int = 1000,
    n_val: int = 600,
    n_test: int = 1200,
) -> Dict[str, Any]:
    """Execute the full benchmark suite across all seeds, approaches, and experiments."""
    output_dir.mkdir(parents=True, exist_ok=True)

    experiment_keys = [
        ("exp1_normal", "Normal Conditions", False),
        ("exp2_single_shift", "Single Shift (Traffic Surge)", False),
        ("exp3_compound_shift", "Compound Shift", False),
        ("exp4_temporal_drift", "Temporal Drift", True),
        ("exp5_missing_telemetry", "Missing / Delayed Telemetry", False),
        ("exp6_unfamiliar_extreme", "Unfamiliar Combinations", False),
        ("exp7_single_matched", "Matched Severity: Single Shift", False),
        ("exp7_compound_matched", "Matched Severity: Compound Shift", False),
    ]

    approach_keys = [
        ("approach1_conventional", "Conventional Model (No Warning)"),
        ("approach2_conformal", "Conformal UQ Model (Coverage Target 90%)"),
        ("approach3_shiftguard", "Proposed ShiftGuard (UQ + Unfamiliarity Abstention)"),
        ("ablation_width_only", "Ablation: Conformal Width-Only Abstention"),
        ("ablation_ood_only", "Ablation: Isolation Forest OOD-Only Abstention"),
        ("ablation_random", "Control: Random Abstention (Matched Rate)"),
        ("ablation_shiftguard_missing", "Ablation: ShiftGuard Missing-Telemetry Aware"),
    ]

    raw_results: Dict[str, Dict[str, List[Dict[str, Any]]]] = {
        exp_k: {app_k: [] for app_k, _ in approach_keys}
        for exp_k, _, _ in experiment_keys
    }

    print(f"Starting ShiftGuard-6G Comprehensive Benchmark Suite ({len(seeds)} random seeds, {len(approach_keys)} approaches)...")

    for seed_idx, seed in enumerate(seeds):
        print(f"  --> Seed {seed_idx + 1}/{len(seeds)} (seed={seed})")

        catalog = get_scenario_catalog(base_seed=seed)

        # 1. Training Set (Normal calm regime)
        train_df = generate_scenario_data(catalog["train"]["normal_train"], n_samples=n_train)

        # 2. Calibration Set (Normal calm regime, independent seed)
        calib_df = generate_scenario_data(catalog["calibration"]["normal_calib"], n_samples=n_calib)

        # 3. Validation Set (Moderate shifts used strictly for threshold tuning — zero test leakage)
        val_dfs = [
            generate_scenario_data(scen, n_samples=n_val)
            for scen in catalog["validation"].values()
        ]
        val_df = pd.concat(val_dfs, ignore_index=True)

        # 4. Train Models & Calibrate
        base_model = BaselinePredictor(random_state=seed).fit(train_df)

        conformal_predictor = NormalizedConformalPredictor(base_model, alpha=0.10, random_state=seed)
        conformal_predictor.fit_dispersion(train_df).calibrate(calib_df)

        ood_detector = UnfamiliarityDetector(random_state=seed).fit(train_df)

        # Thresholds tuned strictly on validation set
        shiftguard_engine = ShiftGuardReliabilityEngine(conformal_predictor, ood_detector)
        shiftguard_engine.tune_thresholds_on_validation(val_df, calib_df, max_normal_abstention=0.08)

        width_engine = WidthOnlyEngine(conformal_predictor)
        width_engine.tune_thresholds_on_validation(val_df, calib_df, max_normal_abstention=0.08)

        ood_engine = OodOnlyEngine(base_model, ood_detector)
        ood_engine.tune_thresholds_on_validation(val_df, calib_df, max_normal_abstention=0.08)

        missing_engine = ShiftGuardMissingAwareEngine(conformal_predictor, ood_detector)
        missing_engine.tune_thresholds_on_validation(val_df, calib_df, max_normal_abstention=0.08)

        # 5. Evaluate on all held-out test scenarios
        for exp_k, exp_label, is_drift in experiment_keys:
            scen_config = catalog["test"][exp_k]

            if is_drift:
                test_df = generate_drift_scenario_data(scen_config, n_samples=n_test, drift_start_pct=0.35)
            else:
                test_df = generate_scenario_data(scen_config, n_samples=n_test)

            # Evaluate ShiftGuard first to obtain empirical abstention rate for random control
            m_shiftguard = evaluate_approach_on_dataset("approach3_shiftguard", shiftguard_engine, test_df)
            sg_abstain_rate = m_shiftguard["abstention_rate"]

            random_engine = RandomAbstainEngine(base_model, target_rate=sg_abstain_rate, seed=seed)

            models_map = {
                "approach1_conventional": (base_model, "approach1_conventional"),
                "approach2_conformal": (conformal_predictor, "approach2_conformal"),
                "approach3_shiftguard": (shiftguard_engine, "approach3_shiftguard"),
                "ablation_width_only": (width_engine, "ablation_width_only"),
                "ablation_ood_only": (ood_engine, "ablation_ood_only"),
                "ablation_random": (random_engine, "ablation_random"),
                "ablation_shiftguard_missing": (missing_engine, "ablation_shiftguard_missing"),
            }

            for app_k, (model_inst, route_name) in models_map.items():
                if app_k == "approach3_shiftguard":
                    raw_results[exp_k][app_k].append(m_shiftguard)
                else:
                    metrics = evaluate_approach_on_dataset(route_name, model_inst, test_df)
                    raw_results[exp_k][app_k].append(metrics)

    # 6. Aggregate results and serialize to results/*.json
    summary_by_experiment: Dict[str, Any] = {}

    for exp_k, exp_label, is_drift in experiment_keys:
        exp_data: Dict[str, Any] = {
            "simulated": True,
            "experiment_id": exp_k,
            "experiment_name": exp_label,
            "is_drift_experiment": is_drift,
            "n_seeds": len(seeds),
            "seeds": seeds,
            "approaches": {},
        }

        for app_k, app_label in approach_keys:
            seed_metrics = raw_results[exp_k][app_k]
            aggregated = aggregate_seed_metrics(seed_metrics)
            exp_data["approaches"][app_k] = {
                "name": app_label,
                "metrics": aggregated,
            }

        exp_filepath = output_dir / f"{exp_k}.json"
        with open(exp_filepath, "w", encoding="utf-8") as f:
            json.dump(exp_data, f, indent=2)

        summary_by_experiment[exp_k] = exp_data

    master_summary = {
        "simulated": True,
        "benchmark_title": "ShiftGuard-6G Comprehensive Reliability Benchmark",
        "timestamp_utc": pd.Timestamp.now("UTC").isoformat(),
        "n_seeds": len(seeds),
        "seeds": seeds,
        "experiments": summary_by_experiment,
    }

    summary_filepath = output_dir / "benchmark_summary.json"
    with open(summary_filepath, "w", encoding="utf-8") as f:
        json.dump(master_summary, f, indent=2)

    print(f"Benchmark suite execution complete. Results saved to {output_dir}/")
    return master_summary


if __name__ == "__main__":
    run_benchmark_suite()

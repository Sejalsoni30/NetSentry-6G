"""Component D: Experiment Runner for ShiftGuard-6G Benchmark Suite.

Executes all 6 experiments across 3 predictive approaches and >= 10 random seeds:
- Exp 1: Normal Conditions (Baseline)
- Exp 2: Single Shift (Traffic Surge)
- Exp 3: Compound Shift (Surge + Noise + Handovers)
- Exp 4: Temporal Drift (Evolving Non-Stationary Shift)
- Exp 5: Missing / Delayed Telemetry (30% Telemetry Loss)
- Exp 6: Unfamiliar Combinations (Extreme Out-of-Distribution Stress)

Approaches compared:
- Approach 1: Conventional Model (No uncertainty warning)
- Approach 2: Conformal UQ Model (Normalized Split Conformal Intervals)
- Approach 3: Proposed ShiftGuard Method (Conformal Uncertainty + Unfamiliarity Abstention)

All outputs contain {"simulated": true} and are computed from actual execution.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List
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
from shiftguard.reliability.abstain import ShiftGuardReliabilityEngine
from shiftguard.evaluation.metrics import evaluate_approach_on_dataset

DEFAULT_SEEDS = [42, 107, 211, 313, 419, 521, 631, 733, 839, 941]
RESULTS_DIR = Path("results")


def aggregate_seed_metrics(seed_records: List[Dict[str, float]]) -> Dict[str, Dict[str, float]]:
    """Aggregate metrics across multiple seeds into mean and std."""
    if not seed_records:
        return {}

    metric_keys = seed_records[0].keys()
    agg = {}

    for k in metric_keys:
        values = [r[k] for r in seed_records if k in r and not np.isnan(r[k])]
        if values:
            agg[k] = {
                "mean": float(np.mean(values)),
                "std": float(np.std(values)),
                "min": float(np.min(values)),
                "max": float(np.max(values)),
            }
        else:
            agg[k] = {"mean": 0.0, "std": 0.0, "min": 0.0, "max": 0.0}

    return agg


def run_benchmark_suite(
    seeds: List[int] = DEFAULT_SEEDS,
    output_dir: Path = RESULTS_DIR,
    n_train: int = 1500,
    n_calib: int = 1000,
    n_val: int = 600,
    n_test: int = 1200,
) -> Dict[str, Any]:
    """Execute the full benchmark suite across all seeds and experimental regimes."""
    output_dir.mkdir(parents=True, exist_ok=True)

    experiment_keys = [
        ("exp1_normal", "Normal Conditions", False),
        ("exp2_single_shift", "Single Shift (Traffic Surge)", False),
        ("exp3_compound_shift", "Compound Shift", False),
        ("exp4_temporal_drift", "Temporal Drift", True),
        ("exp5_missing_telemetry", "Missing / Delayed Telemetry", False),
        ("exp6_unfamiliar_extreme", "Unfamiliar Combinations", False),
    ]

    approach_keys = [
        ("approach1_conventional", "Conventional Model (No Warning)"),
        ("approach2_conformal", "Conformal UQ Model (Coverage Target 90%)"),
        ("approach3_shiftguard", "Proposed ShiftGuard (UQ + Unfamiliarity Abstention)"),
    ]

    # Nested tracking: [exp_key][app_key] -> list of seed metrics
    raw_results: Dict[str, Dict[str, List[Dict[str, float]]]] = {
        exp_k: {app_k: [] for app_k, _ in approach_keys}
        for exp_k, _, _ in experiment_keys
    }

    print(f"Starting ShiftGuard-6G Benchmark Suite across {len(seeds)} random seeds...")

    for seed_idx, seed in enumerate(seeds):
        print(f"  --> Seed {seed_idx + 1}/{len(seeds)} (base_seed={seed})")

        catalog = get_scenario_catalog(base_seed=seed)

        # 1. Generate Training Data
        train_df = generate_scenario_data(catalog["train"]["normal_train"], n_samples=n_train)

        # 2. Generate Held-out Calibration Data
        calib_df = generate_scenario_data(catalog["calibration"]["normal_calib"], n_samples=n_calib)

        # 3. Generate Validation Data (for threshold tuning strictly, no test data leakage)
        val_dfs = [
            generate_scenario_data(scen, n_samples=n_val)
            for scen in catalog["validation"].values()
        ]
        val_df = pd.concat(val_dfs, ignore_index=True)

        # 4. Train Models
        # Base Model
        base_model = BaselinePredictor(random_state=seed)
        base_model.fit(train_df)

        # Conformal Predictor (Target 90% coverage)
        conformal_predictor = NormalizedConformalPredictor(base_model, alpha=0.10, random_state=seed)
        conformal_predictor.fit_dispersion(train_df)
        conformal_predictor.calibrate(calib_df)

        # Unfamiliarity Detector (Isolation Forest)
        ood_detector = UnfamiliarityDetector(random_state=seed)
        ood_detector.fit(train_df)

        # ShiftGuard Reliability Engine (Tuned strictly on validation data)
        shiftguard_engine = ShiftGuardReliabilityEngine(conformal_predictor, ood_detector)
        shiftguard_engine.tune_thresholds_on_validation(val_df, calib_df, max_normal_abstention=0.08)

        models_map = {
            "approach1_conventional": base_model,
            "approach2_conformal": conformal_predictor,
            "approach3_shiftguard": shiftguard_engine,
        }

        # 5. Evaluate on all 6 held-out test scenarios
        for exp_k, exp_label, is_drift in experiment_keys:
            scen_config = catalog["test"][exp_k]

            if is_drift:
                test_df = generate_drift_scenario_data(scen_config, n_samples=n_test, drift_start_pct=0.35)
            else:
                test_df = generate_scenario_data(scen_config, n_samples=n_test)

            for app_k, _ in approach_keys:
                model_inst = models_map[app_k]
                metrics = evaluate_approach_on_dataset(app_k, model_inst, test_df)
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

        # Save individual experiment JSON
        exp_filepath = output_dir / f"{exp_k}.json"
        with open(exp_filepath, "w", encoding="utf-8") as f:
            json.dump(exp_data, f, indent=2)

        summary_by_experiment[exp_k] = exp_data

    # Save master benchmark comparison summary
    master_summary = {
        "simulated": True,
        "benchmark_title": "ShiftGuard-6G Reliability Benchmark",
        "timestamp_utc": pd.Timestamp.utcnow().isoformat(),
        "n_seeds": len(seeds),
        "seeds": seeds,
        "experiments": summary_by_experiment,
    }

    summary_filepath = output_dir / "benchmark_summary.json"
    with open(summary_filepath, "w", encoding="utf-8") as f:
        json.dump(master_summary, f, indent=2)

    print(f"Benchmark run complete. All results saved to {output_dir}/")
    return master_summary


if __name__ == "__main__":
    run_benchmark_suite()

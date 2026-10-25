"""Component E: FastAPI Service for ShiftGuard-6G.

Exposes endpoints to query benchmark scenarios, precomputed empirical experiment results,
and side-by-side paradigm comparisons.
Does NOT train models at request time; serves validated precomputed results from results/.
All data served is synthetic and labeled with "simulated": true.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List
from fastapi import FastAPI, HTTPException, Path as FastPath
from fastapi.middleware.cors import CORSMiddleware
from shiftguard.simulator.scenarios import get_scenario_catalog

RESULTS_DIR = Path("results")

app = FastAPI(
    title="ShiftGuard-6G Reliability API",
    description="REST API serving reproducible stress-testing benchmark results for 6G network predictions under compound shifts.",
    version="0.1.0",
)

# Enable CORS for cross-origin observatory dashboards
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> Dict[str, Any]:
    """Health check endpoint indicating service status and available precomputed results."""
    available_files = []
    if RESULTS_DIR.exists():
        available_files = [f.stem for f in RESULTS_DIR.glob("*.json")]

    return {
        "status": "healthy",
        "simulated": True,
        "service": "ShiftGuard-6G Reliability API",
        "version": "0.1.0",
        "results_directory_exists": RESULTS_DIR.exists(),
        "available_experiments": [f for f in available_files if f != "benchmark_summary"],
        "has_master_summary": (RESULTS_DIR / "benchmark_summary.json").exists(),
    }


@app.get("/scenarios")
def list_scenarios() -> Dict[str, Any]:
    """Return scenario specifications organized by split (train, calib, validation, test)."""
    catalog = get_scenario_catalog()
    serialized = {}
    for split_name, scens in catalog.items():
        serialized[split_name] = {k: v.to_dict() for k, v in scens.items()}

    return {
        "simulated": True,
        "splits": serialized,
        "description": "Deterministic scenario parameters across nominal, shifted, drift, missing, and unfamiliar regimes.",
    }


@app.get("/results/{experiment}")
def get_experiment_results(
    experiment: str = FastPath(
        ...,
        description="Experiment ID, e.g. exp1_normal, exp2_single_shift, exp3_compound_shift, exp4_temporal_drift, exp5_missing_telemetry, exp6_unfamiliar_extreme",
    )
) -> Dict[str, Any]:
    """Retrieve precomputed benchmark results for a specific experiment across all approaches."""
    # Strip optional .json extension if user passed it
    clean_id = experiment[:-5] if experiment.endswith(".json") else experiment
    file_path = RESULTS_DIR / f"{clean_id}.json"

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Experiment results '{clean_id}' not found. Available: {[f.stem for f in RESULTS_DIR.glob('exp*.json')]}",
        )

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        data["simulated"] = True
        return data
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to read result file: {str(exc)}")


@app.get("/compare")
def compare_approaches() -> Dict[str, Any]:
    """Compare all three approaches side-by-side across all 6 benchmark experiments."""
    summary_path = RESULTS_DIR / "benchmark_summary.json"
    if not summary_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Benchmark master summary not found. Run `python -m shiftguard.evaluation.run_experiments` first.",
        )

    try:
        with open(summary_path, "r", encoding="utf-8") as f:
            master = json.load(f)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to load summary: {str(exc)}")

    # Construct clean comparative matrix
    comparisons = []
    for exp_id, exp_data in master.get("experiments", {}).items():
        approaches = exp_data.get("approaches", {})
        comparisons.append({
            "experiment_id": exp_id,
            "experiment_name": exp_data.get("experiment_name"),
            "approaches": {
                app_id: {
                    "name": app_info.get("name"),
                    "mae_mean": app_info.get("metrics", {}).get("mae", {}).get("mean"),
                    "mae_retained_mean": app_info.get("metrics", {}).get("mae_retained", {}).get("mean"),
                    "coverage_mean": app_info.get("metrics", {}).get("coverage", {}).get("mean"),
                    "calibration_error_mean": app_info.get("metrics", {}).get("calibration_error", {}).get("mean"),
                    "abstention_rate_mean": app_info.get("metrics", {}).get("abstention_rate", {}).get("mean"),
                    "missed_risk_rate_mean": app_info.get("metrics", {}).get("missed_risk_rate", {}).get("mean"),
                    "false_alarm_rate_mean": app_info.get("metrics", {}).get("false_alarm_rate", {}).get("mean"),
                    "detection_delay_mean": app_info.get("metrics", {}).get("detection_delay", {}).get("mean"),
                    "runtime_ms_per_1k": app_info.get("metrics", {}).get("runtime_ms_per_1k", {}).get("mean"),
                }
                for app_id, app_info in approaches.items()
            }
        })

    return {
        "simulated": True,
        "title": "ShiftGuard-6G Multi-Paradigm Comparison Matrix",
        "n_seeds": master.get("n_seeds"),
        "comparisons": comparisons,
    }

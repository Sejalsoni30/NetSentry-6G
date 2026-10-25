"""Component D: Evaluation Metrics for 6G Latency and Reliability Benchmarking.

Computes:
- Regression quality: MAE, RMSE (both all-sample and retained-sample)
- Classification quality: Precision, Recall, Macro F1 for QoS violations (latency > 60 ms)
- Conformal reliability: Empirical Coverage, Calibration Error (|0.90 - Coverage|)
- Operational warning quality: Abstention Rate, False-Alarm Rate, Missed-Risk Rate
- Temporal dynamics: Detection Delay in drift scenarios
- Execution profile: Inference Latency (ms / 1k samples), Memory Peak (MB)
"""

from __future__ import annotations

import time
import tracemalloc
from typing import Dict, Optional, Tuple
import numpy as np
import pandas as pd
from shiftguard.models.baseline import QOS_THRESHOLD_MS


def compute_regression_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    abstain_mask: Optional[np.ndarray] = None,
) -> Dict[str, float]:
    """Compute MAE and RMSE across all samples and on retained predictions."""
    diff = y_true - y_pred
    mae_all = float(np.mean(np.abs(diff)))
    rmse_all = float(np.sqrt(np.mean(diff ** 2)))

    res = {
        "mae": mae_all,
        "rmse": rmse_all,
    }

    if abstain_mask is not None and np.any(~abstain_mask):
        retained = ~abstain_mask
        diff_ret = y_true[retained] - y_pred[retained]
        res["mae_retained"] = float(np.mean(np.abs(diff_ret)))
        res["rmse_retained"] = float(np.sqrt(np.mean(diff_ret ** 2)))
        res["retained_fraction"] = float(np.mean(retained))
    else:
        res["mae_retained"] = mae_all
        res["rmse_retained"] = rmse_all
        res["retained_fraction"] = 1.0

    return res


def compute_classification_metrics(
    y_true_binary: np.ndarray,
    y_pred_binary: np.ndarray,
    abstain_mask: Optional[np.ndarray] = None,
) -> Dict[str, float]:
    """Compute Precision, Recall, and F1 for QoS violation detection."""
    # When abstaining, an abstention on a true breach counts as protective handling
    tp = np.sum((y_pred_binary == 1) & (y_true_binary == 1))
    fp = np.sum((y_pred_binary == 1) & (y_true_binary == 0))
    fn = np.sum((y_pred_binary == 0) & (y_true_binary == 1))
    tn = np.sum((y_pred_binary == 0) & (y_true_binary == 0))

    precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    f1 = float(2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

    return {
        "precision": precision,
        "recall": recall,
        "f1": f1,
    }


def compute_reliability_metrics(
    y_true: np.ndarray,
    lower: Optional[np.ndarray],
    upper: Optional[np.ndarray],
    nominal_coverage: float = 0.90,
) -> Dict[str, float]:
    """Compute empirical coverage, calibration error, and average interval width."""
    if lower is None or upper is None:
        return {
            "coverage": 0.0,
            "calibration_error": nominal_coverage,
            "interval_width_mean": 0.0,
            "interval_width_std": 0.0,
        }

    covered = (y_true >= lower) & (y_true <= upper)
    empirical_cov = float(np.mean(covered))
    calib_err = float(abs(nominal_coverage - empirical_cov))
    widths = upper - lower

    return {
        "coverage": empirical_cov,
        "calibration_error": calib_err,
        "interval_width_mean": float(np.mean(widths)),
        "interval_width_std": float(np.std(widths)),
    }


def compute_warning_quality_metrics(
    y_true: np.ndarray,
    y_pred_binary: np.ndarray,
    abstain_mask: Optional[np.ndarray] = None,
) -> Dict[str, float]:
    """Compute abstention rate, false-alarm rate, and missed-risk rate."""
    actual_violations = y_true > QOS_THRESHOLD_MS
    actual_safe = ~actual_violations

    if abstain_mask is None:
        abstain_mask = np.zeros(len(y_true), dtype=bool)

    abstention_rate = float(np.mean(abstain_mask))

    # False-Alarm Rate: safe outcomes incorrectly alerted or abstained
    safe_count = int(np.sum(actual_safe))
    if safe_count > 0:
        false_alarms = np.sum(actual_safe & ((y_pred_binary == 1) | abstain_mask))
        false_alarm_rate = float(false_alarms / safe_count)
    else:
        false_alarm_rate = 0.0

    # Missed-Risk Rate: critical breaches that went completely unflagged and unabstained
    violation_count = int(np.sum(actual_violations))
    if violation_count > 0:
        silent_failures = np.sum(actual_violations & (y_pred_binary == 0) & (~abstain_mask))
        missed_risk_rate = float(silent_failures / violation_count)
    else:
        missed_risk_rate = 0.0

    return {
        "abstention_rate": abstention_rate,
        "false_alarm_rate": false_alarm_rate,
        "missed_risk_rate": missed_risk_rate,
    }


def compute_detection_delay(
    is_drift_active: np.ndarray,
    warning_signals: np.ndarray,
    window_consecutive: int = 4,
) -> float:
    """Measure number of time windows between start of physical drift and sustained alert."""
    drift_indices = np.where(is_drift_active == 1)[0]
    if len(drift_indices) == 0:
        return 0.0

    drift_start_idx = int(drift_indices[0])
    total_post_drift = len(is_drift_active) - drift_start_idx

    # Look for first sustained warning window
    for idx in range(drift_start_idx, len(warning_signals) - window_consecutive + 1):
        window = warning_signals[idx : idx + window_consecutive]
        if np.sum(window) == window_consecutive:
            return float(idx - drift_start_idx)

    return float(total_post_drift)


def evaluate_approach_on_dataset(
    approach_name: str,
    pipeline: object,
    df: pd.DataFrame,
) -> Dict[str, float]:
    """Run end-to-end evaluation for an approach on a specific dataset.
    
    Approaches:
    - 'approach1_conventional': BaselinePredictor
    - 'approach2_conformal': NormalizedConformalPredictor
    - 'approach3_shiftguard': ShiftGuardReliabilityEngine
    """
    y_true = df["latency"].to_numpy()
    y_true_binary = df["qos_violation"].to_numpy()
    n_samples = len(df)

    tracemalloc.start()
    t0 = time.perf_counter()

    if approach_name == "approach1_conventional":
        y_pred = pipeline.predict_latency(df)
        y_pred_bin = pipeline.predict_qos_violation(df)
        lower, upper, widths = None, None, None
        abstain = None
        warning_signal = y_pred_bin == 1

    elif approach_name == "approach2_conformal":
        y_pred, lower, upper, widths = pipeline.predict_intervals(df)
        y_pred_bin = (y_pred > QOS_THRESHOLD_MS).astype(int)
        abstain = None
        # Approach 2 flags warning if upper bound exceeds threshold
        warning_signal = upper > QOS_THRESHOLD_MS

    elif approach_name == "approach3_shiftguard":
        res = pipeline.predict(df)
        y_pred = res["latency_pred"]
        lower = res["lower"]
        upper = res["upper"]
        widths = res["interval_width"]
        abstain = res["abstain"]
        y_pred_bin = res["qos_violation_pred"]
        warning_signal = abstain | (y_pred_bin == 1)
    else:
        raise ValueError(f"Unknown approach: {approach_name}")

    elapsed_sec = time.perf_counter() - t0
    current_mem, peak_mem = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    # Time in milliseconds per 1,000 samples
    runtime_ms_per_1k = float((elapsed_sec / max(1, n_samples)) * 1000.0 * 1000.0)
    memory_peak_mb = float(peak_mem / (1024.0 * 1024.0))

    # Compute metric categories
    reg_metrics = compute_regression_metrics(y_true, y_pred, abstain_mask=abstain)
    cls_metrics = compute_classification_metrics(y_true_binary, y_pred_bin, abstain_mask=abstain)
    rel_metrics = compute_reliability_metrics(y_true, lower, upper)
    warn_metrics = compute_warning_quality_metrics(y_true, y_pred_bin, abstain_mask=abstain)

    metrics = {
        **reg_metrics,
        **cls_metrics,
        **rel_metrics,
        **warn_metrics,
        "runtime_ms_per_1k": runtime_ms_per_1k,
        "memory_peak_mb": memory_peak_mb,
    }

    # Add detection delay if drift scenario
    if "is_drift_active" in df.columns:
        delay = compute_detection_delay(df["is_drift_active"].to_numpy(), warning_signal.astype(int))
        metrics["detection_delay"] = delay

    return metrics

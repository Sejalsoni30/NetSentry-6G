"""Component D: Evaluation Metrics for 6G Latency and Reliability Benchmarking.

Computes:
- Regression quality: MAE, RMSE (both all-sample and retained-sample)
- Dual classification quality:
  (a) Retained / Actionable: Evaluated strictly among non-abstained predictions
  (b) Inclusive / Flagged: Evaluated treating abstentions as positive alerts
- Conformal reliability: Empirical Coverage, Calibration Error (None for models without intervals)
- Dual warning quality:
  (a) Retained: False Alarm and Missed Risk among retained instances
  (b) Inclusive: False Alarm and Missed Risk where abstention is an active alert
- Temporal dynamics: Detection Delay in drift scenarios
- Base violation rate and classification unreliability flag (if rate > 0.95 or < 0.05)
- Risk-coverage curves, AURC, and matched-rate evaluations (10%, 20%, 30%)
- Computational profile: Runtime (ms/1k), Memory Peak (MB)
"""

from __future__ import annotations

import time
import tracemalloc
from typing import Dict, List, Optional, Tuple, Any
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


def compute_dual_classification_metrics(
    y_true_binary: np.ndarray,
    y_pred_binary: np.ndarray,
    abstain_mask: Optional[np.ndarray] = None,
) -> Dict[str, Optional[float]]:
    """Compute both Retained and Inclusive versions of Precision, Recall, and F1.
    
    (a) Retained version: evaluated strictly among samples where the model predicted (not abstained).
    (b) Inclusive version: abstention is treated as an active violation warning.
    """
    if abstain_mask is None:
        abstain_mask = np.zeros(len(y_true_binary), dtype=bool)

    retained = ~abstain_mask

    # Version (a): Retained / Actionable
    if np.sum(retained) > 0:
        y_t_ret = y_true_binary[retained]
        y_p_ret = y_pred_binary[retained]
        tp_ret = np.sum((y_p_ret == 1) & (y_t_ret == 1))
        fp_ret = np.sum((y_p_ret == 1) & (y_t_ret == 0))
        fn_ret = np.sum((y_p_ret == 0) & (y_t_ret == 1))

        prec_ret = float(tp_ret / (tp_ret + fp_ret)) if (tp_ret + fp_ret) > 0 else 0.0
        rec_ret = float(tp_ret / (tp_ret + fn_ret)) if (tp_ret + fn_ret) > 0 else 0.0
        f1_ret = float(2 * prec_ret * rec_ret / (prec_ret + rec_ret)) if (prec_ret + rec_ret) > 0 else 0.0
    else:
        prec_ret, rec_ret, f1_ret = 0.0, 0.0, 0.0

    # Version (b): Inclusive / Flagged (abstentions treated as positive alerts)
    y_p_inc = (y_pred_binary == 1) | abstain_mask
    tp_inc = np.sum((y_p_inc == 1) & (y_true_binary == 1))
    fp_inc = np.sum((y_p_inc == 1) & (y_true_binary == 0))
    fn_inc = np.sum((y_p_inc == 0) & (y_true_binary == 1))

    prec_inc = float(tp_inc / (tp_inc + fp_inc)) if (tp_inc + fp_inc) > 0 else 0.0
    rec_inc = float(tp_inc / (tp_inc + fn_inc)) if (tp_inc + fn_inc) > 0 else 0.0
    f1_inc = float(2 * prec_inc * rec_inc / (prec_inc + rec_inc)) if (prec_inc + rec_inc) > 0 else 0.0

    return {
        "precision_retained": prec_ret,
        "recall_retained": rec_ret,
        "f1_retained": f1_ret,
        "precision_inclusive": prec_inc,
        "recall_inclusive": rec_inc,
        "f1_inclusive": f1_inc,
        # Keep canonical fields pointing to inclusive for backwards compatibility
        "precision": prec_inc,
        "recall": rec_inc,
        "f1": f1_inc,
    }


# Backwards compatibility alias
compute_classification_metrics = compute_dual_classification_metrics


def compute_reliability_metrics(
    y_true: np.ndarray,
    lower: Optional[np.ndarray],
    upper: Optional[np.ndarray],
    nominal_coverage: float = 0.90,
) -> Dict[str, Optional[float]]:
    """Compute empirical coverage, calibration error, and interval width.
    
    CRITICAL: For approaches without prediction intervals, returns None (null in JSON).
    """
    if lower is None or upper is None:
        return {
            "coverage": None,
            "calibration_error": None,
            "interval_width_mean": None,
            "interval_width_std": None,
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


def compute_dual_warning_quality_metrics(
    y_true: np.ndarray,
    y_pred_binary: np.ndarray,
    abstain_mask: Optional[np.ndarray] = None,
) -> Dict[str, float]:
    """Compute dual versions of False Alarm Rate and Missed Risk Rate.
    
    (a) Retained version: Denominator excludes abstained samples.
    (b) Inclusive version: Abstention counts as an active warning/flag.
    """
    actual_violations = y_true > QOS_THRESHOLD_MS
    actual_safe = ~actual_violations

    if abstain_mask is None:
        abstain_mask = np.zeros(len(y_true), dtype=bool)

    retained = ~abstain_mask
    abstention_rate = float(np.mean(abstain_mask))

    # --- Version (a): Retained (denominator excludes abstained samples) ---
    safe_retained = actual_safe & retained
    safe_ret_count = int(np.sum(safe_retained))
    if safe_ret_count > 0:
        far_retained = float(np.sum(safe_retained & (y_pred_binary == 1)) / safe_ret_count)
    else:
        far_retained = 0.0

    viol_retained = actual_violations & retained
    viol_ret_count = int(np.sum(viol_retained))
    if viol_ret_count > 0:
        mrr_retained = float(np.sum(viol_retained & (y_pred_binary == 0)) / viol_ret_count)
    else:
        mrr_retained = 0.0

    # --- Version (b): Inclusive (abstained counts as flagged/warned) ---
    safe_total = int(np.sum(actual_safe))
    if safe_total > 0:
        far_inclusive = float(np.sum(actual_safe & ((y_pred_binary == 1) | abstain_mask)) / safe_total)
    else:
        far_inclusive = 0.0

    viol_total = int(np.sum(actual_violations))
    if viol_total > 0:
        # Missed risk occurs ONLY if violation occurred, prediction was 0, AND model did NOT abstain
        mrr_inclusive = float(np.sum(actual_violations & (y_pred_binary == 0) & (~abstain_mask)) / viol_total)
    else:
        mrr_inclusive = 0.0

    return {
        "abstention_rate": abstention_rate,
        "false_alarm_rate_retained": far_retained,
        "missed_risk_rate_retained": mrr_retained,
        "false_alarm_rate_inclusive": far_inclusive,
        "missed_risk_rate_inclusive": mrr_inclusive,
        # Keep canonical fields pointing to inclusive for backwards compatibility
        "false_alarm_rate": far_inclusive,
        "missed_risk_rate": mrr_inclusive,
    }


def compute_detection_delay(
    is_drift_active: np.ndarray,
    warning_signals: np.ndarray,
    window_consecutive: int = 3,
) -> float:
    """Measure number of time windows between start of physical drift and sustained alert."""
    drift_indices = np.where(is_drift_active == 1)[0]
    if len(drift_indices) == 0:
        return 0.0

    drift_start_idx = int(drift_indices[0])
    total_post_drift = float(len(is_drift_active) - drift_start_idx)

    for idx in range(drift_start_idx, len(warning_signals) - window_consecutive + 1):
        window = warning_signals[idx : idx + window_consecutive]
        if np.sum(window) == window_consecutive:
            return float(idx - drift_start_idx)

    return total_post_drift


def compute_risk_coverage_curve(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    ranking_scores: np.ndarray,
    grid_points: int = 19,
) -> Tuple[List[float], List[float], float]:
    """Compute error (MAE) of retained predictions vs abstention rate (0% to 90%).
    
    Returns:
        (abstention_rates, retained_maes, aurc)
    """
    n = len(y_true)
    abs_errors = np.abs(y_true - y_pred)
    
    # Sort samples by score descending (highest uncertainty/OOD score abstained first)
    sorted_indices = np.argsort(-ranking_scores)
    
    abstention_rates = []
    retained_maes = []
    
    rates = np.linspace(0.0, 0.90, grid_points)
    for r in rates:
        n_abstain = int(np.floor(r * n))
        if n_abstain >= n:
            n_abstain = n - 1
        
        retained_idx = sorted_indices[n_abstain:]
        mae_at_r = float(np.mean(abs_errors[retained_idx]))
        
        abstention_rates.append(float(r))
        retained_maes.append(mae_at_r)

    # Compute Area Under the Risk-Coverage Curve (trapezoidal integration)
    if hasattr(np, "trapezoid"):
        aurc = float(np.trapezoid(retained_maes, abstention_rates))
    elif hasattr(np, "trapz"):
        aurc = float(getattr(np, "trapz")(retained_maes, abstention_rates))
    else:
        y_arr = np.asarray(retained_maes)
        x_arr = np.asarray(abstention_rates)
        aurc = float(np.sum(0.5 * (y_arr[1:] + y_arr[:-1]) * (x_arr[1:] - x_arr[:-1])))
    return abstention_rates, retained_maes, aurc


def compute_matched_rate_mae(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    ranking_scores: np.ndarray,
    matched_rates: Tuple[float, ...] = (0.10, 0.20, 0.30),
) -> Dict[str, float]:
    """Evaluate MAE of retained predictions at exact matched abstention rates."""
    n = len(y_true)
    abs_errors = np.abs(y_true - y_pred)
    sorted_indices = np.argsort(-ranking_scores)

    results = {}
    for r in matched_rates:
        n_abstain = int(np.floor(r * n))
        retained_idx = sorted_indices[n_abstain:]
        mae_r = float(np.mean(abs_errors[retained_idx]))
        key = f"mae_at_{int(r * 100)}pct_abstention"
        results[key] = mae_r

    return results


def evaluate_approach_on_dataset(
    approach_name: str,
    pipeline: object,
    df: pd.DataFrame,
) -> Dict[str, Any]:
    """Run comprehensive evaluation for any approach or ablation on a dataset."""
    y_true = df["latency"].to_numpy()
    y_true_binary = df["qos_violation"].to_numpy()
    n_samples = len(df)

    base_violation_rate = float(np.mean(y_true_binary))
    classification_unreliable = bool(base_violation_rate > 0.95 or base_violation_rate < 0.05)

    tracemalloc.start()
    t0 = time.perf_counter()

    # Route based on approach type
    if approach_name == "approach1_conventional":
        y_pred = pipeline.predict_latency(df)
        y_pred_bin = pipeline.predict_qos_violation(df)
        lower, upper, widths = None, None, None
        abstain = None
        ranking_scores = np.abs(y_pred - 45.0)  # proxy distance from calm median
        warning_signal = (y_pred_bin == 1)

    elif approach_name == "approach2_conformal":
        y_pred, lower, upper, widths = pipeline.predict_intervals(df)
        y_pred_bin = (y_pred > QOS_THRESHOLD_MS).astype(int)
        abstain = None
        ranking_scores = widths
        warning_signal = (upper > QOS_THRESHOLD_MS) | (y_pred_bin == 1)

    else:
        # ShiftGuard or one of the ablations
        res = pipeline.predict(df)
        y_pred = res["latency_pred"]
        lower = res.get("lower")
        upper = res.get("upper")
        widths = res.get("interval_width")
        abstain = res["abstain"]
        y_pred_bin = res["qos_violation_pred"]
        
        # Use appropriate ranking score for risk-coverage curve
        if "interval_width" in res and res["interval_width"] is not None:
            w_norm = res["interval_width"] / (np.mean(res["interval_width"]) + 1e-6)
            ood_norm = res.get("unfamiliarity_score", np.zeros_like(w_norm))
            ranking_scores = w_norm + np.maximum(0.0, ood_norm)
        else:
            ranking_scores = res.get("unfamiliarity_score", np.zeros_like(y_pred))

        warning_signal = res.get("warning_signal")
        if warning_signal is None:
            warning_signal = abstain | (y_pred_bin == 1)

    elapsed_sec = time.perf_counter() - t0
    current_mem, peak_mem = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    runtime_ms_per_1k = float((elapsed_sec / max(1, n_samples)) * 1000.0 * 1000.0)
    memory_peak_mb = float(peak_mem / (1024.0 * 1024.0))

    # Metric collections
    reg_metrics = compute_regression_metrics(y_true, y_pred, abstain_mask=abstain)
    cls_metrics = compute_dual_classification_metrics(y_true_binary, y_pred_bin, abstain_mask=abstain)
    rel_metrics = compute_reliability_metrics(y_true, lower, upper)
    warn_metrics = compute_dual_warning_quality_metrics(y_true, y_pred_bin, abstain_mask=abstain)

    # Risk-coverage curve and matched-rate comparisons
    _, _, aurc = compute_risk_coverage_curve(y_true, y_pred, ranking_scores)
    matched_maes = compute_matched_rate_mae(y_true, y_pred, ranking_scores)

    metrics: Dict[str, Any] = {
        **reg_metrics,
        **cls_metrics,
        **rel_metrics,
        **warn_metrics,
        **matched_maes,
        "aurc": aurc,
        "base_violation_rate": base_violation_rate,
        "classification_unreliable": classification_unreliable,
        "runtime_ms_per_1k": runtime_ms_per_1k,
        "memory_peak_mb": memory_peak_mb,
    }

    if "is_drift_active" in df.columns:
        delay = compute_detection_delay(df["is_drift_active"].to_numpy(), warning_signal.astype(int))
        metrics["detection_delay"] = delay

    return metrics

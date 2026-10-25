"""Unit tests for Component D: Evaluation Metrics."""

import numpy as np
import pytest
from shiftguard.evaluation.metrics import (
    compute_regression_metrics,
    compute_dual_classification_metrics,
    compute_reliability_metrics,
    compute_dual_warning_quality_metrics,
    compute_detection_delay,
    compute_risk_coverage_curve,
    compute_matched_rate_mae,
)


def test_regression_metrics_basic_and_retained():
    """MAE and RMSE must be computed accurately and reflect retained samples."""
    y_true = np.array([20.0, 30.0, 40.0, 100.0])
    y_pred = np.array([22.0, 28.0, 41.0, 50.0])
    # Abstain on the 4th sample (extreme error)
    abstain_mask = np.array([False, False, False, True])

    res = compute_regression_metrics(y_true, y_pred, abstain_mask=abstain_mask)

    # MAE all: (|2| + |2| + |1| + |50|) / 4 = 55 / 4 = 13.75
    assert np.isclose(res["mae"], 13.75)
    # MAE retained: (|2| + |2| + |1|) / 3 = 5 / 3 = 1.6667
    assert np.isclose(res["mae_retained"], 5.0 / 3.0)
    assert res["mae_retained"] < res["mae"]
    assert np.isclose(res["retained_fraction"], 0.75)


def test_dual_classification_metrics():
    """Both retained and inclusive classification metrics must be evaluated."""
    y_true = np.array([1, 1, 0, 0])
    y_pred = np.array([1, 0, 0, 0])
    abstain = np.array([False, True, False, False])  # 2nd sample abstained

    res = compute_dual_classification_metrics(y_true, y_pred, abstain_mask=abstain)

    # Retained: only indices 0, 2, 3. y_true=[1, 0, 0], y_pred=[1, 0, 0]
    # TP=1, FP=0, FN=0 -> Precision=1.0, Recall=1.0, F1=1.0
    assert np.isclose(res["precision_retained"], 1.0)
    assert np.isclose(res["recall_retained"], 1.0)
    assert np.isclose(res["f1_retained"], 1.0)

    # Inclusive: abstention counts as alert (index 1 is alerted)
    # y_pred_inc = [1, 1, 0, 0], y_true = [1, 1, 0, 0] -> Perfect detection
    assert np.isclose(res["precision_inclusive"], 1.0)
    assert np.isclose(res["recall_inclusive"], 1.0)
    assert np.isclose(res["f1_inclusive"], 1.0)


def test_reliability_metrics_none_for_point_models():
    """Models without intervals must produce None/null, not 0.0 or 0.9."""
    y_true = np.array([20.0, 30.0, 40.0])
    res_none = compute_reliability_metrics(y_true, None, None)

    assert res_none["coverage"] is None
    assert res_none["calibration_error"] is None
    assert res_none["interval_width_mean"] is None

    # When intervals are present
    lower = np.array([18.0, 25.0, 45.0])
    upper = np.array([22.0, 35.0, 55.0])
    res_valid = compute_reliability_metrics(y_true, lower, upper, nominal_coverage=0.90)
    assert res_valid["coverage"] is not None
    assert np.isclose(res_valid["coverage"], 2.0 / 3.0)
    assert np.isclose(res_valid["calibration_error"], abs(0.90 - 2.0 / 3.0))


def test_dual_warning_quality_metrics():
    """Dual false alarm and missed risk rates must correctly reflect retained vs inclusive."""
    # Threshold is 60.0 ms
    y_true = np.array([40.0, 50.0, 70.0, 80.0])  # 2 safe, 2 violations
    y_pred_bin = np.array([0, 0, 0, 1])           # 2nd is safe, 3rd predicted safe
    abstain = np.array([False, True, True, False])# 2nd and 3rd abstained

    res = compute_dual_warning_quality_metrics(y_true, y_pred_bin, abstain_mask=abstain)

    assert np.isclose(res["abstention_rate"], 0.50)

    # Retained: samples 0 and 3
    # sample 0: safe (40), predicted safe (0) -> FAR retained = 0/1 = 0.0
    # sample 3: violation (80), predicted violation (1) -> MRR retained = 0/1 = 0.0
    assert np.isclose(res["false_alarm_rate_retained"], 0.0)
    assert np.isclose(res["missed_risk_rate_retained"], 0.0)

    # Inclusive:
    # safe total = 2 (samples 0, 1). Sample 1 abstained (alerted) -> FAR inclusive = 1/2 = 0.5
    assert np.isclose(res["false_alarm_rate_inclusive"], 0.50)
    # violation total = 2 (samples 2, 3). Sample 2 abstained (caught!), sample 3 predicted 1 -> MRR = 0.0
    assert np.isclose(res["missed_risk_rate_inclusive"], 0.0)


def test_detection_delay_calculation():
    """Detection delay must count steps from drift start until sustained warning."""
    is_drift = np.array([0, 0, 0, 1, 1, 1, 1, 1, 1, 1])  # drift starts at index 3
    warnings = np.array([0, 0, 0, 0, 0, 1, 1, 1, 1, 1])  # alerts start at index 5

    delay = compute_detection_delay(is_drift, warnings, window_consecutive=3)
    # Index 5 is first sustained window (5, 6, 7). Delay = 5 - 3 = 2 steps.
    assert np.isclose(delay, 2.0)


def test_risk_coverage_curve_and_aurc():
    """Risk coverage curve must compute decreasing or monotonic retained error and AURC."""
    y_true = np.linspace(10, 100, 100)
    y_pred = np.zeros(100)  # error grows from 10 to 100
    scores = np.linspace(1, 100, 100)  # perfect uncertainty score

    rates, maes, aurc = compute_risk_coverage_curve(y_true, y_pred, scores, grid_points=10)
    assert len(rates) == 10
    assert len(maes) == 10
    # As abstention increases, error on retained samples must strictly decrease!
    assert maes[-1] < maes[0]
    assert aurc > 0.0

    matched = compute_matched_rate_mae(y_true, y_pred, scores, matched_rates=(0.10, 0.20, 0.30))
    assert "mae_at_10pct_abstention" in matched
    assert "mae_at_20pct_abstention" in matched
    assert "mae_at_30pct_abstention" in matched
    assert matched["mae_at_30pct_abstention"] < matched["mae_at_10pct_abstention"]

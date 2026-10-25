"""Unit tests for Component D: Evaluation Metrics."""

import numpy as np
import pytest
from shiftguard.evaluation.metrics import (
    compute_regression_metrics,
    compute_classification_metrics,
    compute_reliability_metrics,
    compute_warning_quality_metrics,
    compute_detection_delay,
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


def test_classification_metrics_precision_recall_f1():
    """Classification metrics must compute standard binary metrics."""
    y_true = np.array([1, 1, 0, 0])
    y_pred = np.array([1, 0, 1, 0])

    res = compute_classification_metrics(y_true, y_pred)
    assert np.isclose(res["precision"], 0.5)  # 1 TP / 2 predicted positives
    assert np.isclose(res["recall"], 0.5)     # 1 TP / 2 actual positives
    assert np.isclose(res["f1"], 0.5)


def test_reliability_metrics_coverage_and_calib_error():
    """Coverage must count ground truth inside intervals; calibration error is |target - coverage|."""
    y_true = np.array([20.0, 30.0, 40.0, 50.0])
    lower = np.array([18.0, 25.0, 45.0, 48.0])  # 3rd is not covered (40 < 45)
    upper = np.array([22.0, 35.0, 55.0, 52.0])

    res = compute_reliability_metrics(y_true, lower, upper, nominal_coverage=0.90)
    assert np.isclose(res["coverage"], 0.75)  # 3 of 4 covered
    assert np.isclose(res["calibration_error"], 0.15)  # |0.90 - 0.75|


def test_warning_quality_metrics():
    """False alarm and missed risk rates must correctly reflect safety decisions."""
    # Threshold is 60.0 ms
    y_true = np.array([40.0, 50.0, 70.0, 80.0])  # 2 safe, 2 violations
    y_pred_bin = np.array([0, 1, 0, 1])           # 2nd is false alarm, 3rd predicted 0
    abstain = np.array([False, False, True, False])# 3rd abstained (not missed risk!)

    res = compute_warning_quality_metrics(y_true, y_pred_bin, abstain_mask=abstain)

    assert np.isclose(res["abstention_rate"], 0.25)
    # Safe count = 2. 2nd was alerted -> 1/2 = 0.5
    assert np.isclose(res["false_alarm_rate"], 0.5)
    # Violations count = 2. 3rd was abstained, 4th was predicted 1.
    # Silent failures = 0 -> Missed risk rate = 0.0
    assert np.isclose(res["missed_risk_rate"], 0.0)


def test_detection_delay_calculation():
    """Detection delay must count steps from drift start until sustained warning."""
    is_drift = np.array([0, 0, 0, 1, 1, 1, 1, 1, 1, 1])  # drift starts at index 3
    # Warning signals trigger at index 5
    warnings = np.array([0, 0, 0, 0, 0, 1, 1, 1, 1, 1])

    delay = compute_detection_delay(is_drift, warnings, window_consecutive=3)
    # First index where 3 of 3 windows are 1 is index 5.
    # Delay from index 3 to 5 is 2 steps.
    assert np.isclose(delay, 2.0)

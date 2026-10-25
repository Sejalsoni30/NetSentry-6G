"""Unit tests for Component C: Conformal Prediction Engine (Approach 2)."""

import pytest
import numpy as np
from shiftguard.simulator.scenarios import Scenario, generate_scenario_data
from shiftguard.models.baseline import BaselinePredictor
from shiftguard.reliability.conformal import NormalizedConformalPredictor


def test_conformal_coverage_near_target_on_normal_data():
    """Conformal intervals on independent normal test data must achieve ~90% empirical coverage."""
    # 1. Training data
    train_scen = Scenario(name="TrainNormal", seed=10)
    train_df = generate_scenario_data(train_scen, n_samples=2000)

    # 2. Separate Calibration data (independent seed)
    calib_scen = Scenario(name="CalibNormal", seed=20)
    calib_df = generate_scenario_data(calib_scen, n_samples=1500)

    # 3. Independent Normal Test data
    test_scen = Scenario(name="TestNormal", seed=30)
    test_df = generate_scenario_data(test_scen, n_samples=2000)

    # Fit base model
    base_model = BaselinePredictor(random_state=42)
    base_model.fit(train_df)

    # Calibrate conformal predictor (target 90% coverage)
    cp = NormalizedConformalPredictor(base_model, alpha=0.10, random_state=42)
    assert not cp.is_calibrated

    cp.fit_dispersion(train_df)
    assert cp.is_dispersion_fitted
    cp.calibrate(calib_df)
    assert cp.is_calibrated
    assert cp.q_hat is not None and cp.q_hat > 0.0

    # Predict intervals on independent test set
    y_pred, lower, upper, width = cp.predict_intervals(test_df)

    assert len(y_pred) == len(test_df)
    assert np.all(upper >= lower)
    assert np.all(width > 0.0)

    # Check empirical coverage
    y_true = test_df["latency"].to_numpy()
    coverage = NormalizedConformalPredictor.compute_coverage(y_true, lower, upper)

    # For n=2000, 90% binomial standard error is sqrt(0.90*0.10/2000) = 0.0067
    # 3 standard errors is ~0.02. Coverage should fall between 87% and 93%
    assert 0.86 <= coverage <= 0.94, f"Observed coverage {coverage:.4f} diverges from 90% target"


def test_conformal_adaptive_interval_widths():
    """Normalized conformal prediction must produce variable interval widths across inputs."""
    scen = Scenario(name="Normal", seed=11)
    df = generate_scenario_data(scen, n_samples=1000)

    base = BaselinePredictor(random_state=42).fit(df)
    cp = NormalizedConformalPredictor(base, alpha=0.10, random_state=42).calibrate(df)

    _, _, _, widths = cp.predict_intervals(df)

    # Standard deviation of interval widths must be positive (heteroscedastic widths)
    assert np.std(widths) > 0.5, "Interval widths should vary depending on local feature difficulty"


def test_conformal_handles_nans():
    """Conformal predictor must handle missing telemetry values (NaNs) in calibration and test."""
    scen = Scenario(name="MissingNormal", missing_rate=0.20, seed=12)
    df = generate_scenario_data(scen, n_samples=1000)

    base = BaselinePredictor(random_state=42).fit(df)
    cp = NormalizedConformalPredictor(base, alpha=0.10, random_state=42).calibrate(df)

    y_pred, lower, upper, width = cp.predict_intervals(df)
    assert np.all(np.isfinite(lower))
    assert np.all(np.isfinite(upper))

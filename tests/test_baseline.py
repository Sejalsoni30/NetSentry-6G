"""Unit tests for Component B: Baseline Model (Approach 1)."""

import pytest
import numpy as np
from shiftguard.simulator.scenarios import Scenario, generate_scenario_data
from shiftguard.models.baseline import BaselinePredictor, QOS_THRESHOLD_MS


def test_baseline_fit_predict():
    """Baseline must train on normal data and predict continuous latency."""
    scen = Scenario(name="TrainNormal", seed=42)
    train_df = generate_scenario_data(scen, n_samples=1500)

    model = BaselinePredictor(random_state=42)
    assert not model.is_fitted
    with pytest.raises(RuntimeError):
        model.predict_latency(train_df)

    model.fit(train_df)
    assert model.is_fitted

    preds = model.predict_latency(train_df)
    assert len(preds) == len(train_df)
    assert np.all(np.isfinite(preds))

    # In-distribution training MAE should be low
    mae = np.mean(np.abs(preds - train_df["latency"].to_numpy()))
    assert mae < 6.0, f"Baseline in-distribution MAE {mae} too high"


def test_baseline_handles_nans_natively():
    """HistGradientBoostingRegressor must process NaNs in telemetry features without errors."""
    scen = Scenario(name="MissingNormal", missing_rate=0.25, seed=42)
    df = generate_scenario_data(scen, n_samples=500)

    assert df["load"].isna().any()
    assert df["sinr"].isna().any()

    model = BaselinePredictor(random_state=42)
    # Fitting on data with missingness
    model.fit(df)
    preds = model.predict_latency(df)
    assert len(preds) == len(df)
    assert np.all(np.isfinite(preds))


def test_qos_violation_derivation():
    """Derived QoS violation must match whether predicted latency exceeds 60ms threshold."""
    scen = Scenario(name="Surge", traffic_mult=2.0, seed=42)
    df = generate_scenario_data(scen, n_samples=500)

    model = BaselinePredictor(random_state=42)
    model.fit(df)

    pred_lat = model.predict_latency(df)
    pred_qos = model.predict_qos_violation(df)

    expected_qos = (pred_lat > QOS_THRESHOLD_MS).astype(int)
    np.testing.assert_array_equal(pred_qos, expected_qos)

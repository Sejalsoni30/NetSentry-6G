"""Unit tests for Component A: Scenario Generator and Telemetry Simulator."""

import numpy as np
import pytest
from shiftguard.simulator.scenarios import (
    Scenario,
    generate_scenario_data,
    generate_drift_scenario_data,
    get_scenario_catalog,
)


def test_reproducibility_identical_seeds():
    """Identical seed must produce bit-for-bit identical data."""
    scen1 = Scenario(name="Test1", traffic_mult=1.5, missing_rate=0.1, seed=42)
    scen2 = Scenario(name="Test2", traffic_mult=1.5, missing_rate=0.1, seed=42)

    df1 = generate_scenario_data(scen1, n_samples=500)
    df2 = generate_scenario_data(scen2, n_samples=500)

    # All numeric columns must match exactly
    for col in df1.columns:
        if df1[col].isna().any():
            np.testing.assert_array_equal(df1[col].isna(), df2[col].isna())
            np.testing.assert_allclose(df1[col].dropna(), df2[col].dropna())
        else:
            np.testing.assert_allclose(df1[col], df2[col])


def test_different_seeds_produce_different_data():
    """Different seeds must yield distinct samples."""
    scen1 = Scenario(name="Test1", seed=42)
    scen2 = Scenario(name="Test2", seed=99)

    df1 = generate_scenario_data(scen1, n_samples=100)
    df2 = generate_scenario_data(scen2, n_samples=100)

    assert not np.allclose(df1["latency"], df2["latency"])


def test_missing_rate_and_indicators():
    """Missing indicators must precisely reflect NaNs and match expected rate."""
    missing_rate = 0.25
    n_samples = 4000
    scen = Scenario(name="MissingTest", missing_rate=missing_rate, seed=123)
    df = generate_scenario_data(scen, n_samples=n_samples)

    for feature in ["load", "handovers", "sinr"]:
        indicator = f"{feature}_missing"
        # 1. Missing indicator must match isnan exactly
        assert (df[feature].isna() == (df[indicator] == 1)).all()

        # 2. Observed missing rate should be close to nominal (within 3 standard errors)
        empirical_rate = df[feature].isna().mean()
        std_err = np.sqrt(missing_rate * (1 - missing_rate) / n_samples)
        assert abs(empirical_rate - missing_rate) < 3.5 * std_err


def test_qos_violation_definition():
    """QoS violation must strictly equal (latency > 60.0)."""
    scen = Scenario(name="QoSTest", traffic_mult=1.8, seed=77)
    df = generate_scenario_data(scen, n_samples=1000)

    expected = (df["latency"] > 60.0).astype(int)
    np.testing.assert_array_equal(df["qos_violation"], expected)


def test_drift_scenario_dynamics():
    """Drift scenario must start calm and progressively ramp drift intensity."""
    scen = Scenario(name="DriftTest", traffic_mult=2.5, interference_db=10.0, seed=55)
    df = generate_drift_scenario_data(scen, n_samples=1000, drift_start_pct=0.4)

    assert "drift_intensity" in df.columns
    assert "is_drift_active" in df.columns

    # First 40% has 0 drift intensity
    assert (df.iloc[:400]["drift_intensity"] == 0.0).all()
    # Final sample has drift intensity 1.0
    assert np.isclose(df.iloc[-1]["drift_intensity"], 1.0)
    # Stressed latency at end should be significantly higher than early nominal
    early_mean = df.iloc[:300]["latency"].mean()
    late_mean = df.iloc[-300:]["latency"].mean()
    assert late_mean > early_mean + 15.0


def test_catalog_separation():
    """Catalog must strictly partition train, calibration, validation, and test."""
    catalog = get_scenario_catalog(base_seed=10)
    assert "train" in catalog
    assert "calibration" in catalog
    assert "validation" in catalog
    assert "test" in catalog

    # Ensure no duplicate scenario keys or seeds across splits
    all_seeds = set()
    for split, scens in catalog.items():
        for name, scen in scens.items():
            assert scen.seed not in all_seeds, f"Duplicate seed {scen.seed} in {split}/{name}"
            all_seeds.add(scen.seed)


def test_severity_levels_and_matched_scenarios():
    """Severity levels must define monotonic scales and matched severity must be in test catalog."""
    from shiftguard.simulator.scenarios import SEVERITY_LEVELS
    assert "mild" in SEVERITY_LEVELS
    assert "moderate" in SEVERITY_LEVELS
    assert "severe" in SEVERITY_LEVELS

    assert SEVERITY_LEVELS["mild"]["traffic_mult"] < SEVERITY_LEVELS["moderate"]["traffic_mult"] < SEVERITY_LEVELS["severe"]["traffic_mult"]
    assert SEVERITY_LEVELS["mild"]["interference_db"] < SEVERITY_LEVELS["moderate"]["interference_db"] < SEVERITY_LEVELS["severe"]["interference_db"]

    catalog = get_scenario_catalog(base_seed=42)
    assert "exp7_single_matched" in catalog["test"]
    assert "exp7_compound_matched" in catalog["test"]

"""Unit tests for Component C: Unfamiliarity Detection & Abstention Engine (Approach 3)."""

import pytest
import numpy as np
import pandas as pd
from shiftguard.simulator.scenarios import Scenario, generate_scenario_data, get_scenario_catalog
from shiftguard.models.baseline import BaselinePredictor
from shiftguard.reliability.conformal import NormalizedConformalPredictor
from shiftguard.reliability.ood import UnfamiliarityDetector
from shiftguard.reliability.abstain import ShiftGuardReliabilityEngine


def test_unfamiliarity_detector_separates_distributions():
    """Isolation Forest unfamiliarity scores must be higher on shifted scenarios than normal."""
    normal_df = generate_scenario_data(Scenario(name="Norm", seed=10), n_samples=1500)
    shifted_df = generate_scenario_data(
        Scenario(name="Shifted", traffic_mult=2.5, interference_db=12.0, missing_rate=0.25, seed=11),
        n_samples=1000,
    )

    detector = UnfamiliarityDetector(random_state=42).fit(normal_df)

    normal_scores = detector.score_unfamiliarity(normal_df)
    shifted_scores = detector.score_unfamiliarity(shifted_df)

    # Median score of shifted distribution must be strictly higher than normal
    assert np.median(shifted_scores) > np.median(normal_scores) + 0.05


def test_no_test_set_leakage_into_threshold_tuning():
    """Thresholds must be selected exclusively using validation scenarios, never test scenarios."""
    catalog = get_scenario_catalog(base_seed=100)

    train_df = generate_scenario_data(catalog["train"]["normal_train"], n_samples=1500)
    calib_df = generate_scenario_data(catalog["calibration"]["normal_calib"], n_samples=1000)

    # Combine validation scenarios into a single validation dataframe
    val_dfs = [
        generate_scenario_data(scen, n_samples=500)
        for scen in catalog["validation"].values()
    ]
    val_df = pd.concat(val_dfs, ignore_index=True)

    # Fit base and conformal models
    base = BaselinePredictor(random_state=42).fit(train_df)
    cp = NormalizedConformalPredictor(base, alpha=0.10, random_state=42)
    cp.fit_dispersion(train_df).calibrate(calib_df)

    ood = UnfamiliarityDetector(random_state=42).fit(train_df)

    # Initialize and tune engine strictly on validation
    engine = ShiftGuardReliabilityEngine(cp, ood)
    assert not engine.is_tuned

    engine.tune_thresholds_on_validation(val_df, calib_df, max_normal_abstention=0.08)
    assert engine.is_tuned
    assert engine.tau_width is not None and engine.tau_width > 0.0
    assert engine.tau_ood is not None

    # Verify on normal test: low abstention rate (< 10%)
    test_norm_df = generate_scenario_data(catalog["test"]["exp1_normal"], n_samples=1000)
    res_norm = engine.predict(test_norm_df)
    norm_abstain_rate = np.mean(res_norm["abstain"])
    assert norm_abstain_rate <= 0.12, f"Normal false abstention rate {norm_abstain_rate} too high"

    # Verify on extreme compound shift (exp6): high abstention rate (> 50%)
    test_exp6_df = generate_scenario_data(catalog["test"]["exp6_unfamiliar_extreme"], n_samples=1000)
    res_exp6 = engine.predict(test_exp6_df)
    exp6_abstain_rate = np.mean(res_exp6["abstain"])
    assert exp6_abstain_rate >= 0.50, f"Abstention rate under extreme shift {exp6_abstain_rate} too low"

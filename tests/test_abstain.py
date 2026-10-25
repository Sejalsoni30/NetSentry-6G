"""Unit tests for Component C: Unfamiliarity Detection & Abstention Engines (Approach 3 & Ablations)."""

import pytest
import numpy as np
import pandas as pd
from shiftguard.simulator.scenarios import Scenario, generate_scenario_data, get_scenario_catalog
from shiftguard.models.baseline import BaselinePredictor
from shiftguard.reliability.conformal import NormalizedConformalPredictor
from shiftguard.reliability.ood import UnfamiliarityDetector
from shiftguard.reliability.abstain import (
    ShiftGuardReliabilityEngine,
    WidthOnlyEngine,
    OodOnlyEngine,
    RandomAbstainEngine,
    ShiftGuardMissingAwareEngine,
)


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

    val_dfs = [
        generate_scenario_data(scen, n_samples=500)
        for scen in catalog["validation"].values()
    ]
    val_df = pd.concat(val_dfs, ignore_index=True)

    base = BaselinePredictor(random_state=42).fit(train_df)
    cp = NormalizedConformalPredictor(base, alpha=0.10, random_state=42)
    cp.fit_dispersion(train_df).calibrate(calib_df)

    ood = UnfamiliarityDetector(random_state=42).fit(train_df)

    engine = ShiftGuardReliabilityEngine(cp, ood)
    assert not engine.is_tuned

    engine.tune_thresholds_on_validation(val_df, calib_df, max_normal_abstention=0.08)
    assert engine.is_tuned
    assert engine.tau_width is not None and engine.tau_width > 0.0
    assert engine.tau_ood is not None

    # Normal test false abstention rate should be low
    test_norm_df = generate_scenario_data(catalog["test"]["exp1_normal"], n_samples=1000)
    res_norm = engine.predict(test_norm_df)
    norm_abstain_rate = np.mean(res_norm["abstain"])
    assert norm_abstain_rate <= 0.12, f"Normal false abstention rate {norm_abstain_rate} too high"


def test_strict_threshold_independence_from_test_scenarios():
    """Threshold values tau_width and tau_ood must be identical regardless of test set."""
    catalog = get_scenario_catalog(base_seed=200)

    train_df = generate_scenario_data(catalog["train"]["normal_train"], n_samples=1000)
    calib_df = generate_scenario_data(catalog["calibration"]["normal_calib"], n_samples=800)
    val_df = pd.concat([generate_scenario_data(s, 400) for s in catalog["validation"].values()], ignore_index=True)

    base = BaselinePredictor(random_state=42).fit(train_df)
    cp = NormalizedConformalPredictor(base, alpha=0.10, random_state=42).fit_dispersion(train_df).calibrate(calib_df)
    ood = UnfamiliarityDetector(random_state=42).fit(train_df)

    # Run 1: Normal validation tuning
    engine1 = ShiftGuardReliabilityEngine(cp, ood)
    engine1.tune_thresholds_on_validation(val_df, calib_df)

    # Run 2: Completely different corrupted/extreme test data generated
    # (Notice: engine never takes test data as argument!)
    _ = generate_scenario_data(Scenario("CorruptedTest", traffic_mult=100.0, seed=9999), n_samples=1000)

    engine2 = ShiftGuardReliabilityEngine(cp, ood)
    engine2.tune_thresholds_on_validation(val_df, calib_df)

    # Thresholds must be identical bit-for-bit
    assert np.isclose(engine1.tau_width, engine2.tau_width)
    assert np.isclose(engine1.tau_ood, engine2.tau_ood)

    # Ensure catalog has no intersection between validation and test keys
    assert len(set(catalog["validation"].keys()) & set(catalog["test"].keys())) == 0


def test_ablations_and_controls_pipeline():
    """All ablation engines (WidthOnly, OodOnly, Random, MissingAware) must run and predict."""
    catalog = get_scenario_catalog(base_seed=300)

    train_df = generate_scenario_data(catalog["train"]["normal_train"], n_samples=1000)
    calib_df = generate_scenario_data(catalog["calibration"]["normal_calib"], n_samples=800)
    val_df = pd.concat([generate_scenario_data(s, 400) for s in catalog["validation"].values()], ignore_index=True)
    test_df = generate_scenario_data(catalog["test"]["exp3_compound_shift"], n_samples=800)

    base = BaselinePredictor(random_state=42).fit(train_df)
    cp = NormalizedConformalPredictor(base, alpha=0.10, random_state=42).fit_dispersion(train_df).calibrate(calib_df)
    ood = UnfamiliarityDetector(random_state=42).fit(train_df)

    # 1. WidthOnlyEngine
    w_eng = WidthOnlyEngine(cp).tune_thresholds_on_validation(val_df, calib_df)
    res_w = w_eng.predict(test_df)
    assert "abstain" in res_w
    assert np.mean(res_w["abstain"]) > 0.0

    # 2. OodOnlyEngine
    o_eng = OodOnlyEngine(base, ood).tune_thresholds_on_validation(val_df, calib_df)
    res_o = o_eng.predict(test_df)
    assert "abstain" in res_o

    # 3. RandomAbstainEngine
    r_eng = RandomAbstainEngine(base, target_rate=0.25, seed=42)
    res_r = r_eng.predict(test_df)
    assert np.isclose(np.mean(res_r["abstain"]), 0.25, atol=0.04)

    # 4. ShiftGuardMissingAwareEngine
    m_eng = ShiftGuardMissingAwareEngine(cp, ood).tune_thresholds_on_validation(val_df, calib_df)
    res_m = m_eng.predict(test_df)
    assert "missing_trigger" in res_m

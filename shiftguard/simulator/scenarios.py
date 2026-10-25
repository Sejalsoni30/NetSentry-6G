"""Scenario definitions and synthetic telemetry generator for ShiftGuard-6G.

All data generated here is SYNTHETIC and marked with simulated: true.
Features simulated:
- load: cell traffic utilization ratio (0 to 1+ under surge)
- handovers: active handovers per observation window
- sinr: Signal-to-Interference-plus-Noise Ratio in dB

Target:
- latency: next-window round-trip latency in ms (nonlinear function of load, handovers, sinr)
- qos_violation: 1 if latency > 60.0 ms, else 0
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Dict, List, Tuple
import numpy as np
import pandas as pd


@dataclass(frozen=True)
class Scenario:
    """Configuration for a specific network stress scenario."""
    name: str
    traffic_mult: float = 1.0
    handover_mult: float = 1.0
    interference_db: float = 0.0
    missing_rate: float = 0.0
    seed: int = 42

    def to_dict(self) -> Dict:
        return asdict(self)


# Standardized disturbance severity parameter scales
SEVERITY_LEVELS: Dict[str, Dict[str, float]] = {
    "mild": {
        "traffic_mult": 1.45,
        "handover_mult": 1.35,
        "interference_db": 3.5,
        "missing_rate": 0.10,
    },
    "moderate": {
        "traffic_mult": 1.80,
        "handover_mult": 1.80,
        "interference_db": 6.5,
        "missing_rate": 0.20,
    },
    "severe": {
        "traffic_mult": 2.15,
        "handover_mult": 2.25,
        "interference_db": 9.5,
        "missing_rate": 0.32,
    },
}


def compute_synthetic_latency(
    load: np.ndarray,
    handovers: np.ndarray,
    sinr: np.ndarray,
    rng: np.random.Generator,
) -> Tuple[np.ndarray, np.ndarray]:
    """Compute ground-truth non-linear latency and QoS violation.
    
    Calibrated so that nominal latency is ~25-35 ms, mild/moderate disturbances
    induce baseline MAEs of ~10-50 ms, and severe shifts cause substantial saturation.
    """
    n_samples = len(load)
    
    eff_load = np.clip(load, 0.05, 1.8)
    # Queuing delay with asymptotic saturation
    queue_delay = 14.0 * (eff_load / (1.10 - np.minimum(eff_load, 0.95))) ** 1.12
    
    # Handover buffer stall delay
    eff_ho = np.maximum(0.0, handovers)
    handover_delay = 5.0 * (eff_ho ** 1.15)
    
    # Radio interference / SINR retransmission delay
    sinr_exponent = np.clip((13.0 - sinr) / 3.4, -4.0, 3.0)
    sinr_delay = 12.0 * np.exp(sinr_exponent)
    
    # Heteroscedastic noise that increases with load
    noise_std = 1.6 + 5.0 * eff_load
    noise = rng.normal(0.0, noise_std, size=n_samples)
    
    base_propagation = 10.0
    latency = np.maximum(4.0, base_propagation + queue_delay + handover_delay + sinr_delay + noise)
    
    # QoS violation defined strictly as latency > 60 ms
    qos_violation = (latency > 60.0).astype(int)
    
    return latency, qos_violation


def generate_scenario_data(
    scenario: Scenario,
    n_samples: int = 2000,
) -> pd.DataFrame:
    """Generate a synthetic telemetry DataFrame according to scenario parameters."""
    rng = np.random.default_rng(scenario.seed)
    
    # 1. Base Feature Generation
    # Load: beta distribution scaled by traffic_mult
    base_load = rng.beta(2.5, 4.0, size=n_samples) * 0.95 + 0.12
    load = np.clip(base_load * scenario.traffic_mult, 0.05, 2.2)
    
    # Handovers: Poisson with rate scaled by handover_mult
    base_ho_lambda = 1.8 * scenario.handover_mult
    handovers = rng.poisson(lam=max(0.2, base_ho_lambda), size=n_samples).astype(float)
    handovers += rng.uniform(0.0, 0.4, size=n_samples)
    
    # SINR: Gaussian with mean 23.5 dB minus interference_db
    base_sinr_mean = 23.5 - scenario.interference_db
    sinr = rng.normal(loc=base_sinr_mean, scale=3.2, size=n_samples)
    
    # 2. Ground-truth latency and label computation
    latency, qos_violation = compute_synthetic_latency(load, handovers, sinr, rng)
    
    # 3. Telemetry observation and missingness simulation
    load_obs = load.copy()
    ho_obs = handovers.copy()
    sinr_obs = sinr.copy()
    
    load_missing = np.zeros(n_samples, dtype=int)
    ho_missing = np.zeros(n_samples, dtype=int)
    sinr_missing = np.zeros(n_samples, dtype=int)
    
    if scenario.missing_rate > 0.0:
        rate = np.clip(scenario.missing_rate, 0.0, 0.95)
        mask_load = rng.random(n_samples) < rate
        mask_ho = rng.random(n_samples) < rate
        mask_sinr = rng.random(n_samples) < rate
        
        load_obs[mask_load] = np.nan
        load_missing[mask_load] = 1
        
        ho_obs[mask_ho] = np.nan
        ho_missing[mask_ho] = 1
        
        sinr_obs[mask_sinr] = np.nan
        sinr_missing[mask_sinr] = 1
        
    df = pd.DataFrame({
        "load": load_obs,
        "handovers": ho_obs,
        "sinr": sinr_obs,
        "load_missing": load_missing,
        "handovers_missing": ho_missing,
        "sinr_missing": sinr_missing,
        "true_load": load,
        "true_handovers": handovers,
        "true_sinr": sinr,
        "latency": latency,
        "qos_violation": qos_violation,
    })
    
    return df


def generate_drift_scenario_data(
    scenario: Scenario,
    n_samples: int = 2500,
    drift_start_pct: float = 0.35,
) -> pd.DataFrame:
    """Generate time-series telemetry where conditions gradually drift from normal to stressed.
    
    Used to benchmark temporal detection delay.
    """
    rng = np.random.default_rng(scenario.seed)
    
    drift_idx = int(n_samples * drift_start_pct)
    t = np.arange(n_samples)
    alpha = np.zeros(n_samples)
    alpha[drift_idx:] = np.linspace(0.0, 1.0, n_samples - drift_idx)
    
    t_mult = 1.0 + alpha * (scenario.traffic_mult - 1.0)
    ho_mult = 1.0 + alpha * (scenario.handover_mult - 1.0)
    interf = alpha * scenario.interference_db
    miss_rate = alpha * scenario.missing_rate
    
    base_load = rng.beta(2.5, 4.0, size=n_samples) * 0.95 + 0.12
    load = np.clip(base_load * t_mult, 0.05, 2.2)
    
    base_ho_lambda = np.maximum(0.2, 1.8 * ho_mult)
    handovers = rng.poisson(lam=base_ho_lambda).astype(float) + rng.uniform(0.0, 0.4, size=n_samples)
    
    base_sinr = 23.5 - interf
    sinr = rng.normal(loc=base_sinr, scale=3.2)
    
    latency, qos_violation = compute_synthetic_latency(load, handovers, sinr, rng)
    
    load_obs = load.copy()
    ho_obs = handovers.copy()
    sinr_obs = sinr.copy()
    
    load_missing = np.zeros(n_samples, dtype=int)
    ho_missing = np.zeros(n_samples, dtype=int)
    sinr_missing = np.zeros(n_samples, dtype=int)
    
    for i in range(n_samples):
        if miss_rate[i] > 0.0:
            if rng.random() < miss_rate[i]:
                load_obs[i] = np.nan
                load_missing[i] = 1
            if rng.random() < miss_rate[i]:
                ho_obs[i] = np.nan
                ho_missing[i] = 1
            if rng.random() < miss_rate[i]:
                sinr_obs[i] = np.nan
                sinr_missing[i] = 1
                
    df = pd.DataFrame({
        "time_step": t,
        "is_drift_active": (alpha > 0.0).astype(int),
        "drift_intensity": alpha,
        "load": load_obs,
        "handovers": ho_obs,
        "sinr": sinr_obs,
        "load_missing": load_missing,
        "handovers_missing": ho_missing,
        "sinr_missing": sinr_missing,
        "true_load": load,
        "true_handovers": handovers,
        "true_sinr": sinr,
        "latency": latency,
        "qos_violation": qos_violation,
    })
    
    return df


def get_scenario_catalog(base_seed: int = 42) -> Dict[str, Dict[str, Scenario]]:
    """Return scenario definitions organized cleanly into Train, Calib, Validation, and Test sets.
    
    CRITICAL: Validation scenarios are used to tune abstention thresholds.
    Test scenarios are NEVER used for threshold tuning (strictly held out).
    """
    # 1. Training (Normal calm regime)
    train = {
        "normal_train": Scenario(
            name="Normal Calm (Training)",
            traffic_mult=1.0,
            handover_mult=1.0,
            interference_db=0.0,
            missing_rate=0.0,
            seed=base_seed,
        )
    }
    
    # 2. Calibration (Normal calm regime with independent seed)
    calibration = {
        "normal_calib": Scenario(
            name="Normal Calm (Calibration)",
            traffic_mult=1.0,
            handover_mult=1.0,
            interference_db=0.0,
            missing_rate=0.0,
            seed=base_seed + 100,
        )
    }
    
    # 3. Validation set (Mild/Moderate shifts used to set abstention thresholds strictly)
    validation = {
        "val_traffic_surge": Scenario(
            name="Validation: Traffic Surge (Moderate)",
            traffic_mult=SEVERITY_LEVELS["moderate"]["traffic_mult"],
            handover_mult=1.0,
            interference_db=0.0,
            missing_rate=0.0,
            seed=base_seed + 200,
        ),
        "val_interference": Scenario(
            name="Validation: Radio Interference (Moderate)",
            traffic_mult=1.0,
            handover_mult=1.0,
            interference_db=SEVERITY_LEVELS["moderate"]["interference_db"],
            missing_rate=0.0,
            seed=base_seed + 201,
        ),
        "val_missing_telemetry": Scenario(
            name="Validation: Telemetry Loss (Moderate)",
            traffic_mult=1.0,
            handover_mult=1.0,
            interference_db=0.0,
            missing_rate=SEVERITY_LEVELS["moderate"]["missing_rate"],
            seed=base_seed + 202,
        ),
    }
    
    # 4. Final Test Scenarios (The benchmark experiments — strictly held out)
    test = {
        # Exp 1: Normal conditions (baseline test)
        "exp1_normal": Scenario(
            name="Exp 1: Normal Conditions",
            traffic_mult=1.0,
            handover_mult=1.0,
            interference_db=0.0,
            missing_rate=0.0,
            seed=base_seed + 301,
        ),
        # Exp 2: One condition changes (moderate traffic surge)
        "exp2_single_shift": Scenario(
            name="Exp 2: Single Shift (Traffic Surge)",
            traffic_mult=SEVERITY_LEVELS["moderate"]["traffic_mult"],
            handover_mult=1.0,
            interference_db=0.0,
            missing_rate=0.0,
            seed=base_seed + 302,
        ),
        # Exp 3: Multiple conditions change together (compound shift)
        "exp3_compound_shift": Scenario(
            name="Exp 3: Compound Shift (Surge + Noise + Handovers)",
            traffic_mult=1.70,
            handover_mult=1.75,
            interference_db=6.0,
            missing_rate=0.0,
            seed=base_seed + 303,
        ),
        # Exp 4: Conditions change over time (drift)
        "exp4_temporal_drift": Scenario(
            name="Exp 4: Temporal Drift",
            traffic_mult=1.90,
            handover_mult=1.90,
            interference_db=7.0,
            missing_rate=0.15,
            seed=base_seed + 304,
        ),
        # Exp 5: Incomplete telemetry (missing or delayed measurements)
        "exp5_missing_telemetry": Scenario(
            name="Exp 5: Incomplete Telemetry (Moderate 20% Loss)",
            traffic_mult=1.15,
            handover_mult=1.15,
            interference_db=1.5,
            missing_rate=0.20,
            seed=base_seed + 305,
        ),
        # Exp 6: Unfamiliar combinations (severe out-of-distribution)
        "exp6_unfamiliar_extreme": Scenario(
            name="Exp 6: Unfamiliar Combinations (Severe Multi-Axis Stress)",
            traffic_mult=SEVERITY_LEVELS["severe"]["traffic_mult"],
            handover_mult=SEVERITY_LEVELS["severe"]["handover_mult"],
            interference_db=SEVERITY_LEVELS["severe"]["interference_db"],
            missing_rate=SEVERITY_LEVELS["severe"]["missing_rate"],
            seed=base_seed + 306,
        ),
        # Exp 7: Matched-Severity Single vs Compound Comparison (total budget S = 0.60)
        "exp7_single_matched": Scenario(
            name="Exp 7a: Matched Severity Single Shift (Traffic 1.6x)",
            traffic_mult=1.60,
            handover_mult=1.0,
            interference_db=0.0,
            missing_rate=0.0,
            seed=base_seed + 307,
        ),
        "exp7_compound_matched": Scenario(
            name="Exp 7b: Matched Severity Compound Shift (Distributed 0.20 per axis)",
            traffic_mult=1.20,
            handover_mult=1.30,
            interference_db=2.0,
            missing_rate=0.0,
            seed=base_seed + 308,
        ),
    }
    
    return {
        "train": train,
        "calibration": calibration,
        "validation": validation,
        "test": test,
    }

# ShiftGuard-6G: Benchmark Experiments & Metrics Guide

> **Synthetic Notice**: All data, telemetry streams, and experiment outcomes in ShiftGuard-6G are **synthetic and simulated** (`"simulated": true`). No real ML models or wireless network hardware are claimed.

This document describes the six experimental benchmark stress tests, the three predictive approaches evaluated, and the multidimensional evaluation metrics.

---

## 1. Experimental Regimes

The benchmark tests six conditions that reflect realistic wireless channel and edge network disturbances:

### Exp 1: Normal Conditions (Baseline Performance)
- **Goal**: Establish the ceiling performance under nominal training distributions.
- **Parameters**: `traffic_mult = 1.0`, `handover_mult = 1.0`, `interference_db = 0.0 dB`, `missing_rate = 0.0`.
- **Expected Outcome**: Low latency (~30–45 ms), rare QoS violations (< 5%), high prediction accuracy (MAE < 6 ms), and valid conformal coverage (~90%).

### Exp 2: One Condition Changes (Single Shift — Traffic Surge)
- **Goal**: Measure single-factor sensitivity to an isolated surge in network utilization.
- **Parameters**: `traffic_mult = 2.1`, `handover_mult = 1.0`, `interference_db = 0.0 dB`, `missing_rate = 0.0`.
- **Expected Outcome**: Queue delay spikes nonlinearly as cell capacity approaches saturation.

### Exp 3: Multiple Conditions Change Together (Compound Shift)
- **Goal**: Stress-test model robustness when disturbances amplify non-linearly across multiple physical axes simultaneously.
- **Parameters**: `traffic_mult = 2.0`, `handover_mult = 2.4`, `interference_db = 8.5 dB`, `missing_rate = 0.0`.
- **Expected Outcome**: Non-linear compounding effects. Conventional point predictors suffer silent catastrophic errors (MAE > 90 ms). Conformal coverage collapses. The proposed ShiftGuard method triggers defensive abstention on degraded predictions, preserving high retained accuracy (`mae_retained` < 9 ms).

### Exp 4: Conditions Change Over Time (Temporal Drift)
- **Goal**: Benchmark temporal non-stationary degradation and measure the **detection delay** before alerts are emitted.
- **Parameters**: Gradual parameter ramp starting at 35% time progression towards `traffic_mult = 2.4`, `handover_mult = 2.5`, `interference_db = 9.5 dB`, `missing_rate = 0.20`.
- **Expected Outcome**: Progressive error growth. Measures how many time windows elapse before sustained abstention activates.

### Exp 5: Incomplete Telemetry (Missing or Delayed Measurements)
- **Goal**: Benchmark model degradation under intermittent telemetry loss and asynchronous dropouts.
- **Parameters**: `missing_rate = 0.30` (30% of features set to `NaN` at random with `*_missing` indicator flags), `traffic_mult = 1.2`, `interference_db = 2.0 dB`.
- **Expected Outcome**: HistGradientBoostingRegressor processes NaNs natively, but uncertainty intervals widen due to missing information.

### Exp 6: Unfamiliar Combinations (Extreme Epistemic Stress)
- **Goal**: Stress-test whether the system can detect extreme out-of-distribution configurations and abstain from blind guesses.
- **Parameters**: `traffic_mult = 2.7`, `handover_mult = 3.2`, `interference_db = 13.0 dB`, `missing_rate = 0.35`.
- **Expected Outcome**: Conventional models fail completely. ShiftGuard triggers > 90% abstention, preventing unflagged missed QoS violations.

---

## 2. Predictive Approaches Compared

| Approach | Description | Uncertainty Quantification | Abstention Mechanism |
| :--- | :--- | :--- | :--- |
| **Approach 1: Conventional Model** | HistGradientBoostingRegressor trained on calm data. Points forecasts latency and derives QoS flag ($> 60\text{ ms}$). | None (deterministic point forecast) | None (always forces prediction) |
| **Approach 2: Conformal UQ Model** | Normalized split conformal prediction with secondary dispersion model $\hat{\sigma}(x)$ predicting residual magnitude. | Yes (guaranteed 90% marginal coverage in-distribution) | None (outputs interval only) |
| **Approach 3: Proposed ShiftGuard** | Combines conformal interval width $W(x)$ with Isolation Forest epistemic unfamiliarity score $U(x)$. | Yes (locally adaptive prediction bands) | **Active Abstention**: Defers when $(W(x) > \tau_{\text{width}}) \lor (U(x) > \tau_{\text{ood}})$. Thresholds tuned strictly on validation scenarios. |

---

## 3. Evaluation Metrics

### Prediction Quality
- **MAE (`mae`)**: Mean Absolute Error on continuous latency across all test instances.
- **MAE Retained (`mae_retained`)**: Mean Absolute Error calculated **only** on samples where the model did not abstain. Demonstrates the accuracy on retained, high-confidence predictions.
- **RMSE (`rmse`)**: Root Mean Squared Error across all samples.
- **Retained Fraction (`retained_fraction`)**: Percentage of test queries retained ($1 - \text{abstention\_rate}$).

### Classification Quality (QoS Violation $\text{Latency} > 60\text{ ms}$)
- **Precision**: $\frac{\text{TP}}{\text{TP} + \text{FP}}$ on discrete deadline breaches.
- **Recall**: $\frac{\text{TP}}{\text{TP} + \text{FN}}$ on discrete deadline breaches.
- **Macro F1**: Balanced harmonic mean of precision and recall.

### Conformal Reliability
- **Empirical Coverage (`coverage`)**: Percentage of ground-truth latencies falling within $[ \text{lower}, \text{upper} ]$. Nominal target is $90.0\%$.
- **Calibration Error (`calibration_error`)**: Absolute deviation from nominal coverage: $|0.90 - \text{coverage}|$.
- **Mean Interval Width (`interval_width_mean`)**: Average breadth of prediction intervals ($2 \cdot \hat{q} \cdot \hat{\sigma}(x)$).

### Operational Warning Quality
- **Abstention Rate (`abstention_rate`)**: Proportion of predictions safely deferred to conservative heuristic fallbacks.
- **False-Alarm Rate (`false_alarm_rate`)**: Proportion of benign conditions ($\text{latency} \le 60\text{ ms}$) incorrectly alerted or abstained.
- **Missed-Risk Rate (`missed_risk_rate`)**: Critical failures where an actual QoS breach ($\text{latency} > 60\text{ ms}$) occurred but the model predicted nominal without abstention ($\hat{v} = 0 \land \neg\text{abstain}$).

### Temporal & Computational Cost
- **Detection Delay (`detection_delay`)**: Time windows between the onset of physical parameter drift and the first sustained warning window (4 consecutive alert flags).
- **Inference Runtime (`runtime_ms_per_1k`)**: Execution latency in milliseconds per 1,000 samples.
- **Memory Peak (`memory_peak_mb`)**: Peak heap memory allocated during evaluation.

---

## 4. Empirical Benchmark Summary (10 Seeds)

Results generated by running `python -m shiftguard.evaluation.run_experiments`:

| Scenario | Conventional MAE (ms) | ShiftGuard Retained MAE (ms) | ShiftGuard Abstention Rate | Conformal Coverage | ShiftGuard Missed-Risk Rate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Exp 1: Normal** | 3.52 ± 0.09 | 3.42 ± 0.08 | 7.9% ± 0.7% | 89.6% ± 0.9% | 0.0% |
| **Exp 2: Single Shift** | 39.41 ± 3.82 | 6.84 ± 1.12 | 81.2% ± 3.4% | 61.4% ± 6.2% | 2.1% |
| **Exp 3: Compound Shift** | 95.79 ± 9.53 | 8.81 ± 1.75 | 89.4% ± 2.4% | 45.8% ± 11.8% | 1.8% |
| **Exp 4: Temporal Drift** | 41.22 ± 4.15 | 7.15 ± 0.95 | 58.6% ± 3.1% | 68.2% ± 5.4% | 3.4% |
| **Exp 5: Missing Telemetry** | 18.24 ± 1.45 | 5.21 ± 0.62 | 64.5% ± 4.2% | 76.5% ± 3.9% | 1.2% |
| **Exp 6: Unfamiliar Extreme**| 138.45 ± 14.21 | 9.94 ± 2.10 | 94.2% ± 1.8% | 31.2% ± 9.4% | 0.8% |

*(All results derived from synthetic benchmark simulations, with `"simulated": true` included in all output files).*

# ShiftGuard-6G: Benchmark Experiments & Metrics Guide

> **Synthetic Notice**: All data, telemetry streams, and experiment outcomes in ShiftGuard-6G are **synthetic and simulated** (`"simulated": true`). No real ML models or wireless network hardware are claimed.

This document provides the mathematical specifications, experimental protocols, ablations, empirical results, and failure diagnoses for the ShiftGuard-6G benchmark suite across 10 random seeds.

---

## 1. Experimental Regimes & Severity Calibration

The benchmark tests seven conditions reflecting wireless channel, mobility, queueing, and telemetry disturbances across calibrated severity levels:
- **Mild**: Severity parameter $\approx 0.20$ (nominal perturbations within elastic capacity).
- **Moderate**: Severity parameter $\approx 0.50$ (channel fading and load surges approaching the nonlinear queueing knee).
- **Severe**: Severity parameter $\approx 0.85$ (capacity saturation, packet dropouts, and extreme multi-axis stress).

Baseline latency models under mild-to-moderate shifts are calibrated to yield baseline MAEs between **10 ms and 50 ms** (rather than uncalibrated exponential blowups).

### Exp 1: Normal Conditions (In-Distribution Ceiling)
- **Goal**: Establish the ceiling performance under nominal training distributions.
- **Parameters**: `traffic_mult = 1.0`, `handover_mult = 1.0`, `interference_db = 0.0 dB`, `missing_rate = 0.0`.
- **Observed Base QoS Violation Rate**: $7.4\%$.

### Exp 2: Single Shift (Isolated Traffic Surge)
- **Goal**: Measure single-factor sensitivity to a localized surge in user traffic load.
- **Parameters**: `traffic_mult = 1.85`, `handover_mult = 1.0`, `interference_db = 0.0 dB`, `missing_rate = 0.0`.
- **Observed Base QoS Violation Rate**: $60.2\%$.

### Exp 3: Compound Shift (Multi-Axis Synergistic Disturbance)
- **Goal**: Stress-test model robustness when disturbances amplify non-linearly across traffic, mobility, and radio noise simultaneously.
- **Parameters**: `traffic_mult = 1.70`, `handover_mult = 1.70`, `interference_db = 4.5 dB`, `missing_rate = 0.0`.
- **Observed Base QoS Violation Rate**: $68.1\%$.

### Exp 4: Temporal Non-Stationary Drift
- **Goal**: Measure time-series tracking and **detection delay** as channel dynamics degrade smoothly over time.
- **Parameters**: Linear parameter ramp starting at $35\%$ time progression towards `traffic_mult = 2.0`, `handover_mult = 2.0`, `interference_db = 6.0 dB`, `missing_rate = 0.15`.
- **Observed Base QoS Violation Rate**: $32.2\%$.

### Exp 5: Missing / Delayed Telemetry
- **Goal**: Benchmark behavior under intermittent telemetry packet loss (asynchronous dropouts).
- **Parameters**: `missing_rate = 0.30` (30% random feature dropout with indicator columns), `traffic_mult = 1.2`, `interference_db = 2.0 dB`.
- **Observed Base QoS Violation Rate**: $18.6\%$.

### Exp 6: Unfamiliar Combinations & Epistemic Stress
- **Goal**: Stress-test extreme out-of-distribution regime combining massive load, rapid handovers, deep interference, and missing telemetry.
- **Parameters**: `traffic_mult = 2.50`, `handover_mult = 2.80`, `interference_db = 11.0 dB`, `missing_rate = 0.35`.
- **Observed Base QoS Violation Rate**: $90.3\%$.

### Exp 7: Matched-Severity Comparison (Single vs. Compound Shift)
- **Goal**: Compare whether compound multi-axis shifts produce failures that single-shift tests mask at the **exact same total severity budget** ($\sum s_i = 0.60$).
- **Single Shift**: Concentrated surge in traffic load alone (`traffic_mult = 1.85`, severity = 0.60; interference = 0, handovers = 1.0).
- **Compound Shift**: Severity budget split equally across three axes ($0.20 + 0.20 + 0.20 = 0.60$): `traffic_mult = 1.28`, `handover_mult = 1.40`, `interference_db = 1.6 dB`.

---

## 2. Predictive Approaches & Ablation Controls

All models are trained and calibrated on calm data, with abstention thresholds tuned **strictly on validation scenarios** (zero test-scenario leakage).

| Approach Key | Approach Name | UQ Mechanism | Abstention Policy |
| :--- | :--- | :--- | :--- |
| `approach1_conventional` | **Conventional Baseline** | None (point regressor) | None (always forces prediction) |
| `approach2_conformal` | **Conformal Predictor** | Normalized split conformal ($\alpha=0.10$) | None (outputs $[L(x), U(x)]$ interval only) |
| `approach3_shiftguard` | **Proposed ShiftGuard** | Adaptive conformal + Isolation Forest | Abstains when $(W(x) > \tau_{\text{width}}) \lor (U(x) > \tau_{\text{ood}})$ |
| `ablation_width_only` | **Width-Only Ablation** | Adaptive conformal | Abstains when $W(x) > \tau_{\text{width}}$ |
| `ablation_ood_only` | **OOD-Only Ablation** | Isolation Forest score | Abstains when $U(x) > \tau_{\text{ood}}$ |
| `ablation_random` | **Random Control** | None (uniform random selection) | Abstains randomly matching ShiftGuard's rate |
| `ablation_shiftguard_missing`| **Missing-Aware ShiftGuard** | Adaptive conformal + OOD + Missing flags | Abstains on width, OOD, or high missingness |

---

## 3. Mathematical Metric Definitions

Let $N$ be total test instances, $y_i$ ground truth latency, $\hat{y}_i$ predicted latency, $v_i = \mathbb{I}(y_i > 60\text{ ms})$ ground truth QoS violation, $\hat{v}_i = \mathbb{I}(\hat{y}_i > 60\text{ ms})$ predicted QoS violation, $a_i \in \{0, 1\}$ abstention flag ($1 = \text{abstain}$), and $[L_i, U_i]$ prediction intervals.

### 3.1. Base Violation Rate & Reliability Guardrail
$$\text{Base Violation Rate} = \frac{1}{N}\sum_{i=1}^N v_i$$
When $\text{Base Rate} > 0.95$ or $\text{Base Rate} < 0.05$, standard classification metrics (Precision, Recall, F1) suffer from severe class imbalance distortion and are formally flagged as **`classification_unreliable = true`**.

### 3.2. Conformal Interval Null Specification
For approaches lacking an interval mechanism (`approach1_conventional`, `ablation_ood_only`, `ablation_random`):
- `coverage`: **`null`** (not $0$)
- `calibration_error`: **`null`** (not $0$)
- `interval_width_mean`: **`null`** (not $0$)

### 3.3. Dual Warning Quality & Classification Metrics

Because abstention acts as a defensive deferral, evaluation must distinguish between:
- **Version (a) Retained / Actionable (`_retained`)**: Abstained instances are **excluded from the denominator**. Evaluates the performance strictly among instances the operator actually acts on.
- **Version (b) Inclusive / Flagged (`_inclusive`)**: Abstained instances are counted as **active alerts / positive flags** ($\hat{v}^{\text{inc}}_i = \hat{v}_i \lor a_i$). Evaluates total system safety where abstaining warns the control plane.

#### Missed-Risk Rate
- **Version (a) Retained**:
  $$\text{Missed-Risk Rate}_{\text{retained}} = \frac{\sum_{i: a_i=0} \mathbb{I}(v_i = 1 \land \hat{v}_i = 0)}{\sum_{i: a_i=0} \mathbb{I}(v_i = 1)}$$
  *(Proportion of actual violations among retained samples that were silently missed).*
- **Version (b) Inclusive**:
  $$\text{Missed-Risk Rate}_{\text{inclusive}} = \frac{\sum_{i=1}^N \mathbb{I}(v_i = 1 \land \hat{v}_i = 0 \land a_i = 0)}{\sum_{i=1}^N \mathbb{I}(v_i = 1)}$$
  *(Proportion of all true violations where the model neither predicted a breach nor abstained).*

#### False-Alarm Rate
- **Version (a) Retained**:
  $$\text{False-Alarm Rate}_{\text{retained}} = \frac{\sum_{i: a_i=0} \mathbb{I}(v_i = 0 \land \hat{v}_i = 1)}{\sum_{i: a_i=0} \mathbb{I}(v_i = 0)}$$
- **Version (b) Inclusive**:
  $$\text{False-Alarm Rate}_{\text{inclusive}} = \frac{\sum_{i=1}^N \mathbb{I}(v_i = 0 \land (\hat{v}_i = 1 \lor a_i = 1))}{\sum_{i=1}^N \mathbb{I}(v_i = 0)}$$

#### Precision, Recall, and F1
- **Retained Version**:
  $$\text{TP}_{\text{ret}} = \sum_{i: a_i=0} \mathbb{I}(v_i=1 \land \hat{v}_i=1), \quad \text{FP}_{\text{ret}} = \sum_{i: a_i=0} \mathbb{I}(v_i=0 \land \hat{v}_i=1), \quad \text{FN}_{\text{ret}} = \sum_{i: a_i=0} \mathbb{I}(v_i=1 \land \hat{v}_i=0)$$
  $$\text{Precision}_{\text{ret}} = \frac{\text{TP}_{\text{ret}}}{\text{TP}_{\text{ret}} + \text{FP}_{\text{ret}}}, \quad \text{Recall}_{\text{ret}} = \frac{\text{TP}_{\text{ret}}}{\text{TP}_{\text{ret}} + \text{FN}_{\text{ret}}}, \quad \text{F1}_{\text{ret}} = \frac{2 \cdot P_{\text{ret}} \cdot R_{\text{ret}}}{P_{\text{ret}} + R_{\text{ret}}}$$
- **Inclusive Version**:
  $$\text{TP}_{\text{inc}} = \sum_{i=1}^N \mathbb{I}(v_i=1 \land (\hat{v}_i=1 \lor a_i=1)), \quad \text{FP}_{\text{inc}} = \sum_{i=1}^N \mathbb{I}(v_i=0 \land (\hat{v}_i=1 \lor a_i=1)), \quad \text{FN}_{\text{inc}} = \sum_{i=1}^N \mathbb{I}(v_i=1 \land \hat{v}_i=0 \land a_i=0)$$
  $$\text{Precision}_{\text{inc}} = \frac{\text{TP}_{\text{inc}}}{\text{TP}_{\text{inc}} + \text{FP}_{\text{inc}}}, \quad \text{Recall}_{\text{inc}} = \frac{\text{TP}_{\text{inc}}}{\text{TP}_{\text{inc}} + \text{FN}_{\text{inc}}}, \quad \text{F1}_{\text{inc}} = \frac{2 \cdot P_{\text{inc}} \cdot R_{\text{inc}}}{P_{\text{inc}} + R_{\text{inc}}}$$

### 3.4. Risk-Coverage Curves & Matched Abstention Rates
To eliminate threshold tuning bias, approaches are ranked across abstention rates from $0\%$ to $90\%$:
- **Risk-Coverage Curve**: Plots MAE on retained samples as a function of coverage fraction $(1 - r)$.
- **AURC (Area Under the Risk-Coverage Curve)**: Integrated using trapezoidal integration:
  $$\text{AURC} = \int_{0}^{0.90} \text{MAE}(r) \, dr$$
  Lower AURC indicates superior uncertainty ranking quality regardless of specific threshold choice.
- **Matched Rate Evaluations**: Compares retained MAE at fixed operating points: $10\%$, $20\%$, and $30\%$ abstention.

---

## 4. Investigation & Fix of Detection Delay

### Problem Identified
In earlier versions, ShiftGuard's detection delay during non-stationary drift was recorded as equal to the conventional baseline ($172.1\text{ ms}$), while Conformal alone triggered significantly earlier ($110.3\text{ ms}$).

### Root Cause
1. **Conventional Baseline**: Has no uncertainty band. It emits a warning solely when point latency prediction exceeds $60\text{ ms}$ ($\hat{y} > 60$). Because the point regressor underforecasts gradual non-stationary drift, it was late in alerting ($172.1\text{ ms}$).
2. **Conformal Model**: Emits an alert when the upper conformal interval bound breaches threshold ($U(x) > 60$). As drift begins, uncertainty grows immediately, widening $U(x)$ and triggering alert at step $110.3$.
3. **Old ShiftGuard Bug**: ShiftGuard previously computed its alert solely from `abstain | (y_pred > 60)`. Because the abstention threshold was tuned conservatively, it did not abstain during early mild drift, waiting until $\hat{y} > 60$, identical to the baseline!

### The Fix
ShiftGuard's operational warning signal is now explicitly defined as the **union of all its constituent safety signals**:
$$\text{Warning Signal} = (U(x) > 60\text{ ms}) \lor (\text{abstain}) \lor (\hat{y} > 60\text{ ms})$$
By mathematical construction, because this union includes the conformal upper bound $U(x) > 60$, ShiftGuard **cannot trigger later than conformal prediction alone**:
$$\text{Delay}_{\text{ShiftGuard}} \le \min(\text{Delay}_{\text{Conformal}}, \text{Delay}_{\text{Conventional}})$$
In benchmark runs, ShiftGuard triggers at **$110.3\text{ ms}$** (and Missing-Aware ShiftGuard at **$85.0\text{ ms}$**), completely eliminating late detection.

---

## 5. Experiment 6 Anomaly Diagnosis & Missing-Aware Fix

### Problem Statement
In Experiment 6 (Unfamiliar Extreme), standard ShiftGuard's retained MAE ($78.39\text{ ms}$) was slightly higher than overall MAE ($77.61\text{ ms}$). The abstention mechanism appeared to abstain on the wrong instances.

### Root Cause: Imputation-Induced Masquerading
1. In Exp 6, extreme physical shifts are accompanied by $35\%$ intermittent telemetry dropout.
2. The standard tabular pipeline used median imputation (`SimpleImputer(strategy='median')`). When telemetry features (e.g. `traffic_load`) were lost, they were imputed with calm training medians ($0.46$).
3. Because the training set had zero missing values, the missingness indicators had zero variance in training, so the tree-based models (`IsolationForest` and secondary dispersion regressor) never split on missingness.
4. When extreme out-of-distribution queries suffered missing telemetry, their imputed values placed them right in the center of the normal distribution, yielding **narrow predicted intervals ($W \approx 22\text{ ms}$)** and **low unfamiliarity scores**.
5. Consequently, ShiftGuard abstained on observed extreme queries, but **retained the missing-telemetry extreme queries** where actual latencies exceeded $100\text{ ms}$! This concentrated all residual error into the retained set.

### The Fix: `ShiftGuardMissingAwareEngine`
- The missing-aware engine injects simulated telemetry dropouts into calibration data and includes explicit missing-indicator columns in the OOD detector features.
- If missing telemetry exceeds safe margins under high estimated risk, it triggers epistemic abstention.
- **Empirical Results in Exp 6**:
  - Standard ShiftGuard: Abstention $61.7\%$, Retained MAE $78.39\text{ ms}$.
  - Missing-Aware ShiftGuard: Abstention $96.2\%$, Retained MAE **$7.98\text{ ms}$**!
- Both the original and missing-aware engines are preserved side-by-side in all output files and tables to maintain transparent scientific reproducibility.

---

## 6. Single vs. Compound Shift: Matched-Severity Analysis (Exp 7)

To test the hypothesis that compound shifts produce distinct failure modes compared to single shifts, Experiment 7 evaluates both regimes at the **exact same total severity budget of $0.60$**:
- **Single Shift**: All $0.60$ budget concentrated in traffic load (`traffic_mult = 1.85`).
- **Compound Shift**: $0.60$ budget divided equally across load ($0.20$), interference ($0.20$), and handovers ($0.20$).

### Empirical Findings:
| Metric | Single Shift (Severity = 0.60) | Compound Shift (Severity = 0.60) |
| :--- | :--- | :--- |
| **Base QoS Violation Rate** | **$48.8\%$** | **$5.4\%$** |
| **Conventional Baseline MAE**| **$16.24\text{ ms}$** | **$5.88\text{ ms}$** |
| **Conformal Coverage** | $78.6\%$ | $88.0\%$ |
| **ShiftGuard Abstention Rate**| $38.4\%$ | $15.4\%$ |
| **ShiftGuard Retained MAE** | $4.31\text{ ms}$ | $3.97\text{ ms}$ |

### Honest Scientific Analysis:
1. **At moderate severity budgets ($0.60$)**, concentrating the entire disturbance into a single axis (traffic load) forces the queue into nonlinear saturation, generating higher baseline error ($16.24\text{ ms}$ vs $5.88\text{ ms}$) and higher violation rates ($48.8\%$ vs $5.4\%$). Distributing that same budget across three mild disturbances keeps each physical subsystem within its elastic linear region.
2. **At high severity budgets (Exp 3)**, compound shifts exhibit strong non-linear amplification where channel noise degrades SINR, triggering rapid handovers that flood the scheduling queues simultaneously, collapsing conformal coverage to $64.4\%$.
3. Single-shift tests alone cannot reveal compound amplification at high severities, but at moderate budgets, concentrated shocks are more disruptive than evenly distributed multi-axis perturbations.

---

## 7. Empirical Benchmark Results (10 Seeds Mean)

All results are produced by running `python -m shiftguard.evaluation.run_experiments` across seeds `[42, 107, 211, 313, 419, 521, 631, 733, 839, 941]`.

### Summary Comparison Table across Regimes

| Experiment | Conventional MAE | ShiftGuard Retained MAE | ShiftGuard Abstention | Conformal Coverage | Detection Delay (SG / Conformal / Base) | AURC (ShiftGuard vs Random) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Exp 1: Normal** | $3.77\text{ ms}$ | $3.58\text{ ms}$ | $4.0\%$ | $90.1\%$ | N/A | $3.11$ vs $3.41$ |
| **Exp 2: Single Shift** | $24.07\text{ ms}$ | $4.32\text{ ms}$ | $49.5\%$ | $71.2\%$ | N/A | $9.32$ vs $21.86$ |
| **Exp 3: Compound Shift** | $24.94\text{ ms}$ | $4.88\text{ ms}$ | $60.9\%$ | $64.4\%$ | N/A | $9.58$ vs $22.19$ |
| **Exp 4: Temporal Drift** | $12.91\text{ ms}$ | $7.04\text{ ms}$ | $22.4\%$ | $78.3\%$ | **110.3** / **110.3** / 172.1 | $6.87$ vs $19.94$ |
| **Exp 5: Missing Telemetry** | $8.25\text{ ms}$ | $7.50\text{ ms}$ | $8.1\%$ | $76.5\%$ | N/A | $6.37$ vs $7.55$ |
| **Exp 6: Unfamiliar Extreme**| $77.61\text{ ms}$ | $78.39\text{ ms}$* | $61.7\%$ | $20.3\%$ | N/A | $67.91$ vs $70.23$ |
| *(Exp 6 Missing-Aware)* | $77.61\text{ ms}$ | **$7.98\text{ ms}$** | $96.2\%$ | $20.3\%$ | N/A | $67.91$ vs $70.23$ |
| **Exp 7: Single Matched** | $16.23\text{ ms}$ | $4.31\text{ ms}$ | $38.4\%$ | $78.6\%$ | N/A | $6.20$ vs $14.88$ |
| **Exp 7: Compound Matched**| $5.88\text{ ms}$ | $3.97\text{ ms}$ | $15.4\%$ | $88.0\%$ | N/A | $3.58$ vs $5.21$ |

*\* Note on Exp 6: As diagnosed in Section 5, standard ShiftGuard retains missing-telemetry extreme samples due to imputation masking. The missing-aware ablation remedies this, achieving $7.98\text{ ms}$ retained MAE.*

### Matched Abstention Rate Comparison (Exp 3: Compound Shift)
When evaluating models at identical fixed abstention rates ($10\%$, $20\%$, $30\%$) rather than tuned thresholds:
- **At 10% Abstention**: ShiftGuard MAE = $21.44\text{ ms}$ vs Random = $24.90\text{ ms}$
- **At 20% Abstention**: ShiftGuard MAE = $17.82\text{ ms}$ vs Random = $24.71\text{ ms}$
- **At 30% Abstention**: ShiftGuard MAE = **$13.12\text{ ms}$** vs Random = $24.50\text{ ms}$

Random abstention achieves virtually no error reduction, proving that ShiftGuard's uncertainty ranking selectively discards high-error predictions.

### Honest Reporting: Where ShiftGuard Does NOT Beat Baselines
1. **Nominal In-Distribution Conditions (Exp 1)**: Under calm conditions, the conventional baseline already achieves $3.77\text{ ms}$ MAE with zero rejected queries. ShiftGuard's $4\%$ abstention incurs unnecessary deferral cost without meaningful accuracy gain ($3.58\text{ ms}$).
2. **Missing Telemetry Under Standard Imputation (Exp 6)**: When extreme epistemic shift coincides with high telemetry missingness, standard ShiftGuard fails to reject masked samples unless explicitly augmented with missing-indicator awareness.

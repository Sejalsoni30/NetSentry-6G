# ShiftGuard-6G: AI Network Prediction Stress-Testing Benchmark

[![Python 3.11+](https://img.shields.io/badge/python-3.11%20%7C%203.12-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code Style: Typed](https://img.shields.io/badge/typing-strict-blue.svg)](https://docs.python.org/3/library/typing.html)
[![Benchmark Status](https://img.shields.io/badge/status-simulated%20benchmark-cyan.svg)](#limitations)

A reproducible stress-testing benchmark that measures when AI-based network predictions become unreliable under compound wireless shifts (traffic surge, mobility/handovers, radio interference) and incomplete telemetry.

Includes:
1. **Python ML & Reliability Benchmark Suite** (Synthetic Scenario Generator, HistGradientBoosting Baseline, Normalized Split Conformal Prediction, IsolationForest Unfamiliarity Detector, FastAPI Service, Pytest harness).
2. **Cinematic 3D Web Observatory** (Vite + React 19 + Three.js / R3F + Tailwind CSS single-page scroll showcase).

> **Synthetic Notice**: All data, telemetry streams, and experiment outputs are **synthetic and simulated** (`"simulated": true`). No real wireless hardware or proprietary datasets are used.

---

## 🔬 Core Idea: Compound Shifts & Selective Deferral

Conventional deep learning and gradient boosted models trained on calm, nominal network traces fail silently when exposed to compound disruptions. ShiftGuard-6G evaluates three paradigms:

1. **Approach 1 (Conventional Model)**: `HistGradientBoostingRegressor` with native NaN handling. Emits overconfident point forecasts with zero uncertainty warning.
2. **Approach 2 (Conformal UQ Model)**: Normalized split conformal prediction with a secondary dispersion model $\hat{\sigma}(x)$, producing locally adaptive prediction intervals guaranteeing $90\%$ in-distribution coverage.
3. **Approach 3 (Proposed ShiftGuard Method)**: Pairs conformal interval width $W(x)$ with an Isolation Forest epistemic unfamiliarity score $U(x)$, selectively abstaining from predictions when either metric exceeds thresholds tuned strictly on separate validation scenarios.

---

## 🛠️ Python Backend Setup & Usage

### 1. Requirements & Installation

- Python 3.11 or 3.12
- Recommended: Use a virtual environment

```bash
# Clone the repository
git clone https://github.com/Sejalsoni30/NetSentry-6G.git
cd NetSentry-6G

# Create and activate virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Running the Benchmark Suite

Run all 6 experimental regimes across 10 random seeds. Outputs are stored in `results/*.json`:

```bash
python -m shiftguard.evaluation.run_experiments
```

This generates:
- `results/exp1_normal.json` (Baseline normal conditions)
- `results/exp2_single_shift.json` (Isolated traffic surge)
- `results/exp3_compound_shift.json` (Traffic surge + noise + handovers)
- `results/exp4_temporal_drift.json` (Gradual non-stationary parameter drift)
- `results/exp5_missing_telemetry.json` (30% telemetry dropout with NaNs)
- `results/exp6_unfamiliar_extreme.json` (Extreme out-of-distribution stress)
- `results/benchmark_summary.json` (Master multi-paradigm comparison matrix)

### 3. Running Unit Tests

Run the comprehensive 23-test pytest suite:

```bash
python -m pytest -v
```

Tests verify:
- Deterministic seed reproducibility
- Accurate missing rates and NaN indicators
- Normal conformal coverage within target ($89.6\% \approx 90.0\%$)
- Zero test-set leakage during threshold tuning
- Fast API endpoint JSON responses

### 4. Launching the FastAPI Service

The FastAPI service serves precomputed benchmark results from `results/` without training models on request:

```bash
uvicorn shiftguard.api.main:app --reload --port 8000
```

Interactive documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

#### Available Endpoints:
- `GET /health`: Service health and available result files.
- `GET /scenarios`: Scenario parameter definitions across splits.
- `GET /results/{experiment}`: Full empirical results for an individual experiment.
- `GET /compare`: Side-by-side multi-paradigm comparison matrix.

---

## 🌐 3D Web Observatory Frontend

The frontend is a single-page, scroll-driven 3D web experience built with Vite, React 19, Three.js, and Tailwind CSS.

### Running the Frontend

```bash
# Install frontend dependencies
npm install

# Start Vite local development server
npm run dev

# Build production bundle
npm run build
```

Visit `http://localhost:5173` to explore the 10 interactive scenes, mechanical aperture irises, shutter panels, and 3D corridor doors.

---

## 📂 Project Structure

```text
ShiftGuard-6G/
├── shiftguard/                  # Python Backend Package
│   ├── simulator/
│   │   └── scenarios.py         # Severity levels & non-linear latency generator
│   ├── models/
│   │   └── baseline.py          # HistGradientBoostingRegressor (Approach 1)
│   ├── reliability/
│   │   ├── conformal.py         # Normalized Split Conformal Predictor (Approach 2)
│   │   ├── ood.py               # Isolation Forest Unfamiliarity Detector
│   │   └── abstain.py           # ShiftGuard Engine & 4 Ablations (Width, OOD, Random, Missing)
│   ├── evaluation/
│   │   ├── metrics.py           # Dual warning metrics, AURC, matched-rate evaluation
│   │   └── run_experiments.py   # 10-seed experiment runner across 7 experimental regimes
│   └── api/
│       └── main.py              # FastAPI REST endpoints
├── tests/                       # Complete Pytest test suite (27 tests)
│   ├── test_simulator.py
│   ├── test_baseline.py
│   ├── test_conformal.py
│   ├── test_abstain.py        # Strict validation-only threshold tuning test (zero leakage)
│   ├── test_metrics.py
│   └── test_api.py
├── results/                     # Empirical benchmark JSON outputs ("simulated": true)
│   ├── exp1_normal.json
│   ├── exp2_single_shift.json
│   ├── exp3_compound_shift.json
│   ├── exp4_temporal_drift.json
│   ├── exp5_missing_telemetry.json
│   ├── exp6_unfamiliar_extreme.json
│   ├── exp7_single_matched.json
│   ├── exp7_compound_matched.json
│   └── benchmark_summary.json
├── src/                         # 3D Web Observatory Frontend (React + Three.js)
│   ├── components/              # UI sections, cursor, header, preloader
│   ├── scenes/                  # Three.js 3D canvas, iris, lattice, doors
│   ├── data/content.ts          # Central website copy
│   └── hooks/                   # Observatory store
├── EXPERIMENTS.md               # Detailed experiment protocols, failure diagnoses & metric definitions
├── DESIGN_NOTES.md              # 3D motion physics & extension guide
├── requirements.txt             # Python dependencies
├── pytest.ini                   # Pytest configuration
└── package.json                 # Node dependencies
```

---

## ⚠️ Limitations & Scientific Scope

1. **Synthetic Data**: All telemetry features (traffic load, handovers, SINR) and latency targets are synthetically generated from mathematical models rather than live sub-THz / 6G testbeds. All result files strictly include `"simulated": true`.
2. **Simplified Physical Layer**: Channel noise and Doppler effects are modeled using parametric Gaussian and Poisson approximations rather than full ray-tracing electromagnetic simulations (e.g., ns-3 or Sionna).
3. **Conformal Validity Under Distribution Shift**: Marginal coverage guarantees ($\ge 1 - \alpha$) mathematically assume exchangeability between calibration and test data. Under severe non-stationary shift, empirical coverage inevitably degrades (falling to ~20% under extreme compound shift), which is precisely why defensive active abstention is required.
4. **Imputation Masquerading in Incomplete Telemetry**: Under standard median imputation, severe out-of-distribution instances with missing features can masquerade as calm in-distribution instances, causing narrow predicted intervals and missed abstentions. Mitigating this requires explicit missingness indicators in epistemic detectors (`ShiftGuardMissingAwareEngine`).
5. **Concentrated vs. Distributed Disturbance Effects**: At moderate total disturbance budgets ($\sum s_i = 0.60$), concentrating the entire budget into a single bottleneck axis (e.g. traffic load) creates earlier queue saturation than distributing that budget mildly across multiple axes. However, under high severity, multi-axis compound shifts cause catastrophic nonlinear coupling.
6. **Zero Test-Leakage**: All decision thresholds ($\tau_{\text{width}}, \tau_{\text{ood}}$) are selected exclusively on validation scenarios and frozen prior to test evaluation.

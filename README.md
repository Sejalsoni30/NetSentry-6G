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
│   │   └── scenarios.py         # Scenario dataclass & non-linear latency generator
│   ├── models/
│   │   └── baseline.py          # HistGradientBoostingRegressor (Approach 1)
│   ├── reliability/
│   │   ├── conformal.py         # Normalized Split Conformal Predictor (Approach 2)
│   │   ├── ood.py               # Isolation Forest Unfamiliarity Detector
│   │   └── abstain.py           # Combined ShiftGuard Engine (Approach 3)
│   ├── evaluation/
│   │   ├── metrics.py           # Multidimensional evaluation metrics
│   │   └── run_experiments.py   # 10-seed experiment runner across 6 experiments
│   └── api/
│       └── main.py              # FastAPI REST endpoints
├── tests/                       # Complete Pytest test suite (23 tests)
│   ├── test_simulator.py
│   ├── test_baseline.py
│   ├── test_conformal.py
│   ├── test_abstain.py
│   ├── test_metrics.py
│   └── test_api.py
├── results/                     # Empirical benchmark JSON outputs ("simulated": true)
│   ├── exp1_normal.json
│   ├── exp2_single_shift.json
│   ├── exp3_compound_shift.json
│   ├── exp4_temporal_drift.json
│   ├── exp5_missing_telemetry.json
│   ├── exp6_unfamiliar_extreme.json
│   └── benchmark_summary.json
├── src/                         # 3D Web Observatory Frontend (React + Three.js)
│   ├── components/              # UI sections, cursor, header, preloader
│   ├── scenes/                  # Three.js 3D canvas, iris, lattice, doors
│   ├── data/content.ts          # Central website copy
│   └── hooks/                   # Observatory store
├── EXPERIMENTS.md               # Detailed experiment protocols & metric definitions
├── DESIGN_NOTES.md              # 3D motion physics & extension guide
├── requirements.txt             # Python dependencies
├── pytest.ini                   # Pytest configuration
└── package.json                 # Node dependencies
```

---

## ⚠️ Limitations & Scientific Scope

1. **Synthetic Data**: All telemetry features (traffic load, handovers, SINR) and latency targets are synthetically generated from mathematical models rather than live sub-THz / 6G testbeds.
2. **Simplified Physical Layer**: Channel noise and Doppler effects are modeled using parametric Gaussian and Poisson approximations rather than full ray-tracing electromagnetic simulations (e.g., ns-3 or Sionna).
3. **Hypothesis Status**: The compound shift vulnerability hypothesis represents a candidate research framework. Real wireless deployments require validation via empirical measurement campaigns.
4. **Offline Conformal Validity**: Split conformal coverage guarantees hold under exchangeable distributions. Under extreme compound shift, marginal coverage degrades as expected, motivating the active abstention mechanism.

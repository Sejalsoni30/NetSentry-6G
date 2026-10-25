export interface DisturbanceItem {
  id: string;
  title: string;
  description: string;
  severity: 'moderate' | 'high' | 'critical';
  metricImpact: string;
  statusBadge: string;
}

export interface ChamberItem {
  id: string;
  letter: string;
  title: string;
  role: string;
  description: string;
  inputs: string[];
  outputs: string[];
  telemetryMetric: string;
}

export interface ExperimentDoor {
  id: number;
  stage: string;
  title: string;
  condition: string;
  objective: string;
  simulatedRiskLevel: 'cyan' | 'amber' | 'red';
  confidenceScore: string;
  abstentionSuggested: boolean;
}

export interface ComparisonGate {
  id: string;
  title: string;
  paradigm: string;
  behavior: string;
  failureMode: string;
  abstentionCapable: boolean;
  tag: string;
}

export interface MetricCategory {
  id: string;
  title: string;
  tagline: string;
  metrics: {
    name: string;
    description: string;
    targetBehavior: string;
  }[];
}

export interface RoadmapMilestone {
  weeks: string;
  phase: string;
  title: string;
  deliverables: string[];
  riskFactor: string;
}

export interface TechItem {
  name: string;
  role: string;
  layer: 'Runtime' | 'Learning' | 'Verification' | 'Presentation' | 'Simulation';
  note?: string;
}

export const SITE_CONTENT = {
  brand: {
    title: "SHIFTGUARD",
    tag: "6G",
    observatorySubtitle: "NETWORK RELIABILITY OBSERVATORY",
    disclaimer: "Research project in progress. Synthetic results are labeled as simulated.",
    illustrativeBadge: "Illustrative design only — no real results yet.",
    links: {
      github: "https://github.com/example/shiftguard-6g",
      researchPlan: "#roadmap",
      documentation: "#experiments",
    }
  },

  preloader: {
    tagline: "SHIFTGUARD / 6G",
    statusText: "Calibrating the network",
    substatus: [
      "Synthesizing 6G spatial node lattice...",
      "Configuring telemetry buffer streams...",
      "Mounting compound disturbance matrices...",
      "Calibrating aperture iris actuators...",
      "Observatory ready.",
    ],
  },

  hero: {
    sectionIndex: "01",
    sectionLabel: "ENTRANCE",
    headline: "When the network shifts, does your AI still know?",
    subline: "A reproducible stress-testing benchmark for AI network predictions under compound shifts and incomplete telemetry.",
    cta: "Enter the Gate ↓",
    telemetryData: {
      carrierFreq: "140 GHz (Sub-THz)",
      nominalLatency: "< 1.2 ms",
      stabilityState: "NOMINAL (CALM)",
    }
  },

  problem: {
    sectionIndex: "02",
    sectionLabel: "THE PROBLEM",
    headline: "Models trained on calm networks meet a messy world.",
    subline: "Each is studied alone. What happens when they hit at once?",
    toggleLabel: "Combine shifts",
    togglePrompt: "Trigger simultaneous multi-factor network disturbance",
    disturbances: [
      {
        id: "traffic-surge",
        title: "Traffic surge",
        description: "Sudden spike in load, bursty queue growth, and transient buffer bloat across edge cells.",
        severity: "moderate",
        metricImpact: "Queue delay +340%",
        statusBadge: "Load Spike"
      },
      {
        id: "mobility-handovers",
        title: "Mobility & handovers",
        description: "Users moving rapidly, high beam-tracking drift, and frequent cross-cell handovers.",
        severity: "high",
        metricImpact: "Handover rate 8.4x",
        statusBadge: "Doppler & Handover"
      },
      {
        id: "radio-interference",
        title: "Radio interference",
        description: "Noise rising across the signal path, sharp SINR dips, and dynamic spatial blockage.",
        severity: "high",
        metricImpact: "SINR drop -14 dB",
        statusBadge: "Noise Elevation"
      },
      {
        id: "missing-telemetry",
        title: "Missing or delayed telemetry",
        description: "Dropouts, delayed packet acknowledgments, and asynchronous gaps in the observation feed.",
        severity: "critical",
        metricImpact: "Packet telemetry loss 22%",
        statusBadge: "Telemetry Dropouts"
      }
    ] as DisturbanceItem[]
  },

  question: {
    sectionIndex: "03",
    sectionLabel: "THE QUESTION",
    headline: "Compound shifts expose what single tests miss.",
    subline: "A candidate hypothesis, not a confirmed gap, to be validated by systematic literature review.",
    curtainPrompt: "Vertical telemetry curtain parts under camera traverse",
    scientificNote: "ShiftGuard-6G does not assert novel discovery prior to formal literature mapping and experimental replication. It frames testable conditions under multi-agent compound stress."
  },

  whatItIs: {
    sectionIndex: "04",
    sectionLabel: "WHAT IT IS",
    headline: "Four Chambers of the Shift Gate",
    subline: "An open benchmarking pipeline with modular scenario synthesis, prediction, uncertainty quantification, and comparative auditing.",
    chambers: [
      {
        id: "chamber-a",
        letter: "A",
        title: "Network Scenario Generator",
        role: "Synthetic & Hybrid Ingestion",
        description: "Generates normal, unusual, combined-shift, and missing-data scenarios with reproducible seed states.",
        inputs: ["Traffic distributions", "Mobility profiles", "Channel noise seeds", "Telemetry dropout ratios"],
        outputs: ["Multi-variate telemetry streams", "Ground-truth QoS violation labels"],
        telemetryMetric: "12 Parametric Stress Seeds"
      },
      {
        id: "chamber-b",
        letter: "B",
        title: "Prediction Models",
        role: "Latency & QoS Inference",
        description: "Predicts next-window latency or probability of a QoS violation across heterogeneous traffic slices.",
        inputs: ["Sliding telemetry windows (t-k : t)", "Cell load counters", "Beam SNR indices"],
        outputs: ["Point estimate latency (t + Δ)", "Violation probability score [0, 1]"],
        telemetryMetric: "Next-window Horizon Δ = 5-50ms"
      },
      {
        id: "chamber-c",
        letter: "C",
        title: "Reliability Evaluation Engine",
        role: "Uncertainty & Abstention Trigger",
        description: "Measures uncertainty, unfamiliar conditions, and the decision to abstain from unreliable predictions.",
        inputs: ["Model prediction vectors", "Conformal calibration bounds", "Out-of-distribution indicators"],
        outputs: ["Conformal prediction interval", "Abstention flag (predict vs. defer)"],
        telemetryMetric: "Conformal Coverage Target: 95%"
      },
      {
        id: "chamber-d",
        letter: "D",
        title: "Results Dashboard",
        role: "Stress Auditing & Trade-offs",
        description: "Compares baselines, stress scenarios, missed warnings, false alarms, and processing cost.",
        inputs: ["Ground-truth outcomes", "Reliability engine logs", "Inference compute profiles"],
        outputs: ["Reliability vs. coverage curves", "Latency violation miss matrices", "Compute overhead metrics"],
        telemetryMetric: "Multi-axis Audit Matrix"
      }
    ] as ChamberItem[]
  },

  experiments: {
    sectionIndex: "05",
    sectionLabel: "THE EXPERIMENTS",
    headline: "The Six-Door Corridor",
    subline: "Scroll traverses six progressive test chambers, from calm baseline to compound stress and epistemic uncertainty.",
    doors: [
      {
        id: 1,
        stage: "01 / BASELINE",
        title: "Normal conditions",
        condition: "Calm network, stable load, pristine telemetry",
        objective: "Establish baseline performance metrics under standard training distributions.",
        simulatedRiskLevel: "cyan",
        confidenceScore: "98.4%",
        abstentionSuggested: false
      },
      {
        id: 2,
        stage: "02 / SENSITIVITY",
        title: "One condition changes",
        condition: "Isolated disturbance (traffic burst OR noise jump)",
        objective: "Measure single-factor sensitivity to individual perturbations in isolation.",
        simulatedRiskLevel: "cyan",
        confidenceScore: "87.1%",
        abstentionSuggested: false
      },
      {
        id: 3,
        stage: "03 / COMPOUND",
        title: "Multiple conditions change together",
        condition: "Surge + radio interference + handovers combined",
        objective: "Stress-test robustness to compound shifts where disturbances amplify non-linearly.",
        simulatedRiskLevel: "amber",
        confidenceScore: "64.8%",
        abstentionSuggested: false
      },
      {
        id: 4,
        stage: "04 / TEMPORAL",
        title: "Conditions change over time",
        condition: "Gradual non-stationary drift and cyclical shifts",
        objective: "Evaluate reliability in evolving temporal scenarios without instant re-training.",
        simulatedRiskLevel: "amber",
        confidenceScore: "58.2%",
        abstentionSuggested: true
      },
      {
        id: 5,
        stage: "05 / INCOMPLETE",
        title: "Missing or delayed measurements",
        condition: "15-30% telemetry loss, asynchronous updates",
        objective: "Quantify model dependence on high-fidelity observation streams.",
        simulatedRiskLevel: "red",
        confidenceScore: "38.6%",
        abstentionSuggested: true
      },
      {
        id: 6,
        stage: "06 / UNFAMILIAR",
        title: "Unfamiliar combinations",
        condition: "Out-of-distribution compound stress configurations",
        objective: "Test whether the system can detect extreme uncertainty and flag unreliable predictions.",
        simulatedRiskLevel: "red",
        confidenceScore: "21.0%",
        abstentionSuggested: true
      }
    ] as ExperimentDoor[]
  },

  comparison: {
    sectionIndex: "06",
    sectionLabel: "THE COMPARISON",
    headline: "Three Paradigms at the Split Gate",
    subline: "Comparing operational behaviors when exposed to non-nominal 6G telemetry conditions.",
    disclaimer: "Illustrative design only — no real results yet.",
    gates: [
      {
        id: "gate-1",
        title: "Conventional Model",
        paradigm: "Deterministic Point Prediction",
        behavior: "Issues overconfident latency forecasts even when input telemetry violates training bounds.",
        failureMode: "Silent failure: catastrophic missed QoS violations with zero warning.",
        abstentionCapable: false,
        tag: "Zero Uncertainty Warning"
      },
      {
        id: "gate-2",
        title: "Calibrated / UQ Model",
        paradigm: "Standard Uncertainty Estimation",
        behavior: "Outputs variance or confidence intervals based on in-distribution calibration sets.",
        failureMode: "Under-calibrated under unfamiliar compound shifts; interval coverage collapses.",
        abstentionCapable: false,
        tag: "Static Calibration"
      },
      {
        id: "gate-3",
        title: "Proposed ShiftGuard Method",
        paradigm: "Compound-Aware Reliability & Selective Deferral",
        behavior: "Quantifies epistemic shift and issues high-confidence predictions or explicit abstention.",
        failureMode: "Controlled abstention: defers to safe fallback buffer instead of guessing.",
        abstentionCapable: true,
        tag: "Active Abstention Trigger"
      }
    ] as ComparisonGate[]
  },

  metrics: {
    sectionIndex: "07",
    sectionLabel: "METRICS",
    headline: "Multidimensional Reliability Framework",
    subline: "Looking beyond mean accuracy to quantify safety, warning fidelity, and runtime footprint.",
    categories: [
      {
        id: "pred-quality",
        title: "Prediction Quality",
        tagline: "Point-wise and classification accuracy under standard operational windows",
        metrics: [
          { name: "MAE / RMSE", description: "Mean absolute and root mean squared error on continuous latency predictions.", targetBehavior: "Minimizing prediction error under nominal distributions." },
          { name: "Precision & Recall", description: "Detection accuracy on discrete QoS deadline threshold violations.", targetBehavior: "High true-positive detection without oversaturating alert queues." },
          { name: "Macro F1 Score", description: "Balanced harmonic mean across rare critical violation slices.", targetBehavior: "Resilience against class imbalance in 6G traffic." }
        ]
      },
      {
        id: "reliability-uq",
        title: "Reliability & UQ",
        tagline: "Calibration fidelity and uncertainty interval validity under shift",
        metrics: [
          { name: "Expected Calibration Error (ECE)", description: "Discrepancy between predicted probability and actual empirical frequency.", targetBehavior: "Monotonically calibrated confidence mapping." },
          { name: "Empirical Interval Coverage", description: "Percentage of ground-truth latency values falling within the prediction band.", targetBehavior: "Guaranteed nominal coverage (e.g. 1 - α = 95%)." },
          { name: "Unreliable Predictions Caught", description: "Proportion of severely degraded forecasts flagged as out-of-bounds.", targetBehavior: "High sensitivity to epistemic drift." }
        ]
      },
      {
        id: "warning-fidelity",
        title: "Warning Quality",
        tagline: "Operational viability of alerts issued to cell controllers",
        metrics: [
          { name: "False-Alarm Rate", description: "Frequency of safe operational states incorrectly flagged as critical emergencies.", targetBehavior: "Restricting unnecessary fallback trigger costs." },
          { name: "Missed-Risk Rate", description: "Frequency of severe QoS deadline breaches that went unflagged.", targetBehavior: "Near-zero tolerance in mission-critical slices." },
          { name: "Detection Delay", description: "Temporal lead time between warning emission and physical QoS breach.", targetBehavior: "Sufficient window (≥ 10ms) for traffic rerouting." }
        ]
      },
      {
        id: "practical-cost",
        title: "Practical Cost",
        tagline: "Computational and operational overhead of the verification layer",
        metrics: [
          { name: "Inference Latency", description: "Wall-clock execution time of the UQ layer per telemetry frame.", targetBehavior: "Strict sub-millisecond envelope (< 0.8ms)." },
          { name: "Memory Footprint", description: "RAM consumption of calibration tables and sliding telemetry buffers.", targetBehavior: "Deployable on resource-constrained edge UPFs." },
          { name: "Abstention Rate", description: "Fraction of predictions safely deferred to conservative heuristic baselines.", targetBehavior: "Bounded abstention (< 12%) to preserve automation." }
        ]
      }
    ] as MetricCategory[]
  },

  roadmap: {
    sectionIndex: "08",
    sectionLabel: "THE ROADMAP",
    headline: "Eight-Week Research Timeline",
    subline: "An incremental, hypothesis-driven development schedule from literature review to open benchmark release.",
    note: "An eight-week plan is an estimate, not a guarantee.",
    milestones: [
      {
        weeks: "Weeks 1–2",
        phase: "Phase 1: Foundation",
        title: "Systematic Literature Review & Gap Formalization",
        deliverables: [
          "Taxonomy of 6G AI latency predictors",
          "Survey of compound shift coverage in wireless datasets",
          "Formalization of the compound gap hypothesis"
        ],
        riskFactor: "Risk: Prior work may have addressed specific compound pairs."
      },
      {
        weeks: "Weeks 3–4",
        phase: "Phase 2: Simulator",
        title: "Synthetic Scenario Generator & Telemetry Simulator",
        deliverables: [
          "Multi-factor perturbation pipeline (bursts, handovers, noise, dropouts)",
          "Standardized synthetic trace generator with reproducible seeds",
          "Data validation suite and schema definitions"
        ],
        riskFactor: "Risk: Sim-to-real gap in synthetic channel noise models."
      },
      {
        weeks: "Weeks 5–6",
        phase: "Phase 3: Methods",
        title: "Reliability & Conformal Prediction Integration",
        deliverables: [
          "Split-conformal prediction baseline implementation",
          "Compound-aware epistemic uncertainty estimator",
          "Selective prediction and abstention decision rule"
        ],
        riskFactor: "Risk: Conformal coverage guarantees under extreme covariate shift."
      },
      {
        weeks: "Week 7",
        phase: "Phase 4: Evaluation",
        title: "Stress Benchmarking & Ablation Suite",
        deliverables: [
          "Evaluation across all 6 corridor stress scenarios",
          "Ablation studies on telemetry dropout rates",
          "Execution overhead profiling on edge CPU/GPU targets"
        ],
        riskFactor: "Risk: Long compute sweeps across multi-parameter grid."
      },
      {
        weeks: "Week 8",
        phase: "Phase 5: Release",
        title: "Repo Packaging, Dashboard, & Paper Draft",
        deliverables: [
          "Open-source repository release with pytest suite",
          "Interactive Streamlit results auditing dashboard",
          "Submission-ready workshop research paper draft"
        ],
        riskFactor: "Risk: Documentation and containerized environment polish."
      }
    ] as RoadmapMilestone[]
  },

  stack: {
    sectionIndex: "09",
    sectionLabel: "THE STACK",
    headline: "Precision Scientific Stack",
    subline: "Open-source, modular, and reproducible research tooling.",
    tools: [
      { name: "Python", role: "Core research runtime & scripting language", layer: "Runtime" },
      { name: "NumPy", role: "Vectorized numerical simulation & array buffers", layer: "Runtime" },
      { name: "pandas", role: "Telemetry dataset manipulation and time-series alignment", layer: "Runtime" },
      { name: "scikit-learn", role: "Baseline predictive modeling, metrics & data splits", layer: "Learning" },
      { name: "XGBoost", role: "High-performance gradient-boosted trees for latency forecasting", layer: "Learning" },
      { name: "Conformal Prediction", role: "Distribution-free uncertainty quantification & coverage guarantees", layer: "Verification" },
      { name: "Jupyter", role: "Exploratory prototyping & interactive ablation notebooks", layer: "Runtime" },
      { name: "pytest", role: "Strict test harness for deterministic reproducibility", layer: "Verification" },
      { name: "Streamlit", role: "Interactive stress-test results exploration & visualization app", layer: "Presentation" },
      { name: "Plotly", role: "Multi-variate telemetry charts & reliability diagrams", layer: "Presentation" },
      { name: "ns-3", role: "High-fidelity packet-level wireless network simulation (planned)", layer: "Simulation", note: "Roadmap Phase" }
    ] as TechItem[]
  },

  final: {
    sectionIndex: "10",
    sectionLabel: "OBSERVATORY GATE",
    headline: "Reliability is a result, not an assumption.",
    subline: "Synthetic results will always be labeled as simulated.",
    secondaryText: "ShiftGuard-6G is designed to transform black-box predictive confidence into transparent, safety-critical awareness under harsh wireless realities.",
    ctas: [
      { label: "View on GitHub", href: "https://github.com/example/shiftguard-6g", primary: true },
      { label: "Read the Research Plan", href: "#roadmap", primary: false }
    ],
    statusStamp: "SYSTEM CALIBRATED // SHIFT GATE OPERATIONAL"
  }
};

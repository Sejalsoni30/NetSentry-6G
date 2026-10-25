"""Component C: Reliability Engine — Approach 3 (Proposed ShiftGuard Method).

Combines adaptive conformal interval width with Isolation Forest unfamiliarity score.
Triggers defensive abstention when either uncertainty or epistemic unfamiliarity exceeds 
thresholds selected strictly on separate validation scenarios.
"""

from __future__ import annotations

from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from shiftguard.models.baseline import QOS_THRESHOLD_MS
from shiftguard.reliability.conformal import NormalizedConformalPredictor
from shiftguard.reliability.ood import UnfamiliarityDetector


class ShiftGuardReliabilityEngine:
    """Approach 3: Combined Conformal Uncertainty + Epistemic Unfamiliarity Abstention Engine."""

    def __init__(
        self,
        conformal_predictor: NormalizedConformalPredictor,
        ood_detector: UnfamiliarityDetector,
        tau_width: Optional[float] = None,
        tau_ood: Optional[float] = None,
    ) -> None:
        self.conformal_predictor = conformal_predictor
        self.ood_detector = ood_detector
        self.tau_width = tau_width
        self.tau_ood = tau_ood
        self.is_tuned: bool = (tau_width is not None and tau_ood is not None)

    def tune_thresholds_on_validation(
        self,
        val_df: pd.DataFrame,
        calib_normal_df: pd.DataFrame,
        max_normal_abstention: float = 0.08,
        unreliable_error_threshold: float = 12.0,
    ) -> ShiftGuardReliabilityEngine:
        """Select tau_width and tau_ood strictly using validation scenarios.
        
        CRITICAL: Never uses test scenarios. Selects thresholds to detect unreliable
        predictions in shifted validation data while keeping false abstentions on normal
        calibration data under max_normal_abstention.
        """
        # 1. Normal calibration baseline metrics
        _, _, _, normal_widths = self.conformal_predictor.predict_intervals(calib_normal_df)
        normal_ood = self.ood_detector.score_unfamiliarity(calib_normal_df)

        # 2. Validation shifted metrics
        y_val = val_df["latency"].to_numpy()
        y_pred_val, _, _, val_widths = self.conformal_predictor.predict_intervals(val_df)
        val_ood = self.ood_detector.score_unfamiliarity(val_df)
        val_errors = np.abs(y_val - y_pred_val)

        # Ground-truth unreliability in validation: large error OR missed QoS breach
        val_is_unreliable = (val_errors > unreliable_error_threshold) | (
            (val_df["qos_violation"] == 1) & (y_pred_val <= QOS_THRESHOLD_MS)
        )

        # Search grid over quantile levels on normal calibration data
        # so normal false abstention rate <= max_normal_abstention
        best_f1 = -1.0
        best_tau_w = float(np.quantile(normal_widths, 0.95))
        best_tau_o = float(np.quantile(normal_ood, 0.95))

        q_w_levels = np.linspace(0.85, 0.98, 14)
        q_o_levels = np.linspace(0.85, 0.98, 14)

        for qw in q_w_levels:
            cand_w = float(np.quantile(normal_widths, qw))
            for qo in q_o_levels:
                cand_o = float(np.quantile(normal_ood, qo))

                # Check false abstention rate on normal calibration set
                normal_abstained = (normal_widths > cand_w) | (normal_ood > cand_o)
                if np.mean(normal_abstained) > max_normal_abstention:
                    continue

                # Evaluate detection of unreliable predictions on validation set
                val_abstained = (val_widths > cand_w) | (val_ood > cand_o)
                tp = np.sum(val_abstained & val_is_unreliable)
                fp = np.sum(val_abstained & (~val_is_unreliable))
                fn = np.sum((~val_abstained) & val_is_unreliable)

                prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
                rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
                f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0

                if f1 > best_f1:
                    best_f1 = f1
                    best_tau_w = cand_w
                    best_tau_o = cand_o

        self.tau_width = best_tau_w
        self.tau_ood = best_tau_o
        self.is_tuned = True
        return self

    def predict(self, df_or_X: pd.DataFrame | np.ndarray) -> Dict[str, np.ndarray]:
        """Run complete ShiftGuard inference pipeline.
        
        Returns:
            Dict containing predictions, bounds, scores, and abstention decisions.
        """
        if not self.is_tuned or self.tau_width is None or self.tau_ood is None:
            raise RuntimeError("ShiftGuardReliabilityEngine must have thresholds tuned before predict()")

        y_pred, lower, upper, width = self.conformal_predictor.predict_intervals(df_or_X)
        ood_scores = self.ood_detector.score_unfamiliarity(df_or_X)

        width_trigger = width > self.tau_width
        ood_trigger = ood_scores > self.tau_ood
        abstain = width_trigger | ood_trigger

        qos_pred = (y_pred > QOS_THRESHOLD_MS).astype(int)

        return {
            "latency_pred": y_pred,
            "lower": lower,
            "upper": upper,
            "interval_width": width,
            "unfamiliarity_score": ood_scores,
            "abstain": abstain,
            "width_trigger": width_trigger,
            "ood_trigger": ood_trigger,
            "qos_violation_pred": qos_pred,
        }

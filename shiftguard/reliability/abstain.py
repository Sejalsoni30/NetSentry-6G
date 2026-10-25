"""Component C: Reliability Engine & Abstention Mechanisms (Approaches & Ablations).

Implements:
1. ShiftGuardReliabilityEngine (Approach 3): Conformal width + Isolation Forest OOD
2. WidthOnlyEngine (Ablation): Conformal interval width only
3. OodOnlyEngine (Ablation): Isolation Forest unfamiliarity only
4. RandomAbstainEngine (Control): Uniform random abstention matching ShiftGuard rate
5. ShiftGuardMissingAwareEngine (Ablation): ShiftGuard incorporating missingness penalty

All thresholds are strictly chosen on separate validation scenarios. Zero test-set leakage.
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
        """Run complete ShiftGuard inference pipeline."""
        if not self.is_tuned or self.tau_width is None or self.tau_ood is None:
            raise RuntimeError("ShiftGuardReliabilityEngine must have thresholds tuned before predict()")

        y_pred, lower, upper, width = self.conformal_predictor.predict_intervals(df_or_X)
        ood_scores = self.ood_detector.score_unfamiliarity(df_or_X)

        width_trigger = width > self.tau_width
        ood_trigger = ood_scores > self.tau_ood
        abstain = width_trigger | ood_trigger

        qos_pred = (y_pred > QOS_THRESHOLD_MS).astype(int)
        
        # Warning signal triggers if upper interval breaches threshold OR point prediction breaches OR abstention
        warning_signal = (upper > QOS_THRESHOLD_MS) | abstain | (qos_pred == 1)

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
            "warning_signal": warning_signal,
        }


class WidthOnlyEngine:
    """Ablation: Conformal Interval Width-Only Abstention Engine."""

    def __init__(
        self,
        conformal_predictor: NormalizedConformalPredictor,
        tau_width: Optional[float] = None,
    ) -> None:
        self.conformal_predictor = conformal_predictor
        self.tau_width = tau_width
        self.is_tuned: bool = (tau_width is not None)

    def tune_thresholds_on_validation(
        self,
        val_df: pd.DataFrame,
        calib_normal_df: pd.DataFrame,
        max_normal_abstention: float = 0.08,
        unreliable_error_threshold: float = 12.0,
    ) -> WidthOnlyEngine:
        """Select tau_width strictly on validation scenarios."""
        _, _, _, normal_widths = self.conformal_predictor.predict_intervals(calib_normal_df)
        y_val = val_df["latency"].to_numpy()
        y_pred_val, _, _, val_widths = self.conformal_predictor.predict_intervals(val_df)
        val_is_unreliable = (np.abs(y_val - y_pred_val) > unreliable_error_threshold) | (
            (val_df["qos_violation"] == 1) & (y_pred_val <= QOS_THRESHOLD_MS)
        )

        best_f1 = -1.0
        best_tau = float(np.quantile(normal_widths, 1.0 - max_normal_abstention))

        for qw in np.linspace(0.85, 0.98, 30):
            cand_w = float(np.quantile(normal_widths, qw))
            if np.mean(normal_widths > cand_w) > max_normal_abstention:
                continue
            val_abstained = val_widths > cand_w
            tp = np.sum(val_abstained & val_is_unreliable)
            fp = np.sum(val_abstained & (~val_is_unreliable))
            fn = np.sum((~val_abstained) & val_is_unreliable)
            prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0
            if f1 > best_f1:
                best_f1 = f1
                best_tau = cand_w

        self.tau_width = best_tau
        self.is_tuned = True
        return self

    def predict(self, df_or_X: pd.DataFrame | np.ndarray) -> Dict[str, np.ndarray]:
        if not self.is_tuned or self.tau_width is None:
            raise RuntimeError("WidthOnlyEngine must have tau_width tuned before predict()")
        y_pred, lower, upper, width = self.conformal_predictor.predict_intervals(df_or_X)
        abstain = width > self.tau_width
        qos_pred = (y_pred > QOS_THRESHOLD_MS).astype(int)
        warning_signal = (upper > QOS_THRESHOLD_MS) | abstain | (qos_pred == 1)

        return {
            "latency_pred": y_pred,
            "lower": lower,
            "upper": upper,
            "interval_width": width,
            "unfamiliarity_score": np.zeros_like(width),
            "abstain": abstain,
            "qos_violation_pred": qos_pred,
            "warning_signal": warning_signal,
        }


class OodOnlyEngine:
    """Ablation: Isolation Forest OOD-Only Abstention Engine."""

    def __init__(
        self,
        base_model: object,
        ood_detector: UnfamiliarityDetector,
        tau_ood: Optional[float] = None,
    ) -> None:
        self.base_model = base_model
        self.ood_detector = ood_detector
        self.tau_ood = tau_ood
        self.is_tuned: bool = (tau_ood is not None)

    def tune_thresholds_on_validation(
        self,
        val_df: pd.DataFrame,
        calib_normal_df: pd.DataFrame,
        max_normal_abstention: float = 0.08,
        unreliable_error_threshold: float = 12.0,
    ) -> OodOnlyEngine:
        """Select tau_ood strictly on validation scenarios."""
        normal_ood = self.ood_detector.score_unfamiliarity(calib_normal_df)
        y_val = val_df["latency"].to_numpy()
        y_pred_val = self.base_model.predict_latency(val_df)
        val_ood = self.ood_detector.score_unfamiliarity(val_df)
        val_is_unreliable = (np.abs(y_val - y_pred_val) > unreliable_error_threshold) | (
            (val_df["qos_violation"] == 1) & (y_pred_val <= QOS_THRESHOLD_MS)
        )

        best_f1 = -1.0
        best_tau = float(np.quantile(normal_ood, 1.0 - max_normal_abstention))

        for qo in np.linspace(0.85, 0.98, 30):
            cand_o = float(np.quantile(normal_ood, qo))
            if np.mean(normal_ood > cand_o) > max_normal_abstention:
                continue
            val_abstained = val_ood > cand_o
            tp = np.sum(val_abstained & val_is_unreliable)
            fp = np.sum(val_abstained & (~val_is_unreliable))
            fn = np.sum((~val_abstained) & val_is_unreliable)
            prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0
            if f1 > best_f1:
                best_f1 = f1
                best_tau = cand_o

        self.tau_ood = best_tau
        self.is_tuned = True
        return self

    def predict(self, df_or_X: pd.DataFrame | np.ndarray) -> Dict[str, np.ndarray]:
        if not self.is_tuned or self.tau_ood is None:
            raise RuntimeError("OodOnlyEngine must have tau_ood tuned before predict()")
        y_pred = self.base_model.predict_latency(df_or_X)
        ood_scores = self.ood_detector.score_unfamiliarity(df_or_X)
        abstain = ood_scores > self.tau_ood
        qos_pred = (y_pred > QOS_THRESHOLD_MS).astype(int)
        warning_signal = abstain | (qos_pred == 1)

        return {
            "latency_pred": y_pred,
            "lower": None,
            "upper": None,
            "interval_width": None,
            "unfamiliarity_score": ood_scores,
            "abstain": abstain,
            "qos_violation_pred": qos_pred,
            "warning_signal": warning_signal,
        }


class RandomAbstainEngine:
    """Control: Uniform Random Abstention matching a target abstention rate."""

    def __init__(self, base_model: object, target_rate: float = 0.10, seed: int = 42) -> None:
        self.base_model = base_model
        self.target_rate = target_rate
        self.seed = seed

    def predict(self, df_or_X: pd.DataFrame | np.ndarray) -> Dict[str, np.ndarray]:
        y_pred = self.base_model.predict_latency(df_or_X)
        n = len(y_pred)
        rng = np.random.default_rng(self.seed)
        abstain = rng.random(n) < self.target_rate
        qos_pred = (y_pred > QOS_THRESHOLD_MS).astype(int)
        warning_signal = abstain | (qos_pred == 1)

        return {
            "latency_pred": y_pred,
            "lower": None,
            "upper": None,
            "interval_width": None,
            "unfamiliarity_score": np.zeros(n),
            "abstain": abstain,
            "qos_violation_pred": qos_pred,
            "warning_signal": warning_signal,
        }


class ShiftGuardMissingAwareEngine:
    """Ablation: ShiftGuard with explicit missing-telemetry awareness."""

    def __init__(
        self,
        conformal_predictor: NormalizedConformalPredictor,
        ood_detector: UnfamiliarityDetector,
        tau_width: Optional[float] = None,
        tau_ood: Optional[float] = None,
        tau_missing: float = 0.15,
    ) -> None:
        self.conformal_predictor = conformal_predictor
        self.ood_detector = ood_detector
        self.tau_width = tau_width
        self.tau_ood = tau_ood
        self.tau_missing = tau_missing
        self.is_tuned: bool = (tau_width is not None and tau_ood is not None)

    def tune_thresholds_on_validation(
        self,
        val_df: pd.DataFrame,
        calib_normal_df: pd.DataFrame,
        max_normal_abstention: float = 0.08,
    ) -> ShiftGuardMissingAwareEngine:
        """Select thresholds strictly on validation data."""
        # Delegate standard tuning
        standard_engine = ShiftGuardReliabilityEngine(self.conformal_predictor, self.ood_detector)
        standard_engine.tune_thresholds_on_validation(val_df, calib_normal_df, max_normal_abstention=max_normal_abstention)
        self.tau_width = standard_engine.tau_width
        self.tau_ood = standard_engine.tau_ood
        # Missing threshold: on validation set with missingness, any missing indicator >= 1 is penalized
        self.tau_missing = 0.5  # at least one feature missing
        self.is_tuned = True
        return self

    def predict(self, df_or_X: pd.DataFrame | np.ndarray) -> Dict[str, np.ndarray]:
        if not self.is_tuned or self.tau_width is None or self.tau_ood is None:
            raise RuntimeError("ShiftGuardMissingAwareEngine must be tuned before predict()")

        y_pred, lower, upper, width = self.conformal_predictor.predict_intervals(df_or_X)
        ood_scores = self.ood_detector.score_unfamiliarity(df_or_X)

        # Missingness flag
        if isinstance(df_or_X, pd.DataFrame):
            missing_cols = [c for c in df_or_X.columns if c.endswith("_missing")]
            if missing_cols:
                missing_flag = (df_or_X[missing_cols].sum(axis=1) >= 1).to_numpy()
            else:
                missing_flag = np.zeros(len(df_or_X), dtype=bool)
        else:
            missing_flag = np.zeros(len(df_or_X), dtype=bool)

        width_trigger = width > self.tau_width
        ood_trigger = ood_scores > self.tau_ood
        abstain = width_trigger | ood_trigger | missing_flag

        qos_pred = (y_pred > QOS_THRESHOLD_MS).astype(int)
        warning_signal = (upper > QOS_THRESHOLD_MS) | abstain | (qos_pred == 1)

        return {
            "latency_pred": y_pred,
            "lower": lower,
            "upper": upper,
            "interval_width": width,
            "unfamiliarity_score": ood_scores,
            "abstain": abstain,
            "width_trigger": width_trigger,
            "ood_trigger": ood_trigger,
            "missing_trigger": missing_flag,
            "qos_violation_pred": qos_pred,
            "warning_signal": warning_signal,
        }

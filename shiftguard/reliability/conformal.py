"""Component C: Reliability Engine — Approach 2 (Normalized Split Conformal Prediction).

Implements locally adaptive (normalized) split conformal prediction:
- Base predictor μ̂(x) forecasts point latency (fitted on training data)
- Secondary dispersion predictor σ̂(x) forecasts expected absolute residual size |y - μ̂(x)|
  (fitted on training data to preserve strict exchangeability on calibration data)
- Nonconformity scores s_i = |y_i - μ̂(x_i)| / σ̂(x_i) computed on separate held-out calibration set
- Conformal quantile q̂ guarantees 1 - α marginal coverage under in-distribution data
- Produces dynamic prediction intervals [ŷ - q̂*σ̂(x), ŷ + q̂*σ̂(x)] with input-dependent width
"""

from __future__ import annotations

from typing import Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from shiftguard.models.baseline import BaselinePredictor, FEATURE_COLS, TARGET_COL


class NormalizedConformalPredictor:
    """Locally adaptive split conformal prediction for 6G latency (Approach 2)."""

    def __init__(
        self,
        base_model: BaselinePredictor,
        alpha: float = 0.10,
        min_dispersion: float = 0.5,
        random_state: int = 42,
    ) -> None:
        self.base_model = base_model
        self.alpha = alpha
        self.min_dispersion = min_dispersion
        self.random_state = random_state

        # Secondary regressor to model residual error magnitude
        self.dispersion_model = HistGradientBoostingRegressor(
            max_iter=100,
            learning_rate=0.08,
            min_samples_leaf=15,
            random_state=random_state,
        )

        self.is_dispersion_fitted: bool = False
        self.q_hat: Optional[float] = None
        self.is_calibrated: bool = False

    def _extract_features(self, df_or_X: pd.DataFrame | np.ndarray) -> np.ndarray:
        if isinstance(df_or_X, pd.DataFrame):
            return df_or_X[FEATURE_COLS].to_numpy()
        return np.asarray(df_or_X)

    def fit_dispersion(self, train_df: pd.DataFrame) -> NormalizedConformalPredictor:
        """Fit the secondary dispersion model on training data residuals.
        
        CRITICAL FOR VALIDITY: Fitting σ̂ on the training set preserves the 
        exchangeability of the calibration set with test data, preventing 
        in-sample overconfidence on calibration residuals.
        """
        if not self.base_model.is_fitted:
            raise RuntimeError("Base model must be fitted before fitting dispersion model")

        X_train = self._extract_features(train_df)
        y_train = train_df[TARGET_COL].to_numpy()

        y_pred_train = self.base_model.predict_latency(train_df)
        residuals_train = np.abs(y_train - y_pred_train)

        self.dispersion_model.fit(X_train, residuals_train)
        self.is_dispersion_fitted = True
        return self

    def calibrate(
        self,
        calib_df: pd.DataFrame,
        train_df: Optional[pd.DataFrame] = None,
    ) -> NormalizedConformalPredictor:
        """Calibrate the conformal predictor using a separate held-out calibration set.
        
        Args:
            calib_df: Held-out calibration set used strictly for quantile calculation.
            train_df: Optional training set to fit dispersion model if not already fitted.
        """
        if not self.base_model.is_fitted:
            raise RuntimeError("Base model must be fitted prior to calibration")

        if not self.is_dispersion_fitted:
            if train_df is not None:
                self.fit_dispersion(train_df)
            else:
                # If train_df not provided, fit on calib_df half to maintain split
                n_half = len(calib_df) // 2
                sub_fit = calib_df.iloc[:n_half]
                calib_eval = calib_df.iloc[n_half:]
                self.fit_dispersion(sub_fit)
                calib_df = calib_eval

        X_calib = self._extract_features(calib_df)
        y_calib = calib_df[TARGET_COL].to_numpy()

        # 1. Base model predictions on calibration set
        y_pred_calib = self.base_model.predict_latency(calib_df)
        residuals_calib = np.abs(y_calib - y_pred_calib)

        # 2. Predict local dispersion σ̂(x) with strict lower bound to prevent division by zero
        raw_dispersion = self.dispersion_model.predict(X_calib)
        sigma_calib = np.maximum(raw_dispersion, self.min_dispersion)

        # 3. Compute normalized nonconformity scores
        scores = residuals_calib / sigma_calib

        # 4. Compute the conformal quantile q̂ with finite-sample correction
        n = len(scores)
        quantile_level = np.ceil((n + 1) * (1.0 - self.alpha)) / n
        quantile_level = np.clip(quantile_level, 0.0, 1.0)
        
        self.q_hat = float(np.quantile(scores, quantile_level, method="higher"))
        self.is_calibrated = True
        return self

    def predict_dispersion(self, df_or_X: pd.DataFrame | np.ndarray) -> np.ndarray:
        """Estimate the local conditional variance / residual size σ̂(x)."""
        if not self.is_calibrated:
            raise RuntimeError("Conformal predictor must be calibrated before predicting dispersion")
        X = self._extract_features(df_or_X)
        raw = self.dispersion_model.predict(X)
        return np.maximum(raw, self.min_dispersion)

    def predict_intervals(
        self,
        df_or_X: pd.DataFrame | np.ndarray,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Produce point prediction, lower bound, upper bound, and interval width.
        
        Returns:
            Tuple of (y_pred, lower, upper, interval_width)
        """
        if not self.is_calibrated or self.q_hat is None:
            raise RuntimeError("Conformal predictor must be calibrated before predict_intervals()")

        y_pred = self.base_model.predict_latency(df_or_X)
        sigma = self.predict_dispersion(df_or_X)

        margin = self.q_hat * sigma
        lower = np.maximum(0.0, y_pred - margin)
        upper = y_pred + margin
        width = upper - lower

        return y_pred, lower, upper, width

    @staticmethod
    def compute_coverage(
        y_true: np.ndarray,
        lower: np.ndarray,
        upper: np.ndarray,
    ) -> float:
        """Compute empirical marginal coverage: fraction of ground truth within interval."""
        covered = (y_true >= lower) & (y_true <= upper)
        return float(np.mean(covered))

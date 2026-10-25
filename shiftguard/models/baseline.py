"""Component B: Baseline Prediction Model (Approach 1: Conventional Model).

Uses scikit-learn's HistGradientBoostingRegressor to natively handle missing 
telemetry (NaNs) and predict next-window latency without any uncertainty warning.
"""

from __future__ import annotations

from typing import List, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor


FEATURE_COLS: List[str] = [
    "load",
    "handovers",
    "sinr",
    "load_missing",
    "handovers_missing",
    "sinr_missing",
]

TARGET_COL: str = "latency"
QOS_THRESHOLD_MS: float = 60.0


class BaselinePredictor:
    """Conventional point predictor for 6G latency.
    
    Trained strictly on normal network conditions. Does not provide uncertainty
    intervals or abstention capabilities (Approach 1).
    """

    def __init__(
        self,
        max_iter: int = 150,
        learning_rate: float = 0.08,
        min_samples_leaf: int = 15,
        random_state: int = 42,
    ) -> None:
        self.random_state = random_state
        self.model = HistGradientBoostingRegressor(
            max_iter=max_iter,
            learning_rate=learning_rate,
            min_samples_leaf=min_samples_leaf,
            random_state=random_state,
        )
        self.is_fitted: bool = False

    def _extract_features(self, df_or_arr: pd.DataFrame | np.ndarray) -> np.ndarray:
        if isinstance(df_or_arr, pd.DataFrame):
            # Extract expected feature columns
            return df_or_arr[FEATURE_COLS].to_numpy()
        return np.asarray(df_or_arr)

    def fit(self, df_or_X: pd.DataFrame | np.ndarray, y: Optional[np.ndarray] = None) -> BaselinePredictor:
        """Fit the regressor on normal training data."""
        if isinstance(df_or_X, pd.DataFrame):
            X = df_or_X[FEATURE_COLS].to_numpy()
            y_arr = df_or_X[TARGET_COL].to_numpy() if y is None else np.asarray(y)
        else:
            X = np.asarray(df_or_X)
            if y is None:
                raise ValueError("Target y must be provided when X is a numpy array")
            y_arr = np.asarray(y)

        self.model.fit(X, y_arr)
        self.is_fitted = True
        return self

    def predict_latency(self, df_or_X: pd.DataFrame | np.ndarray) -> np.ndarray:
        """Predict continuous latency in milliseconds."""
        if not self.is_fitted:
            raise RuntimeError("BaselinePredictor must be fitted before predict_latency()")
        X = self._extract_features(df_or_X)
        return self.model.predict(X)

    def predict_qos_violation(self, df_or_X: pd.DataFrame | np.ndarray) -> np.ndarray:
        """Predict discrete QoS violation flag (1 if predicted latency > 60 ms, else 0)."""
        pred_latency = self.predict_latency(df_or_X)
        return (pred_latency > QOS_THRESHOLD_MS).astype(int)

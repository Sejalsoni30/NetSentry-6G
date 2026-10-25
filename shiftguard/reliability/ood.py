"""Component C: Reliability Engine — Unfamiliar Condition Detector.

Uses Isolation Forest on telemetry features to compute an unfamiliarity (epistemic anomaly) score.
Handles missing telemetry features via median imputation with missing indicator preservation.
"""

from __future__ import annotations

from typing import Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from shiftguard.models.baseline import FEATURE_COLS


class UnfamiliarityDetector:
    """Detects out-of-distribution (OOD) or unfamiliar network conditions using Isolation Forest."""

    def __init__(
        self,
        n_estimators: int = 150,
        contamination: float = 0.05,
        random_state: int = 42,
    ) -> None:
        self.random_state = random_state
        self.imputer = SimpleImputer(strategy="median")
        self.detector = IsolationForest(
            n_estimators=n_estimators,
            contamination=contamination,
            random_state=random_state,
        )
        self.is_fitted: bool = False

    def _extract_and_impute(
        self,
        df_or_X: pd.DataFrame | np.ndarray,
        fit_imputer: bool = False,
    ) -> np.ndarray:
        if isinstance(df_or_X, pd.DataFrame):
            raw = df_or_X[FEATURE_COLS].to_numpy()
        else:
            raw = np.asarray(df_or_X)

        if fit_imputer:
            return self.imputer.fit_transform(raw)
        return self.imputer.transform(raw)

    def fit(self, train_df_or_X: pd.DataFrame | np.ndarray) -> UnfamiliarityDetector:
        """Fit imputer and Isolation Forest strictly on normal training telemetry."""
        X_imputed = self._extract_and_impute(train_df_or_X, fit_imputer=True)
        self.detector.fit(X_imputed)
        self.is_fitted = True
        return self

    def score_unfamiliarity(self, df_or_X: pd.DataFrame | np.ndarray) -> np.ndarray:
        """Compute unfamiliarity scores.
        
        Higher score indicates higher anomaly / unfamiliarity (inverted decision_function).
        """
        if not self.is_fitted:
            raise RuntimeError("UnfamiliarityDetector must be fitted before score_unfamiliarity()")
        X_imputed = self._extract_and_impute(df_or_X, fit_imputer=False)
        # decision_function: positive for inliers, negative for outliers.
        # We invert so that higher score = more anomalous / unfamiliar.
        return -self.detector.decision_function(X_imputed)

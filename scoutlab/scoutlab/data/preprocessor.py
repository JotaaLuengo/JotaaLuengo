import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler


class Preprocessor:
    """Prepare player data for ML models."""

    def __init__(
        self,
        player_col: str = "player",
        scaler: str = "standard",
        min_minutes: int = 0,
        minutes_col: str | None = "minutes_played",
    ):
        self.player_col = player_col
        self.minutes_col = minutes_col
        self.min_minutes = min_minutes
        self._scaler = StandardScaler() if scaler == "standard" else MinMaxScaler()
        self._feature_cols: list[str] = []
        self._fitted = False

    def fit_transform(self, df: pd.DataFrame) -> tuple[pd.DataFrame, np.ndarray]:
        """Filter, scale, and return (processed_df, feature_matrix)."""
        df = self._filter_minutes(df)
        self._feature_cols = df.select_dtypes(include="number").columns.tolist()
        if self.minutes_col and self.minutes_col in self._feature_cols:
            self._feature_cols.remove(self.minutes_col)

        X = self._scaler.fit_transform(df[self._feature_cols])
        self._fitted = True
        return df.reset_index(drop=True), X

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        if not self._fitted:
            raise RuntimeError("Call fit_transform before transform.")
        return self._scaler.transform(df[self._feature_cols])

    def _filter_minutes(self, df: pd.DataFrame) -> pd.DataFrame:
        if self.min_minutes > 0 and self.minutes_col and self.minutes_col in df.columns:
            df = df[df[self.minutes_col] >= self.min_minutes]
        return df.copy()

    @property
    def feature_cols(self) -> list[str]:
        return self._feature_cols

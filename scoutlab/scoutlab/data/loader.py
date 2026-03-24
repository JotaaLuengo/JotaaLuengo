import pandas as pd
from pathlib import Path


class DataLoader:
    """Load player performance data from various sources."""

    def __init__(self, player_col: str = "player"):
        self.player_col = player_col

    def from_csv(self, path: str | Path, **kwargs) -> pd.DataFrame:
        """Load data from a CSV file."""
        df = pd.read_csv(path, **kwargs)
        self._validate(df)
        return df

    def from_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Accept an already-loaded DataFrame."""
        self._validate(df)
        return df.copy()

    def _validate(self, df: pd.DataFrame) -> None:
        if self.player_col not in df.columns:
            raise ValueError(
                f"DataFrame must contain a '{self.player_col}' column. "
                f"Found: {list(df.columns)}"
            )
        numeric_cols = df.select_dtypes(include="number").columns.tolist()
        if len(numeric_cols) == 0:
            raise ValueError("DataFrame must contain at least one numeric metric column.")

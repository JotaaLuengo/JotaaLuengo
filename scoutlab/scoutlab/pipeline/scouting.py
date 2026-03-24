from __future__ import annotations

import joblib
from pathlib import Path

import pandas as pd
import matplotlib.pyplot as plt

from scoutlab.data.loader import DataLoader
from scoutlab.data.preprocessor import Preprocessor
from scoutlab.models.similarity import PlayerSimilarity
from scoutlab.models.clustering import PlayerClustering
from scoutlab.viz.radar import RadarChart
from scoutlab.viz.scatter import ScatterPlot


class ScoutingPipeline:
    """End-to-end pipeline: load → preprocess → similarity → clustering → viz.

    Example
    -------
    >>> pipeline = ScoutingPipeline(data_path="data/midfielders.csv")
    >>> pipeline.fit()
    >>> pipeline.find_similar("Pedri", top_n=5)
    >>> pipeline.radar_chart("Pedri", compare_with=["Gavi", "Frenkie de Jong"])
    >>> pipeline.save("pipeline.joblib")
    """

    def __init__(
        self,
        data_path: str | Path | None = None,
        df: pd.DataFrame | None = None,
        player_col: str = "player",
        metrics: list[str] | None = None,
        scaler: str = "standard",
        similarity_metric: str = "cosine",
        n_clusters: int = 6,
        min_minutes: int = 0,
        archetype_labels: list[str] | None = None,
    ):
        if data_path is None and df is None:
            raise ValueError("Provide either data_path or df.")

        self.data_path = data_path
        self._input_df = df
        self.player_col = player_col
        self.metrics = metrics
        self.n_clusters = n_clusters

        self._loader = DataLoader(player_col=player_col)
        self._preprocessor = Preprocessor(
            player_col=player_col,
            scaler=scaler,
            min_minutes=min_minutes,
        )
        self._similarity = PlayerSimilarity(metric=similarity_metric)
        self._clustering = PlayerClustering(
            n_clusters=n_clusters,
            archetype_labels=archetype_labels,
        )

        self._df: pd.DataFrame | None = None
        self._X = None
        self._fitted = False

    # ------------------------------------------------------------------
    # Fitting
    # ------------------------------------------------------------------

    def fit(self) -> "ScoutingPipeline":
        """Run the full pipeline: load → preprocess → fit models."""
        raw = (
            self._loader.from_csv(self.data_path)
            if self.data_path is not None
            else self._loader.from_dataframe(self._input_df)
        )

        if self.metrics:
            cols = [self.player_col] + [m for m in self.metrics if m in raw.columns]
            raw = raw[cols]

        self._df, self._X = self._preprocessor.fit_transform(raw)
        self._similarity.fit(self._df, self._X, player_col=self.player_col)
        self._clustering.fit(self._df, self._X, player_col=self.player_col)
        self._fitted = True
        return self

    # ------------------------------------------------------------------
    # Similarity
    # ------------------------------------------------------------------

    def find_similar(self, player: str, top_n: int = 10) -> pd.DataFrame:
        """Return the top_n most similar players."""
        self._check_fitted()
        return self._similarity.find_similar(player, top_n=top_n)

    def similarity_score(self, player_a: str, player_b: str) -> float:
        self._check_fitted()
        return self._similarity.similarity_score(player_a, player_b)

    # ------------------------------------------------------------------
    # Clustering
    # ------------------------------------------------------------------

    def get_cluster(self, player: str) -> str | int:
        """Return the archetype cluster for a player."""
        self._check_fitted()
        return self._clustering.get_cluster(player)

    def cluster_summary(self) -> pd.DataFrame:
        self._check_fitted()
        return self._clustering.cluster_summary()

    def get_cluster_players(self, cluster: int | str) -> pd.DataFrame:
        self._check_fitted()
        return self._clustering.get_cluster_players(cluster)

    # ------------------------------------------------------------------
    # Visualizations
    # ------------------------------------------------------------------

    def radar_chart(
        self,
        player: str,
        compare_with: list[str] | None = None,
        metrics: list[str] | None = None,
        title: str | None = None,
        save_path: str | None = None,
    ) -> "ScoutingPipeline":
        """Generate a radar chart comparing players."""
        self._check_fitted()
        players = [player] + (compare_with or [])
        chart = RadarChart(
            metrics=metrics or self._preprocessor.feature_cols,
            player_col=self.player_col,
        )
        chart.plot(self._df, players=players, title=title or f"{player} — Profile Comparison")
        if save_path:
            chart.save(save_path)
        else:
            chart.show()
        return self

    def scatter_plot(
        self,
        x: str,
        y: str,
        highlight: list[str] | None = None,
        color_by_cluster: bool = False,
        title: str | None = None,
        save_path: str | None = None,
    ) -> "ScoutingPipeline":
        """Generate a scatter plot for two metrics."""
        self._check_fitted()
        df = self._df.copy()
        if color_by_cluster:
            df["cluster"] = self._clustering._labels

        sp = ScatterPlot(player_col=self.player_col)
        sp.plot(
            df,
            x=x,
            y=y,
            highlight=highlight,
            color_col="cluster" if color_by_cluster else None,
            title=title or f"{x} vs {y}",
        )
        if save_path:
            sp.save(save_path)
        else:
            sp.show()
        return self

    def pca_scatter(
        self,
        save_path: str | None = None,
    ) -> "ScoutingPipeline":
        """Plot PCA-reduced player positions colored by cluster."""
        self._check_fitted()
        coords = self._clustering.pca_coords()
        sp = ScatterPlot(player_col=self.player_col)
        sp.plot(
            coords,
            x="pc1",
            y="pc2",
            color_col="cluster_name" if "cluster_name" in coords.columns else "cluster_id",
            title="Player Clusters (PCA)",
            xlabel="PC1",
            ylabel="PC2",
        )
        if save_path:
            sp.save(save_path)
        else:
            sp.show()
        return self

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def save(self, path: str | Path) -> None:
        """Serialize the fitted pipeline to disk."""
        joblib.dump(self, path)

    @classmethod
    def load(cls, path: str | Path) -> "ScoutingPipeline":
        """Load a previously saved pipeline."""
        return joblib.load(path)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _check_fitted(self) -> None:
        if not self._fitted:
            raise RuntimeError("Call fit() before using this method.")

    @property
    def players(self) -> list[str]:
        self._check_fitted()
        return self._df[self.player_col].tolist()

    @property
    def data(self) -> pd.DataFrame:
        self._check_fitted()
        return self._df.copy()

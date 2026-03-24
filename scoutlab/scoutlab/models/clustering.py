import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, DBSCAN
from sklearn.decomposition import PCA


# Default archetype labels for common n_clusters values
_ARCHETYPE_LABELS = {
    4: ["Ball-Winner", "Playmaker", "Box-to-Box", "Wide Threat"],
    5: ["Ball-Winner", "Deep Playmaker", "Box-to-Box", "Advanced Playmaker", "Wide Threat"],
    6: ["Ball-Winner", "Deep Playmaker", "Box-to-Box", "Advanced Playmaker", "Wide Threat", "Poacher"],
    8: [
        "Ball-Winner", "Deep Playmaker", "Box-to-Box", "Advanced Playmaker",
        "Wide Threat", "Poacher", "Inverted Winger", "Fullback",
    ],
}


class PlayerClustering:
    """Cluster players into talent archetypes.

    Example
    -------
    >>> clust = PlayerClustering(n_clusters=6)
    >>> clust.fit(players_df, feature_matrix)
    >>> clust.get_cluster("Pedri")
    'Advanced Playmaker'
    >>> clust.cluster_summary()
    """

    def __init__(
        self,
        algorithm: str = "kmeans",
        n_clusters: int = 6,
        random_state: int = 42,
        archetype_labels: list[str] | None = None,
    ):
        if algorithm not in ("kmeans", "dbscan"):
            raise ValueError("algorithm must be 'kmeans' or 'dbscan'")
        self.algorithm = algorithm
        self.n_clusters = n_clusters
        self.random_state = random_state
        self._archetype_labels = archetype_labels or _ARCHETYPE_LABELS.get(n_clusters)
        self._players: pd.Series | None = None
        self._df: pd.DataFrame | None = None
        self._labels: np.ndarray | None = None
        self._X: np.ndarray | None = None

    def fit(self, df: pd.DataFrame, X: np.ndarray, player_col: str = "player") -> "PlayerClustering":
        """Fit clustering on the feature matrix."""
        self._players = df[player_col].reset_index(drop=True)
        self._df = df.reset_index(drop=True)
        self._X = X

        if self.algorithm == "kmeans":
            model = KMeans(n_clusters=self.n_clusters, random_state=self.random_state, n_init="auto")
        else:
            model = DBSCAN(eps=0.5, min_samples=3)

        self._labels = model.fit_predict(X)
        return self

    def get_cluster(self, player: str) -> str | int:
        """Return the cluster label for a player."""
        self._check_fitted()
        idx = self._get_index(player)
        label = int(self._labels[idx])
        if self._archetype_labels and label >= 0:
            return self._archetype_labels[label % len(self._archetype_labels)]
        return label

    def cluster_summary(self) -> pd.DataFrame:
        """Return a summary DataFrame with player counts per cluster."""
        self._check_fitted()
        summary = pd.DataFrame({
            "player": self._players,
            "cluster_id": self._labels,
        })
        summary["cluster_name"] = summary["cluster_id"].apply(
            lambda x: (
                self._archetype_labels[x % len(self._archetype_labels)]
                if self._archetype_labels and x >= 0
                else x
            )
        )
        return (
            summary.groupby(["cluster_id", "cluster_name"])
            .size()
            .reset_index(name="count")
            .sort_values("cluster_id")
        )

    def get_cluster_players(self, cluster: int | str) -> pd.DataFrame:
        """Return all players in a given cluster."""
        self._check_fitted()
        if isinstance(cluster, str):
            cluster_ids = [
                i for i, name in enumerate(self._archetype_labels or [])
                if name == cluster
            ]
            if not cluster_ids:
                raise KeyError(f"Cluster '{cluster}' not found.")
            mask = np.isin(self._labels, cluster_ids)
        else:
            mask = self._labels == cluster

        return self._df[mask].copy()

    def pca_coords(self, n_components: int = 2) -> pd.DataFrame:
        """Return PCA-reduced coordinates with cluster labels for plotting."""
        self._check_fitted()
        pca = PCA(n_components=n_components, random_state=self.random_state)
        coords = pca.fit_transform(self._X)
        result = pd.DataFrame(coords, columns=[f"pc{i+1}" for i in range(n_components)])
        result["player"] = self._players
        result["cluster_id"] = self._labels
        if self._archetype_labels:
            result["cluster_name"] = result["cluster_id"].apply(
                lambda x: self._archetype_labels[x % len(self._archetype_labels)] if x >= 0 else "Noise"
            )
        return result

    def _get_index(self, player: str) -> int:
        matches = self._players[self._players == player].index.tolist()
        if not matches:
            raise KeyError(f"Player '{player}' not found in the dataset.")
        return matches[0]

    def _check_fitted(self) -> None:
        if self._labels is None:
            raise RuntimeError("Call fit() before using this method.")

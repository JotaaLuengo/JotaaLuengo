import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.neighbors import NearestNeighbors


class PlayerSimilarity:
    """Find the most similar players based on scaled performance metrics.

    Uses cosine similarity by default. Supports KNN as an alternative.

    Example
    -------
    >>> sim = PlayerSimilarity()
    >>> sim.fit(players_df, feature_matrix)
    >>> sim.find_similar("Pedri", top_n=5)
    """

    def __init__(self, metric: str = "cosine"):
        if metric not in ("cosine", "euclidean"):
            raise ValueError("metric must be 'cosine' or 'euclidean'")
        self.metric = metric
        self._players: pd.Series | None = None
        self._X: np.ndarray | None = None
        self._sim_matrix: np.ndarray | None = None

    def fit(self, df: pd.DataFrame, X: np.ndarray, player_col: str = "player") -> "PlayerSimilarity":
        """Fit on a player DataFrame and its feature matrix."""
        self._players = df[player_col].reset_index(drop=True)
        self._X = X

        if self.metric == "cosine":
            self._sim_matrix = cosine_similarity(X)
        else:
            # Euclidean: convert distances to similarities
            from sklearn.metrics.pairwise import euclidean_distances
            dist = euclidean_distances(X)
            self._sim_matrix = 1 / (1 + dist)

        return self

    def find_similar(
        self,
        player: str,
        top_n: int = 10,
        exclude_self: bool = True,
    ) -> pd.DataFrame:
        """Return a DataFrame of the top_n most similar players.

        Parameters
        ----------
        player:
            Name of the target player.
        top_n:
            Number of similar players to return.
        exclude_self:
            Whether to exclude the target player from the results.

        Returns
        -------
        pd.DataFrame with columns ['player', 'similarity'].
        """
        self._check_fitted()
        idx = self._get_index(player)

        scores = self._sim_matrix[idx]
        order = np.argsort(scores)[::-1]

        results = []
        for i in order:
            name = self._players.iloc[i]
            if exclude_self and name == player:
                continue
            results.append({"player": name, "similarity": round(float(scores[i]), 4)})
            if len(results) >= top_n:
                break

        return pd.DataFrame(results)

    def similarity_score(self, player_a: str, player_b: str) -> float:
        """Return the similarity score between two players."""
        self._check_fitted()
        idx_a = self._get_index(player_a)
        idx_b = self._get_index(player_b)
        return round(float(self._sim_matrix[idx_a, idx_b]), 4)

    def _get_index(self, player: str) -> int:
        matches = self._players[self._players == player].index.tolist()
        if not matches:
            raise KeyError(f"Player '{player}' not found in the dataset.")
        return matches[0]

    def _check_fitted(self) -> None:
        if self._players is None:
            raise RuntimeError("Call fit() before using this method.")

import numpy as np
import pandas as pd
import pytest

from scoutlab.data.preprocessor import Preprocessor
from scoutlab.models.similarity import PlayerSimilarity
from scoutlab.models.clustering import PlayerClustering


@pytest.fixture
def sample_df():
    return pd.DataFrame({
        "player": ["Pedri", "Gavi", "Frenkie", "Bellingham", "Modric"],
        "goals": [4, 6, 3, 12, 5],
        "assists": [8, 10, 7, 9, 8],
        "progressive_passes": [120, 110, 130, 90, 125],
        "dribbles": [45, 60, 35, 55, 40],
        "tackles": [30, 40, 25, 50, 35],
    })


@pytest.fixture
def fitted_data(sample_df):
    prep = Preprocessor(player_col="player")
    df, X = prep.fit_transform(sample_df)
    return df, X


class TestPlayerSimilarity:
    def test_fit_and_find_similar(self, fitted_data):
        df, X = fitted_data
        sim = PlayerSimilarity(metric="cosine")
        sim.fit(df, X, player_col="player")

        result = sim.find_similar("Pedri", top_n=3)
        assert isinstance(result, pd.DataFrame)
        assert "player" in result.columns
        assert "similarity" in result.columns
        assert len(result) == 3
        assert "Pedri" not in result["player"].values

    def test_similarity_score_range(self, fitted_data):
        df, X = fitted_data
        sim = PlayerSimilarity(metric="cosine")
        sim.fit(df, X, player_col="player")

        score = sim.similarity_score("Pedri", "Gavi")
        assert 0.0 <= score <= 1.0

    def test_unknown_player_raises(self, fitted_data):
        df, X = fitted_data
        sim = PlayerSimilarity()
        sim.fit(df, X, player_col="player")
        with pytest.raises(KeyError):
            sim.find_similar("Mbappe")

    def test_euclidean_metric(self, fitted_data):
        df, X = fitted_data
        sim = PlayerSimilarity(metric="euclidean")
        sim.fit(df, X, player_col="player")
        result = sim.find_similar("Pedri", top_n=2)
        assert len(result) == 2

    def test_not_fitted_raises(self):
        sim = PlayerSimilarity()
        with pytest.raises(RuntimeError):
            sim.find_similar("Pedri")


class TestPlayerClustering:
    def test_fit_and_get_cluster(self, fitted_data):
        df, X = fitted_data
        clust = PlayerClustering(n_clusters=2)
        clust.fit(df, X, player_col="player")

        cluster = clust.get_cluster("Pedri")
        assert cluster is not None

    def test_cluster_summary_shape(self, fitted_data):
        df, X = fitted_data
        clust = PlayerClustering(n_clusters=2)
        clust.fit(df, X, player_col="player")

        summary = clust.cluster_summary()
        assert "cluster_id" in summary.columns
        assert "count" in summary.columns
        assert summary["count"].sum() == len(df)

    def test_pca_coords(self, fitted_data):
        df, X = fitted_data
        clust = PlayerClustering(n_clusters=2)
        clust.fit(df, X, player_col="player")

        coords = clust.pca_coords()
        assert "pc1" in coords.columns
        assert "pc2" in coords.columns
        assert len(coords) == len(df)

    def test_not_fitted_raises(self):
        clust = PlayerClustering()
        with pytest.raises(RuntimeError):
            clust.get_cluster("Pedri")

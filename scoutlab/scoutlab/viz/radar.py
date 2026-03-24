import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.path import Path
from sklearn.preprocessing import MinMaxScaler


class RadarChart:
    """Generate radar (spider) charts to compare player profiles.

    Example
    -------
    >>> chart = RadarChart(metrics=["goals", "assists", "dribbles", "tackles"])
    >>> chart.plot(df, players=["Pedri", "Gavi"], title="Midfield Comparison")
    >>> chart.save("pedri_vs_gavi.png")
    """

    _DEFAULT_COLORS = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"]

    def __init__(
        self,
        metrics: list[str] | None = None,
        player_col: str = "player",
        normalize: bool = True,
    ):
        self.metrics = metrics
        self.player_col = player_col
        self.normalize = normalize
        self._fig: plt.Figure | None = None
        self._ax: plt.Axes | None = None

    def plot(
        self,
        df: pd.DataFrame,
        players: list[str],
        title: str = "",
        colors: list[str] | None = None,
        figsize: tuple[float, float] = (8, 8),
        alpha: float = 0.25,
    ) -> "RadarChart":
        """Draw radar chart for the given players.

        Parameters
        ----------
        df:
            Player DataFrame.
        players:
            List of player names to compare (max 5 for readability).
        title:
            Chart title.
        colors:
            One color per player. Defaults to matplotlib tab10.
        figsize:
            Figure size.
        alpha:
            Fill transparency.
        """
        metrics = self.metrics or df.select_dtypes(include="number").columns.tolist()
        colors = colors or self._DEFAULT_COLORS[: len(players)]

        data = self._prepare_data(df, players, metrics)

        N = len(metrics)
        angles = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist()
        angles += angles[:1]  # close the loop

        self._fig, self._ax = plt.subplots(figsize=figsize, subplot_kw={"polar": True})
        self._ax.set_facecolor("#0e1117")
        self._fig.patch.set_facecolor("#0e1117")

        # Draw grid lines
        self._ax.set_xticks(angles[:-1])
        self._ax.set_xticklabels(metrics, color="white", size=10)
        self._ax.tick_params(axis="y", colors="gray")
        self._ax.yaxis.grid(color="#444444", linestyle="--", linewidth=0.5)
        self._ax.xaxis.grid(color="#444444", linestyle="--", linewidth=0.5)
        self._ax.set_ylim(0, 1)

        legend_patches = []
        for player, color, values in zip(players, colors, data):
            vals = values + values[:1]
            self._ax.plot(angles, vals, color=color, linewidth=2)
            self._ax.fill(angles, vals, color=color, alpha=alpha)
            legend_patches.append(mpatches.Patch(color=color, label=player))

        if title:
            self._ax.set_title(title, color="white", pad=20, fontsize=14, fontweight="bold")

        self._ax.legend(
            handles=legend_patches,
            loc="upper right",
            bbox_to_anchor=(1.3, 1.1),
            frameon=False,
            labelcolor="white",
        )

        plt.tight_layout()
        return self

    def save(self, path: str, dpi: int = 150) -> None:
        if self._fig is None:
            raise RuntimeError("Call plot() before save().")
        self._fig.savefig(path, dpi=dpi, bbox_inches="tight")

    def show(self) -> None:
        if self._fig is None:
            raise RuntimeError("Call plot() before show().")
        plt.show()

    def _prepare_data(
        self, df: pd.DataFrame, players: list[str], metrics: list[str]
    ) -> list[list[float]]:
        subset = df[df[self.player_col].isin(players)].set_index(self.player_col)
        if self.normalize:
            scaler = MinMaxScaler()
            all_vals = scaler.fit_transform(df[metrics])
            normed_df = pd.DataFrame(all_vals, columns=metrics, index=df[self.player_col].values)
            subset = normed_df.loc[players]
        return [subset.loc[p, metrics].tolist() for p in players]

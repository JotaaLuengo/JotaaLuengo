import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patheffects as pe
import numpy as np


class ScatterPlot:
    """Generate scatter plots for player metric comparisons.

    Example
    -------
    >>> sp = ScatterPlot()
    >>> sp.plot(df, x="xG", y="goals", label_col="player",
    ...         highlight=["Benzema", "Kane"], title="Goals vs xG")
    >>> sp.save("goals_vs_xg.png")
    """

    def __init__(self, player_col: str = "player"):
        self.player_col = player_col
        self._fig: plt.Figure | None = None
        self._ax: plt.Axes | None = None

    def plot(
        self,
        df: pd.DataFrame,
        x: str,
        y: str,
        label_col: str | None = None,
        highlight: list[str] | None = None,
        color_col: str | None = None,
        title: str = "",
        xlabel: str | None = None,
        ylabel: str | None = None,
        figsize: tuple[float, float] = (12, 8),
        annotate_top_n: int = 0,
    ) -> "ScatterPlot":
        """Draw a scatter plot.

        Parameters
        ----------
        df: Player DataFrame.
        x, y: Column names for the axes.
        label_col: Column to use for point annotations.
        highlight: Players to highlight in orange.
        color_col: Categorical column used to color points by group.
        title: Chart title.
        annotate_top_n: Auto-annotate the top N players by (x+y).
        """
        self._fig, self._ax = plt.subplots(figsize=figsize)
        self._ax.set_facecolor("#0e1117")
        self._fig.patch.set_facecolor("#0e1117")

        highlight = set(highlight or [])
        label_col = label_col or self.player_col

        if color_col and color_col in df.columns:
            groups = df[color_col].unique()
            cmap = plt.cm.get_cmap("tab10", len(groups))
            for i, group in enumerate(groups):
                mask = df[color_col] == group
                self._ax.scatter(
                    df.loc[mask, x], df.loc[mask, y],
                    color=cmap(i), alpha=0.7, s=60, label=str(group), zorder=3,
                )
            self._ax.legend(frameon=False, labelcolor="white", loc="best")
        else:
            colors = [
                "#ff7f0e" if df.iloc[i][self.player_col] in highlight else "#1f77b4"
                for i in range(len(df))
            ]
            self._ax.scatter(df[x], df[y], c=colors, alpha=0.7, s=60, zorder=3)

        # Annotation
        to_label = set(highlight)
        if annotate_top_n > 0:
            top_idx = (df[x] + df[y]).nlargest(annotate_top_n).index
            to_label.update(df.loc[top_idx, self.player_col].tolist())

        for _, row in df.iterrows():
            if row[self.player_col] in to_label:
                self._ax.annotate(
                    row[label_col],
                    (row[x], row[y]),
                    fontsize=8,
                    color="white",
                    xytext=(5, 5),
                    textcoords="offset points",
                    path_effects=[pe.withStroke(linewidth=2, foreground="#0e1117")],
                )

        # Mean lines
        self._ax.axvline(df[x].mean(), color="#555555", linestyle="--", linewidth=1)
        self._ax.axhline(df[y].mean(), color="#555555", linestyle="--", linewidth=1)

        self._ax.set_xlabel(xlabel or x, color="white")
        self._ax.set_ylabel(ylabel or y, color="white")
        self._ax.tick_params(colors="white")
        for spine in self._ax.spines.values():
            spine.set_edgecolor("#444444")

        if title:
            self._ax.set_title(title, color="white", fontsize=14, fontweight="bold")

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

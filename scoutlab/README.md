# ScoutLab

A Python toolkit for football player scouting using Machine Learning — built for data-driven analysts who want to identify similar players, cluster talent profiles, and visualize performance metrics.

## Features

- **Player Similarity** — find the most similar players based on performance metrics using cosine similarity and KNN
- **Player Clustering** — group players into talent archetypes using K-Means and DBSCAN
- **Radar Charts** — generate comparison radar charts for any set of metrics
- **Scatter Plots** — plot players on customizable 2D metric scatter plots
- **Scouting Pipeline** — end-to-end pipeline from raw data to scouting report

## Installation

```bash
pip install -r requirements.txt
pip install -e .
```

## Quick Start

```python
from scoutlab.pipeline.scouting import ScoutingPipeline

pipeline = ScoutingPipeline(data_path="data/players.csv")
pipeline.fit()

# Find the 5 most similar players to a target
similar = pipeline.find_similar("Pedri", top_n=5)
print(similar)

# Get player cluster
cluster = pipeline.get_cluster("Pedri")
print(f"Pedri plays in the '{cluster}' archetype")

# Generate radar chart
pipeline.radar_chart("Pedri", compare_with=["Frenkie de Jong", "Gavi"])
```

## Project Structure

```
scoutlab/
├── scoutlab/
│   ├── data/          # Data loading and preprocessing
│   ├── models/        # ML models (similarity, clustering)
│   ├── viz/           # Visualizations (radar, scatter)
│   └── pipeline/      # End-to-end scouting pipeline
├── notebooks/         # Demo notebooks
└── tests/             # Unit tests
```

## Data Format

ScoutLab expects a CSV with at least a `player` column and numeric performance metrics:

| player | goals | assists | progressive_passes | dribbles | ... |
|--------|-------|---------|-------------------|----------|-----|
| Pedri  | 4     | 8       | 120               | 45       | ... |

Compatible with **StatsBomb**, **FBref**, **Wyscout**, and **InStat** exports.

## Metrics Categories

- **Attacking**: goals, xG, shots, key_passes, assists, xA
- **Possession**: progressive_passes, carries, dribbles, passes_completed_pct
- **Defensive**: tackles, interceptions, pressures, duels_won_pct
- **Physical**: distance_covered, sprint_distance, aerial_duels_won_pct

## License

MIT

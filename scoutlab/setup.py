from setuptools import setup, find_packages

setup(
    name="scoutlab",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "pandas>=2.0.0",
        "numpy>=1.24.0",
        "scikit-learn>=1.3.0",
        "matplotlib>=3.7.0",
        "seaborn>=0.12.0",
        "mplsoccer>=1.2.0",
        "scipy>=1.11.0",
        "joblib>=1.3.0",
    ],
    python_requires=">=3.9",
    author="JotaaLuengo",
    description="Football player scouting toolkit using Machine Learning",
)

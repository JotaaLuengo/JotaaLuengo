import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # API
    PRIVATE_KEY: str = os.getenv("PRIVATE_KEY", "")
    HOST: str = os.getenv("POLYMARKET_HOST", "https://clob.polymarket.com")
    CHAIN_ID: int = int(os.getenv("CHAIN_ID", "137"))
    FUNDER_ADDRESS: str = os.getenv("FUNDER_ADDRESS", "")

    # Risk management
    MAX_POSITION_USDC: float = float(os.getenv("MAX_POSITION_USDC", "50"))
    MAX_OPEN_POSITIONS: int = int(os.getenv("MAX_OPEN_POSITIONS", "5"))
    MIN_LIQUIDITY_USDC: float = float(os.getenv("MIN_LIQUIDITY_USDC", "500"))
    MIN_EDGE: float = float(os.getenv("MIN_EDGE", "0.02"))
    KELLY_FRACTION: float = float(os.getenv("KELLY_FRACTION", "0.25"))

    # Strategy
    STRATEGY: str = os.getenv("STRATEGY", "value")
    SCAN_INTERVAL_SECONDS: int = int(os.getenv("SCAN_INTERVAL_SECONDS", "60"))

    # Mode
    DRY_RUN: bool = os.getenv("DRY_RUN", "true").lower() == "true"

    def validate(self) -> None:
        if not self.PRIVATE_KEY:
            raise ValueError("PRIVATE_KEY is required in .env")
        if not self.PRIVATE_KEY.startswith("0x"):
            raise ValueError("PRIVATE_KEY must start with '0x'")
        if self.MAX_POSITION_USDC <= 0:
            raise ValueError("MAX_POSITION_USDC must be positive")
        if not 0 < self.KELLY_FRACTION <= 1:
            raise ValueError("KELLY_FRACTION must be between 0 and 1")


config = Config()

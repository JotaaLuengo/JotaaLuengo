"""
Polymarket Trading Bot — main entry point.

Usage:
    python bot.py

Configure via .env (copy .env.example → .env and fill in your values).
"""

import sys
import time
import signal
from datetime import datetime

from loguru import logger

from config import config
from client import PolymarketClient
from markets import scan_markets, market_summary
from strategy import get_strategy, TradeSignal
from py_clob_client.constants import BUY, SELL


# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------

logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | {message}",
    level="INFO",
)
logger.add(
    "logs/bot_{time:YYYY-MM-DD}.log",
    rotation="00:00",
    retention="7 days",
    level="DEBUG",
)


# ---------------------------------------------------------------------------
# Bot
# ---------------------------------------------------------------------------

class PolymarketBot:
    def __init__(self) -> None:
        self.client = PolymarketClient()
        self.strategy = get_strategy(config.STRATEGY)
        self._running = False
        self._open_order_ids: set[str] = set()

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def start(self) -> None:
        logger.info("=" * 60)
        logger.info("  Polymarket Trading Bot starting up")
        logger.info(f"  Strategy  : {config.STRATEGY}")
        logger.info(f"  Dry run   : {config.DRY_RUN}")
        logger.info(f"  Max pos   : ${config.MAX_POSITION_USDC}")
        logger.info(f"  Max open  : {config.MAX_OPEN_POSITIONS}")
        logger.info(f"  Min edge  : {config.MIN_EDGE:.1%}")
        logger.info("=" * 60)

        config.validate()

        # Authenticate
        self.client.authenticate()

        # Register signal handlers for clean shutdown
        signal.signal(signal.SIGINT, self._handle_signal)
        signal.signal(signal.SIGTERM, self._handle_signal)

        self._running = True
        self._loop()

    def _handle_signal(self, signum, frame) -> None:
        logger.info("Shutdown signal received — stopping bot…")
        self._running = False

    # ------------------------------------------------------------------
    # Main loop
    # ------------------------------------------------------------------

    def _loop(self) -> None:
        while self._running:
            try:
                self._tick()
            except Exception as exc:
                logger.exception(f"Unexpected error in tick: {exc}")

            if not self._running:
                break

            logger.info(f"Sleeping {config.SCAN_INTERVAL_SECONDS}s until next scan…")
            time.sleep(config.SCAN_INTERVAL_SECONDS)

        logger.info("Bot stopped.")

    def _tick(self) -> None:
        logger.info(f"--- Tick at {datetime.utcnow().isoformat()} UTC ---")

        # 1. Account state
        balance = self.client.get_balance()
        positions = self.client.get_positions()
        logger.info(f"Balance: ${balance:.2f} USDC | Open positions: {len(positions)}")

        if balance < 1.0:
            logger.warning("Balance too low to trade. Skipping tick.")
            return

        # 2. Respect max open positions
        if len(positions) >= config.MAX_OPEN_POSITIONS:
            logger.info("Max open positions reached. Skipping new entries.")
            self._manage_existing_positions(positions)
            return

        # 3. Scan markets
        markets = scan_markets(self.client)
        if not markets:
            logger.info("No liquid markets found.")
            return

        # 4. Generate signals
        signals = self.strategy.generate_signals(markets, positions, balance)
        logger.info(f"Strategy generated {len(signals)} signal(s)")

        # 5. Execute top signals (up to remaining slots)
        slots = config.MAX_OPEN_POSITIONS - len(positions)
        executed = 0
        for signal in signals[:slots]:
            if self._execute(signal):
                executed += 1
                balance -= signal.size_usdc  # optimistic balance deduction

        if executed:
            logger.info(f"Executed {executed} new order(s) this tick")

        # 6. Manage existing positions
        self._manage_existing_positions(positions)

    # ------------------------------------------------------------------
    # Execution
    # ------------------------------------------------------------------

    def _execute(self, signal: TradeSignal) -> bool:
        logger.info(
            f"Signal: {signal.reason}\n"
            f"  Market : {signal.market.question[:80]}\n"
            f"  Token  : {signal.token.outcome} ({signal.token.token_id[:10]}…)\n"
            f"  Side   : {signal.side}  price={signal.price:.4f}  size=${signal.size_usdc:.2f}\n"
            f"  Edge   : {signal.edge:.3f}"
        )

        result = self.client.place_limit_order(
            token_id=signal.token.token_id,
            side=signal.side,
            price=round(signal.price, 4),
            size=round(signal.size_usdc, 2),
        )

        if result is None:
            return False

        order_id = result.get("orderID", "")
        if order_id:
            self._open_order_ids.add(order_id)
        return True

    # ------------------------------------------------------------------
    # Position management
    # ------------------------------------------------------------------

    def _manage_existing_positions(self, positions: list[dict]) -> None:
        """
        Placeholder for exit logic:
        - Take profit when price moves sufficiently in our favour
        - Stop loss if position is deeply underwater
        """
        for pos in positions:
            asset = pos.get("asset", "")
            size = float(pos.get("size", 0))
            avg_price = float(pos.get("avg_price", 0))
            current_price = float(pos.get("cur_price", avg_price))

            pnl_pct = (current_price - avg_price) / avg_price if avg_price else 0

            if pnl_pct >= 0.20:
                logger.info(
                    f"Take-profit triggered for {asset}: "
                    f"+{pnl_pct:.1%}  → (would sell {size} shares)"
                )
                # self.client.place_limit_order(asset, SELL, current_price * 0.99, size)

            elif pnl_pct <= -0.30:
                logger.warning(
                    f"Stop-loss triggered for {asset}: "
                    f"{pnl_pct:.1%}  → (would sell {size} shares)"
                )
                # self.client.place_limit_order(asset, SELL, current_price * 0.99, size)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import os
    os.makedirs("logs", exist_ok=True)

    bot = PolymarketBot()
    bot.start()

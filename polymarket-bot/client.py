"""
Polymarket CLOB client wrapper.
Handles authentication, order placement, and market data fetching.
"""

from typing import Optional
from loguru import logger

from py_clob_client.client import ClobClient
from py_clob_client.clob_types import (
    ApiCreds,
    OrderArgs,
    OrderType,
    BookParams,
    MarketOrderArgs,
)
from py_clob_client.constants import SELL, BUY

from config import config


class PolymarketClient:
    def __init__(self) -> None:
        self._clob = ClobClient(
            host=config.HOST,
            key=config.PRIVATE_KEY,
            chain_id=config.CHAIN_ID,
            funder=config.FUNDER_ADDRESS or None,
        )
        self._creds: Optional[ApiCreds] = None

    # ------------------------------------------------------------------
    # Authentication
    # ------------------------------------------------------------------

    def authenticate(self) -> None:
        """Create or derive API credentials and set them on the client."""
        self._creds = self._clob.create_or_derive_api_creds()
        self._clob.set_api_creds(self._creds)
        logger.info("Authenticated with Polymarket CLOB API")

    # ------------------------------------------------------------------
    # Account
    # ------------------------------------------------------------------

    def get_balance(self) -> float:
        """Return USDC balance available for trading."""
        try:
            balance_info = self._clob.get_balance()
            return float(balance_info.get("balance", 0))
        except Exception as exc:
            logger.error(f"Failed to fetch balance: {exc}")
            return 0.0

    def get_positions(self) -> list[dict]:
        """Return all open positions."""
        try:
            return self._clob.get_positions() or []
        except Exception as exc:
            logger.error(f"Failed to fetch positions: {exc}")
            return []

    def get_orders(self) -> list[dict]:
        """Return all open orders."""
        try:
            return self._clob.get_orders() or []
        except Exception as exc:
            logger.error(f"Failed to fetch orders: {exc}")
            return []

    # ------------------------------------------------------------------
    # Market data
    # ------------------------------------------------------------------

    def get_markets(self, next_cursor: str = "") -> dict:
        """Return a page of active markets."""
        try:
            return self._clob.get_markets(next_cursor=next_cursor)
        except Exception as exc:
            logger.error(f"Failed to fetch markets: {exc}")
            return {"data": [], "next_cursor": "LTE="}

    def get_all_markets(self) -> list[dict]:
        """Paginate through all active markets and return them."""
        markets: list[dict] = []
        cursor = ""
        while True:
            page = self.get_markets(next_cursor=cursor)
            data = page.get("data", [])
            markets.extend(data)
            cursor = page.get("next_cursor", "LTE=")
            if cursor == "LTE=" or not data:
                break
        logger.info(f"Fetched {len(markets)} total markets")
        return markets

    def get_orderbook(self, token_id: str) -> dict:
        """Return the current orderbook for a token."""
        try:
            book = self._clob.get_order_book(token_id)
            return book
        except Exception as exc:
            logger.error(f"Failed to fetch orderbook for {token_id}: {exc}")
            return {"bids": [], "asks": []}

    def get_last_trade_price(self, token_id: str) -> Optional[float]:
        """Return the last traded price for a token (0–1 scale)."""
        try:
            trades = self._clob.get_trades(
                params=BookParams(token_id=token_id),
            )
            if trades:
                return float(trades[0].get("price", 0))
            return None
        except Exception as exc:
            logger.error(f"Failed to fetch last price for {token_id}: {exc}")
            return None

    def get_market(self, condition_id: str) -> Optional[dict]:
        """Return a single market by its condition ID."""
        try:
            return self._clob.get_market(condition_id)
        except Exception as exc:
            logger.error(f"Failed to fetch market {condition_id}: {exc}")
            return None

    # ------------------------------------------------------------------
    # Order management
    # ------------------------------------------------------------------

    def place_limit_order(
        self,
        token_id: str,
        side: str,
        price: float,
        size: float,
    ) -> Optional[dict]:
        """
        Place a GTC limit order.

        Args:
            token_id: The outcome token ID.
            side: BUY or SELL.
            price: Price between 0 and 1.
            size: Size in USDC (for buys) or shares (for sells).
        """
        if config.DRY_RUN:
            logger.info(
                f"[DRY RUN] {side} {size:.2f} @ {price:.4f} for token {token_id}"
            )
            return {"dry_run": True, "side": side, "price": price, "size": size}

        try:
            order_args = OrderArgs(
                token_id=token_id,
                price=price,
                size=size,
                side=side,
            )
            signed = self._clob.create_order(order_args)
            result = self._clob.post_order(signed, OrderType.GTC)
            logger.info(
                f"Order placed: {side} {size:.2f} @ {price:.4f} | "
                f"order_id={result.get('orderID', 'unknown')}"
            )
            return result
        except Exception as exc:
            logger.error(f"Failed to place order: {exc}")
            return None

    def cancel_order(self, order_id: str) -> bool:
        """Cancel an open order by ID."""
        if config.DRY_RUN:
            logger.info(f"[DRY RUN] Cancel order {order_id}")
            return True
        try:
            self._clob.cancel(order_id)
            logger.info(f"Order {order_id} cancelled")
            return True
        except Exception as exc:
            logger.error(f"Failed to cancel order {order_id}: {exc}")
            return False

    def cancel_all_orders(self) -> None:
        """Cancel every open order."""
        orders = self.get_orders()
        for order in orders:
            self.cancel_order(order.get("id", ""))

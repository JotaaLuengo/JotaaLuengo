"""
Market scanning and filtering utilities.
Finds tradeable markets and computes basic market metrics.
"""

from dataclasses import dataclass, field
from typing import Optional
from loguru import logger

from client import PolymarketClient
from config import config


@dataclass
class TokenInfo:
    token_id: str
    outcome: str
    price: float               # mid price (0–1)
    best_bid: float
    best_ask: float
    spread: float
    bid_depth: float           # USDC liquidity on bid side
    ask_depth: float           # USDC liquidity on ask side


@dataclass
class MarketInfo:
    condition_id: str
    question: str
    category: str
    end_date: str
    tokens: list[TokenInfo] = field(default_factory=list)
    total_liquidity: float = 0.0


def _best_bid_ask(orderbook: dict) -> tuple[float, float, float, float]:
    """Return (best_bid, best_ask, bid_depth_usdc, ask_depth_usdc)."""
    bids = sorted(
        [(float(b["price"]), float(b["size"])) for b in orderbook.get("bids", [])],
        reverse=True,
    )
    asks = sorted(
        [(float(a["price"]), float(a["size"])) for a in orderbook.get("asks", [])],
    )

    best_bid = bids[0][0] if bids else 0.0
    best_ask = asks[0][0] if asks else 1.0

    # Depth = sum of size * price for top 5 levels
    bid_depth = sum(p * s for p, s in bids[:5])
    ask_depth = sum(p * s for p, s in asks[:5])

    return best_bid, best_ask, bid_depth, ask_depth


def scan_markets(client: PolymarketClient) -> list[MarketInfo]:
    """
    Fetch all active markets, filter by liquidity, and build MarketInfo objects.
    Only includes binary markets (exactly 2 outcomes) that are still open.
    """
    raw_markets = client.get_all_markets()
    tradeable: list[MarketInfo] = []

    for raw in raw_markets:
        # Must be active and accepting orders
        if not raw.get("active") or not raw.get("accepting_orders"):
            continue

        tokens_raw = raw.get("tokens", [])
        if len(tokens_raw) != 2:  # binary markets only
            continue

        market = MarketInfo(
            condition_id=raw.get("condition_id", ""),
            question=raw.get("question", ""),
            category=raw.get("market_slug", ""),
            end_date=raw.get("end_date_iso", ""),
        )

        total_liquidity = 0.0

        for token in tokens_raw:
            token_id = token.get("token_id", "")
            outcome = token.get("outcome", "")

            orderbook = client.get_orderbook(token_id)
            best_bid, best_ask, bid_depth, ask_depth = _best_bid_ask(orderbook)

            spread = best_ask - best_bid
            mid = (best_bid + best_ask) / 2 if (best_bid and best_ask) else best_bid or best_ask
            liquidity = bid_depth + ask_depth
            total_liquidity += liquidity

            market.tokens.append(
                TokenInfo(
                    token_id=token_id,
                    outcome=outcome,
                    price=mid,
                    best_bid=best_bid,
                    best_ask=best_ask,
                    spread=spread,
                    bid_depth=bid_depth,
                    ask_depth=ask_depth,
                )
            )

        market.total_liquidity = total_liquidity

        if total_liquidity >= config.MIN_LIQUIDITY_USDC:
            tradeable.append(market)

    logger.info(
        f"Found {len(tradeable)} liquid markets out of {len(raw_markets)} total"
    )
    return tradeable


def get_implied_probabilities(market: MarketInfo) -> dict[str, float]:
    """
    Return the implied probability for each outcome, normalised to sum to 1.
    Uses mid prices from the orderbook.
    """
    raw_probs = {t.outcome: t.price for t in market.tokens}
    total = sum(raw_probs.values())
    if total == 0:
        return raw_probs
    return {k: v / total for k, v in raw_probs.items()}


def market_summary(market: MarketInfo) -> str:
    lines = [
        f"  Question : {market.question}",
        f"  Liquidity: ${market.total_liquidity:.0f}",
    ]
    for t in market.tokens:
        lines.append(
            f"  [{t.outcome:>5}] bid={t.best_bid:.3f}  ask={t.best_ask:.3f}  "
            f"spread={t.spread:.3f}  depth=${t.bid_depth + t.ask_depth:.0f}"
        )
    return "\n".join(lines)

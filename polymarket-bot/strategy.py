"""
Trading strategies for the Polymarket bot.

Available strategies:
  - ValueStrategy  : Bets when market price deviates from "fair" price by more
                     than MIN_EDGE. Fair price is estimated as the simple mid of
                     the two implied probabilities after normalisation.
  - MomentumStrategy: Follows recent price direction; buys tokens that have
                      recently moved up if the spread is still reasonable.

Position sizing uses a fractional Kelly criterion.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional
from loguru import logger

from markets import MarketInfo, TokenInfo, get_implied_probabilities
from config import config


@dataclass
class TradeSignal:
    market: MarketInfo
    token: TokenInfo
    side: str          # "BUY" or "SELL"
    price: float       # limit price to use
    size_usdc: float   # how much USDC to risk
    edge: float        # estimated edge (0–1)
    reason: str


def kelly_size(edge: float, odds: float, bankroll: float) -> float:
    """
    Full Kelly fraction for a binary bet:
        f* = (p * b - q) / b
    where b = net odds (1/price - 1), p = win prob, q = 1-p.
    We scale by config.KELLY_FRACTION and cap at config.MAX_POSITION_USDC.
    """
    if odds <= 0 or edge <= 0:
        return 0.0
    p = edge          # estimated win probability
    b = (1.0 / odds) - 1  # net odds if price=odds
    q = 1 - p
    full_kelly = (p * b - q) / b
    if full_kelly <= 0:
        return 0.0
    size = full_kelly * config.KELLY_FRACTION * bankroll
    return min(size, config.MAX_POSITION_USDC)


class BaseStrategy(ABC):
    @abstractmethod
    def generate_signals(
        self,
        markets: list[MarketInfo],
        open_positions: list[dict],
        bankroll: float,
    ) -> list[TradeSignal]:
        ...


class ValueStrategy(BaseStrategy):
    """
    Looks for markets where one outcome's implied probability appears
    mispriced relative to 50% (the naive fair value for uncertain binary
    events).  Trades when the edge exceeds MIN_EDGE.

    This is a simple baseline; in production you would replace the
    "fair_prob" estimate with your own model (ML, news sentiment, etc.).
    """

    def _fair_probability(self, market: MarketInfo, outcome: str) -> float:
        """
        Estimate fair probability. Override this method with your own model.
        Default: assume equal probability (0.5) for each binary outcome.
        """
        return 0.5

    def generate_signals(
        self,
        markets: list[MarketInfo],
        open_positions: list[dict],
        bankroll: float,
    ) -> list[TradeSignal]:
        signals: list[TradeSignal] = []
        open_token_ids = {p.get("asset", "") for p in open_positions}

        for market in markets:
            implied = get_implied_probabilities(market)

            for token in market.tokens:
                if token.token_id in open_token_ids:
                    continue  # already have a position

                fair = self._fair_probability(market, token.outcome)
                market_prob = implied.get(token.outcome, 0.5)

                edge = fair - market_prob  # positive → market underprices outcome

                if edge > config.MIN_EDGE:
                    # Market is underpricing this outcome → BUY
                    price = token.best_ask  # pay the ask
                    if price <= 0 or price >= 1:
                        continue
                    size = kelly_size(fair, price, bankroll)
                    if size < 1.0:
                        continue

                    signals.append(
                        TradeSignal(
                            market=market,
                            token=token,
                            side="BUY",
                            price=price,
                            size_usdc=size,
                            edge=edge,
                            reason=(
                                f"Value BUY: fair={fair:.3f} "
                                f"market={market_prob:.3f} edge={edge:.3f}"
                            ),
                        )
                    )

                elif edge < -config.MIN_EDGE:
                    # Market overprices this outcome; look for complementary token
                    pass  # handled when we reach the other token

        # Sort by edge descending
        signals.sort(key=lambda s: s.edge, reverse=True)
        return signals


class MomentumStrategy(BaseStrategy):
    """
    Simple momentum: buy tokens whose mid-price is close to the ask
    (tight spread, recent buying pressure) if spread < 5 cents.
    """

    def generate_signals(
        self,
        markets: list[MarketInfo],
        open_positions: list[dict],
        bankroll: float,
    ) -> list[TradeSignal]:
        signals: list[TradeSignal] = []
        open_token_ids = {p.get("asset", "") for p in open_positions}

        for market in markets:
            for token in market.tokens:
                if token.token_id in open_token_ids:
                    continue
                if token.spread > 0.05:
                    continue  # too wide
                if token.price < 0.1 or token.price > 0.9:
                    continue  # avoid extreme prices

                # Momentum signal: price hugging ask side
                if token.price >= token.best_ask * 0.99:
                    edge = config.MIN_EDGE + 0.005  # nominal edge for sizing
                    size = kelly_size(token.price + edge, token.best_ask, bankroll)
                    if size < 1.0:
                        continue
                    signals.append(
                        TradeSignal(
                            market=market,
                            token=token,
                            side="BUY",
                            price=token.best_ask,
                            size_usdc=size,
                            edge=edge,
                            reason=f"Momentum BUY: price={token.price:.3f} spread={token.spread:.3f}",
                        )
                    )

        signals.sort(key=lambda s: s.edge, reverse=True)
        return signals


STRATEGIES: dict[str, type[BaseStrategy]] = {
    "value": ValueStrategy,
    "momentum": MomentumStrategy,
}


def get_strategy(name: str) -> BaseStrategy:
    cls = STRATEGIES.get(name.lower())
    if cls is None:
        logger.warning(f"Unknown strategy '{name}', defaulting to 'value'")
        cls = ValueStrategy
    return cls()

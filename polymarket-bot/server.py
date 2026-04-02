"""
FastAPI REST server — exposes bot data to the dashboard.

Run:
    uvicorn server:app --reload --port 8000
"""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

import database as db

app = FastAPI(title="Polymarket Bot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    db.init_db()


# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------

@app.get("/api/summary")
def summary():
    return db.get_summary()


@app.get("/api/trades")
def trades(limit: int = Query(100, le=500), offset: int = 0):
    return db.get_trades(limit=limit, offset=offset)


@app.get("/api/pnl")
def pnl(limit: int = Query(500, le=2000)):
    return db.get_pnl_snapshots(limit=limit)


@app.get("/api/events")
def events(limit: int = Query(100, le=500)):
    return db.get_events(limit=limit)


# ------------------------------------------------------------------
# Seed endpoint (dev only) — generates fake data for dashboard demo
# ------------------------------------------------------------------

@app.post("/api/seed")
def seed():
    """Populate DB with fake data for UI development."""
    import random
    from datetime import datetime, timedelta

    db.init_db()
    base_balance = 500.0
    now = datetime.utcnow()

    markets = [
        ("Will BTC reach $100k by end of 2025?", "YES"),
        ("Will the Fed cut rates in March 2025?", "NO"),
        ("Will Argentina win Copa America 2025?", "YES"),
        ("Will Elon Musk remain CEO of X in 2025?", "YES"),
        ("Will GPT-5 be released before July 2025?", "NO"),
    ]

    # PnL snapshots — random walk
    balance = base_balance
    for i in range(48):
        ts = now - timedelta(hours=48 - i)
        balance += random.uniform(-8, 10)
        balance = max(balance, 200)
        db.insert_pnl_snapshot(
            balance=round(balance, 2),
            open_positions=random.randint(0, 4),
            realized_pnl=round(balance - base_balance, 2),
        )

    # Trades
    statuses = ["open", "won", "lost", "open"]
    for i in range(20):
        market, outcome = random.choice(markets)
        side = "BUY"
        price = round(random.uniform(0.3, 0.75), 3)
        size = round(random.uniform(5, 40), 2)
        tid = db.insert_trade(
            market=market,
            outcome=outcome,
            side=side,
            price=price,
            size_usdc=size,
            order_id=f"fake-{i:04d}",
            dry_run=True,
        )
        db.update_trade_status(tid, random.choice(statuses))

    # Events
    msgs = [
        ("INFO", "Bot started"),
        ("INFO", "Authenticated with Polymarket CLOB API"),
        ("INFO", "Fetched 1423 total markets"),
        ("INFO", "Found 87 liquid markets"),
        ("INFO", "Strategy generated 3 signal(s)"),
        ("INFO", "Order placed: BUY 20.00 @ 0.4500"),
        ("WARNING", "Stop-loss triggered for token 0xabc…"),
        ("INFO", "Take-profit triggered: +22%"),
        ("ERROR", "Failed to fetch orderbook for token 0xdef…"),
    ]
    for level, msg in msgs:
        db.insert_event(level, msg)

    return {"seeded": True}

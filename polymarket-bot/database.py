"""
SQLite persistence layer.
Stores trades, PnL snapshots, and bot events so the dashboard can read them.
"""

import sqlite3
import os
from contextlib import contextmanager
from datetime import datetime
from typing import Generator

DB_PATH = os.getenv("DB_PATH", "data/bot.db")


def _conn() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    con = sqlite3.connect(DB_PATH, check_same_thread=False)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    return con


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    con = _conn()
    try:
        yield con
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


def init_db() -> None:
    """Create tables if they don't exist."""
    with get_db() as db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS trades (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp   TEXT    NOT NULL,
                market      TEXT    NOT NULL,
                outcome     TEXT    NOT NULL,
                side        TEXT    NOT NULL,
                price       REAL    NOT NULL,
                size_usdc   REAL    NOT NULL,
                order_id    TEXT,
                dry_run     INTEGER NOT NULL DEFAULT 1,
                status      TEXT    NOT NULL DEFAULT 'open'
            );

            CREATE TABLE IF NOT EXISTS pnl_snapshots (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp       TEXT    NOT NULL,
                balance         REAL    NOT NULL,
                open_positions  INTEGER NOT NULL DEFAULT 0,
                realized_pnl    REAL    NOT NULL DEFAULT 0,
                unrealized_pnl  REAL    NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS bot_events (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                level     TEXT NOT NULL,
                message   TEXT NOT NULL
            );
        """)


# ------------------------------------------------------------------
# Write helpers
# ------------------------------------------------------------------

def insert_trade(
    market: str,
    outcome: str,
    side: str,
    price: float,
    size_usdc: float,
    order_id: str = "",
    dry_run: bool = True,
) -> int:
    with get_db() as db:
        cur = db.execute(
            """INSERT INTO trades
               (timestamp, market, outcome, side, price, size_usdc, order_id, dry_run)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                datetime.utcnow().isoformat(),
                market,
                outcome,
                side,
                price,
                size_usdc,
                order_id,
                int(dry_run),
            ),
        )
        return cur.lastrowid or 0


def update_trade_status(trade_id: int, status: str) -> None:
    with get_db() as db:
        db.execute("UPDATE trades SET status=? WHERE id=?", (status, trade_id))


def insert_pnl_snapshot(
    balance: float,
    open_positions: int,
    realized_pnl: float = 0.0,
    unrealized_pnl: float = 0.0,
) -> None:
    with get_db() as db:
        db.execute(
            """INSERT INTO pnl_snapshots
               (timestamp, balance, open_positions, realized_pnl, unrealized_pnl)
               VALUES (?, ?, ?, ?, ?)""",
            (
                datetime.utcnow().isoformat(),
                balance,
                open_positions,
                realized_pnl,
                unrealized_pnl,
            ),
        )


def insert_event(level: str, message: str) -> None:
    with get_db() as db:
        db.execute(
            "INSERT INTO bot_events (timestamp, level, message) VALUES (?, ?, ?)",
            (datetime.utcnow().isoformat(), level, message),
        )


# ------------------------------------------------------------------
# Read helpers
# ------------------------------------------------------------------

def get_trades(limit: int = 100, offset: int = 0) -> list[dict]:
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM trades ORDER BY timestamp DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        return [dict(r) for r in rows]


def get_pnl_snapshots(limit: int = 500) -> list[dict]:
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM pnl_snapshots ORDER BY timestamp DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [dict(r) for r in reversed(rows)]


def get_events(limit: int = 100) -> list[dict]:
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM bot_events ORDER BY timestamp DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [dict(r) for r in rows]


def get_summary() -> dict:
    with get_db() as db:
        total_trades = db.execute("SELECT COUNT(*) FROM trades").fetchone()[0]
        open_trades = db.execute(
            "SELECT COUNT(*) FROM trades WHERE status='open'"
        ).fetchone()[0]
        last_snap = db.execute(
            "SELECT * FROM pnl_snapshots ORDER BY timestamp DESC LIMIT 1"
        ).fetchone()
        first_snap = db.execute(
            "SELECT balance FROM pnl_snapshots ORDER BY timestamp ASC LIMIT 1"
        ).fetchone()

        balance = float(last_snap["balance"]) if last_snap else 0.0
        initial_balance = float(first_snap["balance"]) if first_snap else balance
        total_pnl = balance - initial_balance

        win_count = db.execute(
            "SELECT COUNT(*) FROM trades WHERE status='won'"
        ).fetchone()[0]
        closed_count = db.execute(
            "SELECT COUNT(*) FROM trades WHERE status IN ('won','lost')"
        ).fetchone()[0]
        win_rate = (win_count / closed_count * 100) if closed_count else 0.0

    return {
        "balance": balance,
        "total_pnl": total_pnl,
        "total_trades": total_trades,
        "open_trades": open_trades,
        "win_rate": win_rate,
    }

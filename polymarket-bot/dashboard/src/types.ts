export interface Summary {
  balance: number
  total_pnl: number
  total_trades: number
  open_trades: number
  win_rate: number
}

export interface Trade {
  id: number
  timestamp: string
  market: string
  outcome: string
  side: string
  price: number
  size_usdc: number
  order_id: string
  dry_run: number
  status: string
}

export interface PnlSnapshot {
  id: number
  timestamp: string
  balance: number
  open_positions: number
  realized_pnl: number
  unrealized_pnl: number
}

export interface BotEvent {
  id: number
  timestamp: string
  level: string
  message: string
}

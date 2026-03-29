import type { Summary, Trade, PnlSnapshot, BotEvent } from './types'

const BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const api = {
  summary: ()       => get<Summary>('/summary'),
  trades:  ()       => get<Trade[]>('/trades?limit=100'),
  pnl:     ()       => get<PnlSnapshot[]>('/pnl?limit=500'),
  events:  ()       => get<BotEvent[]>('/events?limit=80'),
  seed:    ()       => fetch(`${BASE}/seed`, { method: 'POST' }).then(r => r.json()),
}

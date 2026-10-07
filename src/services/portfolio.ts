import { config } from "@/lib/config";
import type { HistoryPoint, Quote } from "./market/types";

export interface Position {
  ticker: string;
  quantity: number;
  avgPrice: number;
}

export interface PortfolioSnapshot {
  source: "live" | "sample";
  positions: Position[];
  /** Cash available to trade, in USD. null when the source doesn't provide it. */
  buyingPowerUsd: number | null;
  /** Value of the portfolio over time; empty when unavailable. */
  history: HistoryPoint[];
}

export type PortfolioResult =
  | { status: "ok"; data: PortfolioSnapshot }
  | { status: "unavailable"; reason: string };

/**
 * Real positions come from your own positions API
 * (NEXT_PUBLIC_POSITIONS_API_URL), queried by wallet address:
 *
 *   GET {base}/portfolio?address=0x...
 *   → { positions: Position[], buyingPowerUsd: number | null, history: HistoryPoint[] }
 *
 * Without that API, there is no honest way to show positions, so the
 * service reports "unavailable" rather than inventing balances.
 */
export async function fetchPortfolio(address: string): Promise<PortfolioResult> {
  if (!config.positionsApiUrl) {
    return { status: "unavailable", reason: "Positions data source isn't connected yet." };
  }
  const res = await fetch(`${config.positionsApiUrl}/portfolio?address=${encodeURIComponent(address)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Positions API responded ${res.status}`);
  const data = (await res.json()) as Omit<PortfolioSnapshot, "source">;
  return {
    status: "ok",
    data: {
      source: "live",
      positions: data.positions ?? [],
      buyingPowerUsd: data.buyingPowerUsd ?? null,
      history: data.history ?? [],
    },
  };
}

/**
 * Sample holdings for previewing the portfolio screens.
 * Only shown when the user turns on "Show sample portfolio" in Settings,
 * and always labelled as a sample.
 */
export const SAMPLE_POSITIONS: Position[] = [
  { ticker: "NVDA", quantity: 12, avgPrice: 0 },
  { ticker: "AAPL", quantity: 20, avgPrice: 0 },
  { ticker: "MSFT", quantity: 6, avgPrice: 0 },
  { ticker: "SPY", quantity: 4, avgPrice: 0 },
  { ticker: "AMD", quantity: 15, avgPrice: 0 },
];

export interface Holding extends Position {
  price: number | null;
  value: number | null;
  pnl: number | null;
  pnlPct: number | null;
  dayChange: number | null;
  allocation: number | null;
}

export interface PortfolioTotals {
  value: number | null;
  dayChange: number | null;
  dayChangePct: number | null;
  totalPnl: number | null;
  totalPnlPct: number | null;
}

export function computeHoldings(positions: Position[], quotes: Quote[]) {
  const byTicker = new Map(quotes.map((q) => [q.ticker, q]));
  const rows = positions.map((p) => {
    const q = byTicker.get(p.ticker);
    const value = q ? q.price * p.quantity : null;
    const cost = p.avgPrice > 0 ? p.avgPrice * p.quantity : null;
    return {
      ...p,
      price: q?.price ?? null,
      value,
      pnl: value != null && cost != null ? value - cost : null,
      pnlPct: value != null && cost ? ((value - cost) / cost) * 100 : null,
      dayChange: q ? q.change * p.quantity : null,
      allocation: null as number | null,
    };
  });
  const known = rows.filter((r) => r.value != null);
  const total = known.length ? known.reduce((s, r) => s + (r.value ?? 0), 0) : null;
  for (const r of rows) r.allocation = total && r.value != null ? (r.value / total) * 100 : null;

  const dayChange = known.length ? known.reduce((s, r) => s + (r.dayChange ?? 0), 0) : null;
  const withCost = rows.filter((r) => r.pnl != null);
  const totalPnl = withCost.length ? withCost.reduce((s, r) => s + (r.pnl ?? 0), 0) : null;
  const costBasis = withCost.reduce((s, r) => s + r.avgPrice * r.quantity, 0);

  const totals: PortfolioTotals = {
    value: total,
    dayChange,
    dayChangePct: total != null && dayChange != null && total - dayChange !== 0 ? (dayChange / (total - dayChange)) * 100 : null,
    totalPnl,
    totalPnlPct: totalPnl != null && costBasis ? (totalPnl / costBasis) * 100 : null,
  };
  return { rows: rows as Holding[], totals };
}

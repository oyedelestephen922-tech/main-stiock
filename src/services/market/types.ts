export type MarketSession = "open" | "pre" | "post" | "closed" | "unknown";

export interface Quote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  open: number | null;
  high: number | null;
  low: number | null;
  prevClose: number | null;
  volume: number | null;
  high52w: number | null;
  low52w: number | null;
  session: MarketSession;
  updatedAt: number;
}

export interface HistoryPoint {
  t: number; // unix ms
  v: number; // price
}

export const RANGES = ["1D", "1W", "1M", "3M", "1Y", "5Y", "ALL"] as const;
export type Range = (typeof RANGES)[number];

export type ActivityKind = "BUY" | "SELL" | "WATCHLIST";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  ticker: string;
  amountUsd: number | null;
  ts: number;
  /** "demo" events are generated locally and must be labelled in the UI. */
  source: "demo" | "live" | "local";
}

export interface MarketHealth {
  online: boolean;
  checkedAt: number;
}

export interface MarketDataProvider {
  /** "demo" means every number is synthetic and the UI must say so. */
  kind: "demo" | "live";
  getQuotes(tickers: string[]): Promise<Quote[]>;
  getHistory(ticker: string, range: Range): Promise<HistoryPoint[]>;
  getHealth(): Promise<MarketHealth>;
  getActivity(ticker?: string): Promise<ActivityEvent[]>;
}

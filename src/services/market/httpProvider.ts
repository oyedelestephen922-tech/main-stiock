import type { ActivityEvent, HistoryPoint, MarketDataProvider, Quote, Range } from "./types";

/**
 * Adapter for your own market data API (set NEXT_PUBLIC_MARKET_DATA_PROVIDER=http).
 *
 * Expected endpoints (all JSON, all GET):
 *
 *   {base}/health
 *     → { "ok": true }
 *
 *   {base}/quotes?symbols=AAPL,NVDA
 *     → { "quotes": Quote[] }   (see ./types.ts; nullable fields may be null)
 *
 *   {base}/history?symbol=AAPL&range=1M
 *     → { "points": [{ "t": 1717000000000, "v": 189.3 }, ...] }   (t in unix ms)
 *
 *   {activityBase}/activity[?symbol=AAPL]     (optional, NEXT_PUBLIC_ACTIVITY_API_URL)
 *     → { "events": ActivityEvent[] }
 *
 * If your vendor's API looks different, put a small server route or edge
 * function in front of it that returns these shapes — keep vendor API keys
 * on the server, never in NEXT_PUBLIC_ variables.
 */
export function createHttpProvider(base: string, activityBase?: string): MarketDataProvider {
  async function get<T>(url: string): Promise<T> {
    const res = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
    if (!res.ok) throw new Error(`Market API responded ${res.status}`);
    return (await res.json()) as T;
  }

  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

  return {
    kind: "live",

    async getQuotes(tickers) {
      if (tickers.length === 0) return [];
      const data = await get<{ quotes: Partial<Quote>[] }>(
        `${base}/quotes?symbols=${encodeURIComponent(tickers.join(","))}`,
      );
      return (data.quotes ?? [])
        .filter((q) => typeof q.ticker === "string" && num(q.price) != null)
        .map((q) => ({
          ticker: String(q.ticker).toUpperCase(),
          price: q.price as number,
          change: num(q.change) ?? 0,
          changePercent: num(q.changePercent) ?? 0,
          open: num(q.open),
          high: num(q.high),
          low: num(q.low),
          prevClose: num(q.prevClose),
          volume: num(q.volume),
          high52w: num(q.high52w),
          low52w: num(q.low52w),
          session: q.session ?? "unknown",
          updatedAt: num(q.updatedAt) ?? Date.now(),
        }));
    },

    async getHistory(ticker: string, range: Range) {
      const data = await get<{ points: HistoryPoint[] }>(
        `${base}/history?symbol=${encodeURIComponent(ticker)}&range=${range}`,
      );
      return (data.points ?? []).filter((p) => num(p.t) != null && num(p.v) != null);
    },

    async getHealth() {
      try {
        const data = await get<{ ok?: boolean }>(`${base}/health`);
        return { online: data.ok === true, checkedAt: Date.now() };
      } catch {
        return { online: false, checkedAt: Date.now() };
      }
    },

    async getActivity(ticker?: string) {
      if (!activityBase) return [];
      const q = ticker ? `?symbol=${encodeURIComponent(ticker)}` : "";
      const data = await get<{ events: ActivityEvent[] }>(`${activityBase}/activity${q}`);
      return (data.events ?? []).map((e) => ({ ...e, source: "live" as const }));
    },
  };
}

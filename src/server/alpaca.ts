import "server-only";
import type { HistoryPoint, Quote, Range } from "@/services/market/types";
import { usSession } from "@/services/market/session";

/**
 * Alpaca Market Data (https://alpaca.markets) — server-side only.
 *
 * Keys come from ALPACA_API_KEY_ID / ALPACA_API_SECRET_KEY (no NEXT_PUBLIC_ prefix),
 * so they are never sent to the browser. The free plan streams real-time prices
 * from the IEX exchange; we request feed=iex explicitly so free keys always work.
 */

const BASE = (process.env.ALPACA_DATA_URL || "https://data.alpaca.markets").replace(/\/$/, "") + "/v2";
const FEED = process.env.ALPACA_DATA_FEED === "sip" ? "sip" : "iex";

export function alpacaConfigured(): boolean {
  return Boolean(process.env.ALPACA_API_KEY_ID?.trim() && process.env.ALPACA_API_SECRET_KEY?.trim());
}

export class MarketDataError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

async function alpaca<T>(path: string, params: Record<string, string>, revalidate: number): Promise<T> {
  if (!alpacaConfigured()) throw new MarketDataError("Market data keys are not configured.", 503);
  const url = `${BASE}${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url, {
    headers: {
      "APCA-API-KEY-ID": process.env.ALPACA_API_KEY_ID!.trim(),
      "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET_KEY!.trim(),
      accept: "application/json",
    },
    // Shared cache across visitors keeps us far inside the free rate limit.
    next: { revalidate },
  });
  if (res.status === 401 || res.status === 403) throw new MarketDataError("Market data keys were rejected.", 503);
  if (res.status === 429) throw new MarketDataError("Market data rate limit reached.", 503);
  if (!res.ok) throw new MarketDataError(`Market data provider responded ${res.status}.`);
  return (await res.json()) as T;
}

interface Bar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface Snapshot {
  latestTrade?: { p: number; t: string };
  dailyBar?: Bar;
  prevDailyBar?: Bar;
}

/** New York calendar date (YYYY-MM-DD) for a timestamp. */
function nyDate(ts: number | string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(ts));
}

/** Multi-symbol bars, following next_page_token until every page is read. */
async function bars(
  symbols: string[],
  timeframe: string,
  start: Date,
  revalidate: number,
): Promise<Record<string, Bar[]>> {
  const out: Record<string, Bar[]> = {};
  let pageToken: string | undefined;
  for (let page = 0; page < 20; page++) {
    const params: Record<string, string> = {
      symbols: symbols.join(","),
      timeframe,
      start: start.toISOString(),
      limit: "10000",
      adjustment: "split",
      feed: FEED,
      sort: "asc",
    };
    if (pageToken) params.page_token = pageToken;
    const data = await alpaca<{ bars: Record<string, Bar[]> | null; next_page_token?: string | null }>(
      "/stocks/bars",
      params,
      revalidate,
    );
    for (const [sym, list] of Object.entries(data.bars ?? {})) (out[sym] ??= []).push(...list);
    if (!data.next_page_token) break;
    pageToken = data.next_page_token;
  }
  return out;
}

const DAY = 86_400_000;

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  const [snaps, yearBars] = await Promise.all([
    alpaca<Record<string, Snapshot>>("/stocks/snapshots", { symbols: symbols.join(","), feed: FEED }, 15),
    // 52-week range, refreshed a few times a day.
    bars(symbols, "1Day", new Date(Date.now() - 366 * DAY), 6 * 3600).catch(() => ({}) as Record<string, Bar[]>),
  ]);

  const now = Date.now();
  const today = nyDate(now);
  const session = usSession(new Date(now));

  return symbols.flatMap((sym): Quote[] => {
    const s = snaps[sym];
    const price = s?.latestTrade?.p ?? s?.dailyBar?.c;
    if (!s || price == null) return [];

    // Before the open, Alpaca's "daily bar" is still yesterday's. In that case
    // yesterday's close is the reference and today's open/high/low don't exist yet.
    const dailyIsToday = s.dailyBar ? nyDate(s.dailyBar.t) === today : false;
    const prevClose = dailyIsToday ? s.prevDailyBar?.c ?? null : s.dailyBar?.c ?? s.prevDailyBar?.c ?? null;
    const day = dailyIsToday ? s.dailyBar : undefined;

    const yr = (yearBars as Record<string, Bar[]>)[sym] ?? [];
    const high52w = yr.length ? Math.max(...yr.map((b) => b.h), price) : null;
    const low52w = yr.length ? Math.min(...yr.map((b) => b.l), price) : null;

    const change = prevClose != null ? price - prevClose : 0;
    return [
      {
        ticker: sym,
        price,
        change,
        changePercent: prevClose ? (change / prevClose) * 100 : 0,
        open: day?.o ?? null,
        high: day ? Math.max(day.h, price) : null,
        low: day ? Math.min(day.l, price) : null,
        prevClose,
        // IEX-only volume is a small slice of total market volume, so we don't show it as if it were the whole.
        volume: FEED === "sip" ? day?.v ?? null : null,
        high52w,
        low52w,
        session,
        updatedAt: s.latestTrade ? Date.parse(s.latestTrade.t) : now,
      },
    ];
  });
}

const HISTORY: Record<Range, { timeframe: string; span: number; revalidate: number }> = {
  "1D": { timeframe: "5Min", span: 5 * DAY, revalidate: 60 },
  "1W": { timeframe: "30Min", span: 8 * DAY, revalidate: 300 },
  "1M": { timeframe: "2Hour", span: 31 * DAY, revalidate: 900 },
  "3M": { timeframe: "1Day", span: 92 * DAY, revalidate: 3600 },
  "1Y": { timeframe: "1Day", span: 366 * DAY, revalidate: 6 * 3600 },
  "5Y": { timeframe: "1Week", span: 5 * 366 * DAY, revalidate: 12 * 3600 },
  ALL: { timeframe: "1Month", span: 0, revalidate: 24 * 3600 },
};

export async function getHistory(symbol: string, range: Range): Promise<HistoryPoint[]> {
  const spec = HISTORY[range];
  const start = range === "ALL" ? new Date("2016-01-01T00:00:00Z") : new Date(Date.now() - spec.span);
  const list = (await bars([symbol], spec.timeframe, start, spec.revalidate))[symbol] ?? [];
  let points = list.map((b) => ({ t: Date.parse(b.t), v: b.c }));

  if (range === "1D" && points.length) {
    // Keep only the most recent trading day.
    const lastDay = nyDate(points[points.length - 1].t);
    points = points.filter((p) => nyDate(p.t) === lastDay);
  }
  if (range === "1W" && points.length) {
    const cutoff = points[points.length - 1].t - 7 * DAY;
    points = points.filter((p) => p.t >= cutoff);
  }
  return points;
}

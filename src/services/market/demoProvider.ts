import { ASSETS } from "@/lib/assets";
import { usSession } from "./session";
import type { ActivityEvent, HistoryPoint, MarketDataProvider, Quote, Range } from "./types";

/**
 * DEMO DATA ONLY.
 * Prices here are produced by a deterministic formula so the interface can be
 * designed and tested without a data vendor. They are not real market prices
 * and the UI labels them "Demo data" everywhere they appear.
 */

const DAY = 86_400_000;

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seeded(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Wave {
  period: number;
  amp: number;
  phase: number;
}

const model = new Map<string, { base: number; waves: Wave[]; drift: number; noise: number }>();

function modelFor(ticker: string) {
  let m = model.get(ticker);
  if (m) return m;
  const r = seeded(hash(ticker));
  const base = 40 + Math.round(r() * 860);
  const spec: [number, number][] = [
    [1100 * DAY, 0.22],
    [190 * DAY, 0.1],
    [41 * DAY, 0.06],
    [6.5 * DAY, 0.025],
    [1 * DAY, 0.011],
    [2.3 * 3_600_000, 0.005],
    [0.4 * 3_600_000, 0.0025],
  ];
  const waves = spec.map(([period, amp]) => ({
    period: period * (0.8 + r() * 0.4),
    amp: amp * (0.6 + r() * 0.8),
    phase: r() * Math.PI * 2,
  }));
  m = { base, waves, drift: (r() - 0.35) * 0.18, noise: hash(`${ticker}-n`) };
  model.set(ticker, m);
  return m;
}

function priceAt(ticker: string, t: number): number {
  const m = modelFor(ticker);
  const years = (t - Date.UTC(2024, 0, 1)) / (365 * DAY);
  let x = m.drift * years;
  for (const w of m.waves) x += w.amp * Math.sin((2 * Math.PI * t) / w.period + w.phase);
  // a little high-frequency texture, stable per 5-minute bucket
  const bucket = Math.floor(t / 300_000);
  const n = seeded(m.noise ^ bucket)() - 0.5;
  x += n * 0.004;
  return Math.max(1, m.base * Math.exp(x));
}

const RANGE_SPEC: Record<Range, { span: number; points: number }> = {
  "1D": { span: DAY, points: 96 },
  "1W": { span: 7 * DAY, points: 112 },
  "1M": { span: 30 * DAY, points: 120 },
  "3M": { span: 91 * DAY, points: 130 },
  "1Y": { span: 365 * DAY, points: 156 },
  "5Y": { span: 5 * 365 * DAY, points: 182 },
  ALL: { span: 8 * 365 * DAY, points: 200 },
};

const round = (v: number) => Math.round(v * 100) / 100;

function quoteFor(ticker: string, now: number): Quote {
  const price = priceAt(ticker, now);
  const prevClose = priceAt(ticker, now - DAY);
  const open = priceAt(ticker, now - DAY * 0.27);
  let high = Math.max(price, open);
  let low = Math.min(price, open);
  for (let i = 1; i < 24; i++) {
    const p = priceAt(ticker, now - (DAY * 0.27 * i) / 24);
    high = Math.max(high, p);
    low = Math.min(low, p);
  }
  let high52 = price;
  let low52 = price;
  for (let i = 0; i < 52; i++) {
    const p = priceAt(ticker, now - i * 7 * DAY);
    high52 = Math.max(high52, p);
    low52 = Math.min(low52, p);
  }
  const volSeed = seeded(hash(ticker) ^ Math.floor(now / DAY))();
  return {
    ticker,
    price: round(price),
    change: round(price - prevClose),
    changePercent: ((price - prevClose) / prevClose) * 100,
    open: round(open),
    high: round(high),
    low: round(low),
    prevClose: round(prevClose),
    volume: Math.round(4_000_000 + volSeed * 60_000_000),
    high52w: round(high52),
    low52w: round(low52),
    session: usSession(new Date(now)),
    updatedAt: now,
  };
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const demoProvider: MarketDataProvider = {
  kind: "demo",

  async getQuotes(tickers) {
    await delay(180);
    const now = Date.now();
    return tickers.map((t) => quoteFor(t.toUpperCase(), now));
  },

  async getHistory(ticker, range) {
    await delay(220);
    const { span, points } = RANGE_SPEC[range];
    const now = Date.now();
    const out: HistoryPoint[] = [];
    for (let i = points; i >= 0; i--) {
      const t = now - (span * i) / points;
      out.push({ t, v: round(priceAt(ticker.toUpperCase(), t)) });
    }
    return out;
  },

  async getHealth() {
    // Demo data is always "available", but it is never reported as live markets.
    return { online: false, checkedAt: Date.now() };
  },

  async getActivity(ticker) {
    await delay(150);
    const now = Date.now();
    const slot = Math.floor(now / 20_000);
    const pool = ticker ? [ticker.toUpperCase()] : ASSETS.map((a) => a.ticker);
    const events: ActivityEvent[] = [];
    for (let i = 0; i < 12; i++) {
      const r = seeded(hash(`${ticker ?? "all"}-${slot - i}`));
      const t = pool[Math.floor(r() * pool.length)];
      const roll = r();
      const kind = roll < 0.45 ? "BUY" : roll < 0.85 ? "SELL" : "WATCHLIST";
      events.push({
        id: `demo-${slot - i}-${t}`,
        kind,
        ticker: t,
        amountUsd: kind === "WATCHLIST" ? null : Math.round(50 + r() * 4950),
        ts: (slot - i) * 20_000 + Math.floor(r() * 20_000),
        source: "demo",
      });
    }
    return events;
  },
};

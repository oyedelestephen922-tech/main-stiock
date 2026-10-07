"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { marketData, type HistoryPoint, type Range } from "@/services/market";
import { computeHoldings, fetchPortfolio, SAMPLE_POSITIONS, type Position } from "@/services/portfolio";
import { preferencesStore } from "@/services/stores";
import { useQuotes } from "./useMarket";

export type PortfolioView =
  | { state: "disconnected" }
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "unavailable"; reason: string }
  | {
      state: "ready";
      source: "live" | "sample";
      positions: Position[];
      buyingPowerUsd: number | null;
    };

/**
 * Resolves what the portfolio screens should show:
 * live positions for the connected wallet, a clearly-labelled sample
 * (only when the user opted in), or an honest "unavailable".
 */
export function usePortfolio(): PortfolioView {
  const { address, isConnected } = useAccount();
  const prefs = preferencesStore.useValue();

  const live = useQuery({
    queryKey: ["portfolio", address],
    queryFn: () => fetchPortfolio(address!),
    enabled: Boolean(address) && !prefs.showSamplePortfolio,
    refetchInterval: 30_000,
  });

  const sampleBasis = useQueries({
    queries: prefs.showSamplePortfolio
      ? SAMPLE_POSITIONS.map((p) => ({
          queryKey: ["history", p.ticker, "3M"],
          queryFn: () => marketData.getHistory(p.ticker, "3M"),
          staleTime: 60_000,
        }))
      : [],
  });

  if (prefs.showSamplePortfolio) {
    if (sampleBasis.some((q) => q.isLoading)) return { state: "loading" };
    return {
      state: "ready",
      source: "sample",
      positions: SAMPLE_POSITIONS.map((p, i) => ({
        ...p,
        avgPrice: sampleBasis[i]?.data?.[0]?.v ?? 0,
      })),
      buyingPowerUsd: null,
    };
  }

  if (!isConnected) return { state: "disconnected" };
  if (live.isLoading) return { state: "loading" };
  if (live.isError) return { state: "error", message: "Couldn't load your positions." };
  if (!live.data) return { state: "loading" };
  if (live.data.status === "unavailable") return { state: "unavailable", reason: live.data.reason };
  return {
    state: "ready",
    source: "live",
    positions: live.data.data.positions,
    buyingPowerUsd: live.data.data.buyingPowerUsd,
  };
}

export function useHoldings(positions: Position[]) {
  const quotes = useQuotes(positions.map((p) => p.ticker));
  return { ...computeHoldings(positions, quotes.data ?? []), isLoading: quotes.isLoading };
}

/** Portfolio value over time, built from each position's price history. */
export function usePortfolioHistory(positions: Position[], range: Range, enabled: boolean) {
  const results = useQueries({
    queries: enabled
      ? positions.map((p) => ({
          queryKey: ["history", p.ticker, range],
          queryFn: () => marketData.getHistory(p.ticker, range),
          staleTime: 60_000,
        }))
      : [],
  });
  const loading = results.some((r) => r.isLoading);
  if (!enabled || loading || results.length === 0) return { data: [] as HistoryPoint[], loading };
  const series = results.map((r) => r.data ?? []);
  const len = Math.min(...series.map((s) => s.length));
  const data: HistoryPoint[] = [];
  for (let i = 0; i < len; i++) {
    let v = 0;
    series.forEach((s, k) => (v += s[i].v * positions[k].quantity));
    data.push({ t: series[0][i].t, v: Math.round(v * 100) / 100 });
  }
  return { data, loading };
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { marketData, type Range } from "@/services/market";

export const isDemoProvider = marketData.kind === "demo";

export function useQuotes(tickers: string[]) {
  const key = [...tickers].sort().join(",");
  return useQuery({
    queryKey: ["quotes", key],
    queryFn: () => marketData.getQuotes(tickers),
    enabled: tickers.length > 0,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

export function useQuote(ticker: string) {
  const q = useQuotes([ticker]);
  return { ...q, data: q.data?.find((x) => x.ticker === ticker.toUpperCase()) };
}

export function useHistory(ticker: string, range: Range) {
  return useQuery({
    queryKey: ["history", ticker, range],
    queryFn: () => marketData.getHistory(ticker, range),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useMarketHealth() {
  return useQuery({
    queryKey: ["market-health"],
    queryFn: () => marketData.getHealth(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useMarketActivity(ticker?: string) {
  return useQuery({
    queryKey: ["activity", ticker ?? "all"],
    queryFn: () => marketData.getActivity(ticker),
    refetchInterval: 20_000,
  });
}

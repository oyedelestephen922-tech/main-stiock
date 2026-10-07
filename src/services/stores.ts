"use client";

import { createLocalStore } from "@/lib/localStore";
import type { ActivityEvent } from "./market/types";

/** Tickers the user has starred, in their chosen order. */
export const watchlistStore = createLocalStore<string[]>("ms.watchlist", []);

/** Things the user did in this browser (watchlist changes, wallet connections). */
export const localActivityStore = createLocalStore<ActivityEvent[]>("ms.activity", []);

export interface Preferences {
  slippageBps: number;
  showSamplePortfolio: boolean;
}

export const preferencesStore = createLocalStore<Preferences>("ms.prefs", {
  slippageBps: 50,
  showSamplePortfolio: false,
});

export function logLocalActivity(kind: ActivityEvent["kind"], ticker: string) {
  localActivityStore.set((prev) =>
    [
      {
        id: `local-${Date.now()}-${ticker}`,
        kind,
        ticker,
        amountUsd: null,
        ts: Date.now(),
        source: "local" as const,
      },
      ...prev,
    ].slice(0, 100),
  );
}

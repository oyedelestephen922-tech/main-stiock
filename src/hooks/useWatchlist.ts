"use client";

import { useCallback } from "react";
import { getAsset } from "@/lib/assets";
import { logLocalActivity, watchlistStore } from "@/services/stores";
import { useToast } from "@/components/ui/Toast";

export function useWatchlist() {
  const list = watchlistStore.useValue();
  const toast = useToast();

  const has = useCallback((t: string) => list.includes(t), [list]);

  const toggle = useCallback(
    (ticker: string) => {
      const t = ticker.toUpperCase();
      const exists = watchlistStore.get().includes(t);
      watchlistStore.set((prev) => (exists ? prev.filter((x) => x !== t) : [...prev, t]));
      logLocalActivity("WATCHLIST", t);
      toast({
        tone: "info",
        title: exists ? `Removed ${t} from watchlist` : `Added ${t} to watchlist`,
        description: getAsset(t)?.name,
      });
      return !exists;
    },
    [toast],
  );

  const move = useCallback((ticker: string, delta: number) => {
    watchlistStore.set((prev) => {
      const i = prev.indexOf(ticker);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  const reorder = useCallback((from: number, to: number) => {
    watchlistStore.set((prev) => {
      if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  return { list, has, toggle, move, reorder };
}

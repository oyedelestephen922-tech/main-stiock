"use client";

import { useState, useSyncExternalStore } from "react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { Icon } from "../ui/Icon";

const noop = () => () => {};

export function WatchStar({ ticker, size = 18 }: { ticker: string; size?: number }) {
  const { has, toggle } = useWatchlist();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [pop, setPop] = useState(0);
  const on = mounted && has(ticker);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(ticker);
        setPop((n) => n + 1);
      }}
      aria-pressed={on}
      aria-label={on ? `Remove ${ticker} from watchlist` : `Add ${ticker} to watchlist`}
      className={`grid size-9 place-items-center rounded-md transition-colors hover:bg-raised ${
        on ? "text-electric" : "text-ink-3 hover:text-ink-2"
      }`}
    >
      <Icon
        key={pop}
        name="star"
        size={size}
        filled={on}
        className={pop ? "star-pop" : ""}
        style={on ? { filter: "drop-shadow(0 0 5px var(--glow))" } : undefined}
      />
    </button>
  );
}

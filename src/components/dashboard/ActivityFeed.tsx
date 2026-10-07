"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ActivityEvent } from "@/services/market";
import { formatUsd, timeAgo } from "@/lib/format";
import { StateMessage } from "../ui/States";

const KIND_STYLE: Record<ActivityEvent["kind"], string> = {
  BUY: "text-electric",
  SELL: "text-down",
  WATCHLIST: "text-note",
};

export function ActivityFeed({ events, limit = 8, emptyText }: { events: ActivityEvent[] | undefined; limit?: number; emptyText?: string }) {
  // re-render every 15s so "ago" labels stay fresh
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  if (!events || events.length === 0) {
    return <StateMessage compact icon="activity" title="No activity yet" description={emptyText ?? "Activity will appear here as it happens."} />;
  }

  return (
    <ul className="divide-y divide-line" aria-live="polite">
      {events.slice(0, limit).map((e) => (
        <li key={e.id} className="rise-in flex items-center gap-3 px-4 py-3 text-sm sm:px-5">
          <span className={`w-[5.5rem] shrink-0 text-[0.7rem] font-bold tracking-[0.1em] ${KIND_STYLE[e.kind]}`}>{e.kind}</span>
          <Link href={`/markets/${e.ticker}`} className="w-14 font-semibold text-ink hover:text-electric">
            {e.ticker}
          </Link>
          <span className="type-figure flex-1 text-right text-ink-2">
            {e.amountUsd != null ? formatUsd(e.amountUsd) : e.source === "local" ? "Watchlist updated" : "Watching"}
          </span>
          <time className="w-16 shrink-0 text-right text-xs text-ink-3" dateTime={new Date(e.ts).toISOString()}>
            {timeAgo(e.ts)}
          </time>
        </li>
      ))}
    </ul>
  );
}

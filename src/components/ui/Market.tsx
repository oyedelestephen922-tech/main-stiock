"use client";

import { direction, formatPercent, formatSignedUsd } from "@/lib/format";
import { isDemoProvider, useMarketHealth } from "@/hooks/useMarket";
import { SESSION_LABEL, type MarketSession } from "@/services/market";
import { Icon } from "./Icon";

export function Change({
  percent,
  amount,
  size = "sm",
  pill = false,
}: {
  percent: number | null | undefined;
  amount?: number | null;
  size?: "sm" | "md";
  pill?: boolean;
}) {
  const d = direction(percent);
  const color = d === "up" ? "text-up" : d === "down" ? "text-down" : "text-ink-2";
  const bg = pill ? (d === "up" ? "bg-up-bg" : d === "down" ? "bg-down-bg" : "bg-raised") : "";
  return (
    <span
      className={`type-figure inline-flex items-center gap-1 ${color} ${bg} ${pill ? "rounded-md px-1.5 py-0.5" : ""} ${
        size === "md" ? "text-base" : "text-[0.8125rem]"
      }`}
    >
      {d !== "flat" && <Icon name={d === "up" ? "arrowUp" : "arrowDown"} size={size === "md" ? 14 : 12} strokeWidth={2.2} />}
      {amount !== undefined && <span>{formatSignedUsd(amount)}</span>}
      <span>{formatPercent(percent)}</span>
      <span className="sr-only">{d === "up" ? "up" : d === "down" ? "down" : "unchanged"}</span>
    </span>
  );
}

export function SessionTag({ session }: { session: MarketSession | undefined }) {
  const s = session ?? "unknown";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
      <span className={`status-dot ${s === "open" ? "text-bright" : s === "closed" ? "text-ink-3" : "text-note"}`} />
      {SESSION_LABEL[s]}
    </span>
  );
}

/** Shown next to any figure that comes from the demo provider. */
export function DemoBadge({ className = "" }: { className?: string }) {
  if (!isDemoProvider) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border border-dashed border-line-strong px-1.5 py-0.5 text-[0.7rem] font-semibold text-note ${className}`}
      title="Prices are generated for development and are not real market data."
    >
      Demo data
    </span>
  );
}

/** "Markets online" only when a live provider's health check passes. */
export function MarketsStatus() {
  const health = useMarketHealth();
  if (isDemoProvider) {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-note">
        <span className="status-dot text-note" />
        Demo data — live markets not connected
      </span>
    );
  }
  if (!health.data?.online) {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-ink-2">
        <span className="status-dot text-ink-3" />
        {health.isLoading ? "Checking market data…" : "Market data unavailable"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-bright">
      <span className="status-dot" data-live="true" />
      MARKETS ONLINE
    </span>
  );
}

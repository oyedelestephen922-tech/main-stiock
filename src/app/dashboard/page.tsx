"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { ASSETS } from "@/lib/assets";
import { greeting, formatUsd } from "@/lib/format";
import { useMarketActivity, useQuotes } from "@/hooks/useMarket";
import { useHoldings, usePortfolio, usePortfolioHistory } from "@/hooks/usePortfolio";
import { watchlistStore } from "@/services/stores";
import type { Range } from "@/services/market";
import { StatStrip } from "@/components/dashboard/Stats";
import { PortfolioUnavailable, SampleBanner } from "@/components/dashboard/PortfolioState";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { PriceChart } from "@/components/charts/PriceChart";
import { RangeTabs } from "@/components/charts/RangeTabs";
import { Change, DemoBadge, MarketsStatus } from "@/components/ui/Market";
import { LoadingRows, Skeleton, StateMessage } from "@/components/ui/States";

const noop = () => () => {};

export default function Overview() {
  const hello = useSyncExternalStore(noop, () => greeting(), () => "Welcome back.");
  const view = usePortfolio();
  const positions = view.state === "ready" ? view.positions : [];
  const { totals } = useHoldings(positions);
  const [range, setRange] = useState<Range>("1M");
  const history = usePortfolioHistory(positions, range, view.state === "ready");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="type-title text-[clamp(1.5rem,2.6vw,1.9rem)]">{hello}</h1>
          <p className="mt-1 text-ink-2">Here&apos;s where your markets stand.</p>
        </div>
        <div className="md:hidden">
          <MarketsStatus />
        </div>
      </div>

      {view.state === "ready" && view.source === "sample" && <SampleBanner />}

      <StatStrip
        items={[
          { label: "Portfolio value", value: totals.value, kind: "usd" },
          { label: "Today's change", value: totals.dayChange, kind: "signedUsd", percent: totals.dayChangePct },
          {
            label: "Buying power",
            value: view.state === "ready" ? view.buyingPowerUsd : null,
            kind: "usd",
            note: view.state === "ready" && view.buyingPowerUsd == null ? "Not provided by data source" : undefined,
          },
          { label: "Positions", value: view.state === "ready" ? positions.length : null, kind: "count" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="panel p-4 sm:p-5" aria-labelledby="perf-h">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="perf-h" className="type-title text-base">
              Performance
            </h2>
            <RangeTabs ranges={["1W", "1M", "3M", "1Y"]} value={range} onChange={setRange} disabled={view.state !== "ready"} />
          </div>
          {view.state === "loading" ? (
            <Skeleton className="h-[300px] w-full" />
          ) : view.state !== "ready" ? (
            <PortfolioUnavailable view={view} compact />
          ) : history.data.length > 1 ? (
            <PriceChart points={history.data} range={range} label="Portfolio" height={270} />
          ) : (
            <Skeleton className="h-[300px] w-full" />
          )}
        </section>

        <WatchlistPanel />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <MoversPanel />
        <section className="panel" aria-labelledby="feed-h">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 id="feed-h" className="type-title text-base">
              Market activity
            </h2>
            <DemoBadge />
          </div>
          <FeedBody />
        </section>
      </div>
    </div>
  );
}

function FeedBody() {
  const feed = useMarketActivity();
  if (feed.isLoading) return <LoadingRows rows={4} />;
  if (feed.isError) return <StateMessage compact tone="error" icon="alert" title="Activity unavailable" description="Reconnect and try again." />;
  return <ActivityFeed events={feed.data} limit={6} emptyText="Market activity will appear once an activity source is connected." />;
}

function WatchlistPanel() {
  const list = watchlistStore.useValue();
  const quotes = useQuotes(list);
  return (
    <section className="panel" aria-labelledby="wl-h">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 id="wl-h" className="type-title text-base">
          Watchlist
        </h2>
        <Link href="/dashboard/watchlist" className="text-sm font-medium text-electric hover:underline">
          Manage
        </Link>
      </div>
      {list.length === 0 ? (
        <StateMessage
          compact
          icon="star"
          title="Nothing on your watchlist"
          description="Star assets from Markets to follow them here."
          action={
            <Link href="/markets" className="btn btn-secondary btn-sm">
              Explore markets
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-line">
          {list.slice(0, 6).map((t) => {
            const q = quotes.data?.find((x) => x.ticker === t);
            return (
              <li key={t}>
                <Link href={`/markets/${t}`} className="flex items-center gap-3 px-5 py-3 hover:bg-raised/50">
                  <span className="flex-1 font-semibold text-ink">{t}</span>
                  <span className="text-right">
                    <span className="type-figure block text-sm text-ink">{formatUsd(q?.price)}</span>
                    <Change percent={q?.changePercent} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function MoversPanel() {
  const quotes = useQuotes(ASSETS.map((a) => a.ticker));
  const [mode, setMode] = useState<"up" | "down">("up");
  const rows = useMemo(() => {
    const list = [...(quotes.data ?? [])];
    return mode === "up"
      ? list.filter((q) => q.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 5)
      : list.filter((q) => q.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  }, [quotes.data, mode]);

  return (
    <section className="panel" aria-labelledby="mv-h">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <h2 id="mv-h" className="type-title text-base">
          Movers
        </h2>
        <div role="radiogroup" aria-label="Show" className="flex gap-0.5 rounded-[var(--radius-control)] border border-line p-0.5">
          {(["up", "down"] as const).map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={`h-8 rounded-[5px] px-3 text-xs font-semibold ${mode === m ? "bg-raised text-electric" : "text-ink-2 hover:text-ink"}`}
            >
              {m === "up" ? "Gainers" : "Losers"}
            </button>
          ))}
        </div>
      </div>
      {quotes.isLoading ? (
        <LoadingRows rows={5} />
      ) : rows.length === 0 ? (
        <StateMessage compact icon="markets" title={mode === "up" ? "No gainers right now" : "No losers right now"} />
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((q) => (
            <li key={q.ticker}>
              <Link href={`/markets/${q.ticker}`} className="flex items-center gap-3 px-5 py-3 hover:bg-raised/50">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{q.ticker}</span>
                  <span className="block truncate text-xs text-ink-2">{ASSETS.find((a) => a.ticker === q.ticker)?.name}</span>
                </span>
                <span className="type-figure text-sm text-ink">{formatUsd(q.price)}</span>
                <span className="w-24 text-right">
                  <Change percent={q.changePercent} pill />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

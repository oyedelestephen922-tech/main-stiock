"use client";

import Link from "next/link";
import { useState } from "react";
import { getAsset } from "@/lib/assets";
import { formatCompact, formatUsd, timeAgo } from "@/lib/format";
import { useHistory, useMarketActivity, useQuote, useQuotes } from "@/hooks/useMarket";
import type { Range } from "@/services/market";
import { PriceChart } from "@/components/charts/PriceChart";
import { TradePanel } from "@/components/trade/TradePanel";
import { WatchStar } from "@/components/markets/WatchStar";
import { Change, DemoBadge, SessionTag } from "@/components/ui/Market";
import { Skeleton, StateMessage } from "@/components/ui/States";
import { Icon } from "@/components/ui/Icon";
import { RangeTabs } from "@/components/charts/RangeTabs";
import { Footer } from "@/components/layout/Footer";

const RANGES: Range[] = ["1D", "1W", "1M", "3M", "1Y", "5Y"];

export function AssetView({ ticker }: { ticker: string }) {
  const asset = getAsset(ticker)!;
  const [range, setRange] = useState<Range>("1M");
  const quote = useQuote(ticker);
  const history = useHistory(ticker, range);
  const activity = useMarketActivity(ticker);
  const related = useQuotes(asset.related);
  const q = quote.data;

  const stats: [string, string][] = [
    ["Open", formatUsd(q?.open)],
    ["Previous close", formatUsd(q?.prevClose)],
    ["Day high", formatUsd(q?.high)],
    ["Day low", formatUsd(q?.low)],
    ["52-week high", formatUsd(q?.high52w)],
    ["52-week low", formatUsd(q?.low52w)],
    ["Volume", formatCompact(q?.volume)],
    ["Sector", asset.sector],
  ];

  return (
    <>
      <div className="mx-auto max-w-[1400px] px-4 pt-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-3">
          <Link href="/markets" className="hover:text-electric">
            Markets
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink-2">{asset.ticker}</span>
        </nav>

        {/* header */}
        <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="type-title text-[clamp(1.5rem,3vw,2.1rem)]">{asset.ticker}</h1>
                <WatchStar ticker={asset.ticker} size={20} />
              </div>
              <p className="text-ink-2">{asset.name}</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            {quote.isLoading ? (
              <Skeleton className="h-10 w-44" />
            ) : (
              <p className="type-figure text-[clamp(1.7rem,3.5vw,2.4rem)] leading-none text-ink">{formatUsd(q?.price)}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 sm:justify-end">
              <Change percent={q?.changePercent} amount={q?.change} size="md" />
              <span className="text-xs text-ink-3">24h</span>
              <SessionTag session={q?.session} />
              <DemoBadge />
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <section className="panel p-4 sm:p-5" aria-label="Price chart">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="type-title text-base">Price</h2>
                <RangeTabs ranges={RANGES} value={range} onChange={setRange} />
              </div>
              {history.isError ? (
                <StateMessage tone="error" icon="alert" title="Chart data unavailable" description="Reconnect and try again." />
              ) : history.data && history.data.length > 1 ? (
                <div className={history.isFetching ? "opacity-70 transition-opacity" : ""}>
                  <PriceChart points={history.data} range={range} label={asset.ticker} height={340} />
                </div>
              ) : (
                <Skeleton className="h-[370px] w-full" />
              )}
            </section>

            <section className="panel" aria-labelledby="stats-h">
              <h2 id="stats-h" className="type-title border-b border-line px-5 py-4 text-base">
                Market statistics
              </h2>
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-b-[var(--radius-panel)] bg-line sm:grid-cols-4">
                {stats.map(([k, v]) => (
                  <div key={k} className="bg-surface px-5 py-4">
                    <dt className="text-xs text-ink-3">{k}</dt>
                    <dd className="type-figure mt-1 text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="panel p-5" aria-labelledby="about-h">
                <h2 id="about-h" className="type-title text-base">
                  About {asset.name}
                </h2>
                <p className="mt-3 text-ink-2">{asset.about}</p>
                <p className="mt-4 text-sm text-ink-3">
                  {asset.kind === "index" ? "Index fund" : "Common stock"} · {asset.sector}
                </p>
              </section>

              <section className="panel" aria-labelledby="act-h">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <h2 id="act-h" className="type-title text-base">
                    Recent activity
                  </h2>
                  <DemoBadge />
                </div>
                {activity.data && activity.data.length > 0 ? (
                  <ul className="divide-y divide-line">
                    {activity.data.slice(0, 5).map((e) => (
                      <li key={e.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                        <span className={`w-20 text-xs font-bold tracking-wider ${e.kind === "BUY" ? "text-electric" : e.kind === "SELL" ? "text-down" : "text-note"}`}>
                          {e.kind}
                        </span>
                        <span className="type-figure flex-1 text-ink">{e.amountUsd != null ? formatUsd(e.amountUsd) : "Added to watchlist"}</span>
                        <span className="text-xs text-ink-3">{timeAgo(e.ts)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <StateMessage compact icon="activity" title="No recent activity" description="Activity will appear here once trading data is connected." />
                )}
              </section>
            </div>

            <section aria-labelledby="rel-h">
              <h2 id="rel-h" className="type-title mb-3 text-base">
                Related assets
              </h2>
              <ul className="grid gap-3 sm:grid-cols-3">
                {asset.related.map((t) => {
                  const r = related.data?.find((x) => x.ticker === t);
                  return (
                    <li key={t}>
                      <Link href={`/markets/${t}`} className="panel panel-interactive flex items-center gap-3 p-4">
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-ink">{t}</span>
                          <span className="block truncate text-xs text-ink-2">{getAsset(t)?.name}</span>
                        </span>
                        <span className="text-right">
                          <span className="type-figure block text-sm text-ink">{formatUsd(r?.price)}</span>
                          <Change percent={r?.changePercent} />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Trade panel">
            <TradePanel ticker={asset.ticker} />
            <p className="mt-3 flex items-start gap-2 px-1 text-xs text-ink-3">
              <Icon name="shield" size={14} className="mt-0.5 shrink-0" />
              Prices move. Review every order before you confirm it in your wallet.
            </p>
          </aside>
        </div>
      </div>
      <Footer />
    </>
  );
}

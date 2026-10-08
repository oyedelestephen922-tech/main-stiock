"use client";

import { useMemo, useState } from "react";
import { ASSETS, searchAssets } from "@/lib/assets";
import { useQuotes } from "@/hooks/useMarket";
import { watchlistStore } from "@/services/stores";
import type { Quote } from "@/services/market";
import { MarketList } from "@/components/markets/MarketList";
import { DemoBadge } from "@/components/ui/Market";
import { LoadingRows, StateMessage } from "@/components/ui/States";
import { Icon } from "@/components/ui/Icon";
import { Footer } from "@/components/layout/Footer";
import { useSearch } from "@/components/search/SearchPalette";

const CATEGORIES = ["All", "Stocks", "Indexes", "Popular", "Top Gainers", "Top Losers", "Watchlist"] as const;
type Category = (typeof CATEGORIES)[number];

const kind = (t: string) => ASSETS.find((a) => a.ticker === t)?.kind;

function applyCategory(cat: Category, quotes: Quote[], watch: string[]): Quote[] {
  switch (cat) {
    case "Stocks":
      return quotes.filter((q) => kind(q.ticker) === "stock");
    case "Indexes":
      return quotes.filter((q) => kind(q.ticker) === "index");
    case "Popular":
      return quotes.some((q) => q.volume != null)
        ? [...quotes].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)).slice(0, 6)
        : quotes.filter((q) => ["NVDA", "AAPL", "TSLA", "MSFT", "AMZN", "META"].includes(q.ticker));
    case "Top Gainers":
      return quotes.filter((q) => q.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent);
    case "Top Losers":
      return quotes.filter((q) => q.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent);
    case "Watchlist":
      return watch.map((t) => quotes.find((q) => q.ticker === t)).filter(Boolean) as Quote[];
    default:
      return quotes;
  }
}

export default function MarketsPage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category>("All");
  const watch = watchlistStore.useValue();
  const quotes = useQuotes(ASSETS.map((a) => a.ticker));
  const { open: openSearch } = useSearch();

  const rows = useMemo(() => {
    const allowed = new Set(searchAssets(query).map((a) => a.ticker));
    return applyCategory(cat, quotes.data ?? [], watch).filter((q) => allowed.has(q.ticker));
  }, [quotes.data, cat, query, watch]);

  return (
    <>
      <div className="mx-auto max-w-[1400px] px-4 pt-10 sm:px-6 sm:pt-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="type-display text-[clamp(1.9rem,4.4vw,3.2rem)]">Explore the market</h1>
            <p className="mt-4 max-w-xl text-ink-2">
              Every asset MainStocks can show, with today&apos;s price and movement. Star anything you want to keep an eye
              on.
            </p>
          </div>
          <DemoBadge />
        </div>

        <div className="panel overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-line p-3 sm:p-4 lg:flex-row lg:items-center">
            <label className="relative block lg:w-72">
              <span className="sr-only">Filter assets</span>
              <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
              <input
                className="field pl-9"
                placeholder="Filter by ticker or name"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setQuery("")}
              />
            </label>
            <div
              role="tablist"
              aria-label="Market categories"
              className="-mx-3 flex gap-1 overflow-x-auto px-3 [scrollbar-width:none] sm:-mx-4 sm:px-4 lg:mx-0 lg:px-0"
            >
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  role="tab"
                  aria-selected={cat === c}
                  onClick={() => setCat(c)}
                  className={`h-9 shrink-0 rounded-[var(--radius-control)] px-3 text-sm font-medium transition-colors ${
                    cat === c ? "bg-brand text-on-brand" : "text-ink-2 hover:bg-raised hover:text-ink"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <button onClick={openSearch} className="ml-auto hidden items-center gap-2 text-xs text-ink-3 hover:text-ink-2 xl:flex">
              Quick search <span className="kbd">/</span>
            </button>
          </div>

          <div role="tabpanel" aria-label={cat}>
            {quotes.isLoading ? (
              <LoadingRows rows={8} />
            ) : quotes.isError ? (
              <StateMessage
                tone="error"
                icon="alert"
                title="Market data unavailable"
                description="Reconnect and try again."
                action={
                  <button className="btn btn-secondary btn-sm" onClick={() => quotes.refetch()}>
                    Try again
                  </button>
                }
              />
            ) : rows.length === 0 ? (
              cat === "Watchlist" && !query ? (
                <StateMessage
                  icon="star"
                  title="Your watchlist is empty"
                  description="Tap the star next to any asset to follow it here."
                  action={
                    <button className="btn btn-secondary btn-sm" onClick={() => setCat("All")}>
                      Browse all markets
                    </button>
                  }
                />
              ) : (
                <StateMessage
                  icon="search"
                  title="No matching assets"
                  description={query ? `Nothing in ${cat} matches “${query}”.` : `Nothing in ${cat} right now.`}
                  action={
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setQuery("");
                        setCat("All");
                      }}
                    >
                      Clear filters
                    </button>
                  }
                />
              )
            ) : (
              <MarketList quotes={rows} />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

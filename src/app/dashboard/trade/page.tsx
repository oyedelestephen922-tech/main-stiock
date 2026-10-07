"use client";

import { useState } from "react";
import { getAsset } from "@/lib/assets";
import { useHistory, useQuote } from "@/hooks/useMarket";
import type { Range } from "@/services/market";
import { PageHeader } from "@/components/layout/PageHeader";
import { TradePanel } from "@/components/trade/TradePanel";
import { PriceChart } from "@/components/charts/PriceChart";
import { RangeTabs } from "@/components/charts/RangeTabs";
import { Change, DemoBadge, SessionTag } from "@/components/ui/Market";
import { Skeleton } from "@/components/ui/States";
import { formatUsd } from "@/lib/format";

export default function TradePage() {
  const [ticker, setTicker] = useState("NVDA");
  const [range, setRange] = useState<Range>("1D");
  const quote = useQuote(ticker);
  const history = useHistory(ticker, range);

  return (
    <>
      <PageHeader title="Trade" description="Pick an asset, set an amount, review the details, then confirm in your wallet." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="panel order-2 p-4 sm:p-5 xl:order-1" aria-label={`${ticker} chart`}>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-ink-2">{getAsset(ticker)?.name}</p>
              <p className="flex items-baseline gap-3">
                <span className="type-title text-2xl">{ticker}</span>
                <span className="type-figure text-2xl text-ink">{formatUsd(quote.data?.price)}</span>
                <Change percent={quote.data?.changePercent} />
              </p>
              <div className="mt-1 flex items-center gap-3">
                <SessionTag session={quote.data?.session} />
                <DemoBadge />
              </div>
            </div>
            <RangeTabs ranges={["1D", "1W", "1M", "3M", "1Y"]} value={range} onChange={setRange} />
          </div>
          {history.data && history.data.length > 1 ? (
            <PriceChart points={history.data} range={range} label={ticker} height={380} />
          ) : (
            <Skeleton className="h-[410px] w-full" />
          )}
        </section>
        <div className="order-1 xl:order-2">
          <TradePanel onTickerChange={setTicker} />
        </div>
      </div>
    </>
  );
}

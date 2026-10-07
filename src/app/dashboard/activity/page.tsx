"use client";

import { useMarketActivity } from "@/hooks/useMarket";
import { localActivityStore } from "@/services/stores";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DemoBadge } from "@/components/ui/Market";
import { LoadingRows, StateMessage } from "@/components/ui/States";

export default function ActivityPage() {
  const mine = localActivityStore.useValue();
  const market = useMarketActivity();

  return (
    <>
      <PageHeader title="Activity" description="What you've done here, and what's happening across the market." />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="panel" aria-labelledby="mine-h">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 id="mine-h" className="type-title text-base">
              Your activity
            </h2>
            {mine.length > 0 && (
              <button className="text-xs font-medium text-ink-2 hover:text-ink" onClick={() => localActivityStore.set([])}>
                Clear
              </button>
            )}
          </div>
          <ActivityFeed events={mine} limit={50} emptyText="Watchlist changes you make on this device will be listed here." />
          <p className="border-t border-line px-5 py-3 text-xs text-ink-3">
            Stored only in this browser. Trades will appear here once trading is connected.
          </p>
        </section>

        <section className="panel" aria-labelledby="mkt-h">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 id="mkt-h" className="type-title text-base">
              Market activity
            </h2>
            <DemoBadge />
          </div>
          {market.isLoading ? (
            <LoadingRows rows={6} />
          ) : market.isError ? (
            <StateMessage tone="error" icon="alert" title="Activity unavailable" description="Reconnect and try again." />
          ) : (
            <ActivityFeed events={market.data} limit={12} emptyText="Connect an activity source to see market-wide trades." />
          )}
        </section>
      </div>
    </>
  );
}

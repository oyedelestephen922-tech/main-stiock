"use client";

import Link from "next/link";
import { useState } from "react";
import { getAsset } from "@/lib/assets";
import { formatNumber, formatPercent, formatSignedUsd, formatUsd, direction } from "@/lib/format";
import { useHoldings, usePortfolio, usePortfolioHistory } from "@/hooks/usePortfolio";
import type { Range } from "@/services/market";
import type { Holding } from "@/services/portfolio";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatStrip } from "@/components/dashboard/Stats";
import { PortfolioUnavailable, SampleBanner } from "@/components/dashboard/PortfolioState";
import { PriceChart } from "@/components/charts/PriceChart";
import { RangeTabs } from "@/components/charts/RangeTabs";
import { DemoBadge } from "@/components/ui/Market";
import { LoadingRows, Skeleton, StateMessage } from "@/components/ui/States";

const RANGES: Range[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

function Pnl({ value, pct }: { value: number | null; pct: number | null }) {
  const d = direction(value);
  return (
    <span className={`type-figure ${d === "up" ? "text-up" : d === "down" ? "text-down" : "text-ink-2"}`}>
      {value == null ? "—" : formatSignedUsd(value)}
      {pct != null && <span className="ml-1.5 text-xs opacity-80">{formatPercent(pct)}</span>}
    </span>
  );
}

function Allocation({ pct }: { pct: number | null }) {
  return (
    <span className="flex items-center justify-end gap-2.5">
      <span className="type-figure w-12 text-right text-ink-2">{pct == null ? "—" : `${pct.toFixed(1)}%`}</span>
      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-raised" aria-hidden="true">
        <span className="block h-full rounded-full bg-electric" style={{ width: `${pct ?? 0}%` }} />
      </span>
    </span>
  );
}

export default function PortfolioPage() {
  const view = usePortfolio();
  const positions = view.state === "ready" ? view.positions : [];
  const { rows, totals, isLoading } = useHoldings(positions);
  const [range, setRange] = useState<Range>("3M");
  const history = usePortfolioHistory(positions, range, view.state === "ready");
  const ready = view.state === "ready";

  return (
    <>
      <PageHeader title="Portfolio" description="Your positions, how they're performing, and how they're spread." actions={<DemoBadge />} />

      {ready && view.source === "sample" && <SampleBanner />}

      <StatStrip
        items={[
          { label: "Portfolio value", value: totals.value, kind: "usd" },
          { label: "Daily P&L", value: totals.dayChange, kind: "signedUsd", percent: totals.dayChangePct },
          { label: "Total P&L", value: totals.totalPnl, kind: "signedUsd", percent: totals.totalPnlPct },
          {
            label: "Available balance",
            value: ready ? view.buyingPowerUsd : null,
            kind: "usd",
            note: ready && view.buyingPowerUsd == null ? "Not provided by data source" : undefined,
          },
        ]}
      />

      <section className="panel mt-6 p-4 sm:p-5" aria-labelledby="chart-h">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="chart-h" className="type-title text-base">
            Portfolio value
          </h2>
          <RangeTabs ranges={RANGES} value={range} onChange={setRange} disabled={!ready} />
        </div>
        {view.state === "loading" ? (
          <Skeleton className="h-[380px] w-full" />
        ) : !ready ? (
          <PortfolioUnavailable view={view} />
        ) : history.data.length > 1 ? (
          <PriceChart points={history.data} range={range} label="Portfolio" height={360} />
        ) : history.loading ? (
          <Skeleton className="h-[380px] w-full" />
        ) : (
          <StateMessage icon="portfolio" title="No history for this range" />
        )}
      </section>

      <section className="panel mt-6 overflow-hidden" aria-labelledby="hold-h">
        <h2 id="hold-h" className="type-title border-b border-line px-5 py-4 text-base">
          Holdings
        </h2>
        {!ready ? (
          view.state === "loading" ? <LoadingRows rows={4} /> : <StateMessage compact icon="portfolio" title="No holdings to show" description="Holdings appear here once positions are available." />
        ) : isLoading ? (
          <LoadingRows rows={positions.length || 4} />
        ) : rows.length === 0 ? (
          <StateMessage
            icon="portfolio"
            title="You don't hold anything yet"
            description="Buy an asset and it will show up here."
            action={
              <Link href="/dashboard/trade" className="btn btn-primary btn-sm">
                Start a trade
              </Link>
            }
          />
        ) : (
          <HoldingsTable rows={rows} />
        )}
      </section>
    </>
  );
}

function HoldingsTable({ rows }: { rows: Holding[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-3">
              <th scope="col" className="py-3 pl-5 font-medium">Asset</th>
              <th scope="col" className="py-3 text-right font-medium">Price</th>
              <th scope="col" className="py-3 text-right font-medium">Holdings</th>
              <th scope="col" className="py-3 text-right font-medium">Average price</th>
              <th scope="col" className="py-3 text-right font-medium">P&amp;L</th>
              <th scope="col" className="py-3 pr-5 text-right font-medium">Allocation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.ticker} className="hover:bg-raised/50">
                <td className="py-3 pl-5">
                  <Link href={`/markets/${r.ticker}`} className="flex items-center gap-3">
                    <span>
                      <span className="block font-semibold text-ink">{r.ticker}</span>
                      <span className="block text-xs text-ink-2">{getAsset(r.ticker)?.name}</span>
                    </span>
                  </Link>
                </td>
                <td className="type-figure py-3 text-right text-ink">{formatUsd(r.price)}</td>
                <td className="py-3 text-right">
                  <span className="type-figure block text-ink">{formatUsd(r.value)}</span>
                  <span className="text-xs text-ink-3">
                    {formatNumber(r.quantity, 4)} shares
                  </span>
                </td>
                <td className="type-figure py-3 text-right text-ink-2">{r.avgPrice > 0 ? formatUsd(r.avgPrice) : "—"}</td>
                <td className="py-3 text-right">
                  <Pnl value={r.pnl} pct={r.pnlPct} />
                </td>
                <td className="py-3 pr-5">
                  <Allocation pct={r.allocation} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {rows.map((r) => (
          <li key={r.ticker} className="px-4 py-4">
            <Link href={`/markets/${r.ticker}`} className="flex items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{r.ticker}</span>
                <span className="block text-xs text-ink-2">{formatNumber(r.quantity, 4)} shares</span>
              </span>
              <span className="type-figure text-ink">{formatUsd(r.value)}</span>
            </Link>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <dt className="text-ink-3">Price</dt>
                <dd className="type-figure mt-0.5 text-ink">{formatUsd(r.price)}</dd>
              </div>
              <div>
                <dt className="text-ink-3">Avg price</dt>
                <dd className="type-figure mt-0.5 text-ink-2">{r.avgPrice > 0 ? formatUsd(r.avgPrice) : "—"}</dd>
              </div>
              <div className="text-right">
                <dt className="text-ink-3">P&amp;L</dt>
                <dd className="mt-0.5">
                  <Pnl value={r.pnl} pct={null} />
                </dd>
              </div>
            </dl>
            <div className="mt-3">
              <Allocation pct={r.allocation} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

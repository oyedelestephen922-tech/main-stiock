"use client";

import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { getAsset } from "@/lib/assets";
import { formatUsd } from "@/lib/format";
import { marketData, type Quote } from "@/services/market";
import { Sparkline } from "../charts/Sparkline";
import { Change, SessionTag } from "../ui/Market";
import { WatchStar } from "./WatchStar";

function useSparklines(tickers: string[]) {
  const results = useQueries({
    queries: tickers.map((t) => ({
      queryKey: ["history", t, "1D"],
      queryFn: () => marketData.getHistory(t, "1D"),
      staleTime: 60_000,
    })),
  });
  return new Map(tickers.map((t, i) => [t, results[i]?.data]));
}

/** Market rows: a table on wide screens, stacked cards on phones. */
export function MarketList({ quotes, showStatus = true }: { quotes: Quote[]; showStatus?: boolean }) {
  const sparks = useSparklines(quotes.map((q) => q.ticker));

  return (
    <>
      {/* table ≥ md */}
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-line text-left text-xs text-ink-3">
            <th scope="col" className="w-10 py-3 pl-4 font-medium">
              <span className="sr-only">Watchlist</span>
            </th>
            <th scope="col" className="py-3 font-medium">Asset</th>
            <th scope="col" className="py-3 text-right font-medium">Price</th>
            <th scope="col" className="py-3 text-right font-medium">24h change</th>
            <th scope="col" className="hidden py-3 pl-8 font-medium lg:table-cell">Today</th>
            {showStatus && <th scope="col" className="hidden py-3 font-medium xl:table-cell">Status</th>}
            <th scope="col" className="py-3 pr-4 text-right font-medium">
              <span className="sr-only">Action</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {quotes.map((q) => {
            const a = getAsset(q.ticker);
            return (
              <tr key={q.ticker} className="group transition-colors hover:bg-raised/50">
                <td className="py-3 pl-4">
                  <WatchStar ticker={q.ticker} />
                </td>
                <td className="py-3">
                  <Link href={`/markets/${q.ticker}`} className="flex items-center gap-3 rounded-md">
                    <span>
                      <span className="block font-semibold text-ink">{q.ticker}</span>
                      <span className="block text-xs text-ink-2">{a?.name}</span>
                    </span>
                  </Link>
                </td>
                <td className="type-figure py-3 text-right text-[0.95rem] text-ink">{formatUsd(q.price)}</td>
                <td className="py-3 text-right">
                  <Change percent={q.changePercent} pill />
                </td>
                <td className="hidden py-3 pl-8 lg:table-cell">
                  <Sparkline points={sparks.get(q.ticker)} width={110} height={30} />
                </td>
                {showStatus && (
                  <td className="hidden py-3 xl:table-cell">
                    <SessionTag session={q.session} />
                  </td>
                )}
                <td className="py-3 pr-4 text-right">
                  <Link
                    href={`/markets/${q.ticker}`}
                    className="btn btn-secondary btn-sm"
                    aria-label={`View ${q.ticker}`}
                  >
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* cards < md */}
      <ul className="divide-y divide-line md:hidden">
        {quotes.map((q) => (
          <li key={q.ticker} className="flex items-center gap-3 px-3 py-3">
            <WatchStar ticker={q.ticker} />
            <Link href={`/markets/${q.ticker}`} className="flex min-w-0 flex-1 items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{q.ticker}</span>
                <span className="block truncate text-xs text-ink-2">{getAsset(q.ticker)?.name}</span>
              </span>
              <Sparkline points={sparks.get(q.ticker)} width={56} height={26} className="hidden xs:block" />
              <span className="text-right">
                <span className="type-figure block text-ink">{formatUsd(q.price)}</span>
                <Change percent={q.changePercent} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

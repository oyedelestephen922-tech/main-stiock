"use client";

import Link from "next/link";
import type { Quote } from "@/services/market";
import { formatUsd } from "@/lib/format";
import { Change, DemoBadge } from "../ui/Market";
import { isDemoProvider } from "@/hooks/useMarket";

export function TickerTape({ quotes }: { quotes: Quote[] | undefined }) {
  if (!quotes?.length) {
    return <div className="h-12 border-y border-line" aria-hidden="true" />;
  }
  const items = [...quotes, ...quotes];
  return (
    <section aria-label="Market prices" className="tape relative flex h-12 items-center overflow-hidden border-y border-line bg-surface/40">
      <div className="z-10 flex h-full shrink-0 items-center border-r border-line bg-bg px-4">
        {isDemoProvider ? <DemoBadge /> : <span className="text-xs font-semibold text-ink-2">Prices</span>}
      </div>
      <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
        <ul className="tape-track flex w-max items-center">
          {items.map((q, i) => (
            <li key={`${q.ticker}-${i}`} aria-hidden={i >= quotes.length ? true : undefined}>
              <Link
                href={`/markets/${q.ticker}`}
                tabIndex={i >= quotes.length ? -1 : undefined}
                className="flex items-center gap-2.5 px-6 text-sm hover:text-electric"
              >
                <span className="font-semibold text-ink">{q.ticker}</span>
                <span className="type-figure text-ink-2">{formatUsd(q.price)}</span>
                <Change percent={q.changePercent} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

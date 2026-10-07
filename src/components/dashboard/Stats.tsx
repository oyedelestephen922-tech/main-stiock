"use client";

import type { ReactNode } from "react";
import { useCountUp } from "@/hooks/useMotion";
import { DASH, direction, formatPercent, formatSignedUsd, formatUsd } from "@/lib/format";

export interface StatItem {
  label: string;
  value: number | null;
  kind: "usd" | "signedUsd" | "count";
  percent?: number | null;
  note?: ReactNode;
}

function AnimatedFigure({ value, kind }: { value: number | null; kind: StatItem["kind"] }) {
  const v = useCountUp(value);
  if (kind === "count") return <>{v == null ? DASH : Math.round(v)}</>;
  if (kind === "signedUsd") return <>{formatSignedUsd(v)}</>;
  return <>{formatUsd(v)}</>;
}

/** One panel, divided into figures — reads like a terminal header, not a row of cards. */
export function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <dl className="panel grid grid-cols-2 gap-px overflow-hidden bg-line lg:grid-cols-4">
      {items.map((s, i) => {
        const d = s.kind === "signedUsd" ? direction(s.value) : "flat";
        return (
          <div key={s.label} className={`bg-surface px-4 py-5 sm:px-6 ${i === 0 ? "relative" : ""}`}>
            {i === 0 && <span aria-hidden="true" className="absolute inset-y-4 left-0 w-[2px] rounded-full bg-electric shadow-[0_0_10px_var(--glow)]" />}
            <dt className="text-xs text-ink-2">{s.label}</dt>
            <dd className="mt-2">
              <span
                className={`type-figure block text-[clamp(1.2rem,2vw,1.65rem)] leading-none ${
                  d === "up" ? "text-up" : d === "down" ? "text-down" : "text-ink"
                }`}
              >
                <AnimatedFigure value={s.value} kind={s.kind} />
              </span>
              {s.percent !== undefined && (
                <span className={`type-figure mt-1.5 block text-sm ${direction(s.percent) === "down" ? "text-down" : direction(s.percent) === "up" ? "text-up" : "text-ink-3"}`}>
                  {formatPercent(s.percent)}
                </span>
              )}
              {s.note && <span className="mt-1.5 block text-xs text-ink-3">{s.note}</span>}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

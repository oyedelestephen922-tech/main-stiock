"use client";

import type { Range } from "@/services/market";

export function RangeTabs({
  ranges,
  value,
  onChange,
  disabled = false,
}: {
  ranges: Range[];
  value: Range;
  onChange: (r: Range) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Time range" className="flex gap-0.5 rounded-[var(--radius-control)] border border-line p-0.5">
      {ranges.map((r) => (
        <button
          key={r}
          role="radio"
          aria-checked={value === r}
          disabled={disabled}
          onClick={() => onChange(r)}
          className={`h-8 min-w-10 rounded-[5px] px-2 text-xs font-semibold tabular transition-colors disabled:opacity-40 ${
            value === r ? "bg-raised text-electric" : "text-ink-2 hover:text-ink"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

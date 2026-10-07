"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { getAsset, searchAssets } from "@/lib/assets";
import { formatUsd } from "@/lib/format";
import { useQuotes } from "@/hooks/useMarket";
import { useWatchlist } from "@/hooks/useWatchlist";
import { PageHeader } from "@/components/layout/PageHeader";
import { Change, DemoBadge } from "@/components/ui/Market";
import { LoadingRows, StateMessage } from "@/components/ui/States";
import { Icon } from "@/components/ui/Icon";
import { WatchStar } from "@/components/markets/WatchStar";

export default function WatchlistPage() {
  const { list, toggle, move, reorder } = useWatchlist();
  const quotes = useQuotes(list);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => searchAssets(query).filter((a) => !list.includes(a.ticker)).slice(0, 6), [query, list]);

  const add = (t: string) => {
    toggle(t);
    setFlash(t);
    setQuery("");
    setTimeout(() => setFlash(null), 800);
    inputRef.current?.focus();
  };

  return (
    <>
      <PageHeader title="Watchlist" description="The assets you're following. Drag to reorder, or use the arrows." actions={<DemoBadge />} />

      <div className="relative mb-6 max-w-lg">
        <label htmlFor="wl-add" className="sr-only">
          Add an asset to your watchlist
        </label>
        <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-[22px] -translate-y-1/2 text-ink-3" />
        <input
          id="wl-add"
          ref={inputRef}
          className="field pl-9"
          placeholder="Add an asset — try “Tesla” or “AMD”"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && suggestions[0]) add(suggestions[0].ticker);
            if (e.key === "Escape") setQuery("");
          }}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls="wl-suggest"
        />
        {focused && suggestions.length > 0 && (
          <ul id="wl-suggest" role="listbox" className="panel glass rise-in absolute z-20 mt-2 w-full p-1.5">
            {suggestions.map((a) => (
              <li key={a.ticker} role="option" aria-selected={false}>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => add(a.ticker)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-raised"
                >
                  <span className="flex-1">
                    <span className="font-semibold text-ink">{a.ticker}</span>
                    <span className="ml-2 text-sm text-ink-2">{a.name}</span>
                  </span>
                  <span className="text-xs font-semibold text-electric">Add</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <section className="panel overflow-hidden" aria-label="Watchlist">
        {list.length === 0 ? (
          <StateMessage
            icon="star"
            title="Start your watchlist"
            description="Search above to add an asset, or star anything on the Markets page."
            action={
              <Link href="/markets" className="btn btn-secondary btn-sm">
                Explore markets
              </Link>
            }
          />
        ) : quotes.isLoading ? (
          <LoadingRows rows={list.length} />
        ) : (
          <ol>
            {list.map((t, i) => {
              const q = quotes.data?.find((x) => x.ticker === t);
              return (
                <li
                  key={t}
                  draggable
                  onDragStart={(e) => {
                    setDragging(i);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOver(i);
                  }}
                  onDragEnd={() => {
                    setDragging(null);
                    setOver(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragging != null) reorder(dragging, i);
                    setDragging(null);
                    setOver(null);
                  }}
                  className={`flex items-center gap-2 border-b border-line px-2 py-2.5 last:border-b-0 sm:gap-3 sm:px-4 ${
                    flash === t ? "flash-added" : ""
                  } ${dragging === i ? "opacity-40" : ""} ${over === i && dragging !== i ? "bg-raised shadow-[inset_0_2px_0_var(--electric)]" : ""}`}
                >
                  <span className="hidden cursor-grab text-ink-3 sm:block" aria-hidden="true">
                    <Icon name="grip" size={18} strokeWidth={3} />
                  </span>
                  <WatchStar ticker={t} />
                  <Link href={`/markets/${t}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">{t}</span>
                      <span className="block truncate text-xs text-ink-2">{getAsset(t)?.name}</span>
                    </span>
                  </Link>
                  <span className="text-right">
                    <span className="type-figure block text-ink">{formatUsd(q?.price)}</span>
                    <Change percent={q?.changePercent} />
                  </span>
                  <span className="ml-1 flex flex-col">
                    <button
                      className="grid size-7 place-items-center rounded text-ink-3 hover:bg-raised hover:text-ink disabled:opacity-30"
                      onClick={() => move(t, -1)}
                      disabled={i === 0}
                      aria-label={`Move ${t} up`}
                    >
                      <Icon name="arrowUp" size={13} />
                    </button>
                    <button
                      className="grid size-7 place-items-center rounded text-ink-3 hover:bg-raised hover:text-ink disabled:opacity-30"
                      onClick={() => move(t, 1)}
                      disabled={i === list.length - 1}
                      aria-label={`Move ${t} down`}
                    >
                      <Icon name="arrowDown" size={13} />
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </>
  );
}

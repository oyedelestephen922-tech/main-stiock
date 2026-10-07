"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ASSETS, searchAssets } from "@/lib/assets";
import { formatUsd } from "@/lib/format";
import { useQuotes } from "@/hooks/useMarket";
import { Change, DemoBadge } from "../ui/Market";
import { Icon } from "../ui/Icon";

const SearchContext = createContext<{ open: () => void }>({ open: () => {} });
export const useSearch = () => useContext(SearchContext);

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !isTypingTarget(e.target)) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <SearchContext.Provider value={{ open }}>
      {children}
      {isOpen && <SearchPalette onClose={() => setOpen(false)} />}
    </SearchContext.Provider>
  );
}

function SearchPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchAssets(query), [query]);
  const quotes = useQuotes(ASSETS.map((a) => a.ticker));
  const byTicker = useMemo(() => new Map((quotes.data ?? []).map((q) => [q.ticker, q])), [quotes.data]);

  useEffect(() => {
    input.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const go = (ticker: string) => {
    onClose();
    router.push(`/markets/${ticker}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active].ticker);
    }
  };

  return (
    <div className="fade-in fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search assets"
        className="panel rise-in mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl overflow-hidden bg-surface"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Icon name="search" size={18} className="text-electric" />
          <input
            ref={input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search by ticker or company"
            className="h-14 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-3"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            aria-activedescendant={results[active] ? `sr-${results[active].ticker}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <span className="kbd">Esc</span>
        </div>

        {results.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-ink-2">
            No assets match “{query}”. Try a ticker like NVDA or a name like Apple.
          </p>
        ) : (
          <ul id="search-results" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
            {results.map((a, i) => {
              const q = byTicker.get(a.ticker);
              return (
                <li
                  key={a.ticker}
                  id={`sr-${a.ticker}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(a.ticker)}
                  className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 ${
                    i === active ? "bg-raised" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{a.ticker}</p>
                    <p className="truncate text-xs text-ink-2">{a.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="type-figure text-sm text-ink">{formatUsd(q?.price)}</p>
                    <Change percent={q?.changePercent} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-xs text-ink-3">
          <span className="flex items-center gap-1.5">
            <span className="kbd">↑</span>
            <span className="kbd">↓</span> to move <span className="kbd ml-2">↵</span> to open
          </span>
          <DemoBadge />
        </div>
      </div>
    </div>
  );
}

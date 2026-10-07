"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "../ui/Icon";
import { MarketsStatus } from "../ui/Market";

const ITEMS: { href: string; label: string; icon: IconName; exact?: boolean }[] = [
  { href: "/dashboard", label: "Overview", icon: "overview", exact: true },
  { href: "/markets", label: "Markets", icon: "markets" },
  { href: "/dashboard/trade", label: "Trade", icon: "trade" },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: "portfolio" },
  { href: "/dashboard/watchlist", label: "Watchlist", icon: "star" },
  { href: "/dashboard/vaults", label: "Vaults", icon: "vault" },
  { href: "/dashboard/activity", label: "Activity", icon: "activity" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
];

const active = (pathname: string, href: string, exact?: boolean) =>
  exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-[72px] hidden h-[calc(100dvh-72px)] w-60 shrink-0 flex-col border-r border-line py-6 pr-4 md:flex">
      <nav aria-label="Dashboard">
        <ul className="space-y-0.5">
          {ITEMS.map((item) => {
            const on = active(pathname, item.href, item.exact);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={on ? "page" : undefined}
                  className={`group relative flex h-10 items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm font-medium transition-colors ${
                    on ? "bg-raised text-ink" : "text-ink-2 hover:bg-raised/60 hover:text-ink"
                  }`}
                >
                  {on && <span className="absolute -left-px top-2 bottom-2 w-[2px] rounded-full bg-electric shadow-[0_0_8px_var(--glow)]" />}
                  <Icon name={item.icon} size={18} className={on ? "text-electric" : "text-ink-3 group-hover:text-ink-2"} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto px-3">
        <MarketsStatus />
      </div>
    </aside>
  );
}

const PRIMARY = ["/dashboard", "/dashboard/trade", "/dashboard/portfolio", "/dashboard/watchlist"];

export function MobileTabBar() {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const primary = ITEMS.filter((i) => PRIMARY.includes(i.href));
  const rest = ITEMS.filter((i) => !PRIMARY.includes(i.href));
  const moreActive = rest.some((i) => active(pathname, i.href, i.exact));

  return (
    <>
      {more && (
        <div className="fade-in fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMore(false)}>
          <nav
            aria-label="More dashboard pages"
            className="panel rise-in absolute inset-x-3 bottom-[76px] p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {rest.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMore(false)}
                className={`flex min-h-12 items-center gap-3 rounded-md px-3 font-medium ${
                  active(pathname, item.href, item.exact) ? "bg-raised text-ink" : "text-ink-2"
                }`}
              >
                <Icon name={item.icon} size={18} className="text-electric" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
      <nav
        aria-label="Dashboard"
        className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-5">
          {primary.map((item) => {
            const on = active(pathname, item.href, item.exact);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={on ? "page" : undefined}
                  className={`flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium ${
                    on ? "text-electric" : "text-ink-2"
                  }`}
                >
                  <Icon name={item.icon} size={20} />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              onClick={() => setMore((v) => !v)}
              aria-expanded={more}
              className={`flex h-16 w-full flex-col items-center justify-center gap-1 text-[0.7rem] font-medium ${
                moreActive || more ? "text-electric" : "text-ink-2"
              }`}
            >
              <Icon name="menu" size={20} />
              More
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}

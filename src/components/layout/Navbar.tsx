"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "../brand/Logo";
import { ThemeToggle } from "../theme/ThemeToggle";
import { WalletButton } from "../wallet/WalletButton";
import { useSearch } from "../search/SearchPalette";
import { Icon } from "../ui/Icon";

export const NAV = [
  { href: "/markets", label: "Markets", icon: "markets" },
  { href: "/dashboard/trade", label: "Trade", icon: "trade" },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: "portfolio" },
  { href: "/dashboard/watchlist", label: "Watchlist", icon: "star" },
  { href: "/dashboard/vaults", label: "Vaults", icon: "vault" },
  { href: "/learn", label: "Learn", icon: "learn" },
] as const;

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const { open: openSearch } = useSearch();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled ? "glass border-line" : "border-transparent bg-bg/40"
      }`}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 btn btn-primary btn-sm">
        Skip to content
      </a>
      <nav
        aria-label="Main"
        className={`mx-auto flex max-w-[1400px] items-center gap-6 px-4 transition-[height] duration-300 sm:px-6 ${
          scrolled ? "h-14" : "h-[72px]"
        }`}
      >
        <Link href="/" aria-label="MainStocks home" className="shrink-0 rounded-md">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors ${
                    active ? "text-ink" : "text-ink-2 hover:text-ink"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-electric shadow-[0_0_8px_var(--glow)]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={openSearch}
            className="hidden h-10 items-center gap-2 rounded-[var(--radius-control)] border border-line bg-surface-2/60 px-3 text-sm text-ink-3 transition-colors hover:border-line-strong hover:text-ink-2 md:flex md:w-52 xl:w-64"
            aria-label="Search assets (press /)"
          >
            <Icon name="search" size={16} />
            <span className="flex-1 text-left">Search markets</span>
            <span className="kbd">/</span>
          </button>
          <button onClick={openSearch} className="btn-ghost grid size-10 place-items-center rounded-md md:hidden" aria-label="Search assets">
            <Icon name="search" size={19} />
          </button>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <div className="hidden sm:block">
            <WalletButton />
          </div>
          <button
            className="btn-ghost grid size-10 place-items-center rounded-md lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Icon name={menuOpen ? "close" : "menu"} size={20} />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="fade-in fixed inset-x-0 bottom-0 top-[inherit] z-40 bg-bg lg:hidden" style={{ top: scrolled ? 56 : 72 }}>
          <div className="flex h-full flex-col overflow-y-auto px-4 pb-8 pt-4">
            <ul className="divide-y divide-line border-y border-line">
              {NAV.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-14 items-center gap-3 px-1 text-lg font-semibold ${active ? "text-electric" : "text-ink"}`}
                      style={{ fontStretch: "112%" }}
                    >
                      <Icon name={item.icon} size={20} className={active ? "text-electric" : "text-ink-3"} />
                      {item.label}
                      <Icon name="chevronRight" size={16} className="ml-auto text-ink-3" />
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-14 items-center gap-3 px-1 text-lg font-semibold text-ink"
                  style={{ fontStretch: "112%" }}
                >
                  <Icon name="overview" size={20} className="text-ink-3" />
                  Dashboard
                  <Icon name="chevronRight" size={16} className="ml-auto text-ink-3" />
                </Link>
              </li>
            </ul>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-ink-2">Theme</span>
              <ThemeToggle withLabel />
            </div>
            <div className="mt-6">
              <WalletButton block />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

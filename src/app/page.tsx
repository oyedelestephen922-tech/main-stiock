"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ASSETS } from "@/lib/assets";
import { config } from "@/lib/config";
import { primaryChain } from "@/lib/wagmi";
import { useQuotes } from "@/hooks/useMarket";
import { HeroNetwork } from "@/components/landing/HeroNetwork";
import { TickerTape } from "@/components/landing/TickerTape";
import { MarketList } from "@/components/markets/MarketList";
import { DemoBadge, MarketsStatus } from "@/components/ui/Market";
import { LoadingRows, StateMessage } from "@/components/ui/States";
import { Icon, type IconName } from "@/components/ui/Icon";
import { MainToken } from "@/components/landing/MainToken";
import { HeroContract } from "@/components/landing/HeroContract";
import { Footer } from "@/components/layout/Footer";

const STEPS = [
  {
    title: "Connect your wallet",
    body: "Use the wallet you already have. Your keys stay with you — MainStocks only sees your public address.",
  },
  {
    title: "Find your market",
    body: "Search by ticker or company, compare movement over time and keep a watchlist of what matters to you.",
  },
  {
    title: "Review, then confirm",
    body: "Every order shows price, fees and slippage before your wallet asks you to approve it. Nothing happens on a single click.",
  },
];

export default function Home() {
  const quotes = useQuotes(ASSETS.map((a) => a.ticker));
  const movers = useMemo(
    () =>
      [...(quotes.data ?? [])]
        .filter((q) => getKind(q.ticker) === "stock")
        .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
        .slice(0, 5),
    [quotes.data],
  );

  const explorer = primaryChain.blockExplorers?.default.url;
  const trust: { icon: IconName; title: string; body: string; status: string; ok: boolean; href?: string }[] = [
    {
      icon: "receipt",
      title: "Verified contracts",
      body: "Contract addresses are published here and verified on the block explorer, so anyone can read the code.",
      status: config.contracts.tradeRouter ? "Published" : "Not deployed yet",
      ok: Boolean(config.contracts.tradeRouter),
      href: config.contracts.tradeRouter && explorer ? `${explorer}/address/${config.contracts.tradeRouter}` : undefined,
    },
    {
      icon: "network",
      title: "On-chain transactions",
      body: "Each trade is a transaction your wallet signs, with a hash you can look up yourself.",
      status: config.contracts.tradeRouter ? "On " + primaryChain.name : "When trading opens",
      ok: Boolean(config.contracts.tradeRouter),
    },
    {
      icon: "ledger",
      title: "Transparent fees",
      body: "Fees appear in the order preview before you confirm — never added afterwards.",
      status: "Shown before every order",
      ok: true,
    },
    {
      icon: "key",
      title: "Secure wallet authentication",
      body: "You sign in with your own wallet. We never ask for a recovery phrase or private key.",
      status: "Active",
      ok: true,
    },
    {
      icon: "shield",
      title: "Auditable infrastructure",
      body: "Contract addresses and ABIs live in public configuration, not hidden code. Independent audit reports will be linked here.",
      status: "Audit pending",
      ok: false,
    },
  ];

  return (
    <>
      {/* ───────── hero ───────── */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_75%_40%,color-mix(in_srgb,var(--brand)_16%,transparent),transparent_70%)]"
        />
        <div className="relative mx-auto grid min-h-[min(820px,calc(100dvh-72px))] max-w-[1400px] grid-rows-[auto_1fr] px-4 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] lg:grid-rows-1">
          <div className="relative z-10 flex flex-col justify-center pb-6 pt-14 lg:py-20">
            <MarketsStatus />
            <h1 className="type-serif mt-6 text-[clamp(2.9rem,6.6vw,5.6rem)] text-ink">
              The market,
              <br />
              <em className="type-serif-accent">built around you.</em>
            </h1>
            <p className="mt-6 max-w-[34rem] text-[1.05rem] leading-relaxed text-ink-2">
              MainStocks brings modern stock-market infrastructure into one intelligent trading experience. Explore
              markets, analyze assets, and manage your positions through a clean, connected interface.
            </p>
            <HeroContract address="0x799bddc837a4304c79276ac3069596e7fb091bbd" />
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/markets" className="btn btn-primary min-h-12 px-6">
                EXPLORE MARKETS
              </Link>
              <Link href="/dashboard" className="btn btn-secondary min-h-12 px-6">
                OPEN DASHBOARD
              </Link>
            </div>
          </div>
          <div className="relative min-h-[340px] lg:-mr-6 lg:min-h-0">
            <HeroNetwork quotes={quotes.data} />
          </div>
        </div>
      </section>

      <TickerTape quotes={quotes.data} />

      {/* ───────── movers ───────── */}
      <section className="mx-auto max-w-[1400px] px-4 pt-24 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="type-title text-[clamp(1.35rem,2.4vw,1.8rem)]">Biggest moves today</h2>
            <p className="mt-2 text-ink-2">The five stocks moving most, up or down.</p>
          </div>
          <div className="flex items-center gap-3">
            <DemoBadge />
            <Link href="/markets" className="btn btn-secondary btn-sm">
              See all markets
            </Link>
          </div>
        </div>
        <div className="panel overflow-hidden">
          {quotes.isLoading ? (
            <LoadingRows rows={5} />
          ) : quotes.isError ? (
            <StateMessage
              tone="error"
              icon="alert"
              title="Market data unavailable"
              description="Reconnect and try again."
              action={
                <button className="btn btn-secondary btn-sm" onClick={() => quotes.refetch()}>
                  Try again
                </button>
              }
            />
          ) : (
            <MarketList quotes={movers} showStatus={false} />
          )}
        </div>
      </section>

      {/* ───────── how it works ───────── */}
      <section className="mx-auto max-w-[1400px] px-4 pt-28 sm:px-6">
        <h2 className="type-title max-w-xl text-[clamp(1.35rem,2.4vw,1.8rem)]">From watchlist to confirmed trade</h2>
        <ol className="relative mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
          <span aria-hidden="true" className="absolute left-0 right-0 top-[19px] hidden h-px bg-gradient-to-r from-electric/60 via-line-strong to-transparent md:block" />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <span className="relative grid size-10 place-items-center rounded-full border border-line-strong bg-bg text-sm font-bold text-electric">
                {i + 1}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-ink" style={{ fontStretch: "108%" }}>
                {s.title}
              </h3>
              <p className="mt-2 max-w-sm text-ink-2">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <MainToken />

      {/* ───────── transparency ───────── */}
      <section id="transparency" className="mx-auto max-w-[1400px] px-4 pt-28 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <h2 className="type-display text-[clamp(1.7rem,3.6vw,2.8rem)]">
              Built for
              <br />
              transparency.
            </h2>
            <p className="mt-5 max-w-md text-ink-2">
              Each status on the right reflects how this MainStocks deployment is actually configured right now. When
              something isn&apos;t live yet, it says so.
            </p>
          </div>
          <ul className="panel divide-y divide-line">
            {trust.map((t) => (
              <li key={t.title} className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <span className="grid size-10 place-items-center rounded-[var(--radius-control)] bg-raised text-electric">
                  <Icon name={t.icon} size={19} />
                </span>
                <div>
                  <h3 className="font-semibold text-ink">{t.title}</h3>
                  <p className="mt-0.5 text-sm text-ink-2">{t.body}</p>
                </div>
                <div className="col-start-2 sm:col-start-auto">
                  {t.href ? (
                    <a href={t.href} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-xs font-semibold text-electric">
                      {t.status} <Icon name="external" size={12} />
                    </a>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${t.ok ? "text-bright" : "text-ink-3"}`}>
                      <span className="status-dot" />
                      {t.status}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Footer />
    </>
  );
}

function getKind(ticker: string) {
  return ASSETS.find((a) => a.ticker === ticker)?.kind;
}

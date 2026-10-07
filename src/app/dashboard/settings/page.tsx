"use client";

import type { ReactNode } from "react";
import { config, isDemoMarketData } from "@/lib/config";
import { primaryChain, supportedChains } from "@/lib/wagmi";
import { tradingStatus } from "@/contracts/tradeRouter";
import { vaultsLive } from "@/services/vaults";
import { localActivityStore, preferencesStore, watchlistStore } from "@/services/stores";
import { PageHeader } from "@/components/layout/PageHeader";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useToast } from "@/components/ui/Toast";

function Row({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-md">
        <p className="font-medium text-ink">{title}</p>
        {description && <p className="mt-0.5 text-sm text-ink-2">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Status({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${ok ? "text-bright" : "text-ink-2"}`}>
      <span className={`status-dot ${ok ? "" : "text-ink-3"}`} />
      {children}
    </span>
  );
}

export default function SettingsPage() {
  const prefs = preferencesStore.useValue();
  const toast = useToast();
  const trading = tradingStatus();

  return (
    <>
      <PageHeader title="Settings" description="Appearance, trading defaults and how this MainStocks deployment is connected." />

      <div className="space-y-6">
        <section className="panel divide-y divide-line" aria-labelledby="pref-h">
          <h2 id="pref-h" className="type-title px-5 py-4 text-base">
            Preferences
          </h2>
          <Row title="Theme" description="Saved in this browser and applied every time you come back.">
            <ThemeToggle withLabel />
          </Row>
          <Row title="Default max slippage" description="The most the price can move against you before an order is rejected.">
            <select
              className="field w-32"
              value={prefs.slippageBps}
              onChange={(e) => preferencesStore.set((p) => ({ ...p, slippageBps: Number(e.target.value) }))}
              aria-label="Default max slippage"
            >
              {[10, 50, 100, 200].map((b) => (
                <option key={b} value={b}>
                  {(b / 100).toFixed(1)}%
                </option>
              ))}
            </select>
          </Row>
          <Row
            title="Show sample portfolio"
            description="Fills the portfolio screens with made-up holdings so you can explore them. Always labelled as a sample."
          >
            <button
              role="switch"
              aria-checked={prefs.showSamplePortfolio}
              aria-label="Show sample portfolio"
              onClick={() => preferencesStore.set((p) => ({ ...p, showSamplePortfolio: !p.showSamplePortfolio }))}
              className={`relative h-7 w-12 rounded-full border transition-colors ${
                prefs.showSamplePortfolio ? "border-electric bg-brand" : "border-line-strong bg-surface-2"
              }`}
            >
              <span
                className={`absolute top-[3px] size-5 rounded-full bg-white shadow transition-transform ${
                  prefs.showSamplePortfolio ? "translate-x-[22px]" : "translate-x-[3px]"
                }`}
              />
            </button>
          </Row>
          <Row title="Reset local data" description="Clears your watchlist, activity and preferences from this browser.">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                watchlistStore.set([]);
                localActivityStore.set([]);
                preferencesStore.set({ slippageBps: 50, showSamplePortfolio: false });
                toast({ tone: "success", title: "Local data cleared" });
              }}
            >
              Reset
            </button>
          </Row>
        </section>

        <section className="panel divide-y divide-line" aria-labelledby="conn-h">
          <h2 id="conn-h" className="type-title px-5 py-4 text-base">
            Connections
          </h2>
          <Row title="Market data" description={isDemoMarketData ? "Using built-in demo data. Set NEXT_PUBLIC_MARKET_DATA_PROVIDER=http and an API URL to go live." : config.market.apiUrl}>
            <Status ok={!isDemoMarketData}>{isDemoMarketData ? "Demo" : "Live API"}</Status>
          </Row>
          <Row title="Network" description={supportedChains.map((c) => `${c.name} (${c.id})`).join(", ")}>
            <Status ok>{primaryChain.name}</Status>
          </Row>
          <Row title="Trading contract" description={trading.available ? config.contracts.tradeRouter : trading.reason}>
            <Status ok={trading.available}>{trading.available ? "Connected" : "Not connected"}</Status>
          </Row>
          <Row title="Vault contracts" description={vaultsLive ? config.contracts.vaultRegistry : "Deposits and withdrawals are off until vault contracts are deployed and wired in."}>
            <Status ok={vaultsLive}>{vaultsLive ? "Connected" : "Not connected"}</Status>
          </Row>
          <Row title="Positions data" description={config.positionsApiUrl || "No positions API configured."}>
            <Status ok={Boolean(config.positionsApiUrl)}>{config.positionsApiUrl ? "Connected" : "Not connected"}</Status>
          </Row>
          <Row title="Mobile wallets (WalletConnect)" description={config.walletConnectProjectId ? "QR-code connections enabled." : "Browser wallets work. Add a WalletConnect project ID to support mobile wallets."}>
            <Status ok={Boolean(config.walletConnectProjectId)}>{config.walletConnectProjectId ? "Enabled" : "Off"}</Status>
          </Row>
        </section>
      </div>
    </>
  );
}

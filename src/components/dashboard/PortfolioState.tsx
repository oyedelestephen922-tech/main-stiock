"use client";

import type { PortfolioView } from "@/hooks/usePortfolio";
import { preferencesStore } from "@/services/stores";
import { StateMessage } from "../ui/States";
import { WalletButton } from "../wallet/WalletButton";
import { Icon } from "../ui/Icon";

/** What to show instead of holdings when there are none we can honestly display. */
export function PortfolioUnavailable({ view, compact }: { view: Exclude<PortfolioView, { state: "ready" }>; compact?: boolean }) {
  const preview = (
    <button
      className="btn btn-ghost btn-sm"
      onClick={() => preferencesStore.set((p) => ({ ...p, showSamplePortfolio: true }))}
    >
      Preview with a sample portfolio
    </button>
  );

  if (view.state === "disconnected") {
    return (
      <StateMessage
        compact={compact}
        icon="wallet"
        title="Wallet disconnected"
        description="Connect your wallet to see your positions and balances."
        action={
          <div className="flex flex-col items-center gap-2">
            <WalletButton />
            {preview}
          </div>
        }
      />
    );
  }
  if (view.state === "unavailable") {
    return (
      <StateMessage
        compact={compact}
        icon="portfolio"
        title="Positions not available yet"
        description={view.reason}
        action={preview}
      />
    );
  }
  if (view.state === "error") {
    return <StateMessage compact={compact} tone="error" icon="alert" title={view.message} description="Reconnect and try again." />;
  }
  return null;
}

export function SampleBanner() {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-[var(--radius-control)] border border-dashed border-line-strong bg-raised/40 px-4 py-3 text-sm">
      <Icon name="info" size={16} className="text-note" />
      <span className="flex-1 text-ink-2">
        <span className="font-semibold text-ink">Sample portfolio.</span> These holdings are made up so you can explore
        the screens. They are not your balances.
      </span>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => preferencesStore.set((p) => ({ ...p, showSamplePortfolio: false }))}
      >
        Hide sample
      </button>
    </div>
  );
}

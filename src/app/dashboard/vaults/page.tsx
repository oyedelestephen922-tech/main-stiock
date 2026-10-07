"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchVaultMetrics, VAULTS, vaultsLive, type VaultDefinition, type VaultMetrics } from "@/services/vaults";
import { formatCompact, formatPercent } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/States";

const RISK_LEVEL = { Lower: 1, Moderate: 2, Higher: 3 } as const;

export default function VaultsPage() {
  const metrics = useQuery({ queryKey: ["vault-metrics"], queryFn: fetchVaultMetrics, staleTime: 60_000 });
  const [open, setOpen] = useState<VaultDefinition | null>(null);

  return (
    <>
      <PageHeader
        title="Vaults"
        description="Strategy vaults hold a basket of assets for you. Deposits and withdrawals open once the vault contracts are live and audited."
      />

      {!vaultsLive && (
        <div className="mb-6 flex items-start gap-3 rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-ink-2">
          <Icon name="info" size={16} className="mt-0.5 shrink-0 text-electric" />
          Vault contracts aren&apos;t deployed yet, so deposits and withdrawals are turned off. No figures below are estimates or
          projections.
        </div>
      )}

      <ul className="grid gap-4 md:grid-cols-2">
        {VAULTS.map((v) => (
          <li key={v.id}>
            <VaultCard vault={v} metrics={metrics.data?.[v.id]} loading={metrics.isLoading} onView={() => setOpen(v)} />
          </li>
        ))}
      </ul>

      <Modal open={open != null} onClose={() => setOpen(null)} title={open?.name ?? ""}>
        {open && (
          <div className="space-y-4 text-sm">
            <p className="text-ink-2">{open.strategy}</p>
            <MetricsGrid metrics={metrics.data?.[open.id]} />
            <p className="text-xs text-ink-3">
              Vaults can lose value. Past performance, once available, will not guarantee future results.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}

function MetricsGrid({ metrics, loading }: { metrics?: VaultMetrics; loading?: boolean }) {
  const cell = (label: string, value: number | null | undefined, fmt: (n: number) => string) => (
    <div className="bg-surface px-4 py-3">
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="mt-1">
        {loading ? (
          <Skeleton className="h-5 w-16" />
        ) : value == null ? (
          <span className="text-sm text-ink-3">Data unavailable</span>
        ) : (
          <span className="type-figure text-lg text-ink">{fmt(value)}</span>
        )}
      </dd>
    </div>
  );
  return (
    <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-[var(--radius-control)] border border-line bg-line">
      {cell("TVL", metrics?.tvlUsd, (n) => `$${formatCompact(n)}`)}
      {cell("APY", metrics?.apyPercent, (n) => formatPercent(n))}
      {cell("30-day", metrics?.performance30dPercent, (n) => formatPercent(n))}
    </dl>
  );
}

function VaultCard({
  vault,
  metrics,
  loading,
  onView,
}: {
  vault: VaultDefinition;
  metrics?: VaultMetrics;
  loading: boolean;
  onView: () => void;
}) {
  const level = RISK_LEVEL[vault.intendedRisk];
  return (
    <article className="panel flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="type-title text-lg">{vault.name}</h2>
          <p className="mt-1.5 text-sm text-ink-2">{vault.strategy}</p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)] bg-raised text-electric">
          <Icon name="vault" size={19} />
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-ink-2">
        <span>Intended risk</span>
        <span className="flex gap-0.5" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`h-1.5 w-5 rounded-full ${n <= level ? "bg-electric" : "bg-raised"}`} />
          ))}
        </span>
        <span className="font-semibold text-ink">{vault.intendedRisk}</span>
      </div>

      <div className="mt-4">
        <MetricsGrid metrics={metrics} loading={loading} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2 pt-1">
        <button className="btn btn-secondary btn-sm" onClick={onView}>
          View vault
        </button>
        <button className="btn btn-primary btn-sm" disabled={!vaultsLive} title={vaultsLive ? undefined : "Available once vault contracts are live"}>
          Deposit
        </button>
        <button className="btn btn-ghost btn-sm" disabled={!vaultsLive} title={vaultsLive ? undefined : "Available once vault contracts are live"}>
          Withdraw
        </button>
      </div>
    </article>
  );
}

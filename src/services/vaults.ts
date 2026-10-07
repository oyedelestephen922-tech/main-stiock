import { config } from "@/lib/config";

export interface VaultDefinition {
  id: string;
  name: string;
  strategy: string;
  /** The risk profile the strategy is designed for — not a measured result. */
  intendedRisk: "Lower" | "Moderate" | "Higher";
}

export interface VaultMetrics {
  tvlUsd: number | null;
  apyPercent: number | null;
  performance30dPercent: number | null;
}

export const VAULTS: VaultDefinition[] = [
  {
    id: "growth",
    name: "Growth Vault",
    strategy: "Holds a basket of high-growth technology names, rebalanced on a fixed schedule.",
    intendedRisk: "Higher",
  },
  {
    id: "blue-chip",
    name: "Blue Chip Vault",
    strategy: "Spreads exposure across the largest US companies by market value.",
    intendedRisk: "Moderate",
  },
  {
    id: "market",
    name: "Market Vault",
    strategy: "Tracks broad-market index exposure for a simple, diversified position.",
    intendedRisk: "Moderate",
  },
  {
    id: "income",
    name: "Income Vault",
    strategy: "Targets assets with a history of regular distributions.",
    intendedRisk: "Lower",
  },
];

/**
 * Deposits and withdrawals stay off until BOTH the registry address is set
 * AND the deposit/withdraw calls are implemented against its verified ABI
 * (flip VAULT_ACTIONS_IMPLEMENTED to true in the same change).
 */
const VAULT_ACTIONS_IMPLEMENTED = false;
export const vaultsLive = Boolean(config.contracts.vaultRegistry) && VAULT_ACTIONS_IMPLEMENTED;

/**
 * Metrics come from NEXT_PUBLIC_VAULTS_API_URL:
 *   GET {base}/vaults → { vaults: { id, tvlUsd, apyPercent, performance30dPercent }[] }
 * Without it every metric is null and the UI shows "Data unavailable".
 */
export async function fetchVaultMetrics(): Promise<Record<string, VaultMetrics>> {
  const empty: Record<string, VaultMetrics> = Object.fromEntries(
    VAULTS.map((v) => [v.id, { tvlUsd: null, apyPercent: null, performance30dPercent: null }]),
  );
  if (!config.vaultsApiUrl) return empty;
  const res = await fetch(`${config.vaultsApiUrl}/vaults`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Vaults API responded ${res.status}`);
  const data = (await res.json()) as { vaults: (VaultMetrics & { id: string })[] };
  for (const v of data.vaults ?? []) empty[v.id] = v;
  return empty;
}

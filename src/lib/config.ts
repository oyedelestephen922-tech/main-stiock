/**
 * Single place where environment variables are read.
 * Nothing else in the app should touch process.env directly.
 *
 * Next.js inlines NEXT_PUBLIC_* values at build time, so each key
 * must be referenced literally (no dynamic process.env[key]).
 */

const clean = (v: string | undefined) => (v ?? "").trim();

const isAddress = (v: string): v is `0x${string}` => /^0x[a-fA-F0-9]{40}$/.test(v);

const optionalAddress = (v: string | undefined) => {
  const value = clean(v);
  return isAddress(value) ? value : undefined;
};

const provider = clean(process.env.NEXT_PUBLIC_MARKET_DATA_PROVIDER) || "demo";

export const config = {
  market: {
    provider: (provider === "http" ? "http" : "demo") as "http" | "demo",
    apiUrl: clean(process.env.NEXT_PUBLIC_MARKET_API_URL).replace(/\/$/, ""),
  },
  positionsApiUrl: clean(process.env.NEXT_PUBLIC_POSITIONS_API_URL).replace(/\/$/, ""),
  activityApiUrl: clean(process.env.NEXT_PUBLIC_ACTIVITY_API_URL).replace(/\/$/, ""),
  vaultsApiUrl: clean(process.env.NEXT_PUBLIC_VAULTS_API_URL).replace(/\/$/, ""),
  chain: {
    id: Number(clean(process.env.NEXT_PUBLIC_CHAIN_ID)) || undefined,
    name: clean(process.env.NEXT_PUBLIC_CHAIN_NAME),
    rpcUrl: clean(process.env.NEXT_PUBLIC_RPC_URL),
    explorerUrl: clean(process.env.NEXT_PUBLIC_EXPLORER_URL).replace(/\/$/, ""),
    nativeSymbol: clean(process.env.NEXT_PUBLIC_NATIVE_SYMBOL) || "ETH",
  },
  walletConnectProjectId: clean(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID),
  contracts: {
    tradeRouter: optionalAddress(process.env.NEXT_PUBLIC_TRADE_ROUTER_ADDRESS),
    vaultRegistry: optionalAddress(process.env.NEXT_PUBLIC_VAULT_REGISTRY_ADDRESS),
  },
  mainToken: {
    /** Official $MAIN contract address. Leave empty until it is live on Pons. */
    address: optionalAddress(process.env.NEXT_PUBLIC_MAIN_TOKEN_ADDRESS),
    chainName: clean(process.env.NEXT_PUBLIC_MAIN_TOKEN_CHAIN),
    explorerUrl: clean(process.env.NEXT_PUBLIC_MAIN_TOKEN_EXPLORER_URL).replace(/\/$/, ""),
    ponsUrl: clean(process.env.NEXT_PUBLIC_MAIN_TOKEN_PONS_URL) || "https://www.ponsfamily.com/launchpad",
  },
  tradableTickers: clean(process.env.NEXT_PUBLIC_TRADABLE_TICKERS)
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean),
} as const;

export const isDemoMarketData = config.market.provider === "demo" || !config.market.apiUrl;

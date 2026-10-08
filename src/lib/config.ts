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
/** "live" = the built-in /api/market routes (Alpaca keys on the server). "http" = your own API URL. */
const marketApiUrl =
  provider === "live" ? "/api/market" : clean(process.env.NEXT_PUBLIC_MARKET_API_URL).replace(/\/$/, "");

const rawTradable = clean(process.env.NEXT_PUBLIC_TRADABLE_TICKERS);
const defaultTradable = ["TSLA", "NVDA", "AAPL", "PLTR", "META", "GOOGL", "SPY"];

export const config = {
  market: {
    provider: (provider === "http" || provider === "live" ? provider : "demo") as "live" | "http" | "demo",
    apiUrl: marketApiUrl,
  },
  positionsApiUrl: clean(process.env.NEXT_PUBLIC_POSITIONS_API_URL).replace(/\/$/, ""),
  activityApiUrl: clean(process.env.NEXT_PUBLIC_ACTIVITY_API_URL).replace(/\/$/, ""),
  vaultsApiUrl: clean(process.env.NEXT_PUBLIC_VAULTS_API_URL).replace(/\/$/, ""),
  chain: {
    id: Number(clean(process.env.NEXT_PUBLIC_CHAIN_ID)) || 4663,
    name: clean(process.env.NEXT_PUBLIC_CHAIN_NAME) || "Robinhood Chain",
    rpcUrl: clean(process.env.NEXT_PUBLIC_RPC_URL) || "https://rpc.mainnet.chain.robinhood.com",
    explorerUrl: clean(process.env.NEXT_PUBLIC_EXPLORER_URL).replace(/\/$/, "") || "https://robinhoodchain.blockscout.com",
    nativeSymbol: clean(process.env.NEXT_PUBLIC_NATIVE_SYMBOL) || "ETH",
  },
  walletConnectProjectId: clean(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID),
  contracts: {
    tradeRouter: optionalAddress(process.env.NEXT_PUBLIC_TRADE_ROUTER_ADDRESS) || "0x5e16A1913def7cAE0a7d7AddA0C5736289C07332",
    vaultRegistry: optionalAddress(process.env.NEXT_PUBLIC_VAULT_REGISTRY_ADDRESS) || "0x2bE38E1ae3bE6Fd53b6666E0d181883f297D82C5",
    oracle: optionalAddress(process.env.NEXT_PUBLIC_ORACLE_ADDRESS) || "0xcfDAF410057Fa5B7280D3bbE75CE4F8543456F7E",
    usdc: optionalAddress(process.env.NEXT_PUBLIC_USDC_ADDRESS) || "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  },
  mainToken: {
    /** Official $MAIN contract address. Leave empty until it is live on Pons. */
    address: optionalAddress(process.env.NEXT_PUBLIC_MAIN_TOKEN_ADDRESS),
    chainName: clean(process.env.NEXT_PUBLIC_MAIN_TOKEN_CHAIN),
    explorerUrl: clean(process.env.NEXT_PUBLIC_MAIN_TOKEN_EXPLORER_URL).replace(/\/$/, ""),
    ponsUrl: clean(process.env.NEXT_PUBLIC_MAIN_TOKEN_PONS_URL) || "https://www.ponsfamily.com/launchpad",
  },
  tradableTickers: rawTradable
    ? rawTradable.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean)
    : defaultTradable,
} as const;

export const isDemoMarketData = config.market.provider === "demo" || !config.market.apiUrl;

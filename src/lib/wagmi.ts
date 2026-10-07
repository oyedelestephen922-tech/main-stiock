import { createConfig, http, type Config } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { defineChain, type Chain } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { config } from "./config";

function customChain(): Chain | null {
  const { id, name, rpcUrl, explorerUrl, nativeSymbol } = config.chain;
  if (!id || !name || !rpcUrl) return null;
  return defineChain({
    id,
    name,
    nativeCurrency: { name: nativeSymbol, symbol: nativeSymbol, decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
    blockExplorers: explorerUrl ? { default: { name: "Explorer", url: explorerUrl } } : undefined,
  });
}

const custom = customChain();

/** The chains MainStocks supports. The first one is the primary network. */
export const supportedChains: readonly [Chain, ...Chain[]] = custom ? [custom] : [mainnet, sepolia];
export const primaryChain = supportedChains[0];

const connectors = [
  injected({ shimDisconnect: true }),
  ...(config.walletConnectProjectId
    ? [
        walletConnect({
          projectId: config.walletConnectProjectId,
          showQrModal: true,
          metadata: {
            name: "MainStocks",
            description: "The on-chain stock market, reimagined.",
            url: "https://mainstocks.app",
            icons: [],
          },
        }),
      ]
    : []),
];

export const wagmiConfig: Config = createConfig({
  chains: supportedChains,
  connectors,
  // EIP-6963: each installed browser wallet (MetaMask, Rabby, Coinbase…) appears by name.
  multiInjectedProviderDiscovery: true,
  ssr: true,
  transports: Object.fromEntries(supportedChains.map((c) => [c.id, http()])),
});

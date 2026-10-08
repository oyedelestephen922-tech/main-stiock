import deployedJson from "@/lib/contracts/deployed-addresses.json";

export interface DeployedToken {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: number;
}

export interface DeployedManifest {
  network: string;
  chainId: number;
  vault: `0x${string}`;
  oracle: `0x${string}`;
  router: `0x${string}`;
  usdc: `0x${string}`;
  tokens: Record<string, DeployedToken>;
}

export const DEPLOYED_CONTRACTS = deployedJson as unknown as DeployedManifest;

export const TOKEN_ADDRESS_MAP: Record<string, `0x${string}`> = Object.fromEntries(
  Object.entries(DEPLOYED_CONTRACTS.tokens).map(([ticker, token]) => [
    ticker.toUpperCase(),
    token.address as `0x${string}`,
  ])
);

export function getTokenAddress(ticker: string): `0x${string}` | undefined {
  return TOKEN_ADDRESS_MAP[ticker.toUpperCase()];
}

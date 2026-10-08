import type { Abi } from "viem";
import { config } from "@/lib/config";
import tradeRouterAbiJson from "./abi/tradeRouter.json";
import { getTokenAddress } from "./deployed";

/**
 * Trade router integration point for Robinhood Chain Mainnet.
 */
export const tradeRouterAbi = tradeRouterAbiJson as unknown as Abi;

export interface TradeRequest {
  side: "buy" | "sell";
  ticker: string;
  amountUsd: number;
  minReceive: number;
  shares?: number;
  recipient?: `0x${string}`;
}

export interface TradeCall {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args: readonly unknown[];
  value?: bigint;
}

/** Return the contract call for a trade, or null if it cannot be constructed. */
export function buildTradeCall(request: TradeRequest): TradeCall | null {
  const routerAddress = config.contracts.tradeRouter;
  if (!routerAddress || tradeRouterAbi.length === 0) return null;

  const stockAddress = getTokenAddress(request.ticker);
  const usdcAddress = config.contracts.usdc;
  if (!stockAddress || !usdcAddress) return null;

  const recipient = request.recipient;
  if (!recipient) return null;

  if (request.side === "buy") {
    // User pays USD (USDC 6 decimals), receives stock tokens (18 decimals)
    const amountIn = BigInt(Math.max(1, Math.floor(request.amountUsd * 1e6)));
    const amountOutMin = BigInt(Math.max(0, Math.floor(request.minReceive * 1e18)));

    return {
      address: routerAddress,
      abi: tradeRouterAbi,
      functionName: "swapExactTokensForTokens",
      args: [amountIn, amountOutMin, usdcAddress, stockAddress, recipient],
    };
  } else {
    // User pays stock tokens (18 decimals), receives USD (6 decimals)
    const shares = request.shares ?? request.amountUsd;
    const amountIn = BigInt(Math.max(1, Math.floor(shares * 1e18)));
    const amountOutMin = BigInt(Math.max(0, Math.floor(request.minReceive * 1e6)));

    return {
      address: routerAddress,
      abi: tradeRouterAbi,
      functionName: "swapExactTokensForTokens",
      args: [amountIn, amountOutMin, stockAddress, usdcAddress, recipient],
    };
  }
}

export type TradingStatus = { available: true } | { available: false; reason: string };

export function tradingStatus(ticker?: string): TradingStatus {
  if (!config.contracts.tradeRouter) {
    return { available: false, reason: "Trading contract not connected yet. You can preview orders only." };
  }
  if (tradeRouterAbi.length === 0) {
    return { available: false, reason: "Trading contract ABI not added yet. You can preview orders only." };
  }
  if (ticker && !config.tradableTickers.includes(ticker.toUpperCase())) {
    return { available: false, reason: `${ticker} is view-only on MainStocks for now.` };
  }
  if (ticker && !getTokenAddress(ticker)) {
    return { available: false, reason: `No token contract mapped for ${ticker} on Robinhood Chain.` };
  }
  return { available: true };
}

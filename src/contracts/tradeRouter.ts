import type { Abi } from "viem";
import { config } from "@/lib/config";

/**
 * Trade router integration point.
 *
 * MainStocks does not ship a trading contract and does not guess at one.
 * To enable real trades:
 *
 *   1. Deploy and verify your router contract.
 *   2. Paste its verified ABI into src/contracts/abi/tradeRouter.json
 *      and import it below as `tradeRouterAbi`.
 *   3. Implement buildTradeCall() so it returns the exact function name
 *      and arguments your router expects.
 *   4. Set NEXT_PUBLIC_TRADE_ROUTER_ADDRESS and NEXT_PUBLIC_TRADABLE_TICKERS.
 *
 * Until all of that is done, the trade panel shows previews only and the
 * "Confirm trade" button stays disabled.
 */

export const tradeRouterAbi: Abi = [];

export interface TradeRequest {
  side: "buy" | "sell";
  ticker: string;
  amountUsd: number;
  minReceive: number;
}

export interface TradeCall {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args: readonly unknown[];
  value?: bigint;
}

/** Return the contract call for a trade, or null if it isn't implemented yet. */
export function buildTradeCall(_request: TradeRequest): TradeCall | null {
  void _request;
  return null;
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
  return { available: true };
}

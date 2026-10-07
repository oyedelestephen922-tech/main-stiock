import { config, isDemoMarketData } from "@/lib/config";
import { demoProvider } from "./demoProvider";
import { createHttpProvider } from "./httpProvider";
import type { MarketDataProvider } from "./types";

export const marketData: MarketDataProvider = isDemoMarketData
  ? demoProvider
  : createHttpProvider(config.market.apiUrl, config.activityApiUrl || undefined);

export * from "./types";
export { SESSION_LABEL } from "./session";

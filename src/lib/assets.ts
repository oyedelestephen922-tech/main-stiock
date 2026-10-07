import { config } from "./config";

export type AssetKind = "stock" | "index";

export interface Asset {
  ticker: string;
  name: string;
  kind: AssetKind;
  sector: string;
  about: string;
  /** Tickers shown under "Related assets" on the detail page. */
  related: string[];
}

/**
 * The catalogue of assets MainStocks knows how to display.
 * Being listed here does NOT mean an asset is tradable —
 * see isTradable(), which is driven by NEXT_PUBLIC_TRADABLE_TICKERS.
 */
export const ASSETS: Asset[] = [
  {
    ticker: "AAPL",
    name: "Apple",
    kind: "stock",
    sector: "Consumer technology",
    about:
      "Designs consumer electronics, software and services, including iPhone, Mac, iPad, wearables and a growing services business.",
    related: ["MSFT", "GOOGL", "AMZN"],
  },
  {
    ticker: "NVDA",
    name: "NVIDIA",
    kind: "stock",
    sector: "Semiconductors",
    about:
      "Designs graphics processors and accelerated computing platforms used in gaming, data centres and AI workloads.",
    related: ["AMD", "MSFT", "META"],
  },
  {
    ticker: "TSLA",
    name: "Tesla",
    kind: "stock",
    sector: "Automotive & energy",
    about: "Builds electric vehicles, battery storage systems and solar energy products.",
    related: ["NVDA", "AMZN", "AAPL"],
  },
  {
    ticker: "MSFT",
    name: "Microsoft",
    kind: "stock",
    sector: "Software & cloud",
    about:
      "Develops operating systems, productivity software and the Azure cloud platform, alongside gaming and business services.",
    related: ["AAPL", "GOOGL", "NVDA"],
  },
  {
    ticker: "AMZN",
    name: "Amazon",
    kind: "stock",
    sector: "E-commerce & cloud",
    about: "Operates a global online marketplace, logistics network and the AWS cloud computing platform.",
    related: ["MSFT", "GOOGL", "META"],
  },
  {
    ticker: "META",
    name: "Meta Platforms",
    kind: "stock",
    sector: "Social media",
    about: "Runs Facebook, Instagram, WhatsApp and Messenger, and invests in AI and mixed-reality hardware.",
    related: ["GOOGL", "AMZN", "NVDA"],
  },
  {
    ticker: "GOOGL",
    name: "Alphabet",
    kind: "stock",
    sector: "Internet services",
    about: "Parent company of Google, including Search, YouTube, Android and Google Cloud.",
    related: ["META", "MSFT", "AMZN"],
  },
  {
    ticker: "AMD",
    name: "Advanced Micro Devices",
    kind: "stock",
    sector: "Semiconductors",
    about: "Designs CPUs, GPUs and adaptive chips for PCs, data centres, gaming consoles and embedded systems.",
    related: ["NVDA", "MSFT", "AAPL"],
  },
  {
    ticker: "SPY",
    name: "S&P 500 ETF",
    kind: "index",
    sector: "Broad market",
    about: "An exchange-traded fund that tracks the S&P 500 index of large US companies.",
    related: ["QQQ", "AAPL", "MSFT"],
  },
  {
    ticker: "QQQ",
    name: "Nasdaq-100 ETF",
    kind: "index",
    sector: "Technology-weighted",
    about: "An exchange-traded fund that tracks the Nasdaq-100 index of large non-financial companies.",
    related: ["SPY", "NVDA", "AAPL"],
  },
];

const BY_TICKER = new Map(ASSETS.map((a) => [a.ticker, a]));

export function getAsset(ticker: string): Asset | undefined {
  return BY_TICKER.get(ticker.toUpperCase());
}

export function isTradable(ticker: string): boolean {
  return Boolean(config.contracts.tradeRouter) && config.tradableTickers.includes(ticker.toUpperCase());
}

export function searchAssets(query: string): Asset[] {
  const q = query.trim().toLowerCase();
  if (!q) return ASSETS;
  return ASSETS.filter(
    (a) => a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q),
  ).sort((a, b) => {
    const aStarts = a.ticker.toLowerCase().startsWith(q) || a.name.toLowerCase().startsWith(q);
    const bStarts = b.ticker.toLowerCase().startsWith(q) || b.name.toLowerCase().startsWith(q);
    return Number(bStarts) - Number(aStarts);
  });
}

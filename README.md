# MainStocks

The on-chain stock market, reimagined. A Next.js + TypeScript app with a black-and-electric-blue
design system, full dark/light themes, wallet connection, markets, asset pages, a dashboard,
portfolio, watchlist, trading terminal, vaults and settings.

## Run it

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local   # optional — the app runs on demo data without it
npm run dev                  # http://localhost:3000
```

Other scripts: `npm run build`, `npm start`, `npm run lint`, `npm run typecheck`.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, import the repository. The framework is detected as Next.js; no build settings to change.
3. Add the environment variables from `.env.example` under Project → Settings → Environment Variables.
4. Deploy. Add your domain under Project → Settings → Domains.

## What is real and what is demo

| Area | Status |
| --- | --- |
| Theme switcher, saved per browser | Working |
| Wallet connect / disconnect, address, network, balance, wrong-network switch | Working (browser wallets; mobile wallets need a WalletConnect project ID) |
| Search (`/` or Ctrl/⌘ K), watchlist (add, remove, reorder), local activity log | Working, stored in the browser |
| Prices, charts, market statistics | **Live** with Alpaca keys set; otherwise demo data, labelled "Demo data" everywhere it appears |
| Market activity feed (other users' buys/sells) | Needs an activity source; shows an empty state in live mode |
| "MARKETS ONLINE" indicator | Shown only when a live market API reports healthy |
| Portfolio and positions | Needs a positions API. Without one, shows an honest "not available" state. An opt-in **sample portfolio** (clearly labelled) lets you preview the screens |
| Trading (Review order → Confirm trade) | Order preview works. **Confirm is disabled** until a trading contract and its verified ABI are added |
| Vaults | Strategy descriptions only. TVL / APY / performance show "Data unavailable"; deposit and withdraw are disabled |

## Connecting real services

All configuration is in environment variables, read in one place: `src/lib/config.ts`.

**Market data (live)** — MainStocks has built-in server routes (`/api/market/quotes`,
`/api/market/history`, `/api/market/health`) powered by Alpaca's free market data plan:
1. Create a free account at alpaca.markets and generate API keys.
2. Set `NEXT_PUBLIC_MARKET_DATA_PROVIDER=live`, `ALPACA_API_KEY_ID` and `ALPACA_API_SECRET_KEY`.
The keys are server-only and never reach the browser. Responses are cached on the server so
traffic stays well inside the free rate limit. The free plan gives real-time prices from the
IEX exchange; volume is hidden because IEX volume is only a slice of the whole market.

To use a different provider instead, set `NEXT_PUBLIC_MARKET_DATA_PROVIDER=http` and
`NEXT_PUBLIC_MARKET_API_URL`; the expected shapes are documented in
`src/services/market/httpProvider.ts`.

**Network** — leave `NEXT_PUBLIC_CHAIN_ID` empty for Ethereum mainnet + Sepolia, or fill in all
chain variables to use another EVM chain (for example Robinhood Chain).

**Trading contract** — see `src/contracts/tradeRouter.ts`:
1. Put the verified ABI in `src/contracts/abi/` and import it as `tradeRouterAbi`.
2. Implement `buildTradeCall()` with your router's exact function and arguments.
3. Set `NEXT_PUBLIC_TRADE_ROUTER_ADDRESS` and `NEXT_PUBLIC_TRADABLE_TICKERS`.
The trade panel then enables Confirm trade and tracks the transaction (waiting for wallet →
pending → confirmed / failed).

**Vaults** — set `NEXT_PUBLIC_VAULT_REGISTRY_ADDRESS`, implement deposit/withdraw against its
verified ABI, then set `VAULT_ACTIONS_IMPLEMENTED = true` in `src/services/vaults.ts`.
Metrics come from `NEXT_PUBLIC_VAULTS_API_URL`.

**Positions** — `NEXT_PUBLIC_POSITIONS_API_URL`; shape documented in `src/services/portfolio.ts`.

Nothing in this project deploys contracts, moves funds or stores private keys.

## Project structure

```
src/
  app/                 routes: / · /markets · /markets/[ticker] · /learn · /dashboard/*
  components/
    brand/             MainStocks logo (animated SVG mark + wordmark)
    charts/            interactive price chart, sparkline, range tabs
    dashboard/         stat strip, activity feed, portfolio states
    landing/           hero network (canvas), ticker tape
    layout/            navbar, dashboard sidebar + mobile tab bar, footer
    markets/           market list (table on desktop, cards on mobile), watch star
    search/            "/" search palette
    theme/ trade/ wallet/ ui/
  contracts/           trade router integration point + abi/ folder
  hooks/               market data, portfolio, watchlist, theme, motion
  lib/                 config (env), wagmi, asset catalogue, formatting, local storage
  services/            market data providers (demo + http), portfolio, vaults, local stores
```

## Design notes

- Colours are CSS variables in `src/app/globals.css` (`:root[data-theme="dark"|"light"]`); every
  component, chart and the canvas hero read from them, so both themes are complete.
- Type is Archivo (variable, self-hosted): extra-wide for headlines, condensed tabular figures for
  prices, normal width for reading.
- Up moves are blue and down moves are red, and every change also shows an arrow and a sign, so
  colour is never the only signal.
- All motion respects `prefers-reduced-motion`; the hero canvas pauses off-screen and draws a single
  still frame when motion is reduced.

# Contract ABIs

Put the **verified** ABI JSON for each deployed contract in this folder, for example:

- `tradeRouter.json` — the router that executes buys and sells
- `vaultRegistry.json` — the contract that lists vaults and handles deposits/withdrawals

Copy ABIs from the verified source on the block explorer or from your contract
project's build output (`out/` for Foundry, `artifacts/` for Hardhat). Do not
hand-write or guess ABIs.

Addresses are never hard-coded; they come from environment variables
(see `.env.example`).

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Canonical Robinhood Chain Mainnet contract addresses (Chain ID: 4663)
const CANONICAL = {
  USDG: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  TOKENS: {
    TSLA: { name: "Tesla Tokenized", symbol: "TSLA", address: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d" },
    NVDA: { name: "NVIDIA Tokenized", symbol: "NVDA", address: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC" },
    AAPL: { name: "Apple Tokenized", symbol: "AAPL", address: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9" },
    PLTR: { name: "Palantir Tokenized", symbol: "PLTR", address: "0x894E1EC2D74FFE5AEF8Dc8A9e84686acCB964F2A" },
    META: { name: "Meta Tokenized", symbol: "META", address: "0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35" },
    GOOGL: { name: "Alphabet Tokenized", symbol: "GOOGL", address: "0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3" },
    SPY: { name: "SPDR S&P 500 Tokenized", symbol: "SPY", address: "0x117cc2133c37B721F49dE2A7a74833232B3B4C0C" },
  },
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("==================================================");
  console.log("MainStocks Robinhood Chain Mainnet Deployment");
  console.log("Network:", network.name, "| Chain ID:", Number(network.chainId));
  console.log("Deployer:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  console.log("==================================================");

  // 1. Deploy StockOracle
  console.log("\n1. Deploying StockOracle...");
  const StockOracleFactory = await ethers.getContractFactory("StockOracle");
  const oracle = await StockOracleFactory.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("StockOracle deployed at:", oracleAddress);

  // Configure USDG baseline price ($1.00 = 1e8)
  await oracle.setManualPrice(CANONICAL.USDG, 1_00000000n);
  console.log("Configured USDG price: $1.00");

  // Authorize Keeper wallet if provided
  const keeperAddress = process.env.KEEPER_ADDRESS?.trim();
  if (keeperAddress && ethers.isAddress(keeperAddress)) {
    await oracle.setKeeper(keeperAddress, true);
    console.log("Authorized Keeper in StockOracle:", keeperAddress);
  }

  // 2. Deploy Swap Router
  console.log("\n2. Deploying StockGainsUniswapRouter...");
  const RouterFactory = await ethers.getContractFactory("StockGainsUniswapRouter");
  const router = await RouterFactory.deploy(
    ethers.ZeroAddress, // Factory (or canonical Uniswap factory)
    ethers.ZeroAddress, // Router (or canonical SwapRouter)
    oracleAddress
  );
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("Router deployed at:", routerAddress);

  // 3. Deploy Vault
  console.log("\n3. Deploying StockGainsVault...");
  const VaultFactory = await ethers.getContractFactory("StockGainsVault");
  const vault = await VaultFactory.deploy(oracleAddress, routerAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("Vault deployed at:", vaultAddress);

  // 4. Export deployment to frontend
  console.log("\n4. Exporting manifests to frontend...");
  const contractsDir = path.resolve(__dirname, "../../src/lib/contracts");
  const abiDir = path.resolve(__dirname, "../../src/contracts/abi");

  fs.mkdirSync(contractsDir, { recursive: true });
  fs.mkdirSync(abiDir, { recursive: true });

  const deployedConfig = {
    network: "Robinhood Chain Mainnet",
    chainId: 4663,
    vault: vaultAddress,
    oracle: oracleAddress,
    router: routerAddress,
    usdc: CANONICAL.USDG,
    tokens: CANONICAL.TOKENS,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(contractsDir, "deployed-addresses.json"),
    JSON.stringify(deployedConfig, null, 2)
  );

  const vaultArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/StockGainsVault.sol/StockGainsVault.json"), "utf-8")
  );
  const oracleArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/StockOracle.sol/StockOracle.json"), "utf-8")
  );
  const routerArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../artifacts/contracts/StockGainsUniswapRouter.sol/StockGainsUniswapRouter.json"), "utf-8")
  );

  fs.writeFileSync(path.join(abiDir, "stockGainsVault.json"), JSON.stringify(vaultArtifact.abi, null, 2));
  fs.writeFileSync(path.join(abiDir, "stockOracle.json"), JSON.stringify(oracleArtifact.abi, null, 2));
  fs.writeFileSync(path.join(abiDir, "tradeRouter.json"), JSON.stringify(routerArtifact.abi, null, 2));

  console.log("Exported successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

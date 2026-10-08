import hre from "hardhat";
const { ethers } = hre;
import * as fs from "fs";
import * as path from "path";

const CANONICAL = {
  USDG: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  ORACLE: "0xcfDAF410057Fa5B7280D3bbE75CE4F8543456F7E", // Deployed & verified StockOracle
  TOKENS: [
    { ticker: "TSLA", name: "Tesla Well", symbol: "wTSLA", address: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d" },
    { ticker: "NVDA", name: "NVIDIA Well", symbol: "wNVDA", address: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC" },
    { ticker: "AAPL", name: "Apple Well", symbol: "wAAPL", address: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9" },
    { ticker: "PLTR", name: "Palantir Well", symbol: "wPLTR", address: "0x894E1EC2D74FFE5AEF8Dc8A9e84686acCB964F2A" },
    { ticker: "META", name: "Meta Well", symbol: "wMETA", address: "0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35" },
    { ticker: "GOOGL", name: "Alphabet Well", symbol: "wGOOGL", address: "0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3" },
    { ticker: "SPY", name: "SPDR S&P 500 Well", symbol: "wSPY", address: "0x117cc2133c37B721F49dE2A7a74833232B3B4C0C" },
  ],
};

// Checkpoint cache to resume safely
const CACHE_FILE = path.join(__dirname, "../stonkwell-cache.json");

function loadCache(): any {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    } catch {
      return {};
    }
  }
  return {};
}

function saveCache(cache: any) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("==================================================");
  console.log("Deploying StonkWell Ecosystem to Robinhood Chain Mainnet");
  console.log("Network:", network.name, "| Chain ID:", Number(network.chainId));
  console.log("Deployer:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(balance), "ETH");
  console.log("==================================================");

  const cache = loadCache();
  if (!cache.wells) cache.wells = {};

  // Keeper wallet
  const rawKeeperAddress = process.env.KEEPER_ADDRESS?.trim();
  const rawKeeperKey = process.env.KEEPER_PRIVATE_KEY?.trim();
  let keeperAddress: string = deployer.address;

  if (rawKeeperAddress && ethers.isAddress(rawKeeperAddress)) {
    keeperAddress = rawKeeperAddress;
  } else if (rawKeeperKey) {
    const formattedKey = rawKeeperKey.startsWith("0x") ? rawKeeperKey : `0x${rawKeeperKey}`;
    const keeperWallet = new ethers.Wallet(formattedKey);
    keeperAddress = keeperWallet.address;
  }
  console.log("Authorized Keeper:", keeperAddress);

  // 1. StonkDrawdownRetire
  let drawdownRetireAddress = cache.drawdownRetire;
  if (!drawdownRetireAddress) {
    console.log("\n1. Deploying StonkDrawdownRetire (Protocol Token Buyback & Burn)...");
    const RetireFactory = await ethers.getContractFactory("StonkDrawdownRetire");
    const drawdownRetire = await RetireFactory.deploy(ethers.ZeroAddress, { gasLimit: 2_000_000 });
    await drawdownRetire.waitForDeployment();
    drawdownRetireAddress = await drawdownRetire.getAddress();
    cache.drawdownRetire = drawdownRetireAddress;
    saveCache(cache);
  }
  console.log("StonkDrawdownRetire:", drawdownRetireAddress);

  // 2. StonkFeeRouter
  let feeRouterAddress = cache.feeRouter;
  if (!feeRouterAddress) {
    console.log("\n2. Deploying StonkFeeRouter (48h Timelocked Fee Forwarder)...");
    const FeeRouterFactory = await ethers.getContractFactory("StonkFeeRouter");
    const feeRouter = await FeeRouterFactory.deploy(drawdownRetireAddress, { gasLimit: 2_000_000 });
    await feeRouter.waitForDeployment();
    feeRouterAddress = await feeRouter.getAddress();
    cache.feeRouter = feeRouterAddress;
    saveCache(cache);
  }
  console.log("StonkFeeRouter:", feeRouterAddress);

  // 3. StonkWells & Positions
  console.log("\n3. Deploying StonkWells and Concentrated Liquidity Positions...");
  const WellFactory = await ethers.getContractFactory("StonkWell");
  const PositionFactory = await ethers.getContractFactory("StonkPosition");

  for (const item of CANONICAL.TOKENS) {
    if (cache.wells[item.ticker]) {
      console.log(` - ${item.ticker}: Already deployed at ${cache.wells[item.ticker].well}`);
      continue;
    }

    console.log(` - Deploying Well for ${item.ticker}...`);
    const well = await WellFactory.deploy(
      item.name,
      item.symbol,
      item.address,
      CANONICAL.USDG,
      CANONICAL.ORACLE,
      feeRouterAddress,
      keeperAddress,
      { gasLimit: 4_500_000 }
    );
    await well.waitForDeployment();
    const wellAddress = await well.getAddress();

    const position = await PositionFactory.deploy(wellAddress, keeperAddress, { gasLimit: 2_000_000 });
    await position.waitForDeployment();
    const positionAddress = await position.getAddress();

    const tx = await well.setPosition(positionAddress, { gasLimit: 200_000 });
    await tx.wait();

    cache.wells[item.ticker] = {
      name: item.name,
      symbol: item.symbol,
      equityToken: item.address,
      well: wellAddress,
      position: positionAddress,
    };
    saveCache(cache);

    console.log(`   ${item.ticker}: Well = ${wellAddress} | Position = ${positionAddress}`);
  }

  // 4. StonkCreditLine (Borrow Desk for META-WELL)
  let creditLineAddress = cache.creditLine;
  if (!creditLineAddress) {
    console.log("\n4. Deploying StonkCreditLine (Isolated Borrow Desk)...");
    const metaWellAddress = cache.wells.META.well;
    const CreditLineFactory = await ethers.getContractFactory("StonkCreditLine");
    const creditLine = await CreditLineFactory.deploy(metaWellAddress, CANONICAL.USDG, { gasLimit: 3_500_000 });
    await creditLine.waitForDeployment();
    creditLineAddress = await creditLine.getAddress();
    cache.creditLine = creditLineAddress;
    saveCache(cache);
  }
  console.log("StonkCreditLine (META-WELL):", creditLineAddress);

  // 5. Export manifests
  console.log("\n5. Exporting deployment manifests to Next.js frontend...");
  const frontendContractsDir = path.resolve(__dirname, "../../src/lib/contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  const manifest = {
    network: "Robinhood Chain Mainnet",
    chainId: 4663,
    usdg: CANONICAL.USDG,
    oracle: CANONICAL.ORACLE,
    drawdownRetire: drawdownRetireAddress,
    feeRouter: feeRouterAddress,
    keeper: keeperAddress,
    creditLines: {
      META: creditLineAddress,
    },
    wells: cache.wells,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(frontendContractsDir, "deployed-stonkwell.json"),
    JSON.stringify(manifest, null, 2)
  );

  const wellArtifact = await import("../artifacts/contracts/StonkWell.sol/StonkWell.json");
  const positionArtifact = await import("../artifacts/contracts/StonkPosition.sol/StonkPosition.json");
  const creditLineArtifact = await import("../artifacts/contracts/StonkCreditLine.sol/StonkCreditLine.json");
  const feeRouterArtifact = await import("../artifacts/contracts/StonkFeeRouter.sol/StonkFeeRouter.json");
  const drawdownRetireArtifact = await import("../artifacts/contracts/StonkDrawdownRetire.sol/StonkDrawdownRetire.json");

  fs.writeFileSync(path.join(frontendContractsDir, "StonkWell.json"), JSON.stringify(wellArtifact.abi, null, 2));
  fs.writeFileSync(path.join(frontendContractsDir, "StonkPosition.json"), JSON.stringify(positionArtifact.abi, null, 2));
  fs.writeFileSync(path.join(frontendContractsDir, "StonkCreditLine.json"), JSON.stringify(creditLineArtifact.abi, null, 2));
  fs.writeFileSync(path.join(frontendContractsDir, "StonkFeeRouter.json"), JSON.stringify(feeRouterArtifact.abi, null, 2));
  fs.writeFileSync(path.join(frontendContractsDir, "StonkDrawdownRetire.json"), JSON.stringify(drawdownRetireArtifact.abi, null, 2));

  console.log("Successfully exported to:", frontendContractsDir);
  console.log("==================================================");
  console.log("STONKWELL MAINNET DEPLOYMENT COMPLETE!");
  console.log("==================================================");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

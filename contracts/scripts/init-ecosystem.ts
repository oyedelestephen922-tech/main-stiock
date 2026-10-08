import hre from "hardhat";
const { ethers } = hre;
import * as fs from "fs";
import * as path from "path";

const CANONICAL = {
  USDG: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  ORACLE: "0xcfDAF410057Fa5B7280D3bbE75CE4F8543456F7E",
  TOKENS: [
    { ticker: "TSLA", address: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d", price: 250_00000000n },
    { ticker: "NVDA", address: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC", price: 125_00000000n },
    { ticker: "AAPL", address: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9", price: 225_00000000n },
    { ticker: "PLTR", address: "0x894E1EC2D74FFE5AEF8Dc8A9e84686acCB964F2A", price: 42_00000000n },
    { ticker: "META", address: "0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35", price: 580_00000000n },
    { ticker: "GOOGL", address: "0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3", price: 165_00000000n },
    { ticker: "SPY", address: "0x117cc2133c37B721F49dE2A7a74833232B3B4C0C", price: 575_00000000n },
  ],
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("==================================================");
  console.log("Configuring Ecosystem to reach 50+ on-chain txs...");
  console.log("Deployer:", deployer.address);

  const keeperAddress = process.env.KEEPER_ADDRESS?.trim() || "0x6b3e66d3e1c2235f927aa0865a8034eddde8816b";
  console.log("Keeper:", keeperAddress);

  const manifestPath = path.resolve(__dirname, "../../src/lib/contracts/deployed-stonkwell.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  const oracle = await ethers.getContractAt("StockOracle", CANONICAL.ORACLE);
  const WellFactory = await ethers.getContractFactory("StonkWell");

  // 1. Configure baseline prices in Oracle (7 txs)
  console.log("\n1. Setting baseline prices in StockOracle for all 7 equities...");
  for (const t of CANONICAL.TOKENS) {
    console.log(` - Setting price for ${t.ticker}...`);
    const tx = await oracle.setManualPrice(t.address, t.price, { gasLimit: 200_000 });
    await tx.wait();
  }

  // 2. Set Keeper on each StonkWell (7 txs)
  console.log("\n2. Setting Keeper on all 7 StonkWells...");
  for (const t of CANONICAL.TOKENS) {
    const wellInfo = manifest.wells[t.ticker];
    if (!wellInfo) continue;
    const well = WellFactory.attach(wellInfo.well) as any;

    console.log(` - Setting Keeper on ${t.ticker} Well...`);
    const tx = await well.setKeeper(keeperAddress, { gasLimit: 200_000 });
    await tx.wait();
  }

  // 3. Set HeldValueCap on each StonkWell (7 txs)
  console.log("\n3. Setting heldValueCap on all 7 StonkWells...");
  for (const t of CANONICAL.TOKENS) {
    const wellInfo = manifest.wells[t.ticker];
    if (!wellInfo) continue;
    const well = WellFactory.attach(wellInfo.well) as any;

    console.log(` - Setting heldValueCap on ${t.ticker} Well ($100k)...`);
    const tx = await well.setHeldValueCap(100_000 * 1e6, { gasLimit: 200_000 });
    await tx.wait();
  }

  // 4. Forward fees on StonkFeeRouter (1 tx)
  if (manifest.feeRouter) {
    console.log("\n4. Triggering initial check on StonkFeeRouter...");
    const feeRouter = await ethers.getContractAt("StonkFeeRouter", manifest.feeRouter);
    const tx = await feeRouter.forwardFees(CANONICAL.USDG, { gasLimit: 200_000 });
    await tx.wait();
    console.log(" - ForwardFees transaction executed");
  }

  const nonce = await ethers.provider.getTransactionCount(deployer.address);
  console.log("\n==================================================");
  console.log(`✅ SUCCESS! Total On-Chain Transactions Reached: ${nonce}`);
  console.log("==================================================");
}

main().catch(console.error);

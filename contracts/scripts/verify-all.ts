import * as fs from "fs";
import * as path from "path";

interface Target {
  name: string;
  address: string;
  contractIdentifier: string;
}

async function verifyContract(target: Target, buildInfo: any) {
  console.log(`\n--------------------------------------------------`);
  console.log(`Verifying ${target.name} at ${target.address}...`);

  const payload = {
    stdJsonInput: buildInfo.input,
    compilerVersion: buildInfo.solcLongVersion || buildInfo.solcVersion,
    contractIdentifier: target.contractIdentifier,
  };

  try {
    const res = await fetch(`https://sourcify.dev/server/v2/verify/4663/${target.address}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.status === 202) {
      const { verificationId } = await res.json();
      console.log(`Verification queued (ID: ${verificationId}). Polling status...`);

      // Poll up to 10 times
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const checkRes = await fetch(`https://sourcify.dev/server/v2/verify/${verificationId}`);
        const checkData = await checkRes.json();
        if (checkData.isFinished) {
          if (checkData.contract?.match) {
            console.log(`✅ ${target.name} VERIFIED! Match: ${checkData.contract.match}`);
            console.log(`🔗 Sourcify: https://repo.sourcify.dev/contracts/full_match/4663/${target.address}/`);
            console.log(`🔗 Blockscout: https://robinhoodchain.blockscout.com/address/${target.address}`);
            return true;
          } else {
            console.warn(`⚠️ Finished with status:`, checkData.error || checkData);
            return false;
          }
        }
      }
    } else {
      const err = await res.text();
      console.warn(`⚠️ Response ${res.status}:`, err);
    }
  } catch (e: any) {
    console.error(`Error verifying ${target.name}:`, e.message);
  }
  return false;
}

async function main() {
  console.log("==================================================");
  console.log("Verifying MainStocks Contracts via CLI");
  console.log("Network: Robinhood Chain Mainnet (Chain ID: 4663)");
  console.log("==================================================");

  const buildInfoDir = path.resolve(__dirname, "../artifacts/build-info");
  const files = fs.readdirSync(buildInfoDir);
  const buildInfoFile = files.find((f) => f.endsWith(".json"));
  if (!buildInfoFile) throw new Error("No build-info file found. Run 'npx hardhat compile' first.");

  const buildInfo = JSON.parse(fs.readFileSync(path.join(buildInfoDir, buildInfoFile), "utf-8"));
  const deployedPath = path.resolve(__dirname, "../../src/lib/contracts/deployed-addresses.json");
  const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf-8"));

  const targets: Target[] = [
    {
      name: "StockOracle",
      address: deployed.oracle,
      contractIdentifier: "contracts/StockOracle.sol:StockOracle",
    },
    {
      name: "StockGainsUniswapRouter",
      address: deployed.router,
      contractIdentifier: "contracts/StockGainsUniswapRouter.sol:StockGainsUniswapRouter",
    },
    {
      name: "StockGainsVault",
      address: deployed.vault,
      contractIdentifier: "contracts/StockGainsVault.sol:StockGainsVault",
    },
  ];

  for (const target of targets) {
    await verifyContract(target, buildInfo);
  }

  console.log("\n==================================================");
  console.log("ALL CONTRACT VERIFICATIONS COMPLETE!");
  console.log("==================================================");
}

main().catch(console.error);

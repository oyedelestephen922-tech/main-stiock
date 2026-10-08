import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

async function main() {
  console.log("Flattening contracts for Robinhood Chain Blockscout verification...");
  const flattenedDir = path.resolve(__dirname, "../flattened");
  fs.mkdirSync(flattenedDir, { recursive: true });

  const contracts = [
    { name: "StockOracle", path: "contracts/StockOracle.sol" },
    { name: "StockGainsUniswapRouter", path: "contracts/StockGainsUniswapRouter.sol" },
    { name: "StockGainsVault", path: "contracts/StockGainsVault.sol" },
    { name: "StonkWell", path: "contracts/StonkWell.sol" },
    { name: "StonkPosition", path: "contracts/StonkPosition.sol" },
    { name: "StonkCreditLine", path: "contracts/StonkCreditLine.sol" },
    { name: "StonkFeeRouter", path: "contracts/StonkFeeRouter.sol" },
    { name: "StonkDrawdownRetire", path: "contracts/StonkDrawdownRetire.sol" },
  ];

  for (const c of contracts) {
    console.log(`Flattening ${c.name}...`);
    try {
      const output = execSync(`npx hardhat flatten ${c.path}`, {
        cwd: path.resolve(__dirname, ".."),
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
      });

      // Remove redundant SPDX licenses that hardhat flatten repeats
      const cleaned = output.replace(/\/\/ SPDX-License-Identifier: MIT/g, (match, offset) => {
        return offset === output.indexOf("// SPDX-License-Identifier: MIT") ? match : "";
      });

      fs.writeFileSync(path.join(flattenedDir, `${c.name}.flat.sol`), cleaned);
      console.log(`Saved: contracts/flattened/${c.name}.flat.sol`);
    } catch (e: any) {
      console.error(`Error flattening ${c.name}:`, e.message);
    }
  }

  console.log("All contracts flattened successfully!");
}

main().catch(console.error);

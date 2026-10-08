import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const provider = ethers.provider;
  const network = await provider.getNetwork();

  console.log("==================================================");
  console.log("Robinhood Chain Balance Check");
  console.log("Network:", network.name, "| Chain ID:", Number(network.chainId));
  console.log("==================================================");

  const deployerBalance = await provider.getBalance(deployer.address);
  console.log("Deployer Address:", deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(deployerBalance), "ETH");

  const keeperAddress = process.env.KEEPER_ADDRESS;
  if (keeperAddress) {
    const keeperBalance = await provider.getBalance(keeperAddress);
    console.log("--------------------------------------------------");
    console.log("Keeper Address:  ", keeperAddress);
    console.log("Keeper Balance:  ", ethers.formatEther(keeperBalance), "ETH");
  }
  console.log("==================================================");
}

main().catch(console.error);

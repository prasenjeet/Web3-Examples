const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy all contracts in the correct order:
 *   1. MyToken  — ERC-20 with initial supply minted to deployer
 *   2. MyNFT    — ERC-721 with URI storage
 *   3. SimpleVault — staking vault; uses MyToken as both deposit and reward token
 *
 * After deployment:
 *   - Ownership of MyToken is transferred to SimpleVault so the vault can mint rewards.
 *   - All addresses are saved to `deployments.json` in the project root.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // ── 1. MyToken ────────────────────────────────────────────────────────────
  console.log("\n[1/3] Deploying MyToken...");
  const MyToken = await ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy(
    "Web3Token",
    "W3T",
    1_000_000 // initial supply in whole token units (scaled by 10^18 in constructor)
  );
  await myToken.waitForDeployment();
  const tokenAddress = await myToken.getAddress();
  console.log("  MyToken deployed to:", tokenAddress);
  console.log(
    "  Initial supply:",
    ethers.formatEther(await myToken.totalSupply()),
    "W3T"
  );

  // ── 2. MyNFT ─────────────────────────────────────────────────────────────
  console.log("\n[2/3] Deploying MyNFT...");
  const MyNFT = await ethers.getContractFactory("MyNFT");
  const myNFT = await MyNFT.deploy("Web3NFT", "W3N");
  await myNFT.waitForDeployment();
  const nftAddress = await myNFT.getAddress();
  console.log("  MyNFT deployed to:", nftAddress);

  // ── 3. SimpleVault ────────────────────────────────────────────────────────
  console.log("\n[3/3] Deploying SimpleVault...");
  const SimpleVault = await ethers.getContractFactory("SimpleVault");
  const simpleVault = await SimpleVault.deploy(
    tokenAddress, // depositToken
    tokenAddress  // rewardToken  (same ERC-20 for simplicity)
  );
  await simpleVault.waitForDeployment();
  const vaultAddress = await simpleVault.getAddress();
  console.log("  SimpleVault deployed to:", vaultAddress);

  // ── Transfer MyToken ownership to vault ───────────────────────────────────
  console.log("\nTransferring MyToken ownership to SimpleVault...");
  const tx = await myToken.transferOwnership(vaultAddress);
  await tx.wait();
  console.log("  Ownership transferred. New owner:", await myToken.owner());

  // ── Persist deployment addresses ─────────────────────────────────────────
  const deployments = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployedAt: new Date().toISOString(),
    contracts: {
      MyToken: tokenAddress,
      MyNFT: nftAddress,
      SimpleVault: vaultAddress,
    },
  };

  const outputPath = path.join(__dirname, "..", "deployments.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployments, null, 2));
  console.log("\nDeployment addresses saved to deployments.json");
  console.log(JSON.stringify(deployments.contracts, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

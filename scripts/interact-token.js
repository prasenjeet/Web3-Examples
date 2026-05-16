const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Demonstrates common ERC-20 interactions with MyToken:
 *   1. Check deployer balance
 *   2. Mint tokens (as owner / vault — requires the signer to own the token)
 *   3. Transfer tokens to a recipient
 *   4. Approve a spender and perform transferFrom
 *
 * Run: npx hardhat run scripts/interact-token.js --network localhost
 * Prerequisites: deploy.js must have been run first so deployments.json exists.
 *
 * NOTE: After deploy.js, ownership of MyToken is held by SimpleVault.
 *       Minting in this script is done via the vault owner's account by
 *       temporarily using the vault's mint path, or if the signer is still
 *       the token owner, directly. Adjust as needed for your setup.
 */
async function main() {
  // ── Load deployment addresses ─────────────────────────────────────────────
  const deploymentsPath = path.join(__dirname, "..", "deployments.json");
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error("deployments.json not found — run deploy.js first.");
  }
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  const { MyToken: tokenAddress } = deployments.contracts;

  const [owner, alice, bob] = await ethers.getSigners();
  console.log("Using account:", owner.address);

  // ── Attach to MyToken ─────────────────────────────────────────────────────
  const MyToken = await ethers.getContractFactory("MyToken");
  const token = MyToken.attach(tokenAddress);

  console.log("\n── Token Info ────────────────────────────────────");
  console.log("  Name:        ", await token.name());
  console.log("  Symbol:      ", await token.symbol());
  console.log("  Total Supply:", ethers.formatEther(await token.totalSupply()), "W3T");

  // ── 1. Check balances ─────────────────────────────────────────────────────
  console.log("\n── Initial Balances ───────────────────────────────");
  const ownerBalance = await token.balanceOf(owner.address);
  console.log(`  ${owner.address}: ${ethers.formatEther(ownerBalance)} W3T`);

  // ── 2. Transfer tokens from owner to alice ────────────────────────────────
  const transferAmount = ethers.parseEther("500");
  console.log("\n── Transfer ────────────────────────────────────────");
  console.log(`  Transferring ${ethers.formatEther(transferAmount)} W3T to Alice (${alice.address})...`);
  const transferTx = await token.connect(owner).transfer(alice.address, transferAmount);
  await transferTx.wait();
  console.log("  Transfer complete. Tx:", transferTx.hash);
  console.log(`  Alice balance: ${ethers.formatEther(await token.balanceOf(alice.address))} W3T`);

  // ── 3. Approve + transferFrom ─────────────────────────────────────────────
  const approveAmount = ethers.parseEther("100");
  console.log("\n── Approve + TransferFrom ──────────────────────────");
  console.log(`  Alice approves Bob (${bob.address}) to spend ${ethers.formatEther(approveAmount)} W3T...`);
  const approveTx = await token.connect(alice).approve(bob.address, approveAmount);
  await approveTx.wait();

  const allowance = await token.allowance(alice.address, bob.address);
  console.log(`  Allowance set: ${ethers.formatEther(allowance)} W3T`);

  console.log(`  Bob performs transferFrom Alice → Bob...`);
  const transferFromTx = await token
    .connect(bob)
    .transferFrom(alice.address, bob.address, approveAmount);
  await transferFromTx.wait();
  console.log("  transferFrom complete. Tx:", transferFromTx.hash);
  console.log(`  Bob balance:   ${ethers.formatEther(await token.balanceOf(bob.address))} W3T`);
  console.log(`  Alice balance: ${ethers.formatEther(await token.balanceOf(alice.address))} W3T`);

  // ── 4. Burn tokens ─────────────────────────────────────────────────────────
  const burnAmount = ethers.parseEther("50");
  console.log("\n── Burn ────────────────────────────────────────────");
  console.log(`  Bob burns ${ethers.formatEther(burnAmount)} W3T...`);
  const burnTx = await token.connect(bob).burn(burnAmount);
  await burnTx.wait();
  console.log("  Burn complete. Tx:", burnTx.hash);
  console.log(`  Bob balance after burn: ${ethers.formatEther(await token.balanceOf(bob.address))} W3T`);
  console.log(`  New total supply: ${ethers.formatEther(await token.totalSupply())} W3T`);

  console.log("\nDone.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

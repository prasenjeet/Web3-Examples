const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const deploymentsPath = path.join(__dirname, "..", "deployments.json");
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error("deployments.json not found — run deploy.js first.");
  }
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  const { MyNFT: nftAddress } = deployments.contracts;

  const [owner, alice] = await ethers.getSigners();
  console.log("Using account:", owner.address);

  const MyNFT = await ethers.getContractFactory("MyNFT");
  const nft = MyNFT.attach(nftAddress);

  console.log("\n── NFT Collection Info ────────────────────────────");
  console.log("  Name:   ", await nft.name());
  console.log("  Symbol: ", await nft.symbol());

  // ── 1. Mint NFT to owner ──────────────────────────────────────────────────
  const sampleURI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1";
  console.log("\n── Minting NFT #1 to owner ──────────────────────────");
  const mintTx = await nft.connect(owner).safeMint(owner.address, sampleURI);
  const receipt = await mintTx.wait();
  const mintedEvent = receipt.logs.find(
    (log) => nft.interface.parseLog(log)?.name === "NFTMinted"
  );
  const parsedEvent = nft.interface.parseLog(mintedEvent);
  const tokenId = parsedEvent.args.tokenId;
  console.log("  Minted tokenId:", tokenId.toString());
  console.log("  Token URI:     ", await nft.tokenURI(tokenId));
  console.log("  Owner:         ", await nft.ownerOf(tokenId));

  // ── 2. Mint NFT to alice ──────────────────────────────────────────────────
  const sampleURI2 = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/2";
  console.log("\n── Minting NFT #2 to Alice ──────────────────────────");
  const mintTx2 = await nft.connect(owner).safeMint(alice.address, sampleURI2);
  const receipt2 = await mintTx2.wait();
  const mintedEvent2 = receipt2.logs.find(
    (log) => nft.interface.parseLog(log)?.name === "NFTMinted"
  );
  const parsedEvent2 = nft.interface.parseLog(mintedEvent2);
  const tokenId2 = parsedEvent2.args.tokenId;
  console.log("  Minted tokenId:", tokenId2.toString());
  console.log("  Owner:         ", await nft.ownerOf(tokenId2));

  // ── 3. List tokens owned by each address ─────────────────────────────────
  console.log("\n── Token Ownership ──────────────────────────────────");
  const ownerBalance = await nft.balanceOf(owner.address);
  console.log(`  Owner holds ${ownerBalance} token(s):`);
  for (let i = 0; i < ownerBalance; i++) {
    const tid = await nft.tokenOfOwnerByIndex(owner.address, i);
    console.log(`    tokenId ${tid}: ${await nft.tokenURI(tid)}`);
  }

  const aliceBalance = await nft.balanceOf(alice.address);
  console.log(`  Alice holds ${aliceBalance} token(s):`);
  for (let i = 0; i < aliceBalance; i++) {
    const tid = await nft.tokenOfOwnerByIndex(alice.address, i);
    console.log(`    tokenId ${tid}: ${await nft.tokenURI(tid)}`);
  }

  // ── 4. Transfer NFT from owner to alice ───────────────────────────────────
  console.log("\n── Transfer NFT #1 from Owner → Alice ───────────────");
  const transferTx = await nft
    .connect(owner)
    ["safeTransferFrom(address,address,uint256)"](
      owner.address,
      alice.address,
      tokenId
    );
  await transferTx.wait();
  console.log("  Transfer complete. Tx:", transferTx.hash);
  console.log("  New owner of tokenId", tokenId.toString(), ":", await nft.ownerOf(tokenId));

  console.log("\n── Final totals ─────────────────────────────────────");
  console.log("  Total minted:", (await nft.totalMinted()).toString());
  console.log("\nDone.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

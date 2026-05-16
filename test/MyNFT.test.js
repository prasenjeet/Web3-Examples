const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyNFT", function () {
  let nft, owner, alice, bob;
  const SAMPLE_URI = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1";
  const SAMPLE_URI_2 = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/2";

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const MyNFT = await ethers.getContractFactory("MyNFT");
    nft = await MyNFT.deploy("Web3NFT", "W3N");
    await nft.waitForDeployment();
  });

  describe("Deployment", function () {
    it("sets name and symbol", async function () {
      expect(await nft.name()).to.equal("Web3NFT");
      expect(await nft.symbol()).to.equal("W3N");
    });

    it("starts with zero tokens minted", async function () {
      expect(await nft.totalMinted()).to.equal(0);
      expect(await nft.totalSupply()).to.equal(0);
    });

    it("sets owner to deployer", async function () {
      expect(await nft.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("allows owner to mint a token", async function () {
      await expect(nft.connect(owner).safeMint(alice.address, SAMPLE_URI))
        .to.emit(nft, "NFTMinted")
        .withArgs(alice.address, 1n, SAMPLE_URI);

      expect(await nft.totalMinted()).to.equal(1);
      expect(await nft.ownerOf(1)).to.equal(alice.address);
    });

    it("assigns sequential token IDs starting at 1", async function () {
      await nft.connect(owner).safeMint(alice.address, SAMPLE_URI);
      await nft.connect(owner).safeMint(bob.address, SAMPLE_URI_2);

      expect(await nft.ownerOf(1)).to.equal(alice.address);
      expect(await nft.ownerOf(2)).to.equal(bob.address);
      expect(await nft.totalMinted()).to.equal(2);
    });

    it("reverts when non-owner tries to mint", async function () {
      await expect(
        nft.connect(alice).safeMint(bob.address, SAMPLE_URI)
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });
  });

  describe("Token URI", function () {
    it("stores and returns token URI", async function () {
      await nft.connect(owner).safeMint(alice.address, SAMPLE_URI);
      expect(await nft.tokenURI(1)).to.equal(SAMPLE_URI);
    });

    it("stores different URIs per token", async function () {
      await nft.connect(owner).safeMint(alice.address, SAMPLE_URI);
      await nft.connect(owner).safeMint(bob.address, SAMPLE_URI_2);
      expect(await nft.tokenURI(1)).to.equal(SAMPLE_URI);
      expect(await nft.tokenURI(2)).to.equal(SAMPLE_URI_2);
    });

    it("reverts tokenURI for non-existent token", async function () {
      await expect(nft.tokenURI(999)).to.be.revertedWithCustomError(
        nft,
        "ERC721NonexistentToken"
      );
    });
  });

  describe("Enumerable", function () {
    beforeEach(async function () {
      await nft.connect(owner).safeMint(alice.address, SAMPLE_URI);
      await nft.connect(owner).safeMint(alice.address, SAMPLE_URI_2);
      await nft.connect(owner).safeMint(bob.address, SAMPLE_URI);
    });

    it("reports correct balance per address", async function () {
      expect(await nft.balanceOf(alice.address)).to.equal(2);
      expect(await nft.balanceOf(bob.address)).to.equal(1);
    });

    it("enumerates tokens by owner index", async function () {
      expect(await nft.tokenOfOwnerByIndex(alice.address, 0)).to.equal(1n);
      expect(await nft.tokenOfOwnerByIndex(alice.address, 1)).to.equal(2n);
      expect(await nft.tokenOfOwnerByIndex(bob.address, 0)).to.equal(3n);
    });

    it("updates enumeration after transfer", async function () {
      await nft.connect(alice)["safeTransferFrom(address,address,uint256)"](
        alice.address,
        bob.address,
        1
      );
      expect(await nft.balanceOf(alice.address)).to.equal(1);
      expect(await nft.balanceOf(bob.address)).to.equal(2);
      expect(await nft.ownerOf(1)).to.equal(bob.address);
    });
  });

  describe("supportsInterface", function () {
    it("supports ERC-721 interface", async function () {
      expect(await nft.supportsInterface("0x80ac58cd")).to.be.true;
    });

    it("supports ERC-721Metadata interface", async function () {
      expect(await nft.supportsInterface("0x5b5e139f")).to.be.true;
    });

    it("supports ERC-721Enumerable interface", async function () {
      expect(await nft.supportsInterface("0x780e9d63")).to.be.true;
    });
  });
});

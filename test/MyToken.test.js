const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken", function () {
  let token, owner, alice, bob;
  const INITIAL_SUPPLY = 1_000_000n;
  const DECIMALS = 18n;
  const INITIAL_SUPPLY_WEI = INITIAL_SUPPLY * 10n ** DECIMALS;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const MyToken = await ethers.getContractFactory("MyToken");
    token = await MyToken.deploy("Web3Token", "W3T", INITIAL_SUPPLY);
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("sets name and symbol", async function () {
      expect(await token.name()).to.equal("Web3Token");
      expect(await token.symbol()).to.equal("W3T");
    });

    it("sets decimals to 18", async function () {
      expect(await token.decimals()).to.equal(18);
    });

    it("mints initial supply to deployer", async function () {
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY_WEI);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY_WEI);
    });

    it("sets owner to deployer", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("allows owner to mint tokens", async function () {
      const amount = ethers.parseEther("500");
      await expect(token.connect(owner).mint(alice.address, amount))
        .to.emit(token, "TokensMinted")
        .withArgs(alice.address, amount);

      expect(await token.balanceOf(alice.address)).to.equal(amount);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY_WEI + amount);
    });

    it("reverts when non-owner tries to mint", async function () {
      await expect(
        token.connect(alice).mint(bob.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });

  describe("Transfers", function () {
    it("transfers tokens between accounts", async function () {
      const amount = ethers.parseEther("1000");
      await token.connect(owner).transfer(alice.address, amount);
      expect(await token.balanceOf(alice.address)).to.equal(amount);
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY_WEI - amount);
    });

    it("reverts when transferring more than balance", async function () {
      await expect(
        token.connect(alice).transfer(bob.address, 1n)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });
  });

  describe("Approval and TransferFrom", function () {
    it("sets allowance and allows transferFrom", async function () {
      const amount = ethers.parseEther("200");
      await token.connect(owner).transfer(alice.address, amount);
      await token.connect(alice).approve(bob.address, amount);

      expect(await token.allowance(alice.address, bob.address)).to.equal(amount);

      await token.connect(bob).transferFrom(alice.address, bob.address, amount);
      expect(await token.balanceOf(bob.address)).to.equal(amount);
      expect(await token.allowance(alice.address, bob.address)).to.equal(0n);
    });

    it("reverts transferFrom when allowance insufficient", async function () {
      const amount = ethers.parseEther("100");
      await token.connect(owner).transfer(alice.address, amount);

      await expect(
        token.connect(bob).transferFrom(alice.address, bob.address, amount)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });
  });

  describe("Burning", function () {
    it("allows token holders to burn their own tokens", async function () {
      const burnAmount = ethers.parseEther("10000");
      await token.connect(owner).burn(burnAmount);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY_WEI - burnAmount);
      expect(await token.balanceOf(owner.address)).to.equal(
        INITIAL_SUPPLY_WEI - burnAmount
      );
    });

    it("reverts when burning more than balance", async function () {
      await expect(
        token.connect(alice).burn(1n)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });
  });
});

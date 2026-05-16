const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const SECONDS_PER_DAY = 86_400;

async function increaseTime(seconds) {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");
}

describe("SimpleVault", function () {
  let token, vault, owner, alice, bob;
  const INITIAL_SUPPLY = 1_000_000n;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    const MyToken = await ethers.getContractFactory("MyToken");
    token = await MyToken.deploy("Web3Token", "W3T", INITIAL_SUPPLY);
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    const SimpleVault = await ethers.getContractFactory("SimpleVault");
    vault = await SimpleVault.deploy(tokenAddress, tokenAddress);
    await vault.waitForDeployment();

    // Transfer token ownership to vault so it can mint rewards.
    await token.connect(owner).transferOwnership(await vault.getAddress());

    // Fund alice and bob from owner's initial supply (owner → alice/bob before ownership transfer).
    // We do this by transferring directly since we had the tokens before ownership transfer.
    // Owner's tokens were minted at deployment; token is now owned by vault.
    // We need alice to have tokens to deposit. Let's mint via vault... but vault doesn't expose mint.
    // Instead, re-approach: owner retains initial supply from deployment and transfers to alice/bob.
    // Transfer from owner's balance (from initial supply minted at deployment).
    await token
      .connect(owner)
      .transfer(alice.address, ethers.parseEther("10000"));
    await token
      .connect(owner)
      .transfer(bob.address, ethers.parseEther("5000"));
  });

  describe("Deployment", function () {
    it("stores deposit and reward token addresses", async function () {
      const tokenAddress = await token.getAddress();
      expect(await vault.depositToken()).to.equal(tokenAddress);
    });

    it("starts with zero balances", async function () {
      expect(await vault.balanceOf(alice.address)).to.equal(0);
      expect(await vault.pendingRewards(alice.address)).to.equal(0);
    });
  });

  describe("Deposit", function () {
    it("accepts a deposit and records the balance", async function () {
      const amount = ethers.parseEther("1000");
      await token.connect(alice).approve(await vault.getAddress(), amount);

      await expect(vault.connect(alice).deposit(amount))
        .to.emit(vault, "Deposited")
        .withArgs(alice.address, amount);

      expect(await vault.balanceOf(alice.address)).to.equal(amount);
    });

    it("transfers tokens from user to vault", async function () {
      const amount = ethers.parseEther("500");
      await token.connect(alice).approve(await vault.getAddress(), amount);
      await vault.connect(alice).deposit(amount);

      expect(await token.balanceOf(await vault.getAddress())).to.equal(amount);
    });

    it("reverts on zero deposit", async function () {
      await expect(vault.connect(alice).deposit(0)).to.be.revertedWith(
        "SimpleVault: amount must be > 0"
      );
    });

    it("reverts when allowance is insufficient", async function () {
      const amount = ethers.parseEther("100");
      await expect(vault.connect(alice).deposit(amount)).to.be.reverted;
    });

    it("settles existing rewards on second deposit", async function () {
      const amount = ethers.parseEther("1000");
      await token.connect(alice).approve(await vault.getAddress(), amount * 2n);

      await vault.connect(alice).deposit(amount);
      await increaseTime(SECONDS_PER_DAY);

      // Second deposit should settle rewards for day 1.
      await vault.connect(alice).deposit(amount);

      const info = await vault.deposits(alice.address);
      // pendingAccrued should be 1% of original deposit (1000 * 0.01 * 1 day)
      expect(info.pendingAccrued).to.equal(ethers.parseEther("10"));
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("2000");
      await token.connect(alice).approve(await vault.getAddress(), amount);
      await vault.connect(alice).deposit(amount);
    });

    it("allows partial withdrawal", async function () {
      const withdrawAmount = ethers.parseEther("500");
      const aliceBalBefore = await token.balanceOf(alice.address);

      await expect(vault.connect(alice).withdraw(withdrawAmount))
        .to.emit(vault, "Withdrawn")
        .withArgs(alice.address, withdrawAmount);

      expect(await vault.balanceOf(alice.address)).to.equal(
        ethers.parseEther("1500")
      );
      expect(await token.balanceOf(alice.address)).to.equal(
        aliceBalBefore + withdrawAmount
      );
    });

    it("allows full withdrawal", async function () {
      const full = ethers.parseEther("2000");
      await vault.connect(alice).withdraw(full);
      expect(await vault.balanceOf(alice.address)).to.equal(0);
    });

    it("reverts when withdrawing more than deposited", async function () {
      await expect(
        vault.connect(alice).withdraw(ethers.parseEther("9999"))
      ).to.be.revertedWith("SimpleVault: insufficient balance");
    });

    it("reverts on zero withdrawal", async function () {
      await expect(vault.connect(alice).withdraw(0)).to.be.revertedWith(
        "SimpleVault: amount must be > 0"
      );
    });
  });

  describe("Pending Rewards", function () {
    const depositAmount = ethers.parseEther("1000");

    beforeEach(async function () {
      await token.connect(alice).approve(await vault.getAddress(), depositAmount);
      await vault.connect(alice).deposit(depositAmount);
    });

    it("returns zero rewards immediately after deposit", async function () {
      expect(await vault.pendingRewards(alice.address)).to.equal(0);
    });

    it("accrues 1% per day", async function () {
      await increaseTime(SECONDS_PER_DAY);
      const expected = ethers.parseEther("10"); // 1000 * 1% * 1 day
      expect(await vault.pendingRewards(alice.address)).to.equal(expected);
    });

    it("accrues correctly over multiple days", async function () {
      await increaseTime(SECONDS_PER_DAY * 5);
      const expected = ethers.parseEther("50"); // 1000 * 1% * 5 days
      expect(await vault.pendingRewards(alice.address)).to.equal(expected);
    });

    it("returns zero when no deposit exists", async function () {
      expect(await vault.pendingRewards(bob.address)).to.equal(0);
    });
  });

  describe("Claim Rewards", function () {
    const depositAmount = ethers.parseEther("1000");

    beforeEach(async function () {
      await token.connect(alice).approve(await vault.getAddress(), depositAmount);
      await vault.connect(alice).deposit(depositAmount);
      await increaseTime(SECONDS_PER_DAY * 3);
    });

    it("mints rewards to caller", async function () {
      const expectedRewards = ethers.parseEther("30"); // 1000 * 1% * 3 days
      const balBefore = await token.balanceOf(alice.address);

      await expect(vault.connect(alice).claimRewards())
        .to.emit(vault, "RewardsClaimed")
        .withArgs(alice.address, expectedRewards);

      expect(await token.balanceOf(alice.address)).to.equal(
        balBefore + expectedRewards
      );
    });

    it("resets pending rewards after claim", async function () {
      await vault.connect(alice).claimRewards();
      expect(await vault.pendingRewards(alice.address)).to.equal(0);
    });

    it("reverts when no rewards are available", async function () {
      await vault.connect(alice).claimRewards();
      // Claim again immediately — sub-day no rewards
      await expect(vault.connect(alice).claimRewards()).to.be.revertedWith(
        "SimpleVault: no rewards to claim"
      );
    });

    it("reverts when user has no deposit", async function () {
      await expect(vault.connect(bob).claimRewards()).to.be.revertedWith(
        "SimpleVault: no rewards to claim"
      );
    });
  });
});

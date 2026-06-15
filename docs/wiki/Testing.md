# Testing

Tests live in `test/` and use **Hardhat Toolbox** (Mocha + Chai + ethers.js). They run entirely on Hardhat's in-process network — no external node is required.

---

## Running Tests

```bash
# All tests
npm test

# With gas usage report
REPORT_GAS=true npm test

# Coverage report (lcov + HTML)
npm run test:coverage
```

---

## Test Files

| File | Contract | Tests |
|---|---|---|
| `test/MyToken.test.js` | `MyToken` | 9 |
| `test/MyNFT.test.js` | `MyNFT` | 13 |
| `test/SimpleVault.test.js` | `SimpleVault` | 17 |

---

## MyToken Tests (`test/MyToken.test.js`)

### Deployment
- Sets name and symbol correctly
- Sets decimals to 18
- Mints initial supply to the deployer
- Sets owner to deployer

### Minting
- Owner can mint tokens → emits `TokensMinted`
- Non-owner reverts with `OwnableUnauthorizedAccount`

### Transfers
- Transfers tokens between accounts
- Reverts when transferring more than balance (`ERC20InsufficientBalance`)

### Approval and TransferFrom
- Sets allowance and allows `transferFrom`
- Reverts when allowance is insufficient

### Burning
- Holders can burn their own tokens
- Reverts when burning more than balance

---

## MyNFT Tests (`test/MyNFT.test.js`)

### Deployment
- Sets name and symbol
- Starts with zero tokens minted
- Sets owner to deployer

### Minting
- Owner can mint → emits `NFTMinted`
- Token IDs are sequential starting at 1
- Non-owner reverts with `OwnableUnauthorizedAccount`

### Token URI
- Stores and returns the correct URI
- Different tokens have different URIs
- Non-existent token reverts with `ERC721NonexistentToken`

### Enumerable
- Reports correct per-address balance
- Enumerates tokens by owner index
- Updates enumeration correctly after a transfer

### supportsInterface
- Reports `true` for ERC-721 (`0x80ac58cd`)
- Reports `true` for ERC-721Metadata (`0x5b5e139f`)
- Reports `true` for ERC-721Enumerable (`0x780e9d63`)

---

## SimpleVault Tests (`test/SimpleVault.test.js`)

### Deployment
- Stores deposit and reward token addresses
- Starts with zero balances

### Deposit
- Accepts a deposit and records the balance → emits `Deposited`
- Transfers tokens from user to vault
- Reverts on zero deposit
- Reverts when allowance is insufficient
- Settles existing rewards into `pendingAccrued` on a second deposit

### Withdraw
- Allows partial withdrawal → emits `Withdrawn`
- Allows full withdrawal
- Reverts when withdrawing more than deposited
- Reverts on zero withdrawal

### Pending Rewards
- Returns zero immediately after deposit
- Accrues 1% per day after one day
- Accrues correctly over multiple days
- Returns zero when no deposit exists

### Claim Rewards
- Mints rewards to caller → emits `RewardsClaimed`
- Resets pending rewards after claim
- Reverts when no rewards are available (sub-day elapsed)
- Reverts when user has no deposit

---

## Time Travel

The vault tests use Hardhat's `evm_increaseTime` to advance the block timestamp:

```javascript
async function increaseTime(seconds) {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");
}

// Advance 1 day
await increaseTime(86_400);

// Advance 5 days
await increaseTime(86_400 * 5);
```

`evm_mine` is called after `evm_increaseTime` to commit a new block with the updated timestamp.

---

## Test Structure Pattern

Each test file follows this structure:

```javascript
describe("ContractName", function () {
  let contract, owner, alice, bob;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContractName");
    contract = await Factory.deploy(/* args */);
    await contract.waitForDeployment();
  });

  describe("Feature group", function () {
    it("specific behaviour", async function () {
      await expect(contract.someFunction())
        .to.emit(contract, "SomeEvent")
        .withArgs(expectedArg);
    });
  });
});
```

Each `beforeEach` deploys a fresh contract instance, so tests are fully isolated.

---

## Coverage

```bash
npm run test:coverage
```

Opens an HTML report at `coverage/index.html`. The `hardhat-toolbox` includes `solidity-coverage` out of the box.

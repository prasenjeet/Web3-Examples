# Staking Vault (SimpleVault)

**File:** `contracts/SimpleVault.sol`  
**Reward rate:** 1% per day (simple interest)  
**Security:** `ReentrancyGuard` + `SafeERC20`

---

## Overview

`SimpleVault` is a minimal staking contract: users deposit an ERC-20 token and earn reward tokens at a fixed 1% per day rate. The vault must own the reward token contract so it can mint rewards on demand.

In this project, the deposit token and reward token are the **same** (`MyToken`). The deploy script transfers `MyToken` ownership to the vault after deployment.

---

## Inheritance and Imports

```
SimpleVault
  └── ReentrancyGuard  (OpenZeppelin)

Uses:
  SafeERC20    — safe transfer wrappers
  IERC20       — deposit token interface
  IMintable    — minimal interface for reward minting (mint function)
```

---

## State

```solidity
IERC20 public immutable depositToken;
IMintable public immutable rewardToken;

struct UserInfo {
    uint256 depositAmount;   // total tokens currently staked
    uint256 depositedAt;     // timestamp of last deposit/claim (reward clock start)
    uint256 pendingAccrued;  // settled rewards not yet claimed
}

mapping(address => UserInfo) public deposits;
```

### Constants

| Constant | Value | Description |
|---|---|---|
| `REWARD_RATE_BPS` | `100` | 1% in basis points |
| `BPS_DENOMINATOR` | `10_000` | Basis point divisor |
| `SECONDS_PER_DAY` | `86_400` | Reward granularity |

---

## Constructor

```solidity
constructor(address _depositToken, address _rewardToken)
```

Both addresses can be the same contract if the deposit token also serves as the reward.

---

## Functions

### `deposit(uint256 amount)`

Transfer `amount` tokens from the caller into the vault.

1. If the caller already has a position, outstanding rewards are settled into `pendingAccrued`
2. Tokens are pulled via `safeTransferFrom` (requires prior `approve`)
3. `depositAmount` increases; `depositedAt` resets to `block.timestamp`

```solidity
function deposit(uint256 amount) external nonReentrant
```

**Emits:** `Deposited(address indexed user, uint256 amount)`

**Requires:** caller has approved the vault to spend `amount` tokens.

---

### `withdraw(uint256 amount)`

Return `amount` tokens to the caller.

1. Outstanding rewards are settled into `pendingAccrued`
2. `depositAmount` decreases; `depositedAt` resets
3. Tokens are sent via `safeTransfer`

```solidity
function withdraw(uint256 amount) external nonReentrant
```

**Emits:** `Withdrawn(address indexed user, uint256 amount)`

---

### `claimRewards()`

Mint and transfer all pending reward tokens to the caller.

1. Computes `pendingAccrued + _computeRewards(...)`
2. Resets `pendingAccrued` to 0 and restarts the reward clock
3. Calls `rewardToken.mint(msg.sender, rewards)` — requires the vault to own the reward token

```solidity
function claimRewards() external nonReentrant
```

**Emits:** `RewardsClaimed(address indexed user, uint256 amount)`

---

### `pendingRewards(address user) view returns (uint256)`

Returns the total claimable reward amount at the current block, including both `pendingAccrued` and newly accrued rewards since the last deposit/claim.

---

### `balanceOf(address user) view returns (uint256)`

Returns the staked token balance for `user`.

---

## Reward Formula

```
rewards = depositAmount × REWARD_RATE_BPS × elapsedDays
          ─────────────────────────────────────────────
                       BPS_DENOMINATOR

       = depositAmount × 100 × floor(elapsedSeconds / 86400)
         ──────────────────────────────────────────────────
                            10000

       = depositAmount × 1% × days
```

**Important:** Rewards accrue in whole-day increments. A deposit held for 23 hours earns nothing; at 24 hours it earns 1%.

---

## Reward Settlement Pattern

To prevent reward manipulation on balance changes, every `deposit` and `withdraw` **settles** outstanding rewards into `pendingAccrued` before changing `depositAmount`:

```
deposit(X):
  pendingAccrued += _computeRewards(currentAmount, depositedAt)
  depositAmount  += X
  depositedAt     = now          // ← clock restarts on new total

claimRewards():
  total           = pendingAccrued + _computeRewards(depositAmount, depositedAt)
  pendingAccrued  = 0
  depositedAt     = now          // ← clock restarts
  mint(total)
```

---

## Usage Example (ethers.js)

```javascript
const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
const amount = ethers.parseEther("1000");

// 1. Approve
await token.approve(VAULT_ADDRESS, amount);

// 2. Deposit
await vault.deposit(amount);

// 3. Check rewards (after time passes)
const rewards = await vault.pendingRewards(account);
console.log("Pending:", ethers.formatEther(rewards), "W3T");

// 4. Claim
await vault.claimRewards();
```

---

## Security Notes

- `ReentrancyGuard` on all state-changing functions prevents re-entrancy attacks
- `SafeERC20` wraps all token transfers — reverts on failure rather than returning `false`
- The vault trusts `rewardToken.mint` — if ownership were changed away from the vault, `claimRewards` would revert
- Simple interest (not compound) — no overflow risk even for large balances over long durations

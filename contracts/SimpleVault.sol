// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Minimal interface required to mint reward tokens from the vault.
interface IMintable {
    function mint(address to, uint256 amount) external;
}

/**
 * @title SimpleVault
 * @dev A staking vault that accepts an ERC-20 deposit token and distributes
 *      reward tokens based on simple interest (1% per day).
 *
 *      Reward model
 *      ─────────────
 *      rewards = depositAmount * 1% * elapsedDays
 *
 *      The vault must hold the `owner` role of the rewardToken so it can
 *      mint rewards on demand. If the deposit token and reward token are the
 *      same contract, transfer ownership of that token to this vault after
 *      deployment.
 *
 *      Per-user state
 *      ─────────────
 *      Each user has a single "position": one deposit amount + one timestamp.
 *      Additional deposits accumulate rewards up to that point first, then
 *      reset the clock on the new combined balance.
 */
contract SimpleVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable depositToken;
    IMintable public immutable rewardToken;

    /// @dev 1% per day expressed in basis points (100 = 1%).
    uint256 public constant REWARD_RATE_BPS = 100;
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant SECONDS_PER_DAY = 86_400;

    struct UserInfo {
        uint256 depositAmount;
        uint256 depositedAt;      // timestamp of last deposit/claim settlement
        uint256 pendingAccrued;   // rewards that have been settled but not yet claimed
    }

    mapping(address => UserInfo) public deposits;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);

    /**
     * @param _depositToken  ERC-20 token users stake into the vault.
     * @param _rewardToken   ERC-20 token (with mint) paid out as rewards.
     *                       May be the same address as _depositToken.
     */
    constructor(address _depositToken, address _rewardToken) {
        require(_depositToken != address(0), "SimpleVault: zero deposit token");
        require(_rewardToken != address(0), "SimpleVault: zero reward token");
        depositToken = IERC20(_depositToken);
        rewardToken = IMintable(_rewardToken);
    }

    // -----------------------------------------------------------------------
    // Core actions
    // -----------------------------------------------------------------------

    /**
     * @dev Deposit `amount` tokens into the vault.
     *      If the caller already has a position, outstanding rewards are settled
     *      into `pendingAccrued` before the new deposit is added.
     * @param amount Token amount in wei.
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "SimpleVault: amount must be > 0");

        UserInfo storage info = deposits[msg.sender];

        // Settle any accrued rewards into pendingAccrued before changing balance.
        if (info.depositAmount > 0) {
            info.pendingAccrued += _computeRewards(info.depositAmount, info.depositedAt);
        }

        // Pull tokens from user (requires prior approval).
        depositToken.safeTransferFrom(msg.sender, address(this), amount);

        info.depositAmount += amount;
        info.depositedAt = block.timestamp;

        emit Deposited(msg.sender, amount);
    }

    /**
     * @dev Withdraw `amount` tokens from the vault.
     *      Outstanding rewards are settled into `pendingAccrued`; the clock
     *      resets on the remaining balance.
     * @param amount Token amount in wei.
     */
    function withdraw(uint256 amount) external nonReentrant {
        UserInfo storage info = deposits[msg.sender];
        require(info.depositAmount >= amount, "SimpleVault: insufficient balance");
        require(amount > 0, "SimpleVault: amount must be > 0");

        // Settle rewards before changing balance.
        info.pendingAccrued += _computeRewards(info.depositAmount, info.depositedAt);

        info.depositAmount -= amount;
        info.depositedAt = block.timestamp;

        depositToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @dev Mint and transfer all pending reward tokens to the caller.
     *      Requires this vault to be the owner of the rewardToken contract.
     */
    function claimRewards() external nonReentrant {
        UserInfo storage info = deposits[msg.sender];

        uint256 rewards = info.pendingAccrued +
            _computeRewards(info.depositAmount, info.depositedAt);

        require(rewards > 0, "SimpleVault: no rewards to claim");

        // Reset accrued state; restart clock from now.
        info.pendingAccrued = 0;
        info.depositedAt = block.timestamp;

        rewardToken.mint(msg.sender, rewards);

        emit RewardsClaimed(msg.sender, rewards);
    }

    // -----------------------------------------------------------------------
    // View helpers
    // -----------------------------------------------------------------------

    /**
     * @dev Returns the total claimable rewards for `user` at the current block.
     */
    function pendingRewards(address user) external view returns (uint256) {
        UserInfo storage info = deposits[user];
        return info.pendingAccrued + _computeRewards(info.depositAmount, info.depositedAt);
    }

    /**
     * @dev Returns the deposited balance for `user`.
     */
    function balanceOf(address user) external view returns (uint256) {
        return deposits[user].depositAmount;
    }

    // -----------------------------------------------------------------------
    // Internal
    // -----------------------------------------------------------------------

    /**
     * @dev Computes simple-interest rewards: amount * 1% * elapsedDays.
     *      Uses integer division; sub-day time does not accrue.
     */
    function _computeRewards(
        uint256 amount,
        uint256 since
    ) internal view returns (uint256) {
        if (amount == 0 || since == 0) return 0;
        uint256 elapsed = block.timestamp - since;
        uint256 days_ = elapsed / SECONDS_PER_DAY;
        return (amount * REWARD_RATE_BPS * days_) / BPS_DENOMINATOR;
    }
}

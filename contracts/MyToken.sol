// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyToken
 * @dev ERC-20 token with minting and burning capabilities.
 *      Ownership controls who can mint new tokens.
 *      Initial supply is minted to the deployer/owner on construction.
 */
contract MyToken is ERC20, ERC20Burnable, Ownable {
    uint8 private constant DECIMALS = 18;

    event TokensMinted(address indexed to, uint256 amount);

    /**
     * @param name       Token name (e.g. "Web3Token")
     * @param symbol     Token symbol (e.g. "W3T")
     * @param initialSupply  Amount in whole tokens (will be scaled by 10^18 internally)
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply * (10 ** DECIMALS));
    }

    /**
     * @dev Mints `amount` tokens (in wei units) to `to`.
     *      Only callable by the current owner (e.g. the deployer or a vault contract).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Returns the number of decimals used to get the token's user representation.
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
}

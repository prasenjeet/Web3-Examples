# ERC-20 Token (MyToken)

**File:** `contracts/MyToken.sol`  
**Standard:** ERC-20 (OpenZeppelin v5)  
**Symbol:** W3T | **Decimals:** 18

---

## Inheritance

```
MyToken
  ├── ERC20         — standard token logic
  ├── ERC20Burnable — adds burn() and burnFrom()
  └── Ownable       — single-owner access control
```

---

## Constructor

```solidity
constructor(string memory name, string memory symbol, uint256 initialSupply)
```

| Parameter | Type | Description |
|---|---|---|
| `name` | `string` | Token name, e.g. `"Web3Token"` |
| `symbol` | `string` | Ticker, e.g. `"W3T"` |
| `initialSupply` | `uint256` | Whole-token amount; scaled by 10¹⁸ internally |

The deployer receives `initialSupply × 10¹⁸` tokens and becomes the initial owner.

**Deploy example:**
```javascript
const token = await MyToken.deploy("Web3Token", "W3T", 1_000_000);
```

---

## Functions

### `mint(address to, uint256 amount)`

Mints `amount` (in wei) to `to`. **Only callable by the current owner.**

After the deployment script runs, ownership is transferred to `SimpleVault`, so the vault calls this when distributing staking rewards.

```solidity
function mint(address to, uint256 amount) external onlyOwner
```

**Emits:** `TokensMinted(address indexed to, uint256 amount)`

### Inherited from ERC20Burnable

```solidity
function burn(uint256 amount) public
function burnFrom(address account, uint256 amount) public
```

Token holders can burn their own tokens. `burnFrom` requires a prior `approve`.

### Standard ERC-20 Functions

```solidity
function transfer(address to, uint256 amount) returns (bool)
function transferFrom(address from, address to, uint256 amount) returns (bool)
function approve(address spender, uint256 amount) returns (bool)
function allowance(address owner, address spender) view returns (uint256)
function balanceOf(address account) view returns (uint256)
function totalSupply() view returns (uint256)
```

---

## Events

| Event | Parameters | When |
|---|---|---|
| `Transfer` | `from, to, value` | Any token movement |
| `Approval` | `owner, spender, value` | After `approve` |
| `TokensMinted` | `to, amount` | After `mint` |

---

## Interaction Script

```bash
npm run interact:token
```

Demonstrates: balance check → transfer → approve + transferFrom → burn.

Source: `scripts/interact-token.js`

---

## ethers.js ABI Snippet

```javascript
const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
];
```

---

## Ownership Transfer

The deploy script transfers ownership to `SimpleVault` so the vault can mint rewards:

```javascript
await myToken.transferOwnership(vaultAddress);
```

To mint tokens manually after this, you would need to call through the vault's reward mechanism or transfer ownership back first.

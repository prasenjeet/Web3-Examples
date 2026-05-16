# Web3 Examples

A production-quality Web3 sample project demonstrating ERC-20 tokens, ERC-721 NFTs, and a staking vault — complete with Hardhat smart contracts, deployment scripts, comprehensive tests, and a React/Vite frontend with MetaMask integration.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Contract Architecture](#contract-architecture)
- [Frontend Features](#frontend-features)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

---

## Project Overview

This repository showcases three interconnected smart contracts and a full React frontend:

| Contract | Type | Description |
|---|---|---|
| `MyToken` | ERC-20 | Fungible token with mint and burn, owner-controlled |
| `MyNFT` | ERC-721 | NFT collection with per-token URI metadata and enumeration |
| `SimpleVault` | Custom | Staking vault — deposit W3T tokens, earn 1% per day |

The frontend connects to MetaMask, reads on-chain state, and lets users interact with all three contracts through a clean tabbed UI.

---

## Prerequisites

- **Node.js** v18 or higher (`node --version`)
- **npm** v9 or higher (`npm --version`)
- **MetaMask** browser extension (for the frontend)
- A running local Hardhat node **or** Sepolia testnet access

---

## Quick Start

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd Web3-Examples
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and fill in your PRIVATE_KEY and SEPOLIA_RPC_URL if deploying to testnet
```

### 3. Compile contracts

```bash
npm run compile
```

### 4. Run tests

```bash
npm test
```

### 5. Start a local Hardhat node

```bash
npm run node
# Keep this terminal open
```

### 6. Deploy contracts locally

```bash
# In a new terminal:
npm run deploy:local
```

This saves deployed addresses to `deployments.json`.

### 7. Run interaction scripts

```bash
npm run interact:token   # ERC-20 interactions
npm run interact:nft     # NFT minting and listing
```

### 8. Launch the frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## Contract Architecture

### MyToken (ERC-20)

Located at `contracts/MyToken.sol`.

- Inherits `ERC20`, `ERC20Burnable`, and `Ownable` from OpenZeppelin v5.
- The constructor mints an initial supply (in whole token units) to the deployer.
- The `mint(address to, uint256 amount)` function is restricted to the owner — after deployment the owner is transferred to `SimpleVault` so the vault can distribute rewards.
- Token decimals are 18.

### MyNFT (ERC-721)

Located at `contracts/MyNFT.sol`.

- Inherits `ERC721URIStorage`, `ERC721Enumerable`, and `Ownable`.
- Token IDs start at 1 and increment sequentially using a private counter.
- `safeMint(address to, string memory uri)` mints a new token, stores its metadata URI, and returns the new `tokenId`.
- Implements the required overrides for the combined `ERC721URIStorage` + `ERC721Enumerable` inheritance.
- `supportsInterface` correctly delegates to all parents.

### SimpleVault (Staking Vault)

Located at `contracts/SimpleVault.sol`.

- Accepts any ERC-20 as the deposit token; reward token can be a separate address (or the same one).
- **Reward formula:** `rewards = depositAmount x 1% x elapsedDays` (simple interest, integer days only).
- Per-user state: `depositAmount`, `depositedAt` timestamp, `pendingAccrued` (settled rewards not yet claimed).
- On each deposit or withdrawal, outstanding rewards are settled into `pendingAccrued` before mutating the balance — this prevents reward manipulation.
- `claimRewards()` mints reward tokens directly to the caller. The vault must hold ownership of the reward token contract.
- Uses OpenZeppelin `ReentrancyGuard` and `SafeERC20` for safety.

### Deployment Order

```
MyToken  ->  MyNFT  ->  SimpleVault(tokenAddr, tokenAddr)
                              |
                   transferOwnership(MyToken -> vault)
```

---

## Frontend Features

The React/Vite frontend (`frontend/`) provides four main panels:

### Wallet Connect
- Connects to MetaMask via `eth_requestAccounts`.
- Displays truncated wallet address and active network name.
- Handles `accountsChanged` and `chainChanged` events automatically.

### Token Dashboard
- Shows token name, symbol, and your current W3T balance.
- Owner can mint new tokens to any address.
- Transfer tokens to any address.
- Refresh balances on demand.

### NFT Gallery
- Mint new NFTs by providing an IPFS metadata URI.
- Lists all NFTs owned by the connected wallet as cards showing the token ID.

### Vault Dashboard
- Shows your deposited W3T amount and accrued pending rewards.
- Deposit W3T into the vault (requires prior token approval).
- Withdraw deposited W3T.
- Claim accrued reward tokens.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Description |
|---|---|
| `PRIVATE_KEY` | Deployer private key (without `0x` prefix) |
| `SEPOLIA_RPC_URL` | Sepolia RPC endpoint (e.g., from Infura or Alchemy) |
| `ETHERSCAN_API_KEY` | For contract verification on Etherscan |
| `REPORT_GAS` | Set to `"true"` to enable gas usage reports during tests |
| `COINMARKETCAP_API_KEY` | Optional; used by hardhat-gas-reporter for USD cost estimates |

The frontend reads `VITE_TOKEN_ADDRESS`, `VITE_NFT_ADDRESS`, and `VITE_VAULT_ADDRESS` from `frontend/.env` (copy from `deployments.json` after deploying).

---

## Testing

Tests live in `test/` and use Hardhat's built-in testing stack (Mocha + Chai + ethers.js).

```bash
# Run all tests
npm test

# Run with gas reporting
REPORT_GAS=true npm test

# Coverage report
npm run test:coverage
```

### Test coverage

| File | What is tested |
|---|---|
| `MyToken.test.js` | Deployment, minting (onlyOwner), transfer, burn, approve + transferFrom |
| `MyNFT.test.js` | Deployment, safeMint, tokenURI, ownerOf, enumerable listing |
| `SimpleVault.test.js` | Deposit, withdraw, time-based rewards (`evm_increaseTime`), claimRewards |

---

## Deployment

### Local (Hardhat node)

```bash
npm run node            # terminal 1
npm run deploy:local    # terminal 2
```

### Sepolia testnet

```bash
# Ensure PRIVATE_KEY and SEPOLIA_RPC_URL are set in .env
npm run deploy:sepolia
```

### Verify on Etherscan

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

---

## Project Structure

```
Web3-Examples/
├── README.md                       # This file
├── package.json                    # Hardhat project root
├── hardhat.config.js               # Network, compiler, gas reporter config
├── .env.example                    # Environment variable template
├── .gitignore
├── contracts/
│   ├── MyToken.sol                 # ERC-20 with mint/burn
│   ├── MyNFT.sol                   # ERC-721 with URI storage + enumerable
│   └── SimpleVault.sol             # Staking vault with 1%/day rewards
├── scripts/
│   ├── deploy.js                   # Deploy all contracts, save addresses
│   ├── interact-token.js           # ERC-20 interaction examples
│   └── interact-nft.js             # NFT mint and list examples
├── test/
│   ├── MyToken.test.js
│   ├── MyNFT.test.js
│   └── SimpleVault.test.js
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── App.css
        ├── hooks/
        │   └── useWeb3.js          # MetaMask connection hook
        ├── utils/
        │   └── contracts.js        # Contract factory helpers + ABIs
        └── components/
            ├── WalletConnect.jsx
            ├── TokenDashboard.jsx
            ├── NFTGallery.jsx
            └── VaultDashboard.jsx
```

# Web3 Examples — Wiki

A hands-on Web3 reference project covering ERC-20 tokens, ERC-721 NFTs, a DeFi staking vault, and a React frontend with built-in wallet management — no browser extension required for local development.

---

## Pages

| Page | Description |
|---|---|
| [Getting Started](Getting-Started) | Installation, compilation, local node, first deploy |
| [Smart Contracts](Smart-Contracts) | Architecture overview and contract interaction map |
| [ERC-20 Token](ERC20-Token) | `MyToken` — mint, burn, transfer, allowances |
| [ERC-721 NFT](ERC721-NFT) | `MyNFT` — minting, URI metadata, enumeration |
| [Staking Vault](Staking-Vault) | `SimpleVault` — deposit, rewards, claim |
| [Wallet Management](Wallet-Management) | Generate wallets in-browser with ethers.js |
| [Frontend Guide](Frontend-Guide) | Running the Vite/React app, env config |
| [Testing](Testing) | Hardhat test suite, time-travel, coverage |
| [Deployment](Deployment) | Local node, Sepolia testnet, Etherscan verification |

---

## Quick Start

```bash
# 1 — Install dependencies
npm install

# 2 — Compile contracts
npm run compile

# 3 — Run tests
npm test

# 4 — Start local node (keep open)
npm run node

# 5 — Deploy (new terminal)
npm run deploy:local

# 6 — Launch frontend
cd frontend && npm install && npm run dev
```

## Technology Stack

| Layer | Technology |
|---|---|
| Smart contracts | Solidity 0.8.24, OpenZeppelin v5 |
| Dev framework | Hardhat 2.x |
| Frontend | React 18, Vite 5 |
| Web3 library | ethers.js v6 |
| Test runner | Mocha + Chai (via Hardhat Toolbox) |
| Networks | Hardhat local, Sepolia testnet |

# Getting Started

## Prerequisites

| Tool | Minimum version | Check |
|---|---|---|
| Node.js | 18.x | `node --version` |
| npm | 9.x | `npm --version` |
| Git | any | `git --version` |
| MetaMask (optional) | latest | browser extension |

You do **not** need MetaMask — the frontend can generate a wallet locally. MetaMask is only needed if you want to use an existing injected wallet.

---

## 1. Clone and install

```bash
git clone https://github.com/prasenjeet/Web3-Examples.git
cd Web3-Examples
npm install
```

Install frontend dependencies separately:

```bash
cd frontend
npm install
cd ..
```

---

## 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` only if you plan to deploy to a public testnet. For local development all defaults work.

```
# .env — only needed for testnet deployment
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
```

For the frontend, copy the example:

```bash
cp frontend/.env.example frontend/.env.local
```

---

## 3. Compile contracts

```bash
npm run compile
```

Artifacts are written to `artifacts/`. You should see three contracts compiled:
- `MyToken`
- `MyNFT`
- `SimpleVault`

---

## 4. Run tests

```bash
npm test
```

All tests run on the in-process Hardhat network — no node needed. See [Testing](Testing) for details.

---

## 5. Start a local Hardhat node

Open a dedicated terminal and leave it running:

```bash
npm run node
```

This starts an Ethereum-compatible JSON-RPC server at `http://127.0.0.1:8545` with 20 pre-funded accounts (10 000 ETH each). The chain ID is `31337`.

---

## 6. Deploy contracts

In a second terminal:

```bash
npm run deploy:local
```

This runs `scripts/deploy.js`, which:
1. Deploys `MyToken` with 1 000 000 W3T initial supply
2. Deploys `MyNFT`
3. Deploys `SimpleVault` (deposit token = reward token = MyToken)
4. Transfers `MyToken` ownership to the vault
5. Writes all addresses to `deployments.json`

Copy the addresses into `frontend/.env.local`:

```
VITE_TOKEN_ADDRESS=0x...
VITE_NFT_ADDRESS=0x...
VITE_VAULT_ADDRESS=0x...
```

---

## 7. Launch the frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`. The app shows a wallet panel — choose **Generate New Wallet** to create a local wallet connected to your Hardhat node, or paste a Hardhat account's private key under **Import Private Key**.

---

## Useful npm scripts

| Script | What it does |
|---|---|
| `npm run compile` | Compile Solidity contracts |
| `npm test` | Run all tests |
| `npm run test:coverage` | Coverage report |
| `npm run node` | Start local Hardhat node |
| `npm run deploy:local` | Deploy to localhost |
| `npm run deploy:sepolia` | Deploy to Sepolia |
| `npm run interact:token` | ERC-20 interaction demo |
| `npm run interact:nft` | NFT interaction demo |
| `npm run clean` | Remove artifacts and cache |

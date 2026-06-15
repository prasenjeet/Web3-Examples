# Frontend Guide

**Stack:** React 18 · Vite 5 · ethers.js v6  
**Directory:** `frontend/`  
**Dev server:** `http://localhost:3000`

---

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local   # then fill in contract addresses
npm run dev
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_RPC_URL` | `http://127.0.0.1:8545` | JSON-RPC endpoint for local wallets |
| `VITE_TOKEN_ADDRESS` | `0x000…` | Deployed `MyToken` address |
| `VITE_NFT_ADDRESS` | `0x000…` | Deployed `MyNFT` address |
| `VITE_VAULT_ADDRESS` | `0x000…` | Deployed `SimpleVault` address |

Copy the addresses from `deployments.json` after running `npm run deploy:local`.

---

## File Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
└── src/
    ├── main.jsx              — React root
    ├── App.jsx               — top-level layout, tab routing
    ├── App.css               — design system (CSS custom properties)
    ├── hooks/
    │   └── useWeb3.js        — wallet state + connection logic
    ├── utils/
    │   └── contracts.js      — ABI definitions, contract factory helpers
    └── components/
        ├── WalletCreator.jsx — wallet connection/creation panel
        ├── WalletConnect.jsx — connected-wallet header badge
        ├── TokenDashboard.jsx
        ├── NFTGallery.jsx
        └── VaultDashboard.jsx
```

---

## Application Flow

```
App.jsx
  │
  ├── account == null
  │     └── <WalletCreator>   ← generate / import / MetaMask
  │
  └── account != null
        ├── <WalletConnect>   ← header badge (address + type + network)
        └── tabs
              ├── Token  →  <TokenDashboard>
              ├── NFT    →  <NFTGallery>
              └── Vault  →  <VaultDashboard>
```

---

## Components

### WalletCreator

Shown when no wallet is connected. Offers four paths:

1. **Generate New Wallet** — `Wallet.createRandom()`, displays key + mnemonic once
2. **Import Private Key** — `new Wallet(key)`
3. **Import Mnemonic Phrase** — `Wallet.fromPhrase(phrase)`
4. **Connect MetaMask** — `BrowserProvider(window.ethereum)`

See [Wallet Management](Wallet-Management) for full details.

### WalletConnect

Compact header widget displayed once connected. Shows:
- Truncated address (`0x1234…abcd`)
- Wallet type badge: **Local** or **MetaMask**
- Network name (Hardhat Local / Sepolia / Ethereum Mainnet)
- Disconnect button

### TokenDashboard

| Feature | Description |
|---|---|
| Token info | Name, symbol, decimals, total supply |
| Your balance | Live balance of the connected address |
| Mint (owner only) | Mint tokens to any address |
| Transfer | Send tokens from the connected wallet |
| Refresh | Re-fetch all on-chain state |

### NFTGallery

| Feature | Description |
|---|---|
| Collection info | Name, symbol, total minted |
| Mint NFT (owner only) | Provide an IPFS/HTTP metadata URI |
| Your NFTs | Grid of token cards showing ID and URI |

### VaultDashboard

| Feature | Description |
|---|---|
| Overview | Wallet balance, deposited amount, pending rewards |
| Deposit | Approve + deposit in one flow |
| Withdraw | Partial or full withdrawal |
| Claim Rewards | Mint accrued reward tokens |

---

## Contract Utilities (`src/utils/contracts.js`)

Hardcoded human-readable ABIs (no JSON artifact import required) and three factory functions:

```javascript
import { getTokenContract, getNFTContract, getVaultContract } from "./utils/contracts.js";

const token = getTokenContract(signer);   // ethers.Contract
const nft   = getNFTContract(signer);
const vault = getVaultContract(signer);
```

Contract addresses come from `CONTRACT_ADDRESSES` which reads `VITE_*` env vars.

---

## Build for Production

```bash
npm run build    # outputs to frontend/dist/
npm run preview  # preview the production build locally
```

The production build is a static site that can be served from any web host. Remember to set the correct contract addresses and RPC URL for the target network.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |

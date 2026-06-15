# Wallet Management

This project includes a built-in wallet manager in the frontend — no MetaMask or other browser extension is required for local development.

---

## How It Works

The wallet logic is implemented in `frontend/src/hooks/useWeb3.js` using **ethers.js v6**.

There are two wallet modes:

| Mode | How it connects | Best for |
|---|---|---|
| **Local** | `ethers.Wallet` + `JsonRpcProvider` | Hardhat local node, demos, no extension |
| **MetaMask** | `BrowserProvider(window.ethereum)` | Testnet / mainnet with real funds |

In both modes the same `signer` object is passed to all contract interactions — the rest of the app is unaware of which mode is active.

---

## Wallet Operations

### Generate a New Wallet

Creates a cryptographically random BIP-39 wallet and connects it to the configured RPC endpoint.

```javascript
const wallet = ethers.Wallet.createRandom();
const connected = wallet.connect(new ethers.JsonRpcProvider(RPC_URL));
```

The hook returns `{ privateKey, mnemonic }` **once** so the UI can display them. After the user dismisses the dialog these values are not stored anywhere — if lost, the wallet cannot be recovered.

### Import from Private Key

```javascript
const wallet = new ethers.Wallet(privateKey.trim());
const connected = wallet.connect(new ethers.JsonRpcProvider(RPC_URL));
```

Accepts a 32-byte hex string with or without the `0x` prefix.

### Import from Mnemonic Phrase

```javascript
const wallet = ethers.Wallet.fromPhrase(phrase.trim());
const connected = wallet.connect(new ethers.JsonRpcProvider(RPC_URL));
```

Accepts a standard BIP-39 12-word or 24-word phrase. Words must be space-separated.

### Connect MetaMask

```javascript
const provider = new ethers.BrowserProvider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();
```

Triggers the MetaMask permission popup. Falls back to an error if `window.ethereum` is not present.

---

## RPC Endpoint

Local wallets connect to the JSON-RPC endpoint set in `frontend/.env.local`:

```
VITE_RPC_URL=http://127.0.0.1:8545
```

When unset, this defaults to `http://127.0.0.1:8545` (the Hardhat node). Change this to point to a public testnet RPC for testnet development.

---

## Using a Hardhat Account

When you run `npm run node`, Hardhat prints 20 pre-funded accounts:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Paste the private key into **Import Private Key** in the frontend to use that pre-funded account immediately.

---

## Security Considerations

> **These wallets are for development only.**

- Private keys and mnemonics are displayed in the browser — never use these wallets with real funds on Ethereum mainnet
- Keys are held in React state (memory only) — they are cleared on page refresh
- The `show/hide` toggle and copy buttons are provided for convenience during development
- Do not commit `frontend/.env.local` to version control (it is in `.gitignore`)

---

## Wallet Badge

Once connected, the header shows a coloured badge indicating the active mode:

- **Local** (teal) — a generated or imported wallet connected via RPC
- **MetaMask** (orange) — an injected browser wallet

---

## Hook API

```javascript
import { useWeb3 } from "./hooks/useWeb3.js";

const {
  // State
  provider,       // ethers Provider
  signer,         // ethers Signer — pass this to contract factories
  account,        // connected address string
  chainId,        // number
  walletType,     // "local" | "metamask" | null
  isConnecting,   // boolean
  error,          // string | null

  // Actions
  createWallet,         // async () => { privateKey, mnemonic } | null
  importFromPrivateKey, // async (key: string) => void
  importFromMnemonic,   // async (phrase: string) => void
  connectMetaMask,      // async () => void
  disconnect,           // () => void
} = useWeb3();
```

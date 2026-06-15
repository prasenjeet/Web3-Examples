# Deployment

---

## Local Deployment (Hardhat Node)

### 1. Start the local node

```bash
npm run node
```

Starts a JSON-RPC server at `http://127.0.0.1:8545` (chain ID `31337`) with 20 pre-funded accounts.

### 2. Deploy in a second terminal

```bash
npm run deploy:local
```

Output example:

```
Deploying contracts with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Account balance: 10000.0 ETH

[1/3] Deploying MyToken...
  MyToken deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
  Initial supply: 1000000.0 W3T

[2/3] Deploying MyNFT...
  MyNFT deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

[3/3] Deploying SimpleVault...
  SimpleVault deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

Transferring MyToken ownership to SimpleVault...
  Ownership transferred. New owner: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

Deployment addresses saved to deployments.json
```

Addresses are saved to `deployments.json`. Copy them into `frontend/.env.local`.

---

## Sepolia Testnet Deployment

### Prerequisites

1. A funded Sepolia wallet (get test ETH from a faucet)
2. A Sepolia RPC URL from Infura, Alchemy, or another provider
3. (Optional) An Etherscan API key for contract verification

### Configure `.env`

```bash
cp .env.example .env
```

```
PRIVATE_KEY=your_deployer_private_key_without_0x
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Deploy

```bash
npm run deploy:sepolia
```

This runs the same `scripts/deploy.js` script against the `sepolia` network config.

---

## Deploy Script Details

`scripts/deploy.js` deploys all three contracts in dependency order:

```javascript
// 1. MyToken
const token = await MyToken.deploy("Web3Token", "W3T", 1_000_000);

// 2. MyNFT
const nft = await MyNFT.deploy("Web3NFT", "W3N");

// 3. SimpleVault (deposit + reward token = MyToken)
const vault = await SimpleVault.deploy(tokenAddress, tokenAddress);

// 4. Transfer MyToken ownership to vault so it can mint rewards
await token.transferOwnership(vaultAddress);
```

---

## Contract Verification (Etherscan)

After deploying to Sepolia, verify each contract:

```bash
# MyToken
npx hardhat verify --network sepolia <TOKEN_ADDRESS> "Web3Token" "W3T" "1000000"

# MyNFT
npx hardhat verify --network sepolia <NFT_ADDRESS> "Web3NFT" "W3N"

# SimpleVault
npx hardhat verify --network sepolia <VAULT_ADDRESS> <TOKEN_ADDRESS> <TOKEN_ADDRESS>
```

Constructor arguments must match exactly what was used during deployment.

---

## Interaction Scripts

After deployment, run these against localhost to demonstrate contract behaviour:

```bash
# ERC-20: check balance, transfer, approve+transferFrom, burn
npm run interact:token

# ERC-721: mint two NFTs, list by owner, transfer
npm run interact:nft
```

To run against Sepolia:

```bash
npx hardhat run scripts/interact-token.js --network sepolia
npx hardhat run scripts/interact-nft.js --network sepolia
```

---

## Redeploying

The Hardhat node does not persist state across restarts. After restarting `npm run node`, run `npm run deploy:local` again and update the addresses in `frontend/.env.local`.

`deployments.json` is listed in `.gitignore` — it is environment-specific and should not be committed.

---

## Hardhat Config Reference

```javascript
// hardhat.config.js
networks: {
  hardhat:   { chainId: 31337 },
  localhost: { url: "http://127.0.0.1:8545", chainId: 31337 },
  sepolia:   { url: SEPOLIA_RPC_URL, accounts: [PRIVATE_KEY], chainId: 11155111 },
}
```

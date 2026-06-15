# Smart Contracts

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    Deployer / Owner                  │
└───────────┬──────────────────────────────┬───────────┘
            │ deploy + mint supply         │ deploy
            ▼                             ▼
  ┌──────────────────┐          ┌──────────────────────┐
  │    MyToken       │          │       MyNFT           │
  │  (ERC-20, W3T)   │          │  (ERC-721, W3N)      │
  │                  │          │                      │
  │ • mint (owner)   │          │ • safeMint (owner)   │
  │ • burn           │          │ • tokenURI           │
  │ • transfer       │          │ • enumerable         │
  └──────┬───────────┘          └──────────────────────┘
         │ transferOwnership
         ▼
  ┌──────────────────────────────────────┐
  │            SimpleVault               │
  │  (staking vault, owns MyToken)       │
  │                                      │
  │ • deposit(amount)                    │
  │ • withdraw(amount)                   │
  │ • pendingRewards(user) view          │
  │ • claimRewards() → mint W3T          │
  └──────────────────────────────────────┘
```

After deployment, `SimpleVault` owns `MyToken` and can mint reward tokens on behalf of users. `MyNFT` remains owned by the deployer.

---

## Contract Addresses

After running `npm run deploy:local`, addresses are saved to `deployments.json`:

```json
{
  "network": "unknown",
  "chainId": 31337,
  "contracts": {
    "MyToken":     "0x...",
    "MyNFT":       "0x...",
    "SimpleVault": "0x..."
  }
}
```

---

## Dependency Map

```
SimpleVault
  └── depends on MyToken (IERC20 + IMintable)

MyToken
  └── extends ERC20, ERC20Burnable, Ownable  (OpenZeppelin v5)

MyNFT
  └── extends ERC721URIStorage, ERC721Enumerable, Ownable  (OpenZeppelin v5)

SimpleVault
  └── extends ReentrancyGuard  (OpenZeppelin v5)
  └── uses SafeERC20
```

---

## OpenZeppelin Version

All contracts use **OpenZeppelin Contracts v5** (`@openzeppelin/contracts ^5.0.2`).

Notable v5 changes vs v4:
- `Ownable` constructor requires explicit `initialOwner` argument — no longer defaults to `msg.sender` silently
- `ERC721URIStorage` and `ERC721Enumerable` multi-inheritance requires `_update` and `_increaseBalance` overrides
- `SafeERC20` is imported from `token/ERC20/utils/`

---

## Source Files

| File | Contract | Lines |
|---|---|---|
| `contracts/MyToken.sol` | `MyToken` | ~50 |
| `contracts/MyNFT.sol` | `MyNFT` | ~95 |
| `contracts/SimpleVault.sol` | `SimpleVault` | ~177 |

# ERC-721 NFT (MyNFT)

**File:** `contracts/MyNFT.sol`  
**Standard:** ERC-721 (OpenZeppelin v5)  
**Symbol:** W3N | **Token IDs:** Sequential, starting at 1

---

## Inheritance

```
MyNFT
  ├── ERC721             — core NFT logic
  ├── ERC721URIStorage   — per-token metadata URI
  ├── ERC721Enumerable   — on-chain token listing
  └── Ownable            — owner-controlled minting
```

Because `ERC721URIStorage` and `ERC721Enumerable` both override `_update` and `_increaseBalance`, the contract implements the required diamond-inheritance overrides.

---

## Constructor

```solidity
constructor(string memory name, string memory symbol)
```

| Parameter | Description |
|---|---|
| `name` | Collection name, e.g. `"Web3NFT"` |
| `symbol` | Ticker, e.g. `"W3N"` |

Token ID counter starts at **1** (not 0).

---

## Functions

### `safeMint(address to, string memory uri) returns (uint256)`

Mints a new NFT to `to` with metadata URI `uri`. **Only callable by the owner.**

```solidity
function safeMint(address to, string memory uri) external onlyOwner returns (uint256 tokenId)
```

- Increments the internal counter and assigns the next token ID
- Calls `_safeMint` (checks ERC-721 receiver compliance)
- Stores the URI via `_setTokenURI`
- Returns the minted `tokenId`

**Emits:** `NFTMinted(address indexed to, uint256 indexed tokenId, string uri)`

### `tokenURI(uint256 tokenId) view returns (string)`

Returns the metadata URI for a given token. Reverts with `ERC721NonexistentToken` if the token doesn't exist.

### `totalMinted() view returns (uint256)`

Returns the total number of NFTs minted so far (equivalent to `_nextTokenId - 1`).

### Enumerable Functions (inherited)

```solidity
function totalSupply() view returns (uint256)
function tokenByIndex(uint256 index) view returns (uint256)
function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)
```

`tokenOfOwnerByIndex` lets you iterate all tokens owned by an address on-chain — useful for building galleries without events.

### Standard ERC-721 Functions

```solidity
function ownerOf(uint256 tokenId) view returns (address)
function balanceOf(address owner) view returns (uint256)
function safeTransferFrom(address from, address to, uint256 tokenId)
function transferFrom(address from, address to, uint256 tokenId)
function approve(address to, uint256 tokenId)
function setApprovalForAll(address operator, bool approved)
function isApprovedForAll(address owner, address operator) view returns (bool)
```

---

## Events

| Event | Parameters | When |
|---|---|---|
| `Transfer` | `from, to, tokenId` | Any token movement (including mint) |
| `Approval` | `owner, approved, tokenId` | After `approve` |
| `ApprovalForAll` | `owner, operator, approved` | After `setApprovalForAll` |
| `NFTMinted` | `to, tokenId, uri` | After `safeMint` |

---

## Metadata URI Format

Store metadata on IPFS or any HTTP server. The URI should point to a JSON file:

```json
{
  "name": "My NFT #1",
  "description": "A sample NFT from Web3 Examples",
  "image": "ipfs://Qm.../image.png",
  "attributes": [
    { "trait_type": "Rarity", "value": "Common" }
  ]
}
```

Example URI: `ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1`

---

## Interaction Script

```bash
npm run interact:nft
```

Demonstrates: mint two NFTs → check owners → enumerate → transfer.

Source: `scripts/interact-nft.js`

---

## Minting Example (ethers.js)

```javascript
const nft = new ethers.Contract(NFT_ADDRESS, NFT_ABI, signer);

const tx = await nft.safeMint(
  recipientAddress,
  "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/1"
);
const receipt = await tx.wait();

// Parse the tokenId from the NFTMinted event
const event = receipt.logs
  .map(log => nft.interface.parseLog(log))
  .find(e => e?.name === "NFTMinted");
console.log("Minted token ID:", event.args.tokenId.toString());
```

---

## Listing All Tokens Owned by an Address

```javascript
const balance = await nft.balanceOf(address);
for (let i = 0; i < balance; i++) {
  const tokenId = await nft.tokenOfOwnerByIndex(address, i);
  const uri = await nft.tokenURI(tokenId);
  console.log(`Token ${tokenId}: ${uri}`);
}
```

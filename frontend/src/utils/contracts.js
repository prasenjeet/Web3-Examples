import { Contract } from "ethers";

// Contract addresses — update these after running deploy.js.
// You can also set VITE_TOKEN_ADDRESS etc. in frontend/.env.local
export const CONTRACT_ADDRESSES = {
  MyToken: import.meta.env.VITE_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000",
  MyNFT: import.meta.env.VITE_NFT_ADDRESS || "0x0000000000000000000000000000000000000000",
  SimpleVault: import.meta.env.VITE_VAULT_ADDRESS || "0x0000000000000000000000000000000000000000",
};

const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function owner() view returns (address)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event TokensMinted(address indexed to, uint256 amount)",
];

const NFT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function totalMinted() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function safeMint(address to, string uri) returns (uint256)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function owner() view returns (address)",
  "event NFTMinted(address indexed to, uint256 indexed tokenId, string uri)",
];

const VAULT_ABI = [
  "function depositToken() view returns (address)",
  "function balanceOf(address user) view returns (uint256)",
  "function pendingRewards(address user) view returns (uint256)",
  "function deposits(address) view returns (uint256 depositAmount, uint256 depositedAt, uint256 pendingAccrued)",
  "function deposit(uint256 amount)",
  "function withdraw(uint256 amount)",
  "function claimRewards()",
  "event Deposited(address indexed user, uint256 amount)",
  "event Withdrawn(address indexed user, uint256 amount)",
  "event RewardsClaimed(address indexed user, uint256 amount)",
];

export function getTokenContract(signer) {
  return new Contract(CONTRACT_ADDRESSES.MyToken, TOKEN_ABI, signer);
}

export function getNFTContract(signer) {
  return new Contract(CONTRACT_ADDRESSES.MyNFT, NFT_ABI, signer);
}

export function getVaultContract(signer) {
  return new Contract(CONTRACT_ADDRESSES.SimpleVault, VAULT_ABI, signer);
}

import React from "react";

const CHAIN_NAMES = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia Testnet",
  31337: "Hardhat Local",
};

function truncateAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function WalletConnect({ account, chainId, walletType, isConnecting, error, onDisconnect }) {
  const networkName = chainId ? (CHAIN_NAMES[chainId] ?? `Chain ${chainId}`) : null;

  if (!account) return null;

  return (
    <div className="wallet-connect">
      <div className="wallet-info">
        <span className="wallet-badge">
          <span className="wallet-dot" />
          {truncateAddress(account)}
        </span>
        {walletType && (
          <span className={`wallet-type-badge wallet-type-badge--${walletType}`}>
            {walletType === "local" ? "Local" : "MetaMask"}
          </span>
        )}
        {networkName && <span className="network-badge">{networkName}</span>}
        <button className="btn btn-outline" onClick={onDisconnect}>
          Disconnect
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

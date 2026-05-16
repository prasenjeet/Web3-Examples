import React from "react";

const CHAIN_NAMES = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia Testnet",
  31337: "Hardhat Local",
};

function truncateAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function WalletConnect({ account, chainId, isConnecting, error, onConnect, onDisconnect }) {
  const networkName = chainId ? (CHAIN_NAMES[chainId] ?? `Chain ${chainId}`) : null;

  return (
    <div className="wallet-connect">
      {account ? (
        <div className="wallet-info">
          <span className="wallet-badge">
            <span className="wallet-dot" />
            {truncateAddress(account)}
          </span>
          {networkName && <span className="network-badge">{networkName}</span>}
          <button className="btn btn-outline" onClick={onDisconnect}>
            Disconnect
          </button>
        </div>
      ) : (
        <button className="btn btn-primary" onClick={onConnect} disabled={isConnecting}>
          {isConnecting ? "Connecting…" : "Connect Wallet"}
        </button>
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

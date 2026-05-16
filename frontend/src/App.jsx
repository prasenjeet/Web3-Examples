import React, { useState } from "react";
import { useWeb3 } from "./hooks/useWeb3.js";
import WalletConnect from "./components/WalletConnect.jsx";
import WalletCreator from "./components/WalletCreator.jsx";
import TokenDashboard from "./components/TokenDashboard.jsx";
import NFTGallery from "./components/NFTGallery.jsx";
import VaultDashboard from "./components/VaultDashboard.jsx";

const TABS = ["Token", "NFT", "Vault"];

export default function App() {
  const {
    signer, account, chainId, walletType,
    isConnecting, error,
    connectMetaMask, createWallet, importFromPrivateKey, importFromMnemonic, disconnect,
  } = useWeb3();

  const [activeTab, setActiveTab] = useState("Token");

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <h1 className="app-title">Web3 Examples</h1>
          <WalletConnect
            account={account}
            chainId={chainId}
            walletType={walletType}
            isConnecting={isConnecting}
            error={error}
            onDisconnect={disconnect}
          />
        </div>
      </header>

      <main className="app-main">
        {!account ? (
          <WalletCreator
            isConnecting={isConnecting}
            error={error}
            onCreateWallet={createWallet}
            onImportFromPrivateKey={importFromPrivateKey}
            onImportFromMnemonic={importFromMnemonic}
            onConnectMetaMask={connectMetaMask}
          />
        ) : (
          <>
            <nav className="tab-bar">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </nav>

            <div className="tab-content">
              {activeTab === "Token" && (
                <TokenDashboard signer={signer} account={account} />
              )}
              {activeTab === "NFT" && (
                <NFTGallery signer={signer} account={account} />
              )}
              {activeTab === "Vault" && (
                <VaultDashboard signer={signer} account={account} />
              )}
            </div>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Web3 Examples — ERC-20 · ERC-721 · Staking Vault |{" "}
          <a href="https://hardhat.org" target="_blank" rel="noreferrer">
            Hardhat
          </a>{" "}
          +{" "}
          <a href="https://docs.ethers.org/v6/" target="_blank" rel="noreferrer">
            ethers.js v6
          </a>
        </p>
      </footer>
    </div>
  );
}

import React, { useState } from "react";

// Masks all but the first 6 and last 4 chars of a sensitive string.
function mask(value) {
  if (!value || value.length < 12) return value;
  return value.slice(0, 6) + "·".repeat(value.length - 10) + value.slice(-4);
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button className="btn btn-outline btn-sm" onClick={copy}>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function RevealField({ label, value }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="reveal-field">
      <div className="reveal-header">
        <span className="reveal-label">{label}</span>
        <div className="reveal-actions">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? "Hide" : "Show"}
          </button>
          <CopyButton value={value} />
        </div>
      </div>
      <code className="reveal-value">{visible ? value : mask(value)}</code>
    </div>
  );
}

export default function WalletCreator({
  isConnecting,
  error,
  onCreateWallet,
  onImportFromPrivateKey,
  onImportFromMnemonic,
  onConnectMetaMask,
}) {
  const [mode, setMode] = useState("options"); // "options" | "created" | "import-key" | "import-mnemonic"
  const [createdWallet, setCreatedWallet] = useState(null);
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [mnemonicInput, setMnemonicInput] = useState("");

  async function handleCreate() {
    const result = await onCreateWallet();
    if (result) {
      setCreatedWallet(result);
      setMode("created");
    }
  }

  async function handleImportKey(e) {
    e.preventDefault();
    await onImportFromPrivateKey(privateKeyInput);
    // If no error, the parent state updates and this panel unmounts.
  }

  async function handleImportMnemonic(e) {
    e.preventDefault();
    await onImportFromMnemonic(mnemonicInput);
  }

  // ── Created wallet display ─────────────────────────────────────────────────
  if (mode === "created" && createdWallet) {
    return (
      <div className="wallet-creator">
        <div className="card creator-card">
          <h2>Wallet Created</h2>
          <div className="warning-box">
            <strong>Save these details now.</strong> They will not be shown again.
            Never share your private key or mnemonic phrase with anyone.
            This wallet is connected to your local Hardhat node — do not use it with real funds.
          </div>
          <RevealField label="Private Key" value={createdWallet.privateKey} />
          <RevealField label="Mnemonic Phrase (12 words)" value={createdWallet.mnemonic} />
          <p className="creator-note">
            Your wallet is now active. Close this panel once you have saved the details.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => { setCreatedWallet(null); setMode("options"); }}
          >
            Done — I have saved my keys
          </button>
        </div>
      </div>
    );
  }

  // ── Import private key ────────────────────────────────────────────────────
  if (mode === "import-key") {
    return (
      <div className="wallet-creator">
        <div className="card creator-card">
          <div className="creator-back">
            <button className="btn btn-outline btn-sm" onClick={() => setMode("options")}>
              ← Back
            </button>
            <h2>Import Private Key</h2>
          </div>
          <form onSubmit={handleImportKey} className="form">
            <label>
              Private Key (hex, with or without 0x prefix)
              <input
                type="password"
                placeholder="0x…"
                value={privateKeyInput}
                onChange={(e) => setPrivateKeyInput(e.target.value)}
                required
                autoComplete="off"
              />
            </label>
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={isConnecting}>
              {isConnecting ? "Importing…" : "Import Wallet"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Import mnemonic ────────────────────────────────────────────────────────
  if (mode === "import-mnemonic") {
    return (
      <div className="wallet-creator">
        <div className="card creator-card">
          <div className="creator-back">
            <button className="btn btn-outline btn-sm" onClick={() => setMode("options")}>
              ← Back
            </button>
            <h2>Import Mnemonic Phrase</h2>
          </div>
          <form onSubmit={handleImportMnemonic} className="form">
            <label>
              12 or 24-word mnemonic phrase
              <textarea
                className="mnemonic-input"
                placeholder="word1 word2 word3 … word12"
                value={mnemonicInput}
                onChange={(e) => setMnemonicInput(e.target.value)}
                required
                rows={3}
                autoComplete="off"
              />
            </label>
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={isConnecting}>
              {isConnecting ? "Importing…" : "Import Wallet"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Options (default) ─────────────────────────────────────────────────────
  return (
    <div className="wallet-creator">
      <div className="card creator-card">
        <h2>Connect or Create a Wallet</h2>
        <p className="creator-note">
          Choose how you want to interact with the contracts. Local wallets are
          created with <strong>ethers.js</strong> and connect directly to your
          Hardhat node — no browser extension required.
        </p>

        <div className="creator-options">
          <button
            className="creator-option"
            onClick={handleCreate}
            disabled={isConnecting}
          >
            <span className="option-icon">✦</span>
            <span className="option-title">Generate New Wallet</span>
            <span className="option-desc">
              Create a random wallet with a private key and mnemonic phrase
            </span>
          </button>

          <button
            className="creator-option"
            onClick={() => setMode("import-key")}
            disabled={isConnecting}
          >
            <span className="option-icon">⬆</span>
            <span className="option-title">Import Private Key</span>
            <span className="option-desc">
              Load an existing account from its hex private key
            </span>
          </button>

          <button
            className="creator-option"
            onClick={() => setMode("import-mnemonic")}
            disabled={isConnecting}
          >
            <span className="option-icon">▤</span>
            <span className="option-title">Import Mnemonic Phrase</span>
            <span className="option-desc">
              Restore a wallet from a 12 or 24-word seed phrase
            </span>
          </button>

          <button
            className="creator-option creator-option--metamask"
            onClick={onConnectMetaMask}
            disabled={isConnecting}
          >
            <span className="option-icon">🦊</span>
            <span className="option-title">Connect MetaMask</span>
            <span className="option-desc">
              Use an injected browser wallet (MetaMask, Rabby, etc.)
            </span>
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}
        {isConnecting && <p className="creator-note">Working…</p>}
      </div>
    </div>
  );
}

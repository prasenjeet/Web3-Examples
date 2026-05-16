import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { getTokenContract } from "../utils/contracts.js";

export default function TokenDashboard({ signer, account }) {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // Form state
  const [mintTo, setMintTo] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const refresh = useCallback(async () => {
    if (!signer || !account) return;
    setLoading(true);
    try {
      const token = getTokenContract(signer);
      const [name, symbol, decimals, totalSupply, bal, owner] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.totalSupply(),
        token.balanceOf(account),
        token.owner(),
      ]);
      setTokenInfo({ name, symbol, decimals, totalSupply });
      setBalance(bal);
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
    } catch (err) {
      setStatus("Error loading token data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [signer, account]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleMint(e) {
    e.preventDefault();
    if (!signer) return;
    setStatus("Minting…");
    try {
      const token = getTokenContract(signer);
      const amount = ethers.parseUnits(mintAmount, tokenInfo.decimals);
      const tx = await token.mint(mintTo || account, amount);
      setStatus("Waiting for confirmation…");
      await tx.wait();
      setStatus(`Minted ${mintAmount} ${tokenInfo.symbol}. Tx: ${tx.hash}`);
      setMintAmount("");
      setMintTo("");
      await refresh();
    } catch (err) {
      setStatus("Mint failed: " + (err.reason || err.message));
    }
  }

  async function handleTransfer(e) {
    e.preventDefault();
    if (!signer) return;
    setStatus("Transferring…");
    try {
      const token = getTokenContract(signer);
      const amount = ethers.parseUnits(transferAmount, tokenInfo.decimals);
      const tx = await token.transfer(transferTo, amount);
      setStatus("Waiting for confirmation…");
      await tx.wait();
      setStatus(`Transferred ${transferAmount} ${tokenInfo.symbol}. Tx: ${tx.hash}`);
      setTransferAmount("");
      setTransferTo("");
      await refresh();
    } catch (err) {
      setStatus("Transfer failed: " + (err.reason || err.message));
    }
  }

  if (!signer) {
    return <p className="not-connected">Connect your wallet to interact with the token.</p>;
  }

  return (
    <div className="dashboard">
      <div className="card">
        <h2>Token Info</h2>
        {loading && <p>Loading…</p>}
        {tokenInfo && (
          <dl className="info-grid">
            <dt>Name</dt><dd>{tokenInfo.name}</dd>
            <dt>Symbol</dt><dd>{tokenInfo.symbol}</dd>
            <dt>Total Supply</dt>
            <dd>{ethers.formatUnits(tokenInfo.totalSupply, tokenInfo.decimals)} {tokenInfo.symbol}</dd>
            <dt>Your Balance</dt>
            <dd>{balance !== null ? `${ethers.formatUnits(balance, tokenInfo.decimals)} ${tokenInfo.symbol}` : "—"}</dd>
            <dt>Your Role</dt><dd>{isOwner ? "Owner" : "Holder"}</dd>
          </dl>
        )}
        <button className="btn btn-outline" onClick={refresh} disabled={loading}>
          Refresh
        </button>
      </div>

      {isOwner && (
        <div className="card">
          <h2>Mint Tokens</h2>
          <form onSubmit={handleMint} className="form">
            <label>
              Recipient (leave blank for your address)
              <input
                type="text"
                placeholder="0x…"
                value={mintTo}
                onChange={(e) => setMintTo(e.target.value)}
              />
            </label>
            <label>
              Amount
              <input
                type="number"
                min="0"
                step="any"
                placeholder="100"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                required
              />
            </label>
            <button className="btn btn-primary" type="submit">
              Mint
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Transfer Tokens</h2>
        <form onSubmit={handleTransfer} className="form">
          <label>
            Recipient
            <input
              type="text"
              placeholder="0x…"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              required
            />
          </label>
          <label>
            Amount
            <input
              type="number"
              min="0"
              step="any"
              placeholder="50"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              required
            />
          </label>
          <button className="btn btn-primary" type="submit">
            Transfer
          </button>
        </form>
      </div>

      {status && <p className="status-text">{status}</p>}
    </div>
  );
}

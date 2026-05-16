import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { getTokenContract, getVaultContract, CONTRACT_ADDRESSES } from "../utils/contracts.js";

export default function VaultDashboard({ signer, account }) {
  const [vaultInfo, setVaultInfo] = useState(null);
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [tokenSymbol, setTokenSymbol] = useState("W3T");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const refresh = useCallback(async () => {
    if (!signer || !account) return;
    setLoading(true);
    try {
      const vault = getVaultContract(signer);
      const token = getTokenContract(signer);

      const [deposited, rewards, walletBalance, decimals, symbol] = await Promise.all([
        vault.balanceOf(account),
        vault.pendingRewards(account),
        token.balanceOf(account),
        token.decimals(),
        token.symbol(),
      ]);

      setVaultInfo({ deposited, rewards, walletBalance });
      setTokenDecimals(Number(decimals));
      setTokenSymbol(symbol);
    } catch (err) {
      setStatus("Error loading vault data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [signer, account]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleDeposit(e) {
    e.preventDefault();
    if (!signer) return;
    setStatus("Approving and depositing…");
    try {
      const token = getTokenContract(signer);
      const vault = getVaultContract(signer);
      const amount = ethers.parseUnits(depositAmount, tokenDecimals);

      const approveTx = await token.approve(CONTRACT_ADDRESSES.SimpleVault, amount);
      setStatus("Waiting for approval confirmation…");
      await approveTx.wait();

      const depositTx = await vault.deposit(amount);
      setStatus("Waiting for deposit confirmation…");
      await depositTx.wait();

      setStatus(`Deposited ${depositAmount} ${tokenSymbol}. Tx: ${depositTx.hash}`);
      setDepositAmount("");
      await refresh();
    } catch (err) {
      setStatus("Deposit failed: " + (err.reason || err.message));
    }
  }

  async function handleWithdraw(e) {
    e.preventDefault();
    if (!signer) return;
    setStatus("Withdrawing…");
    try {
      const vault = getVaultContract(signer);
      const amount = ethers.parseUnits(withdrawAmount, tokenDecimals);
      const tx = await vault.withdraw(amount);
      setStatus("Waiting for confirmation…");
      await tx.wait();
      setStatus(`Withdrew ${withdrawAmount} ${tokenSymbol}. Tx: ${tx.hash}`);
      setWithdrawAmount("");
      await refresh();
    } catch (err) {
      setStatus("Withdrawal failed: " + (err.reason || err.message));
    }
  }

  async function handleClaimRewards() {
    if (!signer) return;
    setStatus("Claiming rewards…");
    try {
      const vault = getVaultContract(signer);
      const tx = await vault.claimRewards();
      setStatus("Waiting for confirmation…");
      await tx.wait();
      setStatus(`Rewards claimed! Tx: ${tx.hash}`);
      await refresh();
    } catch (err) {
      setStatus("Claim failed: " + (err.reason || err.message));
    }
  }

  const fmt = (val) =>
    val != null ? ethers.formatUnits(val, tokenDecimals) : "—";

  if (!signer) {
    return <p className="not-connected">Connect your wallet to use the staking vault.</p>;
  }

  return (
    <div className="dashboard">
      <div className="card">
        <h2>Vault Overview</h2>
        <p className="vault-note">Earn 1% per day on your deposited {tokenSymbol}. Rewards accumulate daily.</p>
        {loading && <p>Loading…</p>}
        {vaultInfo && (
          <dl className="info-grid">
            <dt>Wallet Balance</dt>
            <dd>{fmt(vaultInfo.walletBalance)} {tokenSymbol}</dd>
            <dt>Deposited</dt>
            <dd>{fmt(vaultInfo.deposited)} {tokenSymbol}</dd>
            <dt>Pending Rewards</dt>
            <dd>{fmt(vaultInfo.rewards)} {tokenSymbol}</dd>
          </dl>
        )}
        <div className="button-row">
          <button className="btn btn-outline" onClick={refresh} disabled={loading}>
            Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={handleClaimRewards}
            disabled={!vaultInfo || vaultInfo.rewards === 0n}
          >
            Claim Rewards
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Deposit</h2>
        <form onSubmit={handleDeposit} className="form">
          <label>
            Amount ({tokenSymbol})
            <input
              type="number"
              min="0"
              step="any"
              placeholder="100"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
            />
          </label>
          <button className="btn btn-primary" type="submit">
            Deposit
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Withdraw</h2>
        <form onSubmit={handleWithdraw} className="form">
          <label>
            Amount ({tokenSymbol})
            <input
              type="number"
              min="0"
              step="any"
              placeholder="50"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              required
            />
          </label>
          <button className="btn btn-outline" type="submit">
            Withdraw
          </button>
        </form>
      </div>

      {status && <p className="status-text">{status}</p>}
    </div>
  );
}

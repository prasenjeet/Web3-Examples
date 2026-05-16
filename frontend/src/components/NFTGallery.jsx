import React, { useState, useEffect, useCallback } from "react";
import { getNFTContract } from "../utils/contracts.js";

export default function NFTGallery({ signer, account }) {
  const [collectionInfo, setCollectionInfo] = useState(null);
  const [ownedTokens, setOwnedTokens] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [mintUri, setMintUri] = useState("");
  const [mintRecipient, setMintRecipient] = useState("");

  const refresh = useCallback(async () => {
    if (!signer || !account) return;
    setLoading(true);
    try {
      const nft = getNFTContract(signer);
      const [name, symbol, totalMinted, contractOwner] = await Promise.all([
        nft.name(),
        nft.symbol(),
        nft.totalMinted(),
        nft.owner(),
      ]);
      setCollectionInfo({ name, symbol, totalMinted });
      setIsOwner(contractOwner.toLowerCase() === account.toLowerCase());

      const balance = Number(await nft.balanceOf(account));
      const tokens = [];
      for (let i = 0; i < balance; i++) {
        const tokenId = await nft.tokenOfOwnerByIndex(account, i);
        const uri = await nft.tokenURI(tokenId);
        tokens.push({ tokenId: tokenId.toString(), uri });
      }
      setOwnedTokens(tokens);
    } catch (err) {
      setStatus("Error loading NFT data: " + err.message);
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
    setStatus("Minting NFT…");
    try {
      const nft = getNFTContract(signer);
      const recipient = mintRecipient || account;
      const tx = await nft.safeMint(recipient, mintUri);
      setStatus("Waiting for confirmation…");
      const receipt = await tx.wait();
      setStatus(`NFT minted! Tx: ${tx.hash}`);
      setMintUri("");
      setMintRecipient("");
      await refresh();
    } catch (err) {
      setStatus("Mint failed: " + (err.reason || err.message));
    }
  }

  if (!signer) {
    return <p className="not-connected">Connect your wallet to view the NFT gallery.</p>;
  }

  return (
    <div className="dashboard">
      <div className="card">
        <h2>Collection Info</h2>
        {loading && <p>Loading…</p>}
        {collectionInfo && (
          <dl className="info-grid">
            <dt>Name</dt><dd>{collectionInfo.name}</dd>
            <dt>Symbol</dt><dd>{collectionInfo.symbol}</dd>
            <dt>Total Minted</dt><dd>{collectionInfo.totalMinted.toString()}</dd>
            <dt>Your Role</dt><dd>{isOwner ? "Owner (can mint)" : "Holder"}</dd>
          </dl>
        )}
        <button className="btn btn-outline" onClick={refresh} disabled={loading}>
          Refresh
        </button>
      </div>

      {isOwner && (
        <div className="card">
          <h2>Mint NFT</h2>
          <form onSubmit={handleMint} className="form">
            <label>
              Metadata URI (IPFS or HTTP)
              <input
                type="text"
                placeholder="ipfs://Qm…"
                value={mintUri}
                onChange={(e) => setMintUri(e.target.value)}
                required
              />
            </label>
            <label>
              Recipient (leave blank for your address)
              <input
                type="text"
                placeholder="0x…"
                value={mintRecipient}
                onChange={(e) => setMintRecipient(e.target.value)}
              />
            </label>
            <button className="btn btn-primary" type="submit">
              Mint NFT
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Your NFTs ({ownedTokens.length})</h2>
        {loading ? (
          <p>Loading…</p>
        ) : ownedTokens.length === 0 ? (
          <p className="empty-state">You don't own any NFTs from this collection yet.</p>
        ) : (
          <div className="nft-grid">
            {ownedTokens.map(({ tokenId, uri }) => (
              <div key={tokenId} className="nft-card">
                <div className="nft-id">#{tokenId}</div>
                <div className="nft-uri" title={uri}>
                  {uri.length > 40 ? uri.slice(0, 37) + "…" : uri}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {status && <p className="status-text">{status}</p>}
    </div>
  );
}

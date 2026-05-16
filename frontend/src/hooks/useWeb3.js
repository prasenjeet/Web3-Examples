import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, JsonRpcProvider, Wallet } from "ethers";

const RPC_URL = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";

export function useWeb3() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [walletType, setWalletType] = useState(null); // "metamask" | "local"
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Attach a Wallet instance to a JsonRpcProvider and update state.
  const _applyLocalWallet = useCallback(async (wallet) => {
    const rpcProvider = new JsonRpcProvider(RPC_URL);
    const connected = wallet.connect(rpcProvider);
    const network = await rpcProvider.getNetwork();
    setProvider(rpcProvider);
    setSigner(connected);
    setAccount(await connected.getAddress());
    setChainId(Number(network.chainId));
    setWalletType("local");
    setError(null);
  }, []);

  // Connect an existing MetaMask (or any injected) wallet.
  const connectMetaMask = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask not detected. Please install MetaMask.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      const signerInstance = await browserProvider.getSigner();
      const address = await signerInstance.getAddress();
      const network = await browserProvider.getNetwork();
      setProvider(browserProvider);
      setSigner(signerInstance);
      setAccount(address);
      setChainId(Number(network.chainId));
      setWalletType("metamask");
    } catch (err) {
      setError(err.message || "Failed to connect wallet.");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Generate a new random wallet and connect it to the local RPC node.
  // Returns { privateKey, mnemonic } so the caller can display them once.
  const createWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const wallet = Wallet.createRandom();
      await _applyLocalWallet(wallet);
      return { privateKey: wallet.privateKey, mnemonic: wallet.mnemonic.phrase };
    } catch (err) {
      setError(err.message || "Failed to create wallet.");
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [_applyLocalWallet]);

  // Import a wallet from a hex private key string.
  const importFromPrivateKey = useCallback(async (privateKey) => {
    setIsConnecting(true);
    setError(null);
    try {
      const wallet = new Wallet(privateKey.trim());
      await _applyLocalWallet(wallet);
    } catch (err) {
      setError(err.reason || err.message || "Invalid private key.");
    } finally {
      setIsConnecting(false);
    }
  }, [_applyLocalWallet]);

  // Import a wallet from a BIP-39 mnemonic phrase.
  const importFromMnemonic = useCallback(async (phrase) => {
    setIsConnecting(true);
    setError(null);
    try {
      const wallet = Wallet.fromPhrase(phrase.trim());
      await _applyLocalWallet(wallet);
    } catch (err) {
      setError(err.reason || err.message || "Invalid mnemonic phrase.");
    } finally {
      setIsConnecting(false);
    }
  }, [_applyLocalWallet]);

  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setWalletType(null);
    setError(null);
  }, []);

  // MetaMask event listeners — only active when using MetaMask.
  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) disconnect();
      else if (walletType === "metamask") connectMetaMask();
    };
    const handleChainChanged = () => window.location.reload();
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [connectMetaMask, disconnect, walletType]);

  return {
    provider, signer, account, chainId, walletType,
    isConnecting, error,
    connectMetaMask, createWallet, importFromPrivateKey, importFromMnemonic, disconnect,
  };
}

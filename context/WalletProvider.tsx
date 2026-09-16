"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BrowserProvider, ethers } from "ethers";

type WalletContextType = {
  address: string | null;
  provider: BrowserProvider | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  chainId: number | null;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const syncWallet = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      return;
    }

    const browserProvider = new BrowserProvider((window as any).ethereum);
    const signer = await browserProvider.getSigner().catch(() => null);

    if (!signer) {
      setAddress(null);
      setProvider(browserProvider);
      setChainId(null);
      return;
    }

    const signerAddress = await signer.getAddress();
    const network = await browserProvider.getNetwork();

    setAddress(signerAddress);
    setProvider(browserProvider);
    setChainId(Number(network.chainId));
  };

  const connectWallet = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      alert("Please install MetaMask or a wallet compatible with EIP-1193.");
      return;
    }

    const browserProvider = new BrowserProvider((window as any).ethereum);
    await browserProvider.send("eth_requestAccounts", []);
    await syncWallet();
  };

  const disconnectWallet = () => {
    setAddress(null);
    setProvider(null);
    setChainId(null);
  };

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      return;
    }

    const handleAccountsChanged = () => syncWallet();
    const handleChainChanged = () => syncWallet();

    (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
    (window as any).ethereum.on("chainChanged", handleChainChanged);

    syncWallet();

    return () => {
      (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged);
      (window as any).ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const value = useMemo<WalletContextType>(
    () => ({
      address,
      provider,
      isConnected: !!address,
      connectWallet,
      disconnectWallet,
      chainId,
    }),
    [address, provider, chainId]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider");
  }
  return context;
}

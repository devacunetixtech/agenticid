"use client";

import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/context/WalletProvider";
import { AGENT_REGISTRY_ABI, AGENT_REGISTRY_ADDRESS } from "@/lib/contracts";

import type { Agent } from "@/lib/agent-data";
import { readAgent } from "@/lib/agent-data";

export function useAgent() {
  const { address, provider, chainId } = useWallet();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [message, setMessage] = useState("Connect your wallet to view your agent.");
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    let cancelled = false;
    setAgent(null);
    if (!address || !provider) { setMessage("Connect your wallet to view your agent."); return; }
    if (chainId !== 968) { setMessage("Switch your wallet to BOT Chain Testnet (968)."); return; }
    setMessage("Loading your profile…");
    (async () => {
      const registry = new ethers.Contract(AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI, provider);
      const wallets: string[] = await registry.getAllAgents();
      if (!wallets.some(wallet => wallet.toLowerCase() === address.toLowerCase())) {
        if (!cancelled) setMessage("This wallet has no registered agent.");
        return;
      }
      const profile = await readAgent(provider, address);
      if (!cancelled) { setAgent(profile); setMessage(""); }

    })().catch(() => { if (!cancelled) setMessage("Could not load your profile. Try refreshing."); });
    return () => { cancelled = true; };
  }, [address, provider, chainId, revision]);
  return { agent, message, refresh };
}

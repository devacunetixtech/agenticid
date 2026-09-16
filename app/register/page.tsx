"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ethers } from "ethers";
import Header from "@/components/Header";
import { useWallet } from "@/context/WalletProvider";
import { AGENT_REGISTRY_ABI, AGENT_REGISTRY_ADDRESS } from "@/lib/contracts";

export default function RegisterPage() {
  const { address, provider, chainId } = useWallet();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [services, setServices] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [txHash, setTxHash] = useState("");
  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    if (!provider || !address || chainId !== 968) return;
    setBusy(true); setTxHash(""); setStatus("Confirm registration in your wallet.");
    try {
      const registry = new ethers.Contract(AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI, await provider.getSigner());
      const tx = await registry.registerAgent(name.trim(), address, description.trim(), services.split(",").map(item => item.trim()).filter(Boolean));
      setTxHash(tx.hash); setStatus("Waiting for confirmation…");
      await tx.wait(); setStatus("Agent registered. Open your profile to view it.");
    } catch (error) {
      setStatus(ethers.isError(error, "ACTION_REJECTED") ? "Registration cancelled." : "Registration failed. Check that this wallet has not already registered an agent and has enough gas.");
    } finally { setBusy(false); }
  };
  return <main className="page-shell narrow-shell"><Header />
    <section className="panel form-panel">
      <h1>Register your agent</h1><p className="form-intro">One agent per wallet. Your name, description, and services will be public.</p>
      <form onSubmit={handleRegister}>
        <div className="fields">
          <label>Agent name<input required value={name} onChange={event => setName(event.target.value)} placeholder="Your agent’s name" disabled={busy} /></label>
          <label>Wallet<input value={address || "Connect your wallet using the button above"} readOnly /></label>
          <label>Description<textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="What does your agent do?" rows={4} disabled={busy} /></label>
          <label>Services<input value={services} onChange={event => setServices(event.target.value)} placeholder="Research, monitoring, automation" disabled={busy} /><span className="field-hint">Separate services with commas.</span></label>
        </div>
        <div className="panel-actions"><button className="primary-btn" disabled={busy || !address || chainId !== 968 || !name.trim()}>{busy ? "Registering…" : "Register agent"}</button></div>
      </form>
      {!address ? <p className="form-intro">Connect your wallet to register.</p> : chainId !== 968 ? <p className="form-intro">Switch to BOT Chain Testnet (968) to register.</p> : null}
      {status && <p className="status-box" role="status">{status}</p>}
      {status.startsWith("Agent registered.") && <div className="panel-actions"><Link href={`/agents/${address}`} className="primary-btn">View your agent</Link><Link href="/agents" className="secondary-btn">Browse all agents</Link></div>}
      {txHash && <a className="transaction-link" href={`https://scan.bohr.life/tx/${txHash}`} target="_blank" rel="noreferrer">View transaction ↗</a>}
    </section>
  </main>;
}

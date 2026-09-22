"use client";

import { useState, type FormEvent } from "react";
import { ethers } from "ethers";
import Link from "next/link";
import ActivityFeed from "@/components/ActivityFeed";
import Header from "@/components/Header";
import { useAgent } from "@/hooks/useAgent";
import { useWallet } from "@/context/WalletProvider";
import { BOT_CHAIN_EXPLORER_URL, BOT_CHAIN_ID, REPUTATION_ABI, REPUTATION_ADDRESS } from "@/lib/contracts";

export default function AgentDashboard() {
  const { agent, message, refresh } = useAgent();
  const { address, provider, chainId } = useWallet();
  const [amount, setAmount] = useState("");
  const [rating, setRating] = useState("5");
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [txHash, setTxHash] = useState("");
  const recordJob = async (event: FormEvent) => {
    event.preventDefault();
    if (!provider || !address || chainId !== BOT_CHAIN_ID || !agent) return;
    setBusy(true); setTxHash(""); setStatus("Confirm the job record in your wallet.");
    try {
      const value = ethers.parseEther(amount);
      if (value < ethers.toBigInt(0)) throw new Error("Invalid amount");
      const reputation = new ethers.Contract(REPUTATION_ADDRESS, REPUTATION_ABI, await provider.getSigner());
      const tx = await reputation.recordCompletedJob(address, value, Number(rating), feedback.trim());
      setTxHash(tx.hash); setStatus("Waiting for confirmation…");
      await tx.wait(); setStatus("Job recorded."); setAmount(""); setFeedback(""); refresh();
    } catch (error) {
      setStatus(ethers.isError(error, "ACTION_REJECTED") ? "Job record cancelled." : "Could not record this job. Check the amount and your wallet’s gas balance.");
    } finally { setBusy(false); }
  };
  return <main className="page-shell narrow-shell"><Header />
    <div className="page-heading"><div><h1>Dashboard</h1><p className="muted">Record completed work and review your agent’s activity.</p></div><button className="secondary-btn" onClick={refresh} disabled={busy}>Refresh dashboard</button></div>
    {!agent ? <section className="panel empty-state"><h2>Set up your workspace</h2><p role="status">{message}</p><Link href="/register" className="secondary-btn">Register agent</Link><Link href="/agents" className="nav-link workspace-browse">Browse agents</Link></section> : <section className="panel dashboard-summary">
      <div className="panel-header"><div><span className="eyebrow">Your agent</span><h2>{agent.name}</h2></div><Link href="/profile" className="nav-link">View profile →</Link></div>
      <dl className="dashboard-metrics"><div><dt>Jobs recorded</dt><dd>{agent.jobs}</dd></div><div><dt>Reputation score</dt><dd>{agent.score}</dd></div><div><dt>Average rating</dt><dd>{agent.rating}</dd></div></dl>
    </section>}
    {agent && <div className="panel-actions"><Link href={`/agents/${agent.wallet}`} className="secondary-btn">View public profile</Link><Link href="/agents" className="secondary-btn">Browse agents</Link></div>}
    {agent && <section className="panel form-panel job-form"><h2>Record a completed job</h2><p className="form-intro">Add a record for your agent. The amount is reported; no payment is sent.</p>
      <form onSubmit={recordJob}><div className="fields">
        <label>Amount in native tokens<input required inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.5" disabled={busy} /></label>
        <label>Rating<select value={rating} onChange={event => setRating(event.target.value)} disabled={busy}>{[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} / 5</option>)}</select></label>
        <label>Feedback<textarea value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="Describe the completed work" rows={3} disabled={busy} /></label>
      </div><div className="panel-actions"><button className="primary-btn" disabled={busy || !amount.trim()}>{busy ? "Recording…" : "Record job"}</button></div></form>
      {status && <p className="status-box" role="status">{status}</p>}{txHash && <a className="transaction-link" href={`${BOT_CHAIN_EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noreferrer">View transaction ↗</a>}
    </section>}
    {agent && <ActivityFeed wallet={agent.wallet} />}
  </main>;
}

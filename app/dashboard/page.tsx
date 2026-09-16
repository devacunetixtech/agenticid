"use client";

import { useState, type FormEvent } from "react";
import { ethers } from "ethers";
import Link from "next/link";
import ActivityFeed from "@/components/ActivityFeed";
import Header from "@/components/Header";
import AgentProfile from "@/components/AgentProfile";
import { useAgent } from "@/hooks/useAgent";
import { useWallet } from "@/context/WalletProvider";
import { REPUTATION_ABI, REPUTATION_ADDRESS } from "@/lib/contracts";

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
    if (!provider || !address || chainId !== 968 || !agent) return;
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
  return <main className="page-shell narrow-shell"><Header /><AgentProfile agent={agent} message={message} />
    {agent && <div className="panel-actions"><Link href={`/agents/${agent.wallet}`} className="secondary-btn">View public profile</Link><Link href="/agents" className="secondary-btn">Browse agents</Link></div>}
    {agent && <section className="panel form-panel job-form"><h2>Record a completed job</h2><p className="form-intro">Add a record for your agent. The amount is reported; no payment is sent.</p>
      <form onSubmit={recordJob}><div className="fields">
        <label>Amount in native tokens<input required inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.5" disabled={busy} /></label>
        <label>Rating<select value={rating} onChange={event => setRating(event.target.value)} disabled={busy}>{[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} / 5</option>)}</select></label>
        <label>Feedback<textarea value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="Describe the completed work" rows={3} disabled={busy} /></label>
      </div><div className="panel-actions"><button className="primary-btn" disabled={busy || !amount.trim()}>{busy ? "Recording…" : "Record job"}</button></div></form>
      {status && <p className="status-box" role="status">{status}</p>}{txHash && <a className="transaction-link" href={`https://scan.bohr.life/tx/${txHash}`} target="_blank" rel="noreferrer">View transaction ↗</a>}
    </section>}
    {agent && <ActivityFeed wallet={agent.wallet} />}
    <button className="secondary-btn refresh-btn" onClick={refresh}>Refresh profile</button>
  </main>;
}

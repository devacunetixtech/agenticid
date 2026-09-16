"use client";

import Link from "next/link";
import { useState } from "react";
import Header from "@/components/Header";
import AgentProfile from "@/components/AgentProfile";
import { useAgent } from "@/hooks/useAgent";

export default function ProfilePage() {
  const { agent, message, refresh } = useAgent();
  const [shareStatus, setShareStatus] = useState("");
  return <main className="page-shell narrow-shell"><Header />
    <div className="page-heading"><div><h1>My profile</h1><p className="muted">View your agent’s public details and share its profile.</p></div><Link href="/dashboard" className="secondary-btn">Go to dashboard</Link></div>
    <AgentProfile agent={agent} message={message} />
    {agent && <div className="panel-actions"><Link href={`/agents/${agent.wallet}`} className="primary-btn">Open public profile</Link><button className="secondary-btn" onClick={async () => {
      const url = `${window.location.origin}/agents/${agent.wallet}`;
      try { await navigator.clipboard.writeText(url); setShareStatus("Public profile link copied."); }
      catch { setShareStatus(`Share this link: ${url}`); }
    }}>Copy public profile link</button></div>}
    {agent && shareStatus && <p className="form-intro" role="status">{shareStatus}</p>}
    <button className="secondary-btn refresh-btn" onClick={refresh}>Refresh profile</button>
  </main>;
}

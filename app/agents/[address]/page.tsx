"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import AgentProfile from "@/components/AgentProfile";
import ActivityFeed from "@/components/ActivityFeed";
import type { Agent } from "@/lib/agent-data";
import { BOT_CHAIN_EXPLORER_URL } from "@/lib/contracts";

export default function PublicProfilePage({ params }: { params: { address: string } }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [message, setMessage] = useState("Loading agent…");
  const [revision, setRevision] = useState(0);
  const [copied, setCopied] = useState("");
  useEffect(() => {
    const controller = new AbortController(); setAgent(null); setMessage("Loading agent…");
    fetch(`/api/agents/${encodeURIComponent(params.address)}`, { signal: controller.signal }).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setAgent(data.agent); setMessage("");
    }).catch(error => { if (!controller.signal.aborted) setMessage(error.message || "Could not load agent."); });
    return () => controller.abort();
  }, [params.address, revision]);
  return <main className="page-shell narrow-shell"><Header /><Link href="/agents" className="nav-link back-link">← All agents</Link>
    <AgentProfile agent={agent} message={message} publicView />
    {agent ? <><div className="panel-actions"><button className="secondary-btn" onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied("Profile link copied."); } catch { setCopied("Copy the URL from your address bar to share this profile."); } }}>Copy profile link</button><a className="secondary-btn" href={`${BOT_CHAIN_EXPLORER_URL}/address/${agent.wallet}`} target="_blank" rel="noreferrer">View wallet ↗</a></div>{copied && <p className="form-intro" role="status">{copied}</p>}<ActivityFeed wallet={agent.wallet} /></> : <button className="secondary-btn refresh-btn" onClick={() => setRevision(value => value + 1)}>Reload profile</button>}
  </main>;
}

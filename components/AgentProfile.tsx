"use client";

import Link from "next/link";
import { useAgent } from "@/hooks/useAgent";

export default function AgentProfile({ agent, message, publicView = false }: Pick<ReturnType<typeof useAgent>, "agent" | "message"> & { publicView?: boolean }) {
  if (!agent) return <section className="panel empty-state"><h1>{publicView ? "Agent profile" : "Your agent"}</h1><p role="status">{message}</p><Link href={publicView ? "/agents" : "/register"} className="secondary-btn">{publicView ? "Browse agents" : "Register agent"}</Link></section>;
  return <>
    <section className="hero-card">
      <div className="profile-panel"><div className="avatar" aria-hidden="true">{agent.name.slice(0, 1).toUpperCase()}</div><div><div className="eyebrow">Agent profile</div><h1>{agent.name}</h1><p className="wallet">{agent.wallet}</p></div></div>
      <div className="score-block"><span className="score-label">Reputation score</span><strong className="score-value">{agent.score}</strong></div>
    </section>
    <section className="panel"><h2>About</h2><p className="profile-description">{agent.description || "No description added."}</p><div className="chips">{agent.services.map(service => <span className="chip" key={service}>{service}</span>)}</div>
      <dl className="detail-list"><div><dt>Jobs recorded</dt><dd>{agent.jobs}</dd></div><div><dt>Reported amount</dt><dd>{agent.earnings} native tokens</dd></div><div><dt>Average rating</dt><dd>{agent.rating}</dd></div><div><dt>Registered</dt><dd>{new Date(agent.registered).toLocaleDateString()}</dd></div></dl>
    </section>
  </>;
}

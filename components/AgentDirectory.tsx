"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useDirectory } from "@/hooks/useDirectory";
import { formatAddress } from "@/lib/contracts";

export default function AgentDirectory({ ranked = false }: { ranked?: boolean }) {
  const { agents, loading, error, refresh } = useDirectory();
  const [query, setQuery] = useState("");
  const [service, setService] = useState("");
  const [sort, setSort] = useState(ranked ? "score" : "newest");
  const services = useMemo(() => Array.from(new Set(agents.flatMap(agent => agent.services))).sort(), [agents]);
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return agents.filter(agent => (!service || agent.services.includes(service)) && [agent.name, agent.description, agent.wallet, ...agent.services].some(value => value.toLowerCase().includes(search)))
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "newest") return Date.parse(b.registered) - Date.parse(a.registered);
        const key = sort === "jobs" ? "jobs" : "score";
        const left = BigInt(a[key]), right = BigInt(b[key]);
        return left === right ? a.wallet.localeCompare(b.wallet) : left > right ? -1 : 1;
      });
  }, [agents, query, service, sort]);
  return <>
    <div className="page-heading"><div><h1>{ranked ? "Leaderboard" : "Registered agents"}</h1><p className="muted">{ranked ? "Compare reported job counts and reputation scores." : "Browse public profiles on BOT Chain Testnet. No wallet connection needed."}</p></div><Link href="/register" className="primary-btn">Register agent</Link></div>
    <div className="directory-filters fields"><label>Search<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, wallet, or service" /></label><label>Service<select value={service} onChange={event => setService(event.target.value)}><option value="">All services</option>{services.map(value => <option key={value}>{value}</option>)}</select></label><label>Sort by<select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">Newest</option><option value="score">Reputation score</option><option value="jobs">Jobs recorded</option><option value="name">Name</option></select></label></div>
    {loading ? <p className="panel" role="status">Loading agents…</p> : error ? <div className="panel empty-state" role="alert"><p>{error}</p><button className="secondary-btn" onClick={refresh}>Try again</button></div> : <>
      <p className="result-count" role="status">{filtered.length} of {agents.length} registered agents</p>
      {!filtered.length ? <div className="panel empty-state"><h2>{agents.length ? "No matching agents" : "No agents registered yet"}</h2><p>{agents.length ? "Try another search or service." : "Register the first agent to add it to this directory."}</p>{agents.length ? <button className="secondary-btn" onClick={() => { setQuery(""); setService(""); }}>Clear filters</button> : <Link href="/register" className="secondary-btn">Register agent</Link>}</div> :
        <div className="agent-grid">{filtered.map((agent, index) => <article className="panel directory-card" key={agent.wallet}>
          <div className="card-heading"><div><span className="eyebrow">{ranked ? `${sort === "score" ? "Rank" : "Position"} ${index + 1}` : "Agent"}</span><h2><Link href={`/agents/${agent.wallet}`}>{agent.name}</Link></h2></div><strong className="directory-score" title="Reputation score">{agent.score}</strong></div>
          <p className="wallet">{formatAddress(agent.wallet)}</p><p className="profile-description">{agent.description || "No description added."}</p><div className="chips">{agent.services.map(value => <span className="chip" key={value}>{value}</span>)}</div>
          <div className="card-summary"><span>{agent.jobs} jobs recorded</span><span>{agent.rating}</span></div><Link href={`/agents/${agent.wallet}`} className="nav-link">View profile →</Link>
        </article>)}</div>}
      <p className="muted directory-note">Scores are based on submitted records and can exceed 100. {ranked && "Ranks are relative to the current filters."}</p><button className="secondary-btn" onClick={refresh}>Refresh agents</button>
    </>}
  </>;
}

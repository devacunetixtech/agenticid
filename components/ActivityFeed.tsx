"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Activity } from "@/lib/activity-data";
import { formatAddress } from "@/lib/contracts";

export default function ActivityFeed({ wallet }: { wallet?: string }) {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [range, setRange] = useState<{ from: number; to: number } | null>(null);
  const pending = useRef<AbortController | null>(null);
  const load = useCallback(async (cursor?: number) => {
    pending.current?.abort();
    const controller = new AbortController(); pending.current = controller;
    setLoading(true); setError("");
    if (cursor === undefined) { setItems([]); setRange(null); setNextCursor(null); }
    try {
      const params = new URLSearchParams();
      if (wallet) params.set("wallet", wallet);
      if (cursor !== undefined) params.set("cursor", String(cursor));
      const response = await fetch(`/api/activity?${params}`, { signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setItems(previous => cursor === undefined ? data.activity : [...previous, ...data.activity].filter((item, index, all) => all.findIndex(entry => entry.id === item.id) === index));
      setRange(previous => ({ from: data.fromBlock, to: cursor === undefined ? data.toBlock : previous?.to ?? data.toBlock }));
      setNextCursor(data.nextCursor);
    } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not load activity."); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, [wallet]);
  useEffect(() => { load(); return () => pending.current?.abort(); }, [load]);
  return <section className="panel activity-panel">
    <div className="panel-header"><h2>{wallet ? "Jobs and registration" : "Recent activity"}</h2><button className="secondary-btn" onClick={() => load()} disabled={loading}>Refresh</button></div>
    <p className="muted">Public registration and job records, newest first.</p>
    {items.length > 0 && <ol className="activity-list">{items.map(item => <li key={item.id}>
      <div className="activity-heading"><strong>{item.kind === "registration" ? `${item.name} registered` : "Job recorded"}</strong>{item.rating && <span>{item.rating} / 5</span>}</div>
      <Link href={`/agents/${item.wallet}`} className="wallet">{formatAddress(item.wallet)}</Link>
      {item.amount && <p className="muted">Reported amount: {item.amount} native tokens</p>}
      {item.feedback && <p className="profile-description">{item.feedback}</p>}
      <div className="activity-meta"><span>Block {item.block.toLocaleString()}</span><a href={`https://scan.bohr.life/tx/${item.transaction}`} target="_blank" rel="noreferrer">View transaction ↗</a></div>
    </li>)}</ol>}
    {loading && <p className="form-intro" role="status">Loading activity…</p>}
    {error && <div role="alert"><p className="form-intro">{error}</p><button className="secondary-btn" onClick={() => load(range && nextCursor !== null ? nextCursor : undefined)}>Try again</button></div>}
    {!loading && !error && !items.length && <p className="form-intro">No records in the checked blocks. Load older blocks to look further back.</p>}
    {range && <p className="field-hint">Checked blocks {range.from.toLocaleString()}–{range.to.toLocaleString()}.</p>}
    {nextCursor !== null && !error && <button className="secondary-btn refresh-btn" disabled={loading} onClick={() => load(nextCursor)}>Load older blocks</button>}
    {range && nextCursor === null && <p className="field-hint">All blocks checked.</p>}
  </section>;
}

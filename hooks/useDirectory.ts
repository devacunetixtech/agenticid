"use client";
import { useCallback, useEffect, useState } from "react";
import type { Agent } from "@/lib/agent-data";

export function useDirectory() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    fetch("/api/agents", { signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAgents(data.agents);
    }).catch(error => { if (!controller.signal.aborted) setError(error.message || "Could not load agents."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  return { agents, loading, error, refresh };
}

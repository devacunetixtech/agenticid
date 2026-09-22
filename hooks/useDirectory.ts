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
    (async () => {
      let lastError: unknown;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const response = await fetch("/api/agents", { signal: controller.signal });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          setAgents(data.agents);
          return;
        } catch (error) {
          if (controller.signal.aborted) return;
          lastError = error;
          if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)));
        }
      }
      setError(lastError instanceof Error ? lastError.message : "Could not load agents.");
    })().finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  return { agents, loading, error, refresh };
}

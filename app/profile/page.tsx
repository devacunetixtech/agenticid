"use client";

import Header from "@/components/Header";
import AgentProfile from "@/components/AgentProfile";
import { useAgent } from "@/hooks/useAgent";

export default function ProfilePage() {
  const { agent, message, refresh } = useAgent();
  return <main className="page-shell narrow-shell"><Header /><AgentProfile agent={agent} message={message} /><button className="secondary-btn refresh-btn" onClick={refresh}>Refresh profile</button></main>;
}

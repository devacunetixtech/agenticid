"use client";

import Link from "next/link";
import { useWallet } from "@/context/WalletProvider";

export default function Header() {
  const { isConnected, connectWallet, disconnectWallet } = useWallet();
  return (
    <header className="landing-header compact-header">
      <Link href="/" className="brand-wrap" aria-label="AgenticID home">
        <span className="brand-mark" aria-hidden="true" />
        <span>AgenticID</span>
      </Link>
      <nav className="landing-nav" aria-label="Main navigation">
        <Link href="/agents">Agents</Link>
        <Link href="/leaderboard">Leaderboard</Link>
        <Link href="/activity">Activity</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/profile">Profile</Link>
        <Link href="/register">Register</Link>
        <button className="secondary-btn" onClick={isConnected ? disconnectWallet : connectWallet}>
          {isConnected ? "Disconnect" : "Connect wallet"}
        </button>
      </nav>
    </header>
  );
}

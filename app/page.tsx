import Link from "next/link";
import Header from "@/components/Header";
import { AGENT_REGISTRY_ADDRESS, REPUTATION_ADDRESS } from "@/lib/contracts";

export default function LandingPage() {
  return (
    <main className="landing-shell">
      <Header />
      <section className="landing-hero">
        <div className="hero-copy">
          <div className="eyebrow">BOT Chain Testnet</div>
          <h1>A public profile for your agent.</h1>
          <p>Register a wallet, describe what your agent does, and keep a record of its jobs and ratings.</p>
          <div className="hero-actions">
            <Link href="/register" className="primary-btn">Register agent</Link>
            <Link href="/agents" className="secondary-btn">Browse agents</Link>
          </div>
        </div>
        <aside className="profile-preview">
          <div className="eyebrow">Getting started</div>
          <ol className="setup-list">
            <li><strong>Connect your wallet</strong><p>Use BOT Chain Testnet to register.</p></li>
            <li><strong>Add your agent</strong><p>Enter a name, description, and services.</p></li>
            <li><strong>Record completed work</strong><p>Add job amounts, ratings, and feedback.</p></li>
          </ol>
        </aside>
      </section>
      <section className="details-section">
        <h2>What the profile records</h2>
        <dl className="detail-list">
          <div><dt>Identity</dt><dd>Name, wallet, services, and registration date.</dd></div>
          <div><dt>Work</dt><dd>Reported job count and amounts. Recording a job does not transfer payment.</dd></div>
          <div><dt>Reputation</dt><dd>A score based on job count and average rating. Scores can exceed 100.</dd></div>
        </dl>
        <p className="muted">Records are public submissions. They do not independently confirm that work was completed.</p>
      </section>
      <footer className="site-footer">
        <span>BOT Chain Testnet · Chain 968</span>
        <a href={`https://scan.bohr.life/address/${AGENT_REGISTRY_ADDRESS}#code`} target="_blank" rel="noreferrer">AgentRegistry ↗</a>
        <a href={`https://scan.bohr.life/address/${REPUTATION_ADDRESS}#code`} target="_blank" rel="noreferrer">Reputation ↗</a>
      </footer>
    </main>
  );
}

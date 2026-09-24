import { BOT_CHAIN_EXPLORER_URL, BOT_CHAIN_URL } from "@/lib/contracts";

export default function Footer() {
  return (
    <footer className="site-footer" aria-label="BOT Chain links">
      <span>Built on BOT Chain</span>
      <a href={BOT_CHAIN_URL} target="_blank" rel="noreferrer">
        https://botchain.ai ↗
      </a>
      <a href={BOT_CHAIN_EXPLORER_URL} target="_blank" rel="noreferrer">
        https://scan.botchain.ai ↗
      </a>
    </footer>
  );
}

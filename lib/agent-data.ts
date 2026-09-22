import { ethers } from "ethers";
import { AGENT_REGISTRY_ABI, AGENT_REGISTRY_ADDRESS, REPUTATION_ABI, REPUTATION_ADDRESS } from "./contracts";

export type Agent = {
  wallet: string; name: string; description: string; services: string[];
  registered: string; jobs: string; earnings: string; score: string; rating: string;
};

export function readProvider() {
  const request = new ethers.FetchRequest(process.env.BOTCHAIN_MAINNET_RPC_URL || "https://rpc.botchain.ai");
  request.timeout = 20000;
  return new ethers.JsonRpcProvider(request, 677, { staticNetwork: true, batchMaxCount: 1 });
}

export async function readAgent(provider: ethers.Provider, wallet: string): Promise<Agent> {
  const registry = new ethers.Contract(AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI, provider);
  const reputation = new ethers.Contract(REPUTATION_ADDRESS, REPUTATION_ABI, provider);
  const [profile, jobs, earnings, score, rating] = await Promise.all([
    registry.getAgent(wallet), reputation.getCompletedJobs(wallet), reputation.getTotalEarnings(wallet),
    reputation.getReputationScore(wallet), reputation.getAverageRating(wallet),
  ]);
  return {
    wallet: ethers.getAddress(profile.wallet), name: profile.name, description: profile.description,
    services: Array.from(profile.services), registered: new Date(Number(profile.registrationDate) * 1000).toISOString(),
    jobs: String(jobs), earnings: ethers.formatEther(earnings), score: String(score),
    rating: String(jobs) !== "0" ? `${Number(rating) / 100} / 5` : "No ratings",
  };
}

export async function readDirectory(provider: ethers.Provider) {
  const registry = new ethers.Contract(AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI, provider);
  const wallets: string[] = await registry.getAllAgents();
  const agents: Agent[] = [];
  for (let offset = 0; offset < wallets.length; offset += 4) {
    agents.push(...await Promise.all(wallets.slice(offset, offset + 4).map(wallet => readAgent(provider, wallet))));
  }
  return agents;
}

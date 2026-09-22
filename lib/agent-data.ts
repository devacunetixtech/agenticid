import { ethers } from "ethers";
import { AGENT_REGISTRY_ABI, AGENT_REGISTRY_ADDRESS, REPUTATION_ABI, REPUTATION_ADDRESS } from "./contracts";

const MULTICALL3_ADDRESS = "0x47FA21f684bBAD707A53a0f9BE59F1422F46C265";
const MULTICALL3_ABI = [
  "function aggregate3((address target, bool allowFailure, bytes callData)[] calls) payable returns ((bool success, bytes returnData)[] returnData)",
];
const registryInterface = new ethers.Interface(AGENT_REGISTRY_ABI);
const reputationInterface = new ethers.Interface(REPUTATION_ABI);

export type Agent = {
  wallet: string; name: string; description: string; services: string[];
  registered: string; jobs: string; earnings: string; score: string; rating: string;
};

export function readProvider() {
  const createProvider = (url: string) => {
    const request = new ethers.FetchRequest(url);
    request.timeout = 8000;
    return new ethers.JsonRpcProvider(request, 677, { staticNetwork: true, batchMaxCount: 1 });
  };
  const primary = createProvider(process.env.BOTCHAIN_MAINNET_RPC_URL || "https://rpc.botchain.ai");
  const fallback = createProvider(process.env.BOTCHAIN_MAINNET_FALLBACK_RPC_URL || "https://scan.botchain.ai/api/eth-rpc");
  return new ethers.FallbackProvider([
    { provider: primary, priority: 1, stallTimeout: 750, weight: 1 },
    { provider: fallback, priority: 2, stallTimeout: 750, weight: 1 },
  ], 677, { quorum: 1 });
}

async function retryRpc<T>(operation: () => Promise<T>) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function readAgentWallets(provider: ethers.Provider) {
  const registry = new ethers.Contract(AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI, provider);
  return retryRpc(async () => Array.from(await registry.getAllAgents()) as string[]);
}

function agentCalls(wallet: string) {
  return [
    { target: AGENT_REGISTRY_ADDRESS, allowFailure: false, callData: registryInterface.encodeFunctionData("getAgent", [wallet]) },
    { target: REPUTATION_ADDRESS, allowFailure: false, callData: reputationInterface.encodeFunctionData("getCompletedJobs", [wallet]) },
    { target: REPUTATION_ADDRESS, allowFailure: false, callData: reputationInterface.encodeFunctionData("getTotalEarnings", [wallet]) },
    { target: REPUTATION_ADDRESS, allowFailure: false, callData: reputationInterface.encodeFunctionData("getReputationScore", [wallet]) },
    { target: REPUTATION_ADDRESS, allowFailure: false, callData: reputationInterface.encodeFunctionData("getAverageRating", [wallet]) },
  ];
}

async function readCallResults(provider: ethers.Provider, wallets: string[]) {
  const multicall = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);
  return retryRpc(async () => Array.from(await multicall.aggregate3.staticCall(wallets.flatMap(agentCalls))));
}

function decodeAgent(wallet: string, results: any[]): Agent {
  const [profile] = registryInterface.decodeFunctionResult("getAgent", results[0].returnData);
  const [jobs] = reputationInterface.decodeFunctionResult("getCompletedJobs", results[1].returnData);
  const [earnings] = reputationInterface.decodeFunctionResult("getTotalEarnings", results[2].returnData);
  const [score] = reputationInterface.decodeFunctionResult("getReputationScore", results[3].returnData);
  const [rating] = reputationInterface.decodeFunctionResult("getAverageRating", results[4].returnData);
  return {
    wallet: ethers.getAddress(wallet), name: profile.name, description: profile.description,
    services: Array.from(profile.services), registered: new Date(Number(profile.registrationDate) * 1000).toISOString(),
    jobs: String(jobs), earnings: ethers.formatEther(earnings), score: String(score),
    rating: String(jobs) !== "0" ? `${Number(rating) / 100} / 5` : "No ratings",
  };
}

export async function readAgent(provider: ethers.Provider, wallet: string): Promise<Agent> {
  return decodeAgent(wallet, await readCallResults(provider, [wallet]));
}

export async function readDirectory(provider: ethers.Provider) {
  const wallets = await readAgentWallets(provider);
  if (wallets.length === 0) return [];
  const results = await readCallResults(provider, wallets);
  return wallets.map((wallet, index) => decodeAgent(wallet, results.slice(index * 5, (index + 1) * 5)));
}

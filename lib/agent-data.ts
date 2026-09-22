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

type RpcResponse = { result?: unknown; error?: { message?: string } };
type MulticallResult = { returnData: string };

async function requestRpcEndpoint(url: string, method: string, params: Array<any> | Record<string, any>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
    signal: AbortSignal.timeout(2500),
  });
  if (!response.ok) throw new Error(`RPC request failed with HTTP ${response.status}.`);
  const payload = await response.json() as RpcResponse;
  if (payload.error) throw new Error(payload.error.message || "RPC request failed.");
  if (payload.result === undefined) throw new Error("RPC response did not include a result.");
  return payload.result;
}

export function readProvider() {
  const endpoints = [
    process.env.BOTCHAIN_MAINNET_RPC_URL || "https://rpc.botchain.ai",
    process.env.BOTCHAIN_MAINNET_FALLBACK_RPC_URL || "https://scan.botchain.ai/api/eth-rpc",
  ];
  const transport = {
    request: async ({ method, params = [] }: { method: string; params?: Array<any> | Record<string, any> }) => {
      let lastError: unknown;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          return await Promise.any(endpoints.map(endpoint => requestRpcEndpoint(endpoint, method, params)));
        } catch (error) {
          lastError = error;
          if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
        }
      }
      throw lastError;
    },
  };
  return new ethers.BrowserProvider(transport, 677, { staticNetwork: true, polling: false });
}

export async function readAgentWallets(provider: ethers.Provider) {
  const registry = new ethers.Contract(AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI, provider);
  return Array.from(await registry.getAllAgents()) as string[];
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
  return Array.from(await multicall.aggregate3.staticCall(wallets.flatMap(agentCalls))) as MulticallResult[];
}

function decodeAgent(wallet: string, results: MulticallResult[]): Agent {
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

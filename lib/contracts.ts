import { ethers } from "ethers";

export const AGENT_REGISTRY_ADDRESS = "0x0a44d98c8ef8bc7635753bbdf1e71707d1e98f7f";
export const REPUTATION_ADDRESS = "0x4d8556f933142500fabccf7148a8b66529e8930c";

export const AGENT_REGISTRY_ABI = [
  "function registerAgent(string _name, address _wallet, string _description, string[] _services)",
  "function getAgent(address _wallet) view returns (tuple(string name, address wallet, string description, string[] services, uint256 registrationDate, uint256 jobsCompleted, uint256 reputationScore, uint256 totalEarnings, bool exists))",
  "function getAllAgents() view returns (address[])",
  "function getAgentCount() view returns (uint256)",
  "function recordJob(address _wallet, uint256 _amount, uint256 _score)",
];

export const REPUTATION_ABI = [
  "function recordCompletedJob(address _agent, uint256 _amount, uint256 _rating, string _feedback)",
  "function getCompletedJobs(address _agent) view returns (uint256)",
  "function getTotalEarnings(address _agent) view returns (uint256)",
  "function getReputationScore(address _agent) view returns (uint256)",
  "function getAverageRating(address _agent) view returns (uint256)",
];

export function formatAddress(value: string | null | undefined) {
  if (!value) return "";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export async function getAgentConfig(provider: ethers.BrowserProvider | null) {
  if (!provider) {
    return { registryAddress: AGENT_REGISTRY_ADDRESS, reputationAddress: REPUTATION_ADDRESS };
  }

  return {
    registryAddress: AGENT_REGISTRY_ADDRESS,
    reputationAddress: REPUTATION_ADDRESS,
  };
}

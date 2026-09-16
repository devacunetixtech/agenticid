import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { readProvider } from "@/lib/agent-data";
import type { Activity } from "@/lib/activity-data";
import { AGENT_REGISTRY_ADDRESS, REPUTATION_ADDRESS } from "@/lib/contracts";

export const dynamic = "force-dynamic";
const events = new ethers.Interface([
  "event AgentRegistered(address indexed wallet, string name, uint256 registrationDate)",
  "event JobCompleted(address indexed agent, uint256 amount, uint256 rating, string feedback)",
]);
export async function GET(request: Request) {
  const url = new URL(request.url);
  const wallet = url.searchParams.get("wallet");
  const cursor = url.searchParams.get("cursor");
  if (wallet && !ethers.isAddress(wallet)) return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  if (cursor !== null && (!/^\d+$/.test(cursor) || !Number.isSafeInteger(Number(cursor)))) return NextResponse.json({ error: "Invalid block cursor." }, { status: 400 });
  const provider = readProvider();
  try {
    const head = await provider.getBlockNumber();
    const toBlock = cursor === null ? head : Math.min(Number(cursor), head);
    const fromBlock = Math.max(0, toBlock - 9999);
    const topics: (string[] | string | null)[] = [[events.getEvent("AgentRegistered")!.topicHash, events.getEvent("JobCompleted")!.topicHash]];
    if (wallet) topics.push(ethers.zeroPadValue(wallet, 32));
    const logs = await provider.getLogs({ address: [AGENT_REGISTRY_ADDRESS, REPUTATION_ADDRESS], topics, fromBlock, toBlock });
    const activity: Activity[] = logs.map(log => {
      const event = events.parseLog(log)!;
      const common = { id: `${log.transactionHash}-${log.index}`, wallet: ethers.getAddress(event.args[0]), block: log.blockNumber, transaction: log.transactionHash };
      return event.name === "AgentRegistered" ? { ...common, kind: "registration" as const, name: event.args.name } : {
        ...common, kind: "job" as const, amount: ethers.formatEther(event.args.amount), rating: String(event.args.rating), feedback: event.args.feedback,
      };
    }).reverse();
    return NextResponse.json({ activity, fromBlock, toBlock, nextCursor: fromBlock > 0 ? fromBlock - 1 : null });
  } catch {
    return NextResponse.json({ error: "Could not load activity from the network. Please try again." }, { status: 503 });
  } finally { provider.destroy(); }
}

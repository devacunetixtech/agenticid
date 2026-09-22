import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { readAgent, readAgentWallets, readProvider } from "@/lib/agent-data";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: { address: string } }) {
  if (!ethers.isAddress(params.address)) return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  const provider = readProvider();
  try {
    const wallets = await readAgentWallets(provider);
    if (!wallets.some(wallet => wallet.toLowerCase() === params.address.toLowerCase())) {
      return NextResponse.json({ error: "No agent is registered to this wallet." }, { status: 404 });
    }
    return NextResponse.json({ agent: await readAgent(provider, params.address) });
  } catch {
    return NextResponse.json({ error: "Could not load this agent. Please try again." }, { status: 503 });
  } finally { provider.destroy(); }
}

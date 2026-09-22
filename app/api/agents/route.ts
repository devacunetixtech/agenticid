import { NextResponse } from "next/server";
import { readDirectory, readProvider } from "@/lib/agent-data";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
export async function GET() {
  const provider = readProvider();
  try {
    return NextResponse.json({ agents: await readDirectory(provider) }, { headers: { "Cache-Control": "public, s-maxage=15" } });
  } catch (error) {
    console.error("[api/agents] Mainnet directory read failed", error);
    return NextResponse.json({ error: "The network is unavailable. Please try again." }, { status: 503 });
  } finally { provider.destroy(); }
}

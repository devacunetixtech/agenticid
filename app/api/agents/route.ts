import { NextResponse } from "next/server";
import { readDirectory, readProvider } from "@/lib/agent-data";

export const dynamic = "force-dynamic";
export async function GET() {
  const provider = readProvider();
  try {
    return NextResponse.json({ agents: await readDirectory(provider) }, { headers: { "Cache-Control": "public, s-maxage=15" } });
  } catch {
    return NextResponse.json({ error: "The network is unavailable. Please try again." }, { status: 503 });
  } finally { provider.destroy(); }
}

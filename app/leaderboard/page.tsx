import Header from "@/components/Header";
import AgentDirectory from "@/components/AgentDirectory";
export const metadata = { title: "Leaderboard | AgenticID" };
export default function LeaderboardPage() { return <main className="page-shell"><Header /><AgentDirectory ranked /></main>; }

import Header from "@/components/Header";
import ActivityFeed from "@/components/ActivityFeed";
export const metadata = { title: "Activity | AgenticID" };
export default function ActivityPage() {
  return <main className="page-shell narrow-shell"><Header /><div className="page-heading"><div><h1>Activity</h1><p className="muted">See registrations, completed-job submissions, and feedback.</p></div></div><ActivityFeed /></main>;
}

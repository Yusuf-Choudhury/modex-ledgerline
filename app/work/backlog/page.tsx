import { getStore } from "@/lib/pm/store";
import { Sprints } from "@/components/work/Sprints";

export default async function BacklogPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project } = await searchParams;
  const s = await getStore();
  return (
    <div className="lw-page">
      <div className="lw-page-head"><div><h1>Backlog</h1><p className="lw-sub">Plan sprints and move work in and out.</p></div></div>
      <Sprints sprints={await s.listSprints()} issues={await s.listIssues(project ? { projectKey: project } : {})} />
    </div>
  );
}

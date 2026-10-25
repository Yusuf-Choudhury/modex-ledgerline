import { getStore } from "@/lib/pm/store";
import { Board } from "@/components/work/Board";

export default async function BoardPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project } = await searchParams;
  const s = await getStore();
  const active = (await s.listSprints()).find((x) => x.state === "active") ?? null;
  const issues = await s.listIssues({ ...(active ? { sprintId: active.id } : {}), ...(project ? { projectKey: project } : {}) });
  const done = issues.filter((i) => i.status === "done").length;
  return (
    <div className="lw-page lw-page-wide">
      <div className="lw-page-head">
        <div>
          <h1>{active ? active.name : "All issues"}</h1>
          {active?.goal ? <p className="lw-sub">{active.goal}</p> : null}
        </div>
        {issues.length ? (
          <div className="lw-progress" title={`${done} of ${issues.length} done`}>
            <div className="lw-progress-bar"><span style={{ width: `${Math.round((done / issues.length) * 100)}%` }} /></div>
            <span className="lw-muted lw-xs">{done} of {issues.length} done</span>
          </div>
        ) : null}
      </div>
      <Board key={project ?? "all"} issues={issues} sprint={active} projectKey={project} />
    </div>
  );
}

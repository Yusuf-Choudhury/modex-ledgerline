import { getStore } from "@/lib/pm/store";
import { guard, json, body, storeError } from "@/lib/pm/api";
import { parseJql, runJql } from "@/lib/pm/jql";
import { issueInput } from "@/lib/pm/validate";
import type { IssueStatus } from "@/lib/pm/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const a = guard(req, "issue:read"); if (a instanceof Response) return a;
  const u = new URL(req.url);
  const sprint = u.searchParams.get("sprint");
  const s = await getStore();
  const jql = u.searchParams.get("jql");
  if (jql) {
    try { return json({ issues: runJql(await s.listIssues(), parseJql(jql), await s.listSprints()) }); }
    catch (e) { return json({ error: "bad_query", message: (e as Error).message }, 400); }
  }
  return json({ issues: await s.listIssues({ sprintId: sprint === null ? undefined : sprint === "backlog" ? null : sprint, status: (u.searchParams.get("status") as IssueStatus) || undefined, q: u.searchParams.get("q") || undefined, projectKey: u.searchParams.get("project") || undefined }) });
}

export async function POST(req: Request) {
  const a = guard(req, "issue:write"); if (a instanceof Response) return a;
  const p = issueInput.safeParse(await body(req));
  if (!p.success) return json({ error: "invalid", issues: p.error.issues }, 400);
  try { return json({ issue: await (await getStore()).createIssue(p.data) }, 201); } catch (e) { return storeError(e); }
}

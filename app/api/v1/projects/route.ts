import { getStore } from "@/lib/pm/store";
import { guard, json, body, storeError } from "@/lib/pm/api";
import { projectInput } from "@/lib/pm/validate";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const a = guard(req, "issue:read"); if (a instanceof Response) return a;
  return json({ projects: await (await getStore()).listProjects() });
}
export async function POST(req: Request) {
  const a = guard(req, "member:manage"); if (a instanceof Response) return a;
  const p = projectInput.safeParse(await body(req));
  if (!p.success) return json({ error: "invalid" }, 400);
  try { return json({ project: await (await getStore()).createProject(p.data) }, 201); } catch (e) { return storeError(e); }
}

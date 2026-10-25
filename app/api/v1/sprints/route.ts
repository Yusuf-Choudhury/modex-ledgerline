import { getStore } from "@/lib/pm/store";
import { guard, json, body } from "@/lib/pm/api";
import { sprintInput } from "@/lib/pm/validate";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const a = guard(req, "issue:read"); if (a instanceof Response) return a;
  return json({ sprints: await (await getStore()).listSprints() });
}
export async function POST(req: Request) {
  const a = guard(req, "sprint:write"); if (a instanceof Response) return a;
  const p = sprintInput.safeParse(await body(req));
  if (!p.success) return json({ error: "invalid" }, 400);
  return json({ sprint: await (await getStore()).createSprint(p.data) }, 201);
}

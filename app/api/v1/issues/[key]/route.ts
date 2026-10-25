import { getStore } from "@/lib/pm/store";
import { guard, json, body } from "@/lib/pm/api";
import { issuePatch } from "@/lib/pm/validate";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ key: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const a = guard(req, "issue:read"); if (a instanceof Response) return a;
  const i = await (await getStore()).getIssue((await params).key);
  return i ? json({ issue: i }) : json({ error: "not_found" }, 404);
}
export async function PATCH(req: Request, { params }: Ctx) {
  const a = guard(req, "issue:write"); if (a instanceof Response) return a;
  const p = issuePatch.safeParse(await body(req));
  if (!p.success) return json({ error: "invalid", issues: p.error.issues }, 400);
  const i = await (await getStore()).updateIssue((await params).key, p.data);
  return i ? json({ issue: i }) : json({ error: "not_found" }, 404);
}
export async function DELETE(req: Request, { params }: Ctx) {
  const a = guard(req, "issue:delete"); if (a instanceof Response) return a;
  return (await (await getStore()).deleteIssue((await params).key)) ? json({ ok: true }) : json({ error: "not_found" }, 404);
}

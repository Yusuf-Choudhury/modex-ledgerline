import { getStore } from "@/lib/pm/store";
import { guard, json, body, storeError } from "@/lib/pm/api";
import { commentInput } from "@/lib/pm/validate";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ key: string }> };
export async function GET(req: Request, { params }: Ctx) {
  const a = guard(req, "issue:read"); if (a instanceof Response) return a;
  return json({ comments: await (await getStore()).listComments((await params).key) });
}
export async function POST(req: Request, { params }: Ctx) {
  const a = guard(req, "issue:write"); if (a instanceof Response) return a;
  const p = commentInput.safeParse(await body(req));
  if (!p.success) return json({ error: "invalid" }, 400);
  try { return json({ comment: await (await getStore()).addComment((await params).key, a.name, p.data.body) }, 201); } catch (e) { return storeError(e); }
}

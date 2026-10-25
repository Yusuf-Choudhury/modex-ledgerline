import { getStore } from "@/lib/pm/store";
import { guard, json, body, storeError } from "@/lib/pm/api";
import { linkInput } from "@/lib/pm/validate";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ key: string }> };
export async function GET(req: Request, { params }: Ctx) {
  const a = guard(req, "issue:read"); if (a instanceof Response) return a;
  return json({ links: await (await getStore()).listLinks((await params).key) });
}
export async function POST(req: Request, { params }: Ctx) {
  const a = guard(req, "issue:write"); if (a instanceof Response) return a;
  const p = linkInput.safeParse(await body(req));
  if (!p.success) return json({ error: "invalid" }, 400);
  try { return json({ link: await (await getStore()).addLink((await params).key, p.data.to, p.data.type) }, 201); } catch (e) { return storeError(e); }
}

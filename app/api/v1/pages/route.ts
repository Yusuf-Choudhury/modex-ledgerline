import { getStore } from "@/lib/pm/store";
import { guard, json, body } from "@/lib/pm/api";
import { pageInput } from "@/lib/pm/validate";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const a = guard(req, "page:read"); if (a instanceof Response) return a;
  return json({ pages: await (await getStore()).listPages(new URL(req.url).searchParams.get("q") || undefined) });
}
export async function POST(req: Request) {
  const a = guard(req, "page:write"); if (a instanceof Response) return a;
  const p = pageInput.safeParse(await body(req));
  if (!p.success) return json({ error: "invalid" }, 400);
  return json({ page: await (await getStore()).upsertPage({ ...p.data, by: a.name }) }, 201);
}

import { getStore } from "@/lib/pm/store";
import { guard, json, body } from "@/lib/pm/api";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ slug: string }> };
export async function GET(req: Request, { params }: Ctx) {
  const a = guard(req, "page:read"); if (a instanceof Response) return a;
  return json({ versions: await (await getStore()).pageVersions((await params).slug) });
}
/** POST { versionId } restores that version (the current text is kept as a new version). */
export async function POST(req: Request, { params }: Ctx) {
  const a = guard(req, "page:write"); if (a instanceof Response) return a;
  const { versionId } = await body(req);
  if (typeof versionId !== "string") return json({ error: "invalid" }, 400);
  const p = await (await getStore()).restoreVersion((await params).slug, versionId, a.name);
  return p ? json({ page: p }) : json({ error: "not_found" }, 404);
}

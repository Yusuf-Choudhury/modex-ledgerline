import { getStore } from "@/lib/pm/store";
import { guard, json } from "@/lib/pm/api";

export const dynamic = "force-dynamic";
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const a = guard(req, "page:read"); if (a instanceof Response) return a;
  const p = await (await getStore()).getPage((await params).slug);
  return p ? json({ page: p }) : json({ error: "not_found" }, 404);
}

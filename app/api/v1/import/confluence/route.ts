import { getStore } from "@/lib/pm/store";
import { guard, json } from "@/lib/pm/api";
import { importConfluenceCsv } from "@/lib/pm/importers";

export const dynamic = "force-dynamic";
const MAX = 5 * 1024 * 1024;

/** POST the raw CSV as the request body (text/csv). */
export async function POST(req: Request) {
  const a = guard(req, "import:run"); if (a instanceof Response) return a;
  const text = await req.text();
  if (!text.trim()) return json({ error: "empty" }, 400);
  if (text.length > MAX) return json({ error: "too_large", maxBytes: MAX }, 413);
  const rows = importConfluenceCsv(text);
  const s = await getStore();
  return json({ imported: { pages: await s.importPages(rows, a.name) } });
}

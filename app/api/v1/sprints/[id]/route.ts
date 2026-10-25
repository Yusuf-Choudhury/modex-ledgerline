import { getStore } from "@/lib/pm/store";
import { guard, json, body } from "@/lib/pm/api";

export const dynamic = "force-dynamic";
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = guard(req, "sprint:write"); if (a instanceof Response) return a;
  const { state } = await body(req);
  if (state !== "planned" && state !== "active" && state !== "closed") return json({ error: "invalid_state" }, 400);
  const s = await (await getStore()).setSprintState((await params).id, state);
  return s ? json({ sprint: s }) : json({ error: "not_found" }, 404);
}

import { NextResponse } from "next/server";
import { resolveActor, type Actor } from "./auth";
import { can, type Action } from "./roles";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export function guard(req: Request, action: Action): Actor | NextResponse {
  const actor = resolveActor(req);
  if (!actor) return json({ error: "unauthorised" }, 401);
  if (!can(actor.role, action)) return json({ error: "forbidden", needs: action }, 403);
  return actor;
}

export async function body(req: Request): Promise<Record<string, unknown>> {
  try { return (await req.json()) as Record<string, unknown>; } catch { return {}; }
}

const USER_ERRORS = new Set(["invalid_project_key", "project_exists", "project_not_found", "parent_not_found", "issue_not_found", "self_link"]);
export function storeError(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  return USER_ERRORS.has(m) ? json({ error: m }, m.endsWith("not_found") ? 404 : 400) : json({ error: "server_error" }, 500);
}

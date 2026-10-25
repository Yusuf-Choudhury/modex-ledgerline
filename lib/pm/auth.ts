import type { Role } from "./types";
import { isRole } from "./roles";

export type Actor = { name: string; role: Role };

/**
 * LEDGERLINE_API_TOKENS="token1=alice:admin;token2=agent-bot:member"
 * If unset (local or demo), every request acts as the owner "local".
 */
export function resolveActor(req: Request): Actor | null {
  const cfg = process.env.LEDGERLINE_API_TOKENS;
  if (!cfg) return { name: "local", role: "owner" };
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  for (const entry of cfg.split(";")) {
    const [t, who] = entry.split("=");
    if (t && who && t.trim() === token) {
      const [name, role] = who.split(":");
      if (isRole(role)) return { name, role };
    }
  }
  return null;
}

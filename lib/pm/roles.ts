import type { Role } from "./types";

export type Action =
  | "issue:read" | "issue:write" | "issue:delete"
  | "sprint:write" | "page:read" | "page:write"
  | "import:run" | "member:manage" | "workspace:delete";

const rank: Record<Role, number> = { viewer: 0, member: 1, admin: 2, owner: 3 };
const needs: Record<Action, Role> = {
  "issue:read": "viewer",
  "page:read": "viewer",
  "issue:write": "member",
  "page:write": "member",
  "sprint:write": "member",
  "issue:delete": "admin",
  "import:run": "admin",
  "member:manage": "admin",
  "workspace:delete": "owner",
};

export function can(role: Role, action: Action): boolean {
  return rank[role] >= rank[needs[action]];
}

export function isRole(x: unknown): x is Role {
  return x === "owner" || x === "admin" || x === "member" || x === "viewer";
}

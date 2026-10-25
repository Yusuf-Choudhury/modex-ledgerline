import type { Issue, Sprint } from "./types";

/**
 * JQL-lite. Examples:
 *   project = LL AND status != done ORDER BY priority DESC
 *   assignee = amy AND labels = auth
 *   text ~ "login" AND type in (bug, story)
 *   sprint = "Sprint 1"   |   sprint is empty   |   parent = LL-4
 */
export type Clause = { field: string; op: "=" | "!=" | "~" | "in" | "not in" | "is empty" | "is not empty"; values: string[] };
export type Query = { clauses: Clause[]; order: { field: string; dir: "asc" | "desc" } | null };

const FIELDS = new Set(["project", "status", "type", "priority", "assignee", "sprint", "labels", "label", "parent", "text", "key"]);

function tokenize(s: string): string[] {
  const out: string[] = [];
  const re = /\s*("([^"]*)"|'([^']*)'|!=|=|~|\(|\)|,|[^\s=!~(),"']+)/y;
  let pos = 0;
  const src = s.trimEnd();
  while (pos < src.length) {
    re.lastIndex = pos;
    const m = re.exec(src);
    if (!m) throw new Error(`Could not read "${src.slice(pos).trim()}"`);
    out.push(m[2] !== undefined ? `\u0000${m[2]}` : m[3] !== undefined ? `\u0000${m[3]}` : m[1]);
    pos = re.lastIndex;
  }
  return out;
}
const val = (t: string) => (t.startsWith("\u0000") ? t.slice(1) : t);
const kw = (t: string | undefined, w: string) => t !== undefined && !t.startsWith("\u0000") && t.toLowerCase() === w;

export function parseJql(input: string): Query {
  const t = tokenize(input.trim());
  const clauses: Clause[] = [];
  let order: Query["order"] = null;
  let i = 0;
  while (i < t.length) {
    if (kw(t[i], "order") && kw(t[i + 1], "by")) {
      const field = (t[i + 2] || "").toLowerCase();
      if (!field) throw new Error("ORDER BY needs a field");
      const dir = kw(t[i + 3], "desc") ? "desc" : "asc";
      order = { field, dir };
      i += kw(t[i + 3], "desc") || kw(t[i + 3], "asc") ? 4 : 3;
      continue;
    }
    const field = (t[i++] || "").toLowerCase();
    if (!FIELDS.has(field)) throw new Error(`Unknown field "${field}". Try: ${[...FIELDS].join(", ")}`);
    let op: Clause["op"];
    let values: string[] = [];
    if (kw(t[i], "is")) {
      if (kw(t[i + 1], "not") && kw(t[i + 2], "empty")) { op = "is not empty"; i += 3; }
      else if (kw(t[i + 1], "empty")) { op = "is empty"; i += 2; }
      else throw new Error("Use IS EMPTY or IS NOT EMPTY");
    } else if (kw(t[i], "in") || (kw(t[i], "not") && kw(t[i + 1], "in"))) {
      op = kw(t[i], "not") ? "not in" : "in";
      i += op === "in" ? 1 : 2;
      if (t[i++] !== "(") throw new Error("IN needs a list in brackets");
      while (i < t.length && t[i] !== ")") { if (t[i] !== ",") values.push(val(t[i])); i++; }
      if (t[i++] !== ")") throw new Error("Missing )");
    } else {
      const o = t[i++];
      if (o !== "=" && o !== "!=" && o !== "~") throw new Error(`Expected =, !=, ~, IN or IS after ${field}`);
      op = o;
      if (t[i] === undefined) throw new Error(`Missing value for ${field}`);
      values = [val(t[i++])];
    }
    clauses.push({ field, op, values });
    if (i < t.length) {
      if (kw(t[i], "and")) i++;
      else if (!kw(t[i], "order")) throw new Error("Join conditions with AND");
    }
  }
  return { clauses, order };
}

function fieldValues(i: Issue, f: string, sprints: Map<string, string>): string[] {
  switch (f) {
    case "project": return [i.projectKey];
    case "status": return [i.status, i.status.replace("_", " ")];
    case "type": return [i.type];
    case "priority": return [i.priority];
    case "assignee": return i.assignee ? [i.assignee] : [];
    case "sprint": return i.sprintId ? [sprints.get(i.sprintId) ?? i.sprintId] : [];
    case "labels": case "label": return i.labels;
    case "parent": return i.parentKey ? [i.parentKey] : [];
    case "key": return [i.key];
    case "text": return [`${i.key} ${i.title} ${i.description}`];
    default: return [];
  }
}

const PRI = { low: 0, medium: 1, high: 2, urgent: 3 } as const;
const STA = { todo: 0, in_progress: 1, in_review: 2, done: 3 } as const;

export function runJql(issues: Issue[], q: Query, sprintList: Sprint[] = []): Issue[] {
  const sprints = new Map(sprintList.map((s) => [s.id, s.name]));
  const eq = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const out = issues.filter((i) =>
    q.clauses.every((c) => {
      const vs = fieldValues(i, c.field, sprints);
      switch (c.op) {
        case "=": return vs.some((v) => eq(v, c.values[0]));
        case "!=": return !vs.some((v) => eq(v, c.values[0]));
        case "~": return vs.some((v) => v.toLowerCase().includes(c.values[0].toLowerCase()));
        case "in": return vs.some((v) => c.values.some((x) => eq(v, x)));
        case "not in": return !vs.some((v) => c.values.some((x) => eq(v, x)));
        case "is empty": return vs.length === 0;
        case "is not empty": return vs.length > 0;
      }
    }),
  );
  if (q.order) {
    const { field, dir } = q.order;
    const key = (i: Issue): string | number =>
      field === "priority" ? PRI[i.priority] : field === "status" ? STA[i.status] : field === "created" ? i.createdAt : field === "updated" ? i.updatedAt : field === "key" ? Number(i.key.split("-")[1]) : String(fieldValues(i, field, sprints)[0] ?? "");
    out.sort((a, b) => { const x = key(a), y = key(b); return (x < y ? -1 : x > y ? 1 : 0) * (dir === "desc" ? -1 : 1); });
  }
  return out;
}

import { randomUUID } from "node:crypto";
import type { Comment, Issue, IssueLink, IssueStatus, LinkType, Page, PageVersion, Project, Sprint, SprintState } from "./types";
import type { ImportedIssue, ImportedPage } from "./importers";
import { slugify } from "./importers";

export type NewIssue = Partial<Omit<Issue, "id" | "key" | "createdAt" | "updatedAt">> & { title: string };
export type IssueFilter = { sprintId?: string | null; status?: IssueStatus; q?: string; projectKey?: string; parentKey?: string };
export type PageInput = { slug?: string; title: string; body: string; parentSlug?: string | null; by: string };

export interface Store {
  mode: "postgres" | "demo";
  listProjects(): Promise<Project[]>;
  createProject(p: { key: string; name: string; description?: string }): Promise<Project>;
  listIssues(f?: IssueFilter): Promise<Issue[]>;
  getIssue(idOrKey: string): Promise<Issue | null>;
  createIssue(i: NewIssue): Promise<Issue>;
  updateIssue(idOrKey: string, patch: Partial<Issue>): Promise<Issue | null>;
  deleteIssue(idOrKey: string): Promise<boolean>;
  listComments(issueKey: string): Promise<Comment[]>;
  addComment(issueKey: string, author: string, body: string): Promise<Comment>;
  listLinks(issueKey: string): Promise<IssueLink[]>;
  addLink(from: string, to: string, type: LinkType): Promise<IssueLink>;
  listSprints(): Promise<Sprint[]>;
  createSprint(s: { name: string; goal?: string; startsOn?: string | null; endsOn?: string | null }): Promise<Sprint>;
  setSprintState(id: string, state: SprintState): Promise<Sprint | null>;
  listPages(q?: string): Promise<Page[]>;
  getPage(slug: string): Promise<Page | null>;
  upsertPage(p: PageInput): Promise<Page>;
  pageVersions(slug: string): Promise<PageVersion[]>;
  restoreVersion(slug: string, versionId: string, by: string): Promise<Page | null>;
  importIssues(rows: ImportedIssue[], projectKey?: string): Promise<{ issues: number; sprints: number }>;
  importPages(rows: ImportedPage[], by: string): Promise<number>;
}

const now = () => new Date().toISOString();
export const DEFAULT_PROJECT = process.env.LEDGERLINE_KEY_PREFIX || "LL";
const projectKeyOk = (k: string) => /^[A-Z][A-Z0-9]{1,9}$/.test(k);

class MemoryStore implements Store {
  mode = "demo" as const;
  projects: Project[] = [];
  seqs = new Map<string, number>();
  issues: Issue[] = [];
  comments: Comment[] = [];
  links: IssueLink[] = [];
  sprints: Sprint[] = [];
  pages: Page[] = [];
  versions: PageVersion[] = [];
  constructor(seed = true) {
    this.projects.push({ key: DEFAULT_PROJECT, name: "Ledgerline", description: "Default project" });
    if (!seed) return;
    const s: Sprint = { id: randomUUID(), name: "Sprint 1", goal: "Public alpha", state: "active", startsOn: null, endsOn: null };
    this.sprints.push(s);
    const demo: [string, IssueStatus, Issue["type"]][] = [
      ["Import issues from Jira CSV", "done", "story"],
      ["Kanban board with drag between columns", "in_review", "story"],
      ["MCP server for agents", "in_progress", "task"],
      ["Docker self-host in one command", "todo", "task"],
      ["Wiki page links in issue descriptions", "todo", "bug"],
    ];
    for (const [title, status, type] of demo) void this.createIssue({ title, status, type, sprintId: s.id });
    void this.createIssue({ title: "Write the docker compose file", parentKey: `${DEFAULT_PROJECT}-4`, sprintId: s.id });
    void this.addLink(`${DEFAULT_PROJECT}-4`, `${DEFAULT_PROJECT}-3`, "blocks");
    void this.addComment(`${DEFAULT_PROJECT}-3`, "demo", "Tools list is done. Next: write_page.");
    void this.upsertPage({ title: "Welcome to Ledgerline", body: "# Welcome\n\nThis is **demo data**. It resets when the server restarts.\n\n- Use the board for issues\n- Plan in the backlog\n- Write docs here, and mention issues like LL-3", by: "demo" });
    void this.upsertPage({ title: "Self-host guide", body: "## Run it\n\n`docker compose up`, then open /work/board.", parentSlug: "welcome-to-ledgerline", by: "demo" });
  }
  private find(k: string) { return this.issues.find((i) => i.id === k || i.key.toLowerCase() === k.toLowerCase()); }
  async listProjects() { return this.projects; }
  async createProject(p: { key: string; name: string; description?: string }) {
    const key = p.key.toUpperCase();
    if (!projectKeyOk(key)) throw new Error("invalid_project_key");
    if (this.projects.some((x) => x.key === key)) throw new Error("project_exists");
    const pr = { key, name: p.name, description: p.description ?? "" };
    this.projects.push(pr);
    return pr;
  }
  async listIssues(f: IssueFilter = {}) {
    return this.issues.filter(
      (i) =>
        (f.sprintId === undefined || i.sprintId === f.sprintId) &&
        (!f.status || i.status === f.status) &&
        (!f.projectKey || i.projectKey === f.projectKey) &&
        (!f.parentKey || i.parentKey === f.parentKey) &&
        (!f.q || (i.key + " " + i.title + " " + i.description).toLowerCase().includes(f.q.toLowerCase())),
    );
  }
  async getIssue(k: string) { return this.find(k) ?? null; }
  async createIssue(n: NewIssue) {
    const parent = n.parentKey ? this.find(n.parentKey) : null;
    if (n.parentKey && !parent) throw new Error("parent_not_found");
    const pk = parent?.projectKey ?? n.projectKey ?? DEFAULT_PROJECT;
    if (!this.projects.some((p) => p.key === pk)) throw new Error("project_not_found");
    const seq = (this.seqs.get(pk) ?? 0) + 1;
    this.seqs.set(pk, seq);
    const t = now();
    const i: Issue = {
      id: randomUUID(), projectKey: pk, parentKey: parent?.key ?? null, key: `${pk}-${seq}`, title: n.title, description: n.description ?? "",
      type: n.type ?? "task", status: n.status ?? "todo", priority: n.priority ?? "medium",
      assignee: n.assignee ?? null, sprintId: n.sprintId ?? null, labels: n.labels ?? [], createdAt: t, updatedAt: t,
    };
    this.issues.push(i);
    return i;
  }
  async updateIssue(k: string, p: Partial<Issue>) {
    const i = this.find(k);
    if (!i) return null;
    const { title, description, type, status, priority, assignee, sprintId, labels } = p;
    const patch = Object.fromEntries(Object.entries({ title, description, type, status, priority, assignee, sprintId, labels }).filter(([, v]) => v !== undefined));
    Object.assign(i, patch, { updatedAt: now() });
    return i;
  }
  async deleteIssue(k: string) {
    const i = this.find(k);
    if (!i) return false;
    this.issues = this.issues.filter((x) => x !== i && x.parentKey !== i.key);
    this.links = this.links.filter((l) => l.from !== i.key && l.to !== i.key);
    this.comments = this.comments.filter((c) => c.issueKey !== i.key);
    return true;
  }
  async listComments(k: string) { return this.comments.filter((c) => c.issueKey.toLowerCase() === k.toLowerCase()); }
  async addComment(k: string, author: string, body: string) {
    const i = this.find(k);
    if (!i) throw new Error("issue_not_found");
    const c = { id: randomUUID(), issueKey: i.key, author, body, createdAt: now() };
    this.comments.push(c);
    return c;
  }
  async listLinks(k: string) { const K = k.toUpperCase(); return this.links.filter((l) => l.from === K || l.to === K); }
  async addLink(from: string, to: string, type: LinkType) {
    const a = this.find(from), b = this.find(to);
    if (!a || !b) throw new Error("issue_not_found");
    if (a.key === b.key) throw new Error("self_link");
    const l = { id: randomUUID(), from: a.key, to: b.key, type };
    this.links.push(l);
    return l;
  }
  async listSprints() { return this.sprints; }
  async createSprint(s: { name: string; goal?: string; startsOn?: string | null; endsOn?: string | null }) {
    const sp: Sprint = { id: randomUUID(), name: s.name, goal: s.goal ?? "", state: "planned", startsOn: s.startsOn ?? null, endsOn: s.endsOn ?? null };
    this.sprints.push(sp);
    return sp;
  }
  async setSprintState(id: string, state: SprintState) {
    const s = this.sprints.find((x) => x.id === id);
    if (!s) return null;
    if (state === "active") this.sprints.forEach((x) => { if (x.state === "active") x.state = "closed"; });
    s.state = state;
    if (state === "closed") this.issues.forEach((i) => { if (i.sprintId === id && i.status !== "done") i.sprintId = null; });
    return s;
  }
  async listPages(q?: string) {
    return [...this.pages]
      .filter((p) => !q || (p.title + " " + p.body).toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => a.title.localeCompare(b.title));
  }
  async getPage(slug: string) { return this.pages.find((p) => p.slug === slug) ?? null; }
  async upsertPage(p: PageInput) {
    const slug = p.slug || slugify(p.title);
    const ex = this.pages.find((x) => x.slug === slug);
    if (ex) {
      this.versions.push({ id: randomUUID(), slug, title: ex.title, body: ex.body, savedAt: ex.updatedAt, savedBy: ex.updatedBy });
      Object.assign(ex, { title: p.title, body: p.body, parentSlug: p.parentSlug === undefined ? ex.parentSlug : p.parentSlug, updatedAt: now(), updatedBy: p.by });
      return ex;
    }
    const pg: Page = { id: randomUUID(), slug, title: p.title, body: p.body, parentSlug: p.parentSlug ?? null, updatedAt: now(), updatedBy: p.by };
    this.pages.push(pg);
    return pg;
  }
  async pageVersions(slug: string) { return this.versions.filter((v) => v.slug === slug).reverse(); }
  async restoreVersion(slug: string, id: string, by: string) {
    const v = this.versions.find((x) => x.id === id && x.slug === slug);
    if (!v) return null;
    return this.upsertPage({ slug, title: v.title, body: v.body, by });
  }
  async importIssues(rows: ImportedIssue[], projectKey = DEFAULT_PROJECT) {
    let sprints = 0;
    for (const r of rows) {
      let sprintId: string | null = null;
      if (r.sprintName) {
        let s = this.sprints.find((x) => x.name === r.sprintName);
        if (!s) { s = await this.createSprint({ name: r.sprintName }); sprints++; }
        sprintId = s.id;
      }
      const desc = r.sourceKey ? `${r.description}\n\nImported from Jira ${r.sourceKey}`.trim() : r.description;
      await this.createIssue({ projectKey, title: r.title, description: desc, type: r.type, status: r.status, priority: r.priority, assignee: r.assignee, sprintId, labels: r.labels });
    }
    return { issues: rows.length, sprints };
  }
  async importPages(rows: ImportedPage[], by: string) {
    for (const r of rows) await this.upsertPage({ title: r.title, body: r.body, parentSlug: r.parentTitle ? slugify(r.parentTitle) : null, by });
    return rows.length;
  }
}

type Row = Record<string, unknown>;
type Pool = { query: (sql: string, args?: unknown[]) => Promise<{ rows: Row[] }> };

/** Postgres store (Docker self-host or Supabase). Schema: db/schema.sql. */
export class PgStore implements Store {
  mode = "postgres" as const;
  constructor(private pool: Pool) {}
  private async q(sql: string, args: unknown[] = []): Promise<Row[]> { return (await this.pool.query(sql, args)).rows; }
  private ts = (v: unknown) => new Date(v as string).toISOString();
  private issue = (r: Row): Issue => ({
    id: String(r.id), projectKey: String(r.project_key), parentKey: (r.parent_key as string) ?? null, key: String(r.key), title: String(r.title), description: String(r.description ?? ""),
    type: r.type as Issue["type"], status: r.status as IssueStatus, priority: r.priority as Issue["priority"],
    assignee: (r.assignee as string) ?? null, sprintId: (r.sprint_id as string) ?? null, labels: (r.labels as string[]) ?? [],
    createdAt: this.ts(r.created_at), updatedAt: this.ts(r.updated_at),
  });
  private sprint = (r: Row): Sprint => ({ id: String(r.id), name: String(r.name), goal: String(r.goal ?? ""), state: r.state as SprintState, startsOn: (r.starts_on as string) ?? null, endsOn: (r.ends_on as string) ?? null });
  private page = (r: Row): Page => ({ id: String(r.id), slug: String(r.slug), title: String(r.title), body: String(r.body), parentSlug: (r.parent_slug as string) ?? null, updatedAt: this.ts(r.updated_at), updatedBy: String(r.updated_by) });

  async listProjects() { return (await this.q(`select * from ll_projects order by key`)).map((r) => ({ key: String(r.key), name: String(r.name), description: String(r.description ?? "") })); }
  async createProject(p: { key: string; name: string; description?: string }) {
    const key = p.key.toUpperCase();
    if (!projectKeyOk(key)) throw new Error("invalid_project_key");
    if ((await this.q(`select 1 from ll_projects where key=$1`, [key])).length) throw new Error("project_exists");
    await this.q(`insert into ll_projects (key, name, description) values ($1,$2,$3)`, [key, p.name, p.description ?? ""]);
    return { key, name: p.name, description: p.description ?? "" };
  }
  async listIssues(f: IssueFilter = {}) {
    const w: string[] = []; const a: unknown[] = [];
    const add = (sql: string, v: unknown) => { a.push(v); w.push(sql.replace("?", `$${a.length}`)); };
    if (f.sprintId !== undefined) { if (f.sprintId === null) w.push("sprint_id is null"); else add("sprint_id = ?", f.sprintId); }
    if (f.status) add("status = ?", f.status);
    if (f.projectKey) add("project_key = ?", f.projectKey);
    if (f.parentKey) add("parent_key = ?", f.parentKey);
    if (f.q) add("(key || ' ' || title || ' ' || description) ilike ?", `%${f.q}%`);
    return (await this.q(`select * from ll_issues ${w.length ? "where " + w.join(" and ") : ""} order by created_at, key`, a)).map(this.issue);
  }
  async getIssue(k: string) {
    const r = await this.q(`select * from ll_issues where id::text = $1 or lower(key) = lower($1)`, [k]);
    return r[0] ? this.issue(r[0]) : null;
  }
  async createIssue(n: NewIssue) {
    const parent = n.parentKey ? await this.getIssue(n.parentKey) : null;
    if (n.parentKey && !parent) throw new Error("parent_not_found");
    const pk = parent?.projectKey ?? n.projectKey ?? DEFAULT_PROJECT;
    const seq = await this.q(`update ll_projects set next_seq = next_seq + 1 where key=$1 returning next_seq`, [pk]);
    if (!seq[0]) throw new Error("project_not_found");
    const r = await this.q(
      `insert into ll_issues (project_key, parent_key, key, title, description, type, status, priority, assignee, sprint_id, labels)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *`,
      [pk, parent?.key ?? null, `${pk}-${seq[0].next_seq}`, n.title, n.description ?? "", n.type ?? "task", n.status ?? "todo", n.priority ?? "medium", n.assignee ?? null, n.sprintId ?? null, n.labels ?? []],
    );
    return this.issue(r[0]);
  }
  async updateIssue(k: string, p: Partial<Issue>) {
    const cur = await this.getIssue(k);
    if (!cur) return null;
    const m = { ...cur, ...Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)) } as Issue;
    const r = await this.q(
      `update ll_issues set title=$2, description=$3, type=$4, status=$5, priority=$6, assignee=$7, sprint_id=$8, labels=$9, updated_at=now() where id=$1 returning *`,
      [cur.id, m.title, m.description, m.type, m.status, m.priority, m.assignee, m.sprintId, m.labels],
    );
    return this.issue(r[0]);
  }
  async deleteIssue(k: string) {
    const cur = await this.getIssue(k);
    if (!cur) return false;
    await this.q(`delete from ll_issues where id=$1 or parent_key=$2`, [cur.id, cur.key]);
    return true;
  }
  async listComments(k: string) {
    return (await this.q(`select * from ll_comments where lower(issue_key)=lower($1) order by created_at`, [k])).map((r) => ({ id: String(r.id), issueKey: String(r.issue_key), author: String(r.author), body: String(r.body), createdAt: this.ts(r.created_at) }));
  }
  async addComment(k: string, author: string, body: string) {
    const i = await this.getIssue(k);
    if (!i) throw new Error("issue_not_found");
    const r = (await this.q(`insert into ll_comments (issue_key, author, body) values ($1,$2,$3) returning *`, [i.key, author, body]))[0];
    return { id: String(r.id), issueKey: i.key, author, body, createdAt: this.ts(r.created_at) };
  }
  async listLinks(k: string) {
    return (await this.q(`select * from ll_links where from_key=upper($1) or to_key=upper($1)`, [k])).map((r) => ({ id: String(r.id), from: String(r.from_key), to: String(r.to_key), type: r.type as LinkType }));
  }
  async addLink(from: string, to: string, type: LinkType) {
    const a = await this.getIssue(from), b = await this.getIssue(to);
    if (!a || !b) throw new Error("issue_not_found");
    if (a.key === b.key) throw new Error("self_link");
    const r = (await this.q(`insert into ll_links (from_key, to_key, type) values ($1,$2,$3) returning id`, [a.key, b.key, type]))[0];
    return { id: String(r.id), from: a.key, to: b.key, type };
  }
  async listSprints() { return (await this.q(`select * from ll_sprints order by created_at`)).map(this.sprint); }
  async createSprint(s: { name: string; goal?: string; startsOn?: string | null; endsOn?: string | null }) {
    return this.sprint((await this.q(`insert into ll_sprints (name, goal, starts_on, ends_on) values ($1,$2,$3,$4) returning *`, [s.name, s.goal ?? "", s.startsOn ?? null, s.endsOn ?? null]))[0]);
  }
  async setSprintState(id: string, state: SprintState) {
    if (state === "active") await this.q(`update ll_sprints set state='closed' where state='active'`);
    const r = await this.q(`update ll_sprints set state=$2 where id=$1 returning *`, [id, state]);
    if (state === "closed") await this.q(`update ll_issues set sprint_id=null where sprint_id=$1 and status <> 'done'`, [id]);
    return r[0] ? this.sprint(r[0]) : null;
  }
  async listPages(q?: string) {
    return (q ? await this.q(`select * from ll_pages where (title || ' ' || body) ilike $1 order by title`, [`%${q}%`]) : await this.q(`select * from ll_pages order by title`)).map(this.page);
  }
  async getPage(slug: string) { const r = await this.q(`select * from ll_pages where slug=$1`, [slug]); return r[0] ? this.page(r[0]) : null; }
  async upsertPage(p: PageInput) {
    const slug = p.slug || slugify(p.title);
    const ex = await this.getPage(slug);
    if (ex) await this.q(`insert into ll_page_versions (slug, title, body, saved_at, saved_by) values ($1,$2,$3,$4,$5)`, [slug, ex.title, ex.body, ex.updatedAt, ex.updatedBy]);
    const r = await this.q(
      `insert into ll_pages (slug, title, body, parent_slug, updated_by) values ($1,$2,$3,$4,$5)
       on conflict (slug) do update set title=excluded.title, body=excluded.body, parent_slug=case when $6 then excluded.parent_slug else ll_pages.parent_slug end, updated_by=excluded.updated_by, updated_at=now() returning *`,
      [slug, p.title, p.body, p.parentSlug ?? null, p.by, p.parentSlug !== undefined],
    );
    return this.page(r[0]);
  }
  async pageVersions(slug: string) {
    return (await this.q(`select * from ll_page_versions where slug=$1 order by id desc`, [slug])).map((r) => ({ id: String(r.id), slug, title: String(r.title), body: String(r.body), savedAt: this.ts(r.saved_at), savedBy: String(r.saved_by) }));
  }
  async restoreVersion(slug: string, id: string, by: string) {
    const v = (await this.q(`select * from ll_page_versions where slug=$1 and id::text=$2`, [slug, id]))[0];
    if (!v) return null;
    return this.upsertPage({ slug, title: String(v.title), body: String(v.body), by });
  }
  async importIssues(rows: ImportedIssue[], projectKey = DEFAULT_PROJECT) {
    let sprints = 0;
    const names = new Map((await this.listSprints()).map((s) => [s.name, s.id]));
    for (const r of rows) {
      let sprintId: string | null = null;
      if (r.sprintName) {
        if (!names.has(r.sprintName)) { names.set(r.sprintName, (await this.createSprint({ name: r.sprintName })).id); sprints++; }
        sprintId = names.get(r.sprintName)!;
      }
      const desc = r.sourceKey ? `${r.description}\n\nImported from Jira ${r.sourceKey}`.trim() : r.description;
      await this.createIssue({ projectKey, title: r.title, description: desc, type: r.type, status: r.status, priority: r.priority, assignee: r.assignee, sprintId, labels: r.labels });
    }
    return { issues: rows.length, sprints };
  }
  async importPages(rows: ImportedPage[], by: string) {
    for (const r of rows) await this.upsertPage({ title: r.title, body: r.body, parentSlug: r.parentTitle ? slugify(r.parentTitle) : null, by });
    return rows.length;
  }
}

const g = globalThis as unknown as { __llStore?: Store };

export async function getStore(): Promise<Store> {
  if (g.__llStore) return g.__llStore;
  const url = process.env.LEDGERLINE_DATABASE_URL;
  if (url) {
    const { Pool } = await import("pg");
    g.__llStore = new PgStore(new Pool({ connectionString: url }) as unknown as Pool);
  } else {
    g.__llStore = new MemoryStore(true);
  }
  return g.__llStore;
}

export function newMemoryStore(seed = false): Store { return new MemoryStore(seed); }

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { parseJql, runJql } from "../lib/pm/jql";
import { renderMarkdown } from "../lib/pm/markdown";
import { newMemoryStore, PgStore, type Store } from "../lib/pm/store";

async function scenario(s: Store) {
  await s.createProject({ key: "web", name: "Website" });
  await assert.rejects(s.createProject({ key: "WEB", name: "dupe" }), /project_exists/);
  const a = await s.createIssue({ title: "Login fails on Safari", projectKey: "WEB", type: "bug", priority: "urgent", labels: ["auth"] });
  assert.equal(a.key, "WEB-1");
  const b = await s.createIssue({ title: "Docs", priority: "low" });
  assert.equal(b.key, "LL-1");
  const sub = await s.createIssue({ title: "Repro steps", parentKey: "web-1" });
  assert.equal(sub.key, "WEB-2");
  assert.equal(sub.parentKey, "WEB-1");
  assert.deepEqual((await s.listIssues({ parentKey: "WEB-1" })).map((i) => i.key), ["WEB-2"]);
  await assert.rejects(s.createIssue({ title: "x", projectKey: "NOPE" }), /project_not_found/);
  await s.addComment("WEB-1", "amy", "Seen on iOS too");
  assert.equal((await s.listComments("web-1"))[0].body, "Seen on iOS too");
  await s.addLink("WEB-1", "LL-1", "blocks");
  await assert.rejects(s.addLink("WEB-1", "WEB-1", "relates"), /self_link/);
  assert.equal((await s.listLinks("LL-1"))[0].from, "WEB-1");
  const all = await s.listIssues();
  assert.deepEqual(runJql(all, parseJql("project = WEB AND parent is empty"), []).map((i) => i.key), ["WEB-1"]);
  assert.deepEqual(runJql(all, parseJql("ORDER BY priority DESC"), []).map((i) => i.key)[0], "WEB-1");
  await s.upsertPage({ title: "Runbook", body: "v1", by: "a" });
  await s.upsertPage({ title: "Child", body: "c", parentSlug: "runbook", by: "a" });
  await s.upsertPage({ slug: "runbook", title: "Runbook", body: "v2", by: "b" });
  const vs = await s.pageVersions("runbook");
  assert.equal(vs.length, 1);
  assert.equal(vs[0].body, "v1");
  await s.restoreVersion("runbook", vs[0].id, "c");
  assert.equal((await s.getPage("runbook"))?.body, "v1");
  assert.equal((await s.getPage("child"))?.parentSlug, "runbook");
  assert.equal((await s.listPages("v1")).length, 1);
  assert.equal(await s.deleteIssue("WEB-1"), true);
  assert.equal(await s.getIssue("WEB-2"), null, "subtasks deleted with parent");
}

test("memory store: projects, subtasks, comments, links, versions", async () => { await scenario(newMemoryStore(false)); });

test("postgres store (PGlite) passes the same scenario against db/schema.sql", async () => {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite();
  await db.exec(fs.readFileSync("db/schema.sql", "utf8").replace(/create extension[^;]*;/, ""));
  await scenario(new PgStore({ query: (sql, args) => db.query(sql, args) as Promise<{ rows: Record<string, unknown>[] }> }));
});

test("jql parsing and errors", () => {
  const q = parseJql('type in (bug, story) AND text ~ "safari" AND assignee != bob ORDER BY created DESC');
  assert.equal(q.clauses.length, 3);
  assert.deepEqual(q.clauses[0], { field: "type", op: "in", values: ["bug", "story"] });
  assert.deepEqual(q.order, { field: "created", dir: "desc" });
  assert.throws(() => parseJql("colour = red"), /Unknown field/);
  assert.throws(() => parseJql("status done"), /Expected/);
  assert.throws(() => parseJql("status = done OR type = bug"), /AND/);
});

test("markdown is escaped and supports basics", () => {
  const h = renderMarkdown("# Title\n\nHello **bold** <script>x</script> see LL-3\n\n- a\n- b\n\n[x](javascript:alert(1))");
  assert.match(h, /<h2>Title<\/h2>/);
  assert.match(h, /<strong>bold<\/strong>/);
  assert.match(h, /&lt;script&gt;/);
  assert.match(h, /href="\/work\/issue\/LL-3"/);
  assert.match(h, /<ul>\n<li>a<\/li>/);
  assert.doesNotMatch(h, /href="javascript/);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../lib/pm/csv";
import { importJiraCsv, importConfluenceCsv } from "../lib/pm/importers";
import { can } from "../lib/pm/roles";
import { newMemoryStore } from "../lib/pm/store";
import { handle as rawHandle } from "../mcp/server.mjs";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handle = rawHandle as (m: unknown) => Promise<any>;

test("csv handles quotes, commas and newlines", () => {
  assert.deepEqual(parseCsv('a,b\r\n"x, y","line1\nline2"\n"he said ""hi""",z'), [["a", "b"], ["x, y", "line1\nline2"], ['he said "hi"', "z"]]);
});

test("jira csv maps fields, duplicate Sprint and Labels columns", () => {
  const csv = "Summary,Issue key,Issue Type,Status,Priority,Assignee,Description,Sprint,Sprint,Labels,Labels\nLogin fails,ABC-1,Bug,In Progress,Highest,amy,Steps,Sprint 1,Sprint 2,auth,web\nWrite docs,ABC-2,Story,Done,Low,,,,,,\n";
  const rows = importJiraCsv(csv);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { sourceKey: "ABC-1", title: "Login fails", description: "Steps", type: "bug", status: "in_progress", priority: "urgent", assignee: "amy", sprintName: "Sprint 2", labels: ["auth", "web"] });
  assert.equal(rows[1].status, "done");
  assert.equal(rows[1].sprintName, null);
});

test("confluence csv maps title, body, parent", () => {
  const rows = importConfluenceCsv("Title,Body,Parent\nHome,Welcome,\nSetup,Install steps,Home\n");
  assert.deepEqual(rows[1], { title: "Setup", body: "Install steps", parentTitle: "Home" });
});

test("roles", () => {
  assert.equal(can("viewer", "issue:read"), true);
  assert.equal(can("viewer", "issue:write"), false);
  assert.equal(can("member", "issue:delete"), false);
  assert.equal(can("admin", "import:run"), true);
  assert.equal(can("admin", "workspace:delete"), false);
  assert.equal(can("owner", "workspace:delete"), true);
});

test("store: sprint lifecycle and import", async () => {
  const s = newMemoryStore(false);
  const sp = await s.createSprint({ name: "S1" });
  await s.setSprintState(sp.id, "active");
  const a = await s.createIssue({ title: "A", sprintId: sp.id });
  await s.createIssue({ title: "B", sprintId: sp.id, status: "done" });
  assert.equal(a.key, "LL-1");
  await s.setSprintState(sp.id, "closed");
  assert.equal((await s.getIssue("ll-1"))?.sprintId, null, "unfinished work returns to backlog");
  assert.equal((await s.getIssue("LL-2"))?.sprintId, sp.id);
  const r = await s.importIssues(importJiraCsv("Summary,Sprint\nX,Sprint 9\nY,Sprint 9\n"));
  assert.deepEqual(r, { issues: 2, sprints: 1 });
  await s.importPages(importConfluenceCsv("Title,Body\nRunbook,Restart the app\n"), "t");
  assert.equal((await s.getPage("runbook"))?.body, "Restart the app");
});

test("mcp server lists tools and rejects unknown ones", async () => {
  const init = await handle({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
  assert.equal(init.result.serverInfo.name, "ledgerline");
  const list = await handle({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  assert.ok(list.result.tools.some((t: { name: string }) => t.name === "create_issue"));
  const bad = await handle({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "nope" } });
  assert.equal(bad.error.code, -32602);
});

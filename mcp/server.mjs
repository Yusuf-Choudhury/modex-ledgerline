#!/usr/bin/env node
// Ledgerline MCP server (stdio, JSON-RPC 2.0, no dependencies).
// Env: LEDGERLINE_URL (default http://localhost:3000), LEDGERLINE_TOKEN (optional Bearer token).
// Every call goes through the HTTP API, so roles and limits apply to agents exactly as to people.
import readline from "node:readline";

const BASE = (process.env.LEDGERLINE_URL || "http://localhost:3000").replace(/\/$/, "");
const TOKEN = process.env.LEDGERLINE_TOKEN || "";

async function call(path, method = "GET", body) {
  const r = await fetch(`${BASE}/api/v1${path}`, {
    method,
    headers: { "content-type": "application/json", ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Ledgerline ${r.status}: ${text}`);
  return JSON.parse(text);
}

const str = { type: "string" };
export const tools = [
  { name: "list_issues", description: "List issues. Optional sprint id ('backlog' for none), status, or text query.", inputSchema: { type: "object", properties: { sprint: str, status: { type: "string", enum: ["todo", "in_progress", "in_review", "done"] }, q: str } },
    run: (a) => call(`/issues?${new URLSearchParams(Object.entries(a).filter(([, v]) => v))}`) },
  { name: "get_issue", description: "Get one issue by key, e.g. LL-3.", inputSchema: { type: "object", properties: { key: str }, required: ["key"] }, run: (a) => call(`/issues/${encodeURIComponent(a.key)}`) },
  { name: "create_issue", description: "Create an issue.", inputSchema: { type: "object", properties: { title: str, description: str, projectKey: str, parentKey: str, type: { type: "string", enum: ["task", "bug", "story", "epic"] }, priority: { type: "string", enum: ["low", "medium", "high", "urgent"] }, sprintId: str, assignee: str }, required: ["title"] },
    run: (a) => call(`/issues`, "POST", a) },
  { name: "update_issue", description: "Update fields on an issue, e.g. move status.", inputSchema: { type: "object", properties: { key: str, title: str, description: str, status: { type: "string", enum: ["todo", "in_progress", "in_review", "done"] }, assignee: str, sprintId: str }, required: ["key"] },
    run: ({ key, ...rest }) => call(`/issues/${encodeURIComponent(key)}`, "PATCH", rest) },
  { name: "search_issues", description: "Search issues with JQL-lite, e.g. 'project = LL AND status != done ORDER BY priority DESC'.", inputSchema: { type: "object", properties: { jql: str }, required: ["jql"] }, run: (a) => call(`/issues?jql=${encodeURIComponent(a.jql)}`) },
  { name: "add_comment", description: "Comment on an issue.", inputSchema: { type: "object", properties: { key: str, body: str }, required: ["key", "body"] }, run: (a) => call(`/issues/${encodeURIComponent(a.key)}/comments`, "POST", { body: a.body }) },
  { name: "link_issues", description: "Link two issues.", inputSchema: { type: "object", properties: { from: str, to: str, type: { type: "string", enum: ["blocks", "relates", "duplicates"] } }, required: ["from", "to", "type"] }, run: (a) => call(`/issues/${encodeURIComponent(a.from)}/links`, "POST", { to: a.to, type: a.type }) },
  { name: "list_projects", description: "List projects.", inputSchema: { type: "object", properties: {} }, run: () => call(`/projects`) },
  { name: "list_sprints", description: "List sprints.", inputSchema: { type: "object", properties: {} }, run: () => call(`/sprints`) },
  { name: "list_pages", description: "List wiki pages.", inputSchema: { type: "object", properties: {} }, run: () => call(`/pages`) },
  { name: "get_page", description: "Read a wiki page by slug.", inputSchema: { type: "object", properties: { slug: str }, required: ["slug"] }, run: (a) => call(`/pages/${encodeURIComponent(a.slug)}`) },
  { name: "write_page", description: "Create or update a wiki page.", inputSchema: { type: "object", properties: { title: str, body: str, slug: str }, required: ["title", "body"] }, run: (a) => call(`/pages`, "POST", a) },
];

export async function handle(msg) {
  const { id, method, params } = msg;
  const ok = (result) => ({ jsonrpc: "2.0", id, result });
  if (method === "initialize") return ok({ protocolVersion: params?.protocolVersion || "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "ledgerline", version: "0.1.0" } });
  if (method === "notifications/initialized") return null;
  if (method === "ping") return ok({});
  if (method === "tools/list") return ok({ tools: tools.map(({ run: _r, ...t }) => t) });
  if (method === "tools/call") {
    const t = tools.find((x) => x.name === params?.name);
    if (!t) return { jsonrpc: "2.0", id, error: { code: -32602, message: `Unknown tool ${params?.name}` } };
    try {
      const out = await t.run(params.arguments || {});
      return ok({ content: [{ type: "text", text: JSON.stringify(out, null, 2) }] });
    } catch (e) {
      return ok({ content: [{ type: "text", text: String(e.message || e) }], isError: true });
    }
  }
  if (id === undefined) return null;
  return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rl = readline.createInterface({ input: process.stdin });
  rl.on("line", async (line) => {
    if (!line.trim()) return;
    let msg;
    try { msg = JSON.parse(line); } catch { return; }
    const res = await handle(msg);
    if (res) process.stdout.write(JSON.stringify(res) + "\n");
  });
}

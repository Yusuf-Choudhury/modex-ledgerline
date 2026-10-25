import { csvToRecords } from "./csv";
import type { IssueStatus, IssueType, Priority } from "./types";

export type ImportedIssue = {
  sourceKey: string | null;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  priority: Priority;
  assignee: string | null;
  sprintName: string | null;
  labels: string[];
};
export type ImportedPage = { title: string; body: string; parentTitle: string | null };

const first = (r: Record<string, string[]>, ...keys: string[]) => {
  for (const k of keys) if (r[k]?.length) return r[k][0];
  return "";
};

export function mapStatus(s: string): IssueStatus {
  const v = s.toLowerCase();
  if (/(done|closed|resolved|complete)/.test(v)) return "done";
  if (/(review|qa|testing)/.test(v)) return "in_review";
  if (/(progress|doing|started)/.test(v)) return "in_progress";
  return "todo";
}
export function mapType(s: string): IssueType {
  const v = s.toLowerCase();
  if (v.includes("bug")) return "bug";
  if (v.includes("story")) return "story";
  if (v.includes("epic")) return "epic";
  return "task";
}
export function mapPriority(s: string): Priority {
  const v = s.toLowerCase();
  if (/(highest|blocker|critical|urgent)/.test(v)) return "urgent";
  if (v.includes("high")) return "high";
  if (/(low|lowest|trivial|minor)/.test(v)) return "low";
  return "medium";
}

/** Jira "Export CSV (all fields)" columns: Summary, Issue key, Issue Type, Status, Priority, Assignee, Description, Sprint, Labels. */
export function importJiraCsv(text: string): ImportedIssue[] {
  return csvToRecords(text)
    .map((r) => ({
      sourceKey: first(r, "Issue key", "Key") || null,
      title: first(r, "Summary", "Title"),
      description: first(r, "Description"),
      type: mapType(first(r, "Issue Type", "Type")),
      status: mapStatus(first(r, "Status")),
      priority: mapPriority(first(r, "Priority")),
      assignee: first(r, "Assignee") || null,
      sprintName: (r["Sprint"] ?? []).at(-1) ?? null,
      labels: (r["Labels"] ?? []).flatMap((l) => l.split(/\s+/)).filter(Boolean),
    }))
    .filter((i) => i.title);
}

/** Confluence has no native CSV export; this accepts a CSV of Title, Body (or Content), Parent, which most export tools produce. */
export function importConfluenceCsv(text: string): ImportedPage[] {
  return csvToRecords(text)
    .map((r) => ({
      title: first(r, "Title", "title", "Page Title"),
      body: first(r, "Body", "Content", "body", "content"),
      parentTitle: first(r, "Parent", "Parent Title", "parent") || null,
    }))
    .filter((p) => p.title);
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "page";
}

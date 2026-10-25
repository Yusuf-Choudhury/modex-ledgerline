export type IssueStatus = "todo" | "in_progress" | "in_review" | "done";
export const STATUSES: { key: IssueStatus; label: string }[] = [
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "in_review", label: "In review" },
  { key: "done", label: "Done" },
];
export type IssueType = "task" | "bug" | "story" | "epic";
export type Priority = "low" | "medium" | "high" | "urgent";

export type Project = { key: string; name: string; description: string };
export type Comment = { id: string; issueKey: string; author: string; body: string; createdAt: string };
export type LinkType = "blocks" | "relates" | "duplicates";
export type IssueLink = { id: string; from: string; to: string; type: LinkType };
export type PageVersion = { id: string; slug: string; title: string; body: string; savedAt: string; savedBy: string };

export type Issue = {
  id: string;
  projectKey: string;
  parentKey: string | null;
  key: string; // e.g. LL-12
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  priority: Priority;
  assignee: string | null;
  sprintId: string | null;
  labels: string[];
  createdAt: string;
  updatedAt: string;
};

export type SprintState = "planned" | "active" | "closed";
export type Sprint = { id: string; name: string; goal: string; state: SprintState; startsOn: string | null; endsOn: string | null };

export type Page = { id: string; slug: string; title: string; body: string; parentSlug: string | null; updatedAt: string; updatedBy: string };

export type Role = "owner" | "admin" | "member" | "viewer";
export type Member = { email: string; role: Role };

import { z } from "zod";
export const issueInput = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(20000).optional(),
  type: z.enum(["task", "bug", "story", "epic"]).optional(),
  status: z.enum(["todo", "in_progress", "in_review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignee: z.string().max(200).nullable().optional(),
  sprintId: z.string().nullable().optional(),
  labels: z.array(z.string().max(50)).max(20).optional(),
  projectKey: z.string().max(10).optional(),
  parentKey: z.string().max(30).nullable().optional(),
});
export const issuePatch = issueInput.omit({ projectKey: true, parentKey: true }).partial();
export const sprintInput = z.object({ name: z.string().min(1).max(120), goal: z.string().max(500).optional(), startsOn: z.string().nullable().optional(), endsOn: z.string().nullable().optional() });
export const pageInput = z.object({ title: z.string().min(1).max(200), body: z.string().max(100000), slug: z.string().max(80).optional(), parentSlug: z.string().max(80).nullable().optional() });
export const projectInput = z.object({ key: z.string().regex(/^[A-Za-z][A-Za-z0-9]{1,9}$/), name: z.string().min(1).max(100), description: z.string().max(500).optional() });
export const commentInput = z.object({ body: z.string().min(1).max(10000) });
export const linkInput = z.object({ to: z.string().min(1).max(30), type: z.enum(["blocks", "relates", "duplicates"]) });

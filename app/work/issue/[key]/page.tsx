import { notFound } from "next/navigation";
import { getStore } from "@/lib/pm/store";
import { IssueDetail } from "@/components/work/IssueDetail";

export default async function IssuePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const s = await getStore();
  const issue = await s.getIssue(key);
  if (!issue) notFound();
  const [comments, links, subtasks, sprints] = await Promise.all([s.listComments(issue.key), s.listLinks(issue.key), s.listIssues({ parentKey: issue.key }), s.listSprints()]);
  return <IssueDetail key={issue.updatedAt} issue={issue} comments={comments} links={links} subtasks={subtasks} sprints={sprints} />;
}

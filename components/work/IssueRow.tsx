import Link from "next/link";
import type { Issue } from "@/lib/pm/types";
import { Avatar, PriorityIcon, StatusIcon } from "./icons";

export function IssueRow({ i, right }: { i: Issue; right?: React.ReactNode }) {
  return (
    <div className="lw-irow">
      <PriorityIcon priority={i.priority} />
      <span className="lw-key">{i.key}</span>
      <StatusIcon status={i.status} />
      <Link href={`/work/issue/${i.key}`} className="lw-irow-title">{i.title}</Link>
      <span className="lw-irow-pills">{i.labels.slice(0, 2).map((l) => <span key={l} className="lw-pill lw-pill-label">{l}</span>)}</span>
      {right}
      <Avatar name={i.assignee} size={20} />
    </div>
  );
}

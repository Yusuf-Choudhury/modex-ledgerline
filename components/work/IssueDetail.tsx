"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Comment, Issue, IssueLink, Sprint } from "@/lib/pm/types";
import { STATUSES } from "@/lib/pm/types";
import { api } from "./api";
import { Avatar, IconComment, IconLink, IconSub, PriorityIcon, StatusIcon, TypeDot } from "./icons";
import { IssueRow } from "./IssueRow";

const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export function IssueDetail({ issue, comments, links, subtasks, sprints }: { issue: Issue; comments: Comment[]; links: IssueLink[]; subtasks: Issue[]; sprints: Sprint[] }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [sub, setSub] = useState("");
  const [linkTo, setLinkTo] = useState("");
  const [linkType, setLinkType] = useState("relates");
  const [title, setTitle] = useState(issue.title);
  const [desc, setDesc] = useState(issue.description);
  const [saved, setSaved] = useState(false);
  const run = async (fn: () => Promise<unknown>) => { setErr(null); try { await fn(); router.refresh(); setSaved(true); setTimeout(() => setSaved(false), 1200); } catch (e) { setErr(String(e)); } };
  const patch = (b: Partial<Issue>) => run(() => api(`/issues/${issue.key}`, { method: "PATCH", body: JSON.stringify(b) }));
  const done = subtasks.filter((s) => s.status === "done").length;

  return (
    <div className="lw-issue">
      <div className="lw-issue-main">
        <p className="lw-crumb lw-xs">
          <Link href={`/work/board?project=${issue.projectKey}`}>{issue.projectKey}</Link>
          {issue.parentKey ? <> <span>›</span> <Link href={`/work/issue/${issue.parentKey}`}>{issue.parentKey}</Link></> : null}
          <span>›</span> <span>{issue.key}</span>
          {saved ? <span className="lw-saved">Saved</span> : null}
        </p>
        <textarea className="lw-title-input" rows={1} value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => title.trim() && title !== issue.title && patch({ title })} aria-label="Title" />
        <textarea className="lw-desc-input" rows={5} value={desc} placeholder="Add a description…" onChange={(e) => setDesc(e.target.value)} onBlur={() => desc !== issue.description && patch({ description: desc })} aria-label="Description" />

        <section className="lw-block">
          <h2><IconSub />Subtasks {subtasks.length ? <span className="lw-muted">{done}/{subtasks.length}</span> : null}</h2>
          <div className="lw-list lw-list-flush">{subtasks.map((s) => <IssueRow key={s.id} i={s} />)}</div>
          <form className="lw-inline-form" onSubmit={(e) => { e.preventDefault(); if (sub.trim()) run(() => api(`/issues`, { method: "POST", body: JSON.stringify({ title: sub, parentKey: issue.key, sprintId: issue.sprintId }) })).then(() => setSub("")); }}>
            <input value={sub} onChange={(e) => setSub(e.target.value)} placeholder="Add a subtask and press Enter" aria-label="Subtask title" />
          </form>
        </section>

        <section className="lw-block">
          <h2><IconLink />Links</h2>
          {links.map((l) => {
            const other = l.from === issue.key ? l.to : l.from;
            const verb = l.type === "blocks" ? (l.from === issue.key ? "Blocks" : "Blocked by") : l.type === "duplicates" ? (l.from === issue.key ? "Duplicates" : "Duplicated by") : "Relates to";
            return <div key={l.id} className="lw-link-row"><span className={`lw-link-verb ${verb.startsWith("Block") ? "warn" : ""}`}>{verb}</span><Link href={`/work/issue/${other}`} className="lw-key">{other}</Link></div>;
          })}
          <form className="lw-inline-form" onSubmit={(e) => { e.preventDefault(); if (linkTo.trim()) run(() => api(`/issues/${issue.key}/links`, { method: "POST", body: JSON.stringify({ to: linkTo.trim(), type: linkType }) })).then(() => setLinkTo("")); }}>
            <select className="lw-select-quiet" value={linkType} onChange={(e) => setLinkType(e.target.value)} aria-label="Link type"><option value="relates">Relates to</option><option value="blocks">Blocks</option><option value="duplicates">Duplicates</option></select>
            <input value={linkTo} onChange={(e) => setLinkTo(e.target.value)} placeholder="Issue key, e.g. LL-3" aria-label="Link to issue" />
          </form>
        </section>

        <section className="lw-block">
          <h2><IconComment />Activity</h2>
          <ol className="lw-timeline">
            <li><Avatar name="Ledgerline" size={20} /><span className="lw-muted">Issue created</span><span className="lw-muted lw-xs">{ago(issue.createdAt)}</span></li>
            {comments.map((c) => (
              <li key={c.id} className="lw-comment"><Avatar name={c.author} size={20} /><div><p className="lw-xs"><strong>{c.author}</strong> <span className="lw-muted">{ago(c.createdAt)}</span></p><p>{c.body}</p></div></li>
            ))}
          </ol>
          <form className="lw-composer" onSubmit={(e) => { e.preventDefault(); if (comment.trim()) run(() => api(`/issues/${issue.key}/comments`, { method: "POST", body: JSON.stringify({ body: comment }) })).then(() => setComment("")); }}>
            <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Leave a comment…" aria-label="Comment"
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") (e.currentTarget.form as HTMLFormElement).requestSubmit(); }} />
            <div className="lw-composer-foot"><span className="lw-muted lw-xs">Ctrl Enter to send</span><button className="lw-btn lw-btn-primary lw-btn-sm" disabled={!comment.trim()}>Comment</button></div>
          </form>
        </section>
        {err ? <p className="lw-error">{err}</p> : null}
      </div>

      <aside className="lw-props" aria-label="Properties">
        <Prop label="Status" icon={<StatusIcon status={issue.status} />}>
          <select value={issue.status} onChange={(e) => patch({ status: e.target.value as Issue["status"] })} aria-label="Status">{STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
        </Prop>
        <Prop label="Priority" icon={<PriorityIcon priority={issue.priority} />}>
          <select value={issue.priority} onChange={(e) => patch({ priority: e.target.value as Issue["priority"] })} aria-label="Priority">{["urgent", "high", "medium", "low"].map((x) => <option key={x} value={x}>{x[0].toUpperCase() + x.slice(1)}</option>)}</select>
        </Prop>
        <Prop label="Type" icon={<TypeDot type={issue.type} />}>
          <select value={issue.type} onChange={(e) => patch({ type: e.target.value as Issue["type"] })} aria-label="Type">{["task", "bug", "story", "epic"].map((x) => <option key={x} value={x}>{x[0].toUpperCase() + x.slice(1)}</option>)}</select>
        </Prop>
        <Prop label="Assignee" icon={<Avatar name={issue.assignee} size={16} />}>
          <input defaultValue={issue.assignee ?? ""} placeholder="Unassigned" onBlur={(e) => e.target.value !== (issue.assignee ?? "") && patch({ assignee: e.target.value || null })} aria-label="Assignee" />
        </Prop>
        <Prop label="Sprint">
          <select value={issue.sprintId ?? ""} onChange={(e) => patch({ sprintId: e.target.value || null })} aria-label="Sprint"><option value="">Backlog</option>{sprints.filter((s) => s.state !== "closed" || s.id === issue.sprintId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        </Prop>
        <Prop label="Labels">
          <input defaultValue={issue.labels.join(", ")} placeholder="Add labels" onBlur={(e) => patch({ labels: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} aria-label="Labels" />
        </Prop>
        {issue.labels.length ? <div className="lw-prop-pills">{issue.labels.map((l) => <span key={l} className="lw-pill lw-pill-label">{l}</span>)}</div> : null}
        <div className="lw-props-foot lw-xs lw-muted">
          <p>Created {new Date(issue.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
          <p>Updated {ago(issue.updatedAt)}</p>
        </div>
      </aside>
    </div>
  );
}

function Prop({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="lw-prop">
      <span className="lw-prop-label">{label}</span>
      <span className="lw-prop-val">{icon ? <span className="lw-prop-ic">{icon}</span> : null}{children}</span>
    </label>
  );
}

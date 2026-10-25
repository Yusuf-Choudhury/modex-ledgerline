"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Issue, IssueStatus, Sprint } from "@/lib/pm/types";
import { STATUSES } from "@/lib/pm/types";
import { api } from "./api";
import { Avatar, IconPlus, PriorityIcon, StatusIcon, TypeDot } from "./icons";
import { Empty } from "./Empty";

export function Board({ issues: initial, sprint, projectKey }: { issues: Issue[]; sprint: Sprint | null; projectKey?: string }) {
  const [issues, setIssues] = useState(initial);
  const [adding, setAdding] = useState<IssueStatus | null>(null);
  const [title, setTitle] = useState("");
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<IssueStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function move(key: string, status: IssueStatus) {
    const cur = issues.find((i) => i.key === key);
    if (!cur || cur.status === status) return;
    setIssues((xs) => xs.map((i) => (i.key === key ? { ...i, status } : i)));
    try { await api(`/issues/${key}`, { method: "PATCH", body: JSON.stringify({ status }) }); } catch (e) { setErr(String(e)); router.refresh(); }
  }
  async function add(status: IssueStatus) {
    if (!title.trim()) { setAdding(null); return; }
    try {
      const { issue } = await api(`/issues`, { method: "POST", body: JSON.stringify({ title, status, sprintId: sprint?.id ?? null, projectKey }) });
      setIssues((xs) => [...xs, issue]);
      setTitle("");
    } catch (e) { setErr(String(e)); }
  }

  if (!issues.length && adding === null)
    return (
      <Empty title="Nothing on the board yet" body="Create your first issue, or bring your Jira backlog across in one go.">
        <div className="lw-row"><button className="lw-btn lw-btn-primary" onClick={() => setAdding("todo")}><IconPlus />New issue</button><Link className="lw-btn" href="/work/import">Import from Jira</Link></div>
      </Empty>
    );

  return (
    <>
      {err ? <p className="lw-error">{err}</p> : null}
      <div className="lw-board">
        {STATUSES.map((col) => {
          const items = issues.filter((i) => i.status === col.key);
          return (
            <section key={col.key} className={`lw-col ${over === col.key ? "is-over" : ""}`} aria-label={col.label}
              onDragOver={(e) => { e.preventDefault(); setOver(col.key); }} onDragLeave={() => setOver(null)}
              onDrop={() => { if (drag) void move(drag, col.key); setOver(null); setDrag(null); }}>
              <header className="lw-col-head">
                <StatusIcon status={col.key} /><span>{col.label}</span><span className="lw-count">{items.length}</span>
                <button className="lw-icon-btn lw-col-add" aria-label={`Add to ${col.label}`} onClick={() => { setAdding(col.key); setTitle(""); }}><IconPlus /></button>
              </header>
              <div className="lw-col-body">
                {adding === col.key ? (
                  <form className="lw-card lw-card-new" onSubmit={(e) => { e.preventDefault(); void add(col.key); }}>
                    <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => !title && setAdding(null)} onKeyDown={(e) => e.key === "Escape" && setAdding(null)} placeholder="Issue title" aria-label="New issue title" />
                    <p className="lw-hint">Enter to create, Esc to cancel</p>
                  </form>
                ) : null}
                {items.map((i) => (
                  <article key={i.id} className={`lw-card ${drag === i.key ? "is-dragging" : ""}`} draggable
                    onDragStart={(e) => { setDrag(i.key); e.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => { setDrag(null); setOver(null); }}>
                    <div className="lw-card-top">
                      <span className="lw-key">{i.key}</span>
                      {i.assignee ? <Avatar name={i.assignee} size={20} /> : null}
                    </div>
                    <Link href={`/work/issue/${i.key}`} className="lw-card-title">{i.title}</Link>
                    <div className="lw-card-meta">
                      <span className="lw-meta-btn" title={`Priority: ${i.priority}`}><PriorityIcon priority={i.priority} /></span>
                      <span className="lw-pill"><TypeDot type={i.type} />{i.type}</span>
                      {i.parentKey ? <span className="lw-pill lw-pill-ghost">↳ {i.parentKey}</span> : null}
                      {i.labels.slice(0, 2).map((l) => <span key={l} className="lw-pill lw-pill-label">{l}</span>)}
                    </div>
                    <select className="lw-move" aria-label={`Move ${i.key}`} value={i.status} onChange={(e) => void move(i.key, e.target.value as IssueStatus)}>
                      {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </article>
                ))}
                {!items.length && adding !== col.key ? <div className="lw-col-empty">Drop issues here</div> : null}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

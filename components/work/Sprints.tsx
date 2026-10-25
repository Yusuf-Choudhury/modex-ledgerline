"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Issue, Sprint } from "@/lib/pm/types";
import { api } from "./api";
import { IssueRow } from "./IssueRow";
import { Empty } from "./Empty";
import { IconChevron, IconPlus } from "./icons";

export function Sprints({ sprints, issues }: { sprints: Sprint[]; issues: Issue[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState<string | null>(null);
  const run = async (fn: () => Promise<unknown>) => { setErr(null); try { await fn(); router.refresh(); } catch (e) { setErr(String(e)); } };
  const backlog = issues.filter((i) => !i.sprintId);
  const open = sprints.filter((s) => s.state !== "closed");
  const visible = [...sprints].sort((a, b) => ({ active: 0, planned: 1, closed: 2 })[a.state] - ({ active: 0, planned: 1, closed: 2 })[b.state]);

  const Group = ({ id, title, meta, items, actions, defaultClosed }: { id: string; title: React.ReactNode; meta: string; items: Issue[]; actions?: React.ReactNode; defaultClosed?: boolean }) => {
    const isClosed = closed[id] ?? !!defaultClosed;
    return (
      <section className="lw-group">
        <header className="lw-group-head">
          <button className="lw-group-toggle" onClick={() => setClosed({ ...closed, [id]: !isClosed })} aria-expanded={!isClosed}>
            <IconChevron style={{ transform: isClosed ? "rotate(-90deg)" : "none", transition: "transform .15s" }} />{title}
          </button>
          <span className="lw-muted lw-xs">{meta}</span>
          <div className="lw-group-actions">{actions}</div>
        </header>
        {!isClosed ? (
          <div className="lw-group-body">
            {items.map((i) => (
              <IssueRow key={i.id} i={i} right={open.length ? (
                <select className="lw-select-quiet" aria-label={`Move ${i.key} to sprint`} value={i.sprintId ?? ""} onChange={(e) => run(() => api(`/issues/${i.key}`, { method: "PATCH", body: JSON.stringify({ sprintId: e.target.value || null }) }))}>
                  <option value="">Backlog</option>
                  {open.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              ) : null} />
            ))}
            {!items.length ? <p className="lw-group-empty">No issues</p> : null}
          </div>
        ) : null}
      </section>
    );
  };

  return (
    <div className="lw-stack">
      {err ? <p className="lw-error">{err}</p> : null}
      {visible.map((s) => {
        const mine = issues.filter((i) => i.sprintId === s.id);
        return (
          <Group key={s.id} id={s.id} defaultClosed={s.state === "closed"}
            title={<><span className="lw-group-title">{s.name}</span><span className={`lw-state lw-state-${s.state}`}>{s.state}</span></>}
            meta={`${mine.filter((i) => i.status === "done").length} of ${mine.length} done`} items={mine}
            actions={<>
              {s.state === "planned" ? <button className="lw-btn lw-btn-sm" onClick={() => run(() => api(`/sprints/${s.id}`, { method: "PATCH", body: JSON.stringify({ state: "active" }) }))}>Start sprint</button> : null}
              {s.state === "active" ? <button className="lw-btn lw-btn-sm" onClick={() => run(() => api(`/sprints/${s.id}`, { method: "PATCH", body: JSON.stringify({ state: "closed" }) }))}>Complete sprint</button> : null}
            </>} />
        );
      })}
      {backlog.length || sprints.length ? (
        <Group id="backlog" title={<span className="lw-group-title">Backlog</span>} meta={`${backlog.length} issues`} items={backlog}
          actions={creating ? (
            <form className="lw-inline-form" onSubmit={(e) => { e.preventDefault(); if (name.trim()) run(() => api("/sprints", { method: "POST", body: JSON.stringify({ name }) })).then(() => { setName(""); setCreating(false); }); }}>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Sprint name" aria-label="Sprint name" onKeyDown={(e) => e.key === "Escape" && setCreating(false)} />
              <button className="lw-btn lw-btn-sm lw-btn-primary">Create</button>
            </form>
          ) : <button className="lw-btn lw-btn-sm" onClick={() => setCreating(true)}><IconPlus />Create sprint</button>} />
      ) : (
        <Empty art="backlog" title="Your backlog is clear" body="Press Ctrl K and type a title to add your first issue." />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { Issue } from "@/lib/pm/types";
import { IssueRow } from "./IssueRow";
import { Empty } from "./Empty";
import { IconSearch } from "./icons";

const EXAMPLES = ["status != done ORDER BY priority DESC", "type = bug AND priority in (high, urgent)", 'text ~ "docker"', "sprint is empty", "parent is not empty"];

export function Search({ initial }: { initial: string }) {
  const [q, setQ] = useState(initial);
  const [res, setRes] = useState<Issue[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function go(query = q) {
    setErr(null); setLoading(true);
    const r = await fetch(`/api/v1/issues?jql=${encodeURIComponent(query)}`);
    const d = await r.json();
    setLoading(false);
    if (!r.ok) { setErr(d.message || d.error); setRes(null); return; }
    setRes(d.issues);
    history.replaceState(null, "", `?jql=${encodeURIComponent(query)}`);
  }
  useEffect(() => { if (initial) void go(initial); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="lw-stack">
      <form className={`lw-query ${err ? "has-error" : ""}`} onSubmit={(e) => { e.preventDefault(); void go(); }}>
        <IconSearch />
        <input className="lw-mono" value={q} onChange={(e) => setQ(e.target.value)} placeholder="project = LL AND status != done" aria-label="Query" spellCheck={false} />
        <button className="lw-btn lw-btn-primary lw-btn-sm" type="submit">Run</button>
      </form>
      {err ? <p className="lw-error">{err}</p> : null}
      <div className="lw-chips">{EXAMPLES.map((x) => <button key={x} className="lw-chip-btn" onClick={() => { setQ(x); void go(x); }}>{x}</button>)}</div>
      {loading ? <div className="lw-list">{[0, 1, 2, 3].map((i) => <div key={i} className="lw-skel" style={{ height: 40, margin: 6 }} />)}</div> : null}
      {res && !loading ? (
        res.length ? <div className="lw-list"><p className="lw-list-head">{res.length} result{res.length === 1 ? "" : "s"}</p>{res.map((i) => <IssueRow key={i.id} i={i} />)}</div>
          : <Empty art="search" title="No issues match" body="Try a broader query, or one of the examples above." />
      ) : null}
    </div>
  );
}

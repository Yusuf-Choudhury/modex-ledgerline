"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Issue, Project } from "@/lib/pm/types";
import { IconBacklog, IconBoard, IconChevron, IconImport, IconMenu, IconMoon, IconPlus, IconSearch, IconSidebar, IconSun, IconWiki, StatusIcon } from "./icons";

const NAV = [
  { href: "/work/board", label: "Board", icon: IconBoard, key: "B" },
  { href: "/work/backlog", label: "Backlog", icon: IconBacklog, key: "L" },
  { href: "/work/search", label: "Search", icon: IconSearch, key: "S" },
  { href: "/work/wiki", label: "Wiki", icon: IconWiki, key: "W" },
  { href: "/work/import", label: "Import", icon: IconImport, key: "I" },
];

export function Shell({ projects, mode, children }: { projects: Project[]; mode: string; children: React.ReactNode }) {
  const path = usePathname() || "";
  const sp = useSearchParams();
  const router = useRouter();
  const current = sp.get("project");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [ws, setWs] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setCollapsed(localStorage.getItem("ll-collapsed") === "1");
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);
  useEffect(() => setMobileOpen(false), [path]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((v) => !v); }
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") { e.preventDefault(); toggleCollapse(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const toggleCollapse = () => setCollapsed((c) => { localStorage.setItem("ll-collapsed", c ? "0" : "1"); return !c; });
  const toggleTheme = () => {
    const t = theme === "dark" ? "light" : "dark";
    setTheme(t);
    document.documentElement.dataset.theme = t;
    localStorage.setItem("ll-theme", t);
  };
  const active = projects.find((p) => p.key === current);
  const title = NAV.find((n) => path.startsWith(n.href))?.label ?? (path.startsWith("/work/issue") ? "Issue" : "Ledgerline");

  return (
    <div className={`lw ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "is-mobile-open" : ""}`}>
      <aside className="lw-side" aria-label="Sidebar">
        <div className="lw-side-head">
          <button className="lw-ws" onClick={() => setWs((v) => !v)} aria-expanded={ws} aria-haspopup="menu">
            <span className="lw-ws-logo">L</span>
            <span className="lw-ws-name">{active ? active.name : "All projects"}</span>
            <IconChevron className="lw-ws-chev" />
          </button>
          <button className="lw-icon-btn lw-hide-mobile" onClick={toggleCollapse} aria-label="Collapse sidebar" title="Collapse (Ctrl \)"><IconSidebar /></button>
        </div>
        {ws ? (
          <div className="lw-menu" role="menu" onMouseLeave={() => setWs(false)}>
            <p className="lw-menu-label">Workspace</p>
            <button role="menuitem" onClick={() => { setWs(false); router.push(path.split("?")[0]); }}>All projects</button>
            {projects.map((p) => (
              <button role="menuitem" key={p.key} onClick={() => { setWs(false); router.push(`${path.split("?")[0]}?project=${p.key}`); }}>
                <span className="lw-proj-key">{p.key}</span>{p.name}
              </button>
            ))}
          </div>
        ) : null}

        <button className="lw-search-btn" onClick={() => setPalette(true)}>
          <IconSearch /><span className="lw-label">Search or jump to</span><kbd className="lw-label">Ctrl K</kbd>
        </button>

        <nav className="lw-nav">
          {NAV.map((n) => {
            const on = path.startsWith(n.href);
            const Icon = n.icon;
            return (
              <Link key={n.href} href={`${n.href}${current && (n.href.endsWith("board") || n.href.endsWith("backlog")) ? `?project=${current}` : ""}`} className={on ? "on" : ""} title={n.label}>
                <Icon /><span className="lw-label">{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <p className="lw-section lw-label">Projects</p>
        <nav className="lw-nav lw-projects">
          {projects.map((p) => (
            <Link key={p.key} href={`/work/board?project=${p.key}`} className={current === p.key ? "on" : ""} title={p.name}>
              <span className="lw-proj-dot">{p.key.slice(0, 2)}</span><span className="lw-label">{p.name}</span>
            </Link>
          ))}
        </nav>

        <div className="lw-side-foot">
          <button className="lw-icon-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>{theme === "dark" ? <IconSun /> : <IconMoon />}</button>
          <span className="lw-chip lw-label">{mode === "demo" ? "Demo workspace" : "Self-hosted"}</span>
          <Link href="/" className="lw-label lw-foot-link">Site</Link>
        </div>
      </aside>
      <div className="lw-scrim" onClick={() => setMobileOpen(false)} />

      <div className="lw-main">
        <header className="lw-top">
          <button className="lw-icon-btn lw-show-mobile" onClick={() => setMobileOpen(true)} aria-label="Open menu"><IconMenu /></button>
          <div className="lw-crumbs"><span className="lw-muted">{active ? active.key : "Ledgerline"}</span><span className="lw-sep">/</span><span>{title}</span></div>
          <button className="lw-top-search" onClick={() => setPalette(true)}><IconSearch /><span>Search issues and pages</span><kbd>Ctrl K</kbd></button>
          <button className="lw-btn lw-btn-primary" onClick={() => setPalette(true)}><IconPlus /><span className="lw-hide-mobile">New issue</span></button>
        </header>
        <main className="lw-content">{children}</main>
      </div>
      {palette ? <Palette onClose={() => setPalette(false)} projectKey={current ?? undefined} /> : null}
    </div>
  );
}

type Cmd = { id: string; label: string; hint?: string; run: () => void | Promise<void>; icon?: React.ReactNode };

function Palette({ onClose, projectKey }: { onClose: () => void; projectKey?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [idx, setIdx] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => {
    if (!q.trim()) { setIssues([]); return; }
    const t = setTimeout(async () => {
      const r = await fetch(`/api/v1/issues?q=${encodeURIComponent(q)}`);
      if (r.ok) setIssues(((await r.json()).issues as Issue[]).slice(0, 6));
    }, 120);
    return () => clearTimeout(t);
  }, [q]);
  const go = useCallback((href: string) => { onClose(); router.push(href); }, [onClose, router]);
  const cmds: Cmd[] = useMemo(() => {
    const list: Cmd[] = [];
    if (q.trim()) list.push({ id: "create", label: `Create issue "${q.trim()}"`, hint: "Enter", icon: <IconPlus />, run: async () => {
      const r = await fetch("/api/v1/issues", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: q.trim(), projectKey }) });
      if (r.ok) { const { issue } = await r.json(); go(`/work/issue/${issue.key}`); router.refresh(); }
    } });
    for (const i of issues) list.push({ id: i.id, label: `${i.key}  ${i.title}`, icon: <StatusIcon status={i.status} />, run: () => go(`/work/issue/${i.key}`) });
    for (const n of NAV) if (!q || n.label.toLowerCase().includes(q.toLowerCase())) list.push({ id: n.href, label: `Go to ${n.label}`, icon: <n.icon />, run: () => go(n.href) });
    if (q.trim()) list.push({ id: "jql", label: `Search all for "${q.trim()}"`, icon: <IconSearch />, run: () => go(`/work/search?jql=${encodeURIComponent(`text ~ "${q.trim()}"`)}`) });
    return list;
  }, [q, issues, go, projectKey, router]);
  useEffect(() => setIdx(0), [q]);
  return (
    <div className="lw-pal-wrap" onMouseDown={onClose} role="presentation">
      <div className="lw-pal" role="dialog" aria-label="Command palette" onMouseDown={(e) => e.stopPropagation()}>
        <div className="lw-pal-in">
          <IconSearch />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a command, an issue or a new title…" aria-label="Command"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, cmds.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
              if (e.key === "Enter") { e.preventDefault(); void cmds[idx]?.run(); }
            }} />
          <kbd>Esc</kbd>
        </div>
        <ul className="lw-pal-list" role="listbox">
          {cmds.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === idx} className={i === idx ? "on" : ""} onMouseEnter={() => setIdx(i)} onClick={() => void c.run()}>
              <span className="lw-pal-ic">{c.icon}</span><span className="lw-pal-label">{c.label}</span>{c.hint ? <kbd>{c.hint}</kbd> : null}
            </li>
          ))}
          {!cmds.length ? <li className="lw-muted">No matches</li> : null}
        </ul>
      </div>
    </div>
  );
}

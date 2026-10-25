import type { SVGProps } from "react";

const base = (p: SVGProps<SVGSVGElement>) => ({ width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...p });

export const IconBoard = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="2" y="2.5" width="3.5" height="11" rx="1" /><rect x="6.25" y="2.5" width="3.5" height="7" rx="1" /><rect x="10.5" y="2.5" width="3.5" height="9" rx="1" /></svg>;
export const IconBacklog = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M3 4h10M3 8h10M3 12h6" /></svg>;
export const IconSearch = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><circle cx="7" cy="7" r="4.25" /><path d="m10.25 10.25 3 3" /></svg>;
export const IconWiki = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M3 2.75h7.5L13 5.25v8H3z" /><path d="M5.5 7.5h5M5.5 10h3.5" /></svg>;
export const IconImport = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M8 2.5v7.5M5 7l3 3 3-3M3 13h10" /></svg>;
export const IconPlus = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M8 3v10M3 8h10" /></svg>;
export const IconSun = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><circle cx="8" cy="8" r="3" /><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" /></svg>;
export const IconMoon = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5Z" /></svg>;
export const IconSidebar = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="2" y="2.5" width="12" height="11" rx="2" /><path d="M6 2.5v11" /></svg>;
export const IconChevron = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="m5 6.5 3 3 3-3" /></svg>;
export const IconComment = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M3 3.5h10v7H7l-3 2.5v-2.5H3z" /></svg>;
export const IconLink = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M7 9a2.5 2.5 0 0 0 3.5 0l2-2A2.5 2.5 0 0 0 9 3.5l-.5.5M9 7a2.5 2.5 0 0 0-3.5 0l-2 2A2.5 2.5 0 0 0 7 12.5l.5-.5" /></svg>;
export const IconSub = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M4 3v6.5a1.5 1.5 0 0 0 1.5 1.5H12M10 9l2 2-2 2" /></svg>;
export const IconMenu = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" /></svg>;

/** Linear-style status glyphs. */
export function StatusIcon({ status, size = 14 }: { status: string; size?: number }) {
  const c = { todo: "var(--lw-st-todo)", in_progress: "var(--lw-st-prog)", in_review: "var(--lw-st-review)", done: "var(--lw-st-done)" }[status] ?? "currentColor";
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-label={status.replace("_", " ")} role="img">
      <circle cx="7" cy="7" r="5.5" fill="none" stroke={c} strokeWidth="1.5" strokeDasharray={status === "todo" ? "2 1.6" : undefined} />
      {status === "in_progress" ? <path d="M7 3.5a3.5 3.5 0 0 1 0 7z" fill={c} /> : null}
      {status === "in_review" ? <path d="M7 3.5a3.5 3.5 0 1 1-3.03 1.75L7 7z" fill={c} /> : null}
      {status === "done" ? <><circle cx="7" cy="7" r="5.5" fill={c} /><path d="m4.6 7.1 1.6 1.6 3.2-3.3" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></> : null}
    </svg>
  );
}

export function PriorityIcon({ priority, size = 14 }: { priority: string; size?: number }) {
  if (priority === "urgent")
    return <svg width={size} height={size} viewBox="0 0 14 14" role="img" aria-label="urgent"><rect x="1" y="1" width="12" height="12" rx="3" fill="var(--lw-urgent)" /><path d="M7 3.8v4M7 10.2v.1" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" /></svg>;
  const n = { low: 1, medium: 2, high: 3 }[priority] ?? 0;
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" role="img" aria-label={priority}>
      {[0, 1, 2].map((i) => <rect key={i} x={2 + i * 3.8} y={10 - i * 3} width="2.6" height={2.5 + i * 3} rx=".8" fill="currentColor" opacity={i < n ? 0.9 : 0.22} />)}
    </svg>
  );
}

export function TypeDot({ type }: { type: string }) {
  const c = { bug: "#d9534f", story: "#2f9e6f", epic: "#7c5cd6", task: "#6b7a90" }[type] ?? "#6b7a90";
  return <span className="lw-type" style={{ background: c }} title={type} />;
}

export function Avatar({ name, size = 22 }: { name: string | null; size?: number }) {
  if (!name) return <span className="lw-avatar lw-avatar-empty" style={{ width: size, height: size }} title="Unassigned" />;
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  const initials = name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("");
  return <span className="lw-avatar" title={name} style={{ width: size, height: size, background: `hsl(${h} 45% 46%)`, fontSize: size * 0.42 }}>{initials}</span>;
}

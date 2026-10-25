export function Empty({ title, body, art = "board", children }: { title: string; body: string; art?: "board" | "search" | "wiki" | "backlog"; children?: React.ReactNode }) {
  return (
    <div className="lw-empty">
      <svg width="148" height="104" viewBox="0 0 148 104" fill="none" aria-hidden="true" className="lw-empty-art">
        <rect x="10" y="14" width="128" height="80" rx="14" fill="var(--lw-surface-2)" stroke="var(--lw-border)" />
        {art === "board" ? <>
          <rect x="22" y="28" width="30" height="54" rx="6" fill="var(--lw-surface)" stroke="var(--lw-border)" />
          <rect x="59" y="28" width="30" height="38" rx="6" fill="var(--lw-surface)" stroke="var(--lw-border)" />
          <rect x="96" y="28" width="30" height="46" rx="6" fill="var(--lw-surface)" stroke="var(--lw-border)" />
          <rect x="27" y="34" width="20" height="10" rx="3" fill="var(--lw-accent)" opacity=".85" />
          <rect x="64" y="34" width="20" height="10" rx="3" fill="var(--lw-accent)" opacity=".45" />
        </> : null}
        {art === "search" ? <>
          <circle cx="66" cy="50" r="18" stroke="var(--lw-accent)" strokeWidth="3" />
          <path d="m79 63 14 14" stroke="var(--lw-accent)" strokeWidth="3" strokeLinecap="round" />
          <path d="M58 50h16" stroke="var(--lw-border-strong)" strokeWidth="2" strokeLinecap="round" />
        </> : null}
        {art === "wiki" ? <>
          <rect x="44" y="24" width="60" height="62" rx="6" fill="var(--lw-surface)" stroke="var(--lw-border)" />
          <path d="M54 38h32M54 48h40M54 58h26M54 68h34" stroke="var(--lw-border-strong)" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="54" y="30" width="18" height="3" rx="1.5" fill="var(--lw-accent)" />
        </> : null}
        {art === "backlog" ? <>
          {[0, 1, 2, 3].map((i) => <g key={i}><rect x="26" y={28 + i * 15} width="96" height="10" rx="5" fill="var(--lw-surface)" stroke="var(--lw-border)" /><circle cx="34" cy={33 + i * 15} r="2.5" fill={i === 0 ? "var(--lw-accent)" : "var(--lw-border-strong)"} /></g>)}
        </> : null}
      </svg>
      <h3>{title}</h3>
      <p>{body}</p>
      {children}
    </div>
  );
}

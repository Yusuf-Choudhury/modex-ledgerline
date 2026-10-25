import Link from "next/link";
import type { Page } from "@/lib/pm/types";

export function PageTree({ pages, current }: { pages: Page[]; current?: string }) {
  const slugs = new Set(pages.map((p) => p.slug));
  const kids = (parent: string | null) => pages.filter((p) => (parent === null ? !p.parentSlug || !slugs.has(p.parentSlug) : p.parentSlug === parent));
  const render = (parent: string | null, depth: number): React.ReactNode => {
    const list = kids(parent);
    if (!list.length || depth > 8) return null;
    return (
      <ul className="lw-tree">
        {list.map((p) => (
          <li key={p.id}>
            <Link className={p.slug === current ? "on" : ""} href={`/work/wiki/${p.slug}`}>{p.title}</Link>
            {render(p.slug, depth + 1)}
          </li>
        ))}
      </ul>
    );
  };
  return <nav aria-label="Page tree">{render(null, 0)}</nav>;
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/pm/store";
import { PageEditor } from "@/components/work/PageEditor";
import { PageTree } from "@/components/work/PageTree";
import { History } from "@/components/work/History";
import { renderMarkdown } from "@/lib/pm/markdown";
import { Avatar } from "@/components/work/icons";

export default async function WikiSlug({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await getStore();
  const p = await s.getPage(slug);
  if (!p) notFound();
  const [pages, versions] = await Promise.all([s.listPages(), s.pageVersions(slug)]);
  const parent = p.parentSlug ? pages.find((x) => x.slug === p.parentSlug) : null;
  const children = pages.filter((x) => x.parentSlug === p.slug);
  return (
    <div className="lw-wiki">
      <aside className="lw-wiki-tree"><p className="lw-section">Pages</p><PageTree pages={pages} current={slug} /></aside>
      <article className="lw-doc">
        <p className="lw-crumb lw-xs"><Link href="/work/wiki">Wiki</Link>{parent ? <><span>›</span><Link href={`/work/wiki/${parent.slug}`}>{parent.title}</Link></> : null}</p>
        <h1 className="lw-doc-title">{p.title}</h1>
        <p className="lw-doc-meta"><Avatar name={p.updatedBy} size={18} /> {p.updatedBy} · updated {new Date(p.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} · {versions.length} earlier version{versions.length === 1 ? "" : "s"}</p>
        <div className="lw-prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />
        {children.length ? <><p className="lw-section">In this section</p><div className="lw-cards">{children.map((c) => <Link key={c.id} href={`/work/wiki/${c.slug}`} className="lw-doc-card"><strong>{c.title}</strong></Link>)}</div></> : null}
        <details className="lw-panel"><summary>Edit page</summary><PageEditor key={p.updatedAt} slug={p.slug} title={p.title} body={p.body} parentSlug={p.parentSlug} pages={pages} /></details>
        <details className="lw-panel"><summary>History</summary><History slug={p.slug} versions={versions} /></details>
      </article>
    </div>
  );
}

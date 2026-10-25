import Link from "next/link";
import { getStore } from "@/lib/pm/store";
import { PageEditor } from "@/components/work/PageEditor";
import { PageTree } from "@/components/work/PageTree";
import { Empty } from "@/components/work/Empty";

export default async function WikiPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const s = await getStore();
  const pages = await s.listPages();
  const hits = q ? await s.listPages(q) : null;
  const recent = [...pages].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
  return (
    <div className="lw-wiki">
      <aside className="lw-wiki-tree">
        <form action="/work/wiki" className="lw-query lw-query-sm"><input name="q" defaultValue={q} placeholder="Search pages" aria-label="Search pages" /></form>
        <p className="lw-section">Pages</p>
        <PageTree pages={pages} />
      </aside>
      <div className="lw-page">
        <div className="lw-page-head"><div><h1>Wiki</h1><p className="lw-sub">Docs that live next to the work.</p></div></div>
        {hits ? (hits.length ? <div className="lw-cards">{hits.map((p) => <Link key={p.id} href={`/work/wiki/${p.slug}`} className="lw-doc-card"><strong>{p.title}</strong><span>{p.body.replace(/[#*`]/g, "").slice(0, 110)}</span></Link>)}</div> : <Empty art="search" title={`No pages match "${q}"`} body="Try another word, or create the page below." />) : null}
        {!hits && recent.length ? <><p className="lw-section">Recently updated</p><div className="lw-cards">{recent.map((p) => <Link key={p.id} href={`/work/wiki/${p.slug}`} className="lw-doc-card"><strong>{p.title}</strong><span>{p.body.replace(/[#*`]/g, "").slice(0, 110)}</span><em>{p.updatedBy} · {new Date(p.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</em></Link>)}</div></> : null}
        {!pages.length ? <Empty art="wiki" title="Start your wiki" body="Write your first page, or import your Confluence space." /> : null}
        <details className="lw-panel" open={!pages.length}><summary>New page</summary><PageEditor pages={pages} /></details>
      </div>
    </div>
  );
}

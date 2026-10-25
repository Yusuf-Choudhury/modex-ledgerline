"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";

export function PageEditor({ slug, title: t0 = "", body: b0 = "", parentSlug: p0 = null, pages = [] }: { slug?: string; title?: string; body?: string; parentSlug?: string | null; pages?: { slug: string; title: string }[] }) {
  const [parentSlug, setParent] = useState<string | null>(p0);
  const [title, setTitle] = useState(t0);
  const [body, setBody] = useState(b0);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  return (
    <form className="lw-editor" onSubmit={async (e) => {
      e.preventDefault();
      try {
        const { page } = await api("/pages", { method: "POST", body: JSON.stringify({ title, body, slug, parentSlug }) });
        router.push(`/work/wiki/${page.slug}`);
        router.refresh();
      } catch (e) { setErr(String(e)); }
    }}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Page title" aria-label="Page title" required />
      <select value={parentSlug ?? ""} onChange={(e) => setParent(e.target.value || null)} aria-label="Parent page">
        <option value="">No parent (top level)</option>
        {pages.filter((p) => p.slug !== slug).map((p) => <option key={p.slug} value={p.slug}>Under: {p.title}</option>)}
      </select>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder="Markdown: # heading, **bold**, *italic*, - lists, [link](https://...). Mention issues like LL-3." aria-label="Page body" />
      <div className="lw-row"><button className="lw-btn lw-btn-primary" type="submit">Save page</button></div>
      {err ? <p className="lw-error">{err}</p> : null}
    </form>
  );
}

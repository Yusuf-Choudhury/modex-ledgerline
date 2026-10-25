"use client";

import { useRouter } from "next/navigation";
import type { PageVersion } from "@/lib/pm/types";
import { api } from "./api";

export function History({ slug, versions }: { slug: string; versions: PageVersion[] }) {
  const router = useRouter();
  if (!versions.length) return <p className="lw-muted lw-xs">No earlier versions yet.</p>;
  return (
    <ul className="lw-history">
      {versions.map((v) => (
        <li key={v.id} >
          <span>{new Date(v.savedAt).toLocaleString("en-GB")} by {v.savedBy}</span>
          <button className="lw-btn lw-btn-sm" onClick={async () => { await api(`/pages/${slug}/versions`, { method: "POST", body: JSON.stringify({ versionId: v.id }) }); router.refresh(); }}>Restore</button>
        </li>
      ))}
    </ul>
  );
}

"use client";

import { useState } from "react";

export function Importer({ kind }: { kind: "jira" | "confluence" }) {
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <form className="lw-drop" onSubmit={async (e) => {
      e.preventDefault();
      const f = (e.currentTarget.elements.namedItem("file") as HTMLInputElement).files?.[0];
      if (!f) return;
      const r = await fetch(`/api/v1/import/${kind}`, { method: "POST", headers: { "content-type": "text/csv" }, body: await f.text() });
      const d = await r.json().catch(() => ({}));
      setMsg(r.ok ? `Imported: ${JSON.stringify(d.imported)}` : `Failed: ${d.error ?? r.status}`);
    }}>
      <input type="file" name="file" accept=".csv,text/csv" aria-label={`${kind} CSV file`} />
      <button className="lw-btn lw-btn-primary" type="submit">Import {kind === "jira" ? "Jira issues" : "Confluence pages"}</button>
      {msg ? <p className="lw-mono lw-xs">{msg}</p> : null}
    </form>
  );
}

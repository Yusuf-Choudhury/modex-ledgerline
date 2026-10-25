/** RFC 4180 CSV parser: quoted fields, escaped quotes, newlines inside quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

/** Rows to objects. Duplicate headers (Jira repeats "Labels", "Sprint") become arrays joined later. */
export function csvToRecords(text: string): Record<string, string[]>[] {
  const [header, ...rest] = parseCsv(text);
  if (!header) return [];
  return rest.map((r) => {
    const o: Record<string, string[]> = {};
    header.forEach((h, i) => {
      const k = h.trim();
      const v = (r[i] ?? "").trim();
      (o[k] ??= []);
      if (v) o[k].push(v);
    });
    return o;
  });
}

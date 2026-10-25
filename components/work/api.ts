export async function api(path: string, init?: RequestInit) {
  const r = await fetch(`/api/v1${path}`, { ...init, headers: { "content-type": "application/json", ...(init?.headers || {}) } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
  return d;
}

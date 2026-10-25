import { Search } from "@/components/work/Search";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ jql?: string }> }) {
  const { jql } = await searchParams;
  return (
    <div className="lw-page">
      <div className="lw-page-head"><div><h1>Search</h1><p className="lw-sub">Fields: project, status, type, priority, assignee, sprint, labels, parent, key, text. Operators =, !=, ~, IN, NOT IN, IS EMPTY, joined with AND. ORDER BY priority, status, created, updated or key.</p></div></div>
      <Search initial={jql ?? "status != done ORDER BY priority DESC"} />
    </div>
  );
}

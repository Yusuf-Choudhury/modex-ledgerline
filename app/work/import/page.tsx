import { Importer } from "@/components/work/Importer";

export default function ImportPage() {
  return (
    <div className="lw-page">
      <div className="lw-page-head"><div><h1>Import from Atlassian</h1><p className="lw-sub">Bring your Jira issues and Confluence pages across. Nothing is deleted on their side.</p></div></div>
      <div className="lw-cards lw-cards-2">
        <div className="lw-panel lw-panel-static">
          <div className="lw-import-head"><span className="lw-brand-badge" style={{ background: "#2563eb" }}>J</span><div><h3>Jira issues</h3><p className="lw-muted lw-xs">Filters › Export › CSV (all fields)</p></div></div>
          <p className="lw-muted lw-small">We read Summary, Issue key, Issue Type, Status, Priority, Assignee, Description, Sprint and Labels. Sprints are created by name.</p>
          <Importer kind="jira" />
        </div>
        <div className="lw-panel lw-panel-static">
          <div className="lw-import-head"><span className="lw-brand-badge" style={{ background: "#0f766e" }}>C</span><div><h3>Confluence pages</h3><p className="lw-muted lw-xs">CSV with Title, Body, Parent</p></div></div>
          <p className="lw-muted lw-small">Confluence does not export CSV natively, so convert your space export first. Native space export import is on the roadmap.</p>
          <Importer kind="confluence" />
        </div>
      </div>
    </div>
  );
}

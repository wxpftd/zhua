import { listReports, loadSnapshot } from "@/lib/reports";
import Link from "next/link";

export const revalidate = 60;

const dateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default async function ReportsIndexPage() {
  const [reports, snap] = await Promise.all([listReports(), loadSnapshot()]);
  const generatedAt = new Date(snap.generatedAt);

  return (
    <section className="reports-page">
      <div className="reports-page-header">
        <h1>Research Reports</h1>
        <p className="reports-meta">
          {reports.length === 0
            ? "No reports published yet."
            : `${reports.length} report${reports.length === 1 ? "" : "s"}, newest first.`}
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="reports-empty">
          <p>
            Reports are published by the{" "}
            <a href="https://docs.paperclip.ing" rel="noreferrer">
              SocialMediaResearcher
            </a>{" "}
            agent. Once it publishes its first report, it will appear here.
          </p>
        </div>
      ) : (
        <ul className="reports-list">
          {reports.map((r) => (
            <li key={r.issueIdentifier}>
              <Link href={`/reports/${r.issueIdentifier}`} className="reports-card">
                <div className="reports-card-meta">
                  <span className="reports-card-id">{r.issueIdentifier}</span>
                  <span className="reports-card-date">
                    {dateFmt.format(new Date(r.publishedAt))}
                  </span>
                </div>
                <h2 className="reports-card-title">{r.title}</h2>
                {r.tldr && <p className="reports-card-tldr">{r.tldr}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <footer className="reports-footer">
        <p className="reports-meta">
          Snapshot updated {dateFmt.format(generatedAt)} · Refreshes when new reports are published.
        </p>
      </footer>
    </section>
  );
}

import { getReport, listReports } from "@/lib/reports";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const revalidate = 60;
export const dynamicParams = true;

const dateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

type Params = { id: string };

export async function generateStaticParams(): Promise<Params[]> {
  const reports = await listReports();
  return reports.map((r) => ({ id: r.issueIdentifier }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) return { title: "Report not found — ZHUA Research" };
  return {
    title: `${report.title} — ZHUA Research`,
    description: report.tldr || `Research report ${report.issueIdentifier}`,
  };
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  return (
    <article className="reports-page report-detail">
      <nav className="reports-back">
        <Link href="/reports">&larr; All reports</Link>
      </nav>
      <header className="reports-detail-header">
        <div className="reports-card-meta">
          <span className="reports-card-id">{report.issueIdentifier}</span>
          <span className="reports-card-date">
            Published {dateFmt.format(new Date(report.publishedAt))}
          </span>
        </div>
        <h1>{report.title}</h1>
      </header>
      <div className="report-prose">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.body}</ReactMarkdown>
      </div>
    </article>
  );
}

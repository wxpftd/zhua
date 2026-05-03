/**
 * Refresh src/data/reports-snapshot.json from the local Paperclip API.
 *
 * Why a snapshot?  The Paperclip API only listens on 127.0.0.1, so a Vercel
 * deployment cannot fetch reports at request time. We instead bake the
 * report set into the build via a committed JSON file. To publish changes:
 *
 *   pnpm reports:snapshot && git add src/data/reports-snapshot.json && git commit
 *
 * (A future Paperclip routine can automate this — see ZHUA-8 v2 follow-ups.)
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  type PaperclipDocument,
  listCompanyAgents,
  listCompanyIssues,
  listIssueDocuments,
} from "../src/lib/paperclip";
import { type Report, type ReportsSnapshot, extractTldr } from "../src/lib/reports";

const REPORT_DOCUMENT_KEY = "report";
const SNAPSHOT_PATH = path.resolve(process.cwd(), "src/data/reports-snapshot.json");

async function main(): Promise<void> {
  const companyId = process.env.PAPERCLIP_COMPANY_ID;
  if (!companyId) {
    throw new Error(
      "PAPERCLIP_COMPANY_ID is required (set in .env.local or via the heartbeat env)",
    );
  }

  console.log(`[snapshot] enumerating issues for company ${companyId} …`);
  const issues = await listCompanyIssues(companyId);
  console.log(
    `[snapshot] found ${issues.length} issues; probing each for a "${REPORT_DOCUMENT_KEY}" document`,
  );

  const agents = await listCompanyAgents(companyId).catch(() => []);
  const agentKeyById = new Map(agents.map((a) => [a.id, a.urlKey] as const));

  const reports: Report[] = [];
  for (const issue of issues) {
    const documents = await listIssueDocuments(issue.id).catch((err) => {
      console.warn(`[snapshot]   ${issue.identifier}: skipping — ${(err as Error).message}`);
      return [] as PaperclipDocument[];
    });
    const report = documents.find((d) => d.key === REPORT_DOCUMENT_KEY);
    if (!report) continue;

    reports.push({
      issueIdentifier: issue.identifier,
      title: issue.title,
      tldr: extractTldr(report.body),
      body: report.body,
      publishedAt: report.updatedAt,
      authorAgentKey: report.updatedByAgentId
        ? (agentKeyById.get(report.updatedByAgentId) ?? null)
        : report.createdByAgentId
          ? (agentKeyById.get(report.createdByAgentId) ?? null)
          : null,
    });
    console.log(`[snapshot]   ${issue.identifier}: ✓ report (${report.body.length} chars)`);
  }

  reports.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const snapshot: ReportsSnapshot = {
    generatedAt: new Date().toISOString(),
    reports,
  };

  await fs.mkdir(path.dirname(SNAPSHOT_PATH), { recursive: true });
  await fs.writeFile(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(
    `[snapshot] wrote ${reports.length} report(s) → ${path.relative(process.cwd(), SNAPSHOT_PATH)}`,
  );
}

main().catch((err) => {
  console.error("[snapshot] failed:", err);
  process.exit(1);
});

import { promises as fs } from "node:fs";
import path from "node:path";

export type Report = {
  /** Source issue identifier, e.g. "ZHUA-12". Stable, used as URL slug. */
  issueIdentifier: string;
  /** Human title — derived from the source issue title. */
  title: string;
  /** Pulled from the report body's TL;DR section. May be empty. */
  tldr: string;
  /** Full markdown body of the report. */
  body: string;
  /** ISO timestamp of the report document's latest revision. */
  publishedAt: string;
  /** URL key (e.g. "socialmediaresearcher") of the agent that wrote the report. */
  authorAgentKey: string | null;
};

export type ReportsSnapshot = {
  /** ISO timestamp the snapshot was generated. */
  generatedAt: string;
  reports: Report[];
};

const SNAPSHOT_PATH = path.resolve(process.cwd(), "src/data/reports-snapshot.json");

let cached: Promise<ReportsSnapshot> | null = null;

export async function loadSnapshot(): Promise<ReportsSnapshot> {
  if (!cached) {
    cached = (async () => {
      try {
        const raw = await fs.readFile(SNAPSHOT_PATH, "utf8");
        return JSON.parse(raw) as ReportsSnapshot;
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
          return { generatedAt: new Date(0).toISOString(), reports: [] };
        }
        throw err;
      }
    })();
  }
  return cached;
}

export async function listReports(): Promise<Report[]> {
  const snap = await loadSnapshot();
  return [...snap.reports].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getReport(issueIdentifier: string): Promise<Report | null> {
  const snap = await loadSnapshot();
  return snap.reports.find((r) => r.issueIdentifier === issueIdentifier) ?? null;
}

/**
 * Pulls the first paragraph after a "## TL;DR" heading. Falls back to the first
 * non-heading paragraph so older reports without the canonical heading still
 * get a usable snippet.
 */
export function extractTldr(markdown: string): string {
  // No `m` flag: `$` here means end-of-input (so the lazy capture won't stop
  // at end-of-line). `(?:^|\n)` handles "## TL;DR" not being the first line.
  const tldrSection = markdown.match(/(?:^|\n)##\s+TL;?DR\s*\n+([\s\S]+?)(?=\n##\s|$)/i);
  if (tldrSection) {
    const firstPara = tldrSection[1].trim().split(/\n\s*\n/)[0];
    return collapseWhitespace(firstPara);
  }
  const firstPara = markdown
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p.length > 0 && !p.startsWith("#"));
  return firstPara ? collapseWhitespace(firstPara) : "";
}

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

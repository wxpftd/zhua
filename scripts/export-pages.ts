/**
 * Render every report in src/data/reports-snapshot.json to a self-contained
 * .html file inside a target directory. Used by the local `zhua-pages` static
 * site (sibling project under ~/Develop/zhua-pages) and runnable ad-hoc to
 * preview the export pipeline.
 *
 *   pnpm pages:export                          # → ../zhua-pages/pages
 *   OUT_DIR=/tmp/zhua-pages pnpm pages:export  # custom dir
 *
 * Also emits an index.html listing all exports, so the static server can serve
 * `/` directly.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { renderReportToStandaloneHtml } from "../src/lib/export-html";
import { type Report, loadSnapshot } from "../src/lib/reports";

const DEFAULT_OUT_DIR = path.resolve(process.cwd(), "..", "zhua-pages", "pages");
const SNAPSHOT_LABEL_FMT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function renderIndexHtml(reports: Report[], generatedAt: string): string {
  const rows = reports
    .map((r) => {
      const date = r.publishedAt ? SNAPSHOT_LABEL_FMT.format(new Date(r.publishedAt)) : "";
      return [
        '<li class="report">',
        `<a href="${r.issueIdentifier}.html">`,
        `<span class="id">${r.issueIdentifier}</span>`,
        `<span class="title">${escapeHtmlImpl(r.title)}</span>`,
        date ? `<span class="date">${date}</span>` : "",
        "</a>",
        "</li>",
      ].join("");
    })
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ZHUA · Research Reports</title>
<meta name="description" content="Locally hosted ZHUA research report exports." />
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0; padding: 2.5rem 1.25rem;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: #1d1d1f; background: #fdfcfa;
  }
  @media (prefers-color-scheme: dark) { body { color: #e8e8ec; background: #1c1c1f; } }
  main { max-width: 720px; margin: 0 auto; }
  header h1 { margin: 0 0 0.25rem; font-size: 1.6rem; }
  header p { margin: 0; color: #6b6b73; font-size: 0.9rem; }
  ul { list-style: none; padding: 0; margin: 2rem 0 0; }
  .report a {
    display: grid; grid-template-columns: 5rem 1fr auto;
    gap: 1rem; padding: 0.9rem 1rem; border: 1px solid #e2dfd9; border-radius: 8px;
    color: inherit; text-decoration: none; margin-bottom: 0.5rem; align-items: baseline;
  }
  .report a:hover { background: rgba(184, 92, 44, 0.05); }
  .report .id { color: #6b6b73; font-variant-numeric: tabular-nums; }
  .report .title { font-weight: 600; }
  .report .date { color: #6b6b73; font-size: 0.85rem; }
</style>
</head>
<body>
<main>
<header>
<h1>ZHUA · Research Reports</h1>
<p>Locally rendered snapshot — generated ${escapeHtmlImpl(generatedAt)}</p>
</header>
<ul>
${rows}
</ul>
</main>
</body>
</html>
`;
}

function escapeHtmlImpl(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function main(): Promise<void> {
  const outDir = path.resolve(process.env.OUT_DIR || DEFAULT_OUT_DIR);
  const snap = await loadSnapshot();
  if (snap.reports.length === 0) {
    throw new Error(
      "snapshot has 0 reports — run `pnpm reports:snapshot` first or check src/data/reports-snapshot.json",
    );
  }

  await fs.mkdir(outDir, { recursive: true });
  for (const report of snap.reports) {
    const file = path.join(outDir, `${report.issueIdentifier}.html`);
    await fs.writeFile(file, renderReportToStandaloneHtml(report), "utf8");
    console.log(`[pages] ${report.issueIdentifier} → ${path.relative(process.cwd(), file)}`);
  }
  const index = path.join(outDir, "index.html");
  await fs.writeFile(index, renderIndexHtml(snap.reports, snap.generatedAt), "utf8");
  console.log(`[pages] index → ${path.relative(process.cwd(), index)}`);
  console.log(`[pages] done. ${snap.reports.length} report(s) → ${outDir}`);
}

main().catch((err) => {
  console.error("[pages] failed:", err);
  process.exit(1);
});

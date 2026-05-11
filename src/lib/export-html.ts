import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Report } from "./reports";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

// Inlined subset of the .report-prose rules from src/app/globals.css so the
// exported file renders standalone — no external stylesheet, no font load,
// works when pasted into rich-text editors that ignore unknown CSS variables.
const INLINE_STYLES = `
  :root { color-scheme: light dark; }
  body {
    margin: 0;
    padding: 2.5rem 1.25rem;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
    color: #1d1d1f;
    background: #fdfcfa;
    -webkit-text-size-adjust: 100%;
  }
  @media (prefers-color-scheme: dark) {
    body { color: #e8e8ec; background: #1c1c1f; }
  }
  main { max-width: 720px; margin: 0 auto; }
  header.meta { margin-bottom: 1.75rem; color: #6b6b73; font-size: 0.9rem; }
  header.meta .id { font-variant-numeric: tabular-nums; letter-spacing: 0.04em; }
  header.meta .id + .dot { margin: 0 0.5rem; }
  h1.title { margin: 0.35rem 0 0; font-size: 1.9rem; font-weight: 600; line-height: 1.25; }
  article { font-size: 1.02rem; line-height: 1.65; }
  article h2 { margin: 2rem 0 0.6rem; font-size: 1.3rem; font-weight: 600; }
  article h3 { margin: 1.5rem 0 0.5rem; font-size: 1.1rem; font-weight: 600; }
  article p { margin: 0.85rem 0; }
  article ul, article ol { padding-left: 1.4rem; margin: 0.75rem 0; }
  article li { margin: 0.3rem 0; }
  article blockquote {
    border-left: 3px solid #b85c2c;
    margin: 1rem 0;
    padding: 0.4rem 1rem;
    color: #6b6b73;
    background: rgba(184, 92, 44, 0.06);
    border-radius: 0 6px 6px 0;
  }
  article code {
    font-family: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
    font-size: 0.9em;
    background: rgba(0, 0, 0, 0.05);
    padding: 0.1em 0.35em;
    border-radius: 4px;
  }
  article pre {
    background: rgba(0, 0, 0, 0.05);
    padding: 0.85rem 1rem;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 0.9rem;
  }
  article pre code { background: transparent; padding: 0; font-size: inherit; }
  article table { border-collapse: collapse; margin: 1rem 0; width: 100%; font-size: 0.95rem; }
  article th, article td { border: 1px solid #e2dfd9; padding: 0.4rem 0.7rem; text-align: left; }
  article th { background: rgba(0, 0, 0, 0.03); font-weight: 600; }
  article hr { border: none; border-top: 1px solid #e2dfd9; margin: 1.5rem 0; }
  article img { max-width: 100%; height: auto; border-radius: 6px; }
  article a { color: #b85c2c; }
  footer.attribution { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e2dfd9; color: #6b6b73; font-size: 0.85rem; }
`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMarkdownToHtml(markdown: string): string {
  // Reuse the same react-markdown + remark-gfm pipeline as /reports/[id] so the
  // exported HTML matches what readers see on the site.
  return renderToStaticMarkup(
    createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, markdown),
  );
}

/**
 * Render a Report into a self-contained HTML document.
 *
 * Use cases:
 * - Pipe into a file (`/reports/{id}/export.html?download=1`) for sharing or
 *   pasting into Notion / Google Docs / email.
 * - Snapshot the visual fidelity of a report independent of the SSR site.
 *
 * Notion compatibility note: the Notion REST API does NOT accept HTML; pasting
 * into Notion's web client converts clipboard `text/html` into Notion blocks
 * with some loss. See [ZHUA-393](/ZHUA/issues/ZHUA-393) for the research.
 */
export function renderReportToStandaloneHtml(report: Report): string {
  const body = renderMarkdownToHtml(report.body);
  const publishedLabel = report.publishedAt ? dateFmt.format(new Date(report.publishedAt)) : "";

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(report.title)} — ZHUA Research</title>`,
    `<meta name="description" content="${escapeHtml(report.tldr || `Research report ${report.issueIdentifier}`)}" />`,
    '<meta name="robots" content="index,follow" />',
    `<style>${INLINE_STYLES}</style>`,
    "</head>",
    "<body>",
    "<main>",
    '<header class="meta">',
    `<span class="id">${escapeHtml(report.issueIdentifier)}</span>`,
    publishedLabel
      ? `<span class="dot">·</span><span>Published ${escapeHtml(publishedLabel)}</span>`
      : "",
    `<h1 class="title">${escapeHtml(report.title)}</h1>`,
    "</header>",
    `<article>${body}</article>`,
    '<footer class="attribution">',
    `Source: <a href="/reports/${escapeHtml(report.issueIdentifier)}">ZHUA Research · ${escapeHtml(report.issueIdentifier)}</a>`,
    "</footer>",
    "</main>",
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

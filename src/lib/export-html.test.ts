import { describe, expect, it } from "vitest";
import { renderReportToStandaloneHtml } from "./export-html";
import type { Report } from "./reports";

const baseReport: Report = {
  issueIdentifier: "ZHUA-42",
  title: "Sample report <with brackets>",
  tldr: "TL;DR line.",
  body: [
    "## TL;DR",
    "",
    "Short summary.",
    "",
    "## Findings",
    "",
    "- Bullet one",
    "- Bullet **two** with [a link](https://example.com)",
    "",
    "| Col A | Col B |",
    "| --- | --- |",
    "| a1 | b1 |",
    "",
    "```js",
    "console.log('hi');",
    "```",
  ].join("\n"),
  publishedAt: "2026-04-15T10:30:00.000Z",
  authorAgentKey: "socialmediaresearcher",
};

describe("renderReportToStandaloneHtml", () => {
  it("emits a complete HTML document with inlined styles", () => {
    const html = renderReportToStandaloneHtml(baseReport);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<meta charset="utf-8"');
    expect(html).toContain("<style>");
    // No external stylesheet — must be standalone.
    expect(html).not.toContain('<link rel="stylesheet"');
  });

  // ZHUA-399: omit robots meta so accidentally-public exports default to
  // search-engine-neutral; auth at the reverse proxy is the real gate.
  it("omits the robots meta tag", () => {
    const html = renderReportToStandaloneHtml(baseReport);
    expect(html).not.toContain('name="robots"');
  });

  it("escapes HTML-special characters in the title and metadata", () => {
    const html = renderReportToStandaloneHtml(baseReport);
    expect(html).toContain("Sample report &lt;with brackets&gt;");
    expect(html).not.toContain("Sample report <with brackets>");
  });

  it("renders markdown into HTML using the same GFM rules as the site", () => {
    const html = renderReportToStandaloneHtml(baseReport);
    expect(html).toContain("<h2>Findings</h2>");
    expect(html).toContain("<strong>two</strong>");
    expect(html).toMatch(/<a [^>]*href="https:\/\/example\.com"/);
    expect(html).toContain("<table>");
    expect(html).toContain("<th>Col A</th>");
    expect(html).toContain("<code");
  });

  it("formats the publishedAt date in the meta block", () => {
    const html = renderReportToStandaloneHtml(baseReport);
    expect(html).toContain("April 15, 2026");
  });

  it("links the source attribution back to the SSR report page", () => {
    const html = renderReportToStandaloneHtml(baseReport);
    expect(html).toContain('href="/reports/ZHUA-42"');
  });

  it("falls back gracefully when publishedAt is empty", () => {
    const html = renderReportToStandaloneHtml({ ...baseReport, publishedAt: "" });
    expect(html).not.toContain("Published");
    expect(html).toContain("ZHUA-42");
  });
});

import { describe, expect, it } from "vitest";
import { extractTldr } from "./reports";

describe("extractTldr", () => {
  it("returns the first paragraph after a `## TL;DR` heading", () => {
    const md = [
      "# Title",
      "",
      "## TL;DR",
      "",
      "Short summary line one.",
      "Wraps to line two.",
      "",
      "## Scope",
      "",
      "Other content.",
    ].join("\n");
    expect(extractTldr(md)).toBe("Short summary line one. Wraps to line two.");
  });

  it("accepts the alternate `## TLDR` spelling", () => {
    const md = "## TLDR\n\nFirst paragraph.\n\nSecond paragraph.";
    expect(extractTldr(md)).toBe("First paragraph.");
  });

  it("falls back to the first non-heading paragraph when no TL;DR section exists", () => {
    const md = "# Just a title\n\nLeading paragraph text.\n\n## Section";
    expect(extractTldr(md)).toBe("Leading paragraph text.");
  });

  it("returns an empty string for documents with only headings", () => {
    expect(extractTldr("# Title only")).toBe("");
  });

  it("collapses interior whitespace so cards stay tidy", () => {
    const md = "## TL;DR\n\nMultiple   spaces\tand\nnewlines.";
    expect(extractTldr(md)).toBe("Multiple spaces and newlines.");
  });
});

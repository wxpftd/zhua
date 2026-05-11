import { renderReportToStandaloneHtml } from "@/lib/export-html";
import { getReport, listReports } from "@/lib/reports";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 60;

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const reports = await listReports();
  return reports.map((r) => ({ id: r.issueIdentifier }));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) {
    return new NextResponse("Report not found", { status: 404 });
  }

  const html = renderReportToStandaloneHtml(report);
  const wantsDownload = req.nextUrl.searchParams.get("download") === "1";
  const filename = `${report.issueIdentifier}.html`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": wantsDownload
        ? `attachment; filename="${filename}"`
        : `inline; filename="${filename}"`,
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
    },
  });
}

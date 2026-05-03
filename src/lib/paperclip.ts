/**
 * Server-side Paperclip API client. Used by the snapshot script (build time)
 * to enumerate issues and pull report documents.
 *
 * Localhost loopback (127.0.0.1) does not require auth. For tunnelled or
 * remote deployments, set PAPERCLIP_API_KEY and it will be sent as a Bearer.
 */
const DEFAULT_BASE = "http://127.0.0.1:3100";

export type PaperclipIssue = {
  id: string;
  identifier: string;
  title: string;
  status: string;
  assigneeAgentId: string | null;
  parentId: string | null;
  updatedAt: string;
};

export type PaperclipDocument = {
  id: string;
  issueId: string;
  key: string;
  title: string;
  format: string;
  body: string;
  latestRevisionId: string;
  latestRevisionNumber: number;
  createdByAgentId: string | null;
  updatedByAgentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaperclipAgent = {
  id: string;
  name: string;
  urlKey: string;
  role: string;
};

function baseUrl(): string {
  return process.env.PAPERCLIP_API_URL?.replace(/\/$/, "") || DEFAULT_BASE;
}

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  const key = process.env.PAPERCLIP_API_KEY;
  if (key) headers.Authorization = `Bearer ${key}`;
  return headers;
}

async function getJson<T>(path: string): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const res = await fetch(url, { headers: buildHeaders(), cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Paperclip ${res.status} ${res.statusText} for GET ${path}: ${body.slice(0, 200)}`,
    );
  }
  return (await res.json()) as T;
}

export async function listCompanyIssues(companyId: string): Promise<PaperclipIssue[]> {
  return getJson<PaperclipIssue[]>(`/api/companies/${companyId}/issues?limit=500`);
}

export async function listIssueDocuments(issueId: string): Promise<PaperclipDocument[]> {
  return getJson<PaperclipDocument[]>(`/api/issues/${issueId}/documents`);
}

export async function listCompanyAgents(companyId: string): Promise<PaperclipAgent[]> {
  return getJson<PaperclipAgent[]>(`/api/companies/${companyId}/agents`);
}

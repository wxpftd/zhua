import { db } from "@/db/client";
import { hypotheses, hypothesisRevisions } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function createHypothesis(formData: FormData): Promise<void> {
  "use server";
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const id = crypto.randomUUID();
  const revisionId = crypto.randomUUID();
  const now = new Date();

  await db.insert(hypotheses).values({ id, createdAt: now });
  await db
    .insert(hypothesisRevisions)
    .values({ id: revisionId, hypothesisId: id, body, createdAt: now });

  revalidatePath("/hypotheses");
}

export default async function HypothesesPage() {
  const allHypotheses = await db.select().from(hypotheses).orderBy(desc(hypotheses.createdAt));

  const ids = allHypotheses.map((h) => h.id);
  const revisions = ids.length
    ? await db
        .select()
        .from(hypothesisRevisions)
        .where(inArray(hypothesisRevisions.hypothesisId, ids))
        .orderBy(desc(hypothesisRevisions.createdAt))
    : [];

  // The latest revision per hypothesis is the current statement.
  const latestByHypothesis = new Map<string, (typeof revisions)[number]>();
  const countByHypothesis = new Map<string, number>();
  for (const r of revisions) {
    if (!latestByHypothesis.has(r.hypothesisId)) {
      latestByHypothesis.set(r.hypothesisId, r);
    }
    countByHypothesis.set(r.hypothesisId, (countByHypothesis.get(r.hypothesisId) ?? 0) + 1);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Hypothesis ledger</h1>
          <div className="subtitle">
            What we believe about product, customer, market — with dated revisions.
          </div>
        </div>
      </div>

      <form action={createHypothesis} style={{ marginBottom: "2rem" }}>
        <div className="field">
          <label htmlFor="body">New hypothesis</label>
          <textarea
            id="body"
            name="body"
            placeholder="We believe that ___ because ___. We will know we are wrong when ___."
            required
          />
        </div>
        <div className="button-row">
          <button type="submit">Add</button>
        </div>
      </form>

      {allHypotheses.length === 0 ? (
        <div className="empty">No hypotheses yet. Start with one belief.</div>
      ) : (
        <ul className="list">
          {allHypotheses.map((h) => {
            const latest = latestByHypothesis.get(h.id);
            const count = countByHypothesis.get(h.id) ?? 0;
            return (
              <li key={h.id}>
                <Link href={`/hypotheses/${h.id}`}>
                  <strong>{latest?.body.split("\n")[0] ?? "(untitled)"}</strong>
                </Link>
                <div className="meta">
                  <span>added {h.createdAt.toLocaleDateString()}</span>
                  {count > 1 && (
                    <span>
                      · {count} revisions · last {latest?.createdAt.toLocaleDateString()}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

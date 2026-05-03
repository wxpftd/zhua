import { db } from "@/db/client";
import { hypotheses, hypothesisRevisions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function addRevision(hypothesisId: string, formData: FormData): Promise<void> {
  "use server";
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  await db.insert(hypothesisRevisions).values({
    id: crypto.randomUUID(),
    hypothesisId,
    body,
    createdAt: new Date(),
  });

  revalidatePath(`/hypotheses/${hypothesisId}`);
  revalidatePath("/hypotheses");
}

export default async function HypothesisDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [hypothesis] = await db.select().from(hypotheses).where(eq(hypotheses.id, id)).limit(1);
  if (!hypothesis) notFound();

  const revisions = await db
    .select()
    .from(hypothesisRevisions)
    .where(eq(hypothesisRevisions.hypothesisId, id))
    .orderBy(desc(hypothesisRevisions.createdAt));

  const addRevisionBound = addRevision.bind(null, id);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Hypothesis</h1>
          <div className="subtitle">
            Created {hypothesis.createdAt.toLocaleDateString()} ·{" "}
            <Link href="/hypotheses">all hypotheses</Link>
          </div>
        </div>
      </div>

      <form action={addRevisionBound} style={{ marginBottom: "2rem" }}>
        <div className="field">
          <label htmlFor="body">New revision</label>
          <textarea
            id="body"
            name="body"
            placeholder="What we believe now, and what changed."
            required
          />
        </div>
        <div className="button-row">
          <button type="submit">Add revision</button>
        </div>
      </form>

      <ul className="timeline">
        {revisions.map((r, i) => (
          <li key={r.id}>
            <div className="meta">
              {r.createdAt.toLocaleString()} {i === 0 && <span>· current</span>}
            </div>
            <div className="body">{r.body}</div>
          </li>
        ))}
      </ul>
    </>
  );
}

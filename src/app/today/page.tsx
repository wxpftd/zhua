import { db } from "@/db/client";
import { entries } from "@/db/schema";
import { addDays, formatLongDate, isValidIsoDate, todayIso } from "@/lib/dates";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function saveEntry(formData: FormData): Promise<void> {
  "use server";
  const date = String(formData.get("date") ?? "");
  if (!isValidIsoDate(date)) {
    throw new Error("Invalid date");
  }
  const notes = String(formData.get("notes") ?? "");
  const decisions = String(formData.get("decisions") ?? "");
  const todos = String(formData.get("todos") ?? "");

  await db
    .insert(entries)
    .values({ date, notes, decisions, todos, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: entries.date,
      set: { notes, decisions, todos, updatedAt: new Date() },
    });

  revalidatePath("/today");
  revalidatePath("/review");
}

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: rawDate } = await searchParams;
  const date = rawDate && isValidIsoDate(rawDate) ? rawDate : todayIso();
  if (rawDate && !isValidIsoDate(rawDate)) {
    redirect("/today");
  }

  const [existing] = await db.select().from(entries).where(eq(entries.date, date)).limit(1);

  const prev = addDays(date, -1);
  const next = addDays(date, 1);
  const isToday = date === todayIso();

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{formatLongDate(date)}</h1>
          <div className="subtitle">{isToday ? "Today" : `${date}`}</div>
        </div>
        <div className="nav-arrows">
          <Link href={`/today?date=${prev}`}>← {prev}</Link>
          {!isToday && <Link href="/today">Today</Link>}
          <Link href={`/today?date=${next}`}>{next} →</Link>
        </div>
      </div>

      <form action={saveEntry}>
        <input type="hidden" name="date" value={date} />

        <div className="field">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            placeholder="What's on your mind. Conversations, signals, half-thoughts."
            defaultValue={existing?.notes ?? ""}
          />
        </div>

        <div className="field">
          <label htmlFor="decisions">Decisions</label>
          <textarea
            id="decisions"
            name="decisions"
            placeholder="What did you decide today, and why."
            defaultValue={existing?.decisions ?? ""}
          />
        </div>

        <div className="field">
          <label htmlFor="todos">TODOs</label>
          <textarea
            id="todos"
            name="todos"
            placeholder="- [ ] one thing&#10;- [ ] another"
            defaultValue={existing?.todos ?? ""}
          />
        </div>

        <div className="button-row">
          <button type="submit">Save</button>
          {existing && (
            <span className="muted">Last saved {existing.updatedAt.toLocaleString()}</span>
          )}
        </div>
      </form>
    </>
  );
}

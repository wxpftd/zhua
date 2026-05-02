import { db } from "@/db/client";
import { entries, weeklyReviews } from "@/db/schema";
import {
  addDays,
  formatLongDate,
  isValidIsoDate,
  mondayOf,
  todayIso,
  weekDates,
} from "@/lib/dates";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const FRIDAY_TEMPLATE = `## What did we ship this week?
-

## What did we learn?
-

## What hypothesis did we move (validated / killed / sharpened)?
-

## What's the single most important thing for next week?
-
`;

async function saveReview(weekStart: string, formData: FormData): Promise<void> {
  "use server";
  if (!isValidIsoDate(weekStart)) throw new Error("Invalid week");
  const body = String(formData.get("body") ?? "");

  await db
    .insert(weeklyReviews)
    .values({ weekStart, body, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: weeklyReviews.weekStart,
      set: { body, updatedAt: new Date() },
    });

  revalidatePath("/review");
}

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week: rawWeek } = await searchParams;
  const weekStart = rawWeek && isValidIsoDate(rawWeek) ? mondayOf(rawWeek) : mondayOf(todayIso());
  if (rawWeek && !isValidIsoDate(rawWeek)) {
    redirect("/review");
  }

  const dates = weekDates(weekStart);
  const weekEnd = dates[dates.length - 1];

  const [weekEntries, [existingReview]] = await Promise.all([
    db.select().from(entries).where(inArray(entries.date, dates)),
    db.select().from(weeklyReviews).where(eq(weeklyReviews.weekStart, weekStart)).limit(1),
  ]);

  const byDate = new Map(weekEntries.map((e) => [e.date, e] as const));
  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);
  const isCurrentWeek = weekStart === mondayOf(todayIso());

  const initialReview = existingReview?.body ?? FRIDAY_TEMPLATE;
  const saveReviewBound = saveReview.bind(null, weekStart);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Week of {formatLongDate(weekStart)}</h1>
          <div className="subtitle">
            {weekStart} → {weekEnd} {isCurrentWeek && "· this week"}
          </div>
        </div>
        <div className="nav-arrows">
          <Link href={`/review?week=${prevWeek}`}>← {prevWeek}</Link>
          {!isCurrentWeek && <Link href="/review">This week</Link>}
          <Link href={`/review?week=${nextWeek}`}>{nextWeek} →</Link>
        </div>
      </div>

      <form action={saveReviewBound} style={{ marginBottom: "2.5rem" }}>
        <div className="field">
          <label htmlFor="body">Friday review</label>
          <textarea
            id="body"
            name="body"
            defaultValue={initialReview}
            style={{ minHeight: "14rem" }}
          />
        </div>
        <div className="button-row">
          <button type="submit">Save review</button>
          {existingReview && (
            <span className="muted">Last saved {existingReview.updatedAt.toLocaleString()}</span>
          )}
        </div>
      </form>

      <h2 style={{ fontSize: "1.1rem", margin: "0 0 1rem" }}>Week's entries</h2>
      {dates.map((date) => {
        const entry = byDate.get(date);
        return (
          <div key={date} className="entry-card">
            <h3>
              <Link href={`/today?date=${date}`}>{formatLongDate(date)}</Link>
            </h3>
            {entry ? (
              <>
                {entry.notes && (
                  <>
                    <div className="section-label">Notes</div>
                    <pre>{entry.notes}</pre>
                  </>
                )}
                {entry.decisions && (
                  <>
                    <div className="section-label">Decisions</div>
                    <pre>{entry.decisions}</pre>
                  </>
                )}
                {entry.todos && (
                  <>
                    <div className="section-label">TODOs</div>
                    <pre>{entry.todos}</pre>
                  </>
                )}
                {!entry.notes && !entry.decisions && !entry.todos && (
                  <span className="muted">(saved but empty)</span>
                )}
              </>
            ) : (
              <span className="muted">no entry</span>
            )}
          </div>
        );
      })}
    </>
  );
}

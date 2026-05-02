import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const entries = sqliteTable("entries", {
  date: text("date").primaryKey(),
  notes: text("notes").notNull().default(""),
  decisions: text("decisions").notNull().default(""),
  todos: text("todos").notNull().default(""),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const weeklyReviews = sqliteTable("weekly_reviews", {
  weekStart: text("week_start").primaryKey(),
  body: text("body").notNull().default(""),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const hypotheses = sqliteTable("hypotheses", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const hypothesisRevisions = sqliteTable("hypothesis_revisions", {
  id: text("id").primaryKey(),
  hypothesisId: text("hypothesis_id")
    .notNull()
    .references(() => hypotheses.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Entry = typeof entries.$inferSelect;
export type WeeklyReview = typeof weeklyReviews.$inferSelect;
export type Hypothesis = typeof hypotheses.$inferSelect;
export type HypothesisRevision = typeof hypothesisRevisions.$inferSelect;

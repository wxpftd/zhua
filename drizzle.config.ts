import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "file:./.data/zhua.db";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
  strict: true,
  verbose: true,
});

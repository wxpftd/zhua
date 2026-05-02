import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

async function main() {
  const url = process.env.DATABASE_URL ?? "file:./.data/zhua.db";
  if (url.startsWith("file:")) {
    const path = url.slice("file:".length).replace(/^\/\//, "");
    await mkdir(dirname(path), { recursive: true });
  }

  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  const db = drizzle(client);

  await migrate(db, { migrationsFolder: "./drizzle" });
  client.close();
  console.log(`✓ migrations applied to ${url}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

# ZHUA — Founder Log

Single-app Next.js 15 + Drizzle + libsql workspace per the v1.1 [thesis](/ZHUA/issues/ZHUA-3#document-thesis).

## Quick start

```sh
pnpm install
cp .env.example .env.local        # adjust BASIC_AUTH_* if you plan to run a non-dev build
pnpm db:migrate                   # creates .data/zhua.db and applies migrations
pnpm dev                          # http://localhost:3000
```

The three screens:

- `/today` — capture notes, decisions, and TODOs against a date.
- `/review` — Friday template that pulls the week's entries.
- `/hypotheses` — running list of "what we believe," with dated revisions.

## Auth gate

Edge middleware (`src/middleware.ts`) requires HTTP basic-auth on every non-development request. It
fails closed if `BASIC_AUTH_USER` or `BASIC_AUTH_PASSWORD` is unset, so a misconfigured Vercel
deploy will return 503 instead of silently serving the Hypothesis Ledger.

Localhost (`pnpm dev`, `NODE_ENV=development`) bypasses the gate.

## Storage

Drizzle ORM over `@libsql/client`. The same code talks to a local SQLite file (`file:./.data/zhua.db`)
and to Turso (`libsql://...`) — only the `DATABASE_URL` env var changes. Vercel's filesystem is
ephemeral, so the deployed instance must point at a Turso (or equivalent) database; see
[CONTRIBUTING.md](./CONTRIBUTING.md) for the deploy story.

## Conventions

- Tests co-located as `*.test.ts(x)`; run with `pnpm test`.
- Lint + format via Biome (`pnpm lint`, `pnpm format`).
- Typecheck with `pnpm typecheck`. CI runs lint → typecheck → test → build.
- Every commit message ends with `Co-Authored-By: Paperclip <noreply@paperclip.ing>`.

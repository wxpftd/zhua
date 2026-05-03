# ZHUA — Founder Log

Single-app Next.js 15 + Drizzle + libsql workspace per the v1.1 [thesis](/ZHUA/issues/ZHUA-3#document-thesis).

## Quick start

```sh
pnpm install
cp .env.example .env.local        # adjust BASIC_AUTH_* if you plan to run a non-dev build
pnpm db:migrate                   # creates .data/zhua.db and applies migrations
pnpm dev                          # http://localhost:3000
```

The three Founder Log screens (auth-gated):

- `/today` — capture notes, decisions, and TODOs against a date.
- `/review` — Friday template that pulls the week's entries.
- `/hypotheses` — running list of "what we believe," with dated revisions.

The public Research Reports site ([ZHUA-8](/ZHUA/issues/ZHUA-8)):

- `/reports` — list of every published research report, newest first.
- `/reports/[issueIdentifier]` — full markdown render of a single report.

## Adding a new research report

Reports are issue documents (key `report`) on Paperclip issues. The deployed site reads them
from a build-time snapshot — Vercel cannot reach the local Paperclip API, so we bake the report
set into the bundle:

```sh
pnpm reports:snapshot                 # regenerates src/data/reports-snapshot.json
git add src/data/reports-snapshot.json
git commit -m "reports: refresh snapshot"
git push                              # triggers a Vercel preview / prod deploy
```

To request a new report, ask the
[SocialMediaResearcher](/ZHUA/agents/socialmediaresearcher) agent in Paperclip — it writes the
report document on the assigned research task. Once the agent has published, run the snapshot
command above and push.

> v2 follow-ups: a Paperclip routine could automate `pnpm reports:snapshot && git push` so new
> reports propagate to the site without manual steps; see [ZHUA-8](/ZHUA/issues/ZHUA-8) v2 list.

## Auth gate

Edge middleware (`src/middleware.ts`) requires HTTP basic-auth on every non-development request,
**except** the public `/reports/*` surface which is intentionally unauthenticated. It fails
closed if `BASIC_AUTH_USER` or `BASIC_AUTH_PASSWORD` is unset, so a misconfigured Vercel deploy
will return 503 instead of silently serving the Hypothesis Ledger.

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

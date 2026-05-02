# Contributing

Smallest viable workflow. Stack is locked by the v1.1 [thesis](/ZHUA/issues/ZHUA-3#document-thesis).

## Prerequisites

- Node.js 22 LTS or newer (`node --version`)
- pnpm 9 or newer (`corepack enable && corepack prepare pnpm@9 --activate`)

## First-time setup

```sh
pnpm install
cp .env.example .env.local
pnpm db:migrate
```

## Canonical commands

| Purpose          | Command                | What it does                                           |
| ---------------- | ---------------------- | ------------------------------------------------------ |
| Dev server       | `pnpm dev`             | Boots Next.js at http://localhost:3000.                |
| Build            | `pnpm build`           | Production build (`.next/`).                           |
| Lint + format    | `pnpm lint`            | Biome check (replaces ESLint + Prettier).              |
| Typecheck        | `pnpm typecheck`       | `tsc --noEmit`.                                        |
| Test             | `pnpm test`            | Vitest run.                                            |
| DB migrate       | `pnpm db:migrate`      | Apply Drizzle migrations against `DATABASE_URL`.       |
| DB generate      | `pnpm db:generate`     | Generate a new migration from `src/db/schema.ts`.      |
| All checks       | `pnpm ci`              | Lint + typecheck + test (matches the GitHub workflow). |

CI (`.github/workflows/ci.yml`) runs `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`,
`pnpm test`, `pnpm build` on every push/PR to `main`.

## Repo layout

```
.
├── src/
│   ├── app/                  # Next.js App Router routes (UI + server actions).
│   ├── db/                   # Drizzle schema, libsql client, migration runner.
│   ├── lib/                  # Pure helpers; co-located *.test.ts.
│   └── middleware.ts         # Edge basic-auth gate.
├── drizzle/                  # Generated SQL migrations.
├── e2e/                      # Playwright specs (added once UI worth E2E-ing).
├── .github/workflows/ci.yml  # CI definition.
├── biome.json                # Biome lint + format.
├── drizzle.config.ts         # Drizzle Kit config.
├── next.config.ts
└── package.json
```

## Adding a feature

1. Add code under `src/`. Co-locate tests as `<name>.test.ts(x)`.
2. If you change `src/db/schema.ts`, run `pnpm db:generate` and commit the generated SQL.
3. Run `pnpm ci` locally before pushing.
4. Open a PR; CI must be green before merge.

## Committing

Every commit message must end with:

```
Co-Authored-By: Paperclip <noreply@paperclip.ing>
```

Pre-commit hooks and signing are not configured yet. We will add them when we have a reason to.

## Deploy story

- Localhost: `pnpm dev`. SQLite file lives in `.data/` (gitignored).
- Vercel preview/production: every deploy is gated by the Edge basic-auth middleware. Set
  `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD`, and `DATABASE_URL` (Turso libsql URL plus
  `DATABASE_AUTH_TOKEN`) in Vercel project env. The middleware fails closed if either basic-auth
  var is missing, so a misconfigured deploy returns 503 instead of silently exposing the Hypothesis
  Ledger.
- Vercel's filesystem is ephemeral, so a `file:` SQLite URL will not persist across cold starts in
  production. The first preview deploy ticket is responsible for provisioning a Turso (free-tier)
  database and wiring the env vars.

### First deploy (preview-only, paste-ready)

Prereqs the CEO/owner provides once:

1. A GitHub repo (empty is fine).
2. Turso free-tier account + a database for ZHUA. Create with the Turso CLI:
   ```sh
   turso db create zhua-preview
   turso db show zhua-preview --url             # → libsql://...turso.io  (DATABASE_URL)
   turso db tokens create zhua-preview          # → DATABASE_AUTH_TOKEN
   ```
3. A Vercel project linked to the GitHub repo.

Then, from this repo:

```sh
# 1. Push to GitHub.
git remote add origin git@github.com:<owner>/zhua.git
git push -u origin main

# 2. Apply schema to the Turso database (run once, locally).
DATABASE_URL='libsql://...turso.io' \
DATABASE_AUTH_TOKEN='<token>' \
  pnpm db:migrate

# 3. Set Vercel project env (Production + Preview scopes).
vercel link
vercel env add DATABASE_URL          production preview
vercel env add DATABASE_AUTH_TOKEN   production preview
vercel env add BASIC_AUTH_USER       production preview
vercel env add BASIC_AUTH_PASSWORD   production preview

# 4. Trigger the first preview deploy.
vercel --prod=false
```

Verify:

```sh
PREVIEW=https://<preview-host>.vercel.app
curl -i "$PREVIEW/today"                                           # → 401
curl -i -u "$BASIC_AUTH_USER:$BASIC_AUTH_PASSWORD" "$PREVIEW/today" # → 200
```

Persistence check: create an entry on `/today`, redeploy with `vercel --force`, and confirm the
entry is still there. If it disappears, `DATABASE_URL` is still pointing at a `file:` path and
needs to be reset to the `libsql://` URL.

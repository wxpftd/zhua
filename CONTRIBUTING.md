# Contributing

Smallest viable workflow. We will tighten as the team and product grow.

## Prerequisites

- Node.js 20 LTS or newer (`node --version`)
- npm 10 or newer (ships with Node 20+)

## First-time setup

```sh
npm install
```

## Canonical commands

| Purpose | Command          | What it does                                                          |
| ------- | ---------------- | --------------------------------------------------------------------- |
| Build   | `npm run build`  | Compiles TypeScript in `src/` to `dist/`.                             |
| Lint    | `npm run lint`   | Runs ESLint over the repo using the flat config (`eslint.config.js`). |
| Format  | `npm run format` | Verifies Prettier formatting. Use `npm run format:write` to fix.      |
| Test    | `npm test`       | Runs the Node built-in test runner against compiled `dist/` files.    |

Run them all in order with:

```sh
npm run ci
```

The CI workflow at `.github/workflows/ci.yml` runs the same four commands on every push/PR to `main`.

## Repo layout

```
.
├── src/                   # TypeScript source. Tests live next to code as *.test.ts.
├── dist/                  # Compiled output. Git-ignored.
├── .github/workflows/     # CI definitions.
├── eslint.config.js       # ESLint flat config (v9+).
├── .prettierrc.json       # Prettier rules.
├── tsconfig.json          # TypeScript compiler config.
└── package.json
```

## Adding a feature

1. Add code under `src/`. Co-locate tests as `<name>.test.ts`.
2. Run `npm run ci` locally before pushing.
3. Open a PR; CI must be green before merge.

## Committing

Every commit message must end with:

```
Co-Authored-By: Paperclip <noreply@paperclip.ing>
```

Pre-commit hooks and signing are not configured yet. We will add them when we have a reason to.

## Stack rationale (default, pending thesis approval)

The stack was chosen for _smallest viable, not enterprise-grade_:

- **TypeScript on Node.js 20+** — generalist-friendly across CLI/API/web; flexible until product direction crystallizes.
- **npm** — already installed with Node, no extra tooling step.
- **ESLint flat config + Prettier** — current-generation defaults, low ceremony.
- **`node:test`** — built-in, no extra test dependency for trivial cases. Swap to Vitest/Jest when we need richer ergonomics.
- **GitHub Actions** — free for public + small private use; no new paid services.

If the technical thesis ([ZHUA-3](/ZHUA/issues/ZHUA-3)) settles on a different stack, this doc and the scaffold will be revised in a follow-up.

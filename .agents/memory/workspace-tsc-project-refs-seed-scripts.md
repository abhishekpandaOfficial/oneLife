---
name: tsx not globally available; tsc project references read stale dist types
description: One-off seed/utility scripts in this pnpm monorepo need a runner that's actually installed, and tsc --noEmit with project references can silently use stale built .d.ts files from referenced packages.
---

`tsx` is not installed at the workspace root or guaranteed available in every package (e.g. `artifacts/api-server` didn't have it as a dependency, so `node scripts/seed.ts` / `tsx scripts/seed.ts` fails with module-not-found style errors). Plain Node also can't `import` a package (e.g. `pg`) unless the *directory you run from* has that package as a resolvable dependency — pnpm's strict node_modules isolation means a script placed in a package without `pg` as a dep won't resolve it even if some other workspace package has it.

**Why:** avoids trial-and-error hunting for a TS runner; write throwaway data scripts as plain `.mjs` and place/run them from a package that already depends on the runtime libraries needed (e.g. `lib/db`, which depends on `pg`).

**How to apply:** for one-off seed/migration scripts, write plain `.mjs` using only packages already a dependency of the directory you run `node` from — no TS loader needed. Separately: packages using TS project references (`"references": [...]` + `composite`) have `tsc --noEmit` read the *referenced* package's built `dist/*.d.ts`, not its source — after editing a referenced package's schema/types, run `tsc -b` on that package (or clear `.tsbuildinfo` files) before re-typechecking downstream packages, or you'll see confusing stale-type errors that don't match the current source.

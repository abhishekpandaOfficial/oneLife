# OneLife Finance

## Overview
OneLife Finance is a personal finance management SaaS: dashboard, income/expense tracking, loans & EMI tracking, insurance, investments, savings goals, budget planner, transactions, and reports.

The original spec described an ASP.NET/Bootstrap app. This workspace only supports the pnpm monorepo stack (React+Vite, Express 5, Drizzle+Postgres, OpenAPI/Orval codegen), so the product requirements were translated onto that stack rather than literally implemented in .NET.

## Architecture
- `artifacts/onelife-finance` — React + Vite frontend (all pages: Dashboard, Income, Expenses, Transactions, Loans, Insurance, Investments, Goals, Budget, Reports, Categories, Settings).
- `artifacts/api-server` — Express 5 backend exposing REST endpoints for all entities plus dashboard/report aggregation.
- `lib/api-spec/openapi.yaml` — source of truth for the API surface; run `pnpm --filter @workspace/api-spec run codegen` after editing to regenerate the typed client (`@workspace/api-client-react`) and Zod schemas (`@workspace/api-zod`).
- `lib/db/src/schema/` — Drizzle schema (categories, transactions, loans, emis, insurances, investments, goals, budgets). Run `pnpm --filter @workspace/db run push` after schema changes.
- `lib/db/seed.mjs` — one-time seed script (plain Node + `pg`, not `tsx`) that populates realistic sample data across all tables. Skips seeding if `categories` already has rows. Run with `node lib/db/seed.mjs` from the repo root or `lib/db` dir (needs `DATABASE_URL`).

## Key decisions
- Income and Expenses pages are filtered views over a single unified `transactions` table (`type: income|expense`), not separate entities.
- All money columns use Drizzle's `numeric(..., { mode: "number" })` so the API returns/accepts plain JS numbers — Postgres `numeric` otherwise round-trips as strings and breaks the generated Zod response validation.
- Loan `monthsRemaining` is a pragmatic proxy: count of that loan's non-paid EMI rows, not a strict amortization calculation.
- Net worth = investment value + total goal savings − total loan outstanding.
- Report `netWorthTrend` is an approximation derived from the income/expense trend (no historical net-worth ledger exists yet).

## Known non-blocking issue
Orval generates `zod.date()` (non-coercing) instead of `zod.coerce.date()` for OpenAPI `format: date` query parameters. The `transactions` list route works around this by parsing `from`/`to` manually in the route handler rather than trusting the generated schema for those two params.

## User preferences
None recorded yet.

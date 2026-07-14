---
name: Postgres SSL mode detection
description: How to correctly decide whether a pg Pool connection should use SSL across Replit-managed and external (Neon/Supabase) Postgres.
---

Don't hardcode `ssl: isLocalhost ? false : { rejectUnauthorized: false }` for a Postgres pool. Replit's own managed Postgres uses a non-localhost hostname but explicitly sets `sslmode=disable` in `DATABASE_URL` and rejects TLS connections outright ("The server does not support SSL connections").

**Why:** connection strings from different providers set `sslmode` explicitly (Replit: `disable`; Neon/Supabase/most managed cloud Postgres: `require`). Guessing from hostname patterns breaks whichever provider you didn't anticipate.

**How to apply:** parse the `sslmode` query param out of `DATABASE_URL` before stripping it, and let it decide: `disable` → `ssl: false`; `require`/`verify-full`/`verify-ca` → `ssl: { rejectUnauthorized: false }` (or stricter); otherwise fall back to a localhost check. Strip the param from the string passed to `pg.Pool` so `pg-connection-string` doesn't fight the explicit `ssl` option.

---
name: Orval generates non-coercing zod.date() for date-format query params
description: OpenAPI query params with format:date generate zod.date() (not zod.coerce.date()) via Orval's zod client, which rejects incoming string query values at runtime.
---

When an OpenAPI parameter is declared as `type: string, format: date` and used as a query parameter, Orval's Zod codegen (`@workspace/api-zod`) emits `z.date()` for it instead of `z.coerce.date()`. Express query params always arrive as strings, so `Schema.safeParse(req.query)` fails with `invalid_type: expected date, received string` even though the value is a valid date string.

**Why:** body/path params of the same `format: date` type generally get correctly coerced or are handled as plain strings elsewhere in the generated schema; it's specifically the query-param date case that stays non-coercing, and it hasn't been traced to a specific Orval config flag yet.

**How to apply:** don't trust the generated Zod schema for `format: date` query params. Read the raw string from `req.query`, convert manually (e.g. `new Date(rawString)` then re-format), and skip/relax that field in the schema's `safeParse` step. Revisit if Orval's zod config gets updated — this may be fixable at the codegen config level instead of per-route.

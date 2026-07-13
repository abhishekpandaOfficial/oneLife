---
name: Drizzle numeric columns return strings by default
description: Postgres numeric/decimal columns come back as strings from drizzle-orm unless mode: "number" is set; this breaks Zod-validated API responses for money fields.
---

Drizzle's `numeric()`/`decimal()` pg-core column type defaults to returning JS strings (to avoid float precision loss), even though the underlying value is numeric. If API routes build Zod response schemas from an OpenAPI spec where money fields are typed as `number`, `Schema.parse(row)` will throw `ZodError: Expected number, received string` for every numeric column at runtime — this only surfaces when the route is actually hit, not at typecheck time (with `{mode: "string"}` or default mode the column type is `string` throughout).

**Why:** the mismatch is invisible until you hit the endpoint; typecheck alone won't catch the coming ZodError since the column type does match the DB layer's own type declaration.

**How to apply:** declare every money/decimal column as `numeric("col_name", { precision, scale, mode: "number" })`. This makes drizzle coerce to/from JS `number` automatically — insert/update code can pass and mutation code can read plain numbers, no manual `String(x)` / `Number(x)` wrapping needed anywhere in route code. After changing a schema file's column modes, remember downstream packages with TS project references may still see stale types until you rebuild that package (`tsc -b`), not just `db push`.

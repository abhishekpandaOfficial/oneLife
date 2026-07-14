import { Router } from "express";
import { pool } from "@workspace/db";
const router = Router();
router.get("/db/info", async (_req, res) => {
    try {
        const client = await pool.connect();
        const [versionRow, tablesRow] = await Promise.all([
            client.query("SELECT version()"),
            client.query(`
        SELECT
          t.table_name,
          COALESCE(s.n_live_tup, 0)::text AS row_count,
          COALESCE(pg_total_relation_size(quote_ident(t.table_name)), 0)::text AS size_bytes,
          pg_size_pretty(COALESCE(pg_total_relation_size(quote_ident(t.table_name)), 0)) AS size_human
        FROM information_schema.tables t
        LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
      `),
        ]);
        client.release();
        const connStr = process.env.DATABASE_URL ?? "";
        // parse host/db safely without leaking credentials
        let host = "supabase";
        let database = "postgres";
        try {
            const url = new URL(connStr);
            host = url.hostname;
            database = url.pathname.replace("/", "");
        }
        catch {
            /* ignore parse errors */
        }
        const tables = tablesRow.rows.map((r) => ({
            name: r.table_name,
            rowCount: parseInt(r.row_count, 10),
            sizeBytes: parseInt(r.size_bytes, 10),
            sizeHuman: r.size_human,
        }));
        const info = {
            status: "connected",
            host,
            database,
            version: versionRow.rows[0]?.version ?? "Unknown",
            tables,
            lastChecked: new Date().toISOString(),
        };
        res.json(info);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({
            status: "error",
            host: "unknown",
            database: "unknown",
            version: "unknown",
            tables: [],
            lastChecked: new Date().toISOString(),
            error: message,
        });
    }
});
router.post("/db/sync", async (_req, res) => {
    try {
        const client = await pool.connect();
        // Run ANALYZE to refresh pg_stat_user_tables row count estimates
        await client.query("ANALYZE");
        client.release();
        res.json({ success: true, message: "Database statistics refreshed successfully." });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ success: false, message });
    }
});
router.post("/db/clear", async (_req, res) => {
    try {
        const client = await pool.connect();
        await client.query("BEGIN");
        await client.query("TRUNCATE TABLE budgets, emis, goals, insurances, investments, loans, transactions, categories CASCADE");
        await client.query("COMMIT");
        client.release();
        res.json({ success: true, message: "All database tables cleared successfully. Ready for production data." });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ success: false, message: message });
    }
});
export default router;

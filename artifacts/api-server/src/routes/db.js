import { Router } from "express";
import { pool } from "@workspace/db";
const router = Router();
const TABLE_MODULE_META = {
    categories: {
        module: "OneFinance",
        moduleKey: "finance",
        label: "Categories",
        feature: "Income and expense taxonomy",
        description: "Shared category list used by transactions and budgets.",
        color: "emerald",
        status: "live",
    },
    transactions: {
        module: "OneFinance",
        moduleKey: "finance",
        label: "Transactions",
        feature: "Income and expenses",
        description: "All money movement records, recurring flags, dates, and category links.",
        color: "emerald",
        status: "live",
    },
    loans: {
        module: "OneFinance",
        moduleKey: "finance",
        label: "Loans",
        feature: "Debt tracking",
        description: "Loan principals, outstanding balances, rates, banks, documents, and status.",
        color: "orange",
        status: "live",
    },
    emis: {
        module: "OneFinance",
        moduleKey: "finance",
        label: "EMIs",
        feature: "Loan payments",
        description: "Installment schedules, due dates, payment status, penalties, and overdue days.",
        color: "amber",
        status: "live",
    },
    credit_cards: {
        module: "OneFinance",
        moduleKey: "finance",
        label: "Credit Cards",
        feature: "Credit liabilities",
        description: "Card limits, outstanding amounts, due dates, and minimum dues.",
        color: "rose",
        status: "live",
    },
    insurances: {
        module: "OneFinance",
        moduleKey: "finance",
        label: "Insurances",
        feature: "Protection",
        description: "Policies, providers, premiums, coverage, renewal dates, and status.",
        color: "cyan",
        status: "live",
    },
    investments: {
        module: "OneFinance",
        moduleKey: "finance",
        label: "Investments",
        feature: "Assets",
        description: "Investment positions, invested amounts, current value, purchase date, and XIRR.",
        color: "teal",
        status: "live",
    },
    goals: {
        module: "OneFinance",
        moduleKey: "finance",
        label: "Goals",
        feature: "Savings goals",
        description: "Target amounts, progress, goal type, and target dates.",
        color: "pink",
        status: "live",
    },
    budgets: {
        module: "OneFinance",
        moduleKey: "finance",
        label: "Budgets",
        feature: "Monthly planning",
        description: "Category-level planned monthly amounts synced with spending.",
        color: "indigo",
        status: "live",
    },
    onework_profile: {
        module: "OneWork",
        moduleKey: "work",
        label: "Work Profile",
        feature: "EPFO identity",
        description: "UAN, EPFO member ID, and last sync metadata.",
        color: "blue",
        status: "live",
    },
    work_companies: {
        module: "OneWork",
        moduleKey: "work",
        label: "Companies",
        feature: "Career history",
        description: "Company timeline, role, salary, PF settings, logos, and notes.",
        color: "blue",
        status: "live",
    },
    work_document_folders: {
        module: "OneWork",
        moduleKey: "work",
        label: "Document Folders",
        feature: "Company folders",
        description: "Folders scoped to companies for payslips, letters, tax docs, and records.",
        color: "violet",
        status: "live",
    },
    work_document_categories: {
        module: "OneWork",
        moduleKey: "work",
        label: "Document Categories",
        feature: "Document taxonomy",
        description: "Reusable labels, colors, and icons for work documents.",
        color: "slate",
        status: "live",
    },
    work_documents: {
        module: "OneWork",
        moduleKey: "work",
        label: "Documents",
        feature: "Work file vault",
        description: "Uploaded work files, document dates, category links, folders, and notes.",
        color: "blue",
        status: "live",
    },
    work_pf_entries: {
        module: "OneWork",
        moduleKey: "work",
        label: "PF Entries",
        feature: "PF ledger",
        description: "Monthly employee, employer, and interest PF contribution rows.",
        color: "emerald",
        status: "live",
    },
    work_pf_withdrawals: {
        module: "OneWork",
        moduleKey: "work",
        label: "PF Withdrawals",
        feature: "PF withdrawals",
        description: "PF withdrawal amounts, dates, reasons, and linked company context.",
        color: "red",
        status: "live",
    },
    social_campaigns: {
        module: "OneSocial",
        moduleKey: "social",
        label: "Campaigns",
        feature: "Content campaigns",
        description: "Campaign objectives, themes, timelines, progress, and status.",
        color: "rose",
        status: "live",
    },
    social_content_items: {
        module: "OneSocial",
        moduleKey: "social",
        label: "Content Items",
        feature: "Master content workspace",
        description: "Ideas, drafts, articles, newsletters, status, approval, topics, SEO, and AI metadata.",
        color: "rose",
        status: "live",
    },
    social_platform_versions: {
        module: "OneSocial",
        moduleKey: "social",
        label: "Platform Versions",
        feature: "Platform adaptation",
        description: "Optimized content variants for LinkedIn, Substack, Medium, Twitter/X, and Instagram.",
        color: "cyan",
        status: "live",
    },
    social_publish_queue: {
        module: "OneSocial",
        moduleKey: "social",
        label: "Publishing Queue",
        feature: "Scheduling and publishing",
        description: "Scheduled, queued, retrying, published, missed, and failed publishing jobs.",
        color: "indigo",
        status: "live",
    },
    social_connectors: {
        module: "OneSocial",
        moduleKey: "social",
        label: "Connectors",
        feature: "Platform integrations",
        description: "Connector status, health, tier priority, account metadata, and auth readiness.",
        color: "emerald",
        status: "live",
    },
    social_hashtags: {
        module: "OneSocial",
        moduleKey: "social",
        label: "Hashtags",
        feature: "Hashtag intelligence",
        description: "Hashtag categories, platform fit, popularity, trending score, and performance.",
        color: "amber",
        status: "live",
    },
    social_analytics: {
        module: "OneSocial",
        moduleKey: "social",
        label: "Analytics",
        feature: "Content performance",
        description: "Impressions, reach, engagement, clicks, shares, and follower growth snapshots.",
        color: "violet",
        status: "live",
    },
    social_ai_suggestions: {
        module: "OneSocial",
        moduleKey: "social",
        label: "AI Suggestions",
        feature: "AI content intelligence",
        description: "Topic, SEO, repurposing, hashtag, schedule, and content-gap recommendations.",
        color: "fuchsia",
        status: "live",
    },
    social_activity: {
        module: "OneSocial",
        moduleKey: "social",
        label: "Activity",
        feature: "Audit timeline",
        description: "Content operations event stream for creation, scheduling, publishing, and connector checks.",
        color: "slate",
        status: "live",
    },
};
const PLANNED_MODULES = [
    {
        module: "OneWork",
        moduleKey: "work",
        tables: [
            "work_salary_history",
            "work_hike_history",
            "work_bonus_history",
            "work_projects",
            "work_skills",
            "work_certifications",
            "work_timeline_events",
            "work_document_versions",
            "work_share_links",
            "work_audit_events",
        ],
    },
    {
        module: "OneSocial",
        moduleKey: "social",
        tables: [
            "social_media_assets",
            "social_brand_profiles",
            "social_automation_rules",
            "social_notifications",
            "social_comments",
            "social_revision_history",
            "social_approval_comments",
            "social_webhooks",
        ],
    },
    { module: "OneHealth", moduleKey: "health", tables: ["health_members", "health_records", "health_medicines", "health_appointments"] },
    { module: "OneNote", moduleKey: "note", tables: ["note_entries", "note_collections", "note_resources"] },
    { module: "OneIdea", moduleKey: "idea", tables: ["idea_entries", "idea_experiments", "idea_roadmap"] },
    { module: "OneTravel", moduleKey: "travel", tables: ["travel_trips", "travel_places", "travel_documents"] },
];
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
        const tables = tablesRow.rows.map((r) => {
            const meta = TABLE_MODULE_META[r.table_name] ?? {
                module: "System",
                moduleKey: "system",
                label: r.table_name,
                feature: "Database table",
                description: "Table discovered in the public schema.",
                color: "slate",
                status: "system",
            };
            return {
                name: r.table_name,
                rowCount: parseInt(r.row_count, 10),
                sizeBytes: parseInt(r.size_bytes, 10),
                sizeHuman: r.size_human,
                ...meta,
            };
        });
        const moduleMap = new Map();
        for (const table of tables) {
            const existing = moduleMap.get(table.moduleKey) ?? {
                module: table.module,
                moduleKey: table.moduleKey,
                tableCount: 0,
                rowCount: 0,
                sizeBytes: 0,
                sizeHuman: "0 bytes",
                status: table.status === "planned" ? "planned" : "live",
            };
            existing.tableCount += 1;
            existing.rowCount += table.rowCount;
            existing.sizeBytes += table.sizeBytes;
            existing.sizeHuman = `${existing.sizeBytes.toLocaleString()} bytes`;
            existing.status = "live";
            moduleMap.set(table.moduleKey, existing);
        }
        for (const planned of PLANNED_MODULES) {
            const existing = moduleMap.get(planned.moduleKey);
            if (existing) {
                existing.plannedTables = [...planned.tables];
                moduleMap.set(planned.moduleKey, existing);
            }
            else {
                moduleMap.set(planned.moduleKey, {
                    module: planned.module,
                    moduleKey: planned.moduleKey,
                    tableCount: 0,
                    rowCount: 0,
                    sizeBytes: 0,
                    sizeHuman: "0 bytes",
                    status: "planned",
                    plannedTables: [...planned.tables],
                });
            }
        }
        const info = {
            status: "connected",
            host,
            database,
            version: versionRow.rows[0]?.version ?? "Unknown",
            tables,
            modules: [...moduleMap.values()],
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
            modules: [],
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

import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

const TABLE_MODULE_META: Record<string, {
  module: "OneFinance" | "OneWork" | "OneSocial" | "OneHealth" | "OneNote" | "OneIdea" | "OneTravel" | "System";
  moduleKey: "finance" | "work" | "social" | "health" | "note" | "idea" | "travel" | "system";
  label: string;
  feature: string;
  description: string;
  color: string;
  status: "live" | "planned" | "system";
}> = {
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
};

const PLANNED_MODULES = [
  { module: "OneSocial", moduleKey: "social", tables: ["social_people", "social_circles", "social_followups"] },
  { module: "OneHealth", moduleKey: "health", tables: ["health_members", "health_records", "health_medicines", "health_appointments"] },
  { module: "OneNote", moduleKey: "note", tables: ["note_entries", "note_collections", "note_resources"] },
  { module: "OneIdea", moduleKey: "idea", tables: ["idea_entries", "idea_experiments", "idea_roadmap"] },
  { module: "OneTravel", moduleKey: "travel", tables: ["travel_trips", "travel_places", "travel_documents"] },
] as const;

interface TableInfo {
  name: string;
  rowCount: number;
  sizeBytes: number;
  sizeHuman: string;
  module: string;
  moduleKey: string;
  label: string;
  feature: string;
  description: string;
  color: string;
  status: "live" | "planned" | "system";
}

interface DbInfo {
  status: "connected" | "error";
  host: string;
  database: string;
  version: string;
  tables: TableInfo[];
  modules: Array<{
    module: string;
    moduleKey: string;
    tableCount: number;
    rowCount: number;
    sizeBytes: number;
    sizeHuman: string;
    status: "live" | "planned";
    plannedTables?: string[];
  }>;
  lastChecked: string;
  error?: string;
}

router.get("/db/info", async (_req, res): Promise<void> => {
  try {
    const client = await pool.connect();

    const [versionRow, tablesRow] = await Promise.all([
      client.query<{ version: string }>("SELECT version()"),
      client.query<{
        table_name: string;
        row_count: string;
        size_bytes: string;
        size_human: string;
      }>(`
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
    } catch {
      /* ignore parse errors */
    }

    const tables: TableInfo[] = tablesRow.rows.map((r) => {
      const meta = TABLE_MODULE_META[r.table_name] ?? {
        module: "System" as const,
        moduleKey: "system" as const,
        label: r.table_name,
        feature: "Database table",
        description: "Table discovered in the public schema.",
        color: "slate",
        status: "system" as const,
      };
      return {
        name: r.table_name,
        rowCount: parseInt(r.row_count, 10),
        sizeBytes: parseInt(r.size_bytes, 10),
        sizeHuman: r.size_human,
        ...meta,
      };
    });

    const moduleMap = new Map<string, DbInfo["modules"][number]>();
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
      if (!moduleMap.has(planned.moduleKey)) {
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

    const info: DbInfo = {
      status: "connected",
      host,
      database,
      version: versionRow.rows[0]?.version ?? "Unknown",
      tables,
      modules: [...moduleMap.values()],
      lastChecked: new Date().toISOString(),
    };

    res.json(info);
  } catch (err: unknown) {
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
    } satisfies DbInfo);
  }
});

router.post("/db/sync", async (_req, res): Promise<void> => {
  try {
    const client = await pool.connect();
    // Run ANALYZE to refresh pg_stat_user_tables row count estimates
    await client.query("ANALYZE");
    client.release();
    res.json({ success: true, message: "Database statistics refreshed successfully." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, message });
  }
});

router.post("/db/clear", async (_req, res): Promise<void> => {
  try {
    const client = await pool.connect();
    await client.query("BEGIN");
    await client.query("TRUNCATE TABLE budgets, emis, goals, insurances, investments, loans, transactions, categories CASCADE");
    await client.query("COMMIT");
    client.release();
    res.json({ success: true, message: "All database tables cleared successfully. Ready for production data." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, message: message });
  }
});

export default router;

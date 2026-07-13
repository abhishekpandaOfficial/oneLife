import React, { useState, useCallback } from "react";
import {
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  ChevronRight,
  Play,
  Server,
  Globe,
  Code2,
  Timer,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EndpointDef {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  label: string;
  description: string;
  group: string;
  sampleBody?: Record<string, unknown>;
}

interface TestResult {
  status: number | null;
  ok: boolean | null;
  latencyMs: number | null;
  responseSnippet: string;
  testedAt: string | null;
  error?: string;
}

// ─── All registered API endpoints ────────────────────────────────────────────

const ENDPOINTS: EndpointDef[] = [
  // Health
  { method: "GET",  path: "/api/healthz",           label: "Health Check",         description: "Returns API liveness status.",          group: "Health" },
  // Dashboard
  { method: "GET",  path: "/api/dashboard/summary", label: "Dashboard Summary",    description: "Aggregated financial KPIs.",            group: "Dashboard" },
  // Transactions
  { method: "GET",  path: "/api/transactions",      label: "List Transactions",    description: "All transactions with filters.",        group: "Transactions" },
  { method: "POST", path: "/api/transactions",      label: "Create Transaction",   description: "Add a new income/expense transaction.", group: "Transactions",
    sampleBody: { type: "expense", amount: "500", description: "Test expense", categoryId: 1, date: new Date().toISOString().slice(0,10) }
  },
  // Categories
  { method: "GET",  path: "/api/categories",        label: "List Categories",      description: "All expense/income categories.",        group: "Categories" },
  // Loans
  { method: "GET",  path: "/api/loans",             label: "List Loans",           description: "All active loans.",                     group: "Loans" },
  // EMIs
  { method: "GET",  path: "/api/emis",              label: "List EMIs",            description: "All EMI schedules.",                    group: "EMIs" },
  // Insurances
  { method: "GET",  path: "/api/insurances",        label: "List Insurances",      description: "All insurance policies.",               group: "Insurance" },
  // Investments
  { method: "GET",  path: "/api/investments",       label: "List Investments",     description: "All investment records.",               group: "Investments" },
  // Goals
  { method: "GET",  path: "/api/goals",             label: "List Goals",           description: "All financial goals.",                  group: "Goals" },
  // Budgets
  { method: "GET",  path: "/api/budgets",           label: "List Budgets",         description: "All budget entries.",                   group: "Budgets" },
  // Reports
  { method: "GET",  path: "/api/reports/summary",   label: "Reports Summary",      description: "Income vs expense report summary.",     group: "Reports" },
  // DB
  { method: "GET",  path: "/api/db/info",           label: "DB Info",              description: "Database connection & table stats.",    group: "System" },
  { method: "POST", path: "/api/db/sync",           label: "DB Sync / Refresh",    description: "Re-run ANALYZE to refresh row counts.", group: "System" },
];

const METHOD_COLORS: Record<string, string> = {
  GET:    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  POST:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  PUT:    "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  PATCH:  "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  DELETE: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

const STATUS_COLOR = (status: number | null) => {
  if (status === null) return "text-muted-foreground";
  if (status < 300) return "text-emerald-500";
  if (status < 400) return "text-yellow-500";
  return "text-red-500";
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ApiMonitor() {
  const { toast } = useToast();
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testingAll, setTestingAll] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [expandedPath, setExpandedPath] = useState<string | null>(null);

  const groups = ["All", ...Array.from(new Set(ENDPOINTS.map(e => e.group)))];

  const testEndpoint = useCallback(async (ep: EndpointDef): Promise<TestResult> => {
    const start = performance.now();
    try {
      const opts: RequestInit = { method: ep.method, headers: { "Content-Type": "application/json" } };
      if (ep.sampleBody && (ep.method === "POST" || ep.method === "PUT" || ep.method === "PATCH")) {
        opts.body = JSON.stringify(ep.sampleBody);
      }
      const res = await fetch(ep.path, opts);
      const latencyMs = Math.round(performance.now() - start);
      let text = "";
      try { text = await res.text(); } catch { text = "(no body)"; }
      let snippet = text.length > 200 ? text.slice(0, 200) + "…" : text;
      // Pretty-print if JSON
      try { snippet = JSON.stringify(JSON.parse(text), null, 2); if (snippet.length > 400) snippet = snippet.slice(0, 400) + "\n…"; } catch { /* not json */ }

      return { status: res.status, ok: res.ok, latencyMs, responseSnippet: snippet, testedAt: new Date().toLocaleTimeString() };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return { status: null, ok: false, latencyMs, responseSnippet: "", testedAt: new Date().toLocaleTimeString(), error: err?.message ?? "Network error" };
    }
  }, []);

  const handleTest = useCallback(async (ep: EndpointDef) => {
    const key = `${ep.method}:${ep.path}`;
    setTesting(t => ({ ...t, [key]: true }));
    setExpandedPath(ep.path);
    const result = await testEndpoint(ep);
    setResults(r => ({ ...r, [key]: result }));
    setTesting(t => ({ ...t, [key]: false }));
    toast({
      title: result.ok ? `✅ ${ep.label} — ${result.status}` : `❌ ${ep.label} failed`,
      description: result.ok ? `Responded in ${result.latencyMs}ms` : result.error ?? `HTTP ${result.status}`,
      variant: result.ok ? "default" : "destructive",
    });
  }, [testEndpoint, toast]);

  const handleTestAll = useCallback(async () => {
    setTestingAll(true);
    const visible = selectedGroup === "All" ? ENDPOINTS : ENDPOINTS.filter(e => e.group === selectedGroup);
    for (const ep of visible) {
      const key = `${ep.method}:${ep.path}`;
      setTesting(t => ({ ...t, [key]: true }));
      const result = await testEndpoint(ep);
      setResults(r => ({ ...r, [key]: result }));
      setTesting(t => ({ ...t, [key]: false }));
      // Small delay between requests to avoid rate-limiting
      await new Promise(res => setTimeout(res, 150));
    }
    setTestingAll(false);
    toast({ title: "✅ All endpoints tested", description: "Check results below." });
  }, [selectedGroup, testEndpoint, toast]);

  const visible = selectedGroup === "All" ? ENDPOINTS : ENDPOINTS.filter(e => e.group === selectedGroup);

  // Summary stats
  const allResults = Object.values(results);
  const passing = allResults.filter(r => r.ok).length;
  const failing = allResults.filter(r => r.ok === false).length;
  const avgLatency = allResults.filter(r => r.latencyMs !== null).reduce((s, r) => s + (r.latencyMs ?? 0), 0) / (allResults.filter(r => r.latencyMs !== null).length || 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            API Monitor
          </h1>
          <p className="text-muted-foreground mt-1">Test all backend endpoints and check response times.</p>
        </div>
        <Button
          onClick={handleTestAll}
          disabled={testingAll}
          className="gap-2"
          size="lg"
        >
          {testingAll ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {testingAll ? "Testing all…" : "Test All Endpoints"}
        </Button>
      </div>

      {/* Summary Cards */}
      {allResults.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{passing}</p>
                  <p className="text-xs text-muted-foreground">Passing</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-red-500/10 to-red-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{failing}</p>
                  <p className="text-xs text-muted-foreground">Failing</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Timer className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{Math.round(avgLatency)}<span className="text-sm font-normal">ms</span></p>
                  <p className="text-xs text-muted-foreground">Avg Latency</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-primary">{allResults.length}</p>
                  <p className="text-xs text-muted-foreground">Tested</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Group Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {groups.map(g => (
          <button
            key={g}
            onClick={() => setSelectedGroup(g)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all border",
              selectedGroup === g
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Endpoint Cards */}
      <div className="space-y-3">
        {visible.map((ep) => {
          const key = `${ep.method}:${ep.path}`;
          const result = results[key];
          const isTesting = testing[key];
          const isExpanded = expandedPath === ep.path;

          return (
            <Card
              key={key}
              className={cn(
                "rounded-2xl border transition-all duration-200",
                result?.ok === true  && "border-emerald-500/30 bg-emerald-500/5",
                result?.ok === false && "border-red-500/30 bg-red-500/5",
                !result && "border-border"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Method badge */}
                  <Badge
                    variant="outline"
                    className={cn("font-mono text-xs font-bold px-2 py-0.5 shrink-0", METHOD_COLORS[ep.method])}
                  >
                    {ep.method}
                  </Badge>

                  {/* Path */}
                  <code className="text-sm font-mono text-foreground flex-1 min-w-0 truncate">{ep.path}</code>

                  {/* Status */}
                  {result && (
                    <div className="flex items-center gap-2 shrink-0">
                      {result.ok ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={cn("text-sm font-bold font-mono", STATUS_COLOR(result.status))}>
                        {result.status ?? "ERR"}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />{result.latencyMs}ms
                      </span>
                      <span className="text-[10px] text-muted-foreground">{result.testedAt}</span>
                    </div>
                  )}

                  {/* Test Button */}
                  <Button
                    size="sm"
                    variant={result?.ok ? "outline" : "default"}
                    className="shrink-0 gap-1.5 h-8 px-3"
                    onClick={() => handleTest(ep)}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                    {isTesting ? "Testing…" : "Test"}
                  </Button>

                  {/* Expand toggle */}
                  {result && (
                    <button
                      onClick={() => setExpandedPath(isExpanded ? null : ep.path)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
                    </button>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground mt-2 ml-1">{ep.description}</p>

                {/* Expanded response */}
                {isExpanded && result && (
                  <div className="mt-3 rounded-xl bg-muted/50 border p-3 overflow-auto max-h-64">
                    {result.error ? (
                      <p className="text-red-500 text-sm font-medium">{result.error}</p>
                    ) : (
                      <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all leading-relaxed">
                        {result.responseSnippet}
                      </pre>
                    )}
                  </div>
                )}

                {/* Sample body if POST */}
                {ep.sampleBody && isExpanded && (
                  <div className="mt-2 rounded-xl bg-primary/5 border border-primary/10 p-3">
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                      <Code2 className="h-3 w-3" /> Sample Request Body
                    </p>
                    <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
                      {JSON.stringify(ep.sampleBody, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-4">
        <Globe className="h-3.5 w-3.5" />
        <span>All tests run against <code className="font-mono bg-muted px-1 py-0.5 rounded">{window.location.origin}/api</code></span>
        <Server className="h-3.5 w-3.5 ml-2" />
        <span>Express.js on Vercel Serverless</span>
      </div>
    </div>
  );
}

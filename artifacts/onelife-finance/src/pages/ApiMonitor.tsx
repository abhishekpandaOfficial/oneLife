import React, { useCallback, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Database,
  Globe,
  Landmark,
  Layers3,
  Play,
  RefreshCw,
  Server,
  Timer,
  XCircle,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getGlobalRates } from "@/components/ui/animated-number";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface EndpointDef {
  method: ApiMethod;
  path: string;
  label: string;
  description: string;
  sampleBody?: Record<string, unknown>;
  safe?: boolean;
  expectedStatuses?: number[];
}

interface EndpointGroup {
  name: string;
  description: string;
  endpoints: EndpointDef[];
}

interface ApiModule {
  id: "system" | "onefinance" | "onework";
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ElementType;
  tone: string;
  groups: EndpointGroup[];
}

interface RegisteredEndpoint extends EndpointDef {
  moduleId: ApiModule["id"];
  moduleLabel: string;
  group: string;
}

interface TestResult {
  status: number | null;
  ok: boolean | null;
  latencyMs: number | null;
  responseSnippet: string;
  testedAt: string | null;
  error?: string;
}

const today = new Date().toISOString().slice(0, 10);
const thisMonth = today.slice(0, 7);

const API_MODULES: ApiModule[] = [
  {
    id: "system",
    label: "System APIs",
    shortLabel: "System",
    description: "Health, database status, and operational refresh endpoints.",
    icon: Server,
    tone: "border-slate-500/25 bg-slate-500/5 text-slate-700 dark:text-slate-300",
    groups: [
      {
        name: "Health",
        description: "Runtime liveness and database reachability.",
        endpoints: [
          { method: "GET", path: "/api/healthz", label: "Health Check", description: "Returns API liveness status." },
        ],
      },
      {
        name: "Database",
        description: "Supabase connection metadata and table statistics.",
        endpoints: [
          { method: "GET", path: "/api/db/info", label: "DB Info", description: "Database connection and table stats." },
          { method: "POST", path: "/api/db/sync", label: "DB Sync / Refresh", description: "Re-run ANALYZE to refresh row counts.", safe: true },
        ],
      },
    ],
  },
  {
    id: "onefinance",
    label: "OneFinance APIs",
    shortLabel: "OneFinance",
    description: "Money, budgets, reports, liabilities, investments, and dashboard APIs.",
    icon: Landmark,
    tone: "border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
    groups: [
      {
        name: "Dashboard",
        description: "Aggregated financial command-center data.",
        endpoints: [
          { method: "GET", path: "/api/dashboard/summary", label: "Dashboard Summary", description: "Aggregated financial KPIs." },
        ],
      },
      {
        name: "Transactions",
        description: "Income, expenses, and transaction records.",
        endpoints: [
          { method: "GET", path: "/api/transactions", label: "List Transactions", description: "All transactions with filters." },
          {
            method: "POST",
            path: "/api/transactions",
            label: "Create Transaction",
            description: "Add a new income or expense transaction.",
            safe: false,
            sampleBody: { type: "expense", amount: 500, description: "API monitor test expense", categoryId: 1, date: today },
          },
        ],
      },
      {
        name: "Planning",
        description: "Budgets, goals, categories, and reports.",
        endpoints: [
          { method: "GET", path: "/api/categories", label: "List Categories", description: "All expense and income categories." },
          { method: "GET", path: "/api/budgets", label: "List Budgets", description: "All budget entries." },
          { method: "GET", path: `/api/budgets?month=${thisMonth}`, label: "Current Month Budgets", description: "Budget entries for this month." },
          { method: "GET", path: "/api/goals", label: "List Goals", description: "All financial goals." },
          { method: "GET", path: "/api/reports/summary", label: "Reports Summary", description: "Income vs expense report summary." },
        ],
      },
      {
        name: "Assets",
        description: "Savings-adjacent investment and protection records.",
        endpoints: [
          { method: "GET", path: "/api/investments", label: "List Investments", description: "All investment records." },
          { method: "GET", path: "/api/insurances", label: "List Insurances", description: "All insurance policies." },
        ],
      },
      {
        name: "Liabilities",
        description: "Loans, EMIs, and credit cards.",
        endpoints: [
          { method: "GET", path: "/api/loans", label: "List Loans", description: "All active loans." },
          { method: "GET", path: "/api/emis", label: "List EMIs", description: "All EMI schedules." },
          { method: "GET", path: "/api/credit-cards", label: "List Credit Cards", description: "All credit cards and outstanding balances." },
        ],
      },
    ],
  },
  {
    id: "onework",
    label: "OneWork APIs",
    shortLabel: "OneWork",
    description: "Career history, employment documents, PF ledger, and EPFO connector readiness.",
    icon: BriefcaseBusiness,
    tone: "border-cyan-500/25 bg-cyan-500/5 text-cyan-700 dark:text-cyan-300",
    groups: [
      {
        name: "Summary",
        description: "Read-only workspace payload used by the OneWork page.",
        endpoints: [
          { method: "GET", path: "/api/onework/summary", label: "OneWork Summary", description: "Companies, folders, documents, PF, and UAN status." },
        ],
      },
      {
        name: "Profile & Companies",
        description: "UAN profile details and company timeline records.",
        endpoints: [
          {
            method: "PUT",
            path: "/api/onework/profile",
            label: "Save UAN Profile",
            description: "Create or update UAN and EPFO member details.",
            safe: false,
            sampleBody: { uanNumber: "100000000000", epfoMemberId: "TEST/MEMBER/001" },
          },
          {
            method: "POST",
            path: "/api/onework/companies",
            label: "Create Company",
            description: "Add a manual work-history company.",
            safe: false,
            sampleBody: {
              companyName: "API Monitor Pvt Ltd",
              position: "Software Engineer",
              employmentType: "full_time",
              salaryMonthly: 100000,
              startDate: today,
              employeePfMonthly: 1800,
              employerPfMonthly: 1800,
              color: "#0891b2",
              icon: "Building2",
            },
          },
        ],
      },
      {
        name: "Documents",
        description: "Company folders, categories, and file metadata.",
        endpoints: [
          {
            method: "POST",
            path: "/api/onework/folders",
            label: "Create Folder",
            description: "Create a folder under a company.",
            safe: false,
            sampleBody: { companyId: 1, name: "Payslips", color: "#2563eb", icon: "Folder" },
          },
          {
            method: "POST",
            path: "/api/onework/document-categories",
            label: "Create Document Category",
            description: "Create a reusable document category.",
            safe: false,
            sampleBody: { name: "API Monitor", color: "#64748b", icon: "FileText" },
          },
          {
            method: "POST",
            path: "/api/onework/documents",
            label: "Create Document",
            description: "Create document metadata for a company.",
            safe: false,
            sampleBody: {
              companyId: 1,
              folderId: 1,
              categoryId: 1,
              name: "API Monitor File",
              documentType: "other",
              fileName: "api-monitor.pdf",
              documentDate: today,
            },
          },
        ],
      },
      {
        name: "PF Ledger",
        description: "Provident-fund contributions and withdrawals.",
        endpoints: [
          {
            method: "POST",
            path: "/api/onework/pf-entries",
            label: "Create PF Entry",
            description: "Add a monthly PF contribution entry.",
            safe: false,
            sampleBody: { companyId: 1, month: thisMonth, employeeAmount: 1800, employerAmount: 1800, interestAmount: 0, source: "manual" },
          },
          {
            method: "POST",
            path: "/api/onework/pf-withdrawals",
            label: "Create PF Withdrawal",
            description: "Record a PF withdrawal.",
            safe: false,
            sampleBody: { companyId: 1, amount: 1000, withdrawalDate: today, reason: "API monitor test" },
          },
        ],
      },
      {
        name: "Connectors",
        description: "EPFO and employment-history connector readiness endpoints.",
        endpoints: [
          {
            method: "POST",
            path: "/api/onework/epfo/sync",
            label: "EPFO Sync Readiness",
            description: "Returns connector-required status until authenticated EPFO sync is configured.",
            safe: false,
            expectedStatuses: [501],
          },
          {
            method: "POST",
            path: "/api/onework/history/fetch",
            label: "Fetch Employment History",
            description: "Receives temporary connector credentials for future employment-history import.",
            safe: false,
            sampleBody: { userId: "demo-user", password: "not-stored" },
            expectedStatuses: [501],
          },
        ],
      },
    ],
  },
];

const METHOD_COLORS: Record<ApiMethod, string> = {
  GET: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  POST: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  PUT: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  PATCH: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  DELETE: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

function endpointKey(ep: EndpointDef) {
  return `${ep.method}:${ep.path}`;
}

function statusColor(status: number | null) {
  if (status === null) return "text-muted-foreground";
  if (status < 300) return "text-emerald-500";
  if (status < 400) return "text-yellow-500";
  return "text-red-500";
}

function isAutoTestable(ep: EndpointDef) {
  return ep.safe === true || ep.method === "GET";
}

function registeredEndpoints(modules: ApiModule[]): RegisteredEndpoint[] {
  return modules.flatMap((module) =>
    module.groups.flatMap((group) =>
      group.endpoints.map((endpoint) => ({
        ...endpoint,
        moduleId: module.id,
        moduleLabel: module.label,
        group: group.name,
      })),
    ),
  );
}

export default function ApiMonitor() {
  const { toast } = useToast();
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testingAll, setTestingAll] = useState(false);
  const [selectedModule, setSelectedModule] = useState<ApiModule["id"] | "all">("all");
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(API_MODULES.map((module) => [module.id, true])),
  );
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(API_MODULES.flatMap((module) => module.groups.map((group) => [`${module.id}:${group.name}`, true]))),
  );

  const visibleModules = selectedModule === "all" ? API_MODULES : API_MODULES.filter((module) => module.id === selectedModule);
  const allEndpoints = useMemo(() => registeredEndpoints(API_MODULES), []);
  const visibleEndpoints = useMemo(() => registeredEndpoints(visibleModules), [visibleModules]);
  const autoTestableVisible = visibleEndpoints.filter(isAutoTestable);

  const testEndpoint = useCallback(async (ep: EndpointDef): Promise<TestResult> => {
    const start = performance.now();
    try {
      const opts: RequestInit = { method: ep.method, headers: { "Content-Type": "application/json" } };
      if (ep.sampleBody && ["POST", "PUT", "PATCH"].includes(ep.method)) {
        opts.body = JSON.stringify(ep.sampleBody);
      }

      const res = await fetch(ep.path, opts);
      const latencyMs = Math.round(performance.now() - start);
      let text = "";
      try {
        text = await res.text();
      } catch {
        text = "(no body)";
      }

      let snippet = text.length > 200 ? `${text.slice(0, 200)}...` : text;
      try {
        snippet = JSON.stringify(JSON.parse(text), null, 2);
        if (snippet.length > 500) snippet = `${snippet.slice(0, 500)}\n...`;
      } catch {
        // Response is not JSON.
      }

      const ok = ep.expectedStatuses ? ep.expectedStatuses.includes(res.status) : res.ok;
      return { status: res.status, ok, latencyMs, responseSnippet: snippet, testedAt: new Date().toLocaleTimeString() };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        status: null,
        ok: false,
        latencyMs,
        responseSnippet: "",
        testedAt: new Date().toLocaleTimeString(),
        error: err?.message ?? "Network error",
      };
    }
  }, []);

  const handleTest = useCallback(async (ep: EndpointDef) => {
    const key = endpointKey(ep);
    setTesting((current) => ({ ...current, [key]: true }));
    setExpandedEndpoint(key);
    const result = await testEndpoint(ep);
    setResults((current) => ({ ...current, [key]: result }));
    setTesting((current) => ({ ...current, [key]: false }));
    toast({
      title: result.ok ? `${ep.label} - ${result.status}` : `${ep.label} failed`,
      description: result.ok ? `Responded in ${result.latencyMs}ms` : result.error ?? `HTTP ${result.status}`,
      variant: result.ok ? "default" : "destructive",
    });
  }, [testEndpoint, toast]);

  const handleTestVisible = useCallback(async () => {
    setTestingAll(true);
    for (const ep of autoTestableVisible) {
      const key = endpointKey(ep);
      setTesting((current) => ({ ...current, [key]: true }));
      const result = await testEndpoint(ep);
      setResults((current) => ({ ...current, [key]: result }));
      setTesting((current) => ({ ...current, [key]: false }));
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    setTestingAll(false);
    toast({
      title: "Safe endpoint tests complete",
      description: `Tested ${autoTestableVisible.length} read-only or safe endpoints.`,
    });
  }, [autoTestableVisible, testEndpoint, toast]);

  const testedResults = Object.values(results);
  const passing = testedResults.filter((result) => result.ok).length;
  const failing = testedResults.filter((result) => result.ok === false).length;
  const avgLatency = testedResults
    .filter((result) => result.latencyMs !== null)
    .reduce((sum, result) => sum + (result.latencyMs ?? 0), 0) / (testedResults.filter((result) => result.latencyMs !== null).length || 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <Zap className="h-8 w-8 text-primary" />
            API Monitor
          </h1>
          <p className="mt-1 text-muted-foreground">
            Modular endpoint monitoring for OneFinance, OneWork, and system APIs.
          </p>
        </div>
        <Button onClick={handleTestVisible} disabled={testingAll || autoTestableVisible.length === 0} className="gap-2" size="lg">
          {testingAll ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {testingAll ? "Testing..." : `Test ${autoTestableVisible.length} Safe Endpoints`}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Layers3} label="Registered" value={String(allEndpoints.length)} tone="text-primary" />
        <SummaryCard icon={CheckCircle2} label="Passing" value={String(passing)} tone="text-emerald-600 dark:text-emerald-400" />
        <SummaryCard icon={XCircle} label="Failing" value={String(failing)} tone="text-red-600 dark:text-red-400" />
        <SummaryCard icon={Timer} label="Avg Latency" value={`${Math.round(avgLatency)}ms`} tone="text-blue-600 dark:text-blue-400" />
      </div>

      <div className="flex flex-wrap gap-2">
        <ModuleFilterButton active={selectedModule === "all"} onClick={() => setSelectedModule("all")} label="All Modules" count={allEndpoints.length} />
        {API_MODULES.map((module) => (
          <ModuleFilterButton
            key={module.id}
            active={selectedModule === module.id}
            onClick={() => setSelectedModule(module.id)}
            label={module.shortLabel}
            count={registeredEndpoints([module]).length}
          />
        ))}
      </div>

      <CurrencyStatusCard />

      <div className="space-y-4">
        {visibleModules.map((module) => (
          <ApiModuleSection
            key={module.id}
            module={module}
            expanded={expandedModules[module.id] ?? true}
            onExpandedChange={(open) => setExpandedModules((current) => ({ ...current, [module.id]: open }))}
            expandedGroups={expandedGroups}
            onGroupExpandedChange={(groupKey, open) => setExpandedGroups((current) => ({ ...current, [groupKey]: open }))}
            results={results}
            testing={testing}
            expandedEndpoint={expandedEndpoint}
            onExpandedEndpointChange={setExpandedEndpoint}
            onTest={handleTest}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-4 text-xs text-muted-foreground">
        <Globe className="h-3.5 w-3.5" />
        <span>
          Tests run against <code className="rounded bg-muted px-1 py-0.5 font-mono">{window.location.origin}/api</code>
        </span>
        <Server className="ml-2 h-3.5 w-3.5" />
        <span>Unsafe write endpoints are listed but excluded from bulk safe tests.</span>
      </div>
    </div>
  );
}

function ApiModuleSection({
  module,
  expanded,
  onExpandedChange,
  expandedGroups,
  onGroupExpandedChange,
  results,
  testing,
  expandedEndpoint,
  onExpandedEndpointChange,
  onTest,
}: {
  module: ApiModule;
  expanded: boolean;
  onExpandedChange: (open: boolean) => void;
  expandedGroups: Record<string, boolean>;
  onGroupExpandedChange: (groupKey: string, open: boolean) => void;
  results: Record<string, TestResult>;
  testing: Record<string, boolean>;
  expandedEndpoint: string | null;
  onExpandedEndpointChange: (key: string | null) => void;
  onTest: (endpoint: EndpointDef) => void;
}) {
  const moduleEndpoints = registeredEndpoints([module]);
  const tested = moduleEndpoints.filter((endpoint) => results[endpointKey(endpoint)]).length;
  const passing = moduleEndpoints.filter((endpoint) => results[endpointKey(endpoint)]?.ok).length;
  const Icon = module.icon;

  return (
    <Collapsible open={expanded} onOpenChange={onExpandedChange}>
      <Card className={cn("overflow-hidden rounded-2xl border shadow-sm", module.tone)}>
        <CollapsibleTrigger asChild>
          <button type="button" className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-muted/25">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background/80 shadow-sm">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold tracking-tight">{module.label}</h2>
                <Badge variant="outline" className="bg-background/80">{moduleEndpoints.length} endpoints</Badge>
                {tested > 0 && <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">{passing}/{tested} passing</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
            </div>
            <ChevronRight className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-90")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 border-t bg-background/70 p-4">
            {module.groups.map((group) => {
              const groupKey = `${module.id}:${group.name}`;
              return (
                <EndpointGroupSection
                  key={groupKey}
                  moduleId={module.id}
                  group={group}
                  open={expandedGroups[groupKey] ?? true}
                  onOpenChange={(open) => onGroupExpandedChange(groupKey, open)}
                  results={results}
                  testing={testing}
                  expandedEndpoint={expandedEndpoint}
                  onExpandedEndpointChange={onExpandedEndpointChange}
                  onTest={onTest}
                />
              );
            })}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function EndpointGroupSection({
  moduleId,
  group,
  open,
  onOpenChange,
  results,
  testing,
  expandedEndpoint,
  onExpandedEndpointChange,
  onTest,
}: {
  moduleId: ApiModule["id"];
  group: EndpointGroup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: Record<string, TestResult>;
  testing: Record<string, boolean>;
  expandedEndpoint: string | null;
  onExpandedEndpointChange: (key: string | null) => void;
  onTest: (endpoint: EndpointDef) => void;
}) {
  const tested = group.endpoints.filter((endpoint) => results[endpointKey(endpoint)]).length;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className="rounded-xl border bg-card">
        <CollapsibleTrigger asChild>
          <button type="button" className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30">
            <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-90")} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{group.name}</p>
                <Badge variant="secondary" className="text-[10px]">{group.endpoints.length} endpoints</Badge>
                {tested > 0 && <Badge variant="outline" className="text-[10px]">{tested} tested</Badge>}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{group.description}</p>
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 border-t p-3">
            {group.endpoints.map((endpoint) => (
              <EndpointCard
                key={`${moduleId}:${endpointKey(endpoint)}`}
                endpoint={endpoint}
                result={results[endpointKey(endpoint)]}
                isTesting={testing[endpointKey(endpoint)]}
                isExpanded={expandedEndpoint === endpointKey(endpoint)}
                onExpand={() => onExpandedEndpointChange(expandedEndpoint === endpointKey(endpoint) ? null : endpointKey(endpoint))}
                onTest={() => onTest(endpoint)}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function EndpointCard({
  endpoint,
  result,
  isTesting,
  isExpanded,
  onExpand,
  onTest,
}: {
  endpoint: EndpointDef;
  result?: TestResult;
  isTesting?: boolean;
  isExpanded: boolean;
  onExpand: () => void;
  onTest: () => void;
}) {
  return (
    <Card
      className={cn(
        "rounded-xl border transition-all duration-200",
        result?.ok === true && "border-emerald-500/30 bg-emerald-500/5",
        result?.ok === false && "border-red-500/30 bg-red-500/5",
      )}
    >
      <CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className={cn("shrink-0 px-2 py-0.5 font-mono text-xs font-bold", METHOD_COLORS[endpoint.method])}>
            {endpoint.method}
          </Badge>
          <div className="min-w-[180px] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <code className="font-mono text-sm text-foreground">{endpoint.path}</code>
              {!isAutoTestable(endpoint) && <Badge variant="outline" className="text-[10px]">manual</Badge>}
              {endpoint.expectedStatuses && <Badge variant="outline" className="text-[10px]">expects {endpoint.expectedStatuses.join("/")}</Badge>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{endpoint.label} - {endpoint.description}</p>
          </div>

          {result && (
            <div className="flex shrink-0 items-center gap-2">
              {result.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-red-500" />}
              <span className={cn("font-mono text-sm font-bold", statusColor(result.status))}>{result.status ?? "ERR"}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {result.latencyMs}ms
              </span>
            </div>
          )}

          <Button size="sm" variant={result?.ok ? "outline" : "default"} className="h-8 shrink-0 gap-1.5 px-3" onClick={onTest} disabled={isTesting}>
            {isTesting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            {isTesting ? "Testing..." : "Test"}
          </Button>

          {(result || endpoint.sampleBody) && (
            <button type="button" onClick={onExpand} className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="mt-3 space-y-2">
            {result && (
              <div className="max-h-64 overflow-auto rounded-xl border bg-muted/50 p-3">
                {result.error ? (
                  <p className="text-sm font-medium text-red-500">{result.error}</p>
                ) : (
                  <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-foreground">{result.responseSnippet}</pre>
                )}
              </div>
            )}
            {endpoint.sampleBody && (
              <div className="rounded-xl border border-primary/10 bg-primary/5 p-3">
                <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <Code2 className="h-3 w-3" />
                  Sample Request Body
                </p>
                <pre className="whitespace-pre-wrap font-mono text-xs text-foreground">{JSON.stringify(endpoint.sampleBody, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: string }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <Icon className={cn("h-5 w-5", tone)} />
          </div>
          <div>
            <p className={cn("text-2xl font-bold", tone)}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ModuleFilterButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
        active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
      <span className={cn("ml-2 font-mono text-xs", active ? "text-primary-foreground/75" : "text-muted-foreground")}>{count}</span>
    </button>
  );
}

function CurrencyStatusCard() {
  const rates = getGlobalRates();
  return (
    <Card className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Live Currency Exchange Rates
          </h3>
          <p className="text-xs text-muted-foreground">Rates are shown against INR and shared with the OneFinance dashboard.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline" className="border-border/80 bg-background font-mono">1 USD = {(1 / rates.USD).toFixed(2)} INR</Badge>
          <Badge variant="outline" className="border-border/80 bg-background font-mono">1 EUR = {(1 / rates.EUR).toFixed(2)} INR</Badge>
          <Badge variant="outline" className="border-border/80 bg-background font-mono">1 QAR = {(1 / rates.QAR).toFixed(2)} INR</Badge>
          <Badge variant="outline" className="border-border/80 bg-background font-mono">1 SAR = {(1 / rates.SAR).toFixed(2)} INR</Badge>
          <Badge variant="outline" className="border-border/80 bg-background font-mono">1 AED = {(1 / rates.AED).toFixed(2)} INR</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

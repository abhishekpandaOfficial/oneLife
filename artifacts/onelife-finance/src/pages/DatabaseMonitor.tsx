import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Database,
  RefreshCw,
  Server,
  Table2,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
  Rows3,
  ChevronRight,
  Activity,
  Trash2,
  Wallet,
  BriefcaseBusiness,
  Users,
  HeartPulse,
  Notebook,
  Lightbulb,
  Plane,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ─── Types ──────────────────────────────────────────────────────────────────

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

interface ModuleInfo {
  module: string;
  moduleKey: string;
  tableCount: number;
  rowCount: number;
  sizeBytes: number;
  sizeHuman: string;
  status: "live" | "planned";
  plannedTables?: string[];
}

interface DbInfo {
  status: "connected" | "error";
  host: string;
  database: string;
  version: string;
  tables: TableInfo[];
  modules: ModuleInfo[];
  lastChecked: string;
  error?: string;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

const fetchDbInfo = async (): Promise<DbInfo> => {
  const res = await fetch("/api/db/info");
  if (!res.ok) throw new Error("Failed to fetch DB info");
  return res.json();
};

const triggerSync = async (): Promise<{ success: boolean; message: string }> => {
  const res = await fetch("/api/db/sync", { method: "POST" });
  if (!res.ok) throw new Error("Sync failed");
  return res.json();
};

// ─── Table name display helper ───────────────────────────────────────────────

const MODULE_ICONS: Record<string, React.ElementType> = {
  finance: Wallet,
  work: BriefcaseBusiness,
  social: Users,
  health: HeartPulse,
  note: Notebook,
  idea: Lightbulb,
  travel: Plane,
  system: Database,
};

const COLOR_DOT: Record<string, string> = {
  emerald: "bg-emerald-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  cyan: "bg-cyan-500",
  teal: "bg-teal-500",
  pink: "bg-pink-500",
  indigo: "bg-indigo-500",
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  slate: "bg-slate-500",
  red: "bg-red-500",
};

const MODULE_ORDER = ["finance", "work", "social", "health", "note", "idea", "travel", "system"];

const MODULE_TONE: Record<string, string> = {
  finance: "border-emerald-500/20 bg-emerald-500/5",
  work: "border-blue-500/20 bg-blue-500/5",
  social: "border-rose-500/20 bg-rose-500/5",
  health: "border-red-500/20 bg-red-500/5",
  note: "border-amber-500/20 bg-amber-500/5",
  idea: "border-fuchsia-500/20 bg-fuchsia-500/5",
  travel: "border-cyan-500/20 bg-cyan-500/5",
  system: "border-slate-500/20 bg-slate-500/5",
};

function humanDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DatabaseMonitor() {
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const { toast } = useToast();

  const { data, isLoading, isError, dataUpdatedAt } = useQuery<DbInfo>({
    queryKey: ["db-info"],
    queryFn: fetchDbInfo,
    refetchInterval: 30_000, // auto-refresh every 30 s
    retry: 1,
  });

  const syncMutation = useMutation({
    mutationFn: triggerSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["db-info"] });
      toast({ title: "Refreshed Successfully", description: "Database stats updated." });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/db/clear", { method: "POST" });
      if (!res.ok) throw new Error("Database reset failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["db-info"] });
      setSelectedTable(null);
      toast({ title: "Database Reset Complete", description: "All records have been cleared. Ready for production." });
    },
    onError: (err: any) => {
      toast({ title: "Reset Failed", description: err.message, variant: "destructive" });
    }
  });

  const handleSync = useCallback(() => {
    syncMutation.mutate();
  }, [syncMutation]);

  const isConnected = data?.status === "connected";
  const isSyncing = syncMutation.isPending || isLoading;

  const selectedTableData = data?.tables.find((t) => t.name === selectedTable);
  const sortedModules = [...(data?.modules ?? [])].sort(
    (a, b) => MODULE_ORDER.indexOf(a.moduleKey) - MODULE_ORDER.indexOf(b.moduleKey)
  );
  const tablesByModule = sortedModules.map((module) => ({
    ...module,
    tables: (data?.tables ?? []).filter((table) => table.moduleKey === module.moduleKey),
  }));

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Database Monitor
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Live Supabase connection status, table overview and data sync
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="gap-2"
                disabled={clearMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
                Clear Database
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action is irreversible. It will delete all transactions, budgets, goals, EMIs, investments, loans, and categories from your Supabase database. Use this to prepare your database for live production data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => clearMutation.mutate()}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Yes, Clear All Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
            {isSyncing ? "Syncing…" : "Sync & Refresh"}
          </Button>
        </div>
      </div>

      {/* ── Status cards row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Connection Status */}
        <Card className={cn(
          "border-l-4 transition-all",
          isLoading ? "border-l-muted" :
          isConnected ? "border-l-emerald-500" : "border-l-destructive"
        )}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connection</span>
              {isLoading ? (
                <Activity className="h-4 w-4 text-muted-foreground animate-pulse" />
              ) : isConnected ? (
                <Wifi className="h-4 w-4 text-emerald-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-destructive" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "h-2.5 w-2.5 rounded-full ring-4",
                isLoading   ? "bg-muted ring-muted/20 animate-pulse" :
                isConnected ? "bg-emerald-500 ring-emerald-500/20" :
                              "bg-destructive ring-destructive/20"
              )} />
              <p className={cn(
                "text-lg font-bold",
                isConnected ? "text-emerald-600" : "text-destructive"
              )}>
                {isLoading ? "Checking…" : isConnected ? "Connected" : "Error"}
              </p>
            </div>
            {data?.error && (
              <p className="text-xs text-destructive mt-1 truncate">{data.error}</p>
            )}
          </CardContent>
        </Card>

        {/* Host */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Host</span>
              <Server className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold truncate">{data?.host ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">DB: <span className="font-medium text-foreground">{data?.database ?? "—"}</span></p>
          </CardContent>
        </Card>

        {/* Tables count */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tables</span>
              <Table2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{data?.tables.length ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data?.modules.filter((module) => module.status === "live").length ?? "—"} live modules
            </p>
          </CardContent>
        </Card>

        {/* Last synced */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Synced</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold">
              {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("en-IN") : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {syncMutation.isSuccess ? "✓ ANALYZE complete" : "Auto-refresh: 30s"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {isError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">
              Could not connect to the database. Check that your <code className="bg-destructive/10 px-1 rounded">DATABASE_URL</code> is correct and the Supabase project is active.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Version banner ───────────────────────────────────────────────── */}
      {data?.version && (
        <Card className="bg-muted/30">
          <CardContent className="py-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <p className="text-xs text-muted-foreground font-mono truncate">{data.version}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Tables list + detail ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table list */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Rows3 className="h-4 w-4 text-primary" />
              Module Tables
            </CardTitle>
            <CardDescription>Grouped by OneLife module</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="px-6 pb-6 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3 p-3">
                {tablesByModule.map((module) => {
                  const ModuleIcon = MODULE_ICONS[module.moduleKey] ?? Database;
                  return (
                    <section key={module.moduleKey} className={cn("overflow-hidden rounded-xl border", MODULE_TONE[module.moduleKey] ?? "bg-muted/20")}>
                      <div className="flex items-center justify-between gap-3 border-b bg-card/70 px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <ModuleIcon className="h-4 w-4 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{module.module}</p>
                            <p className="text-xs text-muted-foreground">
                              {module.status === "live"
                                ? `${module.tableCount} tables · ${module.rowCount.toLocaleString()} rows`
                                : "Planned schema"}
                            </p>
                          </div>
                        </div>
                        <Badge variant={module.status === "live" ? "default" : "outline"}>{module.status}</Badge>
                      </div>

                      {module.tables.length > 0 ? (
                        <ul className="divide-y bg-card/35">
                          {module.tables.map((table) => {
                            const isSelected = selectedTable === table.name;
                            return (
                              <li key={table.name}>
                                <button
                                  onClick={() => setSelectedTable(isSelected ? null : table.name)}
                                  className={cn(
                                    "w-full flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50",
                                    isSelected && "bg-primary/10"
                                  )}
                                >
                                  <span className={cn(
                                    "h-2.5 w-2.5 rounded-full shrink-0",
                                    COLOR_DOT[table.color] ?? "bg-muted-foreground"
                                  )} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{table.label}</p>
                                    <p className="truncate text-xs text-muted-foreground">{table.feature} · {table.rowCount.toLocaleString()} rows</p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant="secondary" className="text-[10px] font-mono">{table.sizeHuman}</Badge>
                                    <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition-transform", isSelected && "rotate-90")} />
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="space-y-2 bg-card/35 p-3">
                          {module.plannedTables?.map((tableName) => (
                            <div key={tableName} className="flex items-center justify-between gap-3 rounded-lg border border-dashed bg-background/60 px-3 py-2 text-sm">
                              <span className="font-mono text-xs text-muted-foreground">{tableName}</span>
                              <Badge variant="outline">planned</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table detail / welcome pane */}
        <Card className="lg:col-span-2">
          {selectedTableData ? (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className={cn(
                    "h-3 w-3 rounded-full",
                    COLOR_DOT[selectedTableData.color] ?? "bg-muted-foreground"
                  )} />
                  {selectedTableData.label}
                  <Badge variant="outline" className="ml-auto font-mono text-xs">
                    {selectedTableData.name}
                  </Badge>
                </CardTitle>
                <CardDescription>{selectedTableData.module} · {selectedTableData.feature}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatBlock
                    icon={<Rows3 className="h-5 w-5 text-primary" />}
                    label="Total Rows"
                    value={selectedTableData.rowCount.toLocaleString()}
                  />
                  <StatBlock
                    icon={<HardDrive className="h-5 w-5 text-primary" />}
                    label="Table Size"
                    value={selectedTableData.sizeHuman}
                  />
                  <StatBlock
                    icon={<Database className="h-5 w-5 text-primary" />}
                    label="Size (bytes)"
                    value={selectedTableData.sizeBytes.toLocaleString()}
                  />
                </div>

                <div className="mt-6 rounded-xl border bg-muted/30 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Table Info</p>
                  <div className="space-y-2 text-sm">
                    <InfoRow label="Module" value={selectedTableData.module} />
                    <InfoRow label="Feature" value={selectedTableData.feature} />
                    <InfoRow label="Table name" value={selectedTableData.name} mono />
                    <InfoRow label="Schema"     value="public" mono />
                    <InfoRow label="Database"   value={data?.database ?? "—"} mono />
                    <InfoRow label="Host"        value={data?.host ?? "—"} mono />
                  </div>
                </div>

                <div className="mt-4 rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Purpose</p>
                  <p className="text-sm text-muted-foreground">{selectedTableData.description}</p>
                </div>

                <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last refreshed: {data?.lastChecked ? humanDate(data.lastChecked) : "—"}
                </p>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-full py-20 text-center">
              <Database className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="font-semibold text-muted-foreground">Select a table</p>
              <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">
                Click any table on the left to see its row count, size and connection details.
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function StatBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold font-mono">{value}</p>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn("truncate text-right", mono && "font-mono text-xs bg-muted px-2 py-0.5 rounded")}>{value}</span>
    </div>
  );
}

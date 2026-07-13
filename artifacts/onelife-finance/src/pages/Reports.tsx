import React, { useState, useMemo } from "react";
import { useListTransactions, Transaction } from "@workspace/api-client-react";
import { BarChart3, TrendingUp, Download, PieChart as PieChartIcon, Printer, Calendar, FileText, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { formatCurrency, useCurrencyRefresh } from "@/components/ui/animated-number";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";

type ReportPeriod = "this_month" | "last_3_months" | "last_6_months" | "this_year" | "last_year" | "all_time";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#6366f1", "#a855f7", "#eab308"];

export default function Reports() {
  useCurrencyRefresh();
  const [period, setPeriod] = useState<ReportPeriod>("this_month");

  // ─── Calculate Date Ranges ──────────────────────────────────────────────────
  const dateRange = useMemo(() => {
    const now = new Date();
    let fromDate: Date;
    let toDate: Date = now;

    switch (period) {
      case "this_month":
        fromDate = startOfMonth(now);
        toDate = endOfMonth(now);
        break;
      case "last_3_months":
        fromDate = startOfMonth(subMonths(now, 2));
        toDate = endOfMonth(now);
        break;
      case "last_6_months":
        fromDate = startOfMonth(subMonths(now, 5));
        toDate = endOfMonth(now);
        break;
      case "this_year":
        fromDate = startOfYear(now);
        toDate = endOfYear(now);
        break;
      case "last_year":
        const lastYr = new Date(now.getFullYear() - 1, 0, 1);
        fromDate = startOfYear(lastYr);
        toDate = endOfYear(lastYr);
        break;
      case "all_time":
      default:
        fromDate = new Date("2000-01-01");
        toDate = now;
        break;
    }

    return {
      fromStr: fromDate.toISOString().split("T")[0],
      toStr: toDate.toISOString().split("T")[0],
      label: period === "all_time" 
        ? "All-Time Records" 
        : `${format(fromDate, "dd MMM yyyy")} - ${format(toDate, "dd MMM yyyy")}`
    };
  }, [period]);

  // Fetch all transactions in the chosen range from database
  const { data: transactions, isLoading, refetch } = useListTransactions({
    from: dateRange.fromStr,
    to: dateRange.toStr,
  });

  // ─── Perform Client-Side Aggregations ───────────────────────────────────────
  const stats = useMemo(() => {
    const list = transactions || [];
    let income = 0;
    let expense = 0;
    const categoryMap: Record<string, { name: string; value: number; color: string }> = {};
    const trendMap: Record<string, { period: string; income: number; expense: number }> = {};

    list.forEach((tx) => {
      const amt = tx.amount;
      const dateObj = parseISO(tx.date);
      const trendKey = period === "this_year" || period === "last_year" || period === "all_time"
        ? format(dateObj, "yyyy-MM") // group by month
        : format(dateObj, "yyyy-MM-dd"); // group by day

      // Initialize trend data
      if (!trendMap[trendKey]) {
        trendMap[trendKey] = {
          period: period === "this_year" || period === "last_year" || period === "all_time"
            ? format(dateObj, "MMM yy")
            : format(dateObj, "dd MMM"),
          income: 0,
          expense: 0,
        };
      }

      if (tx.type === "income") {
        income += amt;
        trendMap[trendKey].income += amt;
      } else {
        expense += amt;
        trendMap[trendKey].expense += amt;

        // Group expenses by category
        const catName = tx.categoryName || "Uncategorized";
        if (!categoryMap[catName]) {
          categoryMap[catName] = {
            name: catName,
            value: 0,
            color: tx.categoryColor || "#cbd5e1",
          };
        }
        categoryMap[catName].value += amt;
      }
    });

    const categoryData = Object.values(categoryMap).sort((a, b) => b.value - a.value);
    const trendData = Object.values(trendMap).sort((a, b) => {
      // Simple string sort for periods (since daily keys are sorted by date string)
      return a.period.localeCompare(b.period);
    });

    const netSavings = income - expense;
    const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;

    return {
      totalIncome: income,
      totalExpense: expense,
      netSavings,
      savingsRate,
      categoryData,
      trendData,
      count: list.length,
    };
  }, [transactions, period]);

  // ─── Export to CSV ──────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) return;
    
    const headers = ["ID", "Type", "Amount", "Category", "Description", "Date", "Recurring"];
    const rows = transactions.map((t) => [
      t.id,
      t.type,
      t.amount,
      t.categoryName || "Uncategorized",
      `"${t.description.replace(/"/g, '""')}"`,
      t.date,
      t.isRecurring ? "Yes" : "No"
    ]);

    const csvContent = [
      ["OneLife Finance - Financial Statement Summary"],
      [`Period: ${dateRange.label}`],
      [`Total Income: ${stats.totalIncome}`],
      [`Total Expense: ${stats.totalExpense}`],
      [`Net Savings: ${stats.netSavings}`],
      [],
      headers,
      ...rows
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `onelife_report_${period}_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Export to PDF (Trigger Window Print with styled sheets) ─────────────────
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Dynamic print-only style overrides */}
      <style>{`
        @media print {
          header, aside, button, select, .no-print, .toast-container {
            display: none !important;
          }
          body {
            background-color: white !important;
            color: black !important;
          }
          main, .print-container {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .card {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            break-inside: avoid;
            background: white !important;
            color: black !important;
          }
          .recharts-responsive-container {
            width: 100% !important;
            height: 250px !important;
          }
        }
      `}</style>

      {/* ── Header Bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            Financial Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Aggregate statements, savings trends, and custom filters.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center gap-2 bg-card border px-3 h-9 rounded-full shadow-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
              className="bg-transparent text-sm font-semibold outline-none cursor-pointer pr-2"
            >
              <option value="this_month">This Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_6_months">Last 6 Months</option>
              <option value="this_year">This Year</option>
              <option value="last_year">Last Year</option>
              <option value="all_time">All Time</option>
            </select>
          </div>

          <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-full shadow-sm">
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportCSV} className="rounded-full shadow-sm gap-2">
            <Download className="h-4 w-4" />
            CSV
          </Button>
          
          <Button size="sm" onClick={handleExportPDF} className="rounded-full shadow-md gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Printer className="h-4 w-4" />
            Print PDF
          </Button>
        </div>
      </div>

      {/* ── Print Header (Only visible when printing) ────────────────────── */}
      <div className="hidden print:block border-b pb-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">OneLife Finance Statement</h1>
            <p className="text-sm text-muted-foreground mt-1">Generated dynamically from live ledger records</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mt-2">Period: {dateRange.label}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Created On: {new Date().toLocaleDateString("en-IN")}</p>
            <p>Status: Authenticated Live Sync</p>
          </div>
        </div>
      </div>

      {/* ── KPI cards row ────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-2xl"><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card className="rounded-2xl border-primary/5 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Statement Income</p>
                    <p className="text-3xl font-bold font-mono text-emerald-500">{formatCurrency(stats.totalIncome)}</p>
                  </div>
                  <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-500">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-primary/5 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Statement Expenses</p>
                    <p className="text-3xl font-bold font-mono text-destructive">{formatCurrency(stats.totalExpense)}</p>
                  </div>
                  <div className="p-2 bg-destructive/10 rounded-full text-destructive">
                    <ArrowDownRight className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-primary/5 shadow-sm bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/80 mb-1">Net Savings ({stats.savingsRate.toFixed(1)}%)</p>
                    <p className="text-3xl font-bold font-mono">{formatCurrency(stats.netSavings)}</p>
                  </div>
                  <div className="bg-primary-foreground/20 px-3 py-1 rounded-full text-xs font-bold font-mono mt-1">
                    {stats.count} items
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── Charts grid ──────────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Trend chart */}
        <Card className="rounded-2xl border-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Cash Flow Trend
            </CardTitle>
            <CardDescription>Income vs Expense breakdown over the selected range</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[250px] w-full" /> : stats.trendData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No transaction records found.</div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.15)" />
                    <XAxis 
                      dataKey="period" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                      formatter={(val: number) => [formatCurrency(val)]}
                    />
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Allocation Pie chart */}
        <Card className="rounded-2xl border-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Expense Distribution
            </CardTitle>
            <CardDescription>Category allocation of total expenses</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-6">
            {isLoading ? <Skeleton className="h-[250px] w-full" /> : stats.categoryData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No expense records found.</div>
            ) : (
              <>
                <div className="h-[200px] w-[200px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stats.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                        formatter={(val: number) => [formatCurrency(val)]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 w-full space-y-2 max-h-[220px] overflow-y-auto pr-2">
                  {stats.categoryData.map((cat, idx) => (
                    <div key={cat.name} className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-2 truncate">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color || COLORS[idx % COLORS.length] }} />
                        <span className="truncate">{cat.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono">{formatCurrency(cat.value)}</span>
                        <span className="text-muted-foreground text-[10px] ml-1.5">
                          {((cat.value / stats.totalExpense) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Transaction Table (LEDGER) ────────────────────────────────────── */}
      <Card className="rounded-2xl border-primary/5 shadow-sm overflow-hidden">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Statement Transaction Ledger
          </CardTitle>
          <CardDescription>All records registered within the selected period ({dateRange.label})</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">No transaction records found.</div>
          ) : (
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(parseISO(tx.date), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className="font-mono font-medium text-[10px] gap-1.5"
                        >
                          <span 
                            className="h-1.5 w-1.5 rounded-full shrink-0" 
                            style={{ backgroundColor: tx.categoryColor || "#cbd5e1" }}
                          />
                          {tx.categoryName || "Uncategorized"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate" title={tx.description}>
                        {tx.description}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={tx.type === "income" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100" : "bg-destructive/5 text-destructive hover:bg-destructive/5 border-destructive/10"}
                          variant="outline"
                        >
                          {tx.type === "income" ? "Income" : "Expense"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-mono font-semibold ${tx.type === "income" ? "text-emerald-500" : "text-destructive"}`}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
    </div>
  );
}
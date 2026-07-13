import React, { useState } from "react";
import { useSearch } from "wouter";
import { useGetReportSummary, GetReportSummaryPeriod, getGetReportSummaryQueryKey } from "@workspace/api-client-react";
import { BarChart3, TrendingUp, Download, PieChart as PieChartIcon } from "lucide-react";
import { formatCurrency } from "@/components/ui/animated-number";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";

export default function Reports() {
  const [period, setPeriod] = useState<GetReportSummaryPeriod>("monthly");
  
  const { data: report, isLoading } = useGetReportSummary({ period }, {
    query: { queryKey: getGetReportSummaryQueryKey({ period }) }
  });

  const netSavingsRate = report ? (report.netSavings / report.totalIncome) * 100 : 0;
  
  const exportData = () => {
    // Basic CSV export simulation
    const csvContent = "data:text/csv;charset=utf-8,Report Downloaded\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_report_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground mt-1">Deep dive into your financial health.</p>
        </div>
        <div className="flex items-center gap-4">
          <ToggleGroup type="single" value={period} onValueChange={(v) => v && setPeriod(v as GetReportSummaryPeriod)} className="bg-card border p-1 rounded-lg">
            <ToggleGroupItem value="monthly" className="rounded-md px-4 text-xs font-medium">Monthly</ToggleGroupItem>
            <ToggleGroupItem value="yearly" className="rounded-md px-4 text-xs font-medium">Yearly</ToggleGroupItem>
          </ToggleGroup>
          <Button variant="outline" className="shadow-sm" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-2xl"><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))
        ) : report ? (
          <>
            <Card className="rounded-2xl border-primary/5 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Income</p>
                <p className="text-3xl font-bold font-mono text-emerald-500">{formatCurrency(report.totalIncome)}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-primary/5 shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Expenses</p>
                <p className="text-3xl font-bold font-mono text-destructive">{formatCurrency(report.totalExpense)}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-primary/5 shadow-sm bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-primary-foreground/80 text-sm font-medium mb-1">Net Savings</p>
                    <p className="text-3xl font-bold font-mono tracking-tight">{formatCurrency(report.netSavings)}</p>
                  </div>
                  <div className="bg-primary-foreground/10 px-3 py-1 rounded-full text-sm font-semibold">
                    {netSavingsRate.toFixed(1)}% Rate
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-primary" /> Net Worth Trend</CardTitle>
            <CardDescription>Your wealth accumulation over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report?.netWorthTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorNw" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                    <XAxis 
                      dataKey="period" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(val) => {
                        try { return period === 'monthly' ? format(parseISO(val + '-01'), 'MMM yy') : val; } catch(e) { return val; }
                      }}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(val) => `$${val/1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                      formatter={(value: number) => [formatCurrency(value), "Net Worth"]}
                    />
                    <Area type="monotone" dataKey="netWorth" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorNw)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-emerald-500" /> Income vs Expenses</CardTitle>
            <CardDescription>Cash flow comparison</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report?.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                    <XAxis 
                      dataKey="period" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(val) => {
                        try { return period === 'monthly' ? format(parseISO(val + '-01'), 'MMM yy') : val; } catch(e) { return val; }
                      }}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(val) => `$${val/1000}k`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                      formatter={(value: number) => [formatCurrency(value), undefined]}
                    />
                    <Bar dataKey="income" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} maxBarSize={40} name="Income" />
                    <Bar dataKey="expense" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} maxBarSize={40} name="Expense" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 rounded-2xl border-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center"><PieChartIcon className="mr-2 h-5 w-5 text-indigo-500" /> Expense Distribution</CardTitle>
            <CardDescription>Where your money went</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
              <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                <div className="h-[300px] w-full md:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={report?.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="amount"
                        nameKey="category"
                        stroke="none"
                      >
                        {report?.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || `hsl(var(--chart-${(index % 5) + 1}))`} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                  {report?.categoryBreakdown.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || `hsl(var(--chart-${(i % 5) + 1}))` }} />
                        <span className="font-medium text-sm">{cat.category}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-semibold">{formatCurrency(cat.amount)}</span>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {((cat.amount / (report.totalExpense || 1)) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
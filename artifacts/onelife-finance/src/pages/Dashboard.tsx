import React from "react";
import { Link } from "wouter";
import { 
  useGetDashboardSummary, 
} from "@workspace/api-client-react";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  PiggyBank, 
  TrendingUp, 
  ShieldCheck, 
  CreditCard, 
  AlertCircle,
  Activity,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber, formatCurrency } from "@/components/ui/animated-number";
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
  Line
} from "recharts";
import { format, parseISO } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading, error } = useGetDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-1" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Failed to load dashboard</h2>
        <p className="mt-2 text-muted-foreground">Please check your connection and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
          <p className="text-muted-foreground mt-1">Your command center for all things money.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/income">
            <Button variant="outline" className="rounded-full shadow-sm">
              <ArrowDownRight className="mr-2 h-4 w-4 text-emerald-500" />
              Add Income
            </Button>
          </Link>
          <Link href="/expenses">
            <Button className="rounded-full shadow-md bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard 
          title="Net Worth" 
          amount={summary.netWorth} 
          icon={<Activity className="h-5 w-5 text-primary" />} 
          trend="+2.5% from last month"
          trendUp={true}
          featured
        />
        <KpiCard 
          title="Remaining Balance" 
          amount={summary.remainingBalance} 
          icon={<Wallet className="h-5 w-5 text-emerald-500" />} 
        />
        <KpiCard 
          title="Monthly Income" 
          amount={summary.monthlyIncome} 
          icon={<ArrowDownRight className="h-5 w-5 text-emerald-500" />} 
        />
        <KpiCard 
          title="Monthly Expenses" 
          amount={summary.monthlyExpenses} 
          icon={<ArrowUpRight className="h-5 w-5 text-destructive" />} 
        />
        <KpiCard 
          title="Total Savings" 
          amount={summary.totalSavings} 
          icon={<PiggyBank className="h-5 w-5 text-blue-500" />} 
        />
        <KpiCard 
          title="Investments" 
          amount={summary.totalInvestmentValue} 
          icon={<TrendingUp className="h-5 w-5 text-indigo-500" />} 
        />
        <KpiCard 
          title="Loans Outstanding" 
          amount={summary.totalLoanOutstanding} 
          icon={<CreditCard className="h-5 w-5 text-orange-500" />} 
        />
        <KpiCard 
          title="Insurance Coverage" 
          amount={summary.totalInsuranceCoverage} 
          icon={<ShieldCheck className="h-5 w-5 text-teal-500" />} 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 rounded-2xl shadow-sm border-primary/5">
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Your cash flow over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.incomeVsExpenseTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                  <XAxis 
                    dataKey="period" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(val) => {
                      try { return format(parseISO(val + '-01'), 'MMM'); } catch(e) { return val; }
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
                    labelFormatter={(label) => `Period: ${label}`}
                  />
                  <Bar dataKey="income" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} maxBarSize={40} name="Income" />
                  <Bar dataKey="expense" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} maxBarSize={40} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 rounded-2xl shadow-sm border-primary/5">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Where your money went this month</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.expenseByCategory.length > 0 ? (
              <div className="h-[300px] w-full flex flex-col items-center">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={summary.expenseByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="amount"
                      nameKey="category"
                      stroke="none"
                    >
                      {summary.expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || `hsl(var(--chart-${(index % 5) + 1}))`} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full flex flex-wrap justify-center gap-3 mt-2 overflow-y-auto max-h-[20%]">
                  {summary.expenseByCategory.slice(0, 5).map((entry, i) => (
                    <div key={i} className="flex items-center text-xs text-muted-foreground">
                      <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color || `hsl(var(--chart-${(i % 5) + 1}))` }} />
                      {entry.category}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center flex-col text-muted-foreground">
                <PieChart className="h-12 w-12 opacity-20 mb-2" />
                <p>No expenses this month.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl shadow-sm border-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Upcoming Payments</CardTitle>
              <CardDescription>Bills and EMIs due soon</CardDescription>
            </div>
            {summary.emisDueCount > 0 && (
              <div className="px-2.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {summary.emisDueCount} Due
              </div>
            )}
          </CardHeader>
          <CardContent>
            {summary.upcomingPayments.length > 0 ? (
              <div className="space-y-4 mt-4">
                {summary.upcomingPayments.map((payment) => (
                  <div key={`${payment.type}-${payment.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {payment.type === 'emi' ? <Wallet className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{payment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Due {format(parseISO(payment.dueDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="font-semibold font-mono text-sm">
                      {formatCurrency(payment.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <ShieldCheck className="h-6 w-6 opacity-50" />
                </div>
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs mt-1">No upcoming payments in the next 30 days.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-primary/5 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardHeader>
            <CardTitle>Emergency Fund</CardTitle>
            <CardDescription>Your safety net</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="relative mb-6">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted opacity-20" />
                <circle 
                  cx="80" 
                  cy="80" 
                  r="70" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - Math.min(summary.emergencyFundAmount / (summary.monthlyExpenses * 6 || 1), 1))}`}
                  className="text-primary transition-all duration-1000 ease-out" 
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-mono text-primary">
                  {Math.round(Math.min((summary.emergencyFundAmount / (summary.monthlyExpenses * 6 || 1)) * 100, 100))}%
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-1">Funded</span>
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-2xl font-bold tracking-tight">
                <AnimatedNumber value={summary.emergencyFundAmount} format={formatCurrency} />
              </p>
              <p className="text-sm text-muted-foreground">
                Target: {formatCurrency(summary.monthlyExpenses * 6)} (6 months)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ 
  title, 
  amount, 
  icon, 
  trend, 
  trendUp, 
  featured 
}: { 
  title: string; 
  amount: number; 
  icon: React.ReactNode; 
  trend?: string; 
  trendUp?: boolean;
  featured?: boolean;
}) {
  return (
    <Card className={`rounded-2xl transition-all duration-300 hover:shadow-md ${featured ? 'bg-primary text-primary-foreground border-transparent shadow-md' : 'shadow-sm border-primary/5'}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className={`text-sm font-medium ${featured ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
          {title}
        </CardTitle>
        <div className={`p-2 rounded-xl ${featured ? 'bg-primary-foreground/10' : 'bg-primary/5'}`}>
          {React.cloneElement(icon as React.ReactElement<any>, {
            className: `h-4 w-4 ${featured ? 'text-primary-foreground' : (icon as any).props.className}`
          })}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono tracking-tight">
          <AnimatedNumber value={amount} format={formatCurrency} />
        </div>
        {trend && (
          <p className={`text-xs mt-2 font-medium flex items-center ${featured ? 'text-primary-foreground/80' : (trendUp ? 'text-emerald-500' : 'text-destructive')}`}>
            {trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <Activity className="w-3 h-3 mr-1" />}
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
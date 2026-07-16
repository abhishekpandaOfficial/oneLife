import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  useListTransactions, 
  useDeleteTransaction, 
  TransactionType,
  getListTransactionsQueryKey,
  getGetDashboardSummaryQueryKey,
  getListBudgetsQueryKey,
  Transaction
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  MoreHorizontal, 
  Trash2, 
  Edit2, 
  Filter,
  ArrowLeftRight,
  CalendarDays,
  IndianRupee,
  RotateCcw
} from "lucide-react";
import { endOfMonth, endOfWeek, format, isWithinInterval, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, useCurrencyRefresh } from "@/components/ui/animated-number";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategorySelect } from "@/components/CategorySelect";
import { useToast } from "@/hooks/use-toast";

type DatePreset = "all" | "today" | "week" | "month" | "custom";

const toInputDate = (date: Date) => format(date, "yyyy-MM-dd");

function getPresetRange(preset: DatePreset) {
  const today = new Date();

  if (preset === "today") {
    return { from: toInputDate(today), to: toInputDate(today) };
  }

  if (preset === "week") {
    return {
      from: toInputDate(startOfWeek(today, { weekStartsOn: 1 })),
      to: toInputDate(endOfWeek(today, { weekStartsOn: 1 })),
    };
  }

  if (preset === "month") {
    return {
      from: toInputDate(startOfMonth(today)),
      to: toInputDate(endOfMonth(today)),
    };
  }

  return { from: "", to: "" };
}

function sumExpenses(transactions: Transaction[] | undefined, from?: Date, to?: Date) {
  return (transactions || []).reduce((total, tx) => {
    if (tx.type !== "expense") return total;

    if (from && to) {
      const txDate = parseISO(tx.date);
      if (!isWithinInterval(txDate, { start: from, end: to })) return total;
    }

    return total + tx.amount;
  }, 0);
}

export default function Transactions({ type }: { type?: TransactionType }) {
  useCurrencyRefresh();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState<TransactionType | "all">(type || "all");
  const [categoryId, setCategoryId] = useState<number | "all">("all");
  const [datePreset, setDatePreset] = useState<DatePreset>(type === "expense" ? "month" : "all");
  const initialRange = React.useMemo(() => getPresetRange(type === "expense" ? "month" : "all"), [type]);
  const [fromDate, setFromDate] = useState(initialRange.from);
  const [toDate, setToDate] = useState(initialRange.to);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const returnTo = type === "income" ? "/income" : type === "expense" ? "/expenses" : "/transactions";
  const addTransactionHref =
    type === "income"
      ? `/transactions/new?type=income&returnTo=${encodeURIComponent(returnTo)}`
      : type === "expense"
        ? `/transactions/new?type=expense&returnTo=${encodeURIComponent(returnTo)}`
        : `/transactions/new?returnTo=${encodeURIComponent(returnTo)}`;

  // ← KEY FIX: Whenever the route-level `type` prop changes (income ↔ expense ↔ all),
  // immediately sync filterType so data refetches without needing a refresh.
  React.useEffect(() => {
    setFilterType(type || "all");
    setSearch("");
    setDebouncedSearch("");
    setCategoryId("all");
    const nextPreset = type === "expense" ? "month" : "all";
    const nextRange = getPresetRange(nextPreset);
    setDatePreset(nextPreset);
    setFromDate(nextRange.from);
    setToDate(nextRange.to);
  }, [type]);

  // Reset category filter when transaction type filter changes
  React.useEffect(() => {
    setCategoryId("all");
  }, [filterType]);

  const queryParams = React.useMemo(() => ({
    type: filterType === "all" ? undefined : filterType,
    categoryId: categoryId === "all" ? undefined : categoryId,
    from: fromDate || undefined,
    to: toDate || undefined,
    search: debouncedSearch || undefined,
  }), [categoryId, debouncedSearch, filterType, fromDate, toDate]);
  const todayRange = getPresetRange("today");
  const weekRange = getPresetRange("week");
  const monthRange = getPresetRange("month");
  const showExpenseSummary = filterType === "expense" || type === "expense";

  const { data: transactions, isLoading, isError, error, refetch } = useListTransactions(queryParams, {
    query: {
      queryKey: getListTransactionsQueryKey(queryParams),
      staleTime: 15_000,
    }
  });
  const { data: todayExpenses } = useListTransactions({ type: "expense", ...todayRange }, {
    query: { enabled: showExpenseSummary, staleTime: 30_000 } as any,
  });
  const { data: weekExpenses } = useListTransactions({ type: "expense", ...weekRange }, {
    query: { enabled: showExpenseSummary, staleTime: 30_000 } as any,
  });
  const { data: monthExpenses } = useListTransactions({ type: "expense", ...monthRange }, {
    query: { enabled: showExpenseSummary, staleTime: 30_000 } as any,
  });

  const deleteTx = useDeleteTransaction({
    mutation: {
      onSuccess: () => {
        toast({ title: "Transaction deleted" });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListBudgetsQueryKey() });
        setDeleteId(null);
      },
      onError: () => {
        toast({ title: "Failed to delete", variant: "destructive" });
        setDeleteId(null);
      }
    }
  });

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === "custom") return;

    const range = getPresetRange(preset);
    setFromDate(range.from);
    setToDate(range.to);
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategoryId("all");
    setFilterType(type || "all");
    const preset = type === "expense" ? "month" : "all";
    handlePresetChange(preset);
  };

  const todayTotal = sumExpenses(todayExpenses);
  const weekTotal = sumExpenses(weekExpenses);
  const monthTotal = sumExpenses(monthExpenses);
  const filteredExpenseTotal = sumExpenses(transactions);
  const pageTitle = type === "income" ? "Income" : type === "expense" ? "Expenses" : "All Transactions";
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="text-muted-foreground mt-1">Manage and track your cash flow.</p>
        </div>
        <div className="flex items-center gap-2">
          {!type && (
            <Select value={filterType} onValueChange={(v) => setFilterType(v as TransactionType | "all")}>
              <SelectTrigger className="w-[140px] bg-background">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income Only</SelectItem>
                <SelectItem value="expense">Expenses Only</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Link href={addTransactionHref}>
            <Button className="rounded-full shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </Link>
        </div>
      </div>

      {showExpenseSummary && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Spent Today", value: todayTotal, tone: "text-destructive" },
            { label: "Spent This Week", value: weekTotal, tone: "text-amber-600" },
            { label: "Spent This Month", value: monthTotal, tone: "text-primary" },
            { label: "Visible Expenses", value: filteredExpenseTotal, tone: "text-foreground" },
          ].map((item) => (
            <Card key={item.label} className="glass-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className={`mt-1 text-2xl font-bold font-mono ${item.tone}`}>{formatCurrency(item.value)}</p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <IndianRupee className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-muted/20 flex flex-col gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search transactions..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "All Dates" },
                { value: "today", label: "Today" },
                { value: "week", label: "This Week" },
                { value: "month", label: "This Month" },
                { value: "custom", label: "Custom" },
              ].map((preset) => (
                <Button
                  key={preset.value}
                  type="button"
                  variant={datePreset === preset.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetChange(preset.value as DatePreset)}
                >
                  <CalendarDays className="mr-2 h-3.5 w-3.5" />
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:min-w-[520px]">
              <Input
                type="date"
                value={fromDate}
                onChange={(event) => {
                  setDatePreset("custom");
                  setFromDate(event.target.value);
                }}
                className="bg-background"
                aria-label="From date"
              />
              <Input
                type="date"
                value={toDate}
                onChange={(event) => {
                  setDatePreset("custom");
                  setToDate(event.target.value);
                }}
                className="bg-background"
                aria-label="To date"
              />
              <CategorySelect
                type={filterType === "all" ? "all" : filterType}
                value={categoryId}
                onChange={(id) => setCategoryId(id === "all" || id === null ? "all" : id)}
                allowAll
                placeholder="Category"
                className="bg-background"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {showExpenseSummary
                ? `Showing ${transactions?.length || 0} expenses/transactions. Total visible spend: ${formatCurrency(filteredExpenseTotal)}`
                : `Showing ${transactions?.length || 0} transactions.`}
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/40 text-muted-foreground font-medium border-b">
              <tr>
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 hidden sm:table-cell">Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 w-[80px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24 rounded-full" /></td>
                    <td className="px-6 py-4 hidden sm:table-cell"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4 flex justify-end"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-8 rounded-md" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <ArrowLeftRight className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-base font-medium">Transactions could not load</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {error instanceof Error ? error.message : "Please check the API server and try again."}
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                        <RotateCcw className="mr-2 h-3.5 w-3.5" />
                        Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : transactions?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <ArrowLeftRight className="h-6 w-6 opacity-50" />
                      </div>
                      <p className="text-base font-medium">No transactions found</p>
                      <p className="text-sm mt-1">Try adjusting your filters or add a new transaction.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions?.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                          tx.type === "income" ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                        }`}>
                          {tx.type === "income" ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{tx.description}</p>
                          <p className="text-xs text-muted-foreground sm:hidden mt-0.5">
                            {format(parseISO(tx.date), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {tx.categoryName ? (
                        <Badge variant="outline" className="font-normal" style={{ 
                          borderColor: tx.categoryColor ? `${tx.categoryColor}40` : undefined,
                          backgroundColor: tx.categoryColor ? `${tx.categoryColor}10` : undefined,
                          color: tx.categoryColor || undefined
                        }}>
                          {tx.categoryName}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Uncategorized</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground hidden sm:table-cell">
                      {format(parseISO(tx.date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold font-mono ${
                        tx.type === "income" ? "text-emerald-500" : ""
                      }`}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem onClick={() => setLocation(`/transactions/${tx.id}/edit?returnTo=${encodeURIComponent(returnTo)}`)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => setDeleteId(tx.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the transaction
              and update your balances.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteId && deleteTx.mutate({ id: deleteId })}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete Transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

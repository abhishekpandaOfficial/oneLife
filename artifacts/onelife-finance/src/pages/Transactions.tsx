import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  useListTransactions, 
  useDeleteTransaction, 
  TransactionType,
  getListTransactionsQueryKey,
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
  ArrowLeftRight
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/components/ui/animated-number";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";

export default function Transactions({ type }: { type?: TransactionType }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState<TransactionType | "all">(type || "all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: transactions, isLoading } = useListTransactions({
    type: filterType === "all" ? undefined : filterType,
    search: debouncedSearch || undefined,
  }, {
    query: {
      queryKey: getListTransactionsQueryKey({ type: filterType === "all" ? undefined : filterType, search: debouncedSearch || undefined })
    }
  });

  const deleteTx = useDeleteTransaction({
    mutation: {
      onSuccess: () => {
        toast({ title: "Transaction deleted" });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
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
          <Link href={type === "income" ? "/transactions/new?type=income" : type === "expense" ? "/transactions/new?type=expense" : "/transactions/new"}>
            <Button className="rounded-full shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search transactions..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
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
                          <DropdownMenuItem onClick={() => setLocation(`/transactions/${tx.id}/edit`)}>
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
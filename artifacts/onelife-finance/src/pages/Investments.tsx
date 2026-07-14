import React, { useState } from "react";
import { useListInvestments, useCreateInvestment, useUpdateInvestment, useDeleteInvestment, Investment, InvestmentType, getListInvestmentsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, TrendingUp, TrendingDown, Landmark, PieChart, Coins, Briefcase, Bitcoin, Trash2, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/components/ui/animated-number";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

const invIcons: Record<string, React.ReactNode> = {
  mutual_fund: <PieChart className="h-5 w-5" />,
  stocks: <TrendingUp className="h-5 w-5" />,
  ppf: <Landmark className="h-5 w-5" />,
  nps: <Briefcase className="h-5 w-5" />,
  fd: <Landmark className="h-5 w-5" />,
  gold: <Coins className="h-5 w-5 text-yellow-500" />,
  crypto: <Bitcoin className="h-5 w-5 text-orange-500" />
};

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  investmentType: z.enum(["mutual_fund", "stocks", "ppf", "nps", "fd", "gold", "crypto"]),
  investedAmount: z.coerce.number().min(0),
  currentValue: z.coerce.number().min(0),
  purchaseDate: z.string(),
  xirr: z.coerce.number().optional()
});

export default function Investments() {
  const { data: investments, isLoading } = useListInvestments();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateInvestment({
    mutation: {
      onSuccess: () => {
        toast({ title: "Investment added" });
        queryClient.invalidateQueries({ queryKey: getListInvestmentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setIsDialogOpen(false);
        setEditingInvestment(null);
        form.reset();
      },
      onError: () => toast({ title: "Failed to add", variant: "destructive" })
    }
  });

  const updateMutation = useUpdateInvestment({
    mutation: {
      onSuccess: () => {
        toast({ title: "Investment updated" });
        queryClient.invalidateQueries({ queryKey: getListInvestmentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setIsDialogOpen(false);
        setEditingInvestment(null);
        form.reset();
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" })
    }
  });

  const deleteMutation = useDeleteInvestment({
    mutation: {
      onSuccess: () => {
        toast({ title: "Investment removed" });
        queryClient.invalidateQueries({ queryKey: getListInvestmentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setDeleteId(null);
      }
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      investmentType: "mutual_fund",
      investedAmount: 0,
      currentValue: 0,
      purchaseDate: format(new Date(), "yyyy-MM-dd"),
      xirr: 0
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingInvestment) {
      updateMutation.mutate({ id: editingInvestment.id, data: values });
      return;
    }

    createMutation.mutate({ data: values });
  };

  const openAddDialog = () => {
    setEditingInvestment(null);
    form.reset({
      name: "",
      investmentType: "mutual_fund",
      investedAmount: 0,
      currentValue: 0,
      purchaseDate: format(new Date(), "yyyy-MM-dd"),
      xirr: 0
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    form.reset({
      name: investment.name,
      investmentType: investment.investmentType,
      investedAmount: investment.investedAmount,
      currentValue: investment.currentValue,
      purchaseDate: investment.purchaseDate,
      xirr: investment.xirr ?? 0
    });
    setIsDialogOpen(true);
  };

  const totalInvested = investments?.reduce((acc, inv) => acc + inv.investedAmount, 0) || 0;
  const totalCurrent = investments?.reduce((acc, inv) => acc + inv.currentValue, 0) || 0;
  const totalProfit = totalCurrent - totalInvested;
  const totalProfitPct = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const isPositive = totalProfit >= 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investments</h1>
          <p className="text-muted-foreground mt-1">Monitor your portfolio and wealth growth.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingInvestment(null);
        }}>
          <Button className="rounded-full shadow-md" onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Investment
          </Button>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingInvestment ? "Edit Asset" : "Add Asset"}</DialogTitle>
              <DialogDescription>{editingInvestment ? "Update this investment's values and details." : "Record a new investment to track its performance."}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Name</FormLabel>
                      <FormControl><Input placeholder="e.g. Nifty 50 Index" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="investmentType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                          <SelectItem value="stocks">Stocks</SelectItem>
                          <SelectItem value="fd">Fixed Deposit</SelectItem>
                          <SelectItem value="ppf">PPF</SelectItem>
                          <SelectItem value="nps">NPS</SelectItem>
                          <SelectItem value="gold">Gold</SelectItem>
                          <SelectItem value="crypto">Crypto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="investedAmount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invested Value</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="currentValue" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Value</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="purchaseDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="xirr" render={({ field }) => (
                    <FormItem>
                      <FormLabel>XIRR / CAGR % (Optional)</FormLabel>
                      <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingInvestment
                      ? updateMutation.isPending ? "Saving..." : "Save Changes"
                      : createMutation.isPending ? "Adding..." : "Add Asset"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-2xl border-primary/10 shadow-sm md:col-span-2 bg-gradient-to-br from-indigo-900 to-primary text-primary-foreground overflow-hidden relative">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
            <PieChart className="w-64 h-64" />
          </div>
          <CardContent className="p-8 relative z-10">
            <p className="text-primary-foreground/80 text-sm font-medium mb-1">Total Portfolio Value</p>
            <h2 className="text-4xl font-bold font-mono tracking-tight mb-6">{formatCurrency(totalCurrent)}</h2>
            
            <div className="flex gap-8 border-t border-primary-foreground/20 pt-6">
              <div>
                <p className="text-primary-foreground/70 text-xs uppercase tracking-wider mb-1 font-semibold">Invested</p>
                <p className="text-xl font-medium font-mono">{formatCurrency(totalInvested)}</p>
              </div>
              <div>
                <p className="text-primary-foreground/70 text-xs uppercase tracking-wider mb-1 font-semibold">Returns</p>
                <p className={`text-xl font-bold font-mono flex items-center ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{formatCurrency(totalProfit)}
                  <span className="text-sm ml-2 bg-primary-foreground/10 px-2 py-0.5 rounded">
                    {isPositive ? '+' : ''}{totalProfitPct.toFixed(2)}%
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-lg font-semibold mt-8 mb-4">Your Assets</h3>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-2xl"><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))
        ) : investments?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-2xl border border-dashed">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-foreground">No investments yet</p>
            <p className="text-sm">Start tracking your assets to see your wealth grow.</p>
          </div>
        ) : (
          investments?.map((inv) => {
            const profit = inv.currentValue - inv.investedAmount;
            const profitPct = inv.investedAmount > 0 ? (profit / inv.investedAmount) * 100 : 0;
            const isGain = profit >= 0;

            return (
              <Card key={inv.id} className="rounded-2xl transition-all duration-300 group border-primary/5 hover:border-primary/20 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                        {invIcons[inv.investmentType] || <Briefcase className="h-5 w-5" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground truncate max-w-[140px]">{inv.name}</h3>
                        <Badge variant="secondary" className="uppercase text-[9px] px-1.5 py-0">
                          {inv.investmentType.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => handleEdit(inv)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(inv.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Current Value</p>
                      <p className="font-mono font-bold text-lg">{formatCurrency(inv.currentValue)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold flex items-center justify-end ${isGain ? 'text-emerald-500' : 'text-destructive'}`}>
                        {isGain ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {isGain ? '+' : ''}{profitPct.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {isGain ? '+' : ''}{formatCurrency(profit)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                    <span>Invested: <span className="font-mono font-medium text-foreground">{formatCurrency(inv.investedAmount)}</span></span>
                    {inv.xirr ? <span className="font-medium bg-muted px-2 py-0.5 rounded">XIRR: {inv.xirr}%</span> : null}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the asset from your portfolio. Your net worth calculation will update.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

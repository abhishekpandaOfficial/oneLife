import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { 
  useListBudgets, 
  useCreateBudget, 
  useUpdateBudget,
  useDeleteBudget,
  useListCategories,
  getListBudgetsQueryKey,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";
import type { Budget } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, PieChart, ChevronLeft, ChevronRight, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { format, subMonths, addMonths } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/components/ui/animated-number";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const formSchema = z.object({
  categoryId: z.coerce.number().min(1, "Select a category"),
  plannedAmount: z.coerce.number().min(1, "Amount required"),
});

function monthFromQuery(month: string | null): Date | null {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return null;
  const [year, monthNumber] = month.split("-").map(Number);
  if (monthNumber < 1 || monthNumber > 12) return null;
  return new Date(year, monthNumber - 1, 1);
}

export default function Budget() {
  const [location, setLocation] = useLocation();
  const consumedCreateAction = useRef<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return monthFromQuery(params.get("month")) ?? new Date();
  });
  const monthStr = format(currentMonth, "yyyy-MM");
  
  const { data: budgets, isLoading } = useListBudgets({ month: monthStr });
  const { data: categories } = useListCategories({ type: "expense" });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateBudget({
    mutation: {
      onSuccess: () => {
        toast({ title: "Budget set" });
        queryClient.invalidateQueries({ queryKey: getListBudgetsQueryKey({ month: monthStr }) });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setIsDialogOpen(false);
        setEditingBudget(null);
        form.reset();
      },
      onError: () => toast({ title: "Failed to set budget", variant: "destructive" })
    }
  });

  const updateMutation = useUpdateBudget({
    mutation: {
      onSuccess: () => {
        toast({ title: "Budget updated" });
        queryClient.invalidateQueries({ queryKey: getListBudgetsQueryKey({ month: monthStr }) });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setIsDialogOpen(false);
        setEditingBudget(null);
        form.reset();
      },
      onError: () => toast({ title: "Failed to update budget", variant: "destructive" })
    }
  });

  const deleteMutation = useDeleteBudget({
    mutation: {
      onSuccess: () => {
        toast({ title: "Budget deleted" });
        queryClient.invalidateQueries({ queryKey: getListBudgetsQueryKey({ month: monthStr }) });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setDeleteId(null);
      },
      onError: () => {
        toast({ title: "Failed to delete budget", variant: "destructive" });
        setDeleteId(null);
      }
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: 0,
      plannedAmount: 0,
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, data: { plannedAmount: values.plannedAmount } });
      return;
    }

    createMutation.mutate({ data: { ...values, month: monthStr } });
  };

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  const openAddDialog = () => {
    setEditingBudget(null);
    form.reset({
      categoryId: 0,
      plannedAmount: 0,
    });
    setIsDialogOpen(true);
  };

  useEffect(() => {
    const [, search = ""] = location.split("?");
    const params = new URLSearchParams(search);
    const requestedMonth = monthFromQuery(params.get("month"));
    const shouldCreate = params.get("action") === "create";

    if (requestedMonth && format(requestedMonth, "yyyy-MM") !== monthStr) {
      setCurrentMonth(requestedMonth);
    }

    if (shouldCreate && consumedCreateAction.current !== location) {
      consumedCreateAction.current = location;
      setEditingBudget(null);
      form.reset({
        categoryId: 0,
        plannedAmount: 0,
      });
      setIsDialogOpen(true);
    }
  }, [form, location, monthStr]);

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    form.reset({
      categoryId: budget.categoryId,
      plannedAmount: budget.plannedAmount,
    });
    setIsDialogOpen(true);
  };

  const totalPlanned = budgets?.reduce((acc, b) => acc + b.plannedAmount, 0) || 0;
  const totalActual = budgets?.reduce((acc, b) => acc + b.actualAmount, 0) || 0;
  const totalProgress = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
  
  // Filter out categories that already have a budget this month
  const availableCategories = categories?.filter(c => !budgets?.some(b => b.categoryId === c.id)) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Planner</h1>
          <p className="text-muted-foreground mt-1">Plan your expenses and monitor spending.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-card px-4 py-1.5 rounded-full shadow-sm border">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold w-28 text-center">{format(currentMonth, "MMMM yyyy")}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingBudget(null);
            const [, search = ""] = location.split("?");
            const params = new URLSearchParams(search);
            if (params.get("action") === "create") {
              setLocation(`/budget?month=${monthStr}`, { replace: true });
            }
          }
        }}>
          <Button className="rounded-full shadow-md" onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Set Budget
          </Button>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>{editingBudget ? "Edit Category Budget" : "Set Category Budget"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="categoryId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expense Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ? field.value.toString() : ""} disabled={!!editingBudget}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        {editingBudget ? (
                          <SelectItem value={editingBudget.categoryId.toString()}>{editingBudget.categoryName}</SelectItem>
                        ) : availableCategories.length === 0 ? (
                          <SelectItem value="0" disabled>All categories have budgets</SelectItem>
                        ) : (
                          availableCategories.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="plannedAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Limit</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || (!editingBudget && availableCategories.length === 0)}>
                    {editingBudget
                      ? updateMutation.isPending ? "Saving..." : "Save Changes"
                      : createMutation.isPending ? "Saving..." : "Save Budget"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl border-primary/5 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 bg-gradient-to-r from-card to-muted/30 flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-40 h-40 shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted opacity-30" />
              <circle 
                cx="80" cy="80" r="70" 
                stroke="currentColor" strokeWidth="12" fill="transparent" 
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - Math.min(totalProgress / 100, 1))}`}
                className={totalProgress > 100 ? "text-destructive" : "text-primary transition-all duration-1000 ease-out"} 
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold font-mono ${totalProgress > 100 ? 'text-destructive' : 'text-primary'}`}>
                {totalProgress.toFixed(0)}%
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-1">Used</span>
            </div>
          </div>
          
          <div className="flex-1 grid grid-cols-2 gap-6 w-full">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Planned Budget</p>
              <p className="text-3xl font-bold font-mono tracking-tight">{formatCurrency(totalPlanned)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Actual Spent</p>
              <p className={`text-3xl font-bold font-mono tracking-tight ${totalActual > totalPlanned ? 'text-destructive' : ''}`}>
                {formatCurrency(totalActual)}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-muted-foreground mb-1">Remaining Safe to Spend</p>
              <p className="text-xl font-bold font-mono tracking-tight text-emerald-500">
                {formatCurrency(Math.max(totalPlanned - totalActual, 0))}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Category Breakdown</h3>
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : budgets?.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground bg-card rounded-2xl border border-dashed">
            <PieChart className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-foreground">No budgets set for {format(currentMonth, "MMMM")}</p>
            <p className="text-sm">Click "Set Budget" to assign limits to your categories.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {budgets?.map((budget) => {
              const pct = (budget.actualAmount / budget.plannedAmount) * 100;
              const isOver = pct >= 100;
              const isWarning = pct >= 85 && !isOver;

              return (
                <Card key={budget.id} className={`rounded-xl border-primary/5 hover:shadow-md transition-shadow group ${isOver ? 'border-destructive/30 bg-destructive/5' : ''}`}>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: budget.categoryColor }} />
                        <span className="font-semibold">{budget.categoryName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isOver && <AlertTriangle className="h-4 w-4 text-destructive" />}
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleEdit(budget)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(budget.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-mono font-medium text-lg">{formatCurrency(budget.actualAmount)}</span>
                      <span className="text-xs text-muted-foreground">of {formatCurrency(budget.plannedAmount)}</span>
                    </div>
                    
                    <Progress 
                      value={Math.min(pct, 100)} 
                      className={`h-2 bg-muted`} 
                      indicatorClassName={isOver ? 'bg-destructive' : isWarning ? 'bg-orange-500' : 'bg-primary'}
                    />
                    
                    <div className="flex justify-between text-xs mt-2 font-medium">
                      <span className={isOver ? 'text-destructive' : isWarning ? 'text-orange-500' : 'text-primary'}>
                        {pct.toFixed(1)}%
                      </span>
                      <span className="text-muted-foreground">
                        {isOver ? (
                          <span className="text-destructive font-semibold">Over by {formatCurrency(budget.actualAmount - budget.plannedAmount)}</span>
                        ) : (
                          `${formatCurrency(budget.plannedAmount - budget.actualAmount)} left`
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget?</AlertDialogTitle>
            <AlertDialogDescription>This removes the category limit for {format(currentMonth, "MMMM yyyy")}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

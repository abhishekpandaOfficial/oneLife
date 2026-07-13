import React, { useState } from "react";
import { 
  useListCategories, 
  useCreateCategory, 
  useDeleteCategory, 
  TransactionType, 
  getListCategoriesQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Tags, Trash2, ArrowUpRight, ArrowDownRight, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const COLORS = [
  "#f43f5e", "#ec4899", "#d946ef", "#a855f7", "#8b5cf6", 
  "#6366f1", "#3b82f6", "#0ea5e9", "#0ea5e9", "#06b6d4", 
  "#0ea5e9", "#14b8a6", "#0ea5e9", "#10b981", "#10b981", 
  "#34d399", "#84cc16", "#84cc16", "#eab308", "#f59e0b", 
  "#f97316", "#ea580c", "#ef4444"
];

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["income", "expense"]),
  color: z.string().min(4, "Color is required"),
});

export default function Categories() {
  const { data: categories, isLoading } = useListCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TransactionType>("expense");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateCategory({
    mutation: {
      onSuccess: () => {
        toast({ title: "Category created" });
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: () => toast({ title: "Failed to create category", variant: "destructive" })
    }
  });

  const deleteMutation = useDeleteCategory({
    mutation: {
      onSuccess: () => {
        toast({ title: "Category deleted" });
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      },
      onError: () => toast({ title: "Failed to delete. It might be in use.", variant: "destructive" })
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "expense",
      color: "#6366f1",
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate({ data: values });
  };

  const filteredCategories = categories?.filter(c => c.type === activeTab) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">Organize your transactions for better reporting.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Groceries, Salary..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="color" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                        {COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                            style={{ backgroundColor: c }}
                            onClick={() => field.onChange(c)}
                          >
                            {field.value === c && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Save Category"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden flex flex-col">
        <div className="flex border-b bg-muted/20">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'expense' ? 'bg-background border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
            onClick={() => setActiveTab('expense')}
          >
            <ArrowUpRight className="w-4 h-4 inline mr-2" /> Expenses
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'income' ? 'bg-background border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
            onClick={() => setActiveTab('income')}
          >
            <ArrowDownRight className="w-4 h-4 inline mr-2" /> Income
          </button>
        </div>

        <div className="p-4 sm:p-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))
          ) : filteredCategories.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed">
              <Tags className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-foreground">No {activeTab} categories found</p>
              <p className="text-sm mt-1">Create one to organize your transactions.</p>
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div key={cat.id} className="group flex items-center justify-between p-3 rounded-xl border bg-card hover:border-primary/30 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15` }}>
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  </div>
                  <span className="font-medium text-sm">{cat.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                  onClick={() => deleteMutation.mutate({ id: cat.id })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
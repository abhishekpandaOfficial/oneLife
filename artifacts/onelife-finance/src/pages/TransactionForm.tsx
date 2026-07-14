import React, { useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useCreateTransaction, 
  useUpdateTransaction, 
  useGetTransaction,
  useListCategories,
  TransactionType,
  getListTransactionsQueryKey,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useCurrencyRefresh, getGlobalRates } from "@/components/ui/animated-number";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  QAR: "ر.ق",
  SAR: "ر.س",
  AED: "د.إ",
};

const formSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(2, "Description is required"),
  date: z.date(),
  categoryId: z.coerce.number().nullable().optional(),
  isRecurring: z.boolean().default(false)
});

type FormValues = z.infer<typeof formSchema>;

const LIST_PATHS = new Set(["/income", "/expenses", "/transactions"]);

export default function TransactionForm({ params }: { params?: { id?: string } }) {
  const isEditing = !!params?.id;
  const transactionId = isEditing ? parseInt(params.id!) : undefined;
  
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const requestedType = searchParams.get("type");
  const defaultType: TransactionType = requestedType === "income" || requestedType === "expense" ? requestedType : "expense";
  const fallbackPath = requestedType === "income" ? "/income" : requestedType === "expense" ? "/expenses" : "/transactions";
  const requestedReturnTo = searchParams.get("returnTo");
  const returnTo = requestedReturnTo && LIST_PATHS.has(requestedReturnTo) ? requestedReturnTo : fallbackPath;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const activeCurrency = useCurrencyRefresh();
  const rates = getGlobalRates();
  const activeRate = rates[activeCurrency as keyof typeof rates] || 1.0;
  const currencySymbol = CURRENCY_SYMBOLS[activeCurrency] || "₹";
  const hydratedTransactionId = useRef<number | null>(null);

  const { data: transaction, isLoading: isTxLoading } = useGetTransaction(transactionId!, {
    query: { enabled: isEditing } as any
  });

  const { data: categories } = useListCategories();

  const createMutation = useCreateTransaction({
    mutation: {
      onSuccess: () => {
        toast({ title: "Transaction added successfully" });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        navigateBack();
      },
      onError: (err) => {
        toast({ title: "Error saving transaction", variant: "destructive" });
      }
    }
  });

  const updateMutation = useUpdateTransaction({
    mutation: {
      onSuccess: () => {
        toast({ title: "Transaction updated" });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        navigateBack();
      },
      onError: () => {
        toast({ title: "Error updating transaction", variant: "destructive" });
      }
    }
  });

  const navigateBack = () => {
    setLocation(returnTo);
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: defaultType,
      amount: 0,
      description: "",
      date: new Date(),
      categoryId: null,
      isRecurring: false,
    }
  });

  // Reset form when editing data loads
  useEffect(() => {
    if (transaction && hydratedTransactionId.current !== transaction.id) {
      const amountInActiveCurrency = Number((transaction.amount * activeRate).toFixed(2));
      form.reset({
        type: transaction.type,
        amount: amountInActiveCurrency,
        description: transaction.description,
        date: new Date(transaction.date),
        categoryId: transaction.categoryId,
        isRecurring: transaction.isRecurring,
      });
      hydratedTransactionId.current = transaction.id;
    }
  }, [transaction, form, activeRate]);

  const onSubmit = (data: FormValues) => {
    const amountInInr = Number((data.amount / activeRate).toFixed(2));
    const payload = {
      ...data,
      amount: amountInInr,
      date: format(data.date, "yyyy-MM-dd"),
    };

    if (isEditing) {
      updateMutation.mutate({ id: transactionId!, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  
  // Filter categories based on selected type
  const selectedType = form.watch("type");
  const filteredCategories = categories?.filter(c => c.type === selectedType) || [];

  if (isEditing && isTxLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={navigateBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEditing ? 'Edit Transaction' : 'New Transaction'}</h1>
          <p className="text-muted-foreground text-sm">Enter the details below to record it.</p>
        </div>
      </div>

      <Card className="rounded-2xl border-primary/10 shadow-sm">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="income">Income</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currencySymbol}</span>
                          <Input type="number" step="0.01" className="pl-7 font-mono font-medium text-lg h-10" placeholder="0.00" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Groceries at Whole Foods, Salary, Rent" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val === "none" ? null : parseInt(val))} 
                        value={field.value?.toString() || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Uncategorized</SelectItem>
                          {filteredCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                {cat.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-end">
                      <FormLabel className="mb-2">Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4 border-t">
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Recurring Transaction</FormLabel>
                        <CardDescription>
                          Mark this if it repeats regularly.
                        </CardDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={navigateBack}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="min-w-[120px]">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? 'Save Changes' : 'Record'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState } from "react";
import { Link } from "wouter";
import { useListLoans, useCreateLoan, LoanType, getListLoansQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Wallet, Car, Home, GraduationCap, Coins, CreditCard, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/components/ui/animated-number";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const loanTypeIcons: Record<string, React.ReactNode> = {
  home: <Home className="h-5 w-5" />,
  car: <Car className="h-5 w-5" />,
  personal: <CreditCard className="h-5 w-5" />,
  gold: <Coins className="h-5 w-5" />,
  education: <GraduationCap className="h-5 w-5" />,
  other: <Wallet className="h-5 w-5" />
};

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  loanType: z.enum(["home", "car", "personal", "gold", "education", "other"]),
  principalAmount: z.coerce.number().min(1),
  outstandingAmount: z.coerce.number().min(0).optional(),
  interestRate: z.coerce.number().min(0),
  emiAmount: z.coerce.number().min(1),
  tenureMonths: z.coerce.number().min(1),
  startDate: z.string()
});

export default function Loans() {
  const { data: loans, isLoading } = useListLoans();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateLoan({
    mutation: {
      onSuccess: () => {
        toast({ title: "Loan added successfully" });
        queryClient.invalidateQueries({ queryKey: getListLoansQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: () => {
        toast({ title: "Failed to add loan", variant: "destructive" });
      }
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      loanType: "personal",
      principalAmount: 0,
      outstandingAmount: 0,
      interestRate: 0,
      emiAmount: 0,
      tenureMonths: 12,
      startDate: format(new Date(), "yyyy-MM-dd")
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate({ data: { ...values, outstandingAmount: values.outstandingAmount || values.principalAmount } });
  };

  const totalOutstanding = loans?.reduce((acc, loan) => acc + loan.outstandingAmount, 0) || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Loans</h1>
          <p className="text-muted-foreground mt-1">Track your debt, EMIs, and amortization.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              Add Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Loan</DialogTitle>
              <DialogDescription>Enter the details of your loan to track its progress.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Name</FormLabel>
                    <FormControl><Input placeholder="e.g. HDFC Home Loan" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="loanType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="home">Home Loan</SelectItem>
                          <SelectItem value="car">Car Loan</SelectItem>
                          <SelectItem value="personal">Personal Loan</SelectItem>
                          <SelectItem value="gold">Gold Loan</SelectItem>
                          <SelectItem value="education">Education Loan</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="principalAmount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Principal Amount</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="outstandingAmount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outstanding (Optional)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="interestRate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate (%)</FormLabel>
                      <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="emiAmount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>EMI</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="tenureMonths" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Months</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Adding..." : "Add Loan"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-2xl border-primary/10 bg-primary text-primary-foreground shadow-md md:col-span-3">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-primary-foreground/80 text-sm font-medium mb-1">Total Outstanding Debt</p>
              <h2 className="text-4xl font-bold font-mono tracking-tight">{formatCurrency(totalOutstanding)}</h2>
            </div>
            <div className="flex gap-4">
              <div className="bg-primary-foreground/10 p-4 rounded-xl">
                <p className="text-primary-foreground/70 text-xs uppercase tracking-wider mb-1 font-semibold">Total EMIs</p>
                <p className="text-xl font-bold font-mono">
                  {formatCurrency(loans?.reduce((acc, l) => acc + (l.status === 'active' ? l.emiAmount : 0), 0) || 0)}
                  <span className="text-sm font-normal opacity-80">/mo</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-2xl"><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))
        ) : loans?.length === 0 ? (
          <div className="md:col-span-3 py-12 text-center text-muted-foreground bg-card rounded-2xl border border-dashed">
            <Wallet className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-foreground">No active loans</p>
            <p className="text-sm">You're debt-free! Or you just haven't added them yet.</p>
          </div>
        ) : (
          loans?.map((loan) => {
            const progress = ((loan.principalAmount - loan.outstandingAmount) / loan.principalAmount) * 100;
            return (
              <Link key={loan.id} href={`/loans/${loan.id}`}>
                <Card className="rounded-2xl hover:shadow-md transition-all duration-300 cursor-pointer group border-primary/5 hover:border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                          {loanTypeIcons[loan.loanType] || loanTypeIcons.other}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{loan.name}</h3>
                          <p className="text-xs text-muted-foreground capitalize">{loan.loanType} Loan • {loan.interestRate}% ROI</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-muted-foreground">Outstanding</span>
                          <span className="font-mono font-medium">{formatCurrency(loan.outstandingAmount)}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-[10px] mt-1.5 text-muted-foreground uppercase tracking-wider font-semibold">
                          <span>{progress.toFixed(1)}% Paid</span>
                          <span>{formatCurrency(loan.principalAmount)} Total</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-4 border-t border-dashed">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Monthly EMI</p>
                          <p className="font-mono font-medium">{formatCurrency(loan.emiAmount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-0.5">Remaining</p>
                          <p className="font-medium text-sm">{loan.monthsRemaining} mos</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
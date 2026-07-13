import React from "react";
import { Link } from "wouter";
import { useGetLoan, useUpdateEmi, EmiStatus, getGetLoanQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/components/ui/animated-number";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

export default function LoanDetail({ params }: { params: { id: string } }) {
  const loanId = parseInt(params.id);
  const { data: loan, isLoading } = useGetLoan(loanId);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateEmiMutation = useUpdateEmi({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLoanQueryKey(loanId) });
      },
      onError: () => {
        toast({ title: "Failed to update EMI status", variant: "destructive" });
      }
    }
  });

  const handleEmiStatusChange = (emiId: number, status: EmiStatus) => {
    updateEmiMutation.mutate({
      id: emiId,
      data: {
        status,
        paidDate: status === 'paid' ? format(new Date(), "yyyy-MM-dd") : null
      }
    });
  };

  if (isLoading || !loan) {
    return <div className="p-8"><Skeleton className="h-64 w-full rounded-2xl" /></div>;
  }

  const progress = ((loan.principalAmount - loan.outstandingAmount) / loan.principalAmount) * 100;
  
  const paymentBreakdown = [
    { name: "Principal Paid", value: loan.principalPaid, color: "hsl(var(--chart-2))" },
    { name: "Interest Paid", value: loan.interestPaid, color: "hsl(var(--chart-4))" },
    { name: "Outstanding", value: loan.outstandingAmount, color: "hsl(var(--muted))" }
  ];

  const getStatusBadge = (status: EmiStatus) => {
    switch (status) {
      case 'paid': return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Paid</Badge>;
      case 'pending': return <Badge variant="outline" className="text-muted-foreground"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'overdue': return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20"><AlertCircle className="w-3 h-3 mr-1" /> Overdue</Badge>;
      case 'partial': return <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20"><RefreshCw className="w-3 h-3 mr-1" /> Partial</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/loans">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{loan.name}</h1>
            <Badge variant={loan.status === 'active' ? "default" : "secondary"} className="uppercase tracking-wider text-[10px]">
              {loan.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 capitalize">{loan.loanType} Loan • Started {format(parseISO(loan.startDate), "MMM yyyy")}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-2xl border-primary/5 shadow-sm md:col-span-2 bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Principal</p>
                <p className="text-xl font-bold font-mono">{formatCurrency(loan.principalAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Interest Rate</p>
                <p className="text-xl font-bold font-mono">{loan.interestRate}% <span className="text-sm font-normal text-muted-foreground">p.a.</span></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Monthly EMI</p>
                <p className="text-xl font-bold font-mono">{formatCurrency(loan.emiAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Tenure</p>
                <p className="text-xl font-bold font-mono">{loan.tenureMonths} <span className="text-sm font-normal text-muted-foreground">mos</span></p>
              </div>
            </div>

            <div className="bg-background rounded-xl p-5 border shadow-sm">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-sm font-medium">Repayment Progress</p>
                  <p className="text-2xl font-bold font-mono text-primary">{progress.toFixed(1)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Outstanding Amount</p>
                  <p className="font-mono font-medium text-lg">{formatCurrency(loan.outstandingAmount)}</p>
                </div>
              </div>
              <Progress value={progress} className="h-3 rounded-full bg-muted" />
              <div className="flex justify-between text-xs mt-3 text-muted-foreground font-medium">
                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-primary mr-1.5" /> Principal Paid: {formatCurrency(loan.principalPaid)}</span>
                <span>{loan.monthsRemaining} months remaining</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Payment Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {paymentBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-2 mt-2">
              {paymentBreakdown.map(item => (
                <div key={item.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-mono font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-primary/5 shadow-sm">
        <CardHeader>
          <CardTitle>EMI Schedule</CardTitle>
          <CardDescription>Amortization and payment tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 text-muted-foreground font-medium border-b">
                <tr>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Paid On</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loan.emis.map((emi) => (
                  <tr key={emi.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {format(parseISO(emi.dueDate), "MMM dd, yyyy")}
                    </td>
                    <td className="px-4 py-3 font-mono text-right">
                      {formatCurrency(emi.amount)}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(emi.status)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {emi.paidDate ? format(parseISO(emi.paidDate), "MMM dd, yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {emi.status !== 'paid' && (
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleEmiStatusChange(emi.id, 'paid')}
                          >
                            Mark Paid
                          </Button>
                        </div>
                      )}
                      {emi.status === 'paid' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-xs text-muted-foreground"
                          onClick={() => handleEmiStatusChange(emi.id, 'pending')}
                        >
                          Undo
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
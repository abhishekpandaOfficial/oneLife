import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { useGetLoan, useUpdateEmi, useUpdateLoan, EmiStatus, getGetLoanQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, RefreshCw, FileText, Download, Upload, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
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

  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});

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

  const updateLoanMutation = useUpdateLoan({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLoanQueryKey(loanId) });
        toast({ title: "Document uploaded successfully" });
      },
      onError: () => {
        toast({ title: "Failed to upload document", variant: "destructive" });
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

  const handleFileUpload = (type: "disbursement" | "repayment") => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && loan) {
        const updateData: Record<string, any> = {};
        if (type === "disbursement") {
          updateData.disbursementDocUrl = file.name;
        } else {
          updateData.repaymentScheduleDocUrl = file.name;
        }
        updateLoanMutation.mutate({
          id: loan.id,
          data: updateData
        });
      }
    };
    input.click();
  };

  // Group EMIs by year
  const getGroupedEmis = () => {
    if (!loan?.emis) return {};
    return loan.emis.reduce((acc, emi) => {
      const year = parseISO(emi.dueDate).getFullYear();
      acc[year] = acc[year] || [];
      acc[year].push(emi);
      return acc;
    }, {} as Record<number, typeof loan.emis>);
  };

  const groupedEmis = getGroupedEmis();
  const years = Object.keys(groupedEmis).map(Number).sort((a, b) => a - b);

  // Initialize expanded years (current year expanded by default)
  useEffect(() => {
    if (years.length > 0 && Object.keys(expandedYears).length === 0) {
      const currentYear = new Date().getFullYear();
      const initial: Record<number, boolean> = {};
      years.forEach((y) => {
        initial[y] = y === currentYear || years.length === 1;
      });
      setExpandedYears(initial);
    }
  }, [loan]);

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));
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

  const getStatusBadge = (emi: any) => {
    switch (emi.status) {
      case 'paid': 
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Paid</Badge>;
      case 'pending': 
        return <Badge variant="outline" className="text-muted-foreground"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'overdue': 
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20"><AlertCircle className="w-3 h-3 mr-1" /> Overdue</Badge>
            <span className="text-[10px] text-destructive/80 font-mono font-semibold">
              {emi.overdueDays} days overdue • Penalty: {formatCurrency(emi.penaltyAmount)}
            </span>
          </div>
        );
      case 'partial': 
        return <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20"><RefreshCw className="w-3 h-3 mr-1" /> Partial</Badge>;
      default:
        return <Badge variant="outline">{emi.status}</Badge>;
    }
  };

  const totalPenalty = loan.emis.reduce((sum, e) => sum + (e.penaltyAmount || 0), 0);

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
          <p className="text-muted-foreground mt-1 capitalize">
            {loan.bankName ? `${loan.bankName} • ` : ""}{loan.loanType} Loan • Started {format(parseISO(loan.startDate), "MMM yyyy")}
          </p>
        </div>
      </div>

      {/* Penalty Warning Banner */}
      {totalPenalty > 0 && (
        <Card className="border-destructive/30 bg-destructive/5 text-destructive">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Overdue Penalty Alert</h4>
              <p className="text-sm opacity-90 mt-0.5">
                You have accrued a total penalty of <span className="font-bold font-mono">{formatCurrency(totalPenalty)}</span> due to unpaid or overdue EMIs. Unmark payments will continue to accrue interest based on your penalty rate of <span className="font-bold">{loan.penaltyRate}%</span>.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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

        {/* Documents Section */}
        <Card className="rounded-2xl border-primary/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Loan Documents</CardTitle>
            <CardDescription>View and download loan agreements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Disbursement Document */}
            <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">Disbursement Doc</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {loan.disbursementDocUrl ? loan.disbursementDocUrl : "Not uploaded"}
                  </p>
                </div>
              </div>
              {loan.disbursementDocUrl ? (
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-primary" onClick={() => toast({ title: `Downloading ${loan.disbursementDocUrl}` })}>
                  <Download className="h-4 w-4" />
                </Button>
              ) : (
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={() => handleFileUpload("disbursement")}>
                  <Upload className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Repayment Schedule */}
            <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">Repayment Schedule</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {loan.repaymentScheduleDocUrl ? loan.repaymentScheduleDocUrl : "Not uploaded"}
                  </p>
                </div>
              </div>
              {loan.repaymentScheduleDocUrl ? (
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-primary" onClick={() => toast({ title: `Downloading ${loan.repaymentScheduleDocUrl}` })}>
                  <Download className="h-4 w-4" />
                </Button>
              ) : (
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={() => handleFileUpload("repayment")}>
                  <Upload className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accordion Grouped Year-Wise EMI Schedule */}
      <Card className="rounded-2xl border-primary/5 shadow-sm">
        <CardHeader>
          <CardTitle>EMI Schedule</CardTitle>
          <CardDescription>Amortization schedule grouped year-wise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {years.map((year) => {
            const emisInYear = groupedEmis[year];
            const isExpanded = !!expandedYears[year];
            const totalPaidInYear = emisInYear.filter(e => e.status === 'paid').length;

            return (
              <div key={year} className="border rounded-xl overflow-hidden">
                {/* Year Accordion Header */}
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors font-semibold text-sm text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold">{year} Repayments</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {totalPaidInYear} / {emisInYear.length} Paid
                    </Badge>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {/* Year Accordion Body */}
                {isExpanded && (
                  <div className="overflow-x-auto border-t">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/10 text-muted-foreground font-medium border-b">
                        <tr>
                          <th className="px-4 py-3">Due Date</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Paid On</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {emisInYear.map((emi) => (
                          <tr key={emi.id} className="hover:bg-muted/5 transition-colors">
                            <td className="px-4 py-3 font-medium">
                              {format(parseISO(emi.dueDate), "MMM dd, yyyy")}
                            </td>
                            <td className="px-4 py-3 font-mono text-right">
                              {formatCurrency(emi.amount)}
                            </td>
                            <td className="px-4 py-3">
                              {getStatusBadge(emi)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {emi.paidDate ? format(parseISO(emi.paidDate), "MMM dd, yyyy") : "—"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {emi.status !== 'paid' ? (
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
                              ) : (
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
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
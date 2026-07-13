import React, { useState } from "react";
import {
  useListCreditCards,
  useCreateCreditCard,
  useUpdateCreditCard,
  useDeleteCreditCard,
  getListCreditCardsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, CreditCard as CardIcon, Trash2, Calendar, AlertTriangle, CheckCircle, Pencil } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/components/ui/animated-number";
import { Badge } from "@/components/ui/badge";
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

const INDIAN_BANKS = [
  { name: "State Bank of India (SBI)", color: "from-blue-600 to-cyan-500", logoText: "SBI" },
  { name: "HDFC Bank", color: "from-blue-800 to-indigo-900", logoText: "HDFC" },
  { name: "ICICI Bank", color: "from-orange-600 to-amber-500", logoText: "ICICI" },
  { name: "Axis Bank", color: "from-rose-950 to-rose-700", logoText: "Axis" },
  { name: "Kotak Mahindra Bank", color: "from-red-600 to-rose-500", logoText: "Kotak" },
  { name: "Punjab National Bank (PNB)", color: "from-amber-700 to-yellow-600", logoText: "PNB" },
  { name: "Bank of Baroda (BoB)", color: "from-orange-700 to-orange-500", logoText: "BoB" },
  { name: "IDFC First Bank", color: "from-red-800 to-red-950", logoText: "IDFC" },
  { name: "American Express (Amex)", color: "from-sky-500 to-blue-500", logoText: "Amex" },
];

const formSchema = z.object({
  name: z.string().min(2, "Card Name is required"),
  bankName: z.string().min(2, "Bank Name is required"),
  creditLimit: z.coerce.number().min(0, "Credit Limit must be positive"),
  outstandingAmount: z.coerce.number().min(0, "Outstanding must be positive"),
  dueDate: z.string(),
  minimumDue: z.coerce.number().min(0, "Minimum due must be positive"),
});

export default function CreditCards() {
  const { data: cards, isLoading } = useListCreditCards();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [customBank, setCustomBank] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateCreditCard({
    mutation: {
      onSuccess: () => {
        toast({ title: "Credit card added successfully" });
        queryClient.invalidateQueries({ queryKey: getListCreditCardsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: () => toast({ title: "Failed to add card", variant: "destructive" }),
    },
  });

  const updateMutation = useUpdateCreditCard({
    mutation: {
      onSuccess: () => {
        toast({ title: "Credit card updated successfully" });
        queryClient.invalidateQueries({ queryKey: getListCreditCardsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setIsDialogOpen(false);
        setEditingCard(null);
        form.reset();
      },
      onError: () => toast({ title: "Failed to update card", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteCreditCard({
    mutation: {
      onSuccess: () => {
        toast({ title: "Credit card deleted" });
        queryClient.invalidateQueries({ queryKey: getListCreditCardsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setDeleteId(null);
      },
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      bankName: "",
      creditLimit: 0,
      outstandingAmount: 0,
      dueDate: format(new Date(), "yyyy-MM-dd"),
      minimumDue: 0,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingCard) {
      updateMutation.mutate({ id: editingCard.id, data: values });
    } else {
      createMutation.mutate({ data: values });
    }
  };

  const handleEdit = (card: any) => {
    setEditingCard(card);
    const hasPredefinedBank = INDIAN_BANKS.some(b => b.name === card.bankName);
    setCustomBank(!hasPredefinedBank);
    
    form.reset({
      name: card.name,
      bankName: card.bankName,
      creditLimit: card.creditLimit,
      outstandingAmount: card.outstandingAmount,
      dueDate: format(parseISO(card.dueDate), "yyyy-MM-dd"),
      minimumDue: card.minimumDue,
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingCard(null);
    setCustomBank(false);
    form.reset({
      name: "",
      bankName: INDIAN_BANKS[0].name,
      creditLimit: 100000,
      outstandingAmount: 0,
      dueDate: format(new Date(), "yyyy-MM-dd"),
      minimumDue: 0,
    });
    setIsDialogOpen(true);
  };

  const getBankGradient = (bankName: string) => {
    const bank = INDIAN_BANKS.find((b) => b.name === bankName);
    return bank ? bank.color : "from-slate-800 to-slate-900";
  };

  const getBankLogoText = (bankName: string) => {
    const bank = INDIAN_BANKS.find((b) => b.name === bankName);
    return bank ? bank.logoText : bankName.slice(0, 3).toUpperCase();
  };

  const totalOutstanding = cards?.reduce((acc: number, card: any) => acc + card.outstandingAmount, 0) || 0;
  const totalLimit = cards?.reduce((acc: number, card: any) => acc + card.creditLimit, 0) || 0;
  const availableCredit = Math.max(0, totalLimit - totalOutstanding);
  const totalMinDue = cards?.reduce((acc: number, card: any) => acc + card.minimumDue, 0) || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credit Cards</h1>
          <p className="text-muted-foreground">Manage credit limits, statements, outstanding balances, and due dates.</p>
        </div>
        <Button onClick={openAddDialog} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Credit Card
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-sm font-medium text-muted-foreground font-mono">Total Outstanding</span>
              <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <CardIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-destructive">
              {formatCurrency(totalOutstanding)}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-sm font-medium text-muted-foreground font-mono">Available Credit</span>
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <CardIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-500">
              {formatCurrency(availableCredit)}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-sm font-medium text-muted-foreground font-mono">Total Credit Limit</span>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <CardIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(totalLimit)}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-sm font-medium text-muted-foreground font-mono">Combined Minimum Due</span>
              <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <CardIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-500">
              {formatCurrency(totalMinDue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      ) : cards?.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
            <CardIcon className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-lg text-foreground">No credit cards added</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">Add your first credit card to start tracking limits and upcoming statements.</p>
          <Button onClick={openAddDialog} className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add Credit Card
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards?.map((card: any) => {
            const daysToDue = differenceInDays(parseISO(card.dueDate), new Date());
            const isOverdue = daysToDue < 0 && card.outstandingAmount > 0;
            const isDueSoon = daysToDue >= 0 && daysToDue <= 5 && card.outstandingAmount > 0;

            return (
              <Card key={card.id} className="relative overflow-hidden group border-0 shadow-lg bg-card rounded-2xl">
                {/* Physical Card Representation */}
                <div className={`p-6 bg-gradient-to-br ${getBankGradient(card.bankName)} text-white flex flex-col justify-between h-48 relative overflow-hidden`}>
                  {/* Subtle Background Glow Effect */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-12 -translate-y-12"></div>
                  
                  <div className="flex justify-between items-start z-10">
                    <div>
                      <p className="text-xs uppercase tracking-wider opacity-75 font-mono">{card.bankName}</p>
                      <h4 className="text-lg font-bold">{card.name}</h4>
                    </div>
                    <div className="text-xl font-extrabold tracking-widest font-mono italic opacity-90">
                      {getBankLogoText(card.bankName)}
                    </div>
                  </div>

                  <div className="flex justify-between items-center z-10">
                    {/* Simulated SIM chip */}
                    <div className="w-10 h-7 rounded bg-amber-400/80 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute w-full h-px bg-amber-950/20 top-2"></div>
                      <div className="absolute w-full h-px bg-amber-950/20 bottom-2"></div>
                      <div className="absolute h-full w-px bg-amber-950/20 left-3"></div>
                      <div className="absolute h-full w-px bg-amber-950/20 right-3"></div>
                    </div>
                    <div className="text-sm font-mono tracking-widest opacity-85">
                      •••• •••• •••• {card.id.toString().padStart(4, "0")}
                    </div>
                  </div>

                  <div className="flex justify-between items-end z-10">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-60 font-mono">Credit Limit</p>
                      <p className="text-md font-bold font-mono">{formatCurrency(card.creditLimit)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider opacity-60 font-mono">Due Date</p>
                      <p className="text-sm font-bold font-mono">{format(parseISO(card.dueDate), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                </div>

                {/* Balance and Actions */}
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-mono">Outstanding</p>
                      <p className="text-xl font-bold font-mono text-destructive">
                        {formatCurrency(card.outstandingAmount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase font-mono">Minimum Due</p>
                      <p className="text-lg font-semibold font-mono text-amber-500">
                        {formatCurrency(card.minimumDue)}
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center justify-between border-t border-b py-2">
                    <span className="text-xs text-muted-foreground font-mono">Status</span>
                    {isOverdue ? (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Overdue
                      </Badge>
                    ) : isDueSoon ? (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Due in {daysToDue} days
                      </Badge>
                    ) : card.outstandingAmount === 0 ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Paid
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Due in {daysToDue} days
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(card)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit Balance
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(card.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] glass-card">
          <DialogHeader>
            <DialogTitle>{editingCard ? "Edit Credit Card" : "Add Credit Card"}</DialogTitle>
            <DialogDescription>
              {editingCard ? "Update outstanding statements and details for this card." : "Register a new credit card and its credit limit details."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Regalia, Millennia, Corporate" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank</FormLabel>
                    <div className="space-y-2">
                      <Select
                        onValueChange={(val) => {
                          if (val === "custom") {
                            setCustomBank(true);
                            field.onChange("");
                          } else {
                            setCustomBank(false);
                            field.onChange(val);
                          }
                        }}
                        defaultValue={customBank ? "custom" : field.value || INDIAN_BANKS[0].name}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIAN_BANKS.map((bank) => (
                            <SelectItem key={bank.name} value={bank.name}>
                              {bank.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">-- Custom / Other Bank --</SelectItem>
                        </SelectContent>
                      </Select>

                      {customBank && (
                        <Input
                          placeholder="Type Custom Bank Name"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="creditLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limit</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="outstandingAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outstanding</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minimumDue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Due</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full mt-4" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingCard ? "Save Changes" : "Add Credit Card"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the credit card. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/95"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

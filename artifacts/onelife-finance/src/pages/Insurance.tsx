import React, { useState } from "react";
import { useListInsurances, useCreateInsurance, useUpdateInsurance, useDeleteInsurance, InsuranceType, getListInsurancesQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import type { Insurance } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Shield, ShieldAlert, ShieldCheck, ShieldPlus, Heart, Home, Car, HeartPulse, Trash2, Pencil } from "lucide-react";
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
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const insuranceIcons: Record<string, React.ReactNode> = {
  health: <HeartPulse className="h-5 w-5" />,
  life: <Heart className="h-5 w-5" />,
  car: <Car className="h-5 w-5" />,
  house: <Home className="h-5 w-5" />,
  term: <ShieldCheck className="h-5 w-5" />
};

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  insuranceType: z.enum(["health", "life", "car", "house", "term"]),
  provider: z.string().min(2, "Provider is required"),
  premiumAmount: z.coerce.number().min(0),
  coverageAmount: z.coerce.number().min(0),
  renewalDate: z.string(),
  policyNumber: z.string().optional()
});

export default function Insurance() {
  const { data: insurances, isLoading } = useListInsurances();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<Insurance | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateInsurance({
    mutation: {
      onSuccess: () => {
        toast({ title: "Policy added successfully" });
        queryClient.invalidateQueries({ queryKey: getListInsurancesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setIsDialogOpen(false);
        setEditingInsurance(null);
        form.reset();
      },
      onError: () => toast({ title: "Failed to add policy", variant: "destructive" })
    }
  });

  const updateMutation = useUpdateInsurance({
    mutation: {
      onSuccess: () => {
        toast({ title: "Policy updated" });
        queryClient.invalidateQueries({ queryKey: getListInsurancesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setIsDialogOpen(false);
        setEditingInsurance(null);
        form.reset();
      },
      onError: () => toast({ title: "Failed to update policy", variant: "destructive" })
    }
  });

  const deleteMutation = useDeleteInsurance({
    mutation: {
      onSuccess: () => {
        toast({ title: "Policy deleted" });
        queryClient.invalidateQueries({ queryKey: getListInsurancesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setDeleteId(null);
      }
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      insuranceType: "health",
      provider: "",
      premiumAmount: 0,
      coverageAmount: 0,
      renewalDate: format(new Date(), "yyyy-MM-dd"),
      policyNumber: ""
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingInsurance) {
      updateMutation.mutate({ id: editingInsurance.id, data: values });
      return;
    }

    createMutation.mutate({ data: values });
  };

  const openAddDialog = () => {
    setEditingInsurance(null);
    form.reset({
      name: "",
      insuranceType: "health",
      provider: "",
      premiumAmount: 0,
      coverageAmount: 0,
      renewalDate: format(new Date(), "yyyy-MM-dd"),
      policyNumber: ""
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (policy: Insurance) => {
    setEditingInsurance(policy);
    form.reset({
      name: policy.name,
      insuranceType: policy.insuranceType,
      provider: policy.provider,
      premiumAmount: policy.premiumAmount,
      coverageAmount: policy.coverageAmount,
      renewalDate: policy.renewalDate,
      policyNumber: policy.policyNumber || ""
    });
    setIsDialogOpen(true);
  };

  const totalCoverage = insurances?.reduce((acc, pol) => acc + (pol.status === 'active' ? pol.coverageAmount : 0), 0) || 0;
  const totalPremium = insurances?.reduce((acc, pol) => acc + (pol.status === 'active' ? pol.premiumAmount : 0), 0) || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insurance Portfolio</h1>
          <p className="text-muted-foreground mt-1">Manage your coverage and upcoming renewals.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingInsurance(null);
        }}>
          <Button className="rounded-full shadow-md" onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Policy
          </Button>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingInsurance ? "Edit Policy" : "Add New Policy"}</DialogTitle>
              <DialogDescription>{editingInsurance ? "Update your coverage and renewal details." : "Track your insurance coverage and premiums."}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Policy Name</FormLabel>
                      <FormControl><Input placeholder="Family Health" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="insuranceType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="health">Health</SelectItem>
                          <SelectItem value="life">Life</SelectItem>
                          <SelectItem value="term">Term Life</SelectItem>
                          <SelectItem value="car">Vehicle</SelectItem>
                          <SelectItem value="house">Property</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="provider" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider</FormLabel>
                      <FormControl><Input placeholder="e.g. LIC, HDFC Ergo" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="policyNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Policy # (Optional)</FormLabel>
                      <FormControl><Input placeholder="POL-12345" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="coverageAmount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coverage Amount</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="premiumAmount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yearly Premium</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="renewalDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Renewal Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingInsurance
                      ? updateMutation.isPending ? "Saving..." : "Save Changes"
                      : createMutation.isPending ? "Adding..." : "Add Policy"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-transparent bg-teal-500 text-white shadow-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Total Active Coverage</p>
              <h2 className="text-4xl font-bold font-mono tracking-tight">{formatCurrency(totalCoverage)}</h2>
            </div>
            <div className="bg-white/20 p-4 rounded-full">
              <ShieldCheck className="w-10 h-10" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-primary/5 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">Annual Premium Commitment</p>
              <h2 className="text-4xl font-bold font-mono tracking-tight text-foreground">{formatCurrency(totalPremium)}</h2>
            </div>
            <div className="bg-muted p-4 rounded-full text-muted-foreground">
              <ShieldAlert className="w-10 h-10" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-2xl"><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))
        ) : insurances?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-2xl border border-dashed">
            <ShieldPlus className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-foreground">No insurance policies</p>
            <p className="text-sm">Add your health, life, and vehicle insurance to track renewals.</p>
          </div>
        ) : (
          insurances?.map((policy) => {
            const daysToRenewal = differenceInDays(parseISO(policy.renewalDate), new Date());
            const isUrgent = daysToRenewal <= 30 && daysToRenewal >= 0;
            const isExpired = policy.status === 'expired' || daysToRenewal < 0;

            return (
              <Card key={policy.id} className={`rounded-2xl transition-all duration-300 relative group overflow-hidden ${isUrgent ? 'border-orange-500/50 shadow-orange-500/10 shadow-lg' : isExpired ? 'opacity-70 grayscale' : 'border-primary/5 hover:border-primary/20'}`}>
                {isUrgent && <div className="absolute top-0 inset-x-0 h-1 bg-orange-500" />}
                {isExpired && <div className="absolute top-0 inset-x-0 h-1 bg-destructive" />}
                
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                        {insuranceIcons[policy.insuranceType] || <Shield className="h-5 w-5" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground truncate max-w-[150px]">{policy.name}</h3>
                        <p className="text-xs text-muted-foreground">{policy.provider}</p>
                      </div>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => handleEdit(policy)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(policy.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 bg-muted/30 p-3 rounded-lg">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Coverage</p>
                      <p className="font-mono font-medium text-sm">{formatCurrency(policy.coverageAmount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Premium / Yr</p>
                      <p className="font-mono font-medium text-sm">{formatCurrency(policy.premiumAmount)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={isExpired ? "destructive" : isUrgent ? "default" : "secondary"} className={isUrgent ? "bg-orange-500 hover:bg-orange-600" : ""}>
                        {isExpired ? "Expired" : isUrgent ? "Renew Soon" : "Active"}
                      </Badge>
                      {policy.policyNumber && <span className="text-xs font-mono text-muted-foreground ml-2">#{policy.policyNumber}</span>}
                    </div>
                    <p className={`text-xs font-medium ${isUrgent ? 'text-orange-500' : isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {format(parseISO(policy.renewalDate), "MMM dd, yyyy")}
                    </p>
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
            <AlertDialogTitle>Delete Policy?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the policy from your portfolio. This action cannot be undone.
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

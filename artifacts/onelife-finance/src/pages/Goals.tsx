import React, { useState } from "react";
import { useListGoals, useCreateGoal, useDeleteGoal, GoalType, getListGoalsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Target, Plane, Car, Home, GraduationCap, Flame, AlertCircle, Trash2, CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const goalIcons: Record<string, React.ReactNode> = {
  emergency_fund: <AlertCircle className="h-5 w-5" />,
  vacation: <Plane className="h-5 w-5" />,
  car: <Car className="h-5 w-5" />,
  house: <Home className="h-5 w-5" />,
  kids_education: <GraduationCap className="h-5 w-5" />,
  retirement: <Flame className="h-5 w-5" />,
  other: <Target className="h-5 w-5" />
};

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  goalType: z.enum(["emergency_fund", "vacation", "car", "house", "kids_education", "retirement", "other"]),
  targetAmount: z.coerce.number().min(1),
  currentAmount: z.coerce.number().min(0).default(0),
  targetDate: z.string().optional()
});

export default function Goals() {
  const { data: goals, isLoading } = useListGoals();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateGoal({
    mutation: {
      onSuccess: () => {
        toast({ title: "Goal created!" });
        queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: () => toast({ title: "Failed to create", variant: "destructive" })
    }
  });

  const deleteMutation = useDeleteGoal({
    mutation: {
      onSuccess: () => {
        toast({ title: "Goal deleted" });
        queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
        setDeleteId(null);
      }
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      goalType: "vacation",
      targetAmount: 0,
      currentAmount: 0,
      targetDate: ""
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate({ data: { ...values, targetDate: values.targetDate || undefined } });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
          <p className="text-muted-foreground mt-1">Set targets and track your progress.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Goal</DialogTitle>
              <DialogDescription>What are you saving for?</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Maldives Trip" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="goalType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="emergency_fund">Emergency Fund</SelectItem>
                        <SelectItem value="vacation">Vacation</SelectItem>
                        <SelectItem value="car">Car</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="kids_education">Education</SelectItem>
                        <SelectItem value="retirement">Retirement</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="targetAmount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Amount</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="currentAmount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Already Saved</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="targetDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Date (Optional)</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Goal"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-2xl"><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
          ))
        ) : goals?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-2xl border border-dashed">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-foreground">No active goals</p>
            <p className="text-sm">Set a target to start saving purposefully.</p>
          </div>
        ) : (
          goals?.map((goal) => {
            const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const isCompleted = progress >= 100;

            return (
              <Card key={goal.id} className={`rounded-2xl transition-all duration-300 group border-primary/5 hover:border-primary/20 ${isCompleted ? 'bg-primary/5 border-primary/20' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                        {goalIcons[goal.goalType] || <Target className="h-6 w-6" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground truncate max-w-[160px]">{goal.name}</h3>
                        {goal.targetDate ? (
                          <p className="text-xs text-muted-foreground flex items-center mt-0.5">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {format(parseISO(goal.targetDate), "MMM yyyy")}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{goal.goalType.replace('_', ' ')}</p>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 -mt-2 -mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(goal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-2xl font-bold font-mono tracking-tight text-primary">
                        {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground pb-0.5">
                        of {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-emerald-500' : 'bg-primary'}`} 
                        style={{ width: `${progress}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-xs font-semibold mt-1">
                      <span className={isCompleted ? 'text-emerald-500' : 'text-primary'}>{progress.toFixed(0)}%</span>
                      <span className="text-muted-foreground">{formatCurrency(goal.targetAmount - goal.currentAmount)} left</span>
                    </div>
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
            <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
            <AlertDialogDescription>This removes the goal tracker. Your funds are unaffected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
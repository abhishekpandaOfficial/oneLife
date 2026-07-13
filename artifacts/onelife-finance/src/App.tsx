import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import TransactionForm from "@/pages/TransactionForm";
import Loans from "@/pages/Loans";
import LoanDetail from "@/pages/LoanDetail";
import Insurance from "@/pages/Insurance";
import Investments from "@/pages/Investments";
import Goals from "@/pages/Goals";
import Budget from "@/pages/Budget";
import Reports from "@/pages/Reports";
import Categories from "@/pages/Categories";
import Settings from "@/pages/Settings";
import DatabaseMonitor from "@/pages/DatabaseMonitor";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { Route, Switch, Router as WouterRouter } from "wouter";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        
        <Route path="/income">
          {() => <Transactions type="income" />}
        </Route>
        <Route path="/expenses">
          {() => <Transactions type="expense" />}
        </Route>
        
        <Route path="/transactions">
          {() => <Transactions />}
        </Route>
        <Route path="/transactions/new" component={TransactionForm} />
        <Route path="/transactions/:id/edit" component={TransactionForm} />
        
        <Route path="/loans" component={Loans} />
        <Route path="/loans/:id" component={LoanDetail} />
        
        <Route path="/insurance" component={Insurance} />
        <Route path="/investments" component={Investments} />
        <Route path="/goals" component={Goals} />
        <Route path="/budget" component={Budget} />
        <Route path="/reports" component={Reports} />
        <Route path="/categories" component={Categories} />
        <Route path="/settings" component={Settings} />
        <Route path="/database" component={DatabaseMonitor} />
        
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

export default function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
      <Toaster />
    </WouterRouter>
  );
}
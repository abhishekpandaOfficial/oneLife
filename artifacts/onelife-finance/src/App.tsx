import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import TransactionForm from "@/pages/TransactionForm";
import Loans from "@/pages/Loans";
import LoanDetail from "@/pages/LoanDetail";
import CreditCards from "@/pages/CreditCards";
import Insurance from "@/pages/Insurance";
import Investments from "@/pages/Investments";
import Goals from "@/pages/Goals";
import Budget from "@/pages/Budget";
import OneWork from "@/pages/OneWork";
import OneSocial from "@/pages/OneSocial";
import EcosystemModule from "@/pages/EcosystemModule";
import Reports from "@/pages/Reports";
import Categories from "@/pages/Categories";
import Settings from "@/pages/Settings";
import DatabaseMonitor from "@/pages/DatabaseMonitor";
import ApiMonitor from "@/pages/ApiMonitor";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { Route, Switch, Router as WouterRouter, useLocation } from "wouter";

function Router() {
  const [location] = useLocation();

  if (location === "/") {
    return <Landing />;
  }

  if (location === "/login") {
    return <Login />;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/app">
          {() => <Dashboard />}
        </Route>
        <Route path="/onefinance">
          {() => <Dashboard mode="finance" />}
        </Route>

        {/* key forces full remount when switching income ↔ expenses ↔ transactions */}
        <Route path="/income">
          {() => <Transactions key="income" type="income" />}
        </Route>
        <Route path="/expenses">
          {() => <Transactions key="expense" type="expense" />}
        </Route>
        {/* key forces remount between /new and /edit */}
        <Route path="/transactions/new">
          {() => <TransactionForm key="new" />}
        </Route>
        <Route path="/transactions/:id/edit">
          {(params) => <TransactionForm key={`edit-${params.id}`} params={params} />}
        </Route>
        <Route path="/transactions">
          {() => <Transactions key="all" />}
        </Route>

        <Route path="/loans" component={Loans} />
        <Route path="/loans/:id" component={LoanDetail} />
        <Route path="/credit-cards" component={CreditCards} />

        <Route path="/insurance" component={Insurance} />
        <Route path="/investments" component={Investments} />
        <Route path="/goals" component={Goals} />
        <Route path="/budget" component={Budget} />
        <Route path="/onework/:section" component={OneWork} />
        <Route path="/onework" component={OneWork} />
        <Route path="/onesocial/:section" component={OneSocial} />
        <Route path="/onesocial" component={OneSocial} />
        <Route path="/onehealth/:section">
          {() => <EcosystemModule module="health" />}
        </Route>
        <Route path="/onehealth">
          {() => <EcosystemModule module="health" />}
        </Route>
        <Route path="/onenote/:section">
          {() => <EcosystemModule module="note" />}
        </Route>
        <Route path="/onenote">
          {() => <EcosystemModule module="note" />}
        </Route>
        <Route path="/oneidea/:section">
          {() => <EcosystemModule module="idea" />}
        </Route>
        <Route path="/oneidea">
          {() => <EcosystemModule module="idea" />}
        </Route>
        <Route path="/onetravel/:section">
          {() => <EcosystemModule module="travel" />}
        </Route>
        <Route path="/onetravel">
          {() => <EcosystemModule module="travel" />}
        </Route>
        <Route path="/reports" component={Reports} />
        <Route path="/categories" component={Categories} />
        <Route path="/settings" component={Settings} />
        <Route path="/database" component={DatabaseMonitor} />
        <Route path="/api-monitor" component={ApiMonitor} />

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

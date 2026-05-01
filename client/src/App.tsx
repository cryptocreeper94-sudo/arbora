import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import AuthPage from "@/pages/auth";
import { ArboraLayout } from "@/components/arbora-layout";
import ArboraDashboard from "@/pages/arbora-dashboard";
import ArboraClients from "@/pages/arbora-clients";
import ArboraDeals from "@/pages/arbora-deals";
import ArboraJobs from "@/pages/arbora-jobs";
import ArboraEstimates from "@/pages/arbora-estimates";
import ArboraInvoices from "@/pages/arbora-invoices";
import ArboraCalendar from "@/pages/arbora-calendar";
import ArboraCrew from "@/pages/arbora-crew";
import ArboraInventory from "@/pages/arbora-inventory";
import ArboraEquipment from "@/pages/arbora-equipment";
import NotFound from "@/pages/not-found";
import { Loader2, TreePine } from "lucide-react";
import { useState } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { DWSCFooterBadge } from "@/components/DWSCFooterBadge";

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
            <TreePine className="w-7 h-7 text-white" />
          </div>
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (showAuth || !isAuthenticated) {
    return <AuthPage onBack={() => setShowAuth(false)} />;
  }

  return (
    <ArboraLayout>
      <Switch>
        <Route path="/" component={ArboraDashboard} />
        <Route path="/clients" component={ArboraClients} />
        <Route path="/deals" component={ArboraDeals} />
        <Route path="/jobs" component={ArboraJobs} />
        <Route path="/estimates" component={ArboraEstimates} />
        <Route path="/invoices" component={ArboraInvoices} />
        <Route path="/calendar" component={ArboraCalendar} />
        <Route path="/crew" component={ArboraCrew} />
        <Route path="/inventory" component={ArboraInventory} />
        <Route path="/equipment" component={ArboraEquipment} />
        <Route component={NotFound} />
      </Switch>
    </ArboraLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <AppContent />
            <DWSCFooterBadge />
            <Toaster />
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

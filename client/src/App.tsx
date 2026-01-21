import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { Loader2 } from "lucide-react";

import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ClientDashboard from "@/pages/dashboard/client";
import AdminDashboard from "@/pages/dashboard/admin";
import AdminClients from "@/pages/dashboard/admin/clients";
import AdminDocuments from "@/pages/dashboard/admin/documents";
import AdminSettings from "@/pages/dashboard/admin/settings";
import AdminIntakeDetail from "@/pages/admin/intake/detail";
import IntakeWizard from "@/pages/intake/wizard";
import NotFound from "@/pages/not-found";

function HomeRedirect() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (user?.role === "client") {
    return <Redirect to="/dashboard/client" />;
  }
  
  return <Redirect to="/dashboard/admin" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      
      <Route path="/dashboard/client">
        <ProtectedRoute allowedRoles={["client"]}>
          <ClientDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/dashboard/admin">
        <ProtectedRoute allowedRoles={["preparer", "admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/dashboard/admin/clients">
        <ProtectedRoute allowedRoles={["preparer", "admin"]}>
          <AdminClients />
        </ProtectedRoute>
      </Route>
      
      <Route path="/dashboard/admin/documents">
        <ProtectedRoute allowedRoles={["preparer", "admin"]}>
          <AdminDocuments />
        </ProtectedRoute>
      </Route>
      
      <Route path="/dashboard/admin/settings">
        <ProtectedRoute allowedRoles={["preparer", "admin"]}>
          <AdminSettings />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/intake/:id">
        <ProtectedRoute allowedRoles={["preparer", "admin"]}>
          <AdminIntakeDetail />
        </ProtectedRoute>
      </Route>
      
      <Route path="/intake/:id">
        <ProtectedRoute allowedRoles={["client"]}>
          <IntakeWizard />
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

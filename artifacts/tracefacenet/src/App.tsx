import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import RegisterUser from "@/pages/RegisterUser";
import ForgotPassword from "@/pages/ForgotPassword";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

import Dashboard from "@/pages/Dashboard";
import MissingPersons from "@/pages/MissingPersons";
import RegisterCase from "@/pages/RegisterCase";
import PersonDetail from "@/pages/PersonDetail";
import FaceSearch from "@/pages/FaceSearch";
import Alerts from "@/pages/Alerts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: false,
    },
  },
});

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background tech-grid flex items-center justify-center px-4 text-center">
        <div className="space-y-3">
          <div className="text-lg font-semibold">Establishing secure session...</div>
          <div className="text-sm text-muted-foreground">Verifying authentication with the server.</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={RegisterUser} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        <Redirect to="/" />
      </Route>
      <Route path="/register">
        <Redirect to="/" />
      </Route>
      <Route path="/forgot-password">
        <Redirect to="/" />
      </Route>
      <Route path="/" component={Dashboard} />
      <Route path="/missing-persons" component={MissingPersons} />
      <Route path="/missing-persons/new" component={RegisterCase} />
      <Route path="/missing-persons/:id" component={PersonDetail} />
      <Route path="/search" component={FaceSearch} />
      <Route path="/alerts" component={Alerts} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

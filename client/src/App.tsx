import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Loader2 } from "lucide-react";

// Pages
import AuthPage from "@/pages/auth-page";
import TeacherDashboard from "@/pages/teacher-dashboard";
import StudentDashboard from "@/pages/student-dashboard";
import ModuleView from "@/pages/module-view";
import NotFound from "@/pages/not-found";

// Protected Route Wrapper
function ProtectedRoute({ 
  component: Component, 
  role 
}: { 
  component: React.ComponentType<any>; 
  role?: "student" | "teacher" 
}) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Redirect to="/auth" />;
  
  // Role check
  if (role && user.role !== role) {
    // Redirect to correct dashboard based on actual role
    return <Redirect to={user.role === "teacher" ? "/teacher" : "/"} />;
  }

  return <Component />;
}

function Router() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        
        {/* Student Routes */}
        <Route path="/">
          <ProtectedRoute component={StudentDashboard} role="student" />
        </Route>
        <Route path="/module/:id">
          <ProtectedRoute component={ModuleView} role="student" />
        </Route>

        {/* Teacher Routes */}
        <Route path="/teacher">
          <ProtectedRoute component={TeacherDashboard} role="teacher" />
        </Route>

        {/* 404 */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

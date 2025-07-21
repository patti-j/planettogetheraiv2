import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/sidebar";
import OnboardingWizard from "@/components/onboarding-wizard";
import Login from "@/pages/Login";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "@/pages/dashboard";
import Analytics from "@/pages/analytics";
import Reports from "@/pages/reports";
import AIAssistant from "@/pages/ai-assistant";
import Boards from "@/pages/boards";
import ShopFloor from "@/pages/shop-floor";
import Sales from "@/pages/sales";
import CustomerService from "@/pages/customer-service";
import OperatorDashboard from "@/pages/operator-dashboard";
import Maintenance from "@/pages/maintenance";
import Feedback from "@/pages/feedback";
import ForkliftDriver from "@/pages/forklift-driver";
import EmailSettings from "@/pages/email-settings";
import SchedulingOptimizer from "@/pages/scheduling-optimizer";
import ERPImport from "@/pages/erp-import";
import PlantManager from "@/pages/plant-manager";
import SystemsManagement from "@/pages/systems-management";
import CapacityPlanning from "@/pages/capacity-planning";
import VisualFactory from "@/pages/visual-factory";
import BusinessGoals from "@/pages/business-goals";
import RoleManagement from "@/pages/role-management";
import UserRoleAssignments from "@/pages/user-role-assignments";
import Training from "@/pages/training";
import DemoTour from "@/pages/demo-tour";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user, loginError } = useAuth();



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/demo-tour" component={DemoTour} />
        <Route path="/" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/analytics">
            <ProtectedRoute feature="analytics" action="view">
              <Analytics />
            </ProtectedRoute>
          </Route>
          <Route path="/reports">
            <ProtectedRoute feature="reports" action="view">
              <Reports />
            </ProtectedRoute>
          </Route>
          <Route path="/ai-assistant">
            <ProtectedRoute feature="ai-assistant" action="view">
              <AIAssistant />
            </ProtectedRoute>
          </Route>
          <Route path="/boards">
            <ProtectedRoute feature="boards" action="view">
              <Boards />
            </ProtectedRoute>
          </Route>
          <Route path="/shop-floor">
            <ProtectedRoute feature="shop-floor" action="view">
              <ShopFloor />
            </ProtectedRoute>
          </Route>
          <Route path="/sales">
            <ProtectedRoute feature="sales" action="view">
              <Sales />
            </ProtectedRoute>
          </Route>
          <Route path="/customer-service">
            <ProtectedRoute feature="customer-service" action="view">
              <CustomerService />
            </ProtectedRoute>
          </Route>
          <Route path="/operator">
            <ProtectedRoute feature="operator-dashboard" action="view">
              <OperatorDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/maintenance">
            <ProtectedRoute feature="maintenance" action="view">
              <Maintenance />
            </ProtectedRoute>
          </Route>
          <Route path="/feedback">
            <ProtectedRoute feature="feedback" action="view">
              <Feedback />
            </ProtectedRoute>
          </Route>
          <Route path="/forklift">
            <ProtectedRoute feature="forklift-driver" action="view">
              <ForkliftDriver />
            </ProtectedRoute>
          </Route>
          <Route path="/email-settings">
            <ProtectedRoute feature="email-settings" action="view">
              <EmailSettings />
            </ProtectedRoute>
          </Route>
          <Route path="/scheduling-optimizer">
            <ProtectedRoute feature="scheduling-optimizer" action="view">
              <SchedulingOptimizer />
            </ProtectedRoute>
          </Route>
          <Route path="/erp-import">
            <ProtectedRoute feature="erp-import" action="view">
              <ERPImport />
            </ProtectedRoute>
          </Route>
          <Route path="/plant-manager">
            <ProtectedRoute feature="plant-manager" action="view">
              <PlantManager />
            </ProtectedRoute>
          </Route>
          <Route path="/systems-management">
            <ProtectedRoute feature="systems-management" action="view">
              <SystemsManagement />
            </ProtectedRoute>
          </Route>
          <Route path="/capacity-planning">
            <ProtectedRoute feature="capacity-planning" action="view">
              <CapacityPlanning />
            </ProtectedRoute>
          </Route>
          <Route path="/visual-factory">
            <ProtectedRoute feature="visual-factory" action="view">
              <VisualFactory />
            </ProtectedRoute>
          </Route>
          <Route path="/business-goals">
            <ProtectedRoute feature="business-goals" action="view">
              <BusinessGoals />
            </ProtectedRoute>
          </Route>
          <Route path="/role-management">
            <ProtectedRoute feature="user-management" action="view">
              <RoleManagement />
            </ProtectedRoute>
          </Route>
          <Route path="/user-role-assignments">
            <ProtectedRoute feature="user-management" action="view">
              <UserRoleAssignments />
            </ProtectedRoute>
          </Route>
          <Route path="/training">
            <ProtectedRoute feature="training" action="view">
              <Training />
            </ProtectedRoute>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DndProvider backend={HTML5Backend}>
        <TooltipProvider>
          <Router />
          <OnboardingWizard />
          <Toaster />
        </TooltipProvider>
      </DndProvider>
    </QueryClientProvider>
  );
}

export default App;

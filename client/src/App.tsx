import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Sidebar from "@/components/sidebar";
import OnboardingWizard from "@/components/onboarding-wizard";
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
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/reports" component={Reports} />
      <Route path="/ai-assistant" component={AIAssistant} />
      <Route path="/boards" component={Boards} />
      <Route path="/shop-floor" component={ShopFloor} />
      <Route path="/sales" component={Sales} />
      <Route path="/customer-service" component={CustomerService} />
      <Route path="/operator" component={OperatorDashboard} />
      <Route path="/maintenance" component={Maintenance} />
      <Route path="/feedback" component={Feedback} />
      <Route path="/forklift" component={ForkliftDriver} />
      <Route path="/email-settings" component={EmailSettings} />
      <Route path="/scheduling-optimizer" component={SchedulingOptimizer} />
      <Route path="/erp-import" component={ERPImport} />
      <Route path="/plant-manager" component={PlantManager} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DndProvider backend={HTML5Backend}>
        <TooltipProvider>
          <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full">
              <Router />
            </main>
          </div>
          <OnboardingWizard />
          <Toaster />
        </TooltipProvider>
      </DndProvider>
    </QueryClientProvider>
  );
}

export default App;

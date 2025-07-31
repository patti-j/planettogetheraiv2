import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TourProvider, useTour } from "@/contexts/TourContext";
import { MaxDockProvider } from "@/contexts/MaxDockContext";
import { NavigationProvider, useNavigation } from "@/contexts/NavigationContext";
import { SplitPaneLayout } from "@/components/split-pane-layout";
import { MaxSidebar } from "@/components/max-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/error-boundary";
import TopMenu from "@/components/top-menu";
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
import InventoryOptimization from "@/pages/inventory-optimization";
import DemandPlanning from "@/pages/demand-planning";
import ERPImport from "@/pages/erp-import";
import SystemIntegrationsPage from "@/pages/system-integrations";
import ApiIntegrationsPage from "@/pages/api-integrations";

import SystemsManagement from "@/pages/systems-management";
import CapacityPlanning from "@/pages/capacity-planning";
import VisualFactory from "@/pages/visual-factory";
import BusinessGoals from "@/pages/business-goals";
import RoleManagement from "@/pages/role-management";
import UserRoleAssignments from "@/pages/user-role-assignments";
import Training from "@/pages/training";

import DemoTour from "@/pages/demo-tour";
import DisruptionManagement from "@/pages/disruption-management";
import Chat from "@/pages/chat";
import Pricing from "@/pages/pricing";
import Billing from "@/pages/billing";
import Account from "@/pages/account";
import IndustryTemplates from "@/pages/industry-templates";
import PlantsManagementPage from "@/pages/plants-management";
import ExtensionStudioPage from "@/pages/extension-studio";
import CanvasPage from "@/pages/canvas";
import ErrorLogsPage from "@/pages/error-logs";
import PresentationPage from "@/pages/presentation";
import PresentationSystemPage from "@/pages/presentation-system";
import ProductionPlanningPage from "@/pages/production-planning";
import OptimizationStudioPage from "@/pages/optimization-studio";
import MarketingLandingPage from "@/pages/marketing-landing";
import MarketingHome from "@/pages/marketing-home";
import ShiftManagement from "@/pages/shift-management";
import ProductionCockpit from "@/pages/production-cockpit";
import ProductDevelopment from "@/pages/product-development";
import SchedulingHistory from "@/pages/scheduling-history";
import WidgetShowcase from "@/pages/widget-showcase";
import WidgetStudio from "@/pages/widget-studio";
import WidgetsPage from "@/pages/widgets";
import DashboardsPage from "@/pages/dashboards";
import DataImportPage from "@/pages/data-import";
import Onboarding from "@/pages/onboarding";
import AtpCtpPage from "@/pages/atp-ctp";
import DataValidation from "@/pages/data-validation";
import DataMapView from "@/pages/data-map";
import DataSchemaView from "@/pages/data-schema";
import TableFieldViewer from "@/pages/table-field-viewer";
import DataRelationships from "@/pages/data-relationships";
import ConstraintsPage from "@/pages/constraints";
import Homepage from "@/pages/homepage";

import FunctionalMap from "@/pages/functional-map";
import NotFound from "@/pages/not-found";
import { ResumeTourButton } from "@/components/resume-tour-button";
import IntegratedAIAssistant from "@/components/integrated-ai-assistant";
import { OnboardingGate } from "@/components/onboarding-gate";


function DashboardWithAutoTour() {
  const { startTour } = useTour();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  console.log('🎯 DashboardWithAutoTour rendering, current location:', location);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldStartTour = urlParams.get('startTour');
    
    if (shouldStartTour === 'true' && user) {
      // Get current role and start tour with it
      const startAutoTour = async () => {
        try {
          // Fetch current role using apiRequest
          const response = await apiRequest('GET', `/api/users/${user.id}/current-role`);
          const currentRole = await response.json();
          
          if (currentRole) {
            // Map role name to role ID for tour system
            const roleMapping: Record<string, number> = {
              "director": 1,
              "plant-manager": 2,
              "production-scheduler": 3,
              "it-administrator": 4,
              "systems-manager": 5,
              "administrator": 6,
              "it-systems-administrator": 7,
              "data-analyst": 8,
              "trainer": 9,
              "shop-floor-operations": 10,
              "sales-representative": 12,
              "customer-service-representative": 13,
              "support-engineer": 14,
              "supply-chain-planner": 15
            };
            
            const roleKey = currentRole.name.toLowerCase().replace(/\s+/g, '-');
            const roleId = roleMapping[roleKey];
            console.log('Starting auto tour for role:', roleKey, currentRole.name, 'roleId:', roleId);
            
            if (roleId) {
              // Start the tour with voice enabled by default and 'demo' context (external link)
              startTour(roleId, true, 'demo');
            } else {
              console.error('No role ID found for role:', roleKey);
            }
            
            // Clean up URL parameter
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          }
        } catch (error) {
          console.error('Failed to auto-start tour:', error);
        }
      };
      
      // Small delay to ensure everything is loaded
      setTimeout(startAutoTour, 500);
    }
  }, [user, startTour]);

  return <Homepage />;
}

// MainContentArea is now replaced by SplitPaneLayout

// Hook for handling session persistence - FIXED to prevent infinite redirect
function useSessionPersistence() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { lastVisitedRoute } = useNavigation();
  const [location, setLocation] = useLocation();

  // Disabled automatic redirection to prevent forced navigation to stored routes
  useEffect(() => {
    // Only log the available route, don't automatically redirect
    if (!isLoading && isAuthenticated && user && lastVisitedRoute) {
      console.log('Last visited route available (not redirecting):', lastVisitedRoute);
    }
  }, [isAuthenticated, isLoading, user, lastVisitedRoute, location, setLocation]);
}

function Router() {
  const { isAuthenticated, isLoading, user, loginError } = useAuth();
  const { isActive: isTourActive } = useTour();
  const [location, originalSetLocation] = useLocation();
  
  // Wrap setLocation to track all navigation calls
  const setLocation = (newLocation: string) => {
    console.error('🚨 NAVIGATION DETECTED! Moving to:', newLocation);
    console.error('🚨 Stack trace:', new Error().stack);
    console.error('🚨 Current location:', location);
    console.error('🚨 Browser pathname:', window.location.pathname);
    originalSetLocation(newLocation);
  };
  
  // Debug logging to understand initial route and any changes
  useEffect(() => {
    console.log('🔍 App Router - Location changed to:', location);
    console.log('🔍 App Router - Current URL:', window.location.href);
    console.log('🔍 App Router - Window location pathname:', window.location.pathname);
    console.log('🔍 App Router - User authenticated:', isAuthenticated);
    console.log('🔍 App Router - User loading:', isLoading);
    console.log('🔍 App Router - Browser history length:', window.history.length);
    console.log('🔍 App Router - Document referrer:', document.referrer);
    
    // Check for any stored navigation state
    console.log('🔍 SessionStorage navigation keys:', Object.keys(sessionStorage).filter(k => k.includes('nav') || k.includes('route') || k.includes('location')));
    console.log('🔍 LocalStorage navigation keys:', Object.keys(localStorage).filter(k => k.includes('nav') || k.includes('route') || k.includes('location')));
  }, [location, isAuthenticated, isLoading]);
  
  // Use session persistence for authenticated users
  useSessionPersistence();

  if (isLoading && !isTourActive) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access during demo tour or when authenticated
  if (!isAuthenticated && !isTourActive) {
    return (
      <Switch>
        <Route path="/pricing" component={Pricing} />
        <Route path="/demo-tour" component={DemoTour} />
        <Route path="/presentation" component={PresentationPage} />
        <Route path="/marketing" component={MarketingLandingPage} />
        <Route path="/home" component={MarketingHome} />
        <Route path="/" component={MarketingHome} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <div className="h-screen bg-gray-50"> {/* No top padding needed */}
      <TopMenu />
      <SplitPaneLayout maxPanel={<MaxSidebar />}>
        <OnboardingGate>
          <Switch>
          <Route path="/marketing" component={MarketingLandingPage} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/production-schedule">
            <DashboardWithAutoTour />
          </Route>
          <Route path="/dashboard">
            <DashboardWithAutoTour />
          </Route>
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
          <Route path="/operator-dashboard">
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
          <Route path="/forklift-driver">
            <ProtectedRoute feature="forklift-driver" action="view">
              <ForkliftDriver />
            </ProtectedRoute>
          </Route>
          <Route path="/email-settings">
            <ProtectedRoute feature="email-settings" action="view">
              <EmailSettings />
            </ProtectedRoute>
          </Route>
          <Route path="/optimize-orders">
            <ProtectedRoute feature="scheduling-optimizer" action="view">
              <SchedulingOptimizer />
            </ProtectedRoute>
          </Route>
          <Route path="/inventory-optimization">
            <ProtectedRoute feature="inventory-optimization" action="view">
              <InventoryOptimization />
            </ProtectedRoute>
          </Route>
          <Route path="/demand-planning">
            <ProtectedRoute feature="demand-planning" action="view">
              <DemandPlanning />
            </ProtectedRoute>
          </Route>
          <Route path="/systems-integration">
            <ProtectedRoute feature="systems-integration" action="view">
              <ERPImport />
            </ProtectedRoute>
          </Route>

          <Route path="/systems-management-dashboard">
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
          <Route path="/user-role-assignments-page">
            <ProtectedRoute feature="user-management" action="view">
              <UserRoleAssignments />
            </ProtectedRoute>
          </Route>
          <Route path="/disruption-management">
            <ProtectedRoute feature="disruption-management" action="view">
              <DisruptionManagement />
            </ProtectedRoute>
          </Route>
          <Route path="/training">
            <ProtectedRoute feature="training" action="view">
              <Training />
            </ProtectedRoute>
          </Route>
          <Route path="/industry-templates">
            <ProtectedRoute feature="industry-templates" action="view">
              <IndustryTemplates />
            </ProtectedRoute>
          </Route>
          <Route path="/chat">
            <ProtectedRoute feature="chat" action="view">
              <Chat />
            </ProtectedRoute>
          </Route>

          <Route path="/system-integrations">
            <ProtectedRoute feature="system-integrations" action="view">
              <SystemIntegrationsPage />
            </ProtectedRoute>
          </Route>
          <Route path="/api-integrations">
            <ProtectedRoute feature="systems-integration" action="view">
              <ApiIntegrationsPage />
            </ProtectedRoute>
          </Route>
          <Route path="/plants-management">
            <ProtectedRoute feature="systems-management" action="view">
              <PlantsManagementPage />
            </ProtectedRoute>
          </Route>
          <Route path="/extension-studio">
            <ProtectedRoute feature="systems-management" action="view">
              <ExtensionStudioPage />
            </ProtectedRoute>
          </Route>
          <Route path="/data-import">
            <ProtectedRoute feature="systems-management" action="view">
              <DataImportPage />
            </ProtectedRoute>
          </Route>
          <Route path="/data-validation">
            <ProtectedRoute feature="systems-management" action="view">
              <DataValidation />
            </ProtectedRoute>
          </Route>
          <Route path="/data-map">
            <ProtectedRoute feature="systems-management" action="view">
              <DataMapView />
            </ProtectedRoute>
          </Route>
          <Route path="/data-schema">
            <ProtectedRoute feature="systems-management" action="view">
              <DataSchemaView />
            </ProtectedRoute>
          </Route>
          <Route path="/table-field-viewer">
            <ProtectedRoute feature="systems-management" action="view">
              <TableFieldViewer />
            </ProtectedRoute>
          </Route>
          <Route path="/data-relationships">
            <ProtectedRoute feature="systems-management" action="view">
              <DataRelationships />
            </ProtectedRoute>
          </Route>
          <Route path="/constraints">
            <ProtectedRoute feature="systems-management" action="view">
              <ConstraintsPage />
            </ProtectedRoute>
          </Route>

          <Route path="/functional-map">
            <ProtectedRoute feature="systems-management" action="view">
              <FunctionalMap />
            </ProtectedRoute>
          </Route>
          <Route path="/atp-ctp">
            <ProtectedRoute feature="production-scheduling" action="view">
              <AtpCtpPage />
            </ProtectedRoute>
          </Route>
          <Route path="/canvas">
            <CanvasPage />
          </Route>
          <Route path="/error-logs">
            <ProtectedRoute feature="systems-management" action="view">
              <ErrorLogsPage />
            </ProtectedRoute>
          </Route>
          <Route path="/account" component={Account} />
          <Route path="/billing" component={Billing} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/demo-tour" component={DemoTour} />
          <Route path="/presentation" component={PresentationPage} />
          <Route path="/production-planning">
            <ProtectedRoute feature="production-planning" action="view">
              <ProductionPlanningPage />
            </ProtectedRoute>
          </Route>
          <Route path="/optimization-studio">
            <ProtectedRoute feature="optimization-studio" action="view">
              <OptimizationStudioPage />
            </ProtectedRoute>
          </Route>
          <Route path="/presentation-system">
            <ProtectedRoute feature="presentation-system" action="view">
              <PresentationSystemPage />
            </ProtectedRoute>
          </Route>
          <Route path="/presentation-studio">
            <ProtectedRoute feature="presentation-system" action="view">
              <PresentationSystemPage />
            </ProtectedRoute>
          </Route>
          <Route path="/cockpit">
            <ProtectedRoute feature="production-cockpit" action="view">
              <ProductionCockpit />
            </ProtectedRoute>
          </Route>
          <Route path="/scheduling-history">
            <ProtectedRoute feature="optimization-studio" action="view">
              <SchedulingHistory />
            </ProtectedRoute>
          </Route>
          <Route path="/widget-showcase">
            <ProtectedRoute feature="systems-management" action="view">
              <WidgetShowcase />
            </ProtectedRoute>
          </Route>
          <Route path="/widget-studio">
            <ProtectedRoute feature="analytics" action="view">
              <WidgetStudio />
            </ProtectedRoute>
          </Route>
          <Route path="/widgets">
            <ProtectedRoute feature="systems-management" action="view">
              <WidgetsPage />
            </ProtectedRoute>
          </Route>
          <Route path="/dashboards">
            <ProtectedRoute feature="systems-management" action="view">
              <DashboardsPage />
            </ProtectedRoute>
          </Route>
          <Route path="/product-development">
            <ProtectedRoute feature="systems-management" action="view">
              <ProductDevelopment />
            </ProtectedRoute>
          </Route>
          <Route path="/shift-management">
            <ProtectedRoute feature="shift-management" action="view">
              <ShiftManagement />
            </ProtectedRoute>
          </Route>
          <Route path="/" component={DashboardWithAutoTour} />
          <Route component={NotFound} />
        </Switch>
        </OnboardingGate>
      </SplitPaneLayout>
      {/* Integrated AI Assistant - now integrated in SplitPaneLayout */}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <DndProvider backend={HTML5Backend}>
          <TooltipProvider>
            <NavigationProvider>
              <TourProvider>
                <MaxDockProvider>
                <Router />
                <OnboardingWizard />
                <ResumeTourButton />
                <Toaster />
                </MaxDockProvider>
              </TourProvider>
            </NavigationProvider>
          </TooltipProvider>
        </DndProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

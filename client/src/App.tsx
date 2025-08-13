import { Switch, Route, useLocation, Redirect } from "wouter";
import { useEffect, useState } from "react";
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
import { FullScreenProvider } from "@/contexts/FullScreenContext";
import { LayoutDensityProvider } from "@/contexts/LayoutDensityContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ViewModeProvider } from "@/hooks/use-view-mode";
import { SplitPaneLayout } from "@/components/split-pane-layout";
import { MaxSidebar } from "@/components/max-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useDeviceType } from "@/hooks/useDeviceType";
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
import UserAccessManagement from "@/pages/user-access-management";
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
import ProductionSchedulePage from "@/pages/production-schedule";
import ProductionSchedulerDashboard from "@/pages/production-scheduler-dashboard";
import MasterProductionSchedulePage from "@/pages/master-production-schedule";
import MobileHomePage from "@/pages/mobile-home";
import MobileWidgetView from "@/pages/mobile-widget-view";
import MobileDashboardView from "@/pages/mobile-dashboard-view";
import { SmartHomeWrapper } from "@/components/smart-home-wrapper";
import UIDesignStudio from "@/pages/design-studio";
import DataImportPage from "@/pages/data-import-simple";
import MasterDataPage from "@/pages/master-data";
import MasterDataManagement from "@/pages/master-data-management";
import ScheduleManagement from "@/pages/schedule-management";
import Onboarding from "@/pages/onboarding";
import AtpCtpPage from "@/pages/atp-ctp";
import DataValidation from "@/pages/data-validation";
import DataMapView from "@/pages/data-map";
import DataSchemaView from "@/pages/data-schema";
import TableFieldViewer from "@/pages/table-field-viewer";
import DataRelationships from "@/pages/data-relationships";
import ConstraintsPage from "@/pages/constraints";
import HomePage from "@/pages/home";
import ClearNavigation from "@/pages/clear-navigation";
import KPIPage from "@/pages/kpi";
import TenantAdminPage from "@/pages/tenant-admin";
import EnterpriseMapPage from "@/pages/enterprise-map";
import AutonomousOptimizationPage from "@/pages/autonomous-optimization";

import FunctionalMap from "@/pages/functional-map";
import NotFound from "@/pages/not-found";
import TasksPage from "@/pages/tasks";
import InboxPage from "@/pages/inbox";
import SolutionsComparison from "@/pages/solutions-comparison";
import TestBryntumPage from "@/pages/test-bryntum";
import { ResumeTourButton } from "@/components/resume-tour-button";
import IntegratedAIAssistant from "@/components/integrated-ai-assistant";
import { OnboardingGate } from "@/components/onboarding-gate";
import { DesktopLayout } from "@/components/navigation/desktop-layout";
import { MobileLayout } from "@/components/navigation/mobile-layout";


function DashboardWithAutoTour() {
  const { startTour } = useTour();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  // DashboardWithAutoTour rendering

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

  return <SmartHomeWrapper />;
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
      // Last visited route available (not redirecting)
    }
  }, [isAuthenticated, isLoading, user, lastVisitedRoute, location, setLocation]);
}

function Router() {
  const { isAuthenticated, isLoading, user, loginError } = useAuth();
  const { isActive: isTourActive } = useTour();
  const [location, originalSetLocation] = useLocation();
  const deviceType = useDeviceType();
  const [isMobile, setIsMobile] = useState(false);
  
  // Use normal setLocation without debug tracking
  const setLocation = originalSetLocation;
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Track location changes
  useEffect(() => {
    // Location change tracking (debug logs removed)
  }, [location, isAuthenticated, isLoading]);
  
  // Use session persistence for authenticated users
  useSessionPersistence();

  // Routes that should be handled by mobile system when on mobile device
  const mobileRoutes = [
    '/production-schedule',
    '/dashboard',
    '/analytics',
    '/shop-floor',
    '/reports',
    '/boards',
    '/production-cockpit'
  ];

  // Allow mobile users to access production routes directly
  // The mobile-home page will handle rendering these routes properly
  // No longer redirect mobile users away from these routes

  // Skip loading screen for mobile users - they'll get redirected immediately
  // Check window width directly to ensure mobile detection works
  const isMobileWidth = typeof window !== 'undefined' && window.innerWidth < 768;
  // Only show loading if truly loading (not if auth failed with error)
  if (isLoading && !loginError && !isTourActive && !isMobileWidth) {
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
  // For unauthenticated users, render public pages with full-screen layout
  if (!isAuthenticated && !isTourActive) {
    return (
      <div className="fixed inset-0 z-[9999] overflow-auto">
        <Switch>
          <Route path="/pricing" component={Pricing} />
          <Route path="/solutions-comparison" component={SolutionsComparison} />
          <Route path="/demo-tour" component={DemoTour} />
          <Route path="/presentation" component={PresentationPage} />
          <Route path="/marketing" component={MarketingLandingPage} />
          <Route path="/home" component={MarketingHome} />
          <Route path="/login" component={Login} />
          <Route path="/" component={MarketingHome} />
          <Route component={Login} />
        </Switch>
      </div>
    );
  }

  // Wrap routes in appropriate layout based on device
  const routeContent = (
    <OnboardingGate>
      <Switch>
        <Route path="/marketing" component={MarketingLandingPage} />
        <Route path="/solutions-comparison" component={SolutionsComparison} />
        <Route path="/onboarding" component={Onboarding} />

        <Route path="/dashboard">
          <DashboardWithAutoTour />
        </Route>
        <Route path="/production-scheduler-dashboard">
          <ProductionSchedulerDashboard />
        </Route>
          <Route path="/analytics">
            <ProtectedRoute feature="analytics" action="view">
              <Analytics />
            </ProtectedRoute>
          </Route>
          <Route path="/kpi">
            <ProtectedRoute feature="analytics" action="view">
              <KPIPage />
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
          <Route path="/production-schedule">
            <ProtectedRoute feature="schedule" action="view">
              <ProductionSchedulePage />
            </ProtectedRoute>
          </Route>
          
          <Route path="/master-production-schedule">
            <ProtectedRoute feature="master-production-schedule" action="view">
              <MasterProductionSchedulePage />
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
          <Route path="/user-access-management">
            <ProtectedRoute feature="user-management" action="view">
              <UserAccessManagement />
            </ProtectedRoute>
          </Route>
          <Route path="/role-management">
            <ProtectedRoute feature="user-management" action="view">
              <UserAccessManagement />
            </ProtectedRoute>
          </Route>
          <Route path="/user-role-assignments-page">
            <ProtectedRoute feature="user-management" action="view">
              <UserAccessManagement />
            </ProtectedRoute>
          </Route>
          <Route path="/tenant-admin">
            <TenantAdminPage />
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
          <Route path="/enterprise-map">
            <ProtectedRoute feature="systems-management" action="view">
              <EnterpriseMapPage />
            </ProtectedRoute>
          </Route>
          <Route path="/autonomous-optimization">
            <ProtectedRoute feature="optimization" action="view">
              <AutonomousOptimizationPage />
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
          <Route path="/master-data">
            <ProtectedRoute feature="systems-management" action="view">
              <MasterDataManagement />
            </ProtectedRoute>
          </Route>
          <Route path="/schedule-management">
            <ProtectedRoute feature="production-scheduling" action="view">
              <ScheduleManagement />
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
            <Redirect to="/design-studio" />
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
          <Route path="/production-cockpit">
            <ProtectedRoute feature="production-cockpit" action="view">
              <ProductionCockpit />
            </ProtectedRoute>
          </Route>
          <Route path="/scheduling-history">
            <ProtectedRoute feature="optimization-studio" action="view">
              <SchedulingHistory />
            </ProtectedRoute>
          </Route>
          <Route path="/design-studio">
            <ProtectedRoute feature="systems-management" action="view">
              <UIDesignStudio />
            </ProtectedRoute>
          </Route>
          <Route path="/test-bryntum">
            <TestBryntumPage />
          </Route>
          {/* Legacy routes redirect to Design Studio */}
          <Route path="/widget-showcase">
            <Redirect to="/design-studio" />
          </Route>
          <Route path="/widget-studio">
            <Redirect to="/design-studio" />
          </Route>
          <Route path="/widgets">
            <Redirect to="/design-studio" />
          </Route>
          <Route path="/dashboards">
            <Redirect to="/design-studio" />
          </Route>
          <Route path="/mobile" component={MobileHomePage} />
          <Route path="/mobile-home" component={() => {
            // Check window width directly to avoid race condition
            const isMobile = window.innerWidth < 768;
            if (!isMobile) {
              // Only redirect if we're actually on desktop
              return <Redirect to="/production-schedule" />;
            }
            return <MobileHomePage />;
          }} />
          <Route path="/widgets/:id" component={MobileWidgetView} />
          <Route path="/dashboards/:id" component={MobileDashboardView} />
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
          <Route path="/clear-nav" component={ClearNavigation} />
          <Route path="/login" component={Login} />
          <Route path="/tasks" component={TasksPage} />
          <Route path="/inbox" component={InboxPage} />
          <Route path="/">
            <SmartHomeWrapper />
          </Route>
          <Route component={NotFound} />
        </Switch>
    </OnboardingGate>
  );
  
  // Force mobile layout for mobile-specific routes regardless of screen width
  const forceMobileRoutes = ['/mobile', '/mobile-home', '/widgets/', '/dashboards/'];
  const shouldUseMobileLayout = isMobile || forceMobileRoutes.some(route => location.includes(route));
  
  // Return appropriate layout based on device or route
  if (shouldUseMobileLayout) {
    return (
      <MobileLayout>
        {routeContent}
      </MobileLayout>
    );
  }
  
  // Desktop layout with SplitPane for AI panel
  return (
    <DesktopLayout>
      <SplitPaneLayout maxPanel={<MaxSidebar />}>
        {routeContent}
      </SplitPaneLayout>
    </DesktopLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ViewModeProvider>
            <DndProvider backend={HTML5Backend}>
              <TooltipProvider>
                <NavigationProvider>
                  <TourProvider>
                    <MaxDockProvider>
                      <FullScreenProvider>
                        <LayoutDensityProvider>
                          <Router />
                          <OnboardingWizard />
                          <ResumeTourButton />
                          <Toaster />
                        </LayoutDensityProvider>
                      </FullScreenProvider>
                    </MaxDockProvider>
                  </TourProvider>
                </NavigationProvider>
              </TooltipProvider>
            </DndProvider>
          </ViewModeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

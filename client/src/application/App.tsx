import { Route, Switch, Link } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { OnboardingGate } from "@/components/onboarding-gate";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MobileLayout } from "@/components/navigation/mobile-layout";
import { DesktopLayout } from "@/components/navigation/desktop-layout";
import { HintSystem } from "@/components/HintBubble";

// Application Pages
import Dashboard from "@/pages/dashboard";
import HomePage from "@/pages/home";
import { SmartHomeWrapper } from "@/components/smart-home-wrapper";
import Analytics from "@/pages/analytics";
import KPIPage from "@/pages/kpi";
import Reports from "@/pages/reports";
import Boards from "@/pages/boards";
import ShopFloor from "@/pages/shop-floor";
import Sales from "@/pages/sales";
import CustomerService from "@/pages/customer-service";
import OperatorDashboard from "@/pages/operator-dashboard";
import Maintenance from "@/pages/maintenance";
import Feedback from "@/pages/feedback";
import InboxPage from "@/pages/inbox";
import AlertsPage from "@/pages/alerts";
import AIAnalysisConfig from "@/pages/ai-analysis-config";
import AIInsightsPage from "@/pages/ai-insights";
import ForkliftDriver from "@/pages/forklift-driver";
import EmailSettings from "@/pages/email-settings";
import Settings from "@/pages/settings";
import LaborPlanning from "@/pages/labor-planning";
import EnterpriseMap from "@/pages/enterprise-map";
// import DemoPage from "@/pages/demo"; // Commented out - file doesn't exist
import Onboarding from "@/pages/onboarding";
import OptimizationStudio from "@/pages/optimization-studio";
import CapacityPlanning from "@/pages/capacity-planning";
import BusinessGoals from "@/pages/business-goals";
import ProductionScheduleSimple from "@/pages/production-schedule-simple";
import MasterProductionSchedule from "@/pages/master-production-schedule";
import BryntumSchedulerProDirect from "@/pages/bryntum-scheduler-pro-direct";
import ProductionSchedulerStandalone from "@/pages/production-scheduler-standalone";
import IntegrationsPage from "@/pages/integrations";
import SystemIntegrationsPage from "@/pages/system-integrations";
import DemandManagement from "@/pages/demand-management";
import AtpCtp from "@/pages/atp-ctp";
import Patti from "@/pages/Patti";
import PlanningOverview from "@/pages/planning-overview";
import PlantsManagement from "@/pages/plants-management";
import DemandSupplyAlignment from "@/pages/demand-supply-alignment";
import InventoryOptimization from "@/pages/inventory-optimization";
import MRP from "@/pages/mrp";
import ProductionPlanning from "@/pages/production-planning";
import ScheduleSequences from "@/pages/schedule-sequences";
import ShiftManagement from "@/pages/shift-management";
import TimeTracking from "@/pages/time-tracking";

// Additional page imports for missing routes
import AutonomousOptimization from "@/pages/autonomous-optimization";
import Chat from "@/pages/chat";
import Constraints from "@/pages/constraints";
import DataImport from "@/pages/data-import";
import DataMap from "@/pages/data-map";
import DataRelationships from "@/pages/data-relationships";
import DataSchema from "@/pages/data-schema";
import DataValidation from "@/pages/data-validation";
import DemandForecasting from "@/pages/demand-forecasting";
import DesignStudio from "@/pages/design-studio";
import DisruptionManagement from "@/pages/disruption-management";
import ErrorLogs from "@/pages/error-logs";
import ExtensionStudio from "@/pages/extension-studio";
import OnboardingAssistant from "@/pages/onboarding-assistant";
import ImplementationProjects from "@/pages/implementation-projects";
import IndustryTemplates from "@/pages/industry-templates";
import MasterData from "@/pages/master-data";
import DatabaseExplorer from "@/pages/database-explorer";
import PresentationSystem from "@/pages/presentation-system";
import SystemsManagementDashboard from "@/pages/systems-management-dashboard";
import TableFieldViewer from "@/pages/table-field-viewer";
import TechnologyStack from "@/pages/technology-stack";
import TenantAdmin from "@/pages/tenant-admin";
import Training from "@/pages/training";
import UserAccessManagement from "@/pages/user-access-management";
import VisualFactory from "@/pages/visual-factory";
import AIScenarioCreator from "@/pages/ai-scenario-creator";
import MemoryBookPage from "@/pages/memory-book";
import AgentHistory from "@/pages/agent-history";
import OrderOptimization from "@/pages/order-optimization";
import CanvasPage from "@/pages/canvas";

// Import other application-specific components
import { useAuth, usePermissions } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export default function ApplicationApp() {
  const { isAuthenticated, user, isLoading, loginError } = useAuth();

  // Check if user is on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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

  if (!isAuthenticated && !isLoading) {
    // Only redirect if not loading and definitely not authenticated
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  const Layout = isMobile ? MobileLayout : DesktopLayout;

  return (
    <ThemeProvider>
      <TooltipProvider>
        <Layout>
          <HintSystem />
          <OnboardingGate>
            <Switch>
              {/* Demo and Test Pages */}
              {/* <Route path="/demo" component={DemoPage} /> */}
              <Route path="/onboarding" component={Onboarding} />

              {/* Main Dashboard */}
              <Route path="/dashboard" component={HomePage} />
              <Route path="/mobile-home" component={HomePage} />

              {/* Analytics & Reports */}
              <Route path="/analytics">
                <ProtectedRoute feature="analytics" action="view">
                  <Analytics />
                </ProtectedRoute>
              </Route>
              <Route path="/ai-insights">
                <ProtectedRoute feature="analytics" action="view">
                  <AIInsightsPage />
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
              <Route path="/business-goals">
                <ProtectedRoute feature="business-goals" action="view">
                  <BusinessGoals />
                </ProtectedRoute>
              </Route>

              {/* Operations */}
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
              <Route path="/labor-planning">
                <ProtectedRoute feature="labor-planning" action="view">
                  <LaborPlanning />
                </ProtectedRoute>
              </Route>
              <Route path="/optimization-studio">
                <ProtectedRoute feature="optimization-studio" action="view">
                  <OptimizationStudio />
                </ProtectedRoute>
              </Route>

              <Route path="/production-schedule-simple">
                <ProtectedRoute feature="schedule" action="view">
                  <ProductionScheduleSimple />
                </ProtectedRoute>
              </Route>
              <Route path="/master-production-schedule">
                <ProtectedRoute feature="master-production-schedule" action="view">
                  <MasterProductionSchedule />
                </ProtectedRoute>
              </Route>
              <Route path="/production-scheduler-dashboard">
                <ProtectedRoute feature="scheduling" action="view">
                  <Dashboard />
                </ProtectedRoute>
              </Route>
              <Route path="/bryntum-scheduler-pro">
                <ProtectedRoute feature="schedule" action="view">
                  <BryntumSchedulerProDirect />
                </ProtectedRoute>
              </Route>
              <Route path="/bryntum-scheduler-pro-direct" component={BryntumSchedulerProDirect} />
              <Route path="/production-scheduler-js" component={ProductionSchedulerStandalone} />
              <Route path="/production-scheduler-js.html" component={ProductionSchedulerStandalone} />

              {/* Planning & Scheduling Routes */}
              <Route path="/planning-overview" component={PlanningOverview} />
              <Route path="/demand-planning">
                <ProtectedRoute feature="demand-planning" action="view">
                  <DemandManagement />
                </ProtectedRoute>
              </Route>
              <Route path="/demand-supply-alignment">
                <ProtectedRoute feature="demand-supply-alignment" action="view">
                  <DemandSupplyAlignment />
                </ProtectedRoute>
              </Route>
              <Route path="/capacity-planning">
                <ProtectedRoute feature="capacity-planning" action="view">
                  <CapacityPlanning />
                </ProtectedRoute>
              </Route>
              <Route path="/inventory-optimization">
                <ProtectedRoute feature="inventory-optimization" action="view">
                  <InventoryOptimization />
                </ProtectedRoute>
              </Route>
              <Route path="/mrp">
                <ProtectedRoute feature="schedule" action="view">
                  <MRP />
                </ProtectedRoute>
              </Route>
              <Route path="/production-planning">
                <ProtectedRoute feature="production-planning" action="view">
                  <ProductionPlanning />
                </ProtectedRoute>
              </Route>
              <Route path="/atp-ctp">
                <ProtectedRoute feature="production-scheduling" action="view">
                  <AtpCtp />
                </ProtectedRoute>
              </Route>
              <Route path="/schedule-sequences">
                <ProtectedRoute feature="schedule" action="view">
                  <ScheduleSequences />
                </ProtectedRoute>
              </Route>
              <Route path="/shift-management">
                <ProtectedRoute feature="planning-scheduling" action="view">
                  <ShiftManagement />
                </ProtectedRoute>
              </Route>
              <Route path="/time-tracking">
                <ProtectedRoute feature="planning-scheduling" action="view">
                  <TimeTracking />
                </ProtectedRoute>
              </Route>
              <Route path="/order-optimization">
                <ProtectedRoute feature="scheduling-optimizer" action="view">
                  <OrderOptimization />
                </ProtectedRoute>
              </Route>
              <Route path="/constraints" component={Constraints} />
              
              {/* AI & Analytics Routes */}
              <Route path="/autonomous-optimization" component={AutonomousOptimization} />
              <Route path="/demand-forecasting" component={DemandForecasting} />
              <Route path="/onboarding-assistant" component={OnboardingAssistant} />
              <Route path="/design-studio" component={DesignStudio} />
              <Route path="/ai-scenario-creator" component={AIScenarioCreator} />
              <Route path="/canvas" component={CanvasPage} />
              <Route path="/playbooks" component={MemoryBookPage} />
              <Route path="/agent-history" component={AgentHistory} />
              
              {/* Data Management Routes */}
              <Route path="/data-import" component={DataImport} />
              <Route path="/master-data" component={MasterData} />
              <Route path="/database-explorer" component={DatabaseExplorer} />
              <Route path="/data-schema" component={DataSchema} />
              <Route path="/table-field-viewer" component={TableFieldViewer} />
              <Route path="/data-relationships" component={DataRelationships} />
              <Route path="/data-map" component={DataMap} />
              <Route path="/data-validation" component={DataValidation} />
              
              {/* Shop Floor Operations Routes */}
              <Route path="/disruption-management" component={DisruptionManagement} />
              
              {/* Management & Administration Routes */}
              <Route path="/implementation-projects" component={ImplementationProjects} />
              <Route path="/systems-management-dashboard" component={SystemsManagementDashboard} />
              <Route path="/technology-stack" component={TechnologyStack} />
              <Route path="/user-access-management" component={UserAccessManagement} />
              <Route path="/extension-studio" component={ExtensionStudio} />
              <Route path="/error-logs" component={ErrorLogs} />
              <Route path="/tenant-admin" component={TenantAdmin} />
              
              {/* Training & Support Routes */}
              <Route path="/training" component={Training} />
              <Route path="/industry-templates" component={IndustryTemplates} />
              <Route path="/presentation-system" component={PresentationSystem} />
              
              {/* Communication & Collaboration Routes */}
              <Route path="/chat" component={Chat} />
              <Route path="/visual-factory" component={VisualFactory} />

              {/* Business Management Routes */}
              <Route path="/plants-management" component={PlantsManagement} />
              <Route path="/business-goals" component={BusinessGoals} />
              <Route path="/business-intelligence">
                <ProtectedRoute feature="business-intelligence" action="view">
                  <Analytics />
                </ProtectedRoute>
              </Route>
              <Route path="/financial-management">
                <ProtectedRoute feature="financial-management" action="view">
                  <Dashboard />
                </ProtectedRoute>
              </Route>
              <Route path="/smart-kpi-tracking">
                <ProtectedRoute feature="analytics" action="view">
                  <KPIPage />
                </ProtectedRoute>
              </Route>

              {/* Global Control Tower */}
              <Route path="/control-tower">
                <ProtectedRoute feature="analytics" action="view">
                  <EnterpriseMap />
                </ProtectedRoute>
              </Route>
              
              {/* Customer & Sales */}
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

              {/* Specialized Dashboards */}
              <Route path="/operator-dashboard">
                <ProtectedRoute feature="operator-dashboard" action="view">
                  <OperatorDashboard />
                </ProtectedRoute>
              </Route>
              <Route path="/forklift-driver">
                <ProtectedRoute feature="forklift-driver" action="view">
                  <ForkliftDriver />
                </ProtectedRoute>
              </Route>

              {/* System Management */}
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
              <Route path="/inbox">
                <ProtectedRoute feature="inbox" action="view">
                  <InboxPage />
                </ProtectedRoute>
              </Route>
              <Route path="/alerts">
                <ProtectedRoute feature="alerts" action="view">
                  <AlertsPage />
                </ProtectedRoute>
              </Route>
              <Route path="/ai-analysis-config">
                <ProtectedRoute feature="alerts" action="view">
                  <AIAnalysisConfig />
                </ProtectedRoute>
              </Route>

              {/* Test/Demo Pages */}
              <Route path="/patti" component={Patti} />

              {/* Settings */}
              <Route path="/email-settings">
                <ProtectedRoute feature="email-settings" action="view">
                  <EmailSettings />
                </ProtectedRoute>
              </Route>
              <Route path="/settings">
                <ProtectedRoute feature="settings" action="view">
                  <Settings />
                </ProtectedRoute>
              </Route>
              <Route path="/integrations">
                <ProtectedRoute feature="integrations" action="view">
                  <IntegrationsPage />
                </ProtectedRoute>
              </Route>
              <Route path="/systems-integration">
                <ProtectedRoute feature="systems-integration" action="view">
                  <SystemIntegrationsPage />
                </ProtectedRoute>
              </Route>

              {/* Redirect /home to dashboard for authenticated users */}
              <Route path="/home">
                {() => {
                  if (typeof window !== 'undefined') {
                    window.location.replace('/dashboard');
                  }
                  return null;
                }}
              </Route>
              
              {/* Default Route - Home page */}
              <Route path="/" component={SmartHomeWrapper} />
              
              {/* Catch all route - redirect to dashboard */}
              <Route>
                {() => {
                  if (typeof window !== 'undefined') {
                    window.location.replace('/dashboard');
                  }
                  return null;
                }}
              </Route>
            </Switch>
          </OnboardingGate>
        </Layout>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
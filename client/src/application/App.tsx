import { Route, Switch, Link } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthAdapterProvider } from "@/adapters/AuthAdapter";
import { ThemeAdapterProvider } from "@/adapters/ThemeAdapter";
import { AgentAdapterProvider } from "@/adapters/AgentAdapter";
import { NavigationAdapterProvider } from "@/adapters/NavigationAdapter";
import { OnboardingGate } from "@/components/onboarding-gate";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MobileLayout } from "@/components/navigation/mobile-layout";
import { DesktopLayout } from "@/components/navigation/desktop-layout";
import { HintSystem } from "@/components/HintBubble";
import { SplitScreenLayout } from "@/components/split-screen-layout";
import { initializeFederation } from "@/lib/federation-bootstrap";

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
import MasterProductionSchedule from "@/pages/master-production-schedule";
import IntegrationsPage from "@/pages/integrations";
import SystemIntegrationsPage from "@/pages/system-integrations";
import DemandManagement from "@/pages/demand-management";
import AtpCtp from "@/pages/atp-ctp";
import PlanningOverview from "@/pages/planning-overview";
import PlantsManagement from "@/pages/plants-management";
import DemandSupplyAlignment from "@/pages/demand-supply-alignment";
import InventoryOptimization from "@/pages/inventory-optimization";
import MRP from "@/pages/mrp";
import DDMRP from "@/pages/ddmrp";
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
import SMSPage from "@/pages/sms";
import { FederationPerformanceDashboard } from "@/components/federation-performance-dashboard";
import FederationDashboard from "@/pages/federation-dashboard";
import ProductionSchedule from "@/pages/production-schedule";
import ProductionSchedulerStandalone from "@/pages/ProductionSchedulerStandalone";

// Fully implemented features now being connected
import ControlTower from "@/pages/control-tower";
import Dashboards from "@/pages/dashboards";
import SmartKpiTracking from "@/pages/smart-kpi-tracking";
import SchedulingOptimizer from "@/pages/scheduling-optimizer";

// Additional connected features
import ProductDevelopment from "@/pages/product-development";
import DemandPlanning from "@/pages/demand-planning";
import RoleManagement from "@/pages/role-management";
import ERPImport from "@/pages/erp-import";
import ScheduleManagement from "@/pages/schedule-management";
import FunctionalMap from "@/pages/functional-map";
import APIIntegrations from "@/pages/api-integrations";
import AnalyticsNew from "@/pages/analytics-new";
import SchedulingHistory from "@/pages/scheduling-history";
import Tasks from "@/pages/tasks";
import AlgorithmGovernance from "@/pages/algorithm-governance";
import Billing from "@/pages/billing";
import AlgorithmManagement from "@/pages/algorithm-management";
import MobileDashboardView from "@/pages/mobile-dashboard-view";
import MemoryBooks from "@/pages/memory-books";
import DataImportClean from "@/pages/data-import-clean";
import DataImportSimple from "@/pages/data-import-simple";
import Help from "@/pages/help";

// Import other application-specific components  
import { useAuth, usePermissions } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export default function ApplicationApp() {
  const { isAuthenticated, user, isLoading, loginError } = useAuth();

  // Initialize federation system on app startup
  useEffect(() => {
    initializeFederation()
      .then(() => {
        console.log('[App] Federation system initialized successfully');
      })
      .catch((error) => {
        console.warn('[App] Federation initialization failed, using fallback mode:', error);
      });
  }, []);

  // Reactive mobile detection that updates on window resize - use standard mobile breakpoint
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 480);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 480);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <AuthAdapterProvider>
      <ThemeAdapterProvider>
        <TooltipProvider>
          <AgentAdapterProvider>
            <NavigationAdapterProvider>
          <Layout>
            <HintSystem />
            <OnboardingGate>
              <SplitScreenLayout>
              <Switch>
              {/* Demo and Test Pages */}
              {/* <Route path="/demo" component={DemoPage} /> */}
              <Route path="/onboarding" component={Onboarding} />

              {/* Main Dashboard */}
              <Route path="/dashboard">
                <ProtectedRoute feature="dashboard" action="view">
                  <Dashboard />
                </ProtectedRoute>
              </Route>
              <Route path="/mobile-home" component={HomePage} />

              {/* Analytics & Reports */}
              <Route path="/federation-dashboard">
                <ProtectedRoute>
                  <FederationDashboard />
                </ProtectedRoute>
              </Route>
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

              <Route path="/master-production-schedule">
                <ProtectedRoute feature="master-production-schedule" action="view">
                  <MasterProductionSchedule />
                </ProtectedRoute>
              </Route>


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
              <Route path="/ddmrp">
                <ProtectedRoute feature="schedule" action="view">
                  <DDMRP />
                </ProtectedRoute>
              </Route>
              <Route path="/production-planning">
                <ProtectedRoute feature="production-planning" action="view">
                  <ProductionPlanning />
                </ProtectedRoute>
              </Route>
              <Route path="/production-schedule">
                <ProtectedRoute feature="production-scheduling" action="view">
                  <ProductionSchedule />
                </ProtectedRoute>
              </Route>
              <Route path="/production-scheduler-standalone">
                <ProtectedRoute feature="production-scheduling" action="view">
                  <ProductionSchedulerStandalone />
                </ProtectedRoute>
              </Route>
              <Route path="/product-development">
                <ProtectedRoute feature="production-planning" action="view">
                  <ProductDevelopment />
                </ProtectedRoute>
              </Route>
              <Route path="/demand-planning">
                <ProtectedRoute feature="demand-planning" action="view">
                  <DemandPlanning />
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
              <Route path="/schedule-management">
                <ProtectedRoute feature="schedule" action="view">
                  <ScheduleManagement />
                </ProtectedRoute>
              </Route>
              <Route path="/scheduling-history">
                <ProtectedRoute feature="schedule" action="view">
                  <SchedulingHistory />
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
              <Route path="/memory-books" component={MemoryBooks} />
              <Route path="/agent-history" component={AgentHistory} />
              <Route path="/functional-map" component={FunctionalMap} />
              <Route path="/analytics-new" component={AnalyticsNew} />
              
              {/* Data Management Routes */}
              <Route path="/data-import" component={DataImport} />
              <Route path="/data-import-clean" component={DataImportClean} />
              <Route path="/data-import-simple" component={DataImportSimple} />
              <Route path="/erp-import" component={ERPImport} />
              <Route path="/master-data" component={MasterData} />
              <Route path="/database-explorer" component={DatabaseExplorer} />
              <Route path="/data-schema" component={DataSchema} />
              <Route path="/table-field-viewer" component={TableFieldViewer} />
              <Route path="/data-relationships" component={DataRelationships} />
              <Route path="/data-map" component={DataMap} />
              <Route path="/data-validation" component={DataValidation} />
              
              {/* Shop Floor Operations Routes */}
              <Route path="/disruption-management" component={DisruptionManagement} />
              <Route path="/tasks" component={Tasks} />
              
              {/* Management & Administration Routes */}
              <Route path="/implementation-projects" component={ImplementationProjects} />
              <Route path="/systems-management-dashboard" component={SystemsManagementDashboard} />
              <Route path="/technology-stack" component={TechnologyStack} />
              <Route path="/user-access-management" component={UserAccessManagement} />
              <Route path="/extension-studio" component={ExtensionStudio} />
              <Route path="/error-logs" component={ErrorLogs} />
              <Route path="/tenant-admin" component={TenantAdmin} />
              <Route path="/role-management" component={RoleManagement} />
              <Route path="/algorithm-governance" component={AlgorithmGovernance} />
              <Route path="/algorithm-management" component={AlgorithmManagement} />
              <Route path="/api-integrations" component={APIIntegrations} />
              <Route path="/billing" component={Billing} />
              
              {/* Training & Support Routes */}
              <Route path="/training" component={Training} />
              <Route path="/help" component={Help} />
              <Route path="/industry-templates" component={IndustryTemplates} />
              <Route path="/presentation-system" component={PresentationSystem} />
              
              {/* Communication & Collaboration Routes */}
              <Route path="/chat" component={Chat} />
              <Route path="/visual-factory" component={VisualFactory} />

              {/* Business Management Routes */}
              <Route path="/plants-management" component={PlantsManagement} />
              <Route path="/business-goals" component={BusinessGoals} />
              <Route path="/business-intelligence">
                <ProtectedRoute feature="analytics" action="view">
                  <Analytics />
                </ProtectedRoute>
              </Route>
              <Route path="/financial-management">
                <ProtectedRoute feature="analytics" action="view">
                  <Dashboard />
                </ProtectedRoute>
              </Route>
              <Route path="/smart-kpi-tracking">
                <ProtectedRoute feature="analytics" action="view">
                  <SmartKpiTracking />
                </ProtectedRoute>
              </Route>

              {/* Global Control Tower */}
              <Route path="/control-tower">
                <ProtectedRoute feature="analytics" action="view">
                  <ControlTower />
                </ProtectedRoute>
              </Route>

              {/* Dashboard Management */}
              <Route path="/dashboards">
                <ProtectedRoute feature="analytics" action="view">
                  <Dashboards />
                </ProtectedRoute>
              </Route>

              {/* Scheduling Optimizer */}
              <Route path="/scheduling-optimizer">
                <ProtectedRoute feature="scheduling-optimizer" action="view">
                  <SchedulingOptimizer />
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
              <Route path="/mobile-dashboard-view">
                <ProtectedRoute feature="dashboard" action="view">
                  <MobileDashboardView />
                </ProtectedRoute>
              </Route>
              <Route path="/alerts">
                <ProtectedRoute feature="alerts" action="view">
                  <AlertsPage />
                </ProtectedRoute>
              </Route>
              <Route path="/sms">
                <ProtectedRoute feature="notifications" action="send">
                  <SMSPage />
                </ProtectedRoute>
              </Route>
              <Route path="/ai-analysis-config">
                <ProtectedRoute feature="alerts" action="view">
                  <AIAnalysisConfig />
                </ProtectedRoute>
              </Route>

              {/* Test/Demo Pages */}

              {/* Settings */}
              <Route path="/email-settings">
                <ProtectedRoute feature="email-settings" action="view">
                  <EmailSettings />
                </ProtectedRoute>
              </Route>
              <Route path="/settings" component={Settings} />
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
              
              {/* Federation Performance Dashboard */}
              <Route path="/federation-performance">
                <ProtectedRoute feature="systems-integration" action="view">
                  <FederationPerformanceDashboard />
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
              </SplitScreenLayout>
            </OnboardingGate>
          </Layout>
            </NavigationAdapterProvider>
          </AgentAdapterProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeAdapterProvider>
    </AuthAdapterProvider>
  );
}
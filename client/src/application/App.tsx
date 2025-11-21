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

// Application Pages - Using lazy loading for better performance
import { lazy, Suspense } from "react";

// Core pages loaded immediately
import HomePage from "@/pages/home";
import { SmartHomeWrapper } from "@/components/smart-home-wrapper";
import Dashboard from "@/pages/dashboard";

// Lazy load all other pages to reduce initial bundle size
const Analytics = lazy(() => import("@/pages/analytics"));
const KPIPage = lazy(() => import("@/pages/kpi"));
const Reports = lazy(() => import("@/pages/reports"));
const Boards = lazy(() => import("@/pages/boards"));
const ShopFloor = lazy(() => import("@/pages/shop-floor"));
const Sales = lazy(() => import("@/pages/sales"));
const CustomerService = lazy(() => import("@/pages/customer-service"));
const OperatorDashboard = lazy(() => import("@/pages/operator-dashboard"));
const Maintenance = lazy(() => import("@/pages/maintenance"));
const Feedback = lazy(() => import("@/pages/feedback"));
const InboxPage = lazy(() => import("@/pages/inbox"));
const AlertsPage = lazy(() => import("@/pages/alerts"));
const AIAnalysisConfig = lazy(() => import("@/pages/ai-analysis-config"));
const AIInsightsPage = lazy(() => import("@/pages/ai-insights"));
const ForkliftDriver = lazy(() => import("@/pages/forklift-driver"));
const EmailSettings = lazy(() => import("@/pages/email-settings"));
const Settings = lazy(() => import("@/pages/settings"));
const LLMSettings = lazy(() => import("@/pages/llm-settings"));
const LaborPlanning = lazy(() => import("@/pages/labor-planning"));
const EnterpriseMap = lazy(() => import("@/pages/enterprise-map"));
// import DemoPage from "@/pages/demo"; // Commented out - file doesn't exist
const Onboarding = lazy(() => import("@/pages/onboarding"));
const OptimizationStudio = lazy(() => import("@/pages/optimization-studio"));
const CapacityPlanning = lazy(() => import("@/pages/capacity-planning"));
const BusinessGoals = lazy(() => import("@/pages/business-goals"));
const MasterProductionSchedule = lazy(() => import("@/pages/master-production-schedule"));
const IntegrationsPage = lazy(() => import("@/pages/integrations"));
const SystemIntegrationsPage = lazy(() => import("@/pages/system-integrations"));
const DemandManagement = lazy(() => import("@/pages/demand-management"));
const AtpCtpReservations = lazy(() => import("@/pages/atp-ctp-reservations"));
const PlanningOverview = lazy(() => import("@/pages/planning-overview"));
const PlantsManagement = lazy(() => import("@/pages/plants-management"));
const DemandSupplyAlignment = lazy(() => import("@/pages/demand-supply-alignment"));
const InventoryOptimization = lazy(() => import("@/pages/inventory-optimization"));
const MRP = lazy(() => import("@/pages/mrp"));
const DDMRP = lazy(() => import("@/pages/ddmrp"));
const ProductionPlanning = lazy(() => import("@/pages/production-planning"));
const ScheduleSequences = lazy(() => import("@/pages/schedule-sequences"));
const ShiftManagement = lazy(() => import("@/pages/shift-management"));
const TimeTracking = lazy(() => import("@/pages/time-tracking"));

// Additional page imports for missing routes - All lazy loaded
const AutonomousOptimization = lazy(() => import("@/pages/autonomous-optimization"));
const Chat = lazy(() => import("@/pages/chat"));
const Constraints = lazy(() => import("@/pages/constraints"));
const DataImport = lazy(() => import("@/pages/data-import"));
const DataMap = lazy(() => import("@/pages/data-map"));
const DataRelationships = lazy(() => import("@/pages/data-relationships"));
const DataSchema = lazy(() => import("@/pages/data-schema"));
const DataValidation = lazy(() => import("@/pages/data-validation"));
const RoutingIntelligence = lazy(() => import("@/pages/routing-intelligence").then(m => ({ default: m.RoutingIntelligence })));
const DemandForecasting = lazy(() => import("@/pages/demand-forecasting"));
const DemandForecastingSimple = lazy(() => import("@/pages/demand-forecasting-simple"));
const DesignStudio = lazy(() => import("@/pages/design-studio"));
const DisruptionManagement = lazy(() => import("@/pages/disruption-management"));
const ErrorLogs = lazy(() => import("@/pages/error-logs"));
const ExtensionStudio = lazy(() => import("@/pages/extension-studio"));
const OnboardingAssistant = lazy(() => import("@/pages/onboarding-assistant"));
const CompanyOnboardingOverview = lazy(() => import("@/pages/company-onboarding-overview"));
const ImplementationProjects = lazy(() => import("@/pages/implementation-projects"));
const IndustryTemplates = lazy(() => import("@/pages/industry-templates"));
const MasterDataManagement = lazy(() => import("@/pages/master-data-management"));
const PlanningAreaManagement = lazy(() => import("@/pages/planning-area-management"));
const ResourcePlanningAssignment = lazy(() => import("@/pages/resource-planning-assignment"));
const ResourceDeploymentOrder = lazy(() => import("@/pages/resource-deployment-order"));
const DatabaseExplorer = lazy(() => import("@/pages/database-explorer"));
const PresentationSystem = lazy(() => import("@/pages/presentation-system"));
const SystemsManagementDashboard = lazy(() => import("@/pages/systems-management-dashboard"));
const TableFieldViewer = lazy(() => import("@/pages/table-field-viewer"));
const TechnologyStack = lazy(() => import("@/pages/technology-stack"));
const TenantAdmin = lazy(() => import("@/pages/tenant-admin"));
const Training = lazy(() => import("@/pages/training"));
const GuidedTourPage = lazy(() => import("@/pages/guided-tour-page"));
const UserAccessManagement = lazy(() => import("@/pages/user-access-management"));
const VisualFactory = lazy(() => import("@/pages/visual-factory"));
const AIScenarioCreator = lazy(() => import("@/pages/ai-scenario-creator"));
const AgentHistory = lazy(() => import("@/pages/agent-history"));
const AgentMonitoring = lazy(() => import("@/pages/agent-monitoring").then(m => ({ default: m.AgentMonitoring })));
const OrderOptimization = lazy(() => import("@/pages/order-optimization"));
const CanvasPage = lazy(() => import("@/pages/canvas"));
const SMSPage = lazy(() => import("@/pages/sms"));
const FederationPerformanceDashboard = lazy(() => import("@/components/federation-performance-dashboard").then(m => ({ default: m.FederationPerformanceDashboard })));
const FederationDashboard = lazy(() => import("@/pages/federation-dashboard"));
// Heavy scheduler components - definitely need lazy loading
const ProductionScheduler = lazy(() => import("@/pages/production-scheduler"));
const ProductionSchedulerReact = lazy(() => import("@/pages/ProductionSchedulerReact"));
const Scheduler = lazy(() => import("@/pages/Scheduler"));
const ProductWheels = lazy(() => import("@/pages/product-wheels"));
const CalendarManagementPage = lazy(() => import("@/pages/CalendarManagementPage"));

// Fully implemented features now being connected - All lazy loaded
const ControlTower = lazy(() => import("@/pages/control-tower"));
const Dashboards = lazy(() => import("@/pages/dashboards"));
const SmartKpiTracking = lazy(() => import("@/pages/smart-kpi-tracking"));
const SchedulingOptimizer = lazy(() => import("@/pages/scheduling-optimizer"));

// Additional connected features - All lazy loaded
const ProductDevelopment = lazy(() => import("@/pages/product-development"));
const DemandPlanning = lazy(() => import("@/pages/demand-planning"));
const RoleManagement = lazy(() => import("@/pages/role-management"));
const ERPImport = lazy(() => import("@/pages/erp-import"));
const ScheduleManagement = lazy(() => import("@/pages/schedule-management"));
const FunctionalMap = lazy(() => import("@/pages/functional-map"));
const APIIntegrations = lazy(() => import("@/pages/api-integrations"));
const AnalyticsNew = lazy(() => import("@/pages/analytics-new"));
const SchedulingHistory = lazy(() => import("@/pages/scheduling-history"));
const Tasks = lazy(() => import("@/pages/tasks"));
const AlgorithmGovernance = lazy(() => import("@/pages/algorithm-governance"));
const Billing = lazy(() => import("@/pages/billing"));
const AlgorithmManagement = lazy(() => import("@/pages/algorithm-management"));
const MobileDashboardView = lazy(() => import("@/pages/mobile-dashboard-view"));
const MemoryBooks = lazy(() => import("@/pages/memory-books"));
const Workflows = lazy(() => import("@/pages/Workflows"));
const DataImportClean = lazy(() => import("@/pages/data-import-clean"));
const ContinuousImprovement = lazy(() => import("@/pages/continuous-improvement"));
const DataImportSimple = lazy(() => import("@/pages/data-import-simple"));
const Help = lazy(() => import("@/pages/help"));
const PaginatedReports = lazy(() => import("@/pages/paginated-reports"));
const FPADashboard = lazy(() => import("@/pages/fpa-dashboard"));

// Import other application-specific components  
import { useAuth, usePermissions } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

// Loading fallback component for lazy-loaded pages
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading page...</p>
    </div>
  </div>
);

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

  // Define the app content once to prevent remounting
  const appContent = (
    <>
      <HintSystem />
      <SplitScreenLayout>
        <OnboardingGate>
          <Suspense fallback={<PageLoader />}>
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
              <Route path="/home">
                <HomePage />
              </Route>

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
              <Route path="/paginated-reports">
                <ProtectedRoute feature="reports" action="view">
                  <PaginatedReports />
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
              <Route path="/demand-management">
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
              <Route path="/production-scheduler">
                <ProtectedRoute feature="schedule" action="view">
                  <ProductionScheduler />
                </ProtectedRoute>
              </Route>
              <Route path="/production-scheduler-react">
                <ProtectedRoute feature="schedule" action="view">
                  <ProductionSchedulerReact />
                </ProtectedRoute>
              </Route>
              <Route path="/calendar-management">
                <ProtectedRoute feature="production-scheduling" action="view">
                  <CalendarManagementPage />
                </ProtectedRoute>
              </Route>
              <Route path="/scheduler">
                <ProtectedRoute feature="production-scheduling" action="view">
                  <Scheduler />
                </ProtectedRoute>
              </Route>
              <Route path="/product-wheels">
                <ProtectedRoute feature="production-scheduling" action="view">
                  <ProductWheels />
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
                  <AtpCtpReservations />
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
              <Route path="/workflows">
                <ProtectedRoute feature="workflows" action="view">
                  <Workflows />
                </ProtectedRoute>
              </Route>
              <Route path="/demand-forecasting" component={DemandForecasting} />
              <Route path="/onboarding-assistant" component={OnboardingAssistant} />
              <Route path="/company-onboarding-overview" component={CompanyOnboardingOverview} />
              <Route path="/design-studio" component={DesignStudio} />
              <Route path="/ai-scenario-creator" component={AIScenarioCreator} />
              <Route path="/canvas" component={CanvasPage} />
              <Route path="/playbooks" component={MemoryBooks} />
              <Route path="/agent-history" component={AgentHistory} />
              <Route path="/agent-monitoring" component={AgentMonitoring} />
              <Route path="/functional-map" component={FunctionalMap} />
              <Route path="/analytics-new" component={AnalyticsNew} />
              
              {/* Data Management Routes */}
              <Route path="/data-import" component={DataImport} />
              <Route path="/data-import-clean" component={DataImportClean} />
              <Route path="/data-import-simple" component={DataImportSimple} />
              <Route path="/erp-import" component={ERPImport} />
              <Route path="/master-data" component={MasterDataManagement} />
              <Route path="/planning-area-management" component={PlanningAreaManagement} />
              <Route path="/resource-planning-assignment" component={ResourcePlanningAssignment} />
              <Route path="/resource-deployment-order" component={ResourceDeploymentOrder} />
              <Route path="/database-explorer" component={DatabaseExplorer} />
              <Route path="/data-schema" component={DataSchema} />
              <Route path="/table-field-viewer" component={TableFieldViewer} />
              <Route path="/data-relationships" component={DataRelationships} />
              <Route path="/data-map" component={DataMap} />
              <Route path="/data-validation" component={DataValidation} />
              <Route path="/routing-intelligence" component={RoutingIntelligence} />
              
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
              <Route path="/guided-tour" component={GuidedTourPage} />
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
              <Route path="/fpa-dashboard">
                <ProtectedRoute feature="fpa" action="view">
                  <FPADashboard />
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
              
              {/* Continuous Improvement Center */}
              <Route path="/continuous-improvement">
                <ProtectedRoute feature="continuous-improvement" action="view">
                  <ContinuousImprovement />
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
              <Route path="/llm-settings" component={LLMSettings} />
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

              
              {/* Default Route - Home page */}
              <Route path="/">
                <HomePage />
              </Route>
              
              {/* Catch all route - redirect to dashboard */}
              {/* Temporarily disabled to debug routing issue
              <Route>
                {() => {
                  if (typeof window !== 'undefined') {
                    window.location.replace('/dashboard');
                  }
                  return null;
                }}
              </Route>
              */}
            </Switch>
          </Suspense>
        </OnboardingGate>
      </SplitScreenLayout>
    </>
  );

  return (
    <AuthAdapterProvider>
      <ThemeAdapterProvider>
        <TooltipProvider>
          <AgentAdapterProvider>
            <NavigationAdapterProvider>
              {isMobile ? (
                <MobileLayout key="app-layout">{appContent}</MobileLayout>
              ) : (
                <DesktopLayout key="app-layout">{appContent}</DesktopLayout>
              )}
            </NavigationAdapterProvider>
          </AgentAdapterProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeAdapterProvider>
    </AuthAdapterProvider>
  );
}
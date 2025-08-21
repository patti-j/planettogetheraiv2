import { Route, Switch } from "wouter";
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
import ForkliftDriver from "@/pages/forklift-driver";
import EmailSettings from "@/pages/email-settings";
import Settings from "@/pages/settings";
import LaborPlanning from "@/pages/labor-planning";
import EnterpriseMap from "@/pages/enterprise-map";
import DemoPage from "@/pages/demo";
import Onboarding from "@/pages/onboarding";
import OptimizationStudio from "@/pages/optimization-studio";
import CapacityPlanning from "@/pages/capacity-planning";
import BusinessGoals from "@/pages/business-goals";
import ProductionScheduleSimple from "@/pages/production-schedule-simple";

// Import other application-specific components
import { useAuth } from "@/hooks/useAuth";
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

  if (!isAuthenticated) {
    // Redirect to website login
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
              <Route path="/demo" component={DemoPage} />
              <Route path="/onboarding" component={Onboarding} />

              {/* Main Dashboard */}
              <Route path="/dashboard" component={SmartHomeWrapper} />

              {/* Analytics & Reports */}
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
              <Route path="/business-goals">
                <ProtectedRoute feature="business_goals" action="view">
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
                <ProtectedRoute feature="scheduling" action="view">
                  <OptimizationStudio />
                </ProtectedRoute>
              </Route>
              <Route path="/production-schedule-simple">
                <ProtectedRoute feature="scheduling" action="view">
                  <ProductionScheduleSimple />
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
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Website Components
import WebsiteHeader from "@/components/website/WebsiteHeader";
import WebsiteFooter from "@/components/website/WebsiteFooter";

// Website Pages
import MarketingHome from "@/pages/marketing-home";
import MarketingLandingPage from "@/pages/marketing-landing";
import Pricing from "@/pages/pricing";
import Login from "@/pages/Login";
import WhatsComing from "@/pages/whats-coming-v14";
import SolutionsComparison from "@/pages/solutions-comparison";
import TechnologyStack from "@/pages/technology-stack";
// // // // import DemoTour from "@/pages/demo-tour"; // Temporarily commented out - page doesn't exist // Removed - file doesn't exist // Commented out - file doesn't exist // Component doesn't exist yet
import PresentationPage from "@/pages/presentation";
import ClearStorage from "@/pages/clear-storage";

// Feature Detail Pages
import AiFeaturesPage from "@/pages/ai-features";
import ProductionSchedulingPage from "@/pages/production-scheduling";
import SupplyChainMarketingPage from "@/pages/supply-chain-marketing";
import TheoryOfConstraintsPage from "@/pages/theory-of-constraints";
import EnterpriseScalabilityPage from "@/pages/enterprise-scalability";
import SecurityFeaturesPage from "@/pages/security-features";
import IntegrationApiPage from "@/pages/integration-api";
import AnalyticsReportingPage from "@/pages/analytics-reporting";
import InvestorRelationsPage from "@/pages/investor-relations";

// Layout wrapper for website pages
const WebsiteLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col pt-safe">
    <WebsiteHeader />
    <main className="flex-1">
      {children}
    </main>
    <WebsiteFooter />
  </div>
);

// Special pages that don't use the standard layout
const SpecialLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gray-50">
    {children}
  </div>
);

export default function WebsiteApp() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Switch>
          {/* Clear storage page - special layout */}
          <Route path="/clear-storage">
            <SpecialLayout>
              <ClearStorage />
            </SpecialLayout>
          </Route>
          
          {/* Login page - with website header/footer */}
          <Route path="/login">
            <WebsiteLayout>
              <Login />
            </WebsiteLayout>
          </Route>
          
          {/* Presentation page - special layout */}
          <Route path="/presentation">
            <SpecialLayout>
              <PresentationPage />
            </SpecialLayout>
          </Route>

          {/* Standard website pages with header/footer */}
          <Route path="/pricing">
            <WebsiteLayout>
              <Pricing />
            </WebsiteLayout>
          </Route>
          
          <Route path="/solutions-comparison">
            <WebsiteLayout>
              <SolutionsComparison />
            </WebsiteLayout>
          </Route>
          
          <Route path="/whats-coming">
            <WebsiteLayout>
              <WhatsComing />
            </WebsiteLayout>
          </Route>
          
          <Route path="/technology-stack">
            <WebsiteLayout>
              <TechnologyStack />
            </WebsiteLayout>
          </Route>
          
          {/* Feature Detail Pages */}
          <Route path="/ai-features">
            <WebsiteLayout>
              <AiFeaturesPage />
            </WebsiteLayout>
          </Route>
          
          <Route path="/production-scheduling">
            <WebsiteLayout>
              <ProductionSchedulingPage />
            </WebsiteLayout>
          </Route>
          
          <Route path="/supply-chain">
            <WebsiteLayout>
              <SupplyChainMarketingPage />
            </WebsiteLayout>
          </Route>
          
          <Route path="/theory-of-constraints">
            <WebsiteLayout>
              <TheoryOfConstraintsPage />
            </WebsiteLayout>
          </Route>
          
          <Route path="/enterprise-scalability">
            <WebsiteLayout>
              <EnterpriseScalabilityPage />
            </WebsiteLayout>
          </Route>
          
          <Route path="/security-features">
            <WebsiteLayout>
              <SecurityFeaturesPage />
            </WebsiteLayout>
          </Route>
          
          <Route path="/integration-api">
            <WebsiteLayout>
              <IntegrationApiPage />
            </WebsiteLayout>
          </Route>
          
          <Route path="/analytics-reporting">
            <WebsiteLayout>
              <AnalyticsReportingPage />
            </WebsiteLayout>
          </Route>
          
          <Route path="/investors">
            <WebsiteLayout>
              <InvestorRelationsPage />
            </WebsiteLayout>
          </Route>
          
          {/* Demo tour route removed - component doesn't exist yet */}
          
          <Route path="/marketing">
            <WebsiteLayout>
              <MarketingLandingPage />
            </WebsiteLayout>
          </Route>
          
          <Route path="/home">
            <WebsiteLayout>
              <MarketingHome />
            </WebsiteLayout>
          </Route>
          
          <Route path="/">
            {() => {
              // Redirect root path to login page
              window.location.href = '/login';
              return null;
            }}
          </Route>
          
          {/* Default fallback */}
          <Route>
            <WebsiteLayout>
              <MarketingHome />
            </WebsiteLayout>
          </Route>
        </Switch>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Suspense, lazy } from "react";

// Website Components
import WebsiteHeader from "@/components/website/WebsiteHeader";
import WebsiteFooter from "@/components/website/WebsiteFooter";

// Lazy-loaded Website Pages
const MarketingHome = lazy(() => import("@/pages/marketing-home"));
const Pricing = lazy(() => import("@/pages/pricing"));
const Login = lazy(() => import("@/pages/Login"));
const WhatsComing = lazy(() => import("@/pages/whats-coming-v14"));
const SolutionsComparison = lazy(() => import("@/pages/solutions-comparison"));
const TechnologyStack = lazy(() => import("@/pages/technology-stack"));
const PresentationPage = lazy(() => import("@/pages/presentation"));
const ClearStorage = lazy(() => import("@/pages/clear-storage"));

// Lazy-loaded Feature Detail Pages
const AiFeaturesPage = lazy(() => import("@/pages/ai-features"));
const SupplyChainMarketingPage = lazy(() => import("@/pages/supply-chain-marketing"));
const TheoryOfConstraintsPage = lazy(() => import("@/pages/theory-of-constraints"));
const EnterpriseScalabilityPage = lazy(() => import("@/pages/enterprise-scalability"));
const SecurityFeaturesPage = lazy(() => import("@/pages/security-features"));
const IntegrationApiPage = lazy(() => import("@/pages/integration-api"));
const InvestorRelationsPage = lazy(() => import("@/pages/investor-relations"));
const DevelopmentRoadmap = lazy(() => import("@/pages/development-roadmap"));
const AnalyticsReportingPage = lazy(() => import("@/pages/analytics-reporting"));

// Loading component for page transitions
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading page...</p>
    </div>
  </div>
);

// Layout wrapper for website pages
const WebsiteLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col pt-safe">
    <WebsiteHeader />
    <main className="flex-1">
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </main>
    <WebsiteFooter />
  </div>
);

// Special pages that don't use the standard layout
const SpecialLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gray-50">
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
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
          
          <Route path="/investors">
            <WebsiteLayout>
              <InvestorRelationsPage />
            </WebsiteLayout>
          </Route>
          
          <Route path="/analytics-reporting">
            <WebsiteLayout>
              <AnalyticsReportingPage />
            </WebsiteLayout>
          </Route>
          
          <Route path="/roadmap">
            <WebsiteLayout>
              <DevelopmentRoadmap />
            </WebsiteLayout>
          </Route>
          
          {/* Demo tour route removed - component doesn't exist yet */}
          
          {/* /marketing redirects to /home */}
          <Route path="/marketing">
            <WebsiteLayout>
              <MarketingHome />
            </WebsiteLayout>
          </Route>
          
          <Route path="/home">
            <WebsiteLayout>
              <MarketingHome />
            </WebsiteLayout>
          </Route>
          
          <Route path="/">
            <WebsiteLayout>
              <MarketingHome />
            </WebsiteLayout>
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
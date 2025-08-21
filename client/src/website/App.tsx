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
import WhatsComing from "@/pages/whats-coming-v13";
import SolutionsComparison from "@/pages/solutions-comparison";
import DemoTour from "@/pages/demo-tour";
import PresentationPage from "@/pages/presentation";
import ClearStorage from "@/pages/clear-storage";

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
          
          <Route path="/demo-tour">
            <WebsiteLayout>
              <DemoTour />
            </WebsiteLayout>
          </Route>
          
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
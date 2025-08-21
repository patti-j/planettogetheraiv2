import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Website Pages
import MarketingHome from "@/pages/marketing-home";
import MarketingLandingPage from "@/pages/marketing-landing";
import Pricing from "@/pages/pricing";
import Login from "@/pages/Login";
import WhatsComing from "@/pages/whats-coming-v13";
import SolutionsComparison from "@/pages/solutions-comparison";
import DemoTour from "@/pages/demo-tour";
import PresentationPage from "@/pages/presentation";

export default function WebsiteApp() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <Switch>
            {/* Public Website Pages */}
            <Route path="/pricing" component={Pricing} />
            <Route path="/solutions-comparison" component={SolutionsComparison} />
            <Route path="/whats-coming" component={WhatsComing} />
            <Route path="/demo-tour" component={DemoTour} />
            <Route path="/presentation" component={PresentationPage} />
            <Route path="/marketing" component={MarketingLandingPage} />
            <Route path="/login" component={Login} />
            <Route path="/home" component={MarketingHome} />
            <Route path="/" component={MarketingHome} />
            
            {/* Default fallback */}
            <Route component={MarketingHome} />
          </Switch>
        </div>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
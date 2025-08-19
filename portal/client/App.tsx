import React, { useState, useEffect } from 'react';
import { Router, Route, Switch, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SupplierPortal from './pages/SupplierPortal';
import CustomerPortal from './pages/CustomerPortal';
import OEMPortal from './pages/OEMPortal';
import AIOnboarding from './pages/AIOnboarding';
import Profile from './pages/Profile';

// Components
import PortalLayout from './components/PortalLayout';
import AIAssistant from './components/AIAssistant';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function PortalRouter() {
  const { user, company, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect based on authentication and onboarding status
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/portal/login" component={Login} />
        <Route path="/portal/register" component={Register} />
        <Route path="/portal/*">
          <Redirect to="/portal/login" />
        </Route>
      </Switch>
    );
  }

  // Check if onboarding is needed
  if (company && !company.aiOnboardingComplete) {
    return (
      <Switch>
        <Route path="/portal/onboarding" component={AIOnboarding} />
        <Route path="/portal/*">
          <Redirect to="/portal/onboarding" />
        </Route>
      </Switch>
    );
  }

  // Route to appropriate portal based on company type
  return (
    <PortalLayout>
      <Switch>
        <Route path="/portal/dashboard" component={Dashboard} />
        <Route path="/portal/profile" component={Profile} />
        
        {/* Company type specific routes */}
        {company?.type === 'supplier' && (
          <>
            <Route path="/portal/supplier/*" component={SupplierPortal} />
            <Route path="/portal">
              <Redirect to="/portal/supplier/dashboard" />
            </Route>
          </>
        )}
        
        {company?.type === 'customer' && (
          <>
            <Route path="/portal/customer/*" component={CustomerPortal} />
            <Route path="/portal">
              <Redirect to="/portal/customer/dashboard" />
            </Route>
          </>
        )}
        
        {company?.type === 'oem' && (
          <>
            <Route path="/portal/oem/*" component={OEMPortal} />
            <Route path="/portal">
              <Redirect to="/portal/oem/dashboard" />
            </Route>
          </>
        )}
        
        <Route>
          <Redirect to="/portal/dashboard" />
        </Route>
      </Switch>
      
      {/* AI Assistant available on all pages */}
      <AIAssistant />
    </PortalLayout>
  );
}

export default function PortalApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="portal-theme">
        <AuthProvider>
          <Router base="/portal">
            <PortalRouter />
          </Router>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
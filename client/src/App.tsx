import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TourProvider } from "@/contexts/TourContext";
import { MaxDockProvider } from "@/contexts/MaxDockContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { FullScreenProvider } from "@/contexts/FullScreenContext";
import { LayoutDensityProvider } from "@/contexts/LayoutDensityContext";
import { ViewModeProvider } from "@/hooks/use-view-mode";
import { Switch, Route } from "wouter";

// Separate Apps
import WebsiteApp from "./website/App";
import ApplicationApp from "./application/App";
import PortalLogin from "@/pages/portal-login";
import PortalDashboard from "@/pages/portal-dashboard";
import Patti from "@/pages/Patti";
import Patti2 from "@/pages/patti2";
import Patti3 from "@/pages/patti3";
import BasicScheduler from "@/pages/basic-scheduler";
import SchedulerDemo from "@/pages/scheduler-demo";
import SchedulerTest from "@/pages/scheduler-test";

// Check authentication status
function useAuthStatus() {
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const publicPaths = ['/login', '/home', '/', '/portal/login', '/marketing', '/pricing', '/demo-tour', '/solutions-comparison', '/whats-coming'];
  const isPublicPath = publicPaths.includes(currentPath);
  
  // Check if token exists
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('authToken');
  
  // For public paths, always show website regardless of token
  // For other paths, check authentication
  const [isAuthenticated, setIsAuthenticated] = useState(isPublicPath ? false : hasToken);
  const [isLoading, setIsLoading] = useState(isPublicPath ? false : hasToken); // Only load if we need to verify token

  useEffect(() => {
    // Skip auth check entirely for public pages
    if (isPublicPath) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }
    
    const checkAuth = async () => {
      // Check if we're in the middle of logout
      if ((window as any).__LOGOUT_IN_PROGRESS__) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      const token = localStorage.getItem('authToken');
      
      // No token = not authenticated, no need to check
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      // We have a token, verify it's valid
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.status === 401) {
          // Token is blacklisted or invalid, clear it completely
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('isDemo');
          setIsAuthenticated(false);
        } else if (response.ok) {
          const userData = await response.json();
          localStorage.setItem('user', JSON.stringify(userData));
          setIsAuthenticated(true);
        } else {
          // Only clear token for actual auth failures, not network issues
          if (response.status >= 400 && response.status < 500) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // Don't clear token on network errors
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Only check auth for non-public pages
    checkAuth();

    // Listen for storage changes (including logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      console.log("Storage change detected:", e.key);
      if (e.key === 'authToken') {
        checkAuth();
      }
    };

    // Listen for custom logout events
    const handleLogout = () => {
      console.log("Logout event detected");
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('logout', handleLogout);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('logout', handleLogout);
    };
  }, [isPublicPath]);

  return { isAuthenticated, isLoading };
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuthStatus();
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const publicPaths = ['/login', '/home', '/portal/login', '/marketing', '/pricing', '/demo-tour', '/solutions-comparison', '/whats-coming', '/clear-storage', '/patti', '/patti2', '/patti3', '/basic-scheduler', '/scheduler-demo', '/scheduler-test'];
  const isPublicPath = publicPaths.includes(currentPath);
  
  // Check if user has a token
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('authToken');
  
  // If on root path and not authenticated, redirect to login
  if (currentPath === '/' && !hasToken && !isLoading) {
    window.location.href = '/login';
    return null;
  }
  
  // For dashboard and mobile-home, wait for auth check to complete
  if ((currentPath === '/dashboard' || currentPath === '/mobile-home') && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Determine if we should show website or app
  const shouldShowWebsite = (isPublicPath && currentPath !== '/') || (!hasToken && !isLoading);

  // Show loading screen only when actually verifying a token
  if (isLoading && !isPublicPath) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <DndProvider backend={HTML5Backend}>
        <TourProvider>
          <MaxDockProvider>
            <NavigationProvider>
              <FullScreenProvider>
                <LayoutDensityProvider>
                  <ViewModeProvider>
                    {/* Standalone Routes */}
                    {currentPath === '/patti' ? (
                      <Patti />
                    ) : currentPath === '/patti2' ? (
                      <Patti2 />
                    ) : currentPath === '/patti3' ? (
                      <Patti3 />
                    ) : currentPath === '/basic-scheduler' ? (
                      <BasicScheduler />
                    ) : currentPath === '/scheduler-demo' ? (
                      <SchedulerDemo />
                    ) : currentPath === '/scheduler-test' ? (
                      <SchedulerTest />
                    ) : /* Portal Routes - Always accessible */
                    currentPath.startsWith('/portal/') ? (
                      <div className="fixed inset-0 z-[9999] overflow-auto">
                        <Switch>
                          <Route path="/portal/login" component={PortalLogin} />
                          <Route path="/portal/dashboard" component={PortalDashboard} />
                          <Route path="/portal" component={PortalLogin} />
                        </Switch>
                      </div>
                    ) : shouldShowWebsite ? (
                      // Show website for public paths or when not authenticated
                      <WebsiteApp />
                    ) : (
                      // Authenticated users on non-public paths see the Application
                      <ApplicationApp />
                    )}
                  </ViewModeProvider>
                </LayoutDensityProvider>
              </FullScreenProvider>
            </NavigationProvider>
          </MaxDockProvider>
        </TourProvider>
      </DndProvider>
    </QueryClientProvider>
  );
}
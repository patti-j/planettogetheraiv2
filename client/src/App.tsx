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
import PortalPurchaseOrders from "@/pages/portal-purchase-orders";
import PortalDeliveries from "@/pages/portal-deliveries";
import PortalInventory from "@/pages/portal-inventory";
import IntegrationsPage from "@/pages/integrations";
import AIScenarioCreator from "@/pages/ai-scenario-creator";

// Check authentication status
function useAuthStatus() {
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const publicPaths = ['/login', '/home', '/portal/login', '/marketing', '/pricing', '/solutions-comparison', '/whats-coming', '/technology-stack', '/demo-tour', '/presentation', '/production-scheduler-js', '/production-scheduler-js.html'];
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
  const publicPaths = ['/login', '/home', '/portal/login', '/marketing', '/pricing', '/solutions-comparison', '/whats-coming', '/clear-storage', '/production-scheduler-js', '/production-scheduler-js.html', '/technology-stack', '/demo-tour', '/presentation'];
  const isPublicPath = publicPaths.includes(currentPath);
  
  // Check if this is a portal route - handle separately from main app
  const isPortalRoute = currentPath.startsWith('/portal');
  
  // Check if user has a token for the main app
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('authToken');
  
  // If on root path and not authenticated, show website (don't redirect)
  // Authenticated users at root path will see the ApplicationApp
  
  // For dashboard and mobile-home, wait for auth check to complete
  if ((currentPath === '/dashboard' || currentPath === '/mobile-home') && isLoading && !isPortalRoute) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Determine if we should show website or app (but not for portal routes)
  const shouldShowWebsite = !isPortalRoute && (
    // Show website for public paths OR when not authenticated
    isPublicPath || (!hasToken && !isLoading)
  );

  // Show loading screen only when actually verifying a token (but not for portal routes)
  if (isLoading && !isPublicPath && !isPortalRoute) {
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
                    {/* Portal Routes - Always accessible, independent of main app auth */}
                    {isPortalRoute ? (
                      <div className="fixed inset-0 z-[9999] overflow-auto">
                        <Switch>
                          <Route path="/portal/login" component={PortalLogin} />
                          <Route path="/portal/dashboard" component={PortalDashboard} />
                          <Route path="/portal/purchase-orders" component={PortalPurchaseOrders} />
                          <Route path="/portal/deliveries" component={PortalDeliveries} />
                          <Route path="/portal/inventory" component={PortalInventory} />
                          <Route path="/portal">
                            {() => {
                              // Redirect /portal to /portal/login
                              window.location.href = '/portal/login';
                              return null;
                            }}
                          </Route>
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
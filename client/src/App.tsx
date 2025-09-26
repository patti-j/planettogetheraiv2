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
import { SplitScreenProvider } from "@/contexts/SplitScreenContext";
import { Switch, Route, useLocation } from "wouter";
import { runTestsInDevelopment } from "./lib/federation-test-harness";
// FederationTestStatus removed - not needed

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
  const [currentPath] = useLocation();
  const publicPaths = ['/', '/login', '/portal/login', '/marketing', '/pricing', '/solutions-comparison', '/whats-coming', '/technology-stack', '/demo-tour', '/presentation'];
  const isPublicPath = publicPaths.includes(currentPath);
  
  // For session-based authentication, we need to check the server
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(!isPublicPath); // Only load for protected paths

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
      
      // Development mode auto-authentication - bypass login requirement
      const isDev = import.meta.env.MODE === 'development';
      if (isDev) {
        console.log('🔧 [App.tsx] Development mode: Auto-authenticating user');
        
        // Check if we already have a token
        const existingToken = localStorage.getItem('auth_token');
        if (existingToken) {
          // Verify the existing token is still valid
          try {
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${existingToken}`
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              localStorage.setItem('user', JSON.stringify(userData));
              setIsAuthenticated(true);
              setIsLoading(false);
              return;
            }
            // Token is invalid, remove it
            localStorage.removeItem('auth_token');
          } catch (error) {
            console.error('Error validating existing dev token:', error);
            localStorage.removeItem('auth_token');
          }
        }
        
        // Fetch a new development token
        try {
          console.log('🔧 Fetching development authentication token...');
          const response = await fetch('/api/auth/dev-token');
          
          if (response.ok) {
            const data = await response.json();
            
            // Store the token and user data
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            console.log('🔧 Development token stored successfully');
            setIsAuthenticated(true);
          } else {
            console.error('Failed to get development token');
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error fetching development token:', error);
          setIsAuthenticated(false);
        }
        
        setIsLoading(false);
        return;
      }
      
      // Check token-based authentication
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.status === 401) {
          // Token invalid/expired - clear it
          localStorage.removeItem('auth_token');
          setIsAuthenticated(false);
        } else if (response.ok) {
          const userData = await response.json();
          localStorage.setItem('user', JSON.stringify(userData));
          setIsAuthenticated(true);
        } else {
          // Authentication failed
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

    // Listen for custom logout events
    const handleLogout = () => {
      console.log("Logout event detected");
      checkAuth();
    };

    window.addEventListener('logout', handleLogout);

    return () => {
      window.removeEventListener('logout', handleLogout);
    };
  }, [isPublicPath, currentPath]);

  return { isAuthenticated, isLoading };
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuthStatus();
  const [currentPath] = useLocation();
  const publicPaths = ['/', '/login', '/portal/login', '/marketing', '/pricing', '/solutions-comparison', '/whats-coming', '/clear-storage', '/technology-stack', '/demo-tour', '/presentation'];
  const isPublicPath = publicPaths.includes(currentPath);
  
  // Check if this is a portal route - handle separately from main app
  const isPortalRoute = currentPath.startsWith('/portal');
  
  // Federation tests disabled to prevent AI functionality interference
  // useEffect(() => {
  //   if (import.meta.env.DEV) {
  //     runTestsInDevelopment();
  //   }
  // }, []);
  
  // Handle redirect for unauthenticated users trying to access protected routes
  useEffect(() => {
    // In development mode, always let ApplicationApp handle its own authentication
    const isDev = import.meta.env.MODE === 'development';
    if (isDev) {
      return; // Skip redirect logic in development
    }
    
    if (!isPortalRoute && !isPublicPath && !isAuthenticated && !isLoading) {
      // User is trying to access a protected route without authentication
      // Redirect to login page
      window.location.href = '/login';
    }
  }, [isPortalRoute, isPublicPath, isAuthenticated, isLoading, currentPath]);
  
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
  // Only show website for actual public paths, not for protected routes
  // In development mode, prefer ApplicationApp for non-public paths regardless of auth status
  const isDev = import.meta.env.MODE === 'development';
  const shouldShowWebsite = !isPortalRoute && isPublicPath;
  const shouldShowApplication = !isPortalRoute && !isPublicPath && (isDev || isAuthenticated);
  


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
                  <SplitScreenProvider>
                    <ViewModeProvider>
                    {/* Federation test status removed - not needed */}
                    
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
                      // Show website for public paths only
                      <WebsiteApp />
                    ) : shouldShowApplication ? (
                      // Show application for protected routes (dev mode or authenticated users)
                      <ApplicationApp />
                    ) : (
                      // Fallback: redirect to login
                      <>
                        {(() => {
                          window.location.href = '/login';
                          return null;
                        })()}
                      </>
                    )}
                    </ViewModeProvider>
                  </SplitScreenProvider>
                </LayoutDensityProvider>
              </FullScreenProvider>
            </NavigationProvider>
          </MaxDockProvider>
        </TourProvider>
      </DndProvider>
    </QueryClientProvider>
  );
}
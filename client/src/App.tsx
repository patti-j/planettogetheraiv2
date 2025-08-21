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

// Check authentication status
function useAuthStatus() {
  // Optimized initial state based on token presence
  const tokenExists = typeof window !== 'undefined' && !!localStorage.getItem('authToken');
  const [isAuthenticated, setIsAuthenticated] = useState(tokenExists);
  const [isLoading, setIsLoading] = useState(tokenExists); // Only load if we need to verify token

  useEffect(() => {
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
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
        } else if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Immediate check for public pages, no delay needed
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
  }, []);

  return { isAuthenticated, isLoading };
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuthStatus();
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  // Show loading screen only when actually verifying a token
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

  return (
    <QueryClientProvider client={queryClient}>
      <DndProvider backend={HTML5Backend}>
        <TourProvider>
          <MaxDockProvider>
            <NavigationProvider>
              <FullScreenProvider>
                <LayoutDensityProvider>
                  <ViewModeProvider>
                    {/* Portal Routes - Always accessible */}
                    {currentPath.startsWith('/portal/') ? (
                      <div className="fixed inset-0 z-[9999] overflow-auto">
                        <Switch>
                          <Route path="/portal/login" component={PortalLogin} />
                          <Route path="/portal/dashboard" component={PortalDashboard} />
                          <Route path="/portal" component={PortalLogin} />
                        </Switch>
                      </div>
                    ) : isAuthenticated ? (
                      // Authenticated users see the Application
                      <ApplicationApp />
                    ) : (
                      // Unauthenticated users see the Website
                      <WebsiteApp />
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
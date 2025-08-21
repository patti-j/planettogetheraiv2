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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      console.log("=== CHECKING AUTH STATUS ===");
      const token = localStorage.getItem('authToken');
      console.log("Token found:", !!token, token);
      setIsAuthenticated(!!token);
      setIsLoading(false);
      console.log("Auth status set:", !!token, "Loading:", false);
    };

    // Initial check with slight delay to ensure localStorage is accessible
    setTimeout(() => {
      checkAuth();
    }, 10);

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

  // Show loading screen
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
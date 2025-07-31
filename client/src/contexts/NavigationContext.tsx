import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

interface RecentPage {
  path: string;
  label: string;
  icon?: string;
  timestamp: number;
  isPinned?: boolean;
}

interface NavigationContextType {
  recentPages: RecentPage[];
  addRecentPage: (path: string, label: string, icon?: string) => void;
  clearRecentPages: () => void;
  togglePinPage: (path: string) => void;
  lastVisitedRoute: string | null;
  setLastVisitedRoute: (route: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const MAX_RECENT_PAGES = 6;

// Page mapping for labels and icons
const pageMapping: Record<string, { label: string; icon: string }> = {
  '/': { label: 'Dashboard', icon: 'BarChart3' },
  '/production-schedule': { label: 'Production Schedule', icon: 'BarChart3' },
  '/cockpit': { label: 'Cockpit', icon: 'Monitor' },
  '/boards': { label: 'Boards', icon: 'Columns3' },
  '/analytics': { label: 'Analytics', icon: 'BarChart3' },
  '/reports': { label: 'Reports', icon: 'FileText' },
  '/capacity-planning': { label: 'Capacity Planning', icon: 'Briefcase' },
  '/production-planning': { label: 'Production Planning', icon: 'Target' },
  '/shift-management': { label: 'Shift Management', icon: 'Clock' },
  '/optimization-studio': { label: 'Optimization Studio', icon: 'Sparkles' },
  '/demand-forecasting': { label: 'Demand Forecasting', icon: 'Brain' },
  '/inventory-optimization': { label: 'Inventory Optimization', icon: 'Package' },
  '/shop-floor': { label: 'Shop Floor', icon: 'Factory' },
  '/operator-dashboard': { label: 'Operator Dashboard', icon: 'Settings' },
  '/forklift-driver': { label: 'Forklift Driver', icon: 'Truck' },
  '/maintenance': { label: 'Maintenance', icon: 'Wrench' },
  '/disruption-management': { label: 'Disruption Management', icon: 'AlertTriangle' },

  '/business-goals': { label: 'Business Goals', icon: 'TrendingUp' },
  '/systems-management-dashboard': { label: 'Systems Management', icon: 'Server' },
  '/systems-integration': { label: 'System Integration', icon: 'Database' },
  '/user-access-management': { label: 'User & Access Management', icon: 'Shield' },
  '/extension-studio': { label: 'Extension Studio', icon: 'Code' },
  '/industry-templates': { label: 'Industry Templates', icon: 'Building' },
  '/error-logs': { label: 'Logs', icon: 'FileX' },
  '/visual-factory': { label: 'Visual Factory', icon: 'Eye' },
  '/chat': { label: 'Chat', icon: 'MessageSquare' },
  '/feedback': { label: 'Feedback', icon: 'MessageCircle' },
  '/onboarding': { label: 'Getting Started', icon: 'BookOpen' },
  '/training': { label: 'Training', icon: 'GraduationCap' },
  '/presentation-system': { label: 'Presentation System', icon: 'Presentation' },
  '/data-import': { label: 'Master Data Setup', icon: 'Database' },
  '/data-validation': { label: 'Data Validation', icon: 'Shield' },
  '/data-schema': { label: 'Data Schema View', icon: 'Database' },
  '/data-relationships': { label: 'Data Relationships', icon: 'Database' },
  '/data-map': { label: 'Data Relationship Map', icon: 'Network' },
  '/table-field-viewer': { label: 'Table Field Documentation', icon: 'FileText' },
  '/constraints': { label: 'Constraints Management', icon: 'AlertTriangle' },
  '/widgets': { label: 'Widgets', icon: 'Grid' },
  '/dashboards': { label: 'Dashboards', icon: 'Layout' },
  '/billing': { label: 'Billing & Usage', icon: 'CreditCard' },
  '/account': { label: 'Account Settings', icon: 'Settings' },
  '#max': { label: 'Max AI Assistant', icon: 'Bot' }
};

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);
  const [lastVisitedRoute, setLastVisitedRouteState] = useState<string | null>(null);
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  // Throttling state to prevent infinite loops
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);
  const [pendingSave, setPendingSave] = useState<RecentPage[] | null>(null);

  // Check onboarding status to determine if Getting Started should be auto-pinned
  const { data: onboardingStatus } = useQuery({
    queryKey: ['/api/onboarding/status'],
    enabled: !!user
  });

  // Helper function to check if onboarding is complete
  const isOnboardingComplete = () => {
    return onboardingStatus && typeof onboardingStatus === 'object' && 'isCompleted' in onboardingStatus ? onboardingStatus.isCompleted === true : false;
  };

  // Helper function to ensure Getting Started is auto-pinned when needed
  const ensureGettingStartedPinned = (pages: RecentPage[]) => {
    if (isOnboardingComplete()) {
      // If onboarding is complete, don't force pin Getting Started
      return pages;
    }

    // Find Getting Started page
    const gettingStartedIndex = pages.findIndex(page => page.path === '/onboarding');
    
    if (gettingStartedIndex === -1) {
      // Getting Started not in recent pages - add it as pinned at the front
      const gettingStartedPage = {
        path: '/onboarding',
        label: 'Getting Started',
        icon: 'BookOpen',
        timestamp: Date.now(),
        isPinned: true
      };
      return [gettingStartedPage, ...pages.slice(0, MAX_RECENT_PAGES - 1)];
    }
    
    // If Getting Started exists, just make sure it's in the list - don't force pin
    return pages;
  };

  // Helper function to replace old routes with new ones
  const replaceOldRoutes = (pages: RecentPage[]): RecentPage[] => {
    return pages.map(page => {
      // Replace old role-management route with new user-access-management route
      if (page.path === '/role-management') {
        return {
          ...page,
          path: '/user-access-management',
          label: pageMapping['/user-access-management']?.label || 'User & Access Management',
          icon: pageMapping['/user-access-management']?.icon || 'Shield'
        };
      }
      return page;
    });
  };

  // Load recent pages from user preferences (database only) - FIXED to prevent infinite loop
  useEffect(() => {
    const loadRecentPages = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const response = await apiRequest('GET', `/api/user-preferences/${user.id}`);
          const preferences = await response.json();
          const savedRecentPages = preferences?.dashboardLayout?.recentPages || [];
          
          // DISABLED: Load last visited route to prevent automatic navigation to stored routes
          const savedLastVisitedRoute = preferences?.dashboardLayout?.lastVisitedRoute;
          console.log('NavigationContext - Saved last visited route (not applying):', savedLastVisitedRoute);
          // Commented out to prevent automatic navigation
          // if (savedLastVisitedRoute) {
          //   setLastVisitedRouteState(savedLastVisitedRoute);
          // }
          
          // If no recent pages exist, initialize with default pinned "Getting Started"
          if (!Array.isArray(savedRecentPages) || savedRecentPages.length === 0) {
            const defaultRecentPages = [{
              path: '/onboarding',
              label: 'Getting Started',
              icon: 'BookOpen',
              timestamp: Date.now(),
              isPinned: true
            }];
            const processedPages = ensureGettingStartedPinned(defaultRecentPages);
            setRecentPages(processedPages);
            // Only save if we're creating defaults for the first time
            if (savedRecentPages.length === 0) {
              saveRecentPages(processedPages);
            }
          } else {
            // First replace old routes, then ensure Getting Started is pinned
            const updatedRoutes = replaceOldRoutes(savedRecentPages);
            const processedPages = ensureGettingStartedPinned(updatedRoutes.slice(0, MAX_RECENT_PAGES));
            setRecentPages(processedPages);
            // Only save if auto-pinning or route replacement changed something
            if (JSON.stringify(processedPages) !== JSON.stringify(savedRecentPages.slice(0, MAX_RECENT_PAGES))) {
              saveRecentPages(processedPages);
            }
          }
        } catch (error) {
          console.warn('Failed to load recent pages from database:', error);
          // Initialize with default pinned "Getting Started" on error
          const defaultRecentPages = [{
            path: '/onboarding',
            label: 'Getting Started',
            icon: 'BookOpen',
            timestamp: Date.now(),
            isPinned: true
          }];
          const processedPages = ensureGettingStartedPinned(defaultRecentPages);
          setRecentPages(processedPages);
        }
      } else {
        // Not authenticated, clear recent pages
        setRecentPages([]);
      }
    };

    loadRecentPages();
  }, [isAuthenticated, user?.id]);

  // DISABLED: Re-apply auto-pinning logic when onboarding status changes - was causing infinite loop
  // useEffect(() => {
  //   if (recentPages.length > 0) {
  //     const processedPages = ensureGettingStartedPinned(recentPages);
  //     if (JSON.stringify(processedPages) !== JSON.stringify(recentPages)) {
  //       setRecentPages(processedPages);
  //       saveRecentPages(processedPages);
  //     }
  //   }
  // }, [onboardingStatus && typeof onboardingStatus === 'object' && 'isCompleted' in onboardingStatus ? onboardingStatus.isCompleted : false]);

  // Helper function to generate label from path
  const generateLabelFromPath = (path: string): { label: string; icon: string } => {
    // Remove leading slash and split by hyphens/slashes
    const segments = path.replace(/^\//, '').split(/[-\/]/).filter(Boolean);
    
    // Capitalize each segment and join with spaces
    const label = segments
      .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
    
    // Default icon based on common patterns
    let icon = 'FileText'; // Default icon
    
    if (path.includes('data')) icon = 'Database';
    else if (path.includes('analytics') || path.includes('report')) icon = 'BarChart3';
    else if (path.includes('dashboard') || path.includes('cockpit')) icon = 'Monitor';
    else if (path.includes('schedule') || path.includes('planning')) icon = 'Calendar';
    else if (path.includes('optimization') || path.includes('algorithm')) icon = 'Sparkles';
    else if (path.includes('management') || path.includes('admin')) icon = 'Settings';
    else if (path.includes('production') || path.includes('manufacturing')) icon = 'Factory';
    else if (path.includes('inventory') || path.includes('stock')) icon = 'Package';
    else if (path.includes('maintenance') || path.includes('repair')) icon = 'Wrench';
    else if (path.includes('quality') || path.includes('inspection')) icon = 'Shield';
    else if (path.includes('capacity') || path.includes('resource')) icon = 'Briefcase';
    else if (path.includes('shift') || path.includes('workforce')) icon = 'Clock';
    else if (path.includes('visual') || path.includes('display')) icon = 'Eye';
    else if (path.includes('chat') || path.includes('message')) icon = 'MessageSquare';
    else if (path.includes('training') || path.includes('education')) icon = 'GraduationCap';
    else if (path.includes('business') || path.includes('goals')) icon = 'TrendingUp';
    else if (path.includes('system') || path.includes('integration')) icon = 'Server';
    else if (path.includes('extension') || path.includes('plugin')) icon = 'Code';
    else if (path.includes('template') || path.includes('industry')) icon = 'Building';
    else if (path.includes('feedback') || path.includes('support')) icon = 'MessageCircle';
    else if (path.includes('billing') || path.includes('account')) icon = 'CreditCard';
    
    return { label: label || 'Page', icon };
  };

  // Don't automatically track location changes - only track explicit navigation
  
  // Remove unused trackMenuClick function that was causing TypeScript errors

  const addRecentPage = (path: string, label: string, icon?: string) => {
    // Replace old routes with new ones
    if (path === '/role-management') {
      path = '/user-access-management';
      label = pageMapping['/user-access-management']?.label || 'User & Access Management';
      icon = pageMapping['/user-access-management']?.icon || 'Shield';
    }
    
    setRecentPages(current => {
      // Check if the page already exists in the recent list
      const existingIndex = current.findIndex(page => page.path === path);
      
      if (existingIndex !== -1) {
        // If page already exists, don't change the order - just update timestamp
        const updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          timestamp: Date.now()
        };
        
        // Apply auto-pinning logic and save to user preferences
        const processedUpdated = ensureGettingStartedPinned(updated);
        saveRecentPages(processedUpdated);
        
        return processedUpdated;
      } else {
        // Separate pinned and unpinned pages
        const pinnedPages = current.filter(page => page.isPinned);
        const unpinnedPages = current.filter(page => !page.isPinned);
        
        // New page - add to the unpinned section and limit total to MAX_RECENT_PAGES
        const newPage = { path, label, icon: icon || 'FileText', timestamp: Date.now(), isPinned: false };
        const updatedUnpinned = [newPage, ...unpinnedPages];
        
        // Combine pinned + unpinned, ensuring we don't exceed MAX_RECENT_PAGES
        const updated = [...pinnedPages, ...updatedUnpinned].slice(0, MAX_RECENT_PAGES);

        // Apply auto-pinning logic and save to user preferences
        const processedUpdated = ensureGettingStartedPinned(updated);
        saveRecentPages(processedUpdated);

        return processedUpdated;
      }
    });
  };

  const saveRecentPages = async (pages: RecentPage[]) => {
    if (!isAuthenticated || !user?.id) return;
    
    const now = Date.now();
    const MIN_SAVE_INTERVAL = 2000; // 2 seconds minimum between saves
    
    // If we saved recently, queue this save for later
    if (now - lastSaveTime < MIN_SAVE_INTERVAL) {
      setPendingSave(pages);
      return;
    }
    
    try {
      setLastSaveTime(now);
      
      // First get current preferences to merge
      const response = await apiRequest('GET', `/api/user-preferences/${user.id}`);
      const currentPreferences = await response.json();
      
      // Merge recent pages with existing dashboard layout
      const updatedDashboardLayout = {
        ...currentPreferences.dashboardLayout,
        recentPages: pages
      };
      
      // Save to user preferences with merged data
      await apiRequest('PUT', `/api/user-preferences`, {
        dashboardLayout: updatedDashboardLayout
      });
      
      // Clear any pending save since we just saved
      setPendingSave(null);
    } catch (error) {
      console.warn('Failed to save recent pages to database:', error);
    }
  };

  const togglePinPage = (path: string) => {
    setRecentPages(current => {
      const updated = current.map(page => 
        page.path === path ? { ...page, isPinned: !page.isPinned } : page
      );
      
      // Sort so pinned items come first
      const pinnedPages = updated.filter(page => page.isPinned).sort((a, b) => a.timestamp - b.timestamp);
      const unpinnedPages = updated.filter(page => !page.isPinned).sort((a, b) => b.timestamp - a.timestamp);
      const sortedUpdated = [...pinnedPages, ...unpinnedPages];
      
      // Apply auto-pinning logic (but respect manual unpinning of Getting Started)
      const processedUpdated = ensureGettingStartedPinned(sortedUpdated);
      
      // Save to user preferences
      saveRecentPages(processedUpdated);
      
      return processedUpdated;
    });
  };

  const clearRecentPages = async () => {
    setRecentPages([]);
    if (isAuthenticated && user?.id) {
      try {
        // First get current preferences to merge
        const response = await apiRequest('GET', `/api/user-preferences/${user.id}`);
        const currentPreferences = await response.json();
        
        // Merge empty recent pages with existing dashboard layout
        const updatedDashboardLayout = {
          ...currentPreferences.dashboardLayout,
          recentPages: []
        };
        
        // Clear from user preferences with merged data
        await apiRequest('PUT', `/api/user-preferences`, {
          dashboardLayout: updatedDashboardLayout
        });
      } catch (error) {
        console.warn('Failed to clear recent pages from database:', error);
      }
    }
    // Only clear for authenticated users - no localStorage fallback
  };

  // Function to set last visited route - FIXED to prevent infinite loop
  const setLastVisitedRoute = async (route: string) => {
    setLastVisitedRouteState(route);
    
    // Only save to database if explicitly called (not automatically)
    if (isAuthenticated && user?.id) {
      try {
        // First get current preferences to merge
        const response = await apiRequest('GET', `/api/user-preferences/${user.id}`);
        const currentPreferences = await response.json();
        
        // Merge last visited route with existing dashboard layout
        const updatedDashboardLayout = {
          ...currentPreferences.dashboardLayout,
          lastVisitedRoute: route
        };
        
        // Save to user preferences with merged data
        await apiRequest('PUT', `/api/user-preferences`, {
          dashboardLayout: updatedDashboardLayout
        });
      } catch (error) {
        console.warn('Failed to save last visited route to database:', error);
      }
    }
  };

  return (
    <NavigationContext.Provider value={{
      recentPages,
      addRecentPage,
      clearRecentPages,
      togglePinPage,
      lastVisitedRoute,
      setLastVisitedRoute
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
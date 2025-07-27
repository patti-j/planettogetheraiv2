import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

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
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const MAX_RECENT_PAGES = 6;

// Page mapping for labels and icons
const pageMapping: Record<string, { label: string; icon: string }> = {
  '/': { label: 'Dashboard', icon: 'BarChart3' },
  '/production-schedule': { label: 'Production Schedule', icon: 'BarChart3' },
  '/production-cockpit': { label: 'Production Cockpit', icon: 'Monitor' },
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
  '/plant-manager-dashboard': { label: 'Plant Manager', icon: 'Building' },
  '/business-goals': { label: 'Business Goals', icon: 'TrendingUp' },
  '/systems-management-dashboard': { label: 'Systems Management', icon: 'Server' },
  '/systems-integration': { label: 'System Integration', icon: 'Database' },
  '/role-management': { label: 'Role Management', icon: 'Shield' },
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
  '/billing': { label: 'Billing & Usage', icon: 'CreditCard' },
  '/account': { label: 'Account Settings', icon: 'Settings' }
};

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Load recent pages from user preferences (database only)
  useEffect(() => {
    const loadRecentPages = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const response = await apiRequest('GET', `/api/user-preferences/${user.id}`);
          const preferences = await response.json();
          const savedRecentPages = preferences?.dashboardLayout?.recentPages || [];
          
          // If no recent pages exist, initialize with default pinned "Getting Started"
          if (!Array.isArray(savedRecentPages) || savedRecentPages.length === 0) {
            const defaultRecentPages = [{
              path: '/onboarding',
              label: 'Getting Started',
              icon: 'BookOpen',
              timestamp: Date.now(),
              isPinned: true
            }];
            setRecentPages(defaultRecentPages);
            // Save default to database
            saveRecentPages(defaultRecentPages);
          } else {
            setRecentPages(savedRecentPages.slice(0, MAX_RECENT_PAGES));
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
          setRecentPages(defaultRecentPages);
        }
      } else {
        // Not authenticated, clear recent pages
        setRecentPages([]);
      }
    };

    loadRecentPages();
  }, [isAuthenticated, user?.id]);

  // Track current page when location changes
  useEffect(() => {
    const currentPath = location;
    const pageInfo = pageMapping[currentPath];
    
    if (pageInfo && currentPath !== '/') { // Don't track home page visits
      addRecentPage(currentPath, pageInfo.label, pageInfo.icon);
    }
  }, [location]);

  const addRecentPage = (path: string, label: string, icon?: string) => {
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
        
        // Save to user preferences
        saveRecentPages(updated);
        
        return updated;
      } else {
        // Separate pinned and unpinned pages
        const pinnedPages = current.filter(page => page.isPinned);
        const unpinnedPages = current.filter(page => !page.isPinned);
        
        // New page - add to the unpinned section and limit total to MAX_RECENT_PAGES
        const newPage = { path, label, icon: icon || 'FileText', timestamp: Date.now(), isPinned: false };
        const updatedUnpinned = [newPage, ...unpinnedPages];
        
        // Combine pinned + unpinned, ensuring we don't exceed MAX_RECENT_PAGES
        const updated = [...pinnedPages, ...updatedUnpinned].slice(0, MAX_RECENT_PAGES);

        // Save to user preferences
        saveRecentPages(updated);

        return updated;
      }
    });
  };

  const saveRecentPages = async (pages: RecentPage[]) => {
    if (isAuthenticated && user?.id) {
      try {
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
      } catch (error) {
        console.warn('Failed to save recent pages to database:', error);
      }
    }
    // Only save for authenticated users - no localStorage fallback
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
      
      // Save to user preferences
      saveRecentPages(sortedUpdated);
      
      return sortedUpdated;
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

  return (
    <NavigationContext.Provider value={{
      recentPages,
      addRecentPage,
      clearRecentPages,
      togglePinPage
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
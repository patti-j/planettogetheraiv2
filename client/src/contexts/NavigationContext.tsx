import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';

interface RecentPage {
  path: string;
  label: string;
  icon?: string;
  timestamp: number;
}

interface NavigationContextType {
  recentPages: RecentPage[];
  addRecentPage: (path: string, label: string, icon?: string) => void;
  clearRecentPages: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const STORAGE_KEY = 'navigation-recent-pages';
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
  '/getting-started': { label: 'Getting Started', icon: 'BookOpen' },
  '/training': { label: 'Training', icon: 'GraduationCap' },
  '/presentation-system': { label: 'Presentation System', icon: 'Presentation' }
};

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);
  const [location] = useLocation();

  // Load recent pages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure we have valid data structure
        if (Array.isArray(parsed)) {
          setRecentPages(parsed.slice(0, MAX_RECENT_PAGES));
        }
      }
    } catch (error) {
      console.warn('Failed to load recent pages from localStorage:', error);
    }
  }, []);

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
        
        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
          console.warn('Failed to save recent pages to localStorage:', error);
        }
        
        return updated;
      } else {
        // New page - add to the far left (beginning) and limit to MAX_RECENT_PAGES
        const updated = [
          { path, label, icon: icon || 'FileText', timestamp: Date.now() },
          ...current
        ].slice(0, MAX_RECENT_PAGES);

        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
          console.warn('Failed to save recent pages to localStorage:', error);
        }

        return updated;
      }
    });
  };

  const clearRecentPages = () => {
    setRecentPages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear recent pages from localStorage:', error);
    }
  };

  return (
    <NavigationContext.Provider value={{
      recentPages,
      addRecentPage,
      clearRecentPages
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
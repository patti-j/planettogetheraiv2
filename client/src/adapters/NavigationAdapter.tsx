// Navigation Adapter - Wraps Core Platform Module navigation behind existing NavigationContext API
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loadCorePlatformModule } from '@/lib/federation-access';
import { useLocation } from 'wouter';
import { useAuthAdapter } from './AuthAdapter';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { getNavigationItemByHref } from '@/config/navigation-menu';

interface RecentPage {
  path: string;
  label: string;
  icon?: string;
  timestamp: number;
  isPinned?: boolean;
}

interface FavoritePage {
  path: string;
  label: string;
  icon?: string;
  timestamp: number;
}

interface NavigationAdapterContextType {
  recentPages: RecentPage[];
  addRecentPage: (path: string, label: string, icon?: string) => void;
  clearRecentPages: () => void;
  togglePinPage: (path: string) => void;
  favoritePages: FavoritePage[];
  toggleFavorite: (path: string, label: string, icon?: string) => void;
  isFavorite: (path: string) => boolean;
  clearFavorites: () => void;
  moveFavoriteUp: (path: string) => void;
  moveFavoriteDown: (path: string) => void;
  lastVisitedRoute: string | null;
  setLastVisitedRoute: (route: string) => void;
}

const NavigationAdapterContext = createContext<NavigationAdapterContextType | undefined>(undefined);

const DEFAULT_MAX_RECENT_PAGES = 5;

export function NavigationAdapterProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);
  const [favoritePages, setFavoritePages] = useState<FavoritePage[]>([]);
  const [lastVisitedRoute, setLastVisitedRouteState] = useState<string | null>(null);
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuthAdapter();

  // Initialize federation system (now using dynamic loading)
  useEffect(() => {
    // For Week 3, we don't need to pre-initialize
    // Federation will be attempted dynamically when needed
    setIsInitialized(true);
  }, []);

  // Fetch user preferences
  const { data: userPreferences } = useQuery<any>({
    queryKey: [`/api/user-preferences/${user?.id}`],
    enabled: !!user?.id,
  });

  const maxRecentPages = userPreferences?.dashboardLayout?.maxRecentPages || DEFAULT_MAX_RECENT_PAGES;

  // Load recent pages from user preferences
  useEffect(() => {
    const loadRecentPages = async () => {
      if (isAuthenticated && user?.id && typeof user.id === 'number') {
        try {
          // Try federated navigation first
          if (isInitialized) {
            try {
              const corePlatform = await loadCorePlatformModule();
              if (corePlatform) {
                const federatedRoute = await corePlatform.getCurrentRoute();
                if (federatedRoute && typeof federatedRoute === 'string') {
                  setLastVisitedRouteState(federatedRoute);
                } else if (federatedRoute && federatedRoute.data) {
                  setLastVisitedRouteState(federatedRoute.data);
                }
              }
            } catch (error) {
              console.warn('[NavigationAdapter] Federated navigation failed, using fallback:', error);
            }
          }

          // Fallback to existing logic
          const response = await fetch(`/api/user-preferences/${user.id}`, {
            headers: {
              'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : '',
            },
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const preferences = await response.json();
          const savedRecentPages = preferences?.dashboardLayout?.recentPages || [];
          const savedFavorites = preferences?.dashboardLayout?.favoritePages || [];
          
          // Load favorites
          if (Array.isArray(savedFavorites) && savedFavorites.length > 0) {
            setFavoritePages(savedFavorites);
          }
          
          // Load recent pages
          if (!Array.isArray(savedRecentPages) || savedRecentPages.length === 0) {
            const defaultRecentPages = [{
              path: '/onboarding',
              label: 'Getting Started',
              icon: 'BookOpen',
              timestamp: Date.now(),
              isPinned: true
            }];
            setRecentPages(defaultRecentPages);
          } else {
            setRecentPages(savedRecentPages.slice(0, maxRecentPages));
          }
        } catch (error) {
          console.warn('Failed to load recent pages from database:', error);
          // Initialize with default
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
        setRecentPages([]);
      }
    };

    loadRecentPages();
  }, [isAuthenticated, user?.id, isInitialized]);

  const addRecentPage = async (path: string, label?: string, icon?: string) => {
    // Try federated navigation first
    if (isInitialized) {
      try {
        const corePlatform = await loadCorePlatformModule();
        if (corePlatform) {
          await corePlatform.navigateTo(path);
        }
      } catch (error) {
        console.warn('[NavigationAdapter] Federated navigation failed:', error);
      }
    }

    // Get the navigation item from config
    const navItem = getNavigationItemByHref(path);
    const finalLabel = label || navItem?.label || generateLabelFromPath(path).label;
    const finalIcon = icon || (typeof navItem?.icon === 'string' ? navItem.icon : 'FileText');
    
    setRecentPages(current => {
      const existingIndex = current.findIndex(page => page.path === path);
      
      if (existingIndex !== -1) {
        const updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          timestamp: Date.now()
        };
        saveRecentPages(updated);
        return updated;
      } else {
        const pinnedPages = current.filter(page => page.isPinned);
        const unpinnedPages = current.filter(page => !page.isPinned);
        
        const newPage = { path, label: finalLabel, icon: finalIcon, timestamp: Date.now(), isPinned: false };
        const updatedUnpinned = [newPage, ...unpinnedPages];
        
        const updated = [...pinnedPages, ...updatedUnpinned].slice(0, maxRecentPages);
        saveRecentPages(updated);
        return updated;
      }
    });
  };

  const saveRecentPages = async (pages: RecentPage[]) => {
    if (!isAuthenticated || !user?.id) return;
    
    try {
      const getResponse = await fetch(`/api/user-preferences/${user.id}`, {
        headers: {
          'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : '',
        },
        credentials: 'include',
      });
      
      if (!getResponse.ok) {
        throw new Error(`Failed to get preferences: ${getResponse.status}`);
      }
      
      const currentPreferences = await getResponse.json();
      
      const updatedDashboardLayout = {
        ...currentPreferences.dashboardLayout,
        recentPages: pages
      };
      
      const putResponse = await fetch('/api/user-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({
          dashboardLayout: updatedDashboardLayout
        }),
      });
      
      if (!putResponse.ok) {
        throw new Error(`Failed to save preferences: ${putResponse.status}`);
      }
    } catch (error) {
      console.warn('Failed to save recent pages to database:', error);
    }
  };

  const togglePinPage = (path: string) => {
    setRecentPages(current => {
      const updated = current.map(page => 
        page.path === path ? { ...page, isPinned: !page.isPinned } : page
      );
      
      const pinnedPages = updated.filter(page => page.isPinned).sort((a, b) => a.timestamp - b.timestamp);
      const unpinnedPages = updated.filter(page => !page.isPinned).sort((a, b) => b.timestamp - a.timestamp);
      const sortedUpdated = [...pinnedPages, ...unpinnedPages];
      
      saveRecentPages(sortedUpdated);
      return sortedUpdated;
    });
  };

  const clearRecentPages = async () => {
    setRecentPages([]);
    if (isAuthenticated && user?.id) {
      try {
        const getResponse = await fetch(`/api/user-preferences/${user.id}`, {
          headers: {
            'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : '',
          },
          credentials: 'include',
        });
        
        if (!getResponse.ok) {
          throw new Error(`Failed to get preferences: ${getResponse.status}`);
        }
        
        const currentPreferences = await getResponse.json();
        
        const updatedDashboardLayout = {
          ...currentPreferences.dashboardLayout,
          recentPages: []
        };
        
        const putResponse = await fetch('/api/user-preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : '',
          },
          credentials: 'include',
          body: JSON.stringify({
            dashboardLayout: updatedDashboardLayout
          }),
        });
        
        if (!putResponse.ok) {
          throw new Error(`Failed to clear preferences: ${putResponse.status}`);
        }
      } catch (error) {
        console.warn('Failed to clear recent pages from database:', error);
      }
    }
  };

  const setLastVisitedRoute = (route: string) => {
    setLastVisitedRouteState(route);
  };

  // Save favorites to database
  const saveFavorites = async (favorites: FavoritePage[]) => {
    if (!isAuthenticated || !user?.id) return;
    
    try {
      const getResponse = await fetch(`/api/user-preferences/${user.id}`, {
        headers: {
          'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : '',
        },
        credentials: 'include',
      });
      
      if (!getResponse.ok) {
        throw new Error(`Failed to get preferences: ${getResponse.status}`);
      }
      
      const currentPreferences = await getResponse.json();
      
      const updatedDashboardLayout = {
        ...currentPreferences.dashboardLayout,
        favoritePages: favorites
      };
      
      const putResponse = await fetch('/api/user-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({
          dashboardLayout: updatedDashboardLayout
        }),
      });
      
      if (!putResponse.ok) {
        throw new Error(`Failed to save favorites: ${putResponse.status}`);
      }
    } catch (error) {
      console.warn('Failed to save favorites to database:', error);
    }
  };

  // Toggle favorite status for a page
  const toggleFavorite = (path: string, label?: string, icon?: string) => {
    const navItem = getNavigationItemByHref(path);
    const finalLabel = label || navItem?.label || generateLabelFromPath(path).label;
    const finalIcon = icon || (typeof navItem?.icon === 'string' ? navItem.icon : 'FileText');
    
    setFavoritePages(current => {
      const existingIndex = current.findIndex(page => page.path === path);
      
      let updated: FavoritePage[];
      if (existingIndex !== -1) {
        // Remove from favorites
        updated = current.filter((_, index) => index !== existingIndex);
      } else {
        // Add to favorites
        const newFavorite = {
          path,
          label: finalLabel,
          icon: finalIcon,
          timestamp: Date.now()
        };
        updated = [...current, newFavorite];
      }
      
      saveFavorites(updated);
      return updated;
    });
  };

  // Check if a path is favorited
  const isFavorite = (path: string) => {
    return favoritePages.some(page => page.path === path);
  };

  // Clear all favorites
  const clearFavorites = async () => {
    setFavoritePages([]);
    if (isAuthenticated && user?.id) {
      try {
        const getResponse = await fetch(`/api/user-preferences/${user.id}`, {
          headers: {
            'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : '',
          },
          credentials: 'include',
        });
        
        if (!getResponse.ok) {
          throw new Error(`Failed to get preferences: ${getResponse.status}`);
        }
        
        const currentPreferences = await getResponse.json();
        
        const updatedDashboardLayout = {
          ...currentPreferences.dashboardLayout,
          favoritePages: []
        };
        
        const putResponse = await fetch('/api/user-preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : '',
          },
          credentials: 'include',
          body: JSON.stringify({
            dashboardLayout: updatedDashboardLayout
          }),
        });
        
        if (!putResponse.ok) {
          throw new Error(`Failed to clear favorites: ${putResponse.status}`);
        }
      } catch (error) {
        console.warn('Failed to clear favorites from database:', error);
      }
    }
  };

  // Move favorite up in the list
  const moveFavoriteUp = (path: string) => {
    setFavoritePages(current => {
      const index = current.findIndex(page => page.path === path);
      if (index <= 0) return current; // Can't move up if at the beginning or not found
      
      const updated = [...current];
      // Swap with previous item
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      
      saveFavorites(updated);
      return updated;
    });
  };

  // Move favorite down in the list
  const moveFavoriteDown = (path: string) => {
    setFavoritePages(current => {
      const index = current.findIndex(page => page.path === path);
      if (index === -1 || index >= current.length - 1) return current; // Can't move down if at the end or not found
      
      const updated = [...current];
      // Swap with next item
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      
      saveFavorites(updated);
      return updated;
    });
  };

  const value: NavigationAdapterContextType = {
    recentPages,
    addRecentPage,
    clearRecentPages,
    togglePinPage,
    favoritePages,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    moveFavoriteUp,
    moveFavoriteDown,
    lastVisitedRoute,
    setLastVisitedRoute
  };

  return (
    <NavigationAdapterContext.Provider value={value}>
      {children}
    </NavigationAdapterContext.Provider>
  );
}

export function useNavigationAdapter() {
  const context = useContext(NavigationAdapterContext);
  if (context === undefined) {
    throw new Error('useNavigationAdapter must be used within a NavigationAdapterProvider');
  }
  return context;
}

// Helper function to generate label from path
function generateLabelFromPath(path: string): { label: string; icon: string } {
  const segments = path.replace(/^\//, '').split(/[-\/]/).filter(Boolean);
  
  const label = segments
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
  
  let icon = 'FileText';
  
  if (path.includes('data')) icon = 'Database';
  else if (path.includes('analytics') || path.includes('report')) icon = 'BarChart3';
  else if (path.includes('dashboard') || path.includes('cockpit')) icon = 'Monitor';
  else if (path.includes('schedule') || path.includes('planning')) icon = 'Calendar';
  else if (path.includes('optimization') || path.includes('algorithm')) icon = 'Sparkles';
  
  return { label: label || 'Page', icon };
}
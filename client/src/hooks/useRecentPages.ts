import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { getNavigationItemByHref } from '@/config/navigation-menu';

interface RecentPage {
  path: string;
  label: string;
  icon: string;
  timestamp: number;
}

const RECENT_PAGES_KEY = 'recent_pages';
const MAX_RECENT_PAGES = 8;

// Find page info from navigation config using the centralized helper
// This ensures icons always match the main navigation menu
function getPageInfo(path: string) {
  // Use the centralized navigation helper to get the correct item
  const navItem = getNavigationItemByHref(path);
  
  if (navItem) {
    // Extract icon name from the Lucide icon component
    // The icon component has a displayName property (e.g., Sparkles component has displayName "Sparkles")
    const iconName = navItem.icon?.displayName || navItem.icon?.name || 'FileText';
    return {
      label: navItem.label,
      icon: iconName
    };
  }
  
  // Fallback for paths not in main navigation (like /mobile-home, /account, /settings)
  const pathMap: Record<string, { label: string; icon: string }> = {
    '/mobile-home': { label: 'Home', icon: 'Home' },
    '/account': { label: 'Account Settings', icon: 'Settings' },
    '/settings': { label: 'Settings', icon: 'Settings' }
  };
  
  return pathMap[path] || { label: path.replace('/', '').replace('-', ' '), icon: 'FileText' };
}

export function useRecentPages() {
  const [location] = useLocation();
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);

  // Load recent pages from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_PAGES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentPages(parsed);
      }
    } catch (error) {
      console.error('Failed to load recent pages:', error);
    }
  }, []);

  // Track current page visit
  useEffect(() => {
    if (!location || location === '/') return;

    const pageInfo = getPageInfo(location);
    const newPage: RecentPage = {
      path: location,
      label: pageInfo.label,
      icon: pageInfo.icon,
      timestamp: Date.now()
    };

    setRecentPages(prev => {
      // Remove existing entry for this path
      const filtered = prev.filter(page => page.path !== location);
      
      // Add new entry at the beginning
      const updated = [newPage, ...filtered].slice(0, MAX_RECENT_PAGES);
      
      // Save to localStorage
      try {
        localStorage.setItem(RECENT_PAGES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent pages:', error);
      }
      
      return updated;
    });
  }, [location]);

  // Clear recent pages
  const clearRecentPages = () => {
    setRecentPages([]);
    localStorage.removeItem(RECENT_PAGES_KEY);
  };

  return {
    recentPages,
    clearRecentPages
  };
}
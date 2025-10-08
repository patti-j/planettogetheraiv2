import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { navigationGroups } from '@/config/navigation-menu';

interface RecentPage {
  path: string;
  label: string;
  icon: string;
  timestamp: number;
}

const RECENT_PAGES_KEY = 'recent_pages';
const MAX_RECENT_PAGES = 8;

// Find page info from navigation config
function getPageInfo(path: string) {
  for (const group of navigationGroups) {
    for (const feature of group.features) {
      if (feature.href === path) {
        return {
          label: feature.label,
          icon: feature.icon.name || 'FileText'
        };
      }
    }
  }
  
  // Fallback for common paths
  const pathMap: Record<string, { label: string; icon: string }> = {
    '/mobile-home': { label: 'Home', icon: 'Home' },
    '/production-schedule': { label: 'Production Schedule', icon: 'Calendar' },
    '/product-wheels': { label: 'Product Wheels', icon: 'Grid3X3' },
    '/smart-kpi-tracking': { label: 'SMART KPI Tracking', icon: 'Gauge' },
    '/operations': { label: 'Operations', icon: 'Settings' },
    '/resources': { label: 'Resources', icon: 'Users' },
    '/jobs': { label: 'Production Orders', icon: 'Package' },
    '/quality': { label: 'Quality Management', icon: 'CheckCircle' },
    '/inventory': { label: 'Inventory', icon: 'Package' },
    '/alerts': { label: 'Alerts', icon: 'AlertTriangle' },
    '/onboarding': { label: 'Getting Started', icon: 'BookOpen' },
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
// Navigation Service Implementation
import type { NavigationService, RecentPage } from '../types';

export class NavigationServiceImpl implements NavigationService {
  private recentPages: RecentPage[] = [];
  private maxRecentPages: number = 5;
  private listeners: Set<() => void> = new Set();

  navigateTo(route: string, params?: Record<string, any>): void {
    // Use wouter's imperative navigation
    window.history.pushState(null, '', route);
    
    // Dispatch navigation event for wouter
    window.dispatchEvent(new PopStateEvent('popstate'));
    
    console.log(`[NavigationService] Navigating to: ${route}`, params);
  }

  getCurrentRoute(): string {
    return window.location.pathname;
  }

  addRecentPage(path: string, label: string, icon?: string): void {
    // Replace old routes with new ones
    if (path === '/role-management') {
      path = '/user-access-management';
    }
    
    const finalIcon = icon || this.generateIconFromPath(path);
    
    // Check if the page already exists
    const existingIndex = this.recentPages.findIndex(page => page.path === path);
    
    if (existingIndex !== -1) {
      // Update timestamp of existing page
      this.recentPages[existingIndex] = {
        ...this.recentPages[existingIndex],
        timestamp: Date.now()
      };
    } else {
      // Add new page
      const newPage: RecentPage = { 
        path, 
        label, 
        icon: finalIcon, 
        timestamp: Date.now(), 
        isPinned: false 
      };
      
      // Separate pinned and unpinned pages
      const pinnedPages = this.recentPages.filter(page => page.isPinned);
      const unpinnedPages = this.recentPages.filter(page => !page.isPinned);
      
      // Add to unpinned section
      const updatedUnpinned = [newPage, ...unpinnedPages];
      
      // Combine and limit to maxRecentPages
      this.recentPages = [...pinnedPages, ...updatedUnpinned].slice(0, this.maxRecentPages);
    }
    
    // Notify listeners
    this.notifyListeners();
  }

  getRecentPages(): RecentPage[] {
    return [...this.recentPages];
  }

  clearRecentPages(): void {
    this.recentPages = [];
    this.notifyListeners();
  }

  togglePinPage(path: string): void {
    this.recentPages = this.recentPages.map(page => 
      page.path === path ? { ...page, isPinned: !page.isPinned } : page
    );
    
    // Sort so pinned items come first
    const pinnedPages = this.recentPages.filter(page => page.isPinned).sort((a, b) => a.timestamp - b.timestamp);
    const unpinnedPages = this.recentPages.filter(page => !page.isPinned).sort((a, b) => b.timestamp - a.timestamp);
    this.recentPages = [...pinnedPages, ...unpinnedPages];
    
    this.notifyListeners();
  }

  // Subscribe to navigation changes
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Navigation listener error:', error);
      }
    });
  }

  private generateIconFromPath(path: string): string {
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
    
    return icon;
  }
}

// Singleton instance
export const navigationService = new NavigationServiceImpl();
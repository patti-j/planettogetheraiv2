// Theme Service Implementation
import type { ThemeService, Theme } from '../types';

export class ThemeServiceImpl implements ThemeService {
  private currentTheme: Theme = 'light';
  private resolvedTheme: 'light' | 'dark' = 'light';
  private listeners: Set<(theme: Theme) => void> = new Set();

  constructor() {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      this.currentTheme = savedTheme;
    }
    
    // Apply initial theme
    this.applyTheme(this.currentTheme);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this));
  }

  getTheme(): Theme {
    return this.currentTheme;
  }

  setTheme(theme: Theme): void {
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
    this.notifyListeners(theme);
  }

  getResolvedTheme(): 'light' | 'dark' {
    return this.resolvedTheme;
  }

  subscribeToThemeChanges(callback: (theme: Theme) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private applyTheme(theme: Theme): void {
    const root = window.document.documentElement;
    let effectiveTheme: 'light' | 'dark' = 'light';

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      effectiveTheme = systemTheme;
    } else {
      effectiveTheme = theme as 'light' | 'dark';
    }

    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
    this.resolvedTheme = effectiveTheme;
  }

  private handleSystemThemeChange(): void {
    if (this.currentTheme === 'system') {
      this.applyTheme(this.currentTheme);
    }
  }

  private notifyListeners(theme: Theme): void {
    this.listeners.forEach(callback => {
      try {
        callback(theme);
      } catch (error) {
        console.error('Theme listener error:', error);
      }
    });
  }

  // Update theme preference via API
  async updateThemePreference(theme: Theme, userId?: number): Promise<void> {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/user-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({
          theme: theme
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update theme preference: ${response.status}`);
      }
      
      console.log(`[ThemeService] Theme preference updated to: ${theme}`);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }
}

// Singleton instance
export const themeService = new ThemeServiceImpl();
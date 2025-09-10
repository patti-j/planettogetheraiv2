// Core Platform Types
import type { CorePlatformContract } from '@planettogether/shared-components/contracts/module-contracts';

// User Types (extracted from existing auth system)
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  activeRoleId?: number;
  currentRole?: {
    id: number;
    name: string;
    description?: string;
  };
  roles: Array<{
    id: number;
    name: string;
    description: string;
    permissions: Array<{
      id: number;
      name: string;
      feature: string;
      action: string;
      description: string;
    }>;
  }>;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

// Navigation Types
export interface RecentPage {
  path: string;
  label: string;
  icon?: string;
  timestamp: number;
  isPinned?: boolean;
}

export interface NavigationContextType {
  recentPages: RecentPage[];
  addRecentPage: (path: string, label: string, icon?: string) => void;
  clearRecentPages: () => void;
  togglePinPage: (path: string) => void;
  lastVisitedRoute: string | null;
  setLastVisitedRoute: (route: string) => void;
}

// Auth Types
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<any>;
  logout: () => void;
  loginError: Error | null;
  isLoginPending: boolean;
}

export interface PermissionsContextType {
  hasPermission: (feature: string, action: string) => boolean;
  hasAnyPermission: (permissions: Array<{ feature: string; action: string }>) => boolean;
  hasRole: (roleName: string) => boolean;
}

// Core Platform Implementation
export interface CorePlatformImplementation extends CorePlatformContract {
  // Service instances
  authService: AuthService;
  navigationService: NavigationService;
  themeService: ThemeService;
  
  // Context providers
  AuthProvider: React.ComponentType<{ children: React.ReactNode }>;
  NavigationProvider: React.ComponentType<{ children: React.ReactNode }>;
  ThemeProvider: React.ComponentType<{ children: React.ReactNode }>;
}

// Service Interfaces
export interface AuthService {
  getCurrentUser(): Promise<User | null>;
  login(credentials: { username: string; password: string }): Promise<any>;
  logout(): Promise<void>;
  getUserPermissions(userId: number): Promise<string[]>;
  hasPermission(feature: string, action: string): boolean;
  hasRole(roleName: string): boolean;
}

export interface NavigationService {
  navigateTo(route: string, params?: Record<string, any>): void;
  getCurrentRoute(): string;
  addRecentPage(path: string, label: string, icon?: string): void;
  getRecentPages(): RecentPage[];
  clearRecentPages(): void;
}

export interface ThemeService {
  getTheme(): Theme;
  setTheme(theme: Theme): void;
  getResolvedTheme(): 'light' | 'dark';
  subscribeToThemeChanges(callback: (theme: Theme) => void): () => void;
}
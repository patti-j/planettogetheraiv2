// Core Platform Module Implementation
// Using simplified standalone implementation for Week 3 client adapter integration
import { authService, navigationService, themeService } from './services';
import type { CorePlatformContract } from '../shared-components/contracts/module-contracts';

// Simplified types and base class for initial federation
interface ModuleInitOptions {
  config?: Record<string, any>;
  apiBaseUrl?: string;
  theme?: string;
}

abstract class BaseModule {
  protected abstract name: string;
  
  async initialize(options?: ModuleInitOptions): Promise<void> {
    console.log(`[${this.name}] Initializing module...`);
    await this.onInitialize(options);
  }
  
  async destroy(): Promise<void> {
    console.log(`[${this.name}] Destroying module...`);
    await this.onDestroy();
  }
  
  protected abstract onInitialize(options?: ModuleInitOptions): Promise<void>;
  protected abstract onDestroy(): Promise<void>;
}

export class CorePlatformModule extends BaseModule implements CorePlatformContract {
  protected name = 'core-platform';
  
  // Service instances
  authService = authService;
  navigationService = navigationService;
  themeService = themeService;

  protected async onInitialize(options?: ModuleInitOptions): Promise<void> {
    console.log('[CorePlatform] Initializing core platform services...');
    
    // Initialize services with options
    if (options?.apiBaseUrl) {
      // Could configure API base URL for services
    }
    
    if (options?.theme) {
      this.themeService.setTheme(options.theme);
    }
    
    console.log('[CorePlatform] Core platform services initialized');
  }

  protected async onDestroy(): Promise<void> {
    console.log('[CorePlatform] Destroying core platform services...');
    // Cleanup any subscriptions or resources
  }

  // CorePlatformContract Implementation
  async getCurrentUser(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const user = await this.authService.getCurrentUser();
      return { success: true, data: user };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async getUserPermissions(userId: number): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
      const permissions = await this.authService.getUserPermissions(userId);
      return { success: true, data: permissions };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  navigateTo(route: string, params?: Record<string, any>): void {
    this.navigationService.navigateTo(route, params);
  }

  getCurrentRoute(): string {
    return this.navigationService.getCurrentRoute();
  }

  getTheme(): string {
    return this.themeService.getTheme();
  }

  setTheme(theme: string): void {
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
      this.themeService.setTheme(theme);
    }
  }

  // Plant management methods (required by CorePlatformContract)
  async getPlants(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    // TODO: Implement plant management - for now return empty
    return { success: true, data: [] };
  }

  async getPlantById(plantId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    // TODO: Implement plant management - for now return null
    return { success: true, data: null };
  }

  // Additional helper methods
  hasPermission(feature: string, action: string): boolean {
    return this.authService.hasPermission(feature, action);
  }

  hasRole(roleName: string): boolean {
    return this.authService.hasRole(roleName);
  }

  addRecentPage(path: string, label: string, icon?: string): void {
    this.navigationService.addRecentPage(path, label, icon);
  }

  getRecentPages() {
    return this.navigationService.getRecentPages();
  }

  // Login/Logout helpers
  async login(credentials: { username: string; password: string }) {
    try {
      const result = await this.authService.login(credentials);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }

  async logout() {
    try {
      await this.authService.logout();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Logout failed' 
      };
    }
  }
}

// Singleton instance
export const corePlatformModule = new CorePlatformModule();
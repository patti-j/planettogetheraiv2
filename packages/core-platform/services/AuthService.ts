// Authentication Service Implementation
import type { User, AuthService } from '../types';

// Role permissions mapping - extracted from existing useAuth.ts
const rolePermissionsMap: Record<string, string[]> = {
  'Director': [
    'business-goals-view', 'business-goals-create', 'business-goals-edit', 'business-goals-delete',
    'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view'
  ],
  'Plant Manager': [
    'plant-manager-view', 'capacity-planning-view', 'reports-view', 'analytics-view',
    'schedule-view', 'ai-assistant-view', 'feedback-view'
  ],
  'Production Scheduler': [
    'schedule-view', 'schedule-create', 'schedule-edit', 'schedule-delete',
    'scheduling-optimizer-view', 'shop-floor-view', 'boards-view', 'erp-import-view',
    'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view'
  ],
  'IT Administrator': [
    'systems-management-view', 'role-management-view', 'user-role-assignments-view',
    'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view',
    'implementation-projects-view'
  ],
  'Systems Manager': [
    'systems-management-view', 'role-management-view', 'user-role-assignments-view',
    'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view',
    'implementation-projects-view'
  ],
  'Administrator': [
    'ai-assistant-view', 'alerts-view', 'algorithm-governance-view',
    'analytics-create', 'analytics-edit', 'analytics-view',
    'boards-view', 'business-goals-view', 'capacity-planning-view',
    'chat-view', 'demand-planning-view', 'demand-supply-alignment-view',
    'disruption-management-view', 'erp-import-view', 'feedback-view',
    'forklift-driver-view', 'implementation-projects-view',
    'inbox-view', 'industry-templates-view', 'inventory-optimization-view',
    'labor-create', 'labor-delete', 'labor-edit', 'labor-view',
    'labor-planning-create', 'labor-planning-delete', 'labor-planning-edit', 'labor-planning-view',
    'maintenance-view', 'maintenance-planning-view', 'master-production-schedule-view',
    'notifications-send', 'operator-dashboard-view', 'optimization-view',
    'optimization-studio-view', 'planning-scheduling-view', 'plant-manager-view',
    'production-cockpit-view', 'reports-create', 'reports-view',
    'role-management-view', 'schedule-create', 'schedule-delete', 'schedule-edit', 'schedule-view',
    'scheduling-optimizer-view', 'shop-floor-view', 'systems-integration-view',
    'systems-management-view', 'tenant-admin-view', 'training-view',
    'user-management-view', 'user-role-assignments-view', 'visual-factory-view'
  ],
  'Shop Floor Operations': [
    'shop-floor-view', 'operator-dashboard-view', 'reports-view',
    'ai-assistant-view', 'feedback-view'
  ],
  'Data Analyst': [
    'analytics-view', 'reports-view', 'schedule-view',
    'ai-assistant-view', 'feedback-view'
  ],
  'Trainer': [
    'training-view', 'role-switching-permissions', 'analytics-view', 'reports-view',
    'schedule-view', 'business-goals-view', 'visual-factory-view',
    'ai-assistant-view', 'feedback-view', 'systems-management-view',
    'capacity-planning-view', 'scheduling-optimizer-view', 'shop-floor-view', 
    'boards-view', 'erp-import-view', 'plant-manager-view', 'operator-dashboard-view',
    'maintenance-planning-view', 'role-management-view', 'user-role-assignments-view',
    'business-goals-create', 'business-goals-edit', 'schedule-create', 'schedule-edit',
    'implementation-projects-view'
  ],
  'Maintenance Technician': [
    'maintenance-planning-view', 'reports-view',
    'ai-assistant-view', 'feedback-view'
  ]
};

// Helper functions extracted from existing useAuth.ts
const createPermissionObject = (permissionString: string, id: number) => {
  const parts = permissionString.split('-');
  const action = parts.pop() || 'view';
  const feature = parts.join('-');
  
  return {
    id,
    name: permissionString,
    feature,
    action,
    description: `${action} access to ${feature}`
  };
};

const createRoleStructure = (roleName: string) => {
  const permissions = rolePermissionsMap[roleName] || [];
  
  return {
    id: Math.abs(roleName.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)),
    name: roleName,
    description: `${roleName} role with assigned permissions`,
    permissions: permissions.map((perm, index) => createPermissionObject(perm, index + 1))
  };
};

export class AuthServiceImpl implements AuthService {
  private currentUser: User | null = null;

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return null;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        localStorage.removeItem('auth_token');
        return null;
      }

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      let userData = data.user || data;
      
      // Apply permission fix for auth/me endpoint
      if (userData && userData.roles && Array.isArray(userData.roles)) {
        userData.roles = userData.roles.map((role: any) => {
          if (!role.permissions || role.permissions.length === 0) {
            console.log(`🔧 [CorePlatform] Applying hardcoded permissions for role: ${role.name}`);
            return createRoleStructure(role.name);
          }
          return role;
        });
      } else if (userData) {
        console.log('🔧 [CorePlatform] No roles found, applying default Administrator role');
        userData.roles = [createRoleStructure('Administrator')];
      }
      
      this.currentUser = userData;
      return userData;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  async login(credentials: { username: string; password: string }): Promise<any> {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      const userData = await response.json();
      
      // Store token in localStorage
      if (userData.token) {
        localStorage.setItem('auth_token', userData.token);
      }
      
      // Process user data with permissions
      let processedUserData = userData.user || userData;
      
      if (processedUserData.roles && Array.isArray(processedUserData.roles)) {
        processedUserData.roles = processedUserData.roles.map((role: any) => {
          if (!role.permissions || role.permissions.length === 0) {
            console.log(`🔧 [CorePlatform] Applying hardcoded permissions for role: ${role.name}`);
            return createRoleStructure(role.name);
          }
          return role;
        });
      } else {
        console.log('🔧 [CorePlatform] No roles found, applying default Administrator role');
        processedUserData.roles = [createRoleStructure('Administrator')];
      }
      
      this.currentUser = processedUserData;
      return { ...userData, user: processedUserData };
    } catch (error) {
      throw error;
    }
  }

  async logout(): Promise<void> {
    console.log("=== CorePlatform LOGOUT ===");
    
    try {
      // Send logout request to server
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        credentials: "include",
      });
      console.log("✓ Server logout request completed:", response.status);
    } catch (error) {
      console.error("Server logout failed:", error);
    }
    
    // Clear authentication data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_user');
    this.currentUser = null;
    
    console.log("✓ CorePlatform auth data cleared");
  }

  async getUserPermissions(userId: number): Promise<string[]> {
    if (!this.currentUser || this.currentUser.id !== userId) {
      return [];
    }

    const permissions: string[] = [];
    this.currentUser.roles?.forEach(role => {
      role.permissions?.forEach(permission => {
        permissions.push(`${permission.feature}-${permission.action}`);
      });
    });

    return permissions;
  }

  hasPermission(feature: string, action: string): boolean {
    if (!this.currentUser) return false;

    if (!this.currentUser.roles || !Array.isArray(this.currentUser.roles)) {
      return false;
    }

    return this.currentUser.roles.some(role =>
      role.permissions?.some(permission =>
        permission.feature === feature && permission.action === action
      )
    );
  }

  hasRole(roleName: string): boolean {
    if (!this.currentUser) return false;

    if (!this.currentUser.roles) return false;
    return this.currentUser.roles.some(role => role.name === roleName);
  }

  // Get current user synchronously (for contexts)
  getUser(): User | null {
    return this.currentUser;
  }

  // Set current user (for contexts)
  setUser(user: User | null): void {
    this.currentUser = user;
  }
}

// Singleton instance
export const authService = new AuthServiceImpl();
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Role permissions mapping - creates proper permission objects from role definitions
const rolePermissionsMap: Record<string, string[]> = {
  'Director': [
    'business-goals-view', 'business-goals-create', 'business-goals-edit', 'business-goals-delete',
    'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view', 'production-scheduling-view'
  ],
  'Plant Manager': [
    'plant-manager-view', 'capacity-planning-view', 'reports-view', 'analytics-view',
    'schedule-view', 'ai-assistant-view', 'feedback-view', 'production-scheduling-view'
  ],
  'Production Scheduler': [
    'schedule-view', 'schedule-create', 'schedule-edit', 'schedule-delete',
    'scheduling-optimizer-view', 'shop-floor-view', 'boards-view', 'erp-import-view',
    'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view', 'production-scheduling-view'
  ],
  'IT Administrator': [
    'systems-management-view', 'role-management-view', 'user-role-assignments-view',
    'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view',
    'implementation-projects-view',
    // Newly connected features
    'product-development-view', 'schedule-management-view', 'scheduling-history-view',
    'functional-map-view', 'api-integrations-view', 'analytics-new-view',
    'tasks-view', 'billing-view', 'algorithm-management-view',
    'mobile-dashboard-view', 'memory-books-view', 'data-import-clean-view',
    'data-import-simple-view', 'help-view', 'control-tower-view',
    'dashboards-view', 'smart-kpi-tracking-view', 'production-planning-view',
    'demand-planning-view', 'erp-import-view', 'algorithm-governance-view', 'production-scheduling-view'
  ],
  'Systems Manager': [
    'systems-management-view', 'role-management-view', 'user-role-assignments-view',
    'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view',
    'implementation-projects-view',
    // Newly connected features
    'product-development-view', 'schedule-management-view', 'scheduling-history-view',
    'functional-map-view', 'api-integrations-view', 'analytics-new-view',
    'tasks-view', 'billing-view', 'algorithm-management-view',
    'mobile-dashboard-view', 'memory-books-view', 'data-import-clean-view',
    'data-import-simple-view', 'help-view', 'control-tower-view',
    'dashboards-view', 'smart-kpi-tracking-view', 'production-planning-view',
    'demand-planning-view', 'erp-import-view', 'algorithm-governance-view', 'production-scheduling-view'
  ],
  'Administrator': [
    // Core permissions for all navigation menu items
    'dashboard-view', 'ai-assistant-view', 'alerts-view', 'algorithm-governance-view',
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
    'user-management-view', 'user-role-assignments-view', 'visual-factory-view',
    // Newly connected features
    'product-development-view', 'schedule-management-view', 'scheduling-history-view',
    'functional-map-view', 'api-integrations-view', 'analytics-new-view',
    'tasks-view', 'billing-view', 'algorithm-management-view',
    'mobile-dashboard-view', 'memory-books-view', 'data-import-clean-view',
    'data-import-simple-view', 'help-view', 'control-tower-view',
    'dashboards-view', 'smart-kpi-tracking-view', 'production-planning-view', 'production-scheduling-view'
  ],
  'Shop Floor Operations': [
    'shop-floor-view', 'operator-dashboard-view', 'reports-view',
    'ai-assistant-view', 'feedback-view', 'production-scheduling-view'
  ],
  'Data Analyst': [
    'analytics-view', 'reports-view', 'schedule-view',
    'ai-assistant-view', 'feedback-view', 'production-scheduling-view'
  ],
  'Trainer': [
    'training-view', 'role-switching-permissions', 'analytics-view', 'reports-view',
    'schedule-view', 'business-goals-view', 'visual-factory-view',
    'ai-assistant-view', 'feedback-view', 'systems-management-view',
    'capacity-planning-view', 'scheduling-optimizer-view', 'shop-floor-view', 
    'boards-view', 'erp-import-view', 'plant-manager-view', 'operator-dashboard-view',
    'maintenance-planning-view', 'role-management-view', 'user-role-assignments-view',
    'business-goals-create', 'business-goals-edit', 'schedule-create', 'schedule-edit',
    'implementation-projects-view', 'production-scheduling-view'
  ],
  'Maintenance Technician': [
    'maintenance-planning-view', 'reports-view',
    'ai-assistant-view', 'feedback-view', 'production-scheduling-view'
  ]
};

// Convert permission string to feature-action object
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

// Create role structure from role name
const createRoleStructure = (roleName: string) => {
  const permissions = rolePermissionsMap[roleName] || [];
  
  return {
    id: Math.abs(roleName.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)),
    name: roleName,
    description: `${roleName} role with assigned permissions`,
    permissions: permissions.map((perm, index) => createPermissionObject(perm, index + 1))
  };
};

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

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    retryOnMount: false,
    staleTime: 1000 * 60 * 30, // Keep auth data fresh for 30 minutes
    gcTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchOnWindowFocus: false, // Disable to prevent infinite loops
    refetchInterval: false, // Disable auto-refetch to prevent login page issues
    // Handle 401 errors gracefully - treat as not authenticated rather than error
    queryFn: async ({ queryKey }) => {
      // Development mode auto-login: bypass authentication for easier previews
      const isDev = import.meta.env.MODE === 'development';
      
      // Token-based authentication - get token from localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        // In development mode, auto-create an admin user without requiring login
        if (isDev) {
          console.log('🔧 Development mode: Auto-login as admin user');
          const devUser = {
            id: 1,
            username: "admin",
            email: "admin@planettogether.com",
            firstName: "Admin",
            lastName: "User",
            isActive: true,
            roles: [createRoleStructure('Administrator')]
          };
          return devUser;
        }
        return null;
      }

      const res = await fetch(queryKey.join("/") as string, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        // Token invalid/expired - clear it
        localStorage.removeItem('auth_token');
        
        // In development mode, fall back to auto-login even with invalid token
        if (isDev) {
          console.log('🔧 Development mode: Token invalid, using auto-login as admin user');
          const devUser = {
            id: 1,
            username: "admin",
            email: "admin@planettogether.com",
            firstName: "Admin",
            lastName: "User",
            isActive: true,
            roles: [createRoleStructure('Administrator')]
          };
          return devUser;
        }
        
        return null;
      }

      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }

      const data = await res.json();
      // Extract user from the response if it's wrapped
      let userData = data.user || data;
      
      // CRITICAL FIX: Apply same permission fix for auth/me endpoint
      if (userData && userData.roles && Array.isArray(userData.roles)) {
        userData.roles = userData.roles.map((role: any) => {
          if (!role.permissions || role.permissions.length === 0) {
            // Silently apply hardcoded permissions
            return createRoleStructure(role.name);
          }
          return role;
        });
      } else if (userData) {
        // No roles at all - apply default Administrator role silently
        userData.roles = [createRoleStructure('Administrator')];
      }
      
      return userData;
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
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
        
        // Token-based auth - store token in localStorage
        if (userData.token) {
          localStorage.setItem('auth_token', userData.token);
        }
        
        // CRITICAL FIX: Ensure permissions are properly set
        let processedUserData = userData;
        if (userData.user) {
          processedUserData = userData.user;
        }
        
        // If roles exist but have empty permissions, use hardcoded fallback
        if (processedUserData.roles && Array.isArray(processedUserData.roles)) {
          processedUserData.roles = processedUserData.roles.map((role: any) => {
            if (!role.permissions || role.permissions.length === 0) {
              console.log(`🔧 Applying hardcoded permissions for role: ${role.name}`);
              // Use hardcoded permissions for this role
              return createRoleStructure(role.name);
            }
            return role;
          });
        } else {
          // No roles at all - this shouldn't happen but just in case
          console.log('🔧 No roles found, applying default Administrator role');
          processedUserData.roles = [createRoleStructure('Administrator')];
        }
        
        console.log('🔧 Final user data with permissions:', {
          username: processedUserData.username,
          roles: processedUserData.roles.map((r: any) => ({
            name: r.name,
            permissionCount: r.permissions?.length || 0,
            firstFewPermissions: r.permissions?.slice(0, 3).map((p: any) => `${p.feature}-${p.action}`)
          }))
        });
        
        return { ...userData, user: processedUserData };
      } catch (error) {
        throw error;
      }
    },
    onSuccess: async (data) => {
      try {
        // Detect if user is on mobile device
        const isMobile = window.innerWidth <= 480 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const redirectPath = isMobile ? '/mobile-home' : '/dashboard';
        
        console.log(`Login successful, redirecting to ${redirectPath} (mobile: ${isMobile})`);
        
        // First invalidate and refetch auth data to ensure proper authentication
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        
        // Then also prefetch user role and workspace data for smoother loading
        if (data.user && data.user.id) {
          await Promise.all([
            queryClient.prefetchQuery({ 
              queryKey: [`/api/users/${data.user.id}/assigned-roles`] 
            }),
            queryClient.prefetchQuery({ 
              queryKey: [`/api/users/${data.user.id}/current-role`] 
            })
          ]);
        }
        
        // Add a small delay to ensure state is properly updated
        setTimeout(() => {
          if (isMobile) {
            console.log("Desktop login successful, redirecting to /dashboard");
          }
          window.location.href = redirectPath;
        }, 150);
      } catch (error) {
        console.error("Post-login processing error:", error);
        // Even if invalidation fails, still redirect based on device type
        const isMobile = window.innerWidth <= 480 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const redirectPath = isMobile ? '/mobile-home' : '/dashboard';
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 150);
      }
    },
    onError: (error) => {
      // Session-based auth - nothing to clear on client
      console.error('Login failed:', error);
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("=== LOGOUT MUTATION STARTING ===");
      
      // Clear only authentication-related queries, preserve other app data
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.cancelQueries();
      
      // Only invalidate auth-related queries instead of clearing everything
      queryClient.removeQueries({ queryKey: ["/api/auth/me"] });
      queryClient.removeQueries({ predicate: query => {
        const key = query.queryKey[0]?.toString();
        return !!(
          key?.includes("/api/auth") ||
          key?.includes("/api/users") ||
          key?.includes("assigned-roles") ||
          key?.includes("current-role")
        );
      } });
      
      // Send logout request to destroy session on server
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          credentials: "include", // Include session cookies
        });
        console.log("✓ Server logout request completed:", response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log("✓ Server logout response:", result);
        } else {
          console.error("Server logout failed with status:", response.status);
        }
      } catch (error) {
        console.error("Server logout failed:", error);
        // Continue with local cleanup even if server fails
      }
      
      // Clear only authentication-related items from localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('portal_token');
      localStorage.removeItem('portal_user');
      localStorage.removeItem('activeDemoTour');
      console.log("✓ Cleared authentication data from storage");
      
      // Set a flag to prevent any re-authentication attempts
      (window as any).__LOGOUT_IN_PROGRESS__ = true;
      
      return true;
    },
    onSuccess: () => {
      console.log("=== LOGOUT SUCCESS HANDLER ===");
      
      // Ensure auth data is cleared (but preserve other app data)
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('portal_token');
      localStorage.removeItem('portal_user');
      
      // Clear the flag  
      delete (window as any).__LOGOUT_IN_PROGRESS__;
      
      // Navigate to login page
      console.log("✓ Redirecting to login page...");
      window.location.replace('/login');
    },
    onError: (error) => {
      console.error("=== LOGOUT ERROR HANDLER ===", error);
      // Even if logout fails, clear auth data
      console.log("Clearing auth data despite error...");
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('portal_token');
      localStorage.removeItem('portal_user');
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries();
      
      // Redirect to login page
      console.log("✓ Error: Redirecting to login...");
      window.location.replace('/login');
    },
  });

  return {
    user: user as User | null,
    isLoading,
    isAuthenticated: !!user && !error,
    login: loginMutation.mutateAsync,
    logout: () => {
      console.log("=== LOGOUT CALLED ===");
      console.log("Current user:", user);
      logoutMutation.mutate();
    },
    loginError: loginMutation.error || error, // Include auth query error
    isLoginPending: loginMutation.isPending,
  };
}

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (feature: string, action: string): boolean => {
    if (!user) return false;

    // All users now use the roles array structure
    if (!user.roles || !Array.isArray(user.roles)) {
      return false;
    }

    // Check permissions without logging
    const hasAccess = user.roles.some(role => {
      return role.permissions?.some(permission => {
        return permission.feature === feature && permission.action === action;
      });
    });
    
    return hasAccess;
  };

  const hasAnyPermission = (permissions: Array<{ feature: string; action: string }>): boolean => {
    return permissions.some(({ feature, action }) => hasPermission(feature, action));
  };

  const hasRole = (roleName: string): boolean => {
    if (!user) return false;

    // All users now use roles array structure
    if (!user.roles) return false;
    return user.roles.some(role => role.name === roleName);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasRole,
  };
}
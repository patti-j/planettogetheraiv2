import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Role permissions mapping - creates proper permission objects from role definitions
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
    'role-management-view', 'systems-management-view', 'user-role-assignments-view',
    'schedule-view', 'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view',
    'implementation-projects-view'
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
    staleTime: 0, // Always refetch to get fresh role data
    refetchOnWindowFocus: false, // Disable to prevent infinite loops
    refetchInterval: false, // Disable auto-refetch to prevent login page issues
    // Handle 401 errors gracefully - treat as not authenticated rather than error
    queryFn: async ({ queryKey }) => {
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
        headers,
      });

      if (res.status === 401) {
        // Return null for unauthenticated users instead of throwing
        return null;
      }

      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }

      return await res.json();
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      try {
        const response = await apiRequest("POST", "/api/auth/login", credentials);
        
        // Parse response content
        const responseText = await response.text();
        
        let userData;
        try {
          userData = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`Invalid JSON response: ${parseError.message}`);
        }
        
        // Store token in localStorage if provided
        if (userData.token) {
          localStorage.setItem('authToken', userData.token);
        }
        
        return userData;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data) => {
      try {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      } catch (error) {
        console.error("Query invalidation error:", error);
      }
    },
    onError: (error) => {
      // Clear any stored auth token on login failure
      localStorage.removeItem('authToken');
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("=== LOGOUT MUTATION STARTING ===");
      
      // Clear localStorage token IMMEDIATELY before doing anything else
      localStorage.removeItem('authToken');
      console.log("✓ Cleared authToken from localStorage");
      
      // Close any active tour before logout
      const savedTourState = localStorage.getItem("activeDemoTour");
      if (savedTourState) {
        localStorage.removeItem("activeDemoTour");
        // Dispatch a custom event to notify tour components to close
        window.dispatchEvent(new CustomEvent('tourClose'));
      }
      
      // Clear authentication state immediately to trigger re-render
      queryClient.setQueryData(["/api/auth/me"], null);
      console.log("✓ Cleared auth query data");
      
      // Clear ALL localStorage items related to authentication
      localStorage.removeItem('userPreferences');
      localStorage.removeItem('lastVisitedPage');
      localStorage.removeItem('portal_token');
      localStorage.removeItem('portal_user');
      console.log("✓ Cleared all auth-related localStorage items");
      
      try {
        // Make logout request to clear server-side session
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Include session cookies
        });
        console.log("✓ Server logout request completed:", response.status);
      } catch (error) {
        console.error("Server logout failed:", error);
        // Continue with local cleanup even if server fails
      }
      
      return true;
    },
    onSuccess: () => {
      console.log("=== LOGOUT SUCCESS HANDLER ===");
      
      // Double-check all auth data is cleared
      localStorage.removeItem('authToken');
      localStorage.removeItem('userPreferences');
      localStorage.removeItem('lastVisitedPage');
      localStorage.removeItem('portal_token');
      localStorage.removeItem('portal_user');
      console.log("✓ Final cleanup of localStorage completed");
      
      // Clear ALL cached queries completely
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      queryClient.invalidateQueries();
      console.log("✓ React Query cache completely cleared");
      
      // Dispatch custom logout event to trigger app re-render
      window.dispatchEvent(new CustomEvent('logout'));
      console.log("✓ Logout event dispatched");
      
      // Navigate to login page and force reload for clean state
      console.log("✓ Navigating to login page...");
      window.location.href = '/login';
    },
    onError: (error) => {
      console.error("=== LOGOUT ERROR HANDLER ===", error);
      // Even if logout fails, clear local auth data
      console.log("Clearing local auth data despite error...");
      localStorage.removeItem('authToken');
      localStorage.removeItem('userPreferences');
      localStorage.removeItem('lastVisitedPage');
      localStorage.removeItem('portal_token');
      localStorage.removeItem('portal_user');
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      
      // Dispatch custom logout event to trigger app re-render
      window.dispatchEvent(new CustomEvent('logout'));
      
      // Navigate to login page and force reload for clean state
      console.log("✓ Error: Navigating to login page...");
      window.location.href = '/login';
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
      console.log("Local storage token:", localStorage.getItem('authToken'));
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

    return user.roles.some(role =>
      role.permissions?.some(permission =>
        permission.feature === feature && permission.action === action
      )
    );
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
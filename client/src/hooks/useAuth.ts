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
      
      // Get current token BEFORE clearing it
      const currentToken = localStorage.getItem('authToken');
      console.log("✓ Current token for logout:", currentToken);
      
      // IMMEDIATELY clear authentication state to prevent any re-auth
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.setQueryData(["/api/auth/me"], undefined);
      queryClient.cancelQueries();
      queryClient.clear();
      
      // Send logout request FIRST before clearing localStorage
      try {
        if (currentToken) {
          // Make logout request to blacklist token on server
          const response = await fetch("/api/auth/logout", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${currentToken}`
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
        }
      } catch (error) {
        console.error("Server logout failed:", error);
        // Continue with local cleanup even if server fails
      }
      
      // NOW clear localStorage after server logout
      localStorage.clear(); // Nuclear option - clear everything
      sessionStorage.clear();
      console.log("✓ Nuclear clear of all storage completed");
      
      // Set a flag to prevent any re-authentication attempts
      (window as any).__LOGOUT_IN_PROGRESS__ = true;
      
      return true;
    },
    onSuccess: () => {
      console.log("=== LOGOUT SUCCESS HANDLER ===");
      
      // Ensure storage is completely clear
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear the flag  
      delete (window as any).__LOGOUT_IN_PROGRESS__;
      
      // Force hard reload to login page to ensure clean state
      console.log("✓ Hard reload to login page...");
      // Use replace to prevent back button issues
      window.location.replace('/login');
    },
    onError: (error) => {
      console.error("=== LOGOUT ERROR HANDLER ===", error);
      // Even if logout fails, clear local auth data completely
      console.log("Nuclear clear despite error...");
      localStorage.clear();
      sessionStorage.clear();
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.setQueryData(["/api/auth/me"], undefined);
      queryClient.clear();
      
      // Force immediate redirect to login page
      console.log("✓ Error: Immediate redirect to login...");
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
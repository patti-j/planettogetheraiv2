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
    staleTime: 1000 * 60 * 30, // Keep auth data fresh for 30 minutes
    gcTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchOnWindowFocus: false, // Disable to prevent infinite loops
    refetchInterval: false, // Disable auto-refetch to prevent login page issues
    // Handle 401 errors gracefully - treat as not authenticated rather than error
    queryFn: async ({ queryKey }) => {
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {};
      
      // Check if token is expired before making request
      if (token && token.startsWith('user_')) {
        const tokenParts = token.split('_');
        if (tokenParts.length >= 3) {
          const expiresAt = parseInt(tokenParts[2]);
          if (isNaN(expiresAt) || Date.now() > expiresAt) {
            // Token is expired, clear it
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            return null;
          }
        }
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
        headers,
      });

      if (res.status === 401) {
        // Clear expired tokens on 401 response
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
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
        
        // Store token in localStorage if provided
        if (userData.token) {
          localStorage.setItem('authToken', userData.token);
        }
        
        return userData;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: async (data) => {
      try {
        // Detect if user is on mobile device
        const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
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
        const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const redirectPath = isMobile ? '/mobile-home' : '/dashboard';
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 150);
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
      
      // Clear only authentication-related queries, preserve other app data
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.cancelQueries();
      
      // Only invalidate auth-related queries instead of clearing everything
      queryClient.removeQueries({ queryKey: ["/api/auth/me"] });
      queryClient.removeQueries({ predicate: query => 
        query.queryKey[0]?.toString().includes("/api/auth") ||
        query.queryKey[0]?.toString().includes("/api/users") ||
        query.queryKey[0]?.toString().includes("assigned-roles") ||
        query.queryKey[0]?.toString().includes("current-role")
      });
      
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
      
      // Clear only authentication-related items from localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isDemo');
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
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isDemo');
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
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isDemo');
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
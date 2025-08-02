import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Demo user permissions mapping
const getDemoPermissions = (roleName: string, feature: string, action: string): boolean => {
  const demoPermissions: Record<string, string[]> = {
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
      'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view'
    ],
    'Systems Manager': [
      'systems-management-view', 'role-management-view', 'user-role-assignments-view',
      'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view'
    ],
    'Administrator': [
      'role-management-view', 'systems-management-view', 'user-role-assignments-view',
      'schedule-view', 'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view'
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
      'ai-assistant-view', 'feedback-view', 'systems-management-view'
    ],
    'Maintenance Technician': [
      'maintenance-planning-view', 'reports-view',
      'ai-assistant-view', 'feedback-view'
    ]
  };

  const rolePermissions = demoPermissions[roleName] || [];
  const permissionKey = `${feature}-${action}`;
  return rolePermissions.includes(permissionKey);
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
    refetchOnWindowFocus: true,
    refetchInterval: false, // Disable auto-refetch to prevent login page issues
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      console.log("🔐 Login mutation starting for:", credentials.username);
      
      try {
        const response = await apiRequest("POST", "/api/auth/login", credentials);
        console.log("🔐 Response status:", response.status);
        console.log("🔐 Response headers:", response.headers);
        
        const userData = await response.json();
        console.log("🔐 Parsed response data:", userData);
        console.log("🔐 Token in response:", userData.token);
        
        // Store token in localStorage if provided
        if (userData.token) {
          console.log("🔐 About to store token:", userData.token);
          localStorage.setItem('authToken', userData.token);
          console.log("🔐 Token stored successfully");
        } else {
          console.log("🔐 No token in response");
        }
        
        console.log("🔐 About to return userData");
        return userData;
      } catch (error) {
        console.error("🔐 Error in mutationFn:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("🔐 Login mutation SUCCESS:", data);
      console.log("🔐 About to invalidate queries...");
      try {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        console.log("🔐 Query invalidation completed successfully");
      } catch (error) {
        console.error("🔐 Query invalidation error:", error);
      }
    },
    onError: (error) => {
      console.error("🔐 Login mutation ERROR:", error);
      console.error("🔐 Error type:", typeof error);
      console.error("🔐 Error constructor:", error?.constructor?.name);
      console.error("🔐 Error message:", error?.message);
      console.error("🔐 Error stack:", error?.stack);
      // Clear any stored auth token on login failure
      localStorage.removeItem('authToken');
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Close any active tour before logout
      const savedTourState = localStorage.getItem("activeDemoTour");
      if (savedTourState) {
        console.log("Closing active tour before logout");
        localStorage.removeItem("activeDemoTour");
        // Dispatch a custom event to notify tour components to close
        window.dispatchEvent(new CustomEvent('tourClose'));
      }
      
      return apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      // Clear localStorage token on logout
      localStorage.removeItem('authToken');
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear(); // Clear all cached data
    },
  });

  return {
    user: user as User | null,
    isLoading,
    isAuthenticated: !!user && !error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutate,
    loginError: loginMutation.error,
    isLoginPending: loginMutation.isPending,
  };
}

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (feature: string, action: string): boolean => {
    if (!user) {
      console.log("hasPermission: no user");
      return false;
    }

    console.log("hasPermission check:", { 
      feature, 
      action, 
      user: { 
        id: user.id,
        username: user.username,
        isDemo: (user as any).isDemo, 
        role: (user as any).role, 
        permissions: (user as any).permissions,
        roles: user.roles ? user.roles.length : 'undefined',
        rolesStructure: user.roles ? user.roles.map(r => ({ name: r.name, permissionCount: r.permissions?.length || 0 })) : 'no roles',
        fullUserObject: user // Log the complete user object to debug
      } 
    });

    // Handle demo users from server who have permissions array directly on user object
    if ((user as any).isDemo && (user as any).permissions && Array.isArray((user as any).permissions)) {
      const permissionKey = `${feature}-${action}`;
      const result = (user as any).permissions.includes(permissionKey);
      console.log("Demo permissions (array) result:", result, "for key:", permissionKey);
      return result;
    }

    // Handle demo users who have a simple role string instead of roles array
    if ((user as any).isDemo && (user as any).role) {
      const result = getDemoPermissions((user as any).role, feature, action);
      console.log("Demo permissions (role) result:", result);
      return result;
    }

    // Handle regular users with roles array
    if (!user.roles || !Array.isArray(user.roles)) {
      console.log("No roles array found on user object");
      return false;
    }

    const result = user.roles.some(role =>
      role.permissions?.some(permission =>
        permission.feature === feature && permission.action === action
      )
    );
    
    console.log("Regular user permission check result:", result, "for feature-action:", `${feature}-${action}`);
    
    return result;
  };

  const hasAnyPermission = (permissions: Array<{ feature: string; action: string }>): boolean => {
    return permissions.some(({ feature, action }) => hasPermission(feature, action));
  };

  const hasRole = (roleName: string): boolean => {
    if (!user) return false;

    // Handle demo users who have a simple role string
    if ((user as any).isDemo && (user as any).role) {
      return (user as any).role === roleName;
    }

    // Handle regular users with roles array
    if (!user.roles) return false;
    return user.roles.some(role => role.name === roleName);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasRole,
  };
}
// Authentication Adapter - Wraps Core Platform Module behind existing useAuth API
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { loadCorePlatformModule } from '@/lib/federation-access';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from '@/hooks/useAuth';

interface AuthAdapterContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<any>;
  logout: () => void;
  loginError: Error | null;
  isLoginPending: boolean;
}

const AuthAdapterContext = createContext<AuthAdapterContextType | undefined>(undefined);

export function AuthAdapterProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  // Initialize federation system (now using dynamic loading)
  useEffect(() => {
    // For Week 3, we don't need to pre-initialize
    // Federation will be attempted dynamically when needed
    setIsInitialized(true);
  }, []);

  // Use existing auth logic but potentially enhance with federated modules in the future
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    retryOnMount: false,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    queryFn: async ({ queryKey }) => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return null;
      }

      const res = await fetch(queryKey.join("/") as string, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        localStorage.removeItem('auth_token');
        return null;
      }

      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }

      const data = await res.json();
      let userData = data.user || data;
      
      // Apply role/permission logic (keeping existing behavior)
      if (userData && userData.roles && Array.isArray(userData.roles)) {
        // Use federated Core Platform module for user management if available
        if (isInitialized) {
          try {
            const corePlatform = await loadCorePlatformModule();
            if (corePlatform) {
              // Enhance user data with federated module if available
              const federatedUserResult = await corePlatform.getCurrentUser();
              if (federatedUserResult.success && federatedUserResult.data) {
                userData = federatedUserResult.data;
              }
            }
          } catch (error) {
            console.warn('[AuthAdapter] Federated user lookup failed, using fallback:', error);
          }
        }
      }
      
      return userData;
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
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
      
      if (userData.token) {
        localStorage.setItem('auth_token', userData.token);
      }
      
      return userData;
    },
    onSuccess: async (data) => {
      try {
        const isMobile = window.innerWidth <= 480 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const redirectPath = isMobile ? '/mobile-home' : '/home';
        
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 150);
      } catch (error) {
        console.error("Post-login processing error:", error);
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.cancelQueries();
      
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          credentials: "include",
        });
      } catch (error) {
        console.error("Server logout failed:", error);
      }
      
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      
      return true;
    },
    onSuccess: () => {
      window.location.replace('/login');
    },
  });

  const value: AuthAdapterContextType = {
    user: user as User | null,
    isLoading,
    isAuthenticated: !!user && !error,
    login: loginMutation.mutateAsync,
    logout: () => logoutMutation.mutate(),
    loginError: loginMutation.error || error,
    isLoginPending: loginMutation.isPending,
  };

  return (
    <AuthAdapterContext.Provider value={value}>
      {children}
    </AuthAdapterContext.Provider>
  );
}

export function useAuthAdapter() {
  const context = useContext(AuthAdapterContext);
  if (context === undefined) {
    throw new Error('useAuthAdapter must be used within an AuthAdapterProvider');
  }
  return context;
}
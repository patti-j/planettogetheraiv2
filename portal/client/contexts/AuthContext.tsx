import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ExternalUser, ExternalCompany } from '../../shared/schema';

interface AuthContextType {
  user: ExternalUser | null;
  company: ExternalCompany | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  updateProfile: (data: Partial<ExternalUser>) => Promise<boolean>;
}

interface LoginResult {
  success: boolean;
  user?: any;
  company?: any;
  token?: string;
  error?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExternalUser | null>(null);
  const [company, setCompany] = useState<ExternalCompany | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved auth state on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('portal_token');
    const savedUser = localStorage.getItem('portal_user');
    const savedCompany = localStorage.getItem('portal_company');

    if (savedToken && savedUser && savedCompany) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setCompany(JSON.parse(savedCompany));
      
      // Validate token with backend
      validateToken(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const response = await fetch('/api/portal/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setCompany(data.company);
      } else {
        // Token invalid, clear auth
        clearAuth();
      }
    } catch (error) {
      console.error('Token validation error:', error);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await fetch('/api/portal/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save auth state
        setToken(data.token);
        setUser(data.user);
        setCompany(data.company);
        
        localStorage.setItem('portal_token', data.token);
        localStorage.setItem('portal_user', JSON.stringify(data.user));
        localStorage.setItem('portal_company', JSON.stringify(data.company));

        return {
          success: true,
          user: data.user,
          company: data.company,
          token: data.token,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Login failed',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  };

  const logout = () => {
    clearAuth();
    window.location.href = '/portal/login';
  };

  const clearAuth = () => {
    setUser(null);
    setCompany(null);
    setToken(null);
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_user');
    localStorage.removeItem('portal_company');
  };

  const updateProfile = async (data: Partial<ExternalUser>): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch('/api/portal/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        localStorage.setItem('portal_user', JSON.stringify(updatedUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    company,
    token,
    isAuthenticated: !!token && !!user && !!company,
    isLoading,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
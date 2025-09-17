import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Query user preferences
  const { data: preferences } = useQuery<{ theme?: Theme }>({
    queryKey: user ? [`/api/user-preferences/${user.id}`] : [],
    enabled: !!user,
  });

  // Mutation to update theme preference
  const updateThemeMutation = useMutation({
    mutationFn: async (newTheme: Theme) => {
      if (!user) return;
      const response = await apiRequest('PUT', '/api/user-preferences', {
        theme: newTheme
      });
      return response.json();
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: [`/api/user-preferences/${user.id}`] });
      }
    }
  });

  // Set theme from preferences or localStorage
  useEffect(() => {
    if (preferences?.theme) {
      setThemeState(preferences.theme as Theme);
    } else {
      // Fallback to localStorage for non-authenticated users
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) {
        setThemeState(savedTheme);
      }
    }
  }, [preferences]);

  // Apply theme to document and resolve system theme
  useEffect(() => {
    const root = window.document.documentElement;
    let effectiveTheme: 'light' | 'dark' = 'light';

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      effectiveTheme = systemTheme;
    } else {
      effectiveTheme = theme as 'light' | 'dark';
    }

    // Only modify classes if the theme actually changed
    // This prevents the flash on initial load when the theme is already set in index.html
    const currentTheme = root.classList.contains('dark') ? 'dark' : 'light';
    if (currentTheme !== effectiveTheme) {
      root.classList.remove('light', 'dark');
      root.classList.add(effectiveTheme);
    }
    
    setResolvedTheme(effectiveTheme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      const root = window.document.documentElement;
      const currentTheme = root.classList.contains('dark') ? 'dark' : 'light';
      if (currentTheme !== systemTheme) {
        root.classList.remove('light', 'dark');
        root.classList.add(systemTheme);
      }
      setResolvedTheme(systemTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Save to localStorage for immediate effect
    localStorage.setItem('theme', newTheme);
    
    // Update user preferences if authenticated
    if (user) {
      updateThemeMutation.mutate(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
// Theme Adapter - Wraps Core Platform Module theme management behind existing ThemeContext API
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { loadCorePlatformModule } from '@/lib/federation-access';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuthAdapter } from './AuthAdapter';

type Theme = 'light' | 'dark' | 'system';

interface ThemeAdapterContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeAdapterContext = createContext<ThemeAdapterContextType | undefined>(undefined);

export function ThemeAdapterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthAdapter();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Get initial theme from DOM or localStorage to prevent flash
  const getInitialTheme = (): Theme => {
    const root = window.document.documentElement;
    // Check if dark class is already set (from index.html)
    if (root.classList.contains('dark')) {
      return 'dark';
    }
    // Check localStorage
    const saved = localStorage.getItem('theme') as Theme;
    return saved || 'light';
  };
  
  const initialTheme = getInitialTheme();
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(
    initialTheme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : initialTheme as 'light' | 'dark'
  );

  // Initialize federation system (now using dynamic loading)
  useEffect(() => {
    // For Week 3, we don't need to pre-initialize
    // Federation will be attempted dynamically when needed
    setIsInitialized(true);
  }, []);

  // Query user preferences
  const { data: preferences } = useQuery<{ theme?: Theme }>({
    queryKey: user ? [`/api/user-preferences/${user.id}`] : [],
    enabled: !!user,
  });

  // Mutation to update theme preference
  const updateThemeMutation = useMutation({
    mutationFn: async (newTheme: Theme) => {
      if (!user) return;
      
      // Try to use federated theme management if available
      if (isInitialized) {
        try {
          const corePlatform = await loadCorePlatformModule();
          if (corePlatform) {
            const result = await corePlatform.setTheme(newTheme);
            if (!result.success) {
              console.warn('[ThemeAdapter] Federated theme update failed:', result.error);
            }
          }
        } catch (error) {
          console.warn('[ThemeAdapter] Federated theme update failed, using fallback:', error);
        }
      }
      
      // Fallback to existing API
      const response = await apiRequest('PUT', `/api/user-preferences/${user.id}`, {
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

    // Only modify classes if the theme actually changed to prevent flash
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
    localStorage.setItem('theme', newTheme);
    
    if (user) {
      updateThemeMutation.mutate(newTheme);
    }
  };

  const value: ThemeAdapterContextType = {
    theme,
    setTheme,
    resolvedTheme
  };

  return (
    <ThemeAdapterContext.Provider value={value}>
      {children}
    </ThemeAdapterContext.Provider>
  );
}

export function useThemeAdapter() {
  const context = useContext(ThemeAdapterContext);
  if (context === undefined) {
    throw new Error('useThemeAdapter must be used within a ThemeAdapterProvider');
  }
  return context;
}
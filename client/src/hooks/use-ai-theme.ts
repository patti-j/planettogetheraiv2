import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { AIThemeColor, getAIThemeClassString } from '@/lib/ai-theme';
import { useAuth } from './useAuth';

// Function to update CSS variables immediately
const updateAIThemeCSSVariables = (theme: AIThemeColor) => {
  const root = document.documentElement;
  
  // Define HSL values for each theme
  const themeColors = {
    'purple-pink': { from: '168 85% 52%', to: '330 81% 60%' }, // purple-500 to pink-600
    'blue-indigo': { from: '213 94% 68%', to: '239 84% 67%' }, // blue-400 to indigo-500
    'emerald-teal': { from: '158 64% 52%', to: '174 83% 39%' }, // emerald-500 to teal-600
    'orange-red': { from: '24 95% 53%', to: '1 83% 63%' }, // orange-500 to red-500
    'rose-purple': { from: '330 81% 60%', to: '269 78% 62%' }, // rose-500 to purple-500
  };
  
  const colors = themeColors[theme];
  if (colors) {
    root.style.setProperty('--ai-gradient-from', colors.from);
    root.style.setProperty('--ai-gradient-to', colors.to);
  }
};

export function useAITheme() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Initialize theme synchronously from localStorage for demo users
  const [localTheme, setLocalTheme] = useState<AIThemeColor>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('demo-ai-theme') as AIThemeColor;
      const theme = savedTheme || 'purple-pink';
      // Update CSS variables immediately during initialization
      updateAIThemeCSSVariables(theme);
      return theme;
    }
    return 'purple-pink';
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Query user preferences to get AI theme
  const { data: preferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ['/api/user-preferences', user?.id],
    enabled: !!user?.id && !user?.id.toString().startsWith('demo'),
  });

  // Mutation to update AI theme
  const updateThemeMutation = useMutation({
    mutationFn: async (newTheme: AIThemeColor) => {
      if (!user?.id || user.id.toString().startsWith('demo')) {
        // For demo users, just update local state
        setLocalTheme(newTheme);
        localStorage.setItem('demo-ai-theme', newTheme);
        return newTheme;
      }
      
      const response = await apiRequest('PUT', `/api/user-preferences`, { aiThemeColor: newTheme });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-preferences'] });
    },
  });

  // Get current theme
  const currentTheme: AIThemeColor = user?.id?.toString().startsWith('demo') 
    ? localTheme 
    : (preferences?.aiThemeColor || 'purple-pink');

  // Update CSS variables whenever theme changes
  useEffect(() => {
    updateAIThemeCSSVariables(currentTheme);
  }, [currentTheme]);

  // Initialize demo theme from localStorage and set initialization state
  useEffect(() => {
    if (user?.id?.toString().startsWith('demo')) {
      // Theme already initialized from localStorage in useState
      setIsInitialized(true);
    } else if (user?.id && !preferencesLoading) {
      // For authenticated users, mark as initialized when preferences are loaded (or failed to load)
      setIsInitialized(true);
    } else if (!user?.id) {
      // For unauthenticated users, mark as initialized immediately
      setIsInitialized(true);
    }
  }, [user?.id, preferencesLoading]);

  return {
    currentTheme,
    updateTheme: updateThemeMutation.mutate,
    isUpdating: updateThemeMutation.isPending,
    isLoading: !isInitialized,
    getThemeClasses: (includeHover: boolean = true) => 
      getAIThemeClassString(currentTheme, includeHover),
    aiTheme: {
      gradient: getAIThemeClassString(currentTheme, true)
    }
  };
}
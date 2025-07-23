import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { AIThemeColor, getAIThemeClassString } from '@/lib/ai-theme';
import { useAuth } from './useAuth';

export function useAITheme() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localTheme, setLocalTheme] = useState<AIThemeColor>('purple-pink');

  // Query user preferences to get AI theme
  const { data: preferences } = useQuery({
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

  // Initialize demo theme from localStorage
  useEffect(() => {
    if (user?.id?.toString().startsWith('demo')) {
      const savedTheme = localStorage.getItem('demo-ai-theme') as AIThemeColor;
      if (savedTheme) {
        setLocalTheme(savedTheme);
      }
    }
  }, [user?.id]);

  return {
    currentTheme,
    updateTheme: updateThemeMutation.mutate,
    isUpdating: updateThemeMutation.isPending,
    getThemeClasses: (includeHover: boolean = true) => 
      getAIThemeClassString(currentTheme, includeHover),
    aiTheme: {
      gradient: getAIThemeClassString(currentTheme, true)
    }
  };
}
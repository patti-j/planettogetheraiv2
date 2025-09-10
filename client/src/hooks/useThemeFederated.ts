// Federated Theme Hook - Wraps adapter with fallback to original implementation  
import { useThemeAdapter } from '@/adapters/ThemeAdapter';
import { useTheme as useThemeOriginal } from '@/contexts/ThemeContext';

export function useTheme() {
  try {
    // Try to use federated theme adapter first
    return useThemeAdapter();
  } catch (error) {
    console.warn('[Federation] Theme adapter failed, falling back to original implementation:', error);
    // Fallback to original theme implementation
    return useThemeOriginal();
  }
}
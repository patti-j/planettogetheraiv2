// Federated Navigation Hook - Wraps adapter with fallback to original implementation
import { useNavigationAdapter } from '@/adapters/NavigationAdapter';
import { useNavigation as useNavigationOriginal } from '@/contexts/NavigationContext';

export function useNavigation() {
  try {
    // Try to use federated navigation adapter first
    return useNavigationAdapter();
  } catch (error) {
    console.warn('[Federation] Navigation adapter failed, falling back to original implementation:', error);
    // Fallback to original navigation implementation
    return useNavigationOriginal();
  }
}
// Federated Auth Hook - Wraps adapter with fallback to original implementation
import { useAuthAdapter } from '@/adapters/AuthAdapter';
import { useAuth as useAuthOriginal } from './useAuth';

export function useAuth() {
  try {
    // Try to use federated auth adapter first
    return useAuthAdapter();
  } catch (error) {
    console.warn('[Federation] Auth adapter failed, falling back to original implementation:', error);
    // Fallback to original auth implementation
    return useAuthOriginal();
  }
}

// Re-export usePermissions from original auth hook
export { usePermissions } from './useAuth';
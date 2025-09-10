// Federated Agent Hook - Wraps adapter with fallback to original implementation
import { useAgentAdapter } from '@/adapters/AgentAdapter';
import { useAgent as useAgentOriginal } from '@/contexts/AgentContext';

export function useAgent() {
  try {
    // Try to use federated agent adapter first
    return useAgentAdapter();
  } catch (error) {
    console.warn('[Federation] Agent adapter failed, falling back to original implementation:', error);
    // Fallback to original agent implementation
    return useAgentOriginal();
  }
}
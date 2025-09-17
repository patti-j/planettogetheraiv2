// Federation Access - Dynamic Loading with Graceful Fallback
// This module provides safe dynamic access to federation modules
// without causing static import resolution errors

export interface CorePlatformModule {
  getCurrentUser(): Promise<{ success: boolean; data?: any; error?: string }>;
  getUserPermissions(userId: number): Promise<{ success: boolean; data?: string[]; error?: string }>;
  setTheme(theme: string): Promise<{ success: boolean; error?: string }>;
  getCurrentTheme(): Promise<{ success: boolean; data?: string; error?: string }>;
  navigateTo(path: string): Promise<{ success: boolean; error?: string }>;
  getCurrentRoute(): Promise<{ success: boolean; data?: string; error?: string }>;
}

export interface AgentSystemModule {
  getAvailableAgents(): Promise<{ success: boolean; data?: any[]; error?: string }>;
  getCurrentAgent(): any;
  switchToAgent(agentId: string): Promise<void>;
  requestAnalysis(request: any): Promise<any>;
  getAgentCapabilities(agentId: string): Promise<{ success: boolean; data?: any[]; error?: string }>;
  sendMessageToAgent(agentId: string, message: string): Promise<{ success: boolean; data?: string; error?: string }>;
  subscribeToAgentUpdates(callback: (update: any) => void): () => void;
}

let corePlatformModuleCache: CorePlatformModule | null = null;
let agentSystemModuleCache: AgentSystemModule | null = null;
let loadingAttempted = false;

export async function loadCorePlatformModule(): Promise<CorePlatformModule | null> {
  if (corePlatformModuleCache) {
    return corePlatformModuleCache;
  }

  try {
    const { federationRegistry } = await import('../../../packages/federation-registry');
    const { isFederationInitialized } = await import('./federation-bootstrap');
    
    if (!isFederationInitialized()) {
      return null;
    }

    const module = await federationRegistry.getModule<CorePlatformModule>('core-platform');
    corePlatformModuleCache = module;
    return module;
  } catch (error) {
    return null;
  }
}

export async function loadAgentSystemModule(): Promise<AgentSystemModule | null> {
  if (agentSystemModuleCache) {
    return agentSystemModuleCache;
  }

  try {
    const { federationRegistry } = await import('../../../packages/federation-registry');
    const { isFederationInitialized } = await import('./federation-bootstrap');
    
    if (!isFederationInitialized()) {
      return null;
    }

    const module = await federationRegistry.getModule<AgentSystemModule>('agent-system');
    agentSystemModuleCache = module;
    return module;
  } catch (error) {
    return null;
  }
}

// Helper to check if federation is available
export async function isFederationAvailable(): Promise<boolean> {
  try {
    const coreModule = await loadCorePlatformModule();
    return coreModule !== null;
  } catch {
    return false;
  }
}

// Clear cache for testing/development
export function clearFederationCache(): void {
  corePlatformModuleCache = null;
  agentSystemModuleCache = null;
  loadingAttempted = false;
}
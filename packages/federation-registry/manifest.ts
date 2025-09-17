// Federation Module Manifest  
import { federationRegistry, createModuleFactory } from './index';

// Simplified interfaces for initial federation
interface CorePlatformContract {
  getCurrentUser(): Promise<{ success: boolean; data?: any; error?: string }>;
  getUserPermissions(userId: number): Promise<{ success: boolean; data?: string[]; error?: string }>;
  setTheme(theme: string): Promise<{ success: boolean; error?: string }>;
  getCurrentTheme(): Promise<{ success: boolean; data?: string; error?: string }>;
  navigateTo(path: string): Promise<{ success: boolean; error?: string }>;
  getCurrentRoute(): Promise<{ success: boolean; data?: string; error?: string }>;
}

interface AgentSystemContract {
  getAvailableAgents(): Promise<{ success: boolean; data?: any[]; error?: string }>;
  getCurrentAgent(): any;
  switchToAgent(agentId: string): Promise<void>;
  requestAnalysis(request: any): Promise<any>;
  getAgentCapabilities(agentId: string): Promise<{ success: boolean; data?: any[]; error?: string }>;
  sendMessageToAgent(agentId: string, message: string): Promise<{ success: boolean; data?: string; error?: string }>;
  subscribeToAgentUpdates(callback: (update: any) => void): () => void;
}

// Register Core Platform Module using singleton
federationRegistry.register({
  metadata: {
    id: 'core-platform',
    name: 'Core Platform Module',
    version: '1.0.0',
    dependencies: [],
    contract: 'CorePlatformContract'
  },
  factory: createModuleFactory(() => 
    import('../core-platform/CorePlatformModule').then(m => m.corePlatformModule || new m.CorePlatformModule())
  )
});

// Register Agent System Module using singleton
federationRegistry.register({
  metadata: {
    id: 'agent-system',
    name: 'Agent System Module', 
    version: '1.0.0',
    dependencies: [],
    contract: 'AgentSystemContract'
  },
  factory: createModuleFactory(() =>
    import('../agent-system/AgentSystemModule').then(m => m.agentSystemModule || new m.AgentSystemModule())
  )
});

// Module accessor functions with type safety
export async function getCorePlatformModule(): Promise<CorePlatformContract> {
  return federationRegistry.getModule<CorePlatformContract>('core-platform');
}

export async function getAgentSystemModule(): Promise<AgentSystemContract> {
  return federationRegistry.getModule<AgentSystemContract>('agent-system');
}

// Initialize all core modules
export async function initializeCoreModules(): Promise<void> {
  try {
    // Load core platform first (no dependencies)
    await getCorePlatformModule();
    
    // Load agent system
    await getAgentSystemModule();
  } catch (error) {
    console.error('[Federation] Failed to initialize core modules:', error);
    throw error;
  }
}

// Export registry for external access
export { federationRegistry };
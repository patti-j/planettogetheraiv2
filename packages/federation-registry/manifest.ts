// Federation Module Manifest  
import { federationRegistry, createModuleFactory } from './index';
import type { 
  CorePlatformContract, 
  AgentSystemContract 
} from '@planettogether/shared-components/contracts/module-contracts';

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
  console.log('[Federation] Initializing core modules...');
  
  try {
    // Load core platform first (no dependencies)
    await getCorePlatformModule();
    
    // Load agent system
    await getAgentSystemModule();
    
    console.log('[Federation] All core modules initialized successfully');
  } catch (error) {
    console.error('[Federation] Failed to initialize core modules:', error);
    throw error;
  }
}

// Export registry for external access
export { federationRegistry };
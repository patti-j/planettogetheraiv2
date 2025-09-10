// Federation System Bootstrap (Week 3 - Graceful fallback mode)
// During Week 3, federation initialization is disabled to focus on adapter integration
// The adapters will automatically fall back to existing implementations

let initializationPromise: Promise<void> | null = null;
let isInitialized = false;

export async function initializeFederation(): Promise<void> {
  // Return existing promise if already initializing
  if (initializationPromise) {
    return initializationPromise;
  }

  // Return immediately if already initialized
  if (isInitialized) {
    return Promise.resolve();
  }

  console.log('[Federation] Initializing full federation system...');

  initializationPromise = (async () => {
    try {
      // Import federation registry and modules
      const { federationRegistry, createAsyncModuleFactory } = await import('../../../packages/federation-registry');
      
      console.log('[Federation] Registering Core Platform module...');
      // Register Core Platform module
      federationRegistry.register({
        metadata: {
          id: 'core-platform',
          name: 'Core Platform Module',
          version: '1.0.0',
          dependencies: [],
          contract: 'CorePlatformContract'
        },
        factory: createAsyncModuleFactory(async () => {
          const module = await import('../../../packages/core-platform/CorePlatformModule');
          return { default: module.CorePlatformModule };
        })
      });

      console.log('[Federation] Registering Agent System module...');
      // Register Agent System module
      federationRegistry.register({
        metadata: {
          id: 'agent-system',
          name: 'Agent System Module',
          version: '1.0.0',
          dependencies: ['core-platform'],
          contract: 'AgentSystemContract'
        },
        factory: createAsyncModuleFactory(async () => {
          const module = await import('../../../packages/agent-system/AgentSystemModule');
          return { default: module.AgentSystemModule };
        })
      });
      
      console.log('[Federation] All modules registered successfully');
      isInitialized = true;
    } catch (error) {
      console.error('[Federation] Initialization failed:', error);
      // Fall back to non-federated mode on error
      isInitialized = false;
      throw error;
    }
  })();

  return initializationPromise;
}

export function isFederationInitialized(): boolean {
  return isInitialized;
}
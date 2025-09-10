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

  console.log('[Federation] Week 3 - Using graceful fallback mode, federation disabled');

  initializationPromise = (async () => {
    try {
      // For Week 3, we skip actual federation initialization
      // and let adapters fall back to existing implementations
      console.log('[Federation] Fallback mode - adapters will use existing implementations');
      isInitialized = false; // Keep this false to ensure adapters always use fallbacks
    } catch (error) {
      console.error('[Federation] Fallback mode initialization failed:', error);
      throw error;
    }
  })();

  return initializationPromise;
}

export function isFederationInitialized(): boolean {
  return isInitialized;
}
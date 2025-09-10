// Federation System Bootstrap
import { initializeCoreModules } from '../../../packages/shared-components';

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

  console.log('[Federation] Starting initialization...');

  initializationPromise = (async () => {
    try {
      await initializeCoreModules();
      isInitialized = true;
      console.log('[Federation] Successfully initialized all core modules');
    } catch (error) {
      console.error('[Federation] Failed to initialize core modules:', error);
      throw error;
    }
  })();

  return initializationPromise;
}

export function isFederationInitialized(): boolean {
  return isInitialized;
}
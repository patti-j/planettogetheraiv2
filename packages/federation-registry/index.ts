// Federation Registry - Dynamic Module Loading System
export interface ModuleFactory<T = any> {
  (): Promise<T>;
}

export interface ModuleMetadata {
  id: string;
  name: string;
  version: string;
  dependencies: string[];
  contract: string;
}

export interface ModuleRegistration<T = any> {
  metadata: ModuleMetadata;
  factory: ModuleFactory<T>;
  instance?: T;
}

export class FederationRegistry {
  private modules = new Map<string, ModuleRegistration>();
  private instances = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();

  register<T>(registration: ModuleRegistration<T>): void {
    console.log(`[Federation] Registering module: ${registration.metadata.id}`);
    this.modules.set(registration.metadata.id, registration);
  }

  async getModule<T>(moduleId: string): Promise<T> {
    // Return existing instance if available
    if (this.instances.has(moduleId)) {
      return this.instances.get(moduleId);
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(moduleId)) {
      return this.loadingPromises.get(moduleId);
    }

    // Start loading the module
    const loadingPromise = this.loadModule<T>(moduleId);
    this.loadingPromises.set(moduleId, loadingPromise);

    try {
      const instance = await loadingPromise;
      this.instances.set(moduleId, instance);
      this.loadingPromises.delete(moduleId);
      return instance;
    } catch (error) {
      this.loadingPromises.delete(moduleId);
      throw error;
    }
  }

  private async loadModule<T>(moduleId: string): Promise<T> {
    const registration = this.modules.get(moduleId);
    if (!registration) {
      throw new Error(`Module not found: ${moduleId}`);
    }

    console.log(`[Federation] Loading module: ${moduleId}`);

    // Check dependencies
    const dependencies: Record<string, any> = {};
    for (const depId of registration.metadata.dependencies) {
      if (!this.modules.has(depId)) {
        throw new Error(`Dependency not found: ${depId} required by ${moduleId}`);
      }
      // Ensure dependency is loaded and collect for injection
      dependencies[depId] = await this.getModule(depId);
    }

    // Load the module
    const instance = await registration.factory();
    
    // Validate contract with runtime checking
    const validatedInstance = validateContract<T>(instance, registration.metadata.contract);

    // Initialize module if it has lifecycle methods
    if (typeof (validatedInstance as any).initialize === 'function') {
      await (validatedInstance as any).initialize({
        dependencies,
        config: this.getModuleConfig(moduleId)
      });
    }

    console.log(`[Federation] Module loaded successfully: ${moduleId}`);
    return validatedInstance;
  }

  private getModuleConfig(_moduleId: string): Record<string, any> {
    // Default configuration - can be extended
    return {
      apiBaseUrl: '/api',
      theme: 'light',
      debugMode: process.env.NODE_ENV === 'development'
    };
  }

  isRegistered(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }

  isLoaded(moduleId: string): boolean {
    return this.instances.has(moduleId);
  }

  getRegisteredModules(): ModuleMetadata[] {
    return Array.from(this.modules.values()).map(reg => reg.metadata);
  }

  async unloadModule(moduleId: string): Promise<void> {
    const instance = this.instances.get(moduleId);
    if (instance && typeof instance.destroy === 'function') {
      await instance.destroy();
    }
    this.instances.delete(moduleId);
    console.log(`[Federation] Module unloaded: ${moduleId}`);
  }

  async shutdown(): Promise<void> {
    console.log('[Federation] Shutting down registry...');
    const moduleIds = Array.from(this.instances.keys());
    await Promise.all(moduleIds.map(id => this.unloadModule(id)));
  }
}

// Global registry instance
export const federationRegistry = new FederationRegistry();

// Module registration helpers
export function createModuleFactory<T>(factory: () => Promise<T>): ModuleFactory<T> {
  return factory;
}

export function createAsyncModuleFactory<T>(
  importFunction: () => Promise<{ default: new() => T }>
): ModuleFactory<T> {
  return async () => {
    const module = await importFunction();
    return new module.default();
  };
}

export function createSingletonModuleFactory<T>(
  importFunction: () => Promise<{ [key: string]: T }>
): ModuleFactory<T> {
  return async () => {
    const module = await importFunction();
    // Return the first exported instance (assumes singleton pattern)
    const exportedValues = Object.values(module);
    const instance = exportedValues.find(value => value && typeof value === 'object');
    if (!instance) {
      throw new Error('No singleton instance found in module exports');
    }
    return instance as T;
  };
}

// Contract validation utilities
const CONTRACT_METHODS: Record<string, string[]> = {
  'CorePlatformContract': [
    'getCurrentUser', 'getUserPermissions', 'getPlants', 'getPlantById',
    'navigateTo', 'getCurrentRoute', 'getTheme', 'setTheme'
  ],
  'AgentSystemContract': [
    'getAvailableAgents', 'getCurrentAgent', 'switchToAgent', 'requestAnalysis',
    'getAgentCapabilities', 'sendMessageToAgent', 'subscribeToAgentUpdates'
  ]
};

export function validateContract<T>(instance: any, contractName: string): T {
  if (!instance) {
    throw new Error(`Module instance is null/undefined for contract: ${contractName}`);
  }
  
  // Runtime contract validation
  const requiredMethods = CONTRACT_METHODS[contractName];
  if (requiredMethods) {
    const missingMethods = requiredMethods.filter(method => typeof instance[method] !== 'function');
    if (missingMethods.length > 0) {
      throw new Error(`Contract ${contractName} missing methods: ${missingMethods.join(', ')}`);
    }
  }
  
  return instance as T;
}
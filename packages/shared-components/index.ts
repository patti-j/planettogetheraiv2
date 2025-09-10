// Shared Components Module Entry Point
export * from './types';
export * from './contracts/module-contracts';

// Federation Registry System (explicit re-exports to avoid conflicts)
export { 
  FederationRegistry, 
  federationRegistry, 
  createModuleFactory, 
  createAsyncModuleFactory,
  createSingletonModuleFactory,
  validateContract
} from '../federation-registry';
export { 
  getCorePlatformModule, 
  getAgentSystemModule, 
  initializeCoreModules 
} from '../federation-registry/manifest';

// Module Re-exports for Path Resolution
export { CorePlatformModule } from '../core-platform/CorePlatformModule';
export { AgentSystemModule } from '../agent-system/AgentSystemModule';

// Shared Configuration (explicit re-export to avoid conflicts)
export { 
  MANUFACTURING_AGENTS, 
  getAgentById, 
  getActiveAgents, 
  getAgentsByDepartment, 
  getAgentWelcomeMessage,
  type Agent
} from './config/agents';

// Common React imports that all modules will need
export type { FC, ReactNode, ComponentProps } from 'react';

// Module initialization utilities
export interface ModuleInitOptions {
  apiBaseUrl?: string;
  theme?: 'light' | 'dark';
  debugMode?: boolean;
}

export abstract class BaseModule {
  protected abstract name: string;
  protected initialized = false;
  
  async initialize(options?: ModuleInitOptions): Promise<void> {
    if (this.initialized) {
      console.warn(`Module ${this.name} already initialized`);
      return;
    }
    
    console.log(`[${this.name}] Initializing...`);
    await this.onInitialize(options);
    this.initialized = true;
    console.log(`[${this.name}] Initialized successfully`);
  }
  
  async destroy(): Promise<void> {
    if (!this.initialized) return;
    
    console.log(`[${this.name}] Destroying...`);
    await this.onDestroy();
    this.initialized = false;
    console.log(`[${this.name}] Destroyed`);
  }
  
  protected abstract onInitialize(options?: ModuleInitOptions): Promise<void>;
  protected abstract onDestroy(): Promise<void>;
}

// Development utilities
export const DevUtils = {
  logModuleEvent: (moduleName: string, event: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${moduleName}] ${event}`, data);
    }
  },
  
  validateContract: (contract: any, requiredMethods: string[]) => {
    const missing = requiredMethods.filter(method => typeof contract[method] !== 'function');
    if (missing.length > 0) {
      throw new Error(`Contract missing methods: ${missing.join(', ')}`);
    }
  }
};
// Shared Components Module Entry Point
export * from './types';
export * from './contracts/module-contracts';

// Re-export common utilities that will be used across modules
export { federationRegistry } from '../federation-registry';

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
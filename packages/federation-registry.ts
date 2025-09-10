// PlanetTogether Module Federation Registry
// Central registry for managing module lifecycle and communication

import type { 
  ModuleRegistration, 
  FederationEventBus,
  CorePlatformContract,
  AgentSystemContract,
  ProductionSchedulingContract,
  ShopFloorContract,
  QualityManagementContract,
  InventoryPlanningContract,
  AnalyticsReportingContract,
  SharedComponentsContract
} from './shared-components/contracts/module-contracts';

// Define ModuleEvent interface locally since it's not exported from contracts
interface ModuleEvent {
  type: string;
  source: string;
  target?: string;
  payload: any;
  timestamp: Date;
}

// Module State Management
interface ModuleState {
  id: string;
  status: 'initializing' | 'ready' | 'error' | 'stopped';
  instance?: any;
  contract?: any;
  lastError?: Error;
  dependencies: string[];
  dependents: string[];
}

// Federation Registry Implementation
export class FederationRegistry implements FederationEventBus {
  private modules = new Map<string, ModuleState>();
  private eventListeners = new Map<string, Set<Function>>();
  private sharedState = new Map<string, any>();
  private initializationOrder: string[] = [];

  constructor() {
    this.setupDefaultModules();
  }

  // Module Registration
  async registerModule(registration: ModuleRegistration): Promise<void> {
    try {
      console.log(`[Federation] Registering module: ${registration.name}`);
      
      const moduleState: ModuleState = {
        id: registration.name,
        status: 'initializing',
        dependencies: registration.dependencies,
        dependents: []
      };

      this.modules.set(registration.name, moduleState);
      
      // Check dependencies
      await this.validateDependencies(registration);
      
      // Initialize module
      await registration.initialize();
      
      moduleState.status = 'ready';
      moduleState.instance = registration;
      moduleState.contract = registration.contract;

      // Update dependents
      this.updateDependents(registration.name);
      
      // Emit module ready event
      this.emit('module:ready', { 
        moduleId: registration.name, 
        contract: registration.contract 
      });

      console.log(`[Federation] Module ${registration.name} ready`);
    } catch (error) {
      console.error(`[Federation] Failed to register ${registration.name}:`, error);
      this.setModuleError(registration.name, error as Error);
      throw error;
    }
  }

  async unregisterModule(moduleId: string): Promise<void> {
    const moduleState = this.modules.get(moduleId);
    if (!moduleState) return;

    try {
      if (moduleState.instance?.destroy) {
        await moduleState.instance.destroy();
      }
      
      this.modules.delete(moduleId);
      this.emit('module:unregistered', { moduleId });
      
      console.log(`[Federation] Module ${moduleId} unregistered`);
    } catch (error) {
      console.error(`[Federation] Error unregistering ${moduleId}:`, error);
    }
  }

  // Module Contract Access
  getModuleContract<T>(moduleId: string): T | null {
    const moduleState = this.modules.get(moduleId);
    return moduleState?.status === 'ready' ? moduleState.contract : null;
  }

  getAvailableModules(): string[] {
    return Array.from(this.modules.keys()).filter(
      id => this.modules.get(id)?.status === 'ready'
    );
  }

  isModuleReady(moduleId: string): boolean {
    return this.modules.get(moduleId)?.status === 'ready';
  }

  // Event Bus Implementation
  emit(eventType: string, payload: any, target?: string): void {
    const event: ModuleEvent = {
      type: eventType,
      source: 'federation',
      target,
      payload,
      timestamp: new Date()
    };

    if (target) {
      // Send to specific module
      const listeners = this.eventListeners.get(`${target}:${eventType}`);
      listeners?.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[Federation] Event handler error:`, error);
        }
      });
    } else {
      // Broadcast to all listeners
      const listeners = this.eventListeners.get(eventType);
      listeners?.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[Federation] Event handler error:`, error);
        }
      });
    }
  }

  subscribe(eventType: string, callback: (payload: any) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.eventListeners.get(eventType)?.delete(callback);
    };
  }

  // Module Communication
  async sendMessage(targetModule: string, message: any): Promise<any> {
    const moduleState = this.modules.get(targetModule);
    
    if (!moduleState || moduleState.status !== 'ready') {
      throw new Error(`Module ${targetModule} not available`);
    }

    // Emit message event to target module
    return new Promise((resolve, reject) => {
      const messageId = Math.random().toString(36);
      
      // Listen for response
      const unsubscribe = this.subscribe(`response:${messageId}`, (response) => {
        unsubscribe();
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.data);
        }
      });

      // Send message
      this.emit('message', { messageId, data: message }, targetModule);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Message timeout'));
      }, 30000);
    });
  }

  broadcast(message: any): void {
    this.emit('broadcast', message);
  }

  // Shared State Management
  getSharedState(key: string): any {
    return this.sharedState.get(key);
  }

  setSharedState(key: string, value: any): void {
    const oldValue = this.sharedState.get(key);
    this.sharedState.set(key, value);
    
    // Emit state change event
    this.emit('state:change', { key, value, oldValue });
  }

  syncState(moduleId: string, state: any): void {
    this.setSharedState(`module:${moduleId}`, state);
  }

  // Private Helper Methods
  private setupDefaultModules(): void {
    // Define initialization order based on dependencies
    this.initializationOrder = [
      '@planettogether/shared-components',
      '@planettogether/core-platform',
      '@planettogether/agent-system',
      '@planettogether/production-scheduling',
      '@planettogether/shop-floor',
      '@planettogether/quality-management',
      '@planettogether/inventory-planning',
      '@planettogether/analytics-reporting'
    ];
  }

  private async validateDependencies(registration: ModuleRegistration): Promise<void> {
    for (const dep of registration.dependencies) {
      if (!this.isModuleReady(dep)) {
        throw new Error(`Dependency ${dep} not available for ${registration.name}`);
      }
    }
  }

  private updateDependents(moduleId: string): void {
    for (const [id, state] of this.modules) {
      if (state.dependencies.includes(moduleId)) {
        state.dependents.push(moduleId);
      }
    }
  }

  private setModuleError(moduleId: string, error: Error): void {
    const moduleState = this.modules.get(moduleId);
    if (moduleState) {
      moduleState.status = 'error';
      moduleState.lastError = error;
    }
  }

  // Development Utilities
  getModuleStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    for (const [id, state] of this.modules) {
      status[id] = {
        status: state.status,
        dependencies: state.dependencies,
        dependents: state.dependents,
        error: state.lastError?.message
      };
    }
    
    return status;
  }

  async initializeAllModules(): Promise<void> {
    console.log('[Federation] Starting module initialization...');
    
    for (const moduleId of this.initializationOrder) {
      if (this.modules.has(moduleId)) {
        continue; // Already registered
      }
      
      try {
        // Dynamic module loading would happen here
        console.log(`[Federation] Loading module: ${moduleId}`);
        // await this.loadModule(moduleId);
      } catch (error) {
        console.error(`[Federation] Failed to load ${moduleId}:`, error);
      }
    }
  }
}

// Singleton instance
export const federationRegistry = new FederationRegistry();

// Module Contract Type Guards
export function isCoreModuleContract(contract: any): contract is CorePlatformContract {
  return contract && typeof contract.getCurrentUser === 'function';
}

export function isAgentSystemContract(contract: any): contract is AgentSystemContract {
  return contract && typeof contract.getAvailableAgents === 'function';
}

export function isProductionSchedulingContract(contract: any): contract is ProductionSchedulingContract {
  return contract && typeof contract.getJobs === 'function';
}

export function isShopFloorContract(contract: any): contract is ShopFloorContract {
  return contract && typeof contract.getCurrentOperations === 'function';
}

// Development Helper
export function createModuleProxy<T extends Record<string, any>>(moduleId: string): T {
  return new Proxy({} as T, {
    get(target, prop) {
      const contract = federationRegistry.getModuleContract<T>(moduleId);
      if (!contract) {
        throw new Error(`Module ${moduleId} not available`);
      }
      return (contract as any)[prop];
    }
  });
}
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

export interface ModuleEvent {
  type: string;
  source: string;
  target?: string;
  payload: any;
  timestamp: Date;
}

interface ModuleState {
  id: string;
  status: 'initializing' | 'ready' | 'error' | 'stopped';
  instance?: any;
  contract?: any;
  lastError?: Error;
  dependencies: string[];
  dependents: string[];
}

export class FederationRegistry {
  private modules = new Map<string, ModuleRegistration>();
  private instances = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();
  private moduleStates = new Map<string, ModuleState>();
  private eventListeners = new Map<string, Set<Function>>();
  private sharedState = new Map<string, any>();
  private initializationOrder: string[] = [];

  constructor() {
    this.setupDefaultModules();
  }

  register<T>(registration: ModuleRegistration<T>): void {
    console.log(`[Federation] Registering module: ${registration.metadata.id}`);
    this.modules.set(registration.metadata.id, registration);
    
    // Initialize module state
    const moduleState: ModuleState = {
      id: registration.metadata.id,
      status: 'initializing',
      dependencies: registration.metadata.dependencies,
      dependents: []
    };
    this.moduleStates.set(registration.metadata.id, moduleState);
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
      
      // Update module state
      const moduleState = this.moduleStates.get(moduleId);
      if (moduleState) {
        moduleState.status = 'ready';
        moduleState.instance = instance;
      }
      
      // Emit module ready event
      this.emit('module:ready', { moduleId, instance });
      
      return instance;
    } catch (error) {
      this.loadingPromises.delete(moduleId);
      this.setModuleError(moduleId, error as Error);
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
        console.warn(`[Federation] Optional dependency not found: ${depId} (continuing)`);
        continue;
      }
      // Ensure dependency is loaded and collect for injection
      try {
        dependencies[depId] = await this.getModule(depId);
      } catch (error) {
        console.warn(`[Federation] Failed to load dependency ${depId}:`, error);
      }
    }

    // Load the module
    const instance = await registration.factory();
    
    // Validate contract with runtime checking
    const validatedInstance = this.validateContract<T>(instance, registration.metadata.contract);

    // Initialize module if it has lifecycle methods
    if (typeof (validatedInstance as any).initialize === 'function') {
      await (validatedInstance as any).initialize({
        dependencies,
        config: this.getModuleConfig(moduleId),
        eventBus: this
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
    const moduleState = this.moduleStates.get(targetModule);
    
    if (!moduleState || moduleState.status !== 'ready') {
      throw new Error(`Module ${targetModule} not available`);
    }

    // Emit message event to target module
    return new Promise((resolve, reject) => {
      const messageId = Math.random().toString(36);
      
      // Listen for response with timeout
      let timeoutId: NodeJS.Timeout;
      const unsubscribe = this.subscribe(`response:${messageId}`, (response) => {
        clearTimeout(timeoutId);
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
      timeoutId = setTimeout(() => {
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

  // Module Management
  isRegistered(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }

  isLoaded(moduleId: string): boolean {
    return this.instances.has(moduleId);
  }

  isModuleReady(moduleId: string): boolean {
    return this.moduleStates.get(moduleId)?.status === 'ready';
  }

  getRegisteredModules(): ModuleMetadata[] {
    return Array.from(this.modules.values()).map(reg => reg.metadata);
  }

  getAvailableModules(): string[] {
    return Array.from(this.moduleStates.keys()).filter(
      id => this.moduleStates.get(id)?.status === 'ready'
    );
  }

  async unloadModule(moduleId: string): Promise<void> {
    const instance = this.instances.get(moduleId);
    if (instance && typeof instance.destroy === 'function') {
      await instance.destroy();
    }
    this.instances.delete(moduleId);
    this.moduleStates.delete(moduleId);
    
    this.emit('module:unregistered', { moduleId });
    console.log(`[Federation] Module unloaded: ${moduleId}`);
  }

  async shutdown(): Promise<void> {
    console.log('[Federation] Shutting down registry...');
    const moduleIds = Array.from(this.instances.keys());
    await Promise.all(moduleIds.map(id => this.unloadModule(id)));
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

  private setModuleError(moduleId: string, error: Error): void {
    const moduleState = this.moduleStates.get(moduleId);
    if (moduleState) {
      moduleState.status = 'error';
      moduleState.lastError = error;
    }
  }

  // Development Utilities
  getModuleStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    for (const [id, state] of this.moduleStates) {
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
      if (this.isLoaded(moduleId)) {
        continue; // Already loaded
      }
      
      try {
        await this.getModule(moduleId);
      } catch (error) {
        console.error(`[Federation] Failed to load ${moduleId}:`, error);
      }
    }
  }

  // Contract validation utilities
  private validateContract<T>(instance: any, contractName: string): T {
    if (!instance) {
      throw new Error(`Module instance is null/undefined for contract: ${contractName}`);
    }
    
    // Lightweight runtime shape check
    const CONTRACT_METHODS: Record<string, string[]> = {
      'CorePlatformContract': [
        'getCurrentUser', 'getUserPermissions', 'getPlants', 'getPlantById',
        'navigateTo', 'getCurrentRoute', 'getTheme', 'setTheme'
      ],
      'AgentSystemContract': [
        'getAvailableAgents', 'getCurrentAgent', 'switchToAgent', 'requestAnalysis',
        'getAgentCapabilities', 'sendMessageToAgent', 'subscribeToAgentUpdates'
      ],
      'ProductionSchedulingContract': [
        'getJobs', 'getJobById', 'updateJob', 'createJob',
        'getJobOperations', 'updateOperation', 'scheduleOperation',
        'getResources', 'getResourceUtilization', 'optimizeSchedule', 
        'detectBottlenecks', 'onScheduleUpdate', 'onJobStatusChange'
      ],
      'ShopFloorContract': [
        'getCurrentOperations', 'updateOperationStatus', 'reportProgress',
        'getEquipmentStatus', 'reportEquipmentIssue', 'getOperatorTasks',
        'completeTask', 'onOperationStatusChange', 'onEquipmentAlert'
      ],
      'QualityManagementContract': [
        'getInspections', 'createInspection', 'updateInspectionResults',
        'getQualityStandards', 'validateQuality', 'getQualityMetrics',
        'getDefectAnalysis', 'onQualityAlert', 'onInspectionComplete'
      ],
      'InventoryPlanningContract': [
        'getInventoryItems', 'updateInventoryLevel', 'getInventoryTransactions',
        'getDemandForecast', 'updateForecast', 'getReorderRecommendations',
        'calculateSafetyStock', 'onStockLevelChange', 'onReorderAlert'
      ],
      'AnalyticsReportingContract': [
        'getKPIs', 'calculateKPI', 'getDashboards', 'createDashboard',
        'updateDashboard', 'generateReport', 'exportReport',
        'subscribeToMetricUpdates', 'getRealtimeData'
      ]
    };
    
    // Runtime contract validation
    const requiredMethods = CONTRACT_METHODS[contractName];
    if (requiredMethods) {
      const missingMethods = requiredMethods.filter(method => typeof instance[method] !== 'function');
      if (missingMethods.length > 0) {
        console.warn(`[Federation] Contract ${contractName} missing methods: ${missingMethods.join(', ')}`);
      }
    }
    
    return instance as T;
  }
}

// Module registration helpers
export function createModuleFactory<T>(factory: () => Promise<T>): ModuleFactory<T> {
  return factory;
}

// Global registry instance
export const federationRegistry = new FederationRegistry();

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
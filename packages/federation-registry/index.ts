// Federation Registry - Dynamic Module Loading System with Performance Optimization
import { 
  performanceMonitor,
  trackModuleLoad,
  trackMethodPerformance,
  markTiming,
  measureTiming,
  cleanupModulePerformance,
  preloadCriticalModules,
  type ModuleLoadingOptions
} from '../federation-performance';

export interface ModuleFactory<T = any> {
  (): Promise<T>;
}

export interface ModuleMetadata {
  id: string;
  name: string;
  version: string;
  dependencies: string[];
  contract: string;
  priority?: 'high' | 'normal' | 'low';
  preload?: boolean;
  cacheable?: boolean;
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
  status: 'initializing' | 'ready' | 'error' | 'stopped' | 'preloading';
  instance?: any;
  contract?: any;
  lastError?: Error;
  dependencies: string[];
  dependents: string[];
  lastAccessTime?: number;
}

export class FederationRegistry {
  private modules = new Map<string, ModuleRegistration>();
  private instances = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();
  private moduleStates = new Map<string, ModuleState>();
  private eventListeners = new Map<string, Set<Function>>();
  private sharedState = new Map<string, any>();
  private initializationOrder: string[] = [];
  private moduleCache = new Map<string, any>();
  private preloadQueue = new Set<string>();

  constructor() {
    this.setupDefaultModules();
    this.setupPerformanceBudgets();
    this.schedulePreloading();
  }

  register<T>(registration: ModuleRegistration<T>): void {
    this.modules.set(registration.metadata.id, registration);
    
    // Initialize module state
    const moduleState: ModuleState = {
      id: registration.metadata.id,
      status: 'initializing',
      dependencies: registration.metadata.dependencies,
      dependents: [],
      lastAccessTime: Date.now()
    };
    this.moduleStates.set(registration.metadata.id, moduleState);
    
    // Schedule preloading if needed
    if (registration.metadata.preload) {
      this.preloadQueue.add(registration.metadata.id);
    }
  }

  async getModule<T>(moduleId: string): Promise<T> {
    // Update last access time
    const moduleState = this.moduleStates.get(moduleId);
    if (moduleState) {
      moduleState.lastAccessTime = Date.now();
    }

    // Return existing instance if available
    if (this.instances.has(moduleId)) {
      return this.instances.get(moduleId);
    }

    // Check cache first
    const registration = this.modules.get(moduleId);
    if (registration?.metadata.cacheable && this.moduleCache.has(moduleId)) {
      const cached = this.moduleCache.get(moduleId);
      this.instances.set(moduleId, cached);
      return cached;
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(moduleId)) {
      return this.loadingPromises.get(moduleId);
    }

    // Start loading the module with performance tracking
    const loadingOptions: ModuleLoadingOptions = {
      priority: registration?.metadata.priority || 'normal',
      cache: registration?.metadata.cacheable || false,
      preload: registration?.metadata.preload || false,
      timeout: 30000
    };
    
    const loadingPromise = this.loadModuleWithPerformance<T>(moduleId, loadingOptions);
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
      
      // Cache if needed
      if (registration?.metadata.cacheable) {
        this.moduleCache.set(moduleId, instance);
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

    // Wrap methods with performance tracking
    const instrumentedInstance = this.instrumentModule(validatedInstance, moduleId);

    // Initialize module if it has lifecycle methods
    if (typeof (instrumentedInstance as any).initialize === 'function') {
      markTiming(moduleId, 'initialization');
      await (instrumentedInstance as any).initialize({
        dependencies,
        config: this.getModuleConfig(moduleId),
        eventBus: this
      });
      const initTime = measureTiming(moduleId, 'initialization');
    }

    return instrumentedInstance;
  }

  private async loadModuleWithPerformance<T>(moduleId: string, options: ModuleLoadingOptions): Promise<T> {
    const registration = this.modules.get(moduleId);
    if (!registration) {
      throw new Error(`Module not found: ${moduleId}`);
    }

    // Use performance monitoring for module loading
    return trackModuleLoad(
      moduleId,
      async () => this.loadModule<T>(moduleId),
      options
    );
  }

  private instrumentModule<T>(instance: any, moduleId: string): T {
    if (!instance || typeof instance !== 'object') {
      return instance;
    }

    // Create a proxy to wrap all methods with performance tracking
    return new Proxy(instance, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        
        // Only wrap functions
        if (typeof value === 'function' && typeof prop === 'string') {
          // Skip internal methods
          if (prop.startsWith('_') || prop === 'constructor') {
            return value;
          }
          
          // Return wrapped method
          return trackMethodPerformance(moduleId, prop, value.bind(target));
        }
        
        return value;
      }
    });
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
    this.moduleCache.delete(moduleId);
    
    // Clean up performance tracking
    cleanupModulePerformance(moduleId);
    
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

  private setupPerformanceBudgets(): void {
    // Set performance budgets for core modules
    const coreModules = [
      '@planettogether/shared-components',
      '@planettogether/core-platform'
    ];

    coreModules.forEach(moduleId => {
      performanceMonitor.setBudget(moduleId, {
        maxInitTime: 200, // 200ms for core modules
        maxMemoryUsage: 50 * 1024 * 1024, // 50MB
        maxEventLatency: 50, // 50ms
        warningThreshold: 0.8
      });
    });

    // Set budgets for non-core modules
    const nonCoreModules = [
      '@planettogether/agent-system',
      '@planettogether/production-scheduling',
      '@planettogether/shop-floor',
      '@planettogether/quality-management',
      '@planettogether/inventory-planning',
      '@planettogether/analytics-reporting'
    ];

    nonCoreModules.forEach(moduleId => {
      performanceMonitor.setBudget(moduleId, {
        maxInitTime: 500, // 500ms for non-core modules
        maxMemoryUsage: 100 * 1024 * 1024, // 100MB
        maxEventLatency: 100, // 100ms
        warningThreshold: 0.8
      });
    });
  }

  private schedulePreloading(): void {
    // Schedule preloading of critical modules
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const criticalModules = [
          '@planettogether/shared-components',
          '@planettogether/core-platform'
        ];
        
        preloadCriticalModules(criticalModules);
        
        // Preload any modules marked for preloading
        this.preloadQueue.forEach(moduleId => {
          if (!this.isLoaded(moduleId)) {
            console.log(`[Federation] Preloading module: ${moduleId}`);
            this.getModule(moduleId).catch(error => {
              console.warn(`[Federation] Preload failed for ${moduleId}:`, error);
            });
          }
        });
      });
    }
  }

  // Parallel module loading
  async loadModulesParallel(moduleIds: string[]): Promise<Map<string, any>> {
    const modules = moduleIds.map(id => ({
      id,
      factory: () => this.getModule(id),
      options: {
        priority: this.modules.get(id)?.metadata.priority || 'normal',
        cache: this.modules.get(id)?.metadata.cacheable || false
      }
    }));

    return performanceMonitor.loadModulesParallel(modules);
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
      const perfMetrics = performanceMonitor.getMetrics(id);
      status[id] = {
        status: state.status,
        dependencies: state.dependencies,
        dependents: state.dependents,
        error: state.lastError?.message,
        lastAccessTime: state.lastAccessTime,
        performance: perfMetrics ? {
          loadTime: perfMetrics.loadTime,
          initializationTime: perfMetrics.initializationTime,
          memoryUsage: perfMetrics.memoryUsage,
          eventCount: perfMetrics.eventCount
        } : null
      };
    }
    
    return status;
  }

  // Get performance report
  getPerformanceReport() {
    return performanceMonitor.generateReport();
  }

  async initializeAllModules(): Promise<void> {
    console.log('[Federation] Starting module initialization...');
    
    // Group modules by priority for parallel loading
    const highPriority: string[] = [];
    const normalPriority: string[] = [];
    const lowPriority: string[] = [];
    
    for (const moduleId of this.initializationOrder) {
      if (this.isLoaded(moduleId)) {
        continue; // Already loaded
      }
      
      const registration = this.modules.get(moduleId);
      const priority = registration?.metadata.priority || 'normal';
      
      switch (priority) {
        case 'high':
          highPriority.push(moduleId);
          break;
        case 'low':
          lowPriority.push(moduleId);
          break;
        default:
          normalPriority.push(moduleId);
      }
    }
    
    // Load in priority order with parallel loading within each group
    if (highPriority.length > 0) {
      await this.loadModulesParallel(highPriority);
    }
    if (normalPriority.length > 0) {
      await this.loadModulesParallel(normalPriority);
    }
    if (lowPriority.length > 0) {
      await this.loadModulesParallel(lowPriority);
    }
    
    console.log('[Federation] All modules initialized');
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
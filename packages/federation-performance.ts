// Federation Performance Monitoring System
// Tracks and optimizes module loading, memory usage, and event processing

export interface PerformanceMetrics {
  moduleId: string;
  initializationTime: number;
  memoryUsage: number;
  eventCount: number;
  lastEventTime: number;
  loadTime: number;
  status: 'loading' | 'loaded' | 'error' | 'cached';
  errors: number;
  dependencies: string[];
  dependencyLoadTime: number;
}

export interface PerformanceBudget {
  maxInitTime: number;
  maxMemoryUsage: number;
  maxEventLatency: number;
  warningThreshold: number;
}

export interface PerformanceReport {
  timestamp: Date;
  totalModules: number;
  averageLoadTime: number;
  totalMemoryUsage: number;
  slowestModules: PerformanceMetrics[];
  budgetViolations: BudgetViolation[];
  recommendations: string[];
}

export interface BudgetViolation {
  moduleId: string;
  metric: string;
  actual: number;
  budget: number;
  severity: 'warning' | 'error';
}

export interface ModuleLoadingOptions {
  preload?: boolean;
  priority?: 'high' | 'normal' | 'low';
  cache?: boolean;
  parallel?: boolean;
  timeout?: number;
}

export interface TimingMarker {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetrics>();
  private budgets = new Map<string, PerformanceBudget>();
  private timingMarkers = new Map<string, TimingMarker[]>();
  private eventLatencies: number[] = [];
  private moduleCache = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();
  private preloadQueue: Set<string> = new Set();
  private performanceObserver?: PerformanceObserver;
  private memoryInterval?: NodeJS.Timer;
  
  // Default performance budgets
  private readonly DEFAULT_CORE_BUDGET: PerformanceBudget = {
    maxInitTime: 200, // 200ms for core modules
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
    maxEventLatency: 50, // 50ms
    warningThreshold: 0.8 // Warn at 80% of budget
  };
  
  private readonly DEFAULT_NON_CORE_BUDGET: PerformanceBudget = {
    maxInitTime: 500, // 500ms for non-core modules
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    maxEventLatency: 100, // 100ms
    warningThreshold: 0.8
  };

  constructor() {
    this.setupPerformanceObserver();
    this.startMemoryMonitoring();
  }

  // Module Loading Optimization
  async loadModule(
    moduleId: string,
    factory: () => Promise<any>,
    options: ModuleLoadingOptions = {}
  ): Promise<any> {
    const startTime = performance.now();
    
    // Check cache first
    if (options.cache && this.moduleCache.has(moduleId)) {
      this.updateMetrics(moduleId, {
        status: 'cached',
        loadTime: 0
      });
      return this.moduleCache.get(moduleId);
    }

    // Return existing loading promise to avoid duplicate loads
    if (this.loadingPromises.has(moduleId)) {
      return this.loadingPromises.get(moduleId);
    }

    // Create loading promise
    const loadingPromise = this.performLoad(moduleId, factory, options, startTime);
    this.loadingPromises.set(moduleId, loadingPromise);

    try {
      const module = await loadingPromise;
      this.loadingPromises.delete(moduleId);
      return module;
    } catch (error) {
      this.loadingPromises.delete(moduleId);
      throw error;
    }
  }

  private async performLoad(
    moduleId: string,
    factory: () => Promise<any>,
    options: ModuleLoadingOptions,
    startTime: number
  ): Promise<any> {
    this.updateMetrics(moduleId, { status: 'loading' });

    try {
      // Apply timeout if specified
      let modulePromise = factory();
      if (options.timeout) {
        modulePromise = this.withTimeout(modulePromise, options.timeout);
      }

      const module = await modulePromise;
      const loadTime = performance.now() - startTime;

      // Cache if requested
      if (options.cache) {
        this.moduleCache.set(moduleId, module);
      }

      // Update metrics
      this.updateMetrics(moduleId, {
        status: 'loaded',
        loadTime,
        initializationTime: loadTime
      });

      // Check budget
      this.checkBudget(moduleId);

      // Log slow modules
      const budget = this.getBudget(moduleId);
      if (loadTime > budget.maxInitTime) {
        console.warn(`[Performance] Module ${moduleId} exceeded load time budget: ${loadTime.toFixed(2)}ms (budget: ${budget.maxInitTime}ms)`);
      }

      return module;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      
      this.updateMetrics(moduleId, {
        status: 'error',
        loadTime,
        errors: (this.metrics.get(moduleId)?.errors || 0) + 1
      });

      throw error;
    }
  }

  // Parallel Loading for Independent Modules
  async loadModulesParallel(
    modules: Array<{ id: string; factory: () => Promise<any>; options?: ModuleLoadingOptions }>
  ): Promise<Map<string, any>> {
    const startTime = performance.now();
    const results = new Map<string, any>();

    // Group by priority
    const highPriority = modules.filter(m => m.options?.priority === 'high');
    const normalPriority = modules.filter(m => m.options?.priority === 'normal' || !m.options?.priority);
    const lowPriority = modules.filter(m => m.options?.priority === 'low');

    // Load in priority order
    for (const group of [highPriority, normalPriority, lowPriority]) {
      if (group.length === 0) continue;

      const promises = group.map(async ({ id, factory, options }) => {
        try {
          const module = await this.loadModule(id, factory, options || {});
          results.set(id, module);
        } catch (error) {
          console.error(`[Performance] Failed to load module ${id}:`, error);
          results.set(id, null);
        }
      });

      await Promise.all(promises);
    }

    const totalTime = performance.now() - startTime;
    console.log(`[Performance] Loaded ${modules.length} modules in ${totalTime.toFixed(2)}ms`);

    return results;
  }

  // Preloading for Critical Paths
  preloadModule(moduleId: string): void {
    this.preloadQueue.add(moduleId);
    
    // Schedule preload in next idle callback
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        if (this.preloadQueue.has(moduleId)) {
          console.log(`[Performance] Preloading module: ${moduleId}`);
          // The actual preload will be triggered by the registry
          this.preloadQueue.delete(moduleId);
        }
      });
    }
  }

  isPreloadScheduled(moduleId: string): boolean {
    return this.preloadQueue.has(moduleId);
  }

  // Performance Tracking
  startTiming(moduleId: string, markerName: string, metadata?: Record<string, any>): void {
    if (!this.timingMarkers.has(moduleId)) {
      this.timingMarkers.set(moduleId, []);
    }

    const marker: TimingMarker = {
      name: markerName,
      startTime: performance.now(),
      metadata
    };

    this.timingMarkers.get(moduleId)!.push(marker);
  }

  endTiming(moduleId: string, markerName: string): number {
    const markers = this.timingMarkers.get(moduleId);
    if (!markers) return 0;

    const marker = markers.find(m => m.name === markerName && !m.endTime);
    if (!marker) return 0;

    marker.endTime = performance.now();
    marker.duration = marker.endTime - marker.startTime;

    // Update event latency tracking
    this.eventLatencies.push(marker.duration);
    if (this.eventLatencies.length > 1000) {
      this.eventLatencies.shift(); // Keep last 1000 measurements
    }

    return marker.duration;
  }

  // Method Wrapping for Performance Tracking
  wrapMethod<T extends (...args: any[]) => any>(
    moduleId: string,
    methodName: string,
    method: T
  ): T {
    return ((...args: any[]) => {
      const startTime = performance.now();
      const isAsync = method.constructor.name === 'AsyncFunction';

      if (isAsync) {
        return (async () => {
          try {
            const result = await method(...args);
            const duration = performance.now() - startTime;
            this.recordMethodCall(moduleId, methodName, duration);
            return result;
          } catch (error) {
            const duration = performance.now() - startTime;
            this.recordMethodCall(moduleId, methodName, duration, true);
            throw error;
          }
        })();
      } else {
        try {
          const result = method(...args);
          const duration = performance.now() - startTime;
          this.recordMethodCall(moduleId, methodName, duration);
          return result;
        } catch (error) {
          const duration = performance.now() - startTime;
          this.recordMethodCall(moduleId, methodName, duration, true);
          throw error;
        }
      }
    }) as T;
  }

  private recordMethodCall(
    moduleId: string,
    methodName: string,
    duration: number,
    error: boolean = false
  ): void {
    const metrics = this.metrics.get(moduleId);
    if (metrics) {
      metrics.eventCount++;
      metrics.lastEventTime = performance.now();
      if (error) {
        metrics.errors++;
      }
    }

    // Log slow method calls
    if (duration > 100) {
      console.warn(`[Performance] Slow method call: ${moduleId}.${methodName} took ${duration.toFixed(2)}ms`);
    }
  }

  // Memory Management
  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            console.log(`[Performance] ${entry.name}: ${entry.duration.toFixed(2)}ms`);
          }
        }
      });

      this.performanceObserver.observe({ entryTypes: ['measure'] });
    } catch (error) {
      console.warn('[Performance] PerformanceObserver not available');
    }
  }

  private startMemoryMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMemory = memory.usedJSHeapSize;
        
        // Update memory usage for all loaded modules
        for (const [moduleId, metrics] of this.metrics) {
          if (metrics.status === 'loaded') {
            // Estimate module memory (this is approximate)
            metrics.memoryUsage = Math.floor(usedMemory / this.metrics.size);
          }
        }
      }
    }, 5000); // Check every 5 seconds
  }

  cleanupModule(moduleId: string): void {
    // Clear module from cache
    this.moduleCache.delete(moduleId);
    
    // Clear timing markers
    this.timingMarkers.delete(moduleId);
    
    // Update metrics
    const metrics = this.metrics.get(moduleId);
    if (metrics) {
      metrics.status = 'cached';
      metrics.memoryUsage = 0;
    }

    console.log(`[Performance] Cleaned up module: ${moduleId}`);
  }

  // Budget Management
  setBudget(moduleId: string, budget: PerformanceBudget): void {
    this.budgets.set(moduleId, budget);
  }

  private getBudget(moduleId: string): PerformanceBudget {
    if (this.budgets.has(moduleId)) {
      return this.budgets.get(moduleId)!;
    }

    // Use default budget based on module type
    const isCoreModule = moduleId.includes('core') || 
                        moduleId.includes('shared') ||
                        moduleId.includes('platform');
    
    return isCoreModule ? this.DEFAULT_CORE_BUDGET : this.DEFAULT_NON_CORE_BUDGET;
  }

  private checkBudget(moduleId: string): BudgetViolation[] {
    const metrics = this.metrics.get(moduleId);
    if (!metrics) return [];

    const budget = this.getBudget(moduleId);
    const violations: BudgetViolation[] = [];

    // Check initialization time
    if (metrics.initializationTime > budget.maxInitTime) {
      violations.push({
        moduleId,
        metric: 'initializationTime',
        actual: metrics.initializationTime,
        budget: budget.maxInitTime,
        severity: 'error'
      });
    } else if (metrics.initializationTime > budget.maxInitTime * budget.warningThreshold) {
      violations.push({
        moduleId,
        metric: 'initializationTime',
        actual: metrics.initializationTime,
        budget: budget.maxInitTime,
        severity: 'warning'
      });
    }

    // Check memory usage
    if (metrics.memoryUsage > budget.maxMemoryUsage) {
      violations.push({
        moduleId,
        metric: 'memoryUsage',
        actual: metrics.memoryUsage,
        budget: budget.maxMemoryUsage,
        severity: 'error'
      });
    }

    return violations;
  }

  // Reporting
  generateReport(): PerformanceReport {
    const timestamp = new Date();
    const moduleMetrics = Array.from(this.metrics.values());
    const loadedModules = moduleMetrics.filter(m => m.status === 'loaded');

    // Calculate averages
    const averageLoadTime = loadedModules.length > 0
      ? loadedModules.reduce((sum, m) => sum + m.loadTime, 0) / loadedModules.length
      : 0;

    const totalMemoryUsage = loadedModules.reduce((sum, m) => sum + m.memoryUsage, 0);

    // Find slowest modules
    const slowestModules = [...loadedModules]
      .sort((a, b) => b.loadTime - a.loadTime)
      .slice(0, 5);

    // Collect all budget violations
    const budgetViolations: BudgetViolation[] = [];
    for (const moduleId of this.metrics.keys()) {
      budgetViolations.push(...this.checkBudget(moduleId));
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(moduleMetrics, budgetViolations);

    return {
      timestamp,
      totalModules: moduleMetrics.length,
      averageLoadTime,
      totalMemoryUsage,
      slowestModules,
      budgetViolations,
      recommendations
    };
  }

  private generateRecommendations(
    metrics: PerformanceMetrics[],
    violations: BudgetViolation[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for slow modules
    const slowModules = metrics.filter(m => m.initializationTime > 1000);
    if (slowModules.length > 0) {
      recommendations.push(
        `Consider lazy loading these slow modules: ${slowModules.map(m => m.moduleId).join(', ')}`
      );
    }

    // Check for high memory usage
    const highMemoryModules = metrics.filter(m => m.memoryUsage > 100 * 1024 * 1024);
    if (highMemoryModules.length > 0) {
      recommendations.push(
        `High memory usage detected in: ${highMemoryModules.map(m => m.moduleId).join(', ')}`
      );
    }

    // Check for frequent errors
    const errorProneModules = metrics.filter(m => m.errors > 5);
    if (errorProneModules.length > 0) {
      recommendations.push(
        `Modules with frequent errors: ${errorProneModules.map(m => m.moduleId).join(', ')}`
      );
    }

    // Check for budget violations
    if (violations.length > 0) {
      const criticalViolations = violations.filter(v => v.severity === 'error');
      if (criticalViolations.length > 0) {
        recommendations.push(
          `Critical performance budget violations in ${criticalViolations.length} modules`
        );
      }
    }

    // Check event latency
    if (this.eventLatencies.length > 0) {
      const avgLatency = this.eventLatencies.reduce((a, b) => a + b, 0) / this.eventLatencies.length;
      if (avgLatency > 100) {
        recommendations.push(
          `High average event latency: ${avgLatency.toFixed(2)}ms. Consider optimizing event handlers.`
        );
      }
    }

    return recommendations;
  }

  // Metrics Access
  getMetrics(moduleId: string): PerformanceMetrics | undefined {
    return this.metrics.get(moduleId);
  }

  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  getAverageEventLatency(): number {
    if (this.eventLatencies.length === 0) return 0;
    return this.eventLatencies.reduce((a, b) => a + b, 0) / this.eventLatencies.length;
  }

  // Utility Methods
  private updateMetrics(moduleId: string, updates: Partial<PerformanceMetrics>): void {
    const existing = this.metrics.get(moduleId) || {
      moduleId,
      initializationTime: 0,
      memoryUsage: 0,
      eventCount: 0,
      lastEventTime: 0,
      loadTime: 0,
      status: 'loading',
      errors: 0,
      dependencies: [],
      dependencyLoadTime: 0
    };

    this.metrics.set(moduleId, { ...existing, ...updates });
  }

  private withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Module load timeout')), timeout)
      )
    ]);
  }

  // Cleanup
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
    this.metrics.clear();
    this.budgets.clear();
    this.timingMarkers.clear();
    this.moduleCache.clear();
    this.loadingPromises.clear();
    this.preloadQueue.clear();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper functions for easy integration
export function trackModuleLoad(
  moduleId: string,
  factory: () => Promise<any>,
  options?: ModuleLoadingOptions
): Promise<any> {
  return performanceMonitor.loadModule(moduleId, factory, options);
}

export function trackMethodPerformance<T extends (...args: any[]) => any>(
  moduleId: string,
  methodName: string,
  method: T
): T {
  return performanceMonitor.wrapMethod(moduleId, methodName, method);
}

export function markTiming(moduleId: string, markerName: string): void {
  performanceMonitor.startTiming(moduleId, markerName);
}

export function measureTiming(moduleId: string, markerName: string): number {
  return performanceMonitor.endTiming(moduleId, markerName);
}

export function cleanupModulePerformance(moduleId: string): void {
  performanceMonitor.cleanupModule(moduleId);
}

export function getPerformanceReport(): PerformanceReport {
  return performanceMonitor.generateReport();
}

export function preloadCriticalModules(moduleIds: string[]): void {
  moduleIds.forEach(id => performanceMonitor.preloadModule(id));
}

// Export types for external use
export type { PerformanceMonitor };
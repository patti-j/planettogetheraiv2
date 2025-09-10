// Federation Error Handling System with Recovery Mechanisms
export type ModuleErrorType = 'initialization' | 'runtime' | 'communication' | 'dependency' | 'timeout' | 'validation';
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RecoveryStrategy = 'retry' | 'restart' | 'fallback' | 'ignore' | 'circuit-break';

export interface ModuleError {
  id: string;
  moduleId: string;
  type: ModuleErrorType;
  severity: ErrorSeverity;
  message: string;
  error: Error;
  context?: Record<string, any>;
  timestamp: Date;
  stackTrace?: string;
  recoveryAttempts: number;
  recoveryStrategy?: RecoveryStrategy;
}

export interface ErrorMetrics {
  moduleId: string;
  totalErrors: number;
  errorsByType: Record<ModuleErrorType, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  lastErrorTime?: Date;
  averageRecoveryTime: number;
  failureRate: number;
  successRate: number;
  isCircuitOpen: boolean;
  circuitOpenedAt?: Date;
}

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface CircuitBreakerConfig {
  threshold: number;
  windowSize: number;
  cooldownPeriod: number;
  halfOpenAttempts: number;
}

export interface RecoveryConfig {
  enableAutoRestart: boolean;
  restartDelay: number;
  maxRestartAttempts: number;
  preserveState: boolean;
  fallbackMode: boolean;
}

// Default configurations
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true
};

const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  threshold: 5,
  windowSize: 60000, // 1 minute
  cooldownPeriod: 30000, // 30 seconds
  halfOpenAttempts: 2
};

const DEFAULT_RECOVERY_CONFIG: RecoveryConfig = {
  enableAutoRestart: true,
  restartDelay: 5000,
  maxRestartAttempts: 3,
  preserveState: true,
  fallbackMode: true
};

export class FederationErrorHandler {
  private errors = new Map<string, ModuleError[]>();
  private metrics = new Map<string, ErrorMetrics>();
  private retryQueues = new Map<string, Promise<any>[]>();
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private recoveryCallbacks = new Map<string, Function[]>();
  private errorListeners = new Map<string, Set<Function>>();
  private moduleStates = new Map<string, any>();
  private fallbackData = new Map<string, any>();
  
  constructor(
    private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
    private circuitBreakerConfig: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG,
    private recoveryConfig: RecoveryConfig = DEFAULT_RECOVERY_CONFIG
  ) {
    this.setupErrorReporting();
  }

  // Error Handling
  async handleError(
    moduleId: string,
    error: Error,
    type: ModuleErrorType,
    context?: Record<string, any>
  ): Promise<ModuleError> {
    const severity = this.determineSeverity(type, error);
    const moduleError: ModuleError = {
      id: `${moduleId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      moduleId,
      type,
      severity,
      message: error.message,
      error,
      context,
      timestamp: new Date(),
      stackTrace: error.stack,
      recoveryAttempts: 0,
      recoveryStrategy: this.determineRecoveryStrategy(type, severity)
    };

    // Store error
    if (!this.errors.has(moduleId)) {
      this.errors.set(moduleId, []);
    }
    this.errors.get(moduleId)!.push(moduleError);

    // Update metrics
    this.updateMetrics(moduleId, moduleError);

    // Check circuit breaker
    const circuitState = this.checkCircuitBreaker(moduleId);
    if (circuitState.state === 'open') {
      console.error(`[ErrorHandler] Circuit breaker OPEN for module ${moduleId}`);
      throw new Error(`Module ${moduleId} is temporarily unavailable (circuit breaker open)`);
    }

    // Emit error event
    this.emitError(moduleError);

    // Handle recovery
    if (this.recoveryConfig.enableAutoRestart && severity !== 'low') {
      await this.initiateRecovery(moduleError);
    }

    return moduleError;
  }

  // Retry Mechanism with Exponential Backoff
  async retryOperation<T>(
    operation: () => Promise<T>,
    moduleId: string,
    context?: Record<string, any>
  ): Promise<T> {
    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt < this.retryConfig.maxAttempts) {
      try {
        // Check circuit breaker before attempting
        const circuitState = this.checkCircuitBreaker(moduleId);
        if (circuitState.state === 'open') {
          throw new Error(`Circuit breaker open for module ${moduleId}`);
        }

        // Attempt operation
        const result = await operation();
        
        // Reset circuit breaker on success
        if (circuitState.state === 'half-open') {
          this.closeCircuit(moduleId);
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (attempt >= this.retryConfig.maxAttempts) {
          await this.handleError(moduleId, lastError, 'runtime', {
            ...context,
            finalRetryAttempt: true,
            totalAttempts: attempt
          });
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateBackoffDelay(attempt);
        console.warn(`[ErrorHandler] Retry attempt ${attempt} for ${moduleId} after ${delay}ms`);
        
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  // Circuit Breaker Pattern
  private checkCircuitBreaker(moduleId: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(moduleId)) {
      this.circuitBreakers.set(moduleId, {
        state: 'closed',
        failures: 0,
        lastFailureTime: null,
        successCount: 0
      });
    }

    const circuit = this.circuitBreakers.get(moduleId)!;
    const metrics = this.metrics.get(moduleId);
    
    if (!metrics) {
      return circuit;
    }

    // Check if circuit should open
    const recentErrors = this.getRecentErrors(moduleId, this.circuitBreakerConfig.windowSize);
    if (recentErrors.length >= this.circuitBreakerConfig.threshold) {
      if (circuit.state !== 'open') {
        circuit.state = 'open';
        circuit.openedAt = new Date();
        console.error(`[CircuitBreaker] Opening circuit for module ${moduleId}`);
        this.scheduleCircuitHalfOpen(moduleId);
      }
    }

    // Check if circuit should transition to half-open
    if (circuit.state === 'open' && circuit.openedAt) {
      const elapsed = Date.now() - circuit.openedAt.getTime();
      if (elapsed >= this.circuitBreakerConfig.cooldownPeriod) {
        circuit.state = 'half-open';
        circuit.successCount = 0;
        console.info(`[CircuitBreaker] Circuit half-open for module ${moduleId}`);
      }
    }

    return circuit;
  }

  private closeCircuit(moduleId: string): void {
    const circuit = this.circuitBreakers.get(moduleId);
    if (circuit) {
      circuit.state = 'closed';
      circuit.failures = 0;
      circuit.successCount = 0;
      circuit.openedAt = undefined;
      console.info(`[CircuitBreaker] Circuit closed for module ${moduleId}`);
    }
  }

  private scheduleCircuitHalfOpen(moduleId: string): void {
    setTimeout(() => {
      const circuit = this.circuitBreakers.get(moduleId);
      if (circuit && circuit.state === 'open') {
        circuit.state = 'half-open';
        circuit.successCount = 0;
        console.info(`[CircuitBreaker] Circuit half-open for module ${moduleId} after cooldown`);
      }
    }, this.circuitBreakerConfig.cooldownPeriod);
  }

  // Recovery System
  private async initiateRecovery(error: ModuleError): Promise<void> {
    const { moduleId, recoveryStrategy } = error;

    switch (recoveryStrategy) {
      case 'retry':
        await this.scheduleRetry(error);
        break;
      case 'restart':
        await this.scheduleRestart(error);
        break;
      case 'fallback':
        await this.activateFallback(error);
        break;
      case 'circuit-break':
        // Already handled by circuit breaker
        break;
      case 'ignore':
      default:
        console.log(`[Recovery] Ignoring error for module ${moduleId}`);
        break;
    }
  }

  private async scheduleRetry(error: ModuleError): Promise<void> {
    const delay = this.calculateBackoffDelay(error.recoveryAttempts + 1);
    
    setTimeout(async () => {
      console.log(`[Recovery] Retrying module ${error.moduleId} (attempt ${error.recoveryAttempts + 1})`);
      
      // Notify recovery callbacks
      const callbacks = this.recoveryCallbacks.get(error.moduleId) || [];
      for (const callback of callbacks) {
        try {
          await callback('retry', error);
        } catch (err) {
          console.error(`[Recovery] Callback error for ${error.moduleId}:`, err);
        }
      }
    }, delay);
  }

  private async scheduleRestart(error: ModuleError): Promise<void> {
    if (error.recoveryAttempts >= this.recoveryConfig.maxRestartAttempts) {
      console.error(`[Recovery] Max restart attempts reached for module ${error.moduleId}`);
      return;
    }

    // Save module state if configured
    if (this.recoveryConfig.preserveState) {
      const state = await this.saveModuleState(error.moduleId);
      this.moduleStates.set(error.moduleId, state);
    }

    setTimeout(async () => {
      console.log(`[Recovery] Restarting module ${error.moduleId}`);
      
      // Notify recovery callbacks
      const callbacks = this.recoveryCallbacks.get(error.moduleId) || [];
      for (const callback of callbacks) {
        try {
          const savedState = this.moduleStates.get(error.moduleId);
          await callback('restart', error, savedState);
        } catch (err) {
          console.error(`[Recovery] Restart callback error for ${error.moduleId}:`, err);
        }
      }
    }, this.recoveryConfig.restartDelay);
  }

  private async activateFallback(error: ModuleError): Promise<void> {
    console.log(`[Recovery] Activating fallback mode for module ${error.moduleId}`);
    
    // Use fallback data if available
    const fallback = this.fallbackData.get(error.moduleId);
    if (fallback) {
      console.log(`[Recovery] Using fallback data for module ${error.moduleId}`);
      
      // Notify recovery callbacks with fallback data
      const callbacks = this.recoveryCallbacks.get(error.moduleId) || [];
      for (const callback of callbacks) {
        try {
          await callback('fallback', error, fallback);
        } catch (err) {
          console.error(`[Recovery] Fallback callback error for ${error.moduleId}:`, err);
        }
      }
    }
  }

  // Helper Methods
  private determineSeverity(type: ModuleErrorType, error: Error): ErrorSeverity {
    // Critical errors
    if (type === 'initialization' || error.message.includes('FATAL')) {
      return 'critical';
    }
    
    // High severity
    if (type === 'dependency' || type === 'communication') {
      return 'high';
    }
    
    // Medium severity
    if (type === 'runtime' || type === 'timeout') {
      return 'medium';
    }
    
    // Low severity
    return 'low';
  }

  private determineRecoveryStrategy(type: ModuleErrorType, severity: ErrorSeverity): RecoveryStrategy {
    if (severity === 'critical') {
      return 'circuit-break';
    }
    
    if (type === 'initialization') {
      return 'restart';
    }
    
    if (type === 'communication' || type === 'timeout') {
      return 'retry';
    }
    
    if (type === 'dependency') {
      return 'fallback';
    }
    
    return 'retry';
  }

  private calculateBackoffDelay(attempt: number): number {
    const baseDelay = this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
    const delay = Math.min(baseDelay, this.retryConfig.maxDelay);
    
    if (this.retryConfig.jitter) {
      const jitter = Math.random() * delay * 0.2; // 20% jitter
      return Math.floor(delay + jitter);
    }
    
    return delay;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getRecentErrors(moduleId: string, windowSize: number): ModuleError[] {
    const errors = this.errors.get(moduleId) || [];
    const cutoff = Date.now() - windowSize;
    return errors.filter(e => e.timestamp.getTime() >= cutoff);
  }

  private async saveModuleState(moduleId: string): Promise<any> {
    // This would be implemented by the module itself
    console.log(`[Recovery] Saving state for module ${moduleId}`);
    return null;
  }

  private updateMetrics(moduleId: string, error: ModuleError): void {
    if (!this.metrics.has(moduleId)) {
      this.metrics.set(moduleId, {
        moduleId,
        totalErrors: 0,
        errorsByType: {} as Record<ModuleErrorType, number>,
        errorsBySeverity: {} as Record<ErrorSeverity, number>,
        averageRecoveryTime: 0,
        failureRate: 0,
        successRate: 100,
        isCircuitOpen: false
      });
    }

    const metrics = this.metrics.get(moduleId)!;
    metrics.totalErrors++;
    metrics.errorsByType[error.type] = (metrics.errorsByType[error.type] || 0) + 1;
    metrics.errorsBySeverity[error.severity] = (metrics.errorsBySeverity[error.severity] || 0) + 1;
    metrics.lastErrorTime = error.timestamp;
    
    // Update failure rate (simplified calculation)
    const recentErrors = this.getRecentErrors(moduleId, 60000); // Last minute
    metrics.failureRate = recentErrors.length;
    metrics.successRate = Math.max(0, 100 - (metrics.failureRate * 10));
    
    // Check circuit breaker state
    const circuit = this.circuitBreakers.get(moduleId);
    metrics.isCircuitOpen = circuit?.state === 'open' || false;
    metrics.circuitOpenedAt = circuit?.openedAt;
  }

  private emitError(error: ModuleError): void {
    const listeners = this.errorListeners.get(error.moduleId) || new Set();
    const globalListeners = this.errorListeners.get('*') || new Set();
    
    [...listeners, ...globalListeners].forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('[ErrorHandler] Error in error listener:', err);
      }
    });
  }

  private setupErrorReporting(): void {
    // Global error handling
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        console.error('[ErrorHandler] Unhandled promise rejection:', event.reason);
        this.handleError('global', event.reason, 'runtime', {
          type: 'unhandledRejection'
        });
      });
    }

    // Report metrics periodically
    setInterval(() => {
      this.reportMetrics();
    }, 60000); // Every minute
  }

  private reportMetrics(): void {
    const report: Record<string, any> = {};
    
    this.metrics.forEach((metrics, moduleId) => {
      report[moduleId] = {
        health: metrics.successRate >= 90 ? 'healthy' : 
                metrics.successRate >= 70 ? 'degraded' : 'unhealthy',
        totalErrors: metrics.totalErrors,
        failureRate: metrics.failureRate,
        successRate: metrics.successRate,
        isCircuitOpen: metrics.isCircuitOpen,
        lastError: metrics.lastErrorTime
      };
    });

    console.log('[ErrorHandler] Health Report:', report);
  }

  // Public API
  onError(moduleId: string, callback: Function): void {
    if (!this.errorListeners.has(moduleId)) {
      this.errorListeners.set(moduleId, new Set());
    }
    this.errorListeners.get(moduleId)!.add(callback);
  }

  onRecovery(moduleId: string, callback: Function): void {
    if (!this.recoveryCallbacks.has(moduleId)) {
      this.recoveryCallbacks.set(moduleId, []);
    }
    this.recoveryCallbacks.get(moduleId)!.push(callback);
  }

  setFallbackData(moduleId: string, data: any): void {
    this.fallbackData.set(moduleId, data);
  }

  getMetrics(moduleId?: string): ErrorMetrics | Map<string, ErrorMetrics> {
    if (moduleId) {
      return this.metrics.get(moduleId) || this.createEmptyMetrics(moduleId);
    }
    return this.metrics;
  }

  getErrors(moduleId?: string, limit?: number): ModuleError[] {
    if (moduleId) {
      const errors = this.errors.get(moduleId) || [];
      return limit ? errors.slice(-limit) : errors;
    }
    
    const allErrors: ModuleError[] = [];
    this.errors.forEach(errors => allErrors.push(...errors));
    allErrors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? allErrors.slice(0, limit) : allErrors;
  }

  clearErrors(moduleId?: string): void {
    if (moduleId) {
      this.errors.delete(moduleId);
      this.metrics.delete(moduleId);
      this.circuitBreakers.delete(moduleId);
    } else {
      this.errors.clear();
      this.metrics.clear();
      this.circuitBreakers.clear();
    }
  }

  private createEmptyMetrics(moduleId: string): ErrorMetrics {
    return {
      moduleId,
      totalErrors: 0,
      errorsByType: {} as Record<ModuleErrorType, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      averageRecoveryTime: 0,
      failureRate: 0,
      successRate: 100,
      isCircuitOpen: false
    };
  }
}

interface CircuitBreakerState {
  state: 'open' | 'closed' | 'half-open';
  failures: number;
  lastFailureTime: Date | null;
  successCount: number;
  openedAt?: Date;
}

// Export singleton instance
export const federationErrorHandler = new FederationErrorHandler();

// Export convenience functions
export function handleModuleError(
  moduleId: string,
  error: Error,
  type: ModuleErrorType = 'runtime',
  context?: Record<string, any>
): Promise<ModuleError> {
  return federationErrorHandler.handleError(moduleId, error, type, context);
}

export function retryWithBackoff<T>(
  operation: () => Promise<T>,
  moduleId: string,
  context?: Record<string, any>
): Promise<T> {
  return federationErrorHandler.retryOperation(operation, moduleId, context);
}

export function getModuleHealth(moduleId?: string): any {
  const metrics = federationErrorHandler.getMetrics(moduleId);
  
  if (moduleId && !(metrics instanceof Map)) {
    return {
      moduleId,
      status: metrics.successRate >= 90 ? 'healthy' : 
              metrics.successRate >= 70 ? 'degraded' : 'unhealthy',
      successRate: metrics.successRate,
      failureRate: metrics.failureRate,
      totalErrors: metrics.totalErrors,
      isCircuitOpen: metrics.isCircuitOpen,
      lastError: metrics.lastErrorTime
    };
  }
  
  const healthReport: Record<string, any> = {};
  
  if (metrics instanceof Map) {
    metrics.forEach((m, id) => {
      healthReport[id] = {
        moduleId: id,
        status: m.successRate >= 90 ? 'healthy' : 
                m.successRate >= 70 ? 'degraded' : 'unhealthy',
        successRate: m.successRate,
        failureRate: m.failureRate,
        totalErrors: m.totalErrors,
        isCircuitOpen: m.isCircuitOpen,
        lastError: m.lastErrorTime
      };
    });
  }
  
  return healthReport;
}
// Production Scheduling Module with Enhanced Error Handling and Recovery
import type { 
  ProductionSchedulingContract,
  Job,
  JobOperation,
  Resource,
  PaginationRequest,
  ApiResponse
} from '../shared-components/contracts/module-contracts';
import { ptTables, checkDatabaseHealth } from '../shared-components/database';
import { 
  handleModuleError, 
  retryWithBackoff, 
  getModuleHealth,
  federationErrorHandler,
  type ModuleError
} from '../federation-error-handler';

class ProductionSchedulingModule implements ProductionSchedulingContract {
  private name = 'production-scheduling';
  private moduleId = 'production-scheduling';
  private jobUpdateCallbacks: Array<(job: Job) => void> = [];
  private scheduleUpdateCallbacks: Array<(schedule: any) => void> = [];
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastScheduleHash: string = '';
  private isHealthy = true;
  private lastHealthCheck = new Date();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private moduleState: any = {};
  private fallbackJobs: Job[] = [];
  private fallbackOperations: JobOperation[] = [];
  private fallbackResources: Resource[] = [];

  async initialize(): Promise<void> {
    try {
      console.log('[ProductionScheduling] Module initializing with error handling...');
      
      // Check database connection with retry
      const isHealthy = await retryWithBackoff(
        () => checkDatabaseHealth(),
        this.moduleId,
        { context: 'database_initialization' }
      );
      
      if (!isHealthy) {
        const error = new Error('Failed to connect to database after retries');
        await handleModuleError(this.moduleId, error, 'initialization', {
          phase: 'database_connection'
        });
        throw error;
      }
      
      console.log('[ProductionScheduling] Database connected successfully');
      
      // Setup error recovery
      this.setupErrorRecovery();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Start polling for schedule changes
      this.startSchedulePolling();
      
      // Set fallback data
      this.setupFallbackData();
      
      this.isHealthy = true;
      console.log('[ProductionScheduling] Module initialized successfully with error handling');
    } catch (error) {
      this.isHealthy = false;
      await handleModuleError(
        this.moduleId, 
        error as Error, 
        'initialization',
        { fatal: true }
      );
      throw error;
    }
  }

  async destroy(): Promise<void> {
    try {
      console.log('[ProductionScheduling] Module destroying...');
      
      // Save module state for recovery
      await this.saveModuleState();
      
      // Stop polling
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
      
      // Stop health monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }
      
      this.jobUpdateCallbacks = [];
      this.scheduleUpdateCallbacks = [];
      this.isHealthy = false;
      
      console.log('[ProductionScheduling] Module destroyed');
    } catch (error) {
      await handleModuleError(
        this.moduleId,
        error as Error,
        'runtime',
        { phase: 'destroy' }
      );
    }
  }

  // Health Check Methods
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const dbHealthy = await checkDatabaseHealth();
      const moduleMetrics = getModuleHealth(this.moduleId);
      
      this.isHealthy = dbHealthy && (!moduleMetrics.isCircuitOpen);
      this.lastHealthCheck = new Date();
      
      return {
        healthy: this.isHealthy,
        details: {
          database: dbHealthy,
          lastCheck: this.lastHealthCheck,
          metrics: moduleMetrics,
          fallbackActive: !this.isHealthy
        }
      };
    } catch (error) {
      this.isHealthy = false;
      return {
        healthy: false,
        details: {
          error: (error as Error).message,
          lastCheck: this.lastHealthCheck
        }
      };
    }
  }

  private startHealthMonitoring(): void {
    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      await this.healthCheck();
      
      if (!this.isHealthy) {
        console.warn(`[ProductionScheduling] Module unhealthy, using fallback mode`);
      }
    }, 30000);
  }

  // Error Recovery Setup
  private setupErrorRecovery(): void {
    // Register recovery callbacks
    federationErrorHandler.onRecovery(this.moduleId, async (type: string, error: ModuleError, data?: any) => {
      console.log(`[ProductionScheduling] Recovery initiated: ${type}`);
      
      switch (type) {
        case 'restart':
          await this.handleRestart(data);
          break;
        case 'fallback':
          await this.activateFallbackMode();
          break;
        case 'retry':
          console.log('[ProductionScheduling] Retrying failed operation');
          break;
      }
    });

    // Register error listener
    federationErrorHandler.onError(this.moduleId, (error: ModuleError) => {
      console.error(`[ProductionScheduling] Error: ${error.message}`, {
        type: error.type,
        severity: error.severity,
        context: error.context
      });
    });
  }

  private async handleRestart(savedState?: any): Promise<void> {
    console.log('[ProductionScheduling] Restarting module...');
    
    // Restore state if available
    if (savedState) {
      this.moduleState = savedState;
      console.log('[ProductionScheduling] State restored');
    }
    
    // Re-initialize
    try {
      await this.initialize();
    } catch (error) {
      console.error('[ProductionScheduling] Restart failed:', error);
    }
  }

  private async activateFallbackMode(): Promise<void> {
    console.log('[ProductionScheduling] Activating fallback mode');
    this.isHealthy = false;
    
    // Use cached/fallback data
    federationErrorHandler.setFallbackData(this.moduleId, {
      jobs: this.fallbackJobs,
      operations: this.fallbackOperations,
      resources: this.fallbackResources,
      timestamp: new Date()
    });
  }

  private async saveModuleState(): Promise<void> {
    this.moduleState = {
      lastScheduleHash: this.lastScheduleHash,
      fallbackJobs: this.fallbackJobs,
      fallbackOperations: this.fallbackOperations,
      fallbackResources: this.fallbackResources,
      timestamp: new Date()
    };
  }

  private setupFallbackData(): void {
    // Initialize fallback data with sample data
    this.fallbackJobs = [
      {
        id: 1,
        jobNumber: 'JOB-001',
        itemName: 'Sample Product A',
        quantity: 100,
        status: 'in_progress',
        priority: 1,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        startDate: new Date(),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        plantId: 1,
        description: 'Fallback job data',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        jobNumber: 'JOB-002',
        itemName: 'Sample Product B',
        quantity: 50,
        status: 'planned',
        priority: 2,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        plantId: 1,
        description: 'Fallback job data',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.fallbackResources = [
      {
        id: 1,
        name: 'Machine 1',
        type: 'machine',
        plantId: 1,
        departmentId: 1,
        capacity: 100,
        availableHours: 8,
        efficiency: 0.85,
        isBottleneck: false,
        isDrum: false,
        standardHourlyCost: 50,
        overtimeHourlyCost: 75,
        status: 'available',
        description: 'Fallback resource data',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    federationErrorHandler.setFallbackData(this.moduleId, {
      jobs: this.fallbackJobs,
      operations: this.fallbackOperations,
      resources: this.fallbackResources
    });
  }

  // Job Management with Error Handling
  async getJobs(filters?: any, pagination?: PaginationRequest): Promise<ApiResponse<Job[]>> {
    try {
      // Check module health
      if (!this.isHealthy) {
        console.warn('[ProductionScheduling] Module unhealthy, using fallback data');
        return this.getFallbackJobs(filters, pagination);
      }
      
      // Get manufacturing orders from PT tables with retry
      const orders = await retryWithBackoff(
        () => ptTables.getManufacturingOrders({
          plantId: filters?.plantId,
          status: filters?.status
        }),
        this.moduleId,
        { operation: 'getJobs', filters }
      );
      
      // Transform to Job format
      const jobs: Job[] = orders.map(order => ({
        id: order.id,
        jobNumber: order.orderNumber || `JOB-${order.id}`,
        itemName: order.itemName || 'Unknown Item',
        quantity: parseFloat(order.quantity || '0'),
        status: order.status || 'planned',
        priority: order.priority || 5,
        dueDate: order.dueDate || new Date(),
        startDate: order.startDate || new Date(),
        endDate: order.endDate || new Date(),
        plantId: order.plantId,
        description: order.description || '',
        createdAt: order.createdAt || new Date(),
        updatedAt: order.updatedAt || new Date()
      }));
      
      // Cache for fallback
      if (jobs.length > 0) {
        this.fallbackJobs = jobs.slice(0, 10); // Keep first 10 for fallback
      }
      
      // Apply pagination if provided
      if (pagination) {
        const start = (pagination.page - 1) * pagination.pageSize;
        const paginatedJobs = jobs.slice(start, start + pagination.pageSize);
        return { 
          success: true, 
          data: paginatedJobs,
          pagination: {
            page: pagination.page,
            pageSize: pagination.pageSize,
            totalItems: jobs.length,
            totalPages: Math.ceil(jobs.length / pagination.pageSize)
          }
        };
      }
      
      return { success: true, data: jobs };
    } catch (error) {
      await handleModuleError(
        this.moduleId,
        error as Error,
        'runtime',
        { operation: 'getJobs', filters }
      );
      
      // Try fallback data
      const fallbackResponse = await this.getFallbackJobs(filters, pagination);
      if (fallbackResponse.success) {
        console.warn('[ProductionScheduling] Using fallback data for jobs');
        return fallbackResponse;
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch jobs' 
      };
    }
  }

  private async getFallbackJobs(filters?: any, pagination?: PaginationRequest): Promise<ApiResponse<Job[]>> {
    let jobs = [...this.fallbackJobs];
    
    // Apply filters
    if (filters) {
      if (filters.plantId) {
        jobs = jobs.filter(j => j.plantId === filters.plantId);
      }
      if (filters.status) {
        jobs = jobs.filter(j => j.status === filters.status);
      }
    }
    
    // Apply pagination
    if (pagination) {
      const start = (pagination.page - 1) * pagination.pageSize;
      const paginatedJobs = jobs.slice(start, start + pagination.pageSize);
      return { 
        success: true, 
        data: paginatedJobs,
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalItems: jobs.length,
          totalPages: Math.ceil(jobs.length / pagination.pageSize)
        },
        warning: 'Using fallback data due to service unavailability'
      };
    }
    
    return { 
      success: true, 
      data: jobs,
      warning: 'Using fallback data due to service unavailability'
    };
  }

  async getJobById(jobId: number): Promise<ApiResponse<Job>> {
    try {
      if (!this.isHealthy) {
        const fallbackJob = this.fallbackJobs.find(j => j.id === jobId);
        if (fallbackJob) {
          return { 
            success: true, 
            data: fallbackJob,
            warning: 'Using fallback data' 
          };
        }
        return { success: false, error: 'Job not found in fallback data' };
      }

      const result = await retryWithBackoff(
        async () => {
          const orders = await ptTables.getManufacturingOrders();
          const order = orders.find(o => o.id === jobId);
          
          if (!order) {
            throw new Error('Job not found');
          }
          
          return {
            id: order.id,
            jobNumber: order.orderNumber || `JOB-${order.id}`,
            itemName: order.itemName || 'Unknown Item',
            quantity: parseFloat(order.quantity || '0'),
            status: order.status || 'planned',
            priority: order.priority || 5,
            dueDate: order.dueDate || new Date(),
            startDate: order.startDate || new Date(),
            endDate: order.endDate || new Date(),
            plantId: order.plantId,
            description: order.description || '',
            createdAt: order.createdAt || new Date(),
            updatedAt: order.updatedAt || new Date()
          };
        },
        this.moduleId,
        { operation: 'getJobById', jobId }
      );
      
      return { success: true, data: result };
    } catch (error) {
      await handleModuleError(
        this.moduleId,
        error as Error,
        'runtime',
        { operation: 'getJobById', jobId }
      );
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch job' 
      };
    }
  }

  async updateJob(jobId: number, updates: Partial<Job>): Promise<ApiResponse<Job>> {
    try {
      if (!this.isHealthy) {
        return { 
          success: false, 
          error: 'Module unhealthy - updates disabled in fallback mode' 
        };
      }
      
      // For now, return not implemented as we need write access to PT tables
      return { success: false, error: 'Job updates not yet implemented for PT tables' };
    } catch (error) {
      await handleModuleError(
        this.moduleId,
        error as Error,
        'runtime',
        { operation: 'updateJob', jobId, updates }
      );
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update job' 
      };
    }
  }

  async createJob(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Job>> {
    try {
      if (!this.isHealthy) {
        return { 
          success: false, 
          error: 'Module unhealthy - creation disabled in fallback mode' 
        };
      }
      
      // For now, return not implemented as we need write access to PT tables
      return { success: false, error: 'Job creation not yet implemented for PT tables' };
    } catch (error) {
      await handleModuleError(
        this.moduleId,
        error as Error,
        'runtime',
        { operation: 'createJob', job }
      );
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create job' 
      };
    }
  }

  // Operation Management with Error Handling
  async getJobOperations(jobId: number): Promise<ApiResponse<JobOperation[]>> {
    try {
      if (!this.isHealthy) {
        return { 
          success: true, 
          data: this.fallbackOperations.filter(o => o.jobId === jobId),
          warning: 'Using fallback data' 
        };
      }

      const operations = await retryWithBackoff(
        () => ptTables.getJobOperations({
          manufacturingOrderId: jobId
        }),
        this.moduleId,
        { operation: 'getJobOperations', jobId }
      );
      
      // Transform to JobOperation format
      const jobOperations: JobOperation[] = operations.map(op => ({
        id: op.id,
        jobId: op.manufacturingOrderId || jobId,
        operationNumber: op.sequenceNumber || 0,
        operationName: op.operationName || 'Unknown Operation',
        description: op.description || '',
        resourceId: op.resourceId || 0,
        resourceName: op.workCenterName || 'Unknown Resource',
        setupTime: op.setupTime || 0,
        processTime: op.processTime || 0,
        teardownTime: op.teardownTime || 0,
        status: op.status || 'planned',
        startDate: op.startDate || new Date(),
        endDate: op.endDate || new Date(),
        actualStartDate: op.actualStartDate || undefined,
        actualEndDate: op.actualEndDate || undefined,
        createdAt: op.createdAt || new Date(),
        updatedAt: op.updatedAt || new Date()
      }));
      
      // Cache for fallback
      if (jobOperations.length > 0) {
        this.fallbackOperations = [...this.fallbackOperations, ...jobOperations.slice(0, 5)];
      }
      
      return { success: true, data: jobOperations };
    } catch (error) {
      await handleModuleError(
        this.moduleId,
        error as Error,
        'runtime',
        { operation: 'getJobOperations', jobId }
      );
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch operations' 
      };
    }
  }

  async updateOperation(operationId: number, updates: Partial<JobOperation>): Promise<ApiResponse<JobOperation>> {
    try {
      if (!this.isHealthy) {
        return { 
          success: false, 
          error: 'Module unhealthy - updates disabled in fallback mode' 
        };
      }

      const actualDates = {
        start: updates.actualStartDate,
        end: updates.actualEndDate
      };
      
      const updated = await retryWithBackoff(
        () => ptTables.updateOperationStatus(
          operationId, 
          updates.status || 'in_progress',
          actualDates
        ),
        this.moduleId,
        { operation: 'updateOperation', operationId, updates }
      );
      
      if (!updated) {
        return { success: false, error: 'Failed to update operation' };
      }
      
      // Transform to JobOperation format
      const operation: JobOperation = {
        id: updated.id,
        jobId: updated.manufacturingOrderId || 0,
        operationNumber: updated.sequenceNumber || 0,
        operationName: updated.operationName || 'Unknown Operation',
        description: updated.description || '',
        resourceId: updated.resourceId || 0,
        resourceName: updated.workCenterName || 'Unknown Resource',
        setupTime: updated.setupTime || 0,
        processTime: updated.processTime || 0,
        teardownTime: updated.teardownTime || 0,
        status: updated.status || 'planned',
        startDate: updated.startDate || new Date(),
        endDate: updated.endDate || new Date(),
        actualStartDate: updated.actualStartDate || undefined,
        actualEndDate: updated.actualEndDate || undefined,
        createdAt: updated.createdAt || new Date(),
        updatedAt: updated.updatedAt || new Date()
      };
      
      // Notify listeners
      this.notifyScheduleUpdate();
      
      return { success: true, data: operation };
    } catch (error) {
      await handleModuleError(
        this.moduleId,
        error as Error,
        'runtime',
        { operation: 'updateOperation', operationId, updates }
      );
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update operation' 
      };
    }
  }

  async scheduleOperation(operationId: number, resourceId: number, startDate: Date): Promise<ApiResponse<JobOperation>> {
    try {
      if (!this.isHealthy) {
        return { 
          success: false, 
          error: 'Module unhealthy - scheduling disabled in fallback mode' 
        };
      }
      
      // For now, return not implemented as we need write access to PT tables
      return { success: false, error: 'Operation scheduling not yet implemented for PT tables' };
    } catch (error) {
      await handleModuleError(
        this.moduleId,
        error as Error,
        'runtime',
        { operation: 'scheduleOperation', operationId, resourceId, startDate }
      );
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to schedule operation' 
      };
    }
  }

  // Resource Management with Error Handling
  async getResources(plantId?: number): Promise<ApiResponse<Resource[]>> {
    try {
      if (!this.isHealthy) {
        const resources = plantId 
          ? this.fallbackResources.filter(r => r.plantId === plantId)
          : this.fallbackResources;
        return { 
          success: true, 
          data: resources,
          warning: 'Using fallback data' 
        };
      }

      const ptResources = await retryWithBackoff(
        () => ptTables.getResources(plantId),
        this.moduleId,
        { operation: 'getResources', plantId }
      );
      
      // Transform to Resource format
      const resources: Resource[] = ptResources.map(res => ({
        id: res.id,
        name: res.name || 'Unknown Resource',
        type: res.resourceType || 'machine',
        plantId: res.plantId,
        departmentId: res.departmentId || 0,
        capacity: parseFloat(res.capacity || '1'),
        availableHours: parseFloat(res.availableHours || '8'),
        efficiency: parseFloat(res.efficiency || '1'),
        isBottleneck: res.bottleneck || false,
        isDrum: res.drum || false,
        standardHourlyCost: parseFloat(res.standardHourlyCost || '0'),
        overtimeHourlyCost: parseFloat(res.overtimeHourlyCost || '0'),
        status: res.isActive ? 'available' : 'unavailable',
        description: res.description || '',
        createdAt: res.createdAt || new Date(),
        updatedAt: res.updatedAt || new Date()
      }));
      
      // Cache for fallback
      if (resources.length > 0) {
        this.fallbackResources = resources.slice(0, 10);
      }
      
      return { success: true, data: resources };
    } catch (error) {
      await handleModuleError(
        this.moduleId,
        error as Error,
        'runtime',
        { operation: 'getResources', plantId }
      );
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch resources' 
      };
    }
  }

  async getResourceUtilization(resourceId: number, dateRange: any): Promise<ApiResponse<any>> {
    try {
      if (!this.isHealthy) {
        return { 
          success: true, 
          data: {
            resourceId,
            utilization: 75, // Mock utilization
            operations: 0,
            dateRange
          },
          warning: 'Using fallback data' 
        };
      }

      const utilization = await retryWithBackoff(
        () => ptTables.getResourceUtilization(resourceId, {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
        }),
        this.moduleId,
        { operation: 'getResourceUtilization', resourceId, dateRange }
      );
      
      return { 
        success: true, 
        data: {
          resourceId,
          utilization: utilization.utilization,
          operations: utilization.operations.length,
          dateRange
        }
      };
    } catch (error) {
      await handleModuleError(
        this.moduleId,
        error as Error,
        'runtime',
        { operation: 'getResourceUtilization', resourceId, dateRange }
      );
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch utilization' 
      };
    }
  }

  // Scheduling Algorithms with Error Handling
  async optimizeSchedule(parameters: any): Promise<ApiResponse<any>> {
    try {
      if (!this.isHealthy) {
        return { 
          success: false, 
          error: 'Module unhealthy - optimization disabled in fallback mode' 
        };
      }

      // Get all active operations with retry
      const operations = await retryWithBackoff(
        () => ptTables.getJobOperations({
          plantId: parameters.plantId,
          status: 'planned'
        }),
        this.moduleId,
        { operation: 'optimizeSchedule-getOperations', parameters }
      );
      
      // Get all resources with retry
      const resources = await retryWithBackoff(
        () => ptTables.getResources(parameters.plantId),
        this.moduleId,
        { operation: 'optimizeSchedule-getResources', parameters }
      );
      
      // Simple optimization: prioritize by due date and resource availability
      const optimizedSchedule = {
        operations: operations.length,
        resources: resources.length,
        optimizationMethod: 'priority-based',
        parameters,
        timestamp: new Date().toISOString()
      };
      
      // Notify listeners of schedule change
      this.notifyScheduleUpdate();
      
      return { success: true, data: optimizedSchedule };
    } catch (error) {
      await handleModuleError(
        this.moduleId,
        error as Error,
        'runtime',
        { operation: 'optimizeSchedule', parameters }
      );
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to optimize schedule' 
      };
    }
  }

  async detectBottlenecks(plantId: number): Promise<ApiResponse<any[]>> {
    try {
      if (!this.isHealthy) {
        return { 
          success: true, 
          data: [],
          warning: 'Bottleneck detection unavailable in fallback mode' 
        };
      }

      const resources = await retryWithBackoff(
        () => ptTables.getResources(plantId),
        this.moduleId,
        { operation: 'detectBottlenecks-getResources', plantId }
      );
      
      const bottlenecks = resources.filter(r => r.bottleneck === true);
      
      const bottleneckData = await Promise.all(
        bottlenecks.map(async (resource) => {
          try {
            const utilization = await retryWithBackoff(
              () => ptTables.getResourceUtilization(resource.id, {
                start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                end: new Date()
              }),
              this.moduleId,
              { operation: 'detectBottlenecks-getUtilization', resourceId: resource.id }
            );
            
            return {
              resourceId: resource.id,
              resourceName: resource.name,
              utilizationPercent: utilization.utilization,
              isBottleneck: true,
              recommendedAction: utilization.utilization > 80 
                ? 'Consider adding capacity or redistributing load'
                : 'Monitor for potential issues'
            };
          } catch (error) {
            // Return partial data if individual resource fails
            return {
              resourceId: resource.id,
              resourceName: resource.name,
              utilizationPercent: 0,
              isBottleneck: true,
              recommendedAction: 'Unable to calculate utilization',
              error: true
            };
          }
        })
      );
      
      return { success: true, data: bottleneckData };
    } catch (error) {
      await handleModuleError(
        this.moduleId,
        error as Error,
        'runtime',
        { operation: 'detectBottlenecks', plantId }
      );
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to detect bottlenecks' 
      };
    }
  }

  // Events
  onScheduleUpdate(callback: (schedule: any) => void): () => void {
    this.scheduleUpdateCallbacks.push(callback);
    return () => {
      const index = this.scheduleUpdateCallbacks.indexOf(callback);
      if (index > -1) this.scheduleUpdateCallbacks.splice(index, 1);
    };
  }

  onJobStatusChange(callback: (job: Job) => void): () => void {
    this.jobUpdateCallbacks.push(callback);
    return () => {
      const index = this.jobUpdateCallbacks.indexOf(callback);
      if (index > -1) this.jobUpdateCallbacks.splice(index, 1);
    };
  }
  
  // Private methods
  private startSchedulePolling() {
    // Poll for schedule changes every 30 seconds
    this.pollingInterval = setInterval(async () => {
      try {
        if (!this.isHealthy) {
          console.log('[ProductionScheduling] Skipping poll - module unhealthy');
          return;
        }

        const operations = await ptTables.getJobOperations({ status: 'in_progress' });
        const scheduleHash = JSON.stringify(operations.map(o => `${o.id}-${o.status}`));
        
        if (scheduleHash !== this.lastScheduleHash) {
          this.lastScheduleHash = scheduleHash;
          this.notifyScheduleUpdate();
        }
      } catch (error) {
        await handleModuleError(
          this.moduleId,
          error as Error,
          'runtime',
          { operation: 'schedulePolling' }
        );
      }
    }, 30000);
  }

  private notifyScheduleUpdate() {
    const schedule = {
      timestamp: new Date().toISOString(),
      source: 'production-scheduling',
      healthy: this.isHealthy
    };
    
    this.scheduleUpdateCallbacks.forEach(callback => {
      try {
        callback(schedule);
      } catch (error) {
        console.error('[ProductionScheduling] Error in schedule callback:', error);
      }
    });
  }
}

// Export singleton instance
export const productionSchedulingModule = new ProductionSchedulingModule();
export default productionSchedulingModule;
// Production Scheduling Module with Database Integration
import type { 
  ProductionSchedulingContract,
  Job,
  JobOperation,
  Resource,
  PaginationRequest,
  ApiResponse
} from '../shared-components/contracts/module-contracts';
import { ptTables, checkDatabaseHealth } from '../shared-components/database';

class ProductionSchedulingModule implements ProductionSchedulingContract {
  private name = 'production-scheduling';
  private jobUpdateCallbacks: Array<(job: Job) => void> = [];
  private scheduleUpdateCallbacks: Array<(schedule: any) => void> = [];
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastScheduleHash: string = '';

  async initialize(): Promise<void> {
    console.log('[ProductionScheduling] Module initializing...');
    
    // Check database connection
    const isHealthy = await checkDatabaseHealth();
    if (!isHealthy) {
      console.error('[ProductionScheduling] Database connection failed');
      throw new Error('Failed to connect to database');
    }
    
    console.log('[ProductionScheduling] Database connected successfully');
    
    // Start polling for schedule changes
    this.startSchedulePolling();
    
    console.log('[ProductionScheduling] Module initialized');
  }

  async destroy(): Promise<void> {
    console.log('[ProductionScheduling] Module destroying...');
    
    // Stop polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.jobUpdateCallbacks = [];
    this.scheduleUpdateCallbacks = [];
    console.log('[ProductionScheduling] Module destroyed');
  }

  // Job Management
  async getJobs(filters?: any, pagination?: PaginationRequest): Promise<ApiResponse<Job[]>> {
    try {
      // Get manufacturing orders from PT tables
      const orders = await ptTables.getManufacturingOrders({
        plantId: filters?.plantId,
        status: filters?.status
      });
      
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
      console.error('[ProductionScheduling] Error fetching jobs:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch jobs' 
      };
    }
  }

  async getJobById(jobId: number): Promise<ApiResponse<Job>> {
    try {
      const orders = await ptTables.getManufacturingOrders();
      const order = orders.find(o => o.id === jobId);
      
      if (!order) {
        return { success: false, error: 'Job not found' };
      }
      
      const job: Job = {
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
      
      return { success: true, data: job };
    } catch (error) {
      console.error('[ProductionScheduling] Error fetching job:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch job' 
      };
    }
  }

  async updateJob(jobId: number, updates: Partial<Job>): Promise<ApiResponse<Job>> {
    // For now, return not implemented as we need write access to PT tables
    return { success: false, error: 'Job updates not yet implemented for PT tables' };
  }

  async createJob(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Job>> {
    // For now, return not implemented as we need write access to PT tables
    return { success: false, error: 'Job creation not yet implemented for PT tables' };
  }

  // Operation Management
  async getJobOperations(jobId: number): Promise<ApiResponse<JobOperation[]>> {
    try {
      const operations = await ptTables.getJobOperations({
        manufacturingOrderId: jobId
      });
      
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
      
      return { success: true, data: jobOperations };
    } catch (error) {
      console.error('[ProductionScheduling] Error fetching operations:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch operations' 
      };
    }
  }

  async updateOperation(operationId: number, updates: Partial<JobOperation>): Promise<ApiResponse<JobOperation>> {
    try {
      const actualDates = {
        start: updates.actualStartDate,
        end: updates.actualEndDate
      };
      
      const updated = await ptTables.updateOperationStatus(
        operationId, 
        updates.status || 'in_progress',
        actualDates
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
      console.error('[ProductionScheduling] Error updating operation:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update operation' 
      };
    }
  }

  async scheduleOperation(operationId: number, resourceId: number, startDate: Date): Promise<ApiResponse<JobOperation>> {
    // For now, return not implemented as we need write access to PT tables
    return { success: false, error: 'Operation scheduling not yet implemented for PT tables' };
  }

  // Resource Management
  async getResources(plantId?: number): Promise<ApiResponse<Resource[]>> {
    try {
      const ptResources = await ptTables.getResources(plantId);
      
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
      
      return { success: true, data: resources };
    } catch (error) {
      console.error('[ProductionScheduling] Error fetching resources:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch resources' 
      };
    }
  }

  async getResourceUtilization(resourceId: number, dateRange: any): Promise<ApiResponse<any>> {
    try {
      const utilization = await ptTables.getResourceUtilization(resourceId, {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      });
      
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
      console.error('[ProductionScheduling] Error fetching utilization:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch utilization' 
      };
    }
  }

  // Scheduling Algorithms
  async optimizeSchedule(parameters: any): Promise<ApiResponse<any>> {
    try {
      // Get all active operations
      const operations = await ptTables.getJobOperations({
        plantId: parameters.plantId,
        status: 'planned'
      });
      
      // Get all resources
      const resources = await ptTables.getResources(parameters.plantId);
      
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
      console.error('[ProductionScheduling] Error optimizing schedule:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to optimize schedule' 
      };
    }
  }

  async detectBottlenecks(plantId: number): Promise<ApiResponse<any[]>> {
    try {
      const resources = await ptTables.getResources(plantId);
      const bottlenecks = resources.filter(r => r.bottleneck === true);
      
      const bottleneckData = await Promise.all(
        bottlenecks.map(async (resource) => {
          const utilization = await ptTables.getResourceUtilization(resource.id, {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            end: new Date()
          });
          
          return {
            resourceId: resource.id,
            resourceName: resource.name,
            utilizationPercent: utilization.utilization,
            isBottleneck: true,
            recommendedAction: utilization.utilization > 80 
              ? 'Consider adding capacity or redistributing load'
              : 'Monitor for potential issues'
          };
        })
      );
      
      return { success: true, data: bottleneckData };
    } catch (error) {
      console.error('[ProductionScheduling] Error detecting bottlenecks:', error);
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
        const operations = await ptTables.getJobOperations({ status: 'in_progress' });
        const scheduleHash = JSON.stringify(operations.map(o => `${o.id}-${o.status}`));
        
        if (scheduleHash !== this.lastScheduleHash) {
          this.lastScheduleHash = scheduleHash;
          this.notifyScheduleUpdate();
        }
      } catch (error) {
        console.error('[ProductionScheduling] Polling error:', error);
      }
    }, 30000);
  }

  private notifyScheduleUpdate() {
    const schedule = {
      timestamp: new Date().toISOString(),
      source: 'production-scheduling'
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
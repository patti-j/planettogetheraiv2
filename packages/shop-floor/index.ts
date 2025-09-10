// Shop Floor Module with Database Integration
import type { 
  ShopFloorContract,
  JobOperation,
  ApiResponse
} from '../shared-components/contracts/module-contracts';
import { ptTables, checkDatabaseHealth } from '../shared-components/database';

class ShopFloorModule implements ShopFloorContract {
  private name = 'shop-floor';
  private operationCallbacks: Array<(operation: JobOperation) => void> = [];
  private alertCallbacks: Array<(alert: any) => void> = [];
  private statusPollingInterval: NodeJS.Timeout | null = null;
  private lastOperationStatuses: Map<number, string> = new Map();

  async initialize(): Promise<void> {
    console.log('[ShopFloor] Module initializing...');
    
    // Check database connection
    const isHealthy = await checkDatabaseHealth();
    if (!isHealthy) {
      console.error('[ShopFloor] Database connection failed');
      throw new Error('Failed to connect to database');
    }
    
    console.log('[ShopFloor] Database connected successfully');
    
    // Start polling for operation status changes
    this.startStatusPolling();
    
    console.log('[ShopFloor] Module initialized');
  }

  async destroy(): Promise<void> {
    console.log('[ShopFloor] Module destroying...');
    
    // Stop polling
    if (this.statusPollingInterval) {
      clearInterval(this.statusPollingInterval);
      this.statusPollingInterval = null;
    }
    
    this.operationCallbacks = [];
    this.alertCallbacks = [];
    this.lastOperationStatuses.clear();
    console.log('[ShopFloor] Module destroyed');
  }

  // Real-time Operations
  async getCurrentOperations(plantId: number): Promise<ApiResponse<JobOperation[]>> {
    try {
      // Get operations that are currently in progress or scheduled for today
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      
      const operations = await ptTables.getJobOperations({
        plantId,
        dateRange: { start: startOfDay, end: endOfDay }
      });
      
      // Filter for active operations
      const activeOps = operations.filter(op => 
        op.status === 'in_progress' || op.status === 'ready' || op.status === 'scheduled'
      );
      
      // Transform to JobOperation format
      const jobOperations: JobOperation[] = activeOps.map(op => ({
        id: op.id,
        jobId: op.manufacturingOrderId || 0,
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
      console.error('[ShopFloor] Error fetching current operations:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch operations' 
      };
    }
  }

  async updateOperationStatus(operationId: number, status: string): Promise<ApiResponse<JobOperation>> {
    try {
      const actualDates: any = {};
      
      // Set actual dates based on status
      if (status === 'in_progress' && !actualDates.start) {
        actualDates.start = new Date();
      } else if (status === 'completed') {
        actualDates.end = new Date();
      }
      
      const updated = await ptTables.updateOperationStatus(operationId, status, actualDates);
      
      if (!updated) {
        return { success: false, error: 'Failed to update operation status' };
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
      this.notifyOperationChange(operation);
      
      return { success: true, data: operation };
    } catch (error) {
      console.error('[ShopFloor] Error updating operation status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update status' 
      };
    }
  }

  async reportProgress(operationId: number, percentComplete: number): Promise<ApiResponse<void>> {
    try {
      // Update progress in database (could be stored in a separate progress table)
      // For now, log progress and trigger status update if complete
      console.log(`[ShopFloor] Operation ${operationId} progress: ${percentComplete}%`);
      
      if (percentComplete >= 100) {
        await this.updateOperationStatus(operationId, 'completed');
      }
      
      return { success: true };
    } catch (error) {
      console.error('[ShopFloor] Error reporting progress:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to report progress' 
      };
    }
  }

  // Equipment Monitoring
  async getEquipmentStatus(plantId: number): Promise<ApiResponse<any[]>> {
    try {
      const resources = await ptTables.getResources(plantId);
      
      // Get current operations for each resource
      const equipmentStatus = await Promise.all(
        resources.map(async (resource) => {
          const operations = await ptTables.getJobOperations({
            resourceId: resource.id,
            status: 'in_progress'
          });
          
          return {
            resourceId: resource.id,
            resourceName: resource.name || 'Unknown Resource',
            type: resource.resourceType || 'machine',
            status: operations.length > 0 ? 'busy' : 'idle',
            currentOperation: operations[0] || null,
            isBottleneck: resource.bottleneck || false,
            efficiency: parseFloat(resource.efficiency || '1'),
            utilizationToday: 0 // Would calculate from operations
          };
        })
      );
      
      return { success: true, data: equipmentStatus };
    } catch (error) {
      console.error('[ShopFloor] Error fetching equipment status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch equipment status' 
      };
    }
  }

  async reportEquipmentIssue(resourceId: number, issue: any): Promise<ApiResponse<void>> {
    try {
      // Create equipment alert
      const alert = {
        resourceId,
        issueType: issue.type || 'maintenance',
        description: issue.description || 'Equipment issue reported',
        severity: issue.severity || 'medium',
        timestamp: new Date(),
        status: 'open'
      };
      
      // Notify listeners
      this.notifyEquipmentAlert(alert);
      
      // Log the issue
      console.log('[ShopFloor] Equipment issue reported:', alert);
      
      return { success: true };
    } catch (error) {
      console.error('[ShopFloor] Error reporting equipment issue:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to report issue' 
      };
    }
  }

  // Operator Interface
  async getOperatorTasks(operatorId: string): Promise<ApiResponse<any[]>> {
    try {
      // Get operations assigned to operator (would need operator assignment table)
      // For now, return operations ready for work
      const operations = await ptTables.getJobOperations({
        status: 'ready'
      });
      
      const tasks = operations.slice(0, 5).map(op => ({
        taskId: `TASK-${op.id}`,
        operationId: op.id,
        operationName: op.operationName || 'Unknown Operation',
        jobId: op.manufacturingOrderId,
        resourceName: op.workCenterName || 'Unknown Resource',
        priority: 'normal',
        estimatedDuration: (op.processTime || 0) + (op.setupTime || 0),
        status: 'pending',
        instructions: op.description || 'Standard operation procedure'
      }));
      
      return { success: true, data: tasks };
    } catch (error) {
      console.error('[ShopFloor] Error fetching operator tasks:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch tasks' 
      };
    }
  }

  async completeTask(taskId: string): Promise<ApiResponse<void>> {
    try {
      // Extract operation ID from task ID
      const operationId = parseInt(taskId.replace('TASK-', ''));
      
      if (isNaN(operationId)) {
        return { success: false, error: 'Invalid task ID' };
      }
      
      // Update operation status to completed
      await this.updateOperationStatus(operationId, 'completed');
      
      console.log(`[ShopFloor] Task ${taskId} completed`);
      
      return { success: true };
    } catch (error) {
      console.error('[ShopFloor] Error completing task:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to complete task' 
      };
    }
  }

  // Events
  onOperationStatusChange(callback: (operation: JobOperation) => void): () => void {
    this.operationCallbacks.push(callback);
    return () => {
      const index = this.operationCallbacks.indexOf(callback);
      if (index > -1) this.operationCallbacks.splice(index, 1);
    };
  }

  onEquipmentAlert(callback: (alert: any) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) this.alertCallbacks.splice(index, 1);
    };
  }
  // Private methods
  private startStatusPolling() {
    // Poll for operation status changes every 15 seconds
    this.statusPollingInterval = setInterval(async () => {
      try {
        const operations = await ptTables.getJobOperations({
          status: 'in_progress'
        });
        
        // Check for status changes
        operations.forEach(op => {
          const lastStatus = this.lastOperationStatuses.get(op.id);
          if (lastStatus && lastStatus !== op.status) {
            // Status changed, notify listeners
            const jobOp: JobOperation = {
              id: op.id,
              jobId: op.manufacturingOrderId || 0,
              operationNumber: op.sequenceNumber || 0,
              operationName: op.operationName || 'Unknown',
              description: op.description || '',
              resourceId: op.resourceId || 0,
              resourceName: op.workCenterName || 'Unknown',
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
            };
            this.notifyOperationChange(jobOp);
          }
          this.lastOperationStatuses.set(op.id, op.status || '');
        });
      } catch (error) {
        console.error('[ShopFloor] Polling error:', error);
      }
    }, 15000);
  }

  private notifyOperationChange(operation: JobOperation) {
    this.operationCallbacks.forEach(callback => {
      try {
        callback(operation);
      } catch (error) {
        console.error('[ShopFloor] Error in operation callback:', error);
      }
    });
  }

  private notifyEquipmentAlert(alert: any) {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('[ShopFloor] Error in alert callback:', error);
      }
    });
  }
}

// Export singleton instance
export const shopFloorModule = new ShopFloorModule();
export default shopFloorModule;
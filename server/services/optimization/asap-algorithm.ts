import type { ScheduleDataPayload, ScheduleOperation } from '@/shared/schema';

/**
 * ASAP (As Soon As Possible) Scheduling Algorithm
 * Schedules all operations at their earliest possible start time
 * respecting resource availability and dependencies
 */
export class ASAPAlgorithm {
  private operations: Map<string, ScheduleOperation>;
  private dependencies: Map<string, string[]>; // operation ID -> dependent operation IDs
  private resourceSchedules: Map<string, Array<{start: Date, end: Date}>>; // resource ID -> busy periods
  
  constructor() {
    this.operations = new Map();
    this.dependencies = new Map();
    this.resourceSchedules = new Map();
  }

  /**
   * Execute ASAP scheduling algorithm
   */
  execute(scheduleData: ScheduleDataPayload): ScheduleDataPayload {
    console.log('[ASAP] Starting ASAP scheduling algorithm');
    
    // Initialize data structures
    this.initializeDataStructures(scheduleData);
    
    // Sort operations topologically based on dependencies
    const sortedOperations = this.topologicalSort(scheduleData.operations);
    
    // Schedule each operation at earliest possible time
    const scheduledOperations = this.scheduleOperations(sortedOperations, scheduleData);
    
    // Return optimized schedule
    return {
      ...scheduleData,
      operations: scheduledOperations
    };
  }

  private initializeDataStructures(scheduleData: ScheduleDataPayload): void {
    // Build operations map
    scheduleData.operations.forEach(op => {
      this.operations.set(op.id, op);
    });
    
    // Build dependency map
    scheduleData.dependencies.forEach(dep => {
      if (!this.dependencies.has(dep.toOperationId)) {
        this.dependencies.set(dep.toOperationId, []);
      }
      this.dependencies.get(dep.toOperationId)!.push(dep.fromOperationId);
    });
    
    // Initialize resource schedules
    scheduleData.resources.forEach(resource => {
      this.resourceSchedules.set(resource.id, []);
    });
  }

  private topologicalSort(operations: ScheduleOperation[]): ScheduleOperation[] {
    const visited = new Set<string>();
    const stack: ScheduleOperation[] = [];
    
    const visit = (opId: string) => {
      if (visited.has(opId)) return;
      visited.add(opId);
      
      // Visit dependencies first
      const deps = this.dependencies.get(opId) || [];
      deps.forEach(depId => visit(depId));
      
      // Add to stack after dependencies
      const op = this.operations.get(opId);
      if (op) stack.push(op);
    };
    
    // Visit all operations
    operations.forEach(op => visit(op.id));
    
    return stack;
  }

  private scheduleOperations(
    sortedOperations: ScheduleOperation[], 
    scheduleData: ScheduleDataPayload
  ): ScheduleOperation[] {
    const scheduledOps: ScheduleOperation[] = [];
    const operationEndTimes = new Map<string, Date>();
    
    const horizonStart = scheduleData.metadata?.horizonStart 
      ? new Date(scheduleData.metadata.horizonStart) 
      : new Date();
    
    for (const operation of sortedOperations) {
      // Skip manually scheduled operations
      if (operation.manuallyScheduled && operation.startTime) {
        scheduledOps.push(operation);
        operationEndTimes.set(
          operation.id, 
          new Date(operation.endTime || operation.startTime)
        );
        continue;
      }
      
      // Calculate earliest start time based on dependencies
      let earliestStart = horizonStart;
      const dependencies = this.dependencies.get(operation.id) || [];
      
      for (const depId of dependencies) {
        const depEndTime = operationEndTimes.get(depId);
        if (depEndTime && depEndTime > earliestStart) {
          earliestStart = depEndTime;
        }
      }
      
      // Find next available slot on the resource
      const resourceSchedule = this.resourceSchedules.get(operation.resourceId) || [];
      const duration = (operation.duration + (operation.setupTime || 0)) * 60 * 60 * 1000; // convert hours to ms
      
      let scheduledStart = this.findEarliestResourceSlot(
        earliestStart, 
        duration, 
        resourceSchedule
      );
      
      // Calculate end time
      const scheduledEnd = new Date(scheduledStart.getTime() + duration);
      
      // Update resource schedule
      resourceSchedule.push({ start: scheduledStart, end: scheduledEnd });
      resourceSchedule.sort((a, b) => a.start.getTime() - b.start.getTime());
      this.resourceSchedules.set(operation.resourceId, resourceSchedule);
      
      // Store operation end time for dependency calculation
      operationEndTimes.set(operation.id, scheduledEnd);
      
      // Create scheduled operation
      scheduledOps.push({
        ...operation,
        startTime: scheduledStart.toISOString(),
        endTime: scheduledEnd.toISOString()
      });
    }
    
    return scheduledOps;
  }

  private findEarliestResourceSlot(
    earliestStart: Date, 
    duration: number, 
    busyPeriods: Array<{start: Date, end: Date}>
  ): Date {
    if (busyPeriods.length === 0) {
      return earliestStart;
    }
    
    // Check if we can fit before first busy period
    if (busyPeriods[0].start.getTime() - earliestStart.getTime() >= duration) {
      return earliestStart;
    }
    
    // Check gaps between busy periods
    for (let i = 0; i < busyPeriods.length - 1; i++) {
      const gapStart = busyPeriods[i].end;
      const gapEnd = busyPeriods[i + 1].start;
      const availableTime = gapEnd.getTime() - gapStart.getTime();
      
      if (availableTime >= duration) {
        const potentialStart = gapStart > earliestStart ? gapStart : earliestStart;
        if (gapEnd.getTime() - potentialStart.getTime() >= duration) {
          return potentialStart;
        }
      }
    }
    
    // Schedule after last busy period
    const lastBusyEnd = busyPeriods[busyPeriods.length - 1].end;
    return lastBusyEnd > earliestStart ? lastBusyEnd : earliestStart;
  }
}
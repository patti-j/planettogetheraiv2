import type { ScheduleDataPayload, ScheduleOperation } from '@/shared/schema';

/**
 * ALAP (As Late As Possible) Scheduling Algorithm
 * Schedules all operations at their latest possible start time
 * without violating deadlines, dependencies, or resource constraints
 */
export class ALAPAlgorithm {
  private operations: Map<string, ScheduleOperation>;
  private reverseDependencies: Map<string, string[]>; // operation ID -> operations that depend on it
  private resourceSchedules: Map<string, Array<{start: Date, end: Date}>>; // resource ID -> busy periods
  
  constructor() {
    this.operations = new Map();
    this.reverseDependencies = new Map();
    this.resourceSchedules = new Map();
  }

  /**
   * Execute ALAP scheduling algorithm
   */
  execute(scheduleData: ScheduleDataPayload): ScheduleDataPayload {
    console.log('[ALAP] Starting ALAP scheduling algorithm');
    
    // Initialize data structures
    this.initializeDataStructures(scheduleData);
    
    // Sort operations in reverse topological order (from end to start)
    const sortedOperations = this.reverseTopologicalSort(scheduleData.operations);
    
    // Schedule each operation at latest possible time
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
    
    // Build reverse dependency map (successors)
    scheduleData.dependencies.forEach(dep => {
      if (!this.reverseDependencies.has(dep.fromOperationId)) {
        this.reverseDependencies.set(dep.fromOperationId, []);
      }
      this.reverseDependencies.get(dep.fromOperationId)!.push(dep.toOperationId);
    });
    
    // Initialize resource schedules
    scheduleData.resources.forEach(resource => {
      this.resourceSchedules.set(resource.id, []);
    });
  }

  private reverseTopologicalSort(operations: ScheduleOperation[]): ScheduleOperation[] {
    const visited = new Set<string>();
    const stack: ScheduleOperation[] = [];
    
    const visit = (opId: string) => {
      if (visited.has(opId)) return;
      visited.add(opId);
      
      // Visit successors first (reverse of normal topological sort)
      const successors = this.reverseDependencies.get(opId) || [];
      successors.forEach(succId => visit(succId));
      
      // Add to stack after successors
      const op = this.operations.get(opId);
      if (op) stack.push(op);
    };
    
    // Visit all operations
    operations.forEach(op => visit(op.id));
    
    // Reverse the stack to get operations from last to first
    return stack.reverse();
  }

  private scheduleOperations(
    sortedOperations: ScheduleOperation[], 
    scheduleData: ScheduleDataPayload
  ): ScheduleOperation[] {
    const scheduledOps: ScheduleOperation[] = [];
    const operationStartTimes = new Map<string, Date>();
    
    // Determine project horizon end
    const horizonEnd = scheduleData.metadata?.horizonEnd 
      ? new Date(scheduleData.metadata.horizonEnd)
      : this.calculateHorizonEnd(scheduleData);
    
    for (const operation of sortedOperations) {
      // Skip manually scheduled operations
      if (operation.manuallyScheduled && operation.startTime) {
        scheduledOps.push(operation);
        operationStartTimes.set(
          operation.id,
          new Date(operation.startTime)
        );
        continue;
      }
      
      // Calculate latest finish time based on successors
      let latestFinish = horizonEnd;
      const successors = this.reverseDependencies.get(operation.id) || [];
      
      for (const succId of successors) {
        const succStartTime = operationStartTimes.get(succId);
        if (succStartTime && succStartTime < latestFinish) {
          latestFinish = succStartTime;
        }
      }
      
      // Calculate duration
      const duration = (operation.duration + (operation.setupTime || 0)) * 60 * 60 * 1000; // convert hours to ms
      
      // Find latest available slot on the resource
      const resourceSchedule = this.resourceSchedules.get(operation.resourceId) || [];
      const { start: scheduledStart, end: scheduledEnd } = this.findLatestResourceSlot(
        latestFinish,
        duration,
        resourceSchedule
      );
      
      // Update resource schedule
      resourceSchedule.push({ start: scheduledStart, end: scheduledEnd });
      resourceSchedule.sort((a, b) => a.start.getTime() - b.start.getTime());
      this.resourceSchedules.set(operation.resourceId, resourceSchedule);
      
      // Store operation start time for successor calculation
      operationStartTimes.set(operation.id, scheduledStart);
      
      // Create scheduled operation
      scheduledOps.push({
        ...operation,
        startTime: scheduledStart.toISOString(),
        endTime: scheduledEnd.toISOString()
      });
    }
    
    return scheduledOps;
  }

  private findLatestResourceSlot(
    latestFinish: Date,
    duration: number,
    busyPeriods: Array<{start: Date, end: Date}>
  ): {start: Date, end: Date} {
    // Calculate latest possible start
    const latestStart = new Date(latestFinish.getTime() - duration);
    
    if (busyPeriods.length === 0) {
      return { start: latestStart, end: latestFinish };
    }
    
    // Sort busy periods by end time (descending)
    const sortedPeriods = [...busyPeriods].sort((a, b) => b.end.getTime() - a.end.getTime());
    
    // Check if we can fit after all busy periods
    const earliestBusyEnd = sortedPeriods[sortedPeriods.length - 1].end;
    if (earliestBusyEnd <= latestStart) {
      return { start: latestStart, end: latestFinish };
    }
    
    // Find the latest gap that can fit the operation
    for (let i = 0; i < sortedPeriods.length; i++) {
      // Check gap after this busy period
      const gapStart = i === sortedPeriods.length - 1 
        ? new Date(0) // Beginning of time
        : sortedPeriods[i + 1].end;
      const gapEnd = sortedPeriods[i].start;
      
      if (gapEnd.getTime() - gapStart.getTime() >= duration) {
        // We can fit in this gap
        const end = gapEnd < latestFinish ? gapEnd : latestFinish;
        const start = new Date(end.getTime() - duration);
        
        if (start >= gapStart) {
          return { start, end };
        }
      }
    }
    
    // If no suitable gap found, schedule before earliest busy period
    const earliestBusyStart = sortedPeriods[sortedPeriods.length - 1].start;
    const end = earliestBusyStart;
    const start = new Date(end.getTime() - duration);
    
    return { start, end };
  }

  private calculateHorizonEnd(scheduleData: ScheduleDataPayload): Date {
    // Find the latest due date or use 30 days from now as default
    let latestDate = new Date();
    latestDate.setDate(latestDate.getDate() + 30); // Default 30 days horizon
    
    // Check for any existing scheduled end times
    scheduleData.operations.forEach(op => {
      if (op.endTime) {
        const endDate = new Date(op.endTime);
        if (endDate > latestDate) {
          latestDate = endDate;
        }
      }
    });
    
    return latestDate;
  }
}
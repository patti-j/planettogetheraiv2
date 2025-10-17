import type { ScheduleDataPayload, ScheduleOperation, ScheduleResource } from '../../../shared/schema';

/**
 * ALAP (As Late As Possible) Scheduling Algorithm
 * Schedules all operations at their latest possible start time
 * without violating deadlines, dependencies, or resource constraints
 */
export class ALAPAlgorithm {
  private operations: Map<string, ScheduleOperation>;
  private reverseDependencies: Map<string, string[]>; // operation ID -> operations that depend on it
  private resourceSchedules: Map<string, Array<{start: Date, end: Date}>>; // resource ID -> busy periods
  private resources: Map<string, ScheduleResource>;
  private resourcesByType: Map<string, ScheduleResource[]>;
  
  constructor() {
    this.operations = new Map();
    this.reverseDependencies = new Map();
    this.resourceSchedules = new Map();
    this.resources = new Map();
    this.resourcesByType = new Map();
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
    
    // Initialize resource maps and schedules
    scheduleData.resources.forEach(resource => {
      this.resourceSchedules.set(resource.id, []);
      this.resources.set(resource.id, resource);
      
      // Group resources by type for easier assignment
      const resourceType = this.getResourceType(resource.name);
      if (!this.resourcesByType.has(resourceType)) {
        this.resourcesByType.set(resourceType, []);
      }
      this.resourcesByType.get(resourceType)!.push(resource);
    });
  }

  /**
   * Determine resource type from resource name
   */
  private getResourceType(resourceName: string): string {
    const nameLower = resourceName.toLowerCase();
    if (nameLower.includes('fermenter') || nameLower.includes('fermentation')) {
      return 'fermenter';
    } else if (nameLower.includes('bright') || nameLower.includes('conditioning')) {
      return 'bright_tank';
    } else if (nameLower.includes('mill') || nameLower.includes('grain')) {
      return 'mill';
    } else if (nameLower.includes('mash')) {
      return 'mash_tun';
    } else if (nameLower.includes('lauter')) {
      return 'lauter_tun';
    } else if (nameLower.includes('kettle') || nameLower.includes('boil')) {
      return 'brew_kettle';
    } else if (nameLower.includes('filler') || nameLower.includes('bottle') || nameLower.includes('can')) {
      return 'packaging';
    } else if (nameLower.includes('pasteur')) {
      return 'pasteurizer';
    }
    return 'general';
  }

  /**
   * Determine appropriate resource type for an operation
   */
  private getRequiredResourceType(operationName: string): string {
    const nameLower = operationName.toLowerCase();
    if (nameLower.includes('fermentation')) {
      return 'fermenter';
    } else if (nameLower.includes('conditioning')) {
      return 'bright_tank';
    } else if (nameLower.includes('milling')) {
      return 'mill';
    } else if (nameLower.includes('mashing') || nameLower.includes('decoction')) {
      return 'mash_tun';
    } else if (nameLower.includes('lautering')) {
      return 'lauter_tun';
    } else if (nameLower.includes('boiling')) {
      return 'brew_kettle';
    } else if (nameLower.includes('packaging')) {
      return 'packaging';
    }
    return 'general';
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
        // Also update resource schedule for manually scheduled operations
        const resourceId = this.assignResourceToOperation(operation);
        const resourceSchedule = this.resourceSchedules.get(resourceId) || [];
        resourceSchedule.push({ 
          start: new Date(operation.startTime), 
          end: new Date(operation.endTime || operation.startTime) 
        });
        this.resourceSchedules.set(resourceId, resourceSchedule);
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
      
      // Find appropriate resource for this operation type
      const assignedResourceId = this.assignResourceToOperation(operation);
      
      // Find latest available slot on the assigned resource
      const resourceSchedule = this.resourceSchedules.get(assignedResourceId) || [];
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
      
      // Create scheduled operation with assigned resource
      scheduledOps.push({
        ...operation,
        resourceId: assignedResourceId,
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

  /**
   * Assign the most appropriate available resource to an operation
   */
  private assignResourceToOperation(operation: ScheduleOperation): string {
    // If operation already has a valid resource, validate it
    if (operation.resourceId) {
      const resource = this.resources.get(operation.resourceId);
      if (resource) {
        // Check if this resource type matches the operation requirement
        const requiredType = this.getRequiredResourceType(operation.name);
        const resourceType = this.getResourceType(resource.name);
        if (requiredType === 'general' || resourceType === requiredType) {
          return operation.resourceId;
        }
      }
    }
    
    // Find appropriate resource type for this operation
    const requiredResourceType = this.getRequiredResourceType(operation.name);
    const availableResources = this.resourcesByType.get(requiredResourceType) || [];
    
    if (availableResources.length === 0) {
      console.warn(`No resources of type '${requiredResourceType}' available for operation '${operation.name}'`);
      // Fall back to any available resource
      const allResources = Array.from(this.resources.values());
      return allResources.length > 0 ? allResources[0].id : 'unscheduled';
    }
    
    // For ALAP, find the resource with the earliest scheduled work (most available)
    let bestResource = availableResources[0];
    let minStartTime = this.getResourceEarliestStartTime(bestResource.id);
    
    for (const resource of availableResources.slice(1)) {
      const startTime = this.getResourceEarliestStartTime(resource.id);
      if (startTime > minStartTime) {
        minStartTime = startTime;
        bestResource = resource;
      }
    }
    
    return bestResource.id;
  }

  /**
   * Get the earliest scheduled start time for a resource (for ALAP)
   */
  private getResourceEarliestStartTime(resourceId: string): number {
    const schedule = this.resourceSchedules.get(resourceId) || [];
    if (schedule.length === 0) return Number.MAX_SAFE_INTEGER;
    return schedule[0].start.getTime();
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
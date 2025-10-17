import type { ScheduleDataPayload, ScheduleOperation, ScheduleDependency } from '@/shared/schema';

/**
 * Critical Path Method (CPM) Scheduling Algorithm
 * Identifies the critical path and schedules operations accordingly
 */
export class CriticalPathAlgorithm {
  private operations: Map<string, ScheduleOperation>;
  private dependencies: Map<string, ScheduleDependency[]>;
  private predecessors: Map<string, string[]>;
  private successors: Map<string, string[]>;
  
  constructor() {
    this.operations = new Map();
    this.dependencies = new Map();
    this.predecessors = new Map();
    this.successors = new Map();
  }

  /**
   * Execute Critical Path Method algorithm
   */
  execute(scheduleData: ScheduleDataPayload): ScheduleDataPayload {
    console.log('[CPM] Starting Critical Path Method algorithm');
    
    // Initialize data structures
    this.initializeDataStructures(scheduleData);
    
    // Perform forward pass to calculate earliest start/finish times
    const earlyTimes = this.forwardPass(scheduleData);
    
    // Perform backward pass to calculate latest start/finish times
    const lateTimes = this.backwardPass(scheduleData, earlyTimes);
    
    // Calculate slack and identify critical path
    const criticalOperations = this.identifyCriticalPath(earlyTimes, lateTimes);
    
    // Schedule operations based on critical path analysis
    const scheduledOperations = this.scheduleOperations(
      scheduleData.operations,
      earlyTimes,
      criticalOperations
    );
    
    // Return optimized schedule with critical path marked
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
    
    // Build dependency relationships
    scheduleData.dependencies.forEach(dep => {
      // Store dependencies by target
      if (!this.dependencies.has(dep.toOperationId)) {
        this.dependencies.set(dep.toOperationId, []);
      }
      this.dependencies.get(dep.toOperationId)!.push(dep);
      
      // Build predecessor map
      if (!this.predecessors.has(dep.toOperationId)) {
        this.predecessors.set(dep.toOperationId, []);
      }
      this.predecessors.get(dep.toOperationId)!.push(dep.fromOperationId);
      
      // Build successor map
      if (!this.successors.has(dep.fromOperationId)) {
        this.successors.set(dep.fromOperationId, []);
      }
      this.successors.get(dep.fromOperationId)!.push(dep.toOperationId);
    });
  }

  private forwardPass(scheduleData: ScheduleDataPayload): Map<string, {
    earlyStart: number,
    earlyFinish: number
  }> {
    const earlyTimes = new Map<string, {earlyStart: number, earlyFinish: number}>();
    const horizonStart = scheduleData.metadata?.horizonStart 
      ? new Date(scheduleData.metadata.horizonStart).getTime()
      : Date.now();
    
    // Topologically sort operations
    const sortedOps = this.topologicalSort(scheduleData.operations);
    
    for (const op of sortedOps) {
      // Skip manually scheduled operations
      if (op.manuallyScheduled && op.startTime) {
        const start = new Date(op.startTime).getTime();
        const end = new Date(op.endTime || op.startTime).getTime();
        earlyTimes.set(op.id, {
          earlyStart: start - horizonStart,
          earlyFinish: end - horizonStart
        });
        continue;
      }
      
      // Calculate earliest start based on predecessors
      let earlyStart = 0; // Start from horizon start
      const preds = this.predecessors.get(op.id) || [];
      
      for (const predId of preds) {
        const predTimes = earlyTimes.get(predId);
        if (predTimes) {
          // Add dependency lag if specified
          const dep = this.dependencies.get(op.id)?.find(d => d.fromOperationId === predId);
          const lag = (dep?.lag || 0) * 60 * 60 * 1000; // convert hours to ms
          
          const requiredStart = predTimes.earlyFinish + lag;
          if (requiredStart > earlyStart) {
            earlyStart = requiredStart;
          }
        }
      }
      
      // Calculate duration in milliseconds
      const duration = (op.duration + (op.setupTime || 0)) * 60 * 60 * 1000;
      const earlyFinish = earlyStart + duration;
      
      earlyTimes.set(op.id, { earlyStart, earlyFinish });
    }
    
    return earlyTimes;
  }

  private backwardPass(
    scheduleData: ScheduleDataPayload,
    earlyTimes: Map<string, {earlyStart: number, earlyFinish: number}>
  ): Map<string, {lateStart: number, lateFinish: number}> {
    const lateTimes = new Map<string, {lateStart: number, lateFinish: number}>();
    
    // Find project completion time (maximum early finish)
    let projectFinish = 0;
    earlyTimes.forEach(times => {
      if (times.earlyFinish > projectFinish) {
        projectFinish = times.earlyFinish;
      }
    });
    
    // Process operations in reverse topological order
    const sortedOps = this.topologicalSort(scheduleData.operations).reverse();
    
    for (const op of sortedOps) {
      // Skip manually scheduled operations
      if (op.manuallyScheduled && op.startTime) {
        const earlyTime = earlyTimes.get(op.id)!;
        lateTimes.set(op.id, {
          lateStart: earlyTime.earlyStart,
          lateFinish: earlyTime.earlyFinish
        });
        continue;
      }
      
      // Calculate latest finish based on successors
      let lateFinish = projectFinish;
      const succs = this.successors.get(op.id) || [];
      
      for (const succId of succs) {
        const succTimes = lateTimes.get(succId);
        if (succTimes) {
          // Subtract dependency lag if specified
          const dep = this.dependencies.get(succId)?.find(d => d.fromOperationId === op.id);
          const lag = (dep?.lag || 0) * 60 * 60 * 1000; // convert hours to ms
          
          const requiredFinish = succTimes.lateStart - lag;
          if (requiredFinish < lateFinish) {
            lateFinish = requiredFinish;
          }
        }
      }
      
      // Calculate duration
      const duration = (op.duration + (op.setupTime || 0)) * 60 * 60 * 1000;
      const lateStart = lateFinish - duration;
      
      lateTimes.set(op.id, { lateStart, lateFinish });
    }
    
    return lateTimes;
  }

  private identifyCriticalPath(
    earlyTimes: Map<string, {earlyStart: number, earlyFinish: number}>,
    lateTimes: Map<string, {lateStart: number, lateFinish: number}>
  ): Set<string> {
    const criticalOps = new Set<string>();
    
    // An operation is critical if its total slack is zero
    earlyTimes.forEach((early, opId) => {
      const late = lateTimes.get(opId);
      if (late) {
        const totalSlack = late.lateStart - early.earlyStart;
        
        // Account for floating point precision
        if (Math.abs(totalSlack) < 1000) { // Less than 1 second slack
          criticalOps.add(opId);
        }
      }
    });
    
    console.log(`[CPM] Identified ${criticalOps.size} critical operations`);
    return criticalOps;
  }

  private scheduleOperations(
    operations: ScheduleOperation[],
    earlyTimes: Map<string, {earlyStart: number, earlyFinish: number}>,
    criticalOperations: Set<string>
  ): ScheduleOperation[] {
    const horizonStart = new Date().getTime(); // Use current time as baseline
    const scheduledOps: ScheduleOperation[] = [];
    
    for (const op of operations) {
      const times = earlyTimes.get(op.id);
      if (!times) {
        // If no times calculated, keep original
        scheduledOps.push(op);
        continue;
      }
      
      // Convert relative times back to absolute dates
      const startTime = new Date(horizonStart + times.earlyStart);
      const endTime = new Date(horizonStart + times.earlyFinish);
      
      // Add critical path indicator to constraints
      const isCritical = criticalOperations.has(op.id);
      const constraints = [...(op.constraints || [])];
      if (isCritical) {
        constraints.push({
          type: 'CRITICAL_PATH',
          value: true
        });
      }
      
      scheduledOps.push({
        ...op,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        constraints
      });
    }
    
    return scheduledOps;
  }

  private topologicalSort(operations: ScheduleOperation[]): ScheduleOperation[] {
    const visited = new Set<string>();
    const stack: ScheduleOperation[] = [];
    
    const visit = (opId: string) => {
      if (visited.has(opId)) return;
      visited.add(opId);
      
      // Visit predecessors first
      const preds = this.predecessors.get(opId) || [];
      preds.forEach(predId => visit(predId));
      
      // Add to stack after predecessors
      const op = this.operations.get(opId);
      if (op) stack.push(op);
    };
    
    // Visit all operations
    operations.forEach(op => visit(op.id));
    
    return stack;
  }
}
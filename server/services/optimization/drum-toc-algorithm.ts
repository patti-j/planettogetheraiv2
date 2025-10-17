import type { ScheduleDataPayload, ScheduleOperation, ScheduleResource } from '../../../shared/schema';

interface ResourceUtilization {
  resourceId: string;
  resourceName: string;
  totalHours: number;
  operationCount: number;
  utilization: number;
}

/**
 * DRUM (Theory of Constraints) Scheduling Algorithm
 * Implements Drum-Buffer-Rope scheduling for manufacturing optimization
 * 
 * Key concepts:
 * - DRUM: The bottleneck resource that sets the pace for the entire system
 * - BUFFER: Time buffers to protect the constraint from disruptions
 * - ROPE: Synchronizes material release with the drum's capacity
 */
export class DrumTOCAlgorithm {
  private operations: Map<string, ScheduleOperation>;
  private resources: Map<string, ScheduleResource>;
  private dependencies: Map<string, string[]>; // operation ID -> dependent operation IDs
  
  // TOC-specific parameters
  private readonly CONSTRAINT_BUFFER_RATIO = 0.25; // 25% of operation time as buffer
  private readonly SHIPPING_BUFFER_RATIO = 0.15; // 15% buffer for final operations
  private readonly ASSEMBLY_BUFFER_RATIO = 0.20; // 20% buffer for assembly operations
  
  constructor() {
    this.operations = new Map();
    this.resources = new Map();
    this.dependencies = new Map();
  }

  /**
   * Execute DRUM-TOC scheduling algorithm
   */
  execute(scheduleData: ScheduleDataPayload): ScheduleDataPayload {
    console.log('[DRUM-TOC] Starting Theory of Constraints scheduling');
    
    // Initialize data structures
    this.initializeDataStructures(scheduleData);
    
    // Step 1: Identify the bottleneck resource (DRUM)
    const bottleneck = this.identifyBottleneck(scheduleData);
    console.log(`[DRUM-TOC] Bottleneck identified: ${bottleneck.resourceName} (${bottleneck.utilization.toFixed(1)}% utilization)`);
    
    // Step 2: Schedule the drum (bottleneck) operations optimally
    const drumOperations = this.scheduleDrumOperations(
      scheduleData.operations.filter(op => op.resourceId === bottleneck.resourceId),
      scheduleData
    );
    
    // Step 3: Schedule feeding operations (backward from drum)
    const feedingOperations = this.scheduleFeedingOperations(
      drumOperations,
      scheduleData
    );
    
    // Step 4: Schedule downstream operations (forward from drum)
    const downstreamOperations = this.scheduleDownstreamOperations(
      drumOperations,
      scheduleData
    );
    
    // Step 5: Apply buffers to protect the constraint
    const bufferedOperations = this.applyBuffers([
      ...drumOperations,
      ...feedingOperations,
      ...downstreamOperations
    ]);
    
    // Step 6: Add TOC metadata to operations
    const finalOperations = this.addTOCMetadata(bufferedOperations, bottleneck);
    
    return {
      ...scheduleData,
      operations: finalOperations,
      metadata: {
        ...scheduleData.metadata,
        bottleneckResource: bottleneck.resourceId,
        bottleneckUtilization: bottleneck.utilization,
        schedulingMethod: 'DRUM-TOC'
      }
    };
  }

  private initializeDataStructures(scheduleData: ScheduleDataPayload): void {
    // Build operations map
    scheduleData.operations.forEach(op => {
      this.operations.set(op.id, op);
    });
    
    // Build resources map
    scheduleData.resources.forEach(resource => {
      this.resources.set(resource.id, resource);
    });
    
    // Build dependency map
    scheduleData.dependencies.forEach(dep => {
      if (!this.dependencies.has(dep.toOperationId)) {
        this.dependencies.set(dep.toOperationId, []);
      }
      this.dependencies.get(dep.toOperationId)!.push(dep.fromOperationId);
    });
  }

  /**
   * Identify the bottleneck resource based on utilization
   */
  private identifyBottleneck(scheduleData: ScheduleDataPayload): ResourceUtilization {
    const resourceUtilization = new Map<string, ResourceUtilization>();
    
    // Calculate total load per resource
    scheduleData.operations.forEach(op => {
      if (!op.resourceId || op.resourceId === 'unscheduled') return;
      
      const utilization = resourceUtilization.get(op.resourceId) || {
        resourceId: op.resourceId,
        resourceName: this.resources.get(op.resourceId)?.name || op.resourceId,
        totalHours: 0,
        operationCount: 0,
        utilization: 0
      };
      
      utilization.totalHours += op.duration + (op.setupTime || 0);
      utilization.operationCount++;
      
      resourceUtilization.set(op.resourceId, utilization);
    });
    
    // Calculate utilization percentage (assuming working hours)
    const availableHours = 160; // Standard monthly working hours
    resourceUtilization.forEach(util => {
      util.utilization = (util.totalHours / availableHours) * 100;
    });
    
    // Find the resource with highest utilization
    let bottleneck: ResourceUtilization = {
      resourceId: '',
      resourceName: '',
      totalHours: 0,
      operationCount: 0,
      utilization: 0
    };
    
    resourceUtilization.forEach(util => {
      if (util.utilization > bottleneck.utilization) {
        bottleneck = util;
      }
    });
    
    return bottleneck;
  }

  /**
   * Schedule operations on the bottleneck resource (DRUM)
   */
  private scheduleDrumOperations(
    drumOps: ScheduleOperation[], 
    scheduleData: ScheduleDataPayload
  ): ScheduleOperation[] {
    const horizonStart = scheduleData.metadata?.horizonStart 
      ? new Date(scheduleData.metadata.horizonStart)
      : new Date();
    
    // Sort drum operations by priority (could be customized)
    // For now, sort by duration (largest first for better utilization)
    const sortedOps = [...drumOps].sort((a, b) => 
      (b.duration + (b.setupTime || 0)) - (a.duration + (a.setupTime || 0))
    );
    
    const scheduledOps: ScheduleOperation[] = [];
    let currentTime = new Date(horizonStart);
    
    for (const op of sortedOps) {
      const duration = (op.duration + (op.setupTime || 0)) * 60 * 60 * 1000;
      const endTime = new Date(currentTime.getTime() + duration);
      
      scheduledOps.push({
        ...op,
        startTime: currentTime.toISOString(),
        endTime: endTime.toISOString(),
        constraints: [
          ...(op.constraints || []),
          { type: 'DRUM_OPERATION', value: true }
        ]
      });
      
      currentTime = endTime;
    }
    
    return scheduledOps;
  }

  /**
   * Schedule feeding operations (operations that feed the drum)
   */
  private scheduleFeedingOperations(
    drumOps: ScheduleOperation[],
    scheduleData: ScheduleDataPayload
  ): ScheduleOperation[] {
    const scheduledOps: ScheduleOperation[] = [];
    const drumStartTimes = new Map<string, Date>();
    
    // Map drum operation start times
    drumOps.forEach(op => {
      if (op.startTime) {
        drumStartTimes.set(op.id, new Date(op.startTime));
      }
    });
    
    // Find and schedule feeding operations
    scheduleData.operations.forEach(op => {
      // Skip if already scheduled as drum operation
      if (drumOps.find(d => d.id === op.id)) return;
      
      // Check if this operation feeds into a drum operation
      const feedsIntoDrum = Array.from(this.dependencies.entries()).some(([toId, fromIds]) => {
        return drumOps.find(d => d.id === toId) && fromIds.includes(op.id);
      });
      
      if (feedsIntoDrum) {
        // Schedule backward from the drum operation it feeds
        const drumOp = drumOps.find(d => {
          const deps = this.dependencies.get(d.id) || [];
          return deps.includes(op.id);
        });
        
        if (drumOp && drumOp.startTime) {
          const drumStart = new Date(drumOp.startTime);
          const duration = (op.duration + (op.setupTime || 0)) * 60 * 60 * 1000;
          const bufferTime = duration * this.CONSTRAINT_BUFFER_RATIO;
          
          // Schedule to complete just before drum starts (with buffer)
          const endTime = new Date(drumStart.getTime() - bufferTime);
          const startTime = new Date(endTime.getTime() - duration);
          
          scheduledOps.push({
            ...op,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            constraints: [
              ...(op.constraints || []),
              { type: 'CONSTRAINT_FEEDING', value: true }
            ]
          });
        }
      }
    });
    
    return scheduledOps;
  }

  /**
   * Schedule downstream operations (operations after the drum)
   */
  private scheduleDownstreamOperations(
    drumOps: ScheduleOperation[],
    scheduleData: ScheduleDataPayload
  ): ScheduleOperation[] {
    const scheduledOps: ScheduleOperation[] = [];
    const processedIds = new Set(drumOps.map(op => op.id));
    
    // Find operations that depend on drum operations
    scheduleData.operations.forEach(op => {
      if (processedIds.has(op.id)) return;
      
      // Check if this operation depends on a drum operation
      const dependsOnDrum = (this.dependencies.get(op.id) || []).some(depId =>
        drumOps.find(d => d.id === depId)
      );
      
      if (dependsOnDrum) {
        // Find the latest drum operation it depends on
        const drumDependencies = (this.dependencies.get(op.id) || [])
          .map(depId => drumOps.find(d => d.id === depId))
          .filter(d => d && d.endTime)
          .map(d => new Date(d!.endTime!));
        
        if (drumDependencies.length > 0) {
          const latestDrumEnd = new Date(Math.max(...drumDependencies.map(d => d.getTime())));
          const duration = (op.duration + (op.setupTime || 0)) * 60 * 60 * 1000;
          const bufferTime = duration * this.SHIPPING_BUFFER_RATIO;
          
          // Schedule after drum completes (with buffer)
          const startTime = new Date(latestDrumEnd.getTime() + bufferTime);
          const endTime = new Date(startTime.getTime() + duration);
          
          scheduledOps.push({
            ...op,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            constraints: [
              ...(op.constraints || []),
              { type: 'SHIPPING_BUFFER', value: true }
            ]
          });
        }
      }
    });
    
    return scheduledOps;
  }

  /**
   * Apply time buffers to protect the constraint
   */
  private applyBuffers(operations: ScheduleOperation[]): ScheduleOperation[] {
    return operations.map(op => {
      // Buffers are already applied during scheduling
      // This method can be used for additional buffer adjustments if needed
      return op;
    });
  }

  /**
   * Add TOC metadata to operations
   */
  private addTOCMetadata(
    operations: ScheduleOperation[], 
    bottleneck: ResourceUtilization
  ): ScheduleOperation[] {
    return operations.map(op => {
      const metadata: any = {
        ...(op.metadata || {}),
        schedulingMethod: 'DRUM-TOC'
      };
      
      if (op.resourceId === bottleneck.resourceId) {
        metadata.isBottleneck = true;
        metadata.bottleneckUtilization = bottleneck.utilization;
      }
      
      return {
        ...op,
        metadata
      };
    });
  }
}
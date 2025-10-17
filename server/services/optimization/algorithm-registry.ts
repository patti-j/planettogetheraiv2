import type { ScheduleDataPayload } from '@/shared/schema';
import { ASAPAlgorithm } from './asap-algorithm';
import { ALAPAlgorithm } from './alap-algorithm';
import { CriticalPathAlgorithm } from './critical-path-algorithm';

/**
 * Algorithm interface that all scheduling algorithms must implement
 */
export interface ISchedulingAlgorithm {
  execute(scheduleData: ScheduleDataPayload): ScheduleDataPayload;
}

/**
 * Algorithm metadata and implementation mapping
 */
export interface AlgorithmDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  implementation: new() => ISchedulingAlgorithm;
  parameters?: Record<string, any>;
}

/**
 * Algorithm Registry
 * Central registry that maps algorithm IDs to their implementations
 */
export class AlgorithmRegistry {
  private static instance: AlgorithmRegistry;
  private algorithms: Map<string, AlgorithmDefinition>;

  private constructor() {
    this.algorithms = new Map();
    this.registerDefaultAlgorithms();
  }

  /**
   * Get singleton instance of the registry
   */
  static getInstance(): AlgorithmRegistry {
    if (!AlgorithmRegistry.instance) {
      AlgorithmRegistry.instance = new AlgorithmRegistry();
    }
    return AlgorithmRegistry.instance;
  }

  /**
   * Register default scheduling algorithms
   */
  private registerDefaultAlgorithms(): void {
    // ASAP Algorithm
    this.register({
      id: 'forward-scheduling',
      name: 'ASAP Forward Scheduling',
      description: 'Schedules operations as soon as possible respecting dependencies and resource constraints',
      category: 'time-based',
      implementation: ASAPAlgorithm
    });

    // ALAP Algorithm
    this.register({
      id: 'backward-scheduling',
      name: 'ALAP Backward Scheduling',
      description: 'Schedules operations as late as possible without violating deadlines',
      category: 'time-based',
      implementation: ALAPAlgorithm
    });

    // Critical Path Method
    this.register({
      id: 'critical-path',
      name: 'Critical Path Method',
      description: 'Identifies and optimizes the critical path through the schedule',
      category: 'optimization',
      implementation: CriticalPathAlgorithm
    });

    // Resource Leveling (stub for now)
    this.register({
      id: 'resource-leveling',
      name: 'Resource Leveling',
      description: 'Balances resource utilization across the scheduling horizon',
      category: 'resource-based',
      implementation: class ResourceLevelingAlgorithm implements ISchedulingAlgorithm {
        execute(scheduleData: ScheduleDataPayload): ScheduleDataPayload {
          console.log('[Resource Leveling] Algorithm not yet implemented, using ASAP as fallback');
          return new ASAPAlgorithm().execute(scheduleData);
        }
      }
    });

    // Bottleneck Optimizer (stub)
    this.register({
      id: 'bottleneck-optimizer',
      name: 'Drum-Buffer-Rope (TOC)',
      description: 'Optimizes schedule based on Theory of Constraints focusing on bottlenecks',
      category: 'constraint-based',
      implementation: class BottleneckAlgorithm implements ISchedulingAlgorithm {
        execute(scheduleData: ScheduleDataPayload): ScheduleDataPayload {
          console.log('[Bottleneck] Algorithm not yet implemented, using Critical Path as fallback');
          return new CriticalPathAlgorithm().execute(scheduleData);
        }
      }
    });

    // DBR Scheduling (stub)
    this.register({
      id: 'dbr-scheduling',
      name: 'Theory of Constraints DBR',
      description: 'Drum-Buffer-Rope scheduling based on Theory of Constraints',
      category: 'constraint-based',
      implementation: class DBRAlgorithm implements ISchedulingAlgorithm {
        execute(scheduleData: ScheduleDataPayload): ScheduleDataPayload {
          console.log('[DBR] Algorithm not yet implemented, using Critical Path as fallback');
          return new CriticalPathAlgorithm().execute(scheduleData);
        }
      }
    });

    console.log(`[Algorithm Registry] Registered ${this.algorithms.size} algorithms`);
  }

  /**
   * Register a new algorithm
   */
  register(definition: AlgorithmDefinition): void {
    this.algorithms.set(definition.id, definition);
    console.log(`[Algorithm Registry] Registered algorithm: ${definition.id}`);
  }

  /**
   * Get algorithm by ID
   */
  getAlgorithm(algorithmId: string): AlgorithmDefinition | undefined {
    return this.algorithms.get(algorithmId);
  }

  /**
   * Get all registered algorithms
   */
  getAllAlgorithms(): AlgorithmDefinition[] {
    return Array.from(this.algorithms.values());
  }

  /**
   * Execute an algorithm by ID
   */
  executeAlgorithm(algorithmId: string, scheduleData: ScheduleDataPayload): ScheduleDataPayload {
    const algorithm = this.getAlgorithm(algorithmId);
    
    if (!algorithm) {
      throw new Error(`Algorithm not found: ${algorithmId}`);
    }

    console.log(`[Algorithm Registry] Executing algorithm: ${algorithm.name}`);
    
    // Create instance and execute
    const instance = new algorithm.implementation();
    const startTime = Date.now();
    
    try {
      const result = instance.execute(scheduleData);
      const executionTime = Date.now() - startTime;
      
      console.log(`[Algorithm Registry] Algorithm ${algorithmId} executed in ${executionTime}ms`);
      
      return result;
    } catch (error) {
      console.error(`[Algorithm Registry] Algorithm ${algorithmId} failed:`, error);
      throw new Error(`Algorithm execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if an algorithm exists and is available
   */
  hasAlgorithm(algorithmId: string): boolean {
    return this.algorithms.has(algorithmId);
  }

  /**
   * Get algorithms by category
   */
  getAlgorithmsByCategory(category: string): AlgorithmDefinition[] {
    return Array.from(this.algorithms.values())
      .filter(algo => algo.category === category);
  }
}
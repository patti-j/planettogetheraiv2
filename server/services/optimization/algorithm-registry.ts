import type { ScheduleDataPayload } from '../../../shared/schema';
import { ASAPAlgorithm } from './asap-algorithm';
import { ALAPAlgorithm } from './alap-algorithm';

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
    // ASAP Algorithm (with multiple aliases)
    this.register({
      id: 'forward-scheduling',
      name: 'ASAP Forward Scheduling',
      description: 'Schedules operations as soon as possible respecting dependencies and resource constraints',
      category: 'time-based',
      implementation: ASAPAlgorithm
    });
    
    // Register ASAP alias for convenience
    this.register({
      id: 'asap',
      name: 'ASAP (As Soon As Possible)',
      description: 'Schedules operations as soon as possible respecting dependencies and resource constraints',
      category: 'time-based',
      implementation: ASAPAlgorithm
    });

    // ALAP Algorithm (with multiple aliases)
    this.register({
      id: 'backward-scheduling',
      name: 'ALAP Backward Scheduling',
      description: 'Schedules operations as late as possible without violating deadlines',
      category: 'time-based',
      implementation: ALAPAlgorithm
    });
    
    // Register ALAP alias for convenience
    this.register({
      id: 'alap',
      name: 'ALAP (As Late As Possible)',
      description: 'Schedules operations as late as possible without violating deadlines',
      category: 'time-based',
      implementation: ALAPAlgorithm
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
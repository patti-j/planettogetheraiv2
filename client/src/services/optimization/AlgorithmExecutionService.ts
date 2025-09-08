import { apiRequest } from '@/lib/queryClient';

export interface AlgorithmExecution {
  algorithmId: number;
  parameters: Record<string, any>;
  scope: {
    timeHorizon?: string;
    resourceIds?: number[];
    jobIds?: number[];
    startDate?: string;
    endDate?: string;
  };
  validationRules?: {
    physical: Record<string, any>;
    policy: Record<string, any>;
  };
  constraints?: {
    enabled: string[];
    strictness: 'relaxed' | 'moderate' | 'strict';
  };
}

export interface OptimizationResult {
  success: boolean;
  algorithm: string;
  executionTime: number;
  optimizedSchedule?: {
    events: any[];
    resources: any[];
    assignments: any[];
    dependencies: any[];
  };
  metrics?: {
    makespan?: number;
    resourceUtilization?: number;
    onTimeDelivery?: number;
    totalCost?: number;
    constraintViolations?: number;
  };
  violations?: Array<{
    type: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    affectedEntities?: string[];
  }>;
  message?: string;
}

export class AlgorithmExecutionService {
  private static instance: AlgorithmExecutionService;

  private constructor() {}

  static getInstance(): AlgorithmExecutionService {
    if (!AlgorithmExecutionService.instance) {
      AlgorithmExecutionService.instance = new AlgorithmExecutionService();
    }
    return AlgorithmExecutionService.instance;
  }

  /**
   * Fetch available optimization algorithms
   */
  async getAvailableAlgorithms() {
    try {
      const response = await fetch('/api/optimization/algorithms');
      if (!response.ok) throw new Error('Failed to fetch algorithms');
      return await response.json();
    } catch (error) {
      console.error('Error fetching algorithms:', error);
      return [];
    }
  }

  /**
   * Fetch standard algorithms
   */
  async getStandardAlgorithms() {
    try {
      const response = await fetch('/api/optimization/standard-algorithms');
      if (!response.ok) throw new Error('Failed to fetch standard algorithms');
      return await response.json();
    } catch (error) {
      console.error('Error fetching standard algorithms:', error);
      return [];
    }
  }

  /**
   * Execute optimization algorithm on production schedule
   */
  async executeAlgorithm(execution: AlgorithmExecution): Promise<OptimizationResult> {
    try {
      const response = await apiRequest('/api/optimization/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(execution)
      });
      
      return response;
    } catch (error: any) {
      console.error('Error executing algorithm:', error);
      return {
        success: false,
        algorithm: 'unknown',
        executionTime: 0,
        message: error.message || 'Failed to execute optimization algorithm'
      };
    }
  }

  /**
   * Apply optimization results to scheduler
   */
  applyOptimizationToScheduler(schedulerInstance: any, result: OptimizationResult) {
    if (!schedulerInstance || !result.optimizedSchedule) {
      console.warn('Cannot apply optimization: missing scheduler instance or results');
      return false;
    }

    try {
      const { events, resources, assignments, dependencies } = result.optimizedSchedule;
      
      // Begin batch update
      schedulerInstance.suspendRefresh();
      
      // Update events (operations)
      if (events && events.length > 0) {
        events.forEach((optimizedEvent: any) => {
          const event = schedulerInstance.eventStore.getById(optimizedEvent.id);
          if (event) {
            event.setStartDate(new Date(optimizedEvent.startDate));
            event.setEndDate(new Date(optimizedEvent.endDate));
            
            if (optimizedEvent.resourceId) {
              event.resourceId = optimizedEvent.resourceId;
            }
          }
        });
      }
      
      // Update resource assignments
      if (assignments && assignments.length > 0) {
        schedulerInstance.assignmentStore.removeAll();
        assignments.forEach((assignment: any) => {
          schedulerInstance.assignmentStore.add({
            eventId: assignment.eventId,
            resourceId: assignment.resourceId,
            units: assignment.units || 100
          });
        });
      }
      
      // Update dependencies
      if (dependencies && dependencies.length > 0) {
        schedulerInstance.dependencyStore.removeAll();
        dependencies.forEach((dep: any) => {
          schedulerInstance.dependencyStore.add({
            from: dep.from,
            to: dep.to,
            type: dep.type || 2, // Finish-to-Start
            lag: dep.lag || 0
          });
        });
      }
      
      // Resume refresh and apply changes
      schedulerInstance.resumeRefresh(true);
      
      return true;
    } catch (error) {
      console.error('Error applying optimization to scheduler:', error);
      return false;
    }
  }

  /**
   * Validate schedule against rules
   */
  validateSchedule(schedule: any, validationRules: any): Array<any> {
    const violations: Array<any> = [];
    
    if (!validationRules) return violations;
    
    // Check physical constraints
    if (validationRules.physical) {
      // Check for overlapping activities
      if (validationRules.physical.general?.find((r: any) => r.id === 'no_overlap' && r.enabled)) {
        const overlaps = this.checkOverlappingActivities(schedule);
        if (overlaps.length > 0) {
          violations.push({
            type: 'no_overlap',
            severity: 'error',
            message: 'Activities are overlapping on the same resource',
            affectedEntities: overlaps
          });
        }
      }
      
      // Check resource over-allocation
      if (validationRules.physical.resource?.find((r: any) => r.id === 'no_overallocation' && r.enabled)) {
        const overAllocations = this.checkResourceOverAllocation(schedule);
        if (overAllocations.length > 0) {
          violations.push({
            type: 'no_overallocation',
            severity: 'error',
            message: 'Resources are over-allocated',
            affectedEntities: overAllocations
          });
        }
      }
    }
    
    // Check policy constraints
    if (validationRules.policy) {
      // Check need dates
      if (validationRules.policy.businessRules?.find((r: any) => r.id === 'need_dates' && r.enabled)) {
        const lateOrders = this.checkNeedDates(schedule);
        if (lateOrders.length > 0) {
          violations.push({
            type: 'need_dates',
            severity: 'warning',
            message: 'Some orders will miss their need dates',
            affectedEntities: lateOrders
          });
        }
      }
    }
    
    return violations;
  }

  /**
   * Check for overlapping activities on same resource
   */
  private checkOverlappingActivities(schedule: any): string[] {
    const overlaps: string[] = [];
    
    if (!schedule.events || !schedule.assignments) return overlaps;
    
    // Group events by resource
    const resourceEvents: Record<string, any[]> = {};
    schedule.assignments.forEach((assignment: any) => {
      if (!resourceEvents[assignment.resourceId]) {
        resourceEvents[assignment.resourceId] = [];
      }
      const event = schedule.events.find((e: any) => e.id === assignment.eventId);
      if (event) {
        resourceEvents[assignment.resourceId].push(event);
      }
    });
    
    // Check for overlaps within each resource
    Object.entries(resourceEvents).forEach(([resourceId, events]) => {
      events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      
      for (let i = 0; i < events.length - 1; i++) {
        const current = events[i];
        const next = events[i + 1];
        
        if (new Date(current.endDate) > new Date(next.startDate)) {
          overlaps.push(`${current.name} and ${next.name} on resource ${resourceId}`);
        }
      }
    });
    
    return overlaps;
  }

  /**
   * Check for resource over-allocation
   */
  private checkResourceOverAllocation(schedule: any): string[] {
    const overAllocations: string[] = [];
    
    if (!schedule.events || !schedule.assignments || !schedule.resources) return overAllocations;
    
    // Check each time period for over-allocation
    const timeSlots = this.generateTimeSlots(schedule.events);
    
    timeSlots.forEach(slot => {
      const resourceLoads: Record<string, number> = {};
      
      schedule.assignments.forEach((assignment: any) => {
        const event = schedule.events.find((e: any) => e.id === assignment.eventId);
        if (event && this.isEventInTimeSlot(event, slot)) {
          resourceLoads[assignment.resourceId] = (resourceLoads[assignment.resourceId] || 0) + (assignment.units || 100);
        }
      });
      
      Object.entries(resourceLoads).forEach(([resourceId, load]) => {
        if (load > 100) {
          const resource = schedule.resources.find((r: any) => r.id === resourceId);
          overAllocations.push(`${resource?.name || resourceId} at ${slot.start.toISOString()} (${load}% allocated)`);
        }
      });
    });
    
    return [...new Set(overAllocations)]; // Remove duplicates
  }

  /**
   * Check if orders meet their need dates
   */
  private checkNeedDates(schedule: any): string[] {
    const lateOrders: string[] = [];
    
    if (!schedule.events) return lateOrders;
    
    schedule.events.forEach((event: any) => {
      if (event.needDate) {
        const needDate = new Date(event.needDate);
        const endDate = new Date(event.endDate);
        
        if (endDate > needDate) {
          const daysLate = Math.ceil((endDate.getTime() - needDate.getTime()) / (1000 * 60 * 60 * 24));
          lateOrders.push(`${event.name} (${daysLate} days late)`);
        }
      }
    });
    
    return lateOrders;
  }

  /**
   * Generate time slots for checking resource allocation
   */
  private generateTimeSlots(events: any[]): Array<{ start: Date; end: Date }> {
    const slots: Array<{ start: Date; end: Date }> = [];
    
    if (!events || events.length === 0) return slots;
    
    // Find min and max dates
    let minDate = new Date(events[0].startDate);
    let maxDate = new Date(events[0].endDate);
    
    events.forEach(event => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    });
    
    // Generate daily slots
    const current = new Date(minDate);
    while (current < maxDate) {
      const slotEnd = new Date(current);
      slotEnd.setDate(slotEnd.getDate() + 1);
      slots.push({
        start: new Date(current),
        end: slotEnd
      });
      current.setDate(current.getDate() + 1);
    }
    
    return slots;
  }

  /**
   * Check if event is in time slot
   */
  private isEventInTimeSlot(event: any, slot: { start: Date; end: Date }): boolean {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    
    return eventStart < slot.end && eventEnd > slot.start;
  }

  /**
   * Get optimization metrics from schedule
   */
  calculateMetrics(schedule: any): Record<string, number> {
    const metrics: Record<string, number> = {};
    
    if (!schedule.events || schedule.events.length === 0) {
      return metrics;
    }
    
    // Calculate makespan
    let minStart = new Date(schedule.events[0].startDate);
    let maxEnd = new Date(schedule.events[0].endDate);
    
    schedule.events.forEach((event: any) => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      if (start < minStart) minStart = start;
      if (end > maxEnd) maxEnd = end;
    });
    
    metrics.makespan = Math.ceil((maxEnd.getTime() - minStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate resource utilization
    if (schedule.resources && schedule.assignments) {
      const totalAvailableTime = schedule.resources.length * metrics.makespan * 8; // 8 hours per day
      let totalUsedTime = 0;
      
      schedule.events.forEach((event: any) => {
        const duration = (new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60);
        totalUsedTime += duration;
      });
      
      metrics.resourceUtilization = Math.round((totalUsedTime / totalAvailableTime) * 100);
    }
    
    // Calculate on-time delivery
    let onTimeCount = 0;
    let totalWithNeedDate = 0;
    
    schedule.events.forEach((event: any) => {
      if (event.needDate) {
        totalWithNeedDate++;
        if (new Date(event.endDate) <= new Date(event.needDate)) {
          onTimeCount++;
        }
      }
    });
    
    if (totalWithNeedDate > 0) {
      metrics.onTimeDelivery = Math.round((onTimeCount / totalWithNeedDate) * 100);
    }
    
    return metrics;
  }
}
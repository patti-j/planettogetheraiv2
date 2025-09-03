// Service to capture and provide context from the Scheduler Pro page
export interface SchedulerContext {
  // Current scheduler state
  currentView: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  
  // Resources information
  resources: {
    total: number;
    byType: Record<string, number>;
    utilizationRate: number;
    criticalResources: Array<{
      id: string;
      name: string;
      utilization: number;
      conflicts: number;
    }>;
  };
  
  // Events/Operations information
  events: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
    criticalPath: string[];
    conflicts: Array<{
      eventId: string;
      eventName: string;
      type: string;
      description: string;
    }>;
  };
  
  // Dependencies information
  dependencies: {
    total: number;
    critical: number;
    violated: number;
  };
  
  // Performance metrics
  metrics: {
    scheduleCompliance: number;
    resourceUtilization: number;
    onTimeDelivery: number;
    throughput: number;
  };
  
  // Current user interactions
  selectedEvent?: {
    id: string;
    name: string;
    resource: string;
    startDate: Date;
    endDate: Date;
    percentComplete: number;
  };
  
  selectedResource?: {
    id: string;
    name: string;
    type: string;
    capacity: number;
    currentLoad: number;
  };
  
  // Active filters
  activeFilters?: {
    resourceTypes?: string[];
    dateRange?: { start: Date; end: Date };
    statusFilter?: string[];
  };
}

export class SchedulerContextService {
  private static instance: SchedulerContextService;
  private schedulerInstance: any = null;
  private schedulingAlgorithms: any = null;
  
  private constructor() {}
  
  static getInstance(): SchedulerContextService {
    if (!SchedulerContextService.instance) {
      SchedulerContextService.instance = new SchedulerContextService();
    }
    return SchedulerContextService.instance;
  }
  
  // Set the scheduler instance
  setSchedulerInstance(instance: any) {
    this.schedulerInstance = instance;
    console.log('Scheduler instance registered with context service');
  }
  
  // Set scheduling algorithm functions
  setSchedulingAlgorithms(algorithms: any) {
    this.schedulingAlgorithms = algorithms;
    console.log('Scheduling algorithms registered with context service');
  }
  
  // Execute a scheduling algorithm
  async executeSchedulingAlgorithm(algorithm: string): Promise<{ success: boolean; message: string }> {
    if (!this.schedulingAlgorithms || !this.schedulingAlgorithms[algorithm]) {
      return { 
        success: false, 
        message: `Scheduling algorithm '${algorithm}' not available. Please ensure you're on the Production Scheduler page.` 
      };
    }
    
    try {
      await this.schedulingAlgorithms[algorithm]();
      return { success: true, message: `${algorithm} algorithm executed successfully!` };
    } catch (error) {
      console.error(`Error executing ${algorithm} algorithm:`, error);
      return { success: false, message: `Failed to execute ${algorithm} algorithm.` };
    }
  }
  
  // Get current scheduler context
  getContext(): SchedulerContext | null {
    if (!this.schedulerInstance) {
      return null;
    }
    
    try {
      // Check if the scheduler instance has the required properties
      if (!this.schedulerInstance.project && !this.schedulerInstance.eventStore) {
        // Instance exists but not fully initialized yet
        return null;
      }
      
      // Try to access stores from project or directly from scheduler instance
      const project = this.schedulerInstance.project;
      const resources = project?.resourceStore?.records || this.schedulerInstance.resourceStore?.records || [];
      const events = project?.eventStore?.records || this.schedulerInstance.eventStore?.records || [];
      const dependencies = project?.dependencyStore?.records || this.schedulerInstance.dependencyStore?.records || [];
      const assignments = project?.assignmentStore?.records || this.schedulerInstance.assignmentStore?.records || [];
      
      // Calculate resource utilization
      const resourceUtilization = this.calculateResourceUtilization(resources, assignments, events);
      
      // Find critical path events
      const criticalPath = this.findCriticalPath(events, dependencies);
      
      // Detect conflicts
      const conflicts = this.detectConflicts(events, assignments, resources);
      
      // Get current view information
      const currentView = this.schedulerInstance.viewPreset || 'weekAndDayLetter';
      const startDate = this.schedulerInstance.startDate;
      const endDate = this.schedulerInstance.endDate;
      
      // Get selected items
      const selectedEvent = this.schedulerInstance.selectedEvents?.[0];
      const selectedResource = this.schedulerInstance.selectedRecord;
      
      // Calculate metrics
      const metrics = this.calculateMetrics(events, resources, assignments);
      
      return {
        currentView,
        dateRange: {
          start: startDate,
          end: endDate
        },
        resources: {
          total: resources.length,
          byType: this.groupResourcesByType(resources),
          utilizationRate: resourceUtilization.average,
          criticalResources: resourceUtilization.critical
        },
        events: {
          total: events.length,
          completed: events.filter((e: any) => e.percentDone === 100).length,
          inProgress: events.filter((e: any) => e.percentDone > 0 && e.percentDone < 100).length,
          pending: events.filter((e: any) => e.percentDone === 0).length,
          overdue: this.findOverdueEvents(events).length,
          criticalPath: criticalPath.map((e: any) => e.id),
          conflicts: conflicts
        },
        dependencies: {
          total: dependencies.length,
          critical: dependencies.filter((d: any) => this.isCriticalDependency(d, criticalPath)).length,
          violated: this.findViolatedDependencies(dependencies, events).length
        },
        metrics,
        selectedEvent: selectedEvent ? {
          id: selectedEvent.id,
          name: selectedEvent.name,
          resource: selectedEvent.resourceId,
          startDate: selectedEvent.startDate,
          endDate: selectedEvent.endDate,
          percentComplete: selectedEvent.percentDone || 0
        } : undefined,
        selectedResource: selectedResource ? {
          id: selectedResource.id,
          name: selectedResource.name,
          type: selectedResource.type,
          capacity: selectedResource.capacity || 100,
          currentLoad: this.calculateResourceLoad(selectedResource, assignments, events)
        } : undefined
      };
    } catch (error) {
      // Silent fail - scheduler may not be fully initialized yet
      // This is normal during initial load
      return null;
    }
  }
  
  // Calculate resource utilization
  private calculateResourceUtilization(resources: any[], assignments: any[], events: any[]) {
    const utilization: any[] = [];
    let totalUtilization = 0;
    
    resources.forEach((resource: any) => {
      const resourceAssignments = assignments.filter((a: any) => a.resourceId === resource.id);
      const assignedHours = resourceAssignments.reduce((total: number, assignment: any) => {
        const event = events.find((e: any) => e.id === assignment.eventId);
        if (event) {
          const duration = (event.endDate - event.startDate) / (1000 * 60 * 60); // Convert to hours
          return total + duration;
        }
        return total;
      }, 0);
      
      const capacity = resource.capacity || 100;
      const utilizationRate = (assignedHours / capacity) * 100;
      
      utilization.push({
        id: resource.id,
        name: resource.name,
        utilization: utilizationRate,
        conflicts: resourceAssignments.length > 1 ? resourceAssignments.length - 1 : 0
      });
      
      totalUtilization += utilizationRate;
    });
    
    const avgUtilization = resources.length > 0 ? totalUtilization / resources.length : 0;
    const criticalResources = utilization.filter(r => r.utilization > 90 || r.conflicts > 0);
    
    return {
      average: avgUtilization,
      critical: criticalResources
    };
  }
  
  // Find critical path
  private findCriticalPath(events: any[], dependencies: any[]): any[] {
    // Simplified critical path detection
    // In a real implementation, this would use proper CPM algorithm
    const criticalEvents: any[] = [];
    
    // Find events with no slack time (simplified)
    events.forEach((event: any) => {
      const hasIncomingDeps = dependencies.some((d: any) => d.toEvent === event.id);
      const hasOutgoingDeps = dependencies.some((d: any) => d.fromEvent === event.id);
      
      if (hasIncomingDeps || hasOutgoingDeps) {
        // Simplified: consider events with dependencies as potentially critical
        criticalEvents.push(event);
      }
    });
    
    return criticalEvents;
  }
  
  // Detect scheduling conflicts
  private detectConflicts(events: any[], assignments: any[], resources: any[]): any[] {
    const conflicts: any[] = [];
    
    // Check for resource overallocation
    const resourceSchedule: Map<string, any[]> = new Map();
    
    assignments.forEach((assignment: any) => {
      const event = events.find((e: any) => e.id === assignment.eventId);
      if (!event) return;
      
      const resourceId = assignment.resourceId;
      if (!resourceSchedule.has(resourceId)) {
        resourceSchedule.set(resourceId, []);
      }
      
      const schedule = resourceSchedule.get(resourceId)!;
      
      // Check for overlaps
      schedule.forEach((scheduledEvent: any) => {
        if (this.eventsOverlap(event, scheduledEvent)) {
          conflicts.push({
            eventId: event.id,
            eventName: event.name,
            type: 'resource_conflict',
            description: `Resource overallocation: ${event.name} overlaps with ${scheduledEvent.name}`
          });
        }
      });
      
      schedule.push(event);
    });
    
    // Check for dependency violations
    dependencies.forEach((dep: any) => {
      const fromEvent = events.find((e: any) => e.id === dep.fromEvent);
      const toEvent = events.find((e: any) => e.id === dep.toEvent);
      
      if (fromEvent && toEvent) {
        if (dep.type === 2 && toEvent.startDate < fromEvent.endDate) { // Finish-to-Start
          conflicts.push({
            eventId: toEvent.id,
            eventName: toEvent.name,
            type: 'dependency_violation',
            description: `Dependency violation: ${toEvent.name} starts before ${fromEvent.name} finishes`
          });
        }
      }
    });
    
    return conflicts;
  }
  
  // Check if events overlap
  private eventsOverlap(event1: any, event2: any): boolean {
    return event1.startDate < event2.endDate && event2.startDate < event1.endDate;
  }
  
  // Group resources by type
  private groupResourcesByType(resources: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    resources.forEach((resource: any) => {
      const type = resource.type || 'Unknown';
      grouped[type] = (grouped[type] || 0) + 1;
    });
    
    return grouped;
  }
  
  // Find overdue events
  private findOverdueEvents(events: any[]): any[] {
    const now = new Date();
    return events.filter((event: any) => 
      event.endDate < now && event.percentDone < 100
    );
  }
  
  // Check if dependency is critical
  private isCriticalDependency(dependency: any, criticalPath: any[]): boolean {
    return criticalPath.some((event: any) => 
      event.id === dependency.fromEvent || event.id === dependency.toEvent
    );
  }
  
  // Find violated dependencies
  private findViolatedDependencies(dependencies: any[], events: any[]): any[] {
    const violated: any[] = [];
    
    dependencies.forEach((dep: any) => {
      const fromEvent = events.find((e: any) => e.id === dep.fromEvent);
      const toEvent = events.find((e: any) => e.id === dep.toEvent);
      
      if (fromEvent && toEvent) {
        if (dep.type === 2 && toEvent.startDate < fromEvent.endDate) { // Finish-to-Start
          violated.push(dep);
        }
      }
    });
    
    return violated;
  }
  
  // Calculate resource load
  private calculateResourceLoad(resource: any, assignments: any[], events: any[]): number {
    const resourceAssignments = assignments.filter((a: any) => a.resourceId === resource.id);
    
    const totalHours = resourceAssignments.reduce((total: number, assignment: any) => {
      const event = events.find((e: any) => e.id === assignment.eventId);
      if (event) {
        const duration = (event.endDate - event.startDate) / (1000 * 60 * 60); // Convert to hours
        return total + duration;
      }
      return total;
    }, 0);
    
    return totalHours;
  }
  
  // Calculate performance metrics
  private calculateMetrics(events: any[], resources: any[], assignments: any[]): any {
    const completedEvents = events.filter((e: any) => e.percentDone === 100);
    const totalEvents = events.length;
    
    // Calculate schedule compliance
    const overdueEvents = this.findOverdueEvents(events);
    const scheduleCompliance = totalEvents > 0 
      ? ((totalEvents - overdueEvents.length) / totalEvents) * 100 
      : 100;
    
    // Calculate resource utilization
    const utilizationData = this.calculateResourceUtilization(resources, assignments, events);
    
    // Calculate on-time delivery (simplified)
    const onTimeEvents = completedEvents.filter((e: any) => e.actualEndDate <= e.endDate);
    const onTimeDelivery = completedEvents.length > 0
      ? (onTimeEvents.length / completedEvents.length) * 100
      : 100;
    
    // Calculate throughput (events per day)
    const timeSpan = events.length > 0
      ? Math.max(...events.map((e: any) => e.endDate)) - Math.min(...events.map((e: any) => e.startDate))
      : 1;
    const daysSpan = timeSpan / (1000 * 60 * 60 * 24);
    const throughput = daysSpan > 0 ? completedEvents.length / daysSpan : 0;
    
    return {
      scheduleCompliance,
      resourceUtilization: utilizationData.average,
      onTimeDelivery,
      throughput
    };
  }
  
  // Get suggestions based on current context
  getSuggestions(): string[] {
    const context = this.getContext();
    if (!context) return [];
    
    const suggestions: string[] = [];
    
    // Add suggestions based on metrics
    if (context.metrics.scheduleCompliance < 80) {
      suggestions.push('Optimize schedule to improve compliance');
    }
    
    if (context.metrics.resourceUtilization > 90) {
      suggestions.push('Level resources to reduce overallocation');
    }
    
    if (context.events.conflicts.length > 0) {
      suggestions.push(`Resolve ${context.events.conflicts.length} scheduling conflicts`);
    }
    
    if (context.events.overdue > 0) {
      suggestions.push(`Address ${context.events.overdue} overdue operations`);
    }
    
    if (context.dependencies.violated > 0) {
      suggestions.push('Fix dependency violations');
    }
    
    // Add general optimization suggestions
    suggestions.push('Run critical path analysis');
    suggestions.push('Apply ASAP optimization');
    suggestions.push('Check resource leveling opportunities');
    
    return suggestions.slice(0, 5); // Return top 5 suggestions
  }
}
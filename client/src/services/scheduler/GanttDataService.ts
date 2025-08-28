import { EventModel, ResourceModel, DependencyModel, AssignmentModel } from '@bryntum/schedulerpro';
import { apiRequest } from '@/lib/queryClient';

export interface SegmentData {
  id: string;
  eventId: string;
  type: 'setup' | 'run' | 'teardown';
  startDate: Date;
  endDate: Date;
  duration: number;
  percentComplete?: number;
}

export interface GanttData {
  resources: any[];
  events: any[];
  dependencies: any[];
  assignments: any[];
  segments?: SegmentData[];
}

export class GanttDataService {
  private static instance: GanttDataService;
  private cache: Map<string, any> = new Map();
  
  private constructor() {}
  
  static getInstance(): GanttDataService {
    if (!GanttDataService.instance) {
      GanttDataService.instance = new GanttDataService();
    }
    return GanttDataService.instance;
  }
  
  /**
   * Get demo data from Bryntum stores for testing
   */
  async getDemoData(): Promise<GanttData> {
    // Using Bryntum's demo data structure
    const resources = [
      { id: 'r1', name: 'Brew Kettle 1', type: 'Equipment', capacity: 100 },
      { id: 'r2', name: 'Brew Kettle 2', type: 'Equipment', capacity: 100 },
      { id: 'r3', name: 'Fermentation Tank 1', type: 'Equipment', capacity: 150 },
      { id: 'r4', name: 'Fermentation Tank 2', type: 'Equipment', capacity: 150 },
      { id: 'r5', name: 'Packaging Line 1', type: 'Equipment', capacity: 200 },
      { id: 'r6', name: 'Quality Lab', type: 'Facility', capacity: 50 },
      { id: 'r7', name: 'Operator Team A', type: 'Human', capacity: 100 },
      { id: 'r8', name: 'Operator Team B', type: 'Human', capacity: 100 }
    ];
    
    const baseDate = new Date();
    baseDate.setHours(8, 0, 0, 0);
    
    const events = [
      {
        id: 'e1',
        name: 'Batch 001: Milling & Mashing',
        startDate: new Date(baseDate),
        endDate: new Date(baseDate.getTime() + 4 * 60 * 60 * 1000),
        percentDone: 75,
        eventColor: 'blue',
        segments: [
          { id: 's1', type: 'setup', duration: 0.5, percentComplete: 100 },
          { id: 's2', type: 'run', duration: 3, percentComplete: 80 },
          { id: 's3', type: 'teardown', duration: 0.5, percentComplete: 20 }
        ]
      },
      {
        id: 'e2',
        name: 'Batch 001: Boiling',
        startDate: new Date(baseDate.getTime() + 4 * 60 * 60 * 1000),
        endDate: new Date(baseDate.getTime() + 7 * 60 * 60 * 1000),
        percentDone: 50,
        eventColor: 'green',
        constraintType: 'startnoearlierthan',
        constraintDate: new Date(baseDate.getTime() + 4 * 60 * 60 * 1000)
      },
      {
        id: 'e3',
        name: 'Batch 001: Fermentation',
        startDate: new Date(baseDate.getTime() + 8 * 60 * 60 * 1000),
        endDate: new Date(baseDate.getTime() + 32 * 60 * 60 * 1000),
        percentDone: 25,
        eventColor: 'orange'
      },
      {
        id: 'e4',
        name: 'Batch 002: Milling & Mashing',
        startDate: new Date(baseDate.getTime() + 5 * 60 * 60 * 1000),
        endDate: new Date(baseDate.getTime() + 9 * 60 * 60 * 1000),
        percentDone: 60,
        eventColor: 'purple'
      },
      {
        id: 'e5',
        name: 'Quality Check: Batch 001',
        startDate: new Date(baseDate.getTime() + 7 * 60 * 60 * 1000),
        endDate: new Date(baseDate.getTime() + 8 * 60 * 60 * 1000),
        percentDone: 100,
        eventColor: 'red',
        milestone: false
      },
      {
        id: 'e6',
        name: 'Packaging: Batch 001',
        startDate: new Date(baseDate.getTime() + 33 * 60 * 60 * 1000),
        endDate: new Date(baseDate.getTime() + 37 * 60 * 60 * 1000),
        percentDone: 0,
        eventColor: 'teal'
      }
    ];
    
    const assignments = [
      { id: 'a1', eventId: 'e1', resourceId: 'r1' },
      { id: 'a2', eventId: 'e2', resourceId: 'r2' },
      { id: 'a3', eventId: 'e3', resourceId: 'r3' },
      { id: 'a4', eventId: 'e4', resourceId: 'r1' },
      { id: 'a5', eventId: 'e5', resourceId: 'r6' },
      { id: 'a6', eventId: 'e6', resourceId: 'r5' },
      { id: 'a7', eventId: 'e1', resourceId: 'r7' },
      { id: 'a8', eventId: 'e2', resourceId: 'r7' },
      { id: 'a9', eventId: 'e4', resourceId: 'r8' },
      { id: 'a10', eventId: 'e6', resourceId: 'r8' }
    ];
    
    const dependencies = [
      { id: 'd1', fromEvent: 'e1', toEvent: 'e2', type: 2 }, // Finish-to-Start
      { id: 'd2', fromEvent: 'e2', toEvent: 'e3', type: 2 },
      { id: 'd3', fromEvent: 'e2', toEvent: 'e5', type: 2 },
      { id: 'd4', fromEvent: 'e3', toEvent: 'e6', type: 2 },
      { id: 'd5', fromEvent: 'e5', toEvent: 'e3', type: 1 }  // Start-to-Start
    ];
    
    return {
      resources,
      events,
      dependencies,
      assignments
    };
  }
  
  /**
   * Get production data from API
   */
  async getProductionData(): Promise<GanttData> {
    try {
      const [operationsResponse, resourcesResponse] = await Promise.all([
        fetch('/api/operations'),
        fetch('/api/resources')
      ]);
      
      if (!operationsResponse.ok || !resourcesResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const operations = await operationsResponse.json();
      const resources = await resourcesResponse.json();
      
      return this.transformToGanttData(operations, resources);
    } catch (error) {
      console.error('Failed to fetch production data:', error);
      // Fall back to demo data
      return this.getDemoData();
    }
  }
  
  /**
   * Transform API data to Gantt format
   */
  private transformToGanttData(operations: any[], resources: any[]): GanttData {
    const ganttResources = resources.map((r: any) => ({
      id: `r_${r.id}`,
      name: r.name,
      type: r.type || 'Equipment',
      capacity: r.capacity || 100,
      department: r.department_name,
      isBottleneck: r.bottleneck || false
    }));
    
    const ganttEvents = operations.map((op: any) => ({
      id: `e_${op.id}`,
      name: op.name,
      startDate: new Date(op.startTime || op.scheduled_start),
      endDate: new Date(op.endTime || op.scheduled_end),
      percentDone: op.completionPercentage || 0,
      eventColor: this.getEventColor(op.status),
      constraintType: op.constraintType,
      constraintDate: op.constraintDate ? new Date(op.constraintDate) : null
    }));
    
    // Create assignments based on operation resource mapping
    const assignments = operations
      .filter((op: any) => op.assignedResourceId || op.scheduled_resource_id)
      .map((op: any, index: number) => ({
        id: `a_${index}`,
        eventId: `e_${op.id}`,
        resourceId: `r_${op.assignedResourceId || op.scheduled_resource_id}`
      }));
    
    // TODO: Load actual dependencies from API
    const dependencies: any[] = [];
    
    return {
      resources: ganttResources,
      events: ganttEvents,
      dependencies,
      assignments
    };
  }
  
  /**
   * Generate segments for an operation
   */
  generateSegments(operation: any): SegmentData[] {
    const segments: SegmentData[] = [];
    const startDate = new Date(operation.startDate);
    const totalDuration = operation.duration || 4; // hours
    
    // Setup phase (15% of total)
    const setupDuration = totalDuration * 0.15;
    segments.push({
      id: `${operation.id}_setup`,
      eventId: operation.id,
      type: 'setup',
      startDate: startDate,
      endDate: new Date(startDate.getTime() + setupDuration * 60 * 60 * 1000),
      duration: setupDuration,
      percentComplete: operation.percentDone > 15 ? 100 : (operation.percentDone / 15) * 100
    });
    
    // Run phase (70% of total)
    const runDuration = totalDuration * 0.7;
    const runStart = new Date(startDate.getTime() + setupDuration * 60 * 60 * 1000);
    segments.push({
      id: `${operation.id}_run`,
      eventId: operation.id,
      type: 'run',
      startDate: runStart,
      endDate: new Date(runStart.getTime() + runDuration * 60 * 60 * 1000),
      duration: runDuration,
      percentComplete: operation.percentDone > 85 ? 100 : Math.max(0, ((operation.percentDone - 15) / 70) * 100)
    });
    
    // Teardown phase (15% of total)
    const teardownDuration = totalDuration * 0.15;
    const teardownStart = new Date(runStart.getTime() + runDuration * 60 * 60 * 1000);
    segments.push({
      id: `${operation.id}_teardown`,
      eventId: operation.id,
      type: 'teardown',
      startDate: teardownStart,
      endDate: new Date(teardownStart.getTime() + teardownDuration * 60 * 60 * 1000),
      duration: teardownDuration,
      percentComplete: operation.percentDone > 85 ? ((operation.percentDone - 85) / 15) * 100 : 0
    });
    
    return segments;
  }
  
  /**
   * Get event color based on status
   */
  private getEventColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'planned': 'blue',
      'in_progress': 'green',
      'completed': 'gray',
      'delayed': 'red',
      'on_hold': 'orange',
      'cancelled': 'black'
    };
    return colorMap[status] || 'blue';
  }
  
  /**
   * Update cache
   */
  updateCache(key: string, data: any): void {
    this.cache.set(key, data);
  }
  
  /**
   * Get from cache
   */
  getFromCache(key: string): any {
    return this.cache.get(key);
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
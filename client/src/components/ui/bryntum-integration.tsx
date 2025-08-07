// Bryntum Gantt Integration Points
// This file prepares the structure for Bryntum Gantt integration
// When you get the trial/license, we'll replace the mock implementation with actual Bryntum components

import React, { useEffect, useRef } from 'react';

// These interfaces match Bryntum's expected data structure
export interface BryntumTask {
  id: string | number;
  name: string;
  startDate: Date | string;
  endDate?: Date | string;
  duration?: number;
  durationUnit?: 'hour' | 'day' | 'week' | 'month';
  percentDone?: number;
  resourceId?: string | number;
  dependencies?: Array<{
    from: string | number;
    to: string | number;
    type?: number; // 0: Start-to-Start, 1: Start-to-Finish, 2: Finish-to-Start, 3: Finish-to-Finish
  }>;
  constraint?: {
    type: 'startnoearlierthan' | 'finishnolaterthan' | 'muststarton' | 'mustfinishon';
    date: Date | string;
  };
  cls?: string; // CSS class for styling
  eventColor?: string;
  iconCls?: string;
  rollup?: boolean;
  expanded?: boolean;
  children?: BryntumTask[];
  // Custom fields for our app
  workOrderNumber?: string;
  operationName?: string;
  status?: string;
  priority?: number;
}

export interface BryntumResource {
  id: string | number;
  name: string;
  type?: string;
  capacity?: number;
  calendar?: string;
  // Custom fields
  capabilities?: string[];
  status?: 'available' | 'busy' | 'maintenance' | 'offline';
}

export interface BryntumAssignment {
  id: string | number;
  resourceId: string | number;
  eventId: string | number;
  units?: number; // Percentage of resource allocation
}

export interface BryntumDependency {
  id: string | number;
  from: string | number;
  to: string | number;
  type?: number;
  lag?: number;
  lagUnit?: 'hour' | 'day' | 'week';
}

export interface BryntumGanttConfig {
  // Data
  tasks: BryntumTask[];
  resources: BryntumResource[];
  assignments?: BryntumAssignment[];
  dependencies?: BryntumDependency[];
  
  // View configuration
  viewPreset?: 'hourAndDay' | 'dayAndWeek' | 'weekAndMonth' | 'monthAndYear' | 'year';
  startDate?: Date | string;
  endDate?: Date | string;
  
  // Features
  features?: {
    taskEdit?: boolean | object;
    taskDrag?: boolean | object;
    taskResize?: boolean | object;
    dependencies?: boolean | object;
    resourceAssignment?: boolean | object;
    criticalPath?: boolean;
    progressLine?: boolean | object;
    taskMenu?: boolean | object;
    columnLines?: boolean;
    timeRanges?: boolean | object;
    labels?: boolean | object;
    nonWorkingTime?: boolean;
    taskTooltip?: boolean | object;
  };
  
  // Columns configuration for left panel
  columns?: Array<{
    field: string;
    text: string;
    width?: number;
    editor?: boolean | object;
    renderer?: (args: any) => string;
  }>;
  
  // Event handlers
  onTaskDrop?: (event: any) => void;
  onTaskResize?: (event: any) => void;
  onDependencyAdd?: (event: any) => void;
  onTaskEdit?: (event: any) => void;
  onBeforeTaskDelete?: (event: any) => boolean;
  
  // Styling
  rowHeight?: number;
  barMargin?: number;
  eventColor?: string;
  eventStyle?: 'plain' | 'border' | 'colored' | 'hollow' | 'line' | 'dashed';
}

// Placeholder component - will be replaced with actual Bryntum Gantt
export const BryntumGantt: React.FC<BryntumGanttConfig> = (props) => {
  const ganttRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // When Bryntum is installed, initialize here:
    /*
    import { Gantt } from '@bryntum/gantt-react';
    
    const gantt = new Gantt({
      appendTo: ganttRef.current,
      ...props,
      project: {
        tasks: props.tasks,
        resources: props.resources,
        assignments: props.assignments,
        dependencies: props.dependencies
      }
    });
    
    return () => gantt.destroy();
    */
  }, [props]);
  
  return (
    <div ref={ganttRef} className="h-full w-full">
      <div className="p-8 text-center text-muted-foreground">
        <h3 className="text-lg font-semibold mb-2">Bryntum Gantt Integration Ready</h3>
        <p className="mb-4">The integration points are prepared. To activate:</p>
        <ol className="text-left max-w-2xl mx-auto space-y-2">
          <li>1. Download Bryntum Gantt trial from bryntum.com</li>
          <li>2. Install the npm package: npm install @bryntum/gantt @bryntum/gantt-react</li>
          <li>3. Add your license key to the environment variables</li>
          <li>4. Import Bryntum styles in your main CSS file</li>
          <li>5. Uncomment the implementation code above</li>
        </ol>
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> The trial version works exactly like the licensed version.
            The only difference is a small watermark that disappears when you add the license key.
          </p>
        </div>
      </div>
    </div>
  );
};

// Data transformation utilities
export const transformToБryntumTasks = (operations: any[], orders: any[]): BryntumTask[] => {
  return operations.map(op => {
    const order = orders.find(o => o.id === op.productionOrderId);
    return {
      id: op.id,
      name: op.operationName,
      startDate: op.startTime,
      endDate: op.endTime,
      duration: op.standardDuration,
      durationUnit: 'hour',
      percentDone: op.completionPercentage || 0,
      resourceId: op.workCenterId,
      workOrderNumber: order?.orderNumber,
      operationName: op.operationName,
      status: op.status,
      priority: op.priority,
      cls: `status-${op.status}`,
      eventColor: getStatusColor(op.status)
    };
  });
};

export const transformToBryntumResources = (resources: any[]): BryntumResource[] => {
  return resources.map(res => ({
    id: res.id,
    name: res.name,
    type: res.type,
    capabilities: res.capabilities || [],
    status: res.status === 'active' ? 'available' : res.status
  }));
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return '#10b981'; // green
    case 'in_progress': return '#3b82f6'; // blue
    case 'scheduled': return '#f59e0b'; // orange
    case 'unscheduled': return '#ef4444'; // red
    default: return '#6b7280'; // gray
  }
};

// Export configuration presets
export const ganttPresets = {
  production: {
    viewPreset: 'dayAndWeek' as const,
    features: {
      taskEdit: true,
      taskDrag: true,
      taskResize: true,
      dependencies: true,
      resourceAssignment: true,
      criticalPath: true,
      progressLine: true,
      taskMenu: true,
      columnLines: true,
      nonWorkingTime: true,
      taskTooltip: {
        template: (data: any) => `
          <div class="gantt-tooltip">
            <h4>${data.taskRecord.name}</h4>
            <p>Status: ${data.taskRecord.status}</p>
            <p>Progress: ${data.taskRecord.percentDone}%</p>
          </div>
        `
      }
    },
    columns: [
      { field: 'name', text: 'Operation', width: 200, editor: false },
      { field: 'workOrderNumber', text: 'Work Order', width: 120 },
      { field: 'duration', text: 'Duration', width: 80 },
      { field: 'percentDone', text: 'Progress', width: 80 }
    ],
    rowHeight: 50,
    barMargin: 5,
    eventStyle: 'colored'
  },
  
  planning: {
    viewPreset: 'weekAndMonth' as const,
    features: {
      taskEdit: true,
      taskDrag: true,
      taskResize: true,
      dependencies: true,
      criticalPath: true,
      taskMenu: true
    },
    columns: [
      { field: 'name', text: 'Task', width: 250, editor: true },
      { field: 'startDate', text: 'Start', width: 100 },
      { field: 'endDate', text: 'End', width: 100 }
    ],
    rowHeight: 40,
    eventStyle: 'border'
  }
};
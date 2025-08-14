// Scheduler-style configuration for Resource-Based View
// Using Gantt in resource scheduling mode similar to Bryntum Scheduler
export const ganttConfig = {
  // Column configuration for resource grid (resources in left pane)
  columns: [
    { type: 'name', field: 'name', width: 250, text: 'Resource' }
  ],
  
  // View configuration optimized for resource scheduling
  viewPreset: 'hourAndDay',
  barMargin: 5,
  rowHeight: 70,
  
  // Scheduler-like behavior
  eventLayout: 'stack',  // Stack events vertically when they overlap
  managedEventSizing: true,
  allowOverlap: false,
  
  // Features configuration (Trial limitations noted)
  features: {
    // Simple boolean features
    taskDrag: true,
    taskResize: true,
    columnLines: true,
    
    // Disabled features
    taskEdit: false,
    cellEdit: false,
    percentDone: false,        // Trial limitation
    progressLine: false,       // Trial limitation  
    dependencies: false,       // Trial limitation
    dependencyEdit: false,     // Trial limitation
    baselines: false,          // Trial limitation
    rollups: false,           // Trial limitation
    criticalPaths: false      // Trial limitation
  },
  
  // Project configuration for resource-based scheduling
  project: {
    autoLoad: false,
    autoSync: false,
    
    // Configure stores for hierarchical resource view
    taskStore: {
      tree: true   // Enable tree to show resources with child tasks
    },
    resourceStore: {
      tree: false  // Resources remain flat in resource store
    }
  }
};

// Format data for Scheduler-style resource view
// Resources are displayed as rows with operations as timeline events
export function formatGanttData(operations: any[], resources: any[]) {
  // Format resources for display in left grid (simple flat list)
  const formattedResources = resources.map(resource => ({
    id: resource.id,
    name: resource.name || `Resource ${resource.id}`,
    type: resource.type || 'Standard',
    capacity: resource.capacity || 100,
    calendar: resource.calendarId || null,
    eventColor: resource.color || '#4CAF50'
  }));
  
  // Format tasks (operations) following Bryntum EventModel for resource scheduling
  const formattedTasks = operations.map(op => {
    // Ensure valid dates
    const startDate = op.startTime ? new Date(op.startTime) : new Date();
    const endDate = op.endTime ? new Date(op.endTime) : new Date(startDate.getTime() + 3600000);
    
    // Create display name with production order info when available
    const operationName = op.name || op.operationName || `Operation ${op.id}`;
    const productionOrderInfo = op.productionOrderName || op.productionOrderNumber;
    const displayName = productionOrderInfo 
      ? `${operationName} (${productionOrderInfo})`
      : operationName;
    
    return {
      id: op.id,
      name: displayName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      duration: Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 3600000)), // Duration in hours
      durationUnit: 'hour',
      
      // Ensure resource assignment for resource-based view
      resourceId: op.assignedResourceId || op.workCenterId || resources[0]?.id,
      
      // Task configuration
      manuallyScheduled: true, // Manual scheduling for resource view
      constraintType: null,
      constraintDate: null,
      
      // Custom fields for our application
      status: op.status || 'scheduled',
      orderId: op.productionOrderId || null,
      orderName: op.productionOrderName || null,
      orderNumber: op.productionOrderNumber || null,
      workCenterId: op.workCenterId || null,
      
      // Task appearance and behavior
      draggable: true,
      resizable: true,
      cls: `task-status-${op.status || 'scheduled'}`,
      
      // Color based on status
      eventColor: op.status === 'completed' ? 'green' : 
                 op.status === 'in-progress' ? 'blue' : 
                 op.status === 'delayed' ? 'red' : 'gray'
    };
  });
  
  // Format assignments following Bryntum AssignmentModel structure
  // This is the preferred way to link tasks to resources
  const formattedAssignments = operations
    .filter(op => op.assignedResourceId || op.workCenterId)
    .map((op, index) => ({
      id: `assignment-${op.id}`,
      event: op.id,  // Task ID
      resource: op.assignedResourceId || op.workCenterId,  // Resource ID
      units: 100,  // Percentage of resource allocation
      
      // Additional assignment fields
      effort: op.standardDuration || 1,
      effortUnit: 'hour'
    }));
  
  // Return data in flat structure for resource scheduling view
  // Resources are rows, tasks are events on timeline, assignments link them
  return {
    resources: { rows: formattedResources },
    tasks: { rows: formattedTasks },  // Flat task list
    assignments: { rows: formattedAssignments },
    dependencies: { rows: [] }
  };
}

// Helper function to validate Gantt data
export function validateGanttData(data: any) {
  const errors: string[] = [];
  
  // Validate resources
  if (!data.resources?.rows?.length) {
    errors.push('No resources found');
  }
  
  // Validate tasks
  if (!data.tasks?.rows?.length) {
    errors.push('No tasks found');
  } else {
    data.tasks.rows.forEach((task: any, index: number) => {
      if (!task.id) errors.push(`Task at index ${index} missing ID`);
      if (!task.name) errors.push(`Task ${task.id} missing name`);
      if (!task.startDate) errors.push(`Task ${task.id} missing start date`);
    });
  }
  
  // Validate assignments
  data.assignments?.rows?.forEach((assignment: any, index: number) => {
    if (!assignment.event) errors.push(`Assignment at index ${index} missing task reference`);
    if (!assignment.resource) errors.push(`Assignment at index ${index} missing resource reference`);
  });
  
  return errors;
}
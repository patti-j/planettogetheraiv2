// Gantt configuration for Resource-Based Scheduling View
// Reference: https://bryntum.com/products/gantt/docs/guide/Gantt/integration/react/guide
export const ganttConfig = {
  // Column configuration for resource grid (resources in left pane)
  columns: [
    { type: 'name', field: 'name', width: 250, text: 'Resource' }
  ],
  
  // View configuration for resource scheduling
  viewPreset: 'hourAndDay',
  barMargin: 3,
  rowHeight: 60,
  
  // Enable multi-assignment view for resources
  multiEventSelect: false,
  managedEventSizing: true,
  
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
    
    // Configure stores for resource view
    taskStore: {
      tree: false  // Flat task list for resource view
    },
    resourceStore: {
      tree: false  // Resources displayed as rows
    }
  }
};

// Format data following Bryntum React Data Binding documentation
// Reference: https://bryntum.com/products/gantt/docs/guide/Gantt/integration/react/data-binding
export function formatGanttData(operations: any[], resources: any[]) {
  // Format resources following Bryntum ResourceModel structure
  const formattedResources = resources.map(resource => ({
    id: resource.id,
    name: resource.name || `Resource ${resource.id}`,
    type: resource.type || 'Standard',
    // Additional resource fields
    calendar: resource.calendarId || null,
    eventColor: resource.color || null
  }));
  
  // Format tasks (operations) following Bryntum EventModel for resource scheduling
  const formattedTasks = operations.map(op => {
    // Ensure valid dates
    const startDate = op.startTime ? new Date(op.startTime) : new Date();
    const endDate = op.endTime ? new Date(op.endTime) : new Date(startDate.getTime() + 3600000);
    
    return {
      id: op.id,
      name: op.name || op.operationName || `Operation ${op.id}`,
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
  
  // Return in Bryntum project data format
  return {
    resources: { rows: formattedResources },
    tasks: { rows: formattedTasks },
    assignments: { rows: formattedAssignments },
    // Dependencies would go here if enabled (trial limitation)
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
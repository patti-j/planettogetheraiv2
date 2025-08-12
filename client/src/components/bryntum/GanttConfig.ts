// Gantt configuration following Bryntum React Integration Guide
// Reference: https://bryntum.com/products/gantt/docs/guide/Gantt/integration/react/guide
export const ganttConfig = {
  // Column configuration for task grid
  columns: [
    { type: 'name', field: 'name', width: 250, text: 'Task' }
  ],
  
  // View configuration
  viewPreset: 'weekAndDayLetter',
  barMargin: 10,
  rowHeight: 45,
  
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
  
  // Project configuration
  project: {
    autoLoad: false,
    autoSync: false
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
  
  // Format tasks (operations) following Bryntum TaskModel structure
  const formattedTasks = operations.map(op => {
    // Ensure valid dates
    const startDate = op.startTime ? new Date(op.startTime) : new Date();
    const endDate = op.endTime ? new Date(op.endTime) : new Date(startDate.getTime() + 3600000);
    
    return {
      id: op.id,
      name: op.name || op.operationName || `Operation ${op.id}`,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      duration: op.standardDuration || 1,
      durationUnit: 'hour',
      
      // Task configuration
      manuallyScheduled: false,
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
      
      // Resource assignment (deprecated - use assignments instead)
      resourceId: op.assignedResourceId || op.workCenterId
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
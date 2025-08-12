// Gantt configuration following Bryntum React quick start guide
export const ganttConfig = {
  columns: [
    { type: 'name', field: 'name', width: 250, text: 'Task' }
  ],
  viewPreset: 'weekAndDayLetter',
  barMargin: 10,
  
  // Resource columns for resource view
  resourceColumns: [
    { text: 'Resource', field: 'name', width: 200 }
  ],
  
  // Features configuration
  features: {
    taskDrag: true,
    taskDragCreate: false,
    taskResize: true,
    taskEdit: false,
    cellEdit: false,
    // Disable features that require full version
    percentDone: false,
    progressLine: false,
    dependencies: false,
    dependencyEdit: false,
    baselines: false,
    rollups: false
  },
  
  // Project configuration
  project: {
    autoLoad: false,
    autoSync: false,
    // This enables the resource assignment view
    resourceTimeRanges: false
  }
};

// Create data format following Bryntum structure
export function formatGanttData(operations: any[], resources: any[]) {
  // Format resources
  const formattedResources = resources.map(resource => ({
    id: resource.id,
    name: resource.name || `Resource ${resource.id}`,
    type: resource.type || 'Standard'
  }));
  
  // Format tasks (operations)
  const formattedTasks = operations.map(op => ({
    id: op.id,
    name: op.name || op.operationName || `Operation ${op.id}`,
    startDate: op.startTime || new Date().toISOString(),
    endDate: op.endTime || new Date(Date.now() + 3600000).toISOString(),
    duration: op.standardDuration || 1,
    durationUnit: 'hour',
    resourceId: op.assignedResourceId || op.workCenterId,
    // Status for styling
    status: op.status || 'scheduled',
    // Make tasks draggable
    draggable: true,
    resizable: true
  }));
  
  // Format assignments (link tasks to resources)
  const formattedAssignments = operations
    .filter(op => op.assignedResourceId || op.workCenterId)
    .map(op => ({
      id: `assignment-${op.id}`,
      event: op.id,
      resource: op.assignedResourceId || op.workCenterId,
      units: 100
    }));
  
  return {
    resources: { rows: formattedResources },
    tasks: { rows: formattedTasks },
    assignments: { rows: formattedAssignments }
  };
}
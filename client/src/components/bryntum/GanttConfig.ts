// Scheduler-style configuration for Resource-Based View
// Using Gantt in resource scheduling mode similar to Bryntum Scheduler
export const ganttConfig = {
  // Enhanced column configuration for resource grid with PT data
  columns: [
    { type: 'name', field: 'name', width: 200, text: 'Resource' },
    { field: 'type', width: 100, text: 'Type' },
    { field: 'capacity', width: 80, text: 'Capacity', align: 'right' }
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
    const endDate = op.endTime ? new Date(op.endTime) : new Date(startDate.getTime() + (op.duration || 60) * 60000);
    
    // Create comprehensive display name with PT data
    const jobName = op.jobName || '';
    const operationName = op.operationName || op.name || `Operation ${op.id}`;
    const manufacturingOrderName = op.manufacturingOrderName || '';
    
    // Enhanced display name with PT hierarchy: Job → Operation → Activity details
    let displayName = '';
    if (jobName && operationName) {
      displayName = `${jobName}: ${operationName}`;
      if (manufacturingOrderName && manufacturingOrderName !== jobName) {
        displayName += ` (MO: ${manufacturingOrderName})`;
      }
    } else if (operationName) {
      displayName = operationName;
    } else {
      displayName = `Operation ${op.id}`;
    }

    // Add sequence information for better ordering
    if (op.sequence && op.sequence > 0) {
      displayName = `${op.sequence}. ${displayName}`;
    }

    // Add timing breakdown in tooltip/description
    const timingDetails = [];
    if (op.setupTime > 0) timingDetails.push(`Setup: ${Math.round(op.setupTime)}min`);
    if (op.cycleTime > 0) timingDetails.push(`Cycle: ${Math.round(op.cycleTime)}min`);
    if (op.cleanupTime > 0) timingDetails.push(`Cleanup: ${Math.round(op.cleanupTime)}min`);
    if (op.postProcessTime > 0) timingDetails.push(`Post: ${Math.round(op.postProcessTime)}min`);
    
    const timingInfo = timingDetails.length > 0 ? `\nTiming: ${timingDetails.join(', ')}` : '';
    const quantityInfo = op.requiredQuantity > 0 ? `\nQty: ${op.requiredQuantity}` : '';
    const activityDescription = `${op.description || ''}${timingInfo}${quantityInfo}`;
    
    return {
      id: op.id,
      name: displayName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      duration: Math.max(1, Math.round(op.duration || 60)), // Duration in minutes
      durationUnit: 'minute',
      
      // Enhanced resource assignment using PT data
      resourceId: op.assignedResourceId || op.workCenterId || resources[0]?.id,
      
      // Task configuration
      manuallyScheduled: true,
      constraintType: null,
      constraintDate: null,
      
      // Enhanced PT data fields
      status: op.status || 'scheduled',
      orderId: op.manufacturingOrderId || null,
      orderName: op.manufacturingOrderName || null,
      orderNumber: op.manufacturingOrderName || null,
      workCenterId: op.workCenterId || null,
      workCenterName: op.workCenterName || op.assignedResourceName,
      
      // PT-specific fields for detailed display
      jobId: op.jobId,
      jobName: op.jobName,
      operationId: op.operationId,
      operationName: op.operationName,
      sequence: op.sequence || 0,
      productCode: op.productCode || '',
      outputName: op.outputName || '',
      requiredQuantity: op.requiredQuantity || 0,
      
      // Activity timing breakdown
      setupTime: op.setupTime || 0,
      cycleTime: op.cycleTime || 0,
      cleanupTime: op.cleanupTime || 0,
      postProcessTime: op.postProcessTime || 0,
      
      // Progress and quality
      completionPercentage: op.completionPercentage || 0,
      qualityCheckRequired: op.qualityCheckRequired || false,
      qualityStatus: op.qualityStatus || 'pending',
      
      // Scheduling constraints
      onHold: op.onHold || false,
      holdReason: op.holdReason || '',
      priority: op.priority || 5,
      
      // Task appearance and behavior
      draggable: !op.onHold,
      resizable: !op.onHold,
      cls: `task-status-${(op.status || 'scheduled').replace(/[^a-zA-Z0-9]/g, '-')} ${op.onHold ? 'task-on-hold' : ''}`,
      
      // Enhanced status-based coloring
      eventColor: op.onHold ? '#FFA500' : // Orange for on hold
                 op.status === 'completed' ? '#4CAF50' : // Green
                 op.status === 'in_progress' ? '#2196F3' : // Blue  
                 op.status === 'delayed' ? '#F44336' : // Red
                 op.priority <= 2 ? '#9C27B0' : // Purple for high priority
                 '#757575', // Gray for scheduled
      
      // Custom tooltip with comprehensive PT information
      note: activityDescription
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
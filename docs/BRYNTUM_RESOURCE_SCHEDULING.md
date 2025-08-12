# Bryntum Resource Scheduling Configuration

## Overview
This document explains how to configure Bryntum Gantt for resource-centered scheduling, where resources appear as rows and operations are displayed as draggable blocks on the timeline.

## Key Concepts

### Scheduler vs Gantt
- **Bryntum Scheduler**: Resource-focused view with events on timeline
- **Bryntum Gantt**: Task-focused view with dependencies and project management
- Our approach: Configure Gantt in resource scheduling mode similar to Scheduler

## Configuration Structure

### 1. Resource Grid Configuration
```javascript
columns: [
  { type: 'name', field: 'name', width: 250, text: 'Resource' }
]
```

### 2. View Settings
```javascript
viewPreset: 'hourAndDay',    // Timeline granularity
barMargin: 5,                 // Space between events
rowHeight: 70,                // Height of resource rows
eventLayout: 'stack',         // Stack overlapping events
allowOverlap: false           // Prevent event overlap
```

### 3. Data Structure

#### Resources (Rows in left pane)
```javascript
{
  id: 1,
  name: 'Assembly Line A',
  type: 'assembly',
  capacity: 100,
  eventColor: '#4CAF50'
}
```

#### Operations/Tasks (Timeline events)
```javascript
{
  id: 1,
  name: 'Mixing Operation',
  startDate: '2025-08-07T10:00:00',
  endDate: '2025-08-07T12:00:00',
  resourceId: 1,  // Links to resource
  draggable: true,
  resizable: true
}
```

#### Assignments (Links operations to resources)
```javascript
{
  id: 'assignment-1',
  event: 1,        // Task ID
  resource: 1,     // Resource ID
  units: 100       // Allocation percentage
}
```

## Implementation

### Data Formatting Function
```javascript
export function formatGanttData(operations, resources) {
  // Format resources as flat list
  const formattedResources = resources.map(resource => ({
    id: resource.id,
    name: resource.name,
    type: resource.type,
    capacity: resource.capacity || 100
  }));

  // Format operations as timeline events
  const formattedTasks = operations.map(op => ({
    id: op.id,
    name: op.name,
    startDate: op.startTime,
    endDate: op.endTime,
    resourceId: op.assignedResourceId,
    draggable: true,
    resizable: true
  }));

  // Create assignments
  const formattedAssignments = formattedTasks.map(task => ({
    id: `assignment-${task.id}`,
    event: task.id,
    resource: task.resourceId,
    units: 100
  }));

  return {
    resources: { rows: formattedResources },
    tasks: { rows: formattedTasks },
    assignments: { rows: formattedAssignments }
  };
}
```

### Gantt Configuration
```javascript
const gantt = new Gantt({
  appendTo: container,
  height: 500,
  
  // Resource scheduling configuration
  columns: [
    { type: 'name', field: 'name', text: 'Resource' }
  ],
  
  viewPreset: 'hourAndDay',
  rowHeight: 70,
  
  project: {
    autoLoad: false,
    autoSync: false,
    resources: resourceData,
    tasks: taskData,
    assignments: assignmentData
  },
  
  features: {
    taskDrag: true,
    taskResize: true,
    columnLines: true
  }
});
```

## Drag & Drop Behavior

### Moving Operations Between Resources
- Drag operation from one resource row to another
- Assignment automatically updates
- Resource allocation recalculates

### Adjusting Operation Timing
- Drag horizontally to change start/end times
- Resize handles to adjust duration
- Snap to timeline grid for precision

## Event Handlers

### Task Drop Handler
```javascript
afterTaskDrop: async ({ taskRecords, valid }) => {
  if (!valid || !taskRecords[0]) return;
  
  const task = taskRecords[0];
  const newResourceId = task.resourceId;
  
  // Update backend
  await updateOperation(task.id, {
    resourceId: newResourceId,
    startDate: task.startDate,
    endDate: task.endDate
  });
}
```

## Relevant Bryntum Examples
1. **Drag from Grid**: https://bryntum.com/products/scheduler/examples/dragfromgrid/
2. **Resource Utilization**: https://www.bryntum.com/products/gantt/examples/resourceutilization/
3. **External Drag & Drop**: https://bryntum.com/products/scheduler-for-extjs/examples/externaldragdrop/

## Trial Limitations
- No dependencies features
- No percentDone/progressLine
- No critical path analysis
- Basic features only

## Best Practices
1. Use flat data structures (not hierarchical)
2. Ensure proper resource-task assignments
3. Configure drag constraints appropriately
4. Implement validation for business rules
5. Provide visual feedback during drag operations
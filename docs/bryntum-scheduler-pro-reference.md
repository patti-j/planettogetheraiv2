# Bryntum Scheduler Pro Reference Documentation

## Overview

The Scheduler Pro is an extension of the Bryntum Scheduler that combines visualization capabilities with a powerful scheduling engine. It manages project data composed of tasks, dependencies, resources, assignments and calendars.

## Key Differences from Basic Scheduler

- **Scheduler**: Uses EventStore, ResourceStore (optionally AssignmentStore and DependencyStore)
- **Scheduler Pro**: Always uses AssignmentStore to manage event assignments
- **Dependencies**: In Pro, dependencies actually affect scheduling (not just visual)
- **Scheduling Engine**: Pro includes automatic rescheduling based on constraints, dependencies and calendars
- **Progress Tracking**: Pro supports task completion progress bars
- **Additional Widgets**: Timeline widget and Resource Histogram widget

## Basic Setup Configuration

```javascript
const scheduler = new SchedulerPro({
   project : {
       autoLoad  : true,
       transport : {
           load : {
               url : './data/data.json'
           }
      }
   },
   adopt             : 'container',
   startDate         : '2020-05-01',
   endDate           : '2020-09-30',
   viewPreset        : 'dayAndWeek',
   features : {
      columnLines  : false,
      dependencies : true
  },
  columns : [
      {
          type           : 'resourceInfo',
          text           : 'Worker',
          showEventCount : true
      }
  ]
});
```

## Data Model Structure

### Resources
```javascript
{
  id: 'r1',
  name: 'Resource Name',
  type: 'Resource Type',
  capacity: 100,
  active: true,
  capabilities: ['capability1', 'capability2']
}
```

### Events (Operations)
```javascript
{
  id: 'e1',
  name: 'Operation Name',
  startDate: '2025-01-22T08:00:00',
  endDate: '2025-01-22T12:00:00',
  duration: 4,
  durationUnit: 'hour'
}
```

### Assignments
```javascript
{
  id: 'a1',
  eventId: 'e1',
  resourceId: 'r1',
  units: 100 // Percentage of resource allocation
}
```

### Dependencies
```javascript
{
  id: 'd1',
  from: 'e1',
  to: 'e2',
  type: 2, // 0: Start-to-Start, 1: Start-to-Finish, 2: Finish-to-Start, 3: Finish-to-Finish
  lag: 0,
  lagUnit: 'hour'
}
```

## Features Configuration

### Event Drag & Drop
```javascript
features: {
  eventDrag: {
    showTooltip: true,
    constrainDragToResource: false,
    constrainDragToTimeSlot: false,
    validatorFn: ({ dragData, targetResourceRecord, startDate, endDate }) => {
      // Custom validation logic
      return {
        valid: true/false,
        message: 'Validation message'
      };
    }
  }
}
```

### Event Resize
```javascript
features: {
  eventResize: {
    showTooltip: true,
    validatorFn: ({ eventRecord }) => {
      // Custom validation logic
      return { valid: true/false, message: 'Message' };
    }
  }
}
```

### Event Tooltips
```javascript
features: {
  eventTooltip: {
    template: ({ eventRecord }) => `
      <div class="operation-tooltip">
        <h4>${eventRecord.name}</h4>
        <p><strong>Status:</strong> ${eventRecord.status}</p>
        <p><strong>Duration:</strong> ${eventRecord.duration} hours</p>
      </div>
    `
  }
}
```

## Event Handlers

### Common Event Patterns
```javascript
// Drag and drop handling
onEventDrop: ({ eventRecord, newResource, oldResource }) => {
  console.log('Event moved:', eventRecord.name);
  // Update backend data
},

// Resize handling
onEventResizeEnd: ({ eventRecord }) => {
  console.log('Event resized:', eventRecord.name);
  // Update backend data
},

// Ready handler
onReady: ({ widget }) => {
  console.log('Scheduler loaded');
  console.log('Store counts:', {
    resources: widget.resourceStore.count,
    events: widget.eventStore.count,
    assignments: widget.assignmentStore.count
  });
}
```

## Resource Availability Methods

```javascript
// Check if date range is available for a resource
scheduler.isDateRangeAvailable(startDate, endDate, excludeEvent, resource)

// Get coordinate from date
scheduler.getDateFromCoordinate(coordinate, 'round', false)

// Get distance for duration
scheduler.timeAxisViewModel.getDistanceForDuration(durationMs)
```

## Column Configuration

### Resource Info Column
```javascript
{
  type: 'resourceInfo',
  field: 'name',
  text: 'Resource',
  width: 200,
  htmlEncode: false,
  renderer: ({ record }) => {
    return `<i class="icon"></i> ${record.name}`;
  }
}
```

### Custom Columns
```javascript
{
  field: 'customField',
  text: 'Custom',
  width: 100,
  renderer: ({ value, record }) => {
    return `Custom: ${value}`;
  }
}
```

## View Presets

Common view presets:
- `hourAndDay` - Hourly ticks with day headers
- `dayAndWeek` - Daily ticks with week headers  
- `weekAndMonth` - Weekly ticks with month headers
- `monthAndYear` - Monthly ticks with year headers

## Best Practices

1. **Data Structure**: Always use separate stores for resources, events, assignments, and dependencies
2. **Validation**: Implement comprehensive validation in drag/resize validators
3. **Performance**: Use appropriate view presets for your data density
4. **Error Handling**: Always handle onError events for operations
5. **Cleanup**: Properly dispose of scheduler instances when components unmount
6. **Updates**: Use proper data update patterns to trigger re-renders

## Common Pitfalls

1. **Assignment Store**: Pro always requires assignments - don't assign resourceId directly on events
2. **Dependencies**: Dependencies in Pro affect actual scheduling, not just visualization
3. **Data Updates**: Always update through stores, not direct record modification
4. **View Refreshing**: Use appropriate refresh methods after data changes
5. **Memory Leaks**: Always clean up event listeners and dispose widgets properly
# Bryntum Drag-and-Drop Implementation Guide

## Overview

Bryntum Scheduler Pro supports advanced drag-and-drop functionality including:
- Dragging events within the scheduler
- Dragging unplanned tasks from external grids
- Custom validation during drag operations
- Visual feedback and proxy creation

## Drag From External Grid Pattern

### Grid Setup

```javascript
import { BryntumGrid } from '@bryntum/schedulerpro-react';

const UnscheduledGrid = () => {
  const gridRef = useRef();
  
  const gridConfig = {
    data: unscheduledOperations,
    columns: [
      { text: 'Operation', field: 'name', width: 180 },
      { text: 'Duration', field: 'duration', width: 80 },
      { text: 'Priority', field: 'priority', width: 80 }
    ],
    features: {
      stripe: true,
      sort: true
    }
  };
  
  return <BryntumGrid ref={gridRef} {...gridConfig} />;
};
```

### DragHelper Configuration

```javascript
useEffect(() => {
  if (gridRef.current && schedulerRef.current) {
    const dragHelper = new bryntum.schedulerpro.DragHelper({
      // Don't drag the actual row element, clone it
      cloneTarget: true,
      
      // We size the cloned element manually
      autoSizeClonedTarget: false,
      
      // Only allow drops on the schedule area
      dropTargetSelector: '.b-timeline-subgrid',
      
      // Only allow drag of row elements inside the unplanned grid
      targetSelector: '.b-grid-row:not(.b-group-row)',
      
      onDragStart: ({ context }) => {
        const task = grid.getRecordFromElement(context.grabbed);
        context.task = task;
        
        // Enable scrolling in scheduler
        scheduler.enableScrollingCloseToEdges(scheduler.timeAxisSubGrid);
        
        // Disable tooltips during drag
        if (scheduler.features.eventTooltip) {
          scheduler.features.eventTooltip.disabled = true;
        }
      },
      
      onDrag: ({ event, context }) => {
        const { task } = context;
        const coordinate = scheduler.getCoordinateFromDate(new Date());
        const startDate = scheduler.getDateFromCoordinate(coordinate, 'round', false);
        const resource = context.target && scheduler.resolveResourceRecord(
          context.target, 
          [event.offsetX, event.offsetY]
        );
        
        // Validate drop location
        context.valid = Boolean(startDate && resource) && 
          (scheduler.allowOverlap || scheduler.isDateRangeAvailable(
            startDate, 
            new Date(startDate.getTime() + task.duration * 60 * 60 * 1000), 
            null, 
            resource
          ));
        
        context.resource = resource;
      },
      
      onDrop: ({ context }) => {
        const { task, target, resource, valid, element } = context;
        
        if (valid && target && resource) {
          const coordinate = bryntum.schedulerpro.DomHelper.getTranslateX(element);
          const startDate = scheduler.getDateFromCoordinate(coordinate, 'round', false);
          
          if (startDate) {
            // Remove from grid
            grid.store.remove(task);
            
            // Add to scheduler
            task.startDate = startDate;
            task.assign(resource);
            scheduler.eventStore.add(task);
          }
        }
        
        // Cleanup
        scheduler.disableScrollingCloseToEdges(scheduler.timeAxisSubGrid);
        if (scheduler.features.eventTooltip) {
          scheduler.features.eventTooltip.disabled = false;
        }
      }
    });
  }
}, [gridRef.current, schedulerRef.current]);
```

## Custom Drag Proxy Creation

```javascript
createProxy: (element) => {
  const task = grid.getRecordFromElement(element);
  const proxy = document.createElement('div');
  const durationInPx = scheduler.timeAxisViewModel.getDistanceForDuration(
    task.duration * 60 * 60 * 1000
  );
  
  // Create scheduler event-like proxy
  proxy.classList.add(
    'b-sch-event-wrap', 
    'b-sch-event', 
    'b-unassigned-class', 
    `b-sch-${scheduler.mode}`
  );
  
  proxy.innerHTML = `
    <div class="b-sch-event b-has-content b-sch-event-withicon">
      <div class="b-sch-event-content">
        <i class="${task.iconCls}"></i> ${task.name}
      </div>
    </div>
  `;
  
  proxy.style.height = `${scheduler.rowHeight - (2 * scheduler.resourceMargin)}px`;
  proxy.style.width = `${durationInPx}px`;
  
  return proxy;
}
```

## Event Drag Validation

### Basic Validation
```javascript
features: {
  eventDrag: {
    validatorFn: ({ dragData, targetResourceRecord, startDate, endDate }) => {
      const event = dragData.eventRecord;
      
      // Check if event is locked
      if (event.readOnly) {
        return {
          valid: false,
          message: 'Locked operations cannot be moved'
        };
      }
      
      // Check resource availability
      if (!targetResourceRecord || !targetResourceRecord.active) {
        return {
          valid: false,
          message: 'Cannot assign to inactive resource'
        };
      }
      
      return { valid: true };
    }
  }
}
```

### Advanced Validation with Conflict Detection
```javascript
validatorFn: ({ dragData, targetResourceRecord, startDate, endDate }) => {
  const event = dragData.eventRecord;
  const scheduler = schedulerRef.current;
  
  // Resource capability validation
  if (targetResourceRecord.capabilities && event.requiredCapabilities) {
    const hasCapabilities = event.requiredCapabilities.every(cap =>
      targetResourceRecord.capabilities.includes(cap)
    );
    
    if (!hasCapabilities) {
      return {
        valid: false,
        message: 'Resource lacks required capabilities'
      };
    }
  }
  
  // Time conflict validation
  if (scheduler && startDate && endDate) {
    const hasConflict = scheduler.eventStore.query(record => 
      record !== event && 
      record.resources.includes(targetResourceRecord) &&
      !(record.endDate <= startDate || record.startDate >= endDate)
    ).length > 0;
    
    if (hasConflict) {
      return {
        valid: false,
        message: 'Time slot conflicts with existing operation'
      };
    }
  }
  
  return { valid: true, message: 'Valid assignment' };
}
```

## Event Resize Validation

```javascript
features: {
  eventResize: {
    validatorFn: ({ eventRecord, startDate, endDate }) => {
      // Check minimum duration
      const duration = endDate - startDate;
      const minDuration = 30 * 60 * 1000; // 30 minutes
      
      if (duration < minDuration) {
        return {
          valid: false,
          message: 'Minimum duration is 30 minutes'
        };
      }
      
      // Check working hours
      const startHour = startDate.getHours();
      const endHour = endDate.getHours();
      
      if (startHour < 7 || endHour > 22) {
        return {
          valid: false,
          message: 'Operations must be within working hours (7 AM - 10 PM)'
        };
      }
      
      return { valid: true };
    }
  }
}
```

## Visual Feedback Patterns

### Drag Tooltips
```javascript
features: {
  eventDrag: {
    showTooltip: true,
    tooltipTemplate: ({ eventRecord, startDate, endDate }) => `
      <div class="drag-tooltip">
        <h4>${eventRecord.name}</h4>
        <p>New time: ${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}</p>
        <p>Duration: ${Math.round((endDate - startDate) / (1000 * 60 * 60))} hours</p>
      </div>
    `
  }
}
```

### Custom CSS for Drag States
```css
.b-dragging .b-sch-event {
  opacity: 0.7;
  transform: scale(1.02);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.b-drag-invalid {
  background-color: #fee2e2 !important;
  border-color: #dc2626 !important;
}

.b-drag-valid {
  background-color: #dcfce7 !important;
  border-color: #16a34a !important;
}
```

## Event Handlers for Drag Operations

```javascript
// Handle successful drops
onEventDrop: ({ eventRecord, newResource, oldResource }) => {
  console.log('Event moved:', {
    event: eventRecord.name,
    from: oldResource?.name,
    to: newResource?.name,
    newStart: eventRecord.startDate
  });
  
  // Update backend
  updateOperation(eventRecord.id, {
    resourceId: newResource.id,
    startDate: eventRecord.startDate.toISOString(),
    endDate: eventRecord.endDate.toISOString()
  });
},

// Handle resize completion
onEventResizeEnd: ({ eventRecord }) => {
  console.log('Event resized:', {
    event: eventRecord.name,
    duration: eventRecord.duration,
    newEnd: eventRecord.endDate
  });
  
  // Update backend
  updateOperation(eventRecord.id, {
    duration: eventRecord.duration,
    endDate: eventRecord.endDate.toISOString()
  });
}
```

## Performance Considerations

1. **Debounce validation** for complex validation logic
2. **Cache resource capabilities** to avoid repeated lookups
3. **Limit conflict checking** to relevant time ranges
4. **Use efficient data structures** for conflict detection
5. **Minimize DOM manipulation** during drag operations

## Accessibility

```javascript
features: {
  eventDrag: {
    // Enable keyboard navigation
    enableKeyboardNavigation: true,
    
    // Screen reader announcements
    announceValidation: true,
    
    // Focus management
    maintainFocus: true
  }
}
```

## Testing Drag Operations

```javascript
// Test drag validation
const testDragValidation = (event, targetResource, startDate, endDate) => {
  const validator = scheduler.features.eventDrag.validatorFn;
  const result = validator({
    dragData: { eventRecord: event },
    targetResourceRecord: targetResource,
    startDate,
    endDate
  });
  
  expect(result.valid).toBe(true);
  expect(result.message).toContain('Valid');
};
```

## Best Practices

1. **Always provide clear validation messages**
2. **Use visual feedback during drag operations**
3. **Implement proper cleanup in drag handlers**
4. **Handle edge cases (boundaries, conflicts)**
5. **Test drag operations thoroughly**
6. **Consider mobile/touch interactions**
7. **Provide keyboard alternatives**
8. **Optimize for performance with large datasets**
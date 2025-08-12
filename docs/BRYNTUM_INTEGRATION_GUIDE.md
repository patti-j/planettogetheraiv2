# Bryntum Gantt Integration Guide & Troubleshooting

## Session Summary & Lessons Learned

### What We Discovered
1. **Severe Caching Issues**: Vite and browser caching can cause deleted components to persist
2. **Component Conflicts**: Old React-based Gantt components conflict with Bryntum
3. **Minimal Implementation**: Current implementation only shows test data without features
4. **Missing Features**: Drag-drop, resource management, and real data integration not configured

### Current Status
✅ **Working:**
- Bryntum Gantt renders successfully
- Test task displays correctly
- Proper dimensions (732x500)
- CSS styling loads

❌ **Not Working:**
- Drag and drop functionality
- Real production data integration
- Resource assignment
- Task dependencies
- Critical features like progress tracking

## Root Cause Analysis

### Why Drag-Drop Doesn't Work
The current `BryntumGanttSimple` component uses an **absolute minimal configuration**:
```javascript
const gantt = new Gantt({
  appendTo: containerRef.current,
  height: 500,
  width: '100%',
  project: {
    tasks: [{ id: 1, name: 'Test Task 1', startDate: '2025-01-12', duration: 5 }]
  }
});
```

**Missing Critical Features:**
- No `features` configuration
- No event listeners for drag-drop
- No resource store
- No dependency store
- No proper data binding

## Full Bryntum Implementation Requirements

### 1. Enable All Features
```javascript
features: {
  // Drag and Drop
  taskDrag: true,           // Enable task dragging
  taskDragCreate: true,     // Create tasks by dragging
  taskResize: true,         // Resize tasks by dragging
  
  // Resource Management
  resourceAssignment: true,
  resourceTimeRanges: true,
  
  // Dependencies
  dependencies: true,
  dependencyEdit: true,
  
  // UI Features
  cellEdit: true,
  taskEdit: true,
  projectLines: true,
  rollups: true,
  progressLine: true,
  criticalPaths: true,
  
  // Export/Import
  pdfExport: true,
  excelExporter: true
}
```

### 2. Configure Stores Properly
```javascript
project: {
  // Resource Store
  resourceStore: {
    data: resources.map(r => ({
      id: r.id,
      name: r.name,
      calendar: r.calendarId
    }))
  },
  
  // Assignment Store (links tasks to resources)
  assignmentStore: {
    data: operations.map(op => ({
      id: `assignment-${op.id}`,
      taskId: op.id,
      resourceId: op.workCenterId,
      units: 100
    }))
  },
  
  // Dependency Store
  dependencyStore: {
    data: [] // Add task dependencies here
  },
  
  // Task Store with real data
  taskStore: {
    data: operations.map(op => ({
      id: op.id,
      name: op.operationName,
      startDate: op.startTime,
      endDate: op.endTime,
      duration: op.duration,
      percentDone: op.completionPercentage,
      // Enable dragging for this task
      draggable: true,
      resizable: true
    }))
  }
}
```

### 3. Add Event Listeners
```javascript
listeners: {
  // Task drag events
  beforeTaskDrag: ({ taskRecords, context }) => {
    console.log('Starting drag:', taskRecords);
    return true; // Allow drag
  },
  
  taskDrop: ({ taskRecords, targetDate, targetResource }) => {
    console.log('Task dropped:', { taskRecords, targetDate, targetResource });
    // Call API to update backend
    onOperationMove?.(
      taskRecords[0].id, 
      targetResource?.id, 
      targetDate,
      taskRecords[0].endDate
    );
  },
  
  // Task resize events
  taskResizeEnd: ({ taskRecord, startDate, endDate }) => {
    console.log('Task resized:', { taskRecord, startDate, endDate });
    // Update backend
  }
}
```

### 4. Configure Columns
```javascript
columns: [
  { type: 'name', field: 'name', text: 'Operation', width: 250 },
  { type: 'startdate', text: 'Start Date' },
  { type: 'duration', text: 'Duration' },
  { type: 'resourceassignment', text: 'Resources', width: 150 },
  { type: 'percentdone', text: 'Progress', width: 80 },
  { type: 'addnew' } // Add button for new tasks
]
```

## Troubleshooting Checklist

### 1. Verify Bryntum Files
```bash
# Check if all required files exist
ls -la bryntum-trial/build/gantt.module.js
ls -la bryntum-trial/build/gantt.stockholm.css
```

### 2. Check Browser Console
Look for these specific items:
- `Bryntum Gantt 6.3.1 Trial` message
- No 404 errors for Bryntum files
- `gantt.isVisible: true`
- No licensing errors

### 3. Verify CSS Loading
```javascript
// In console, check if Bryntum CSS classes exist
document.querySelector('.b-gantt')
document.querySelector('.b-gantt-task')
document.querySelector('.b-dragging') // Should appear when dragging
```

### 4. Debug Drag-Drop
```javascript
// Add to Gantt config for debugging
listeners: {
  beforeTaskDrag: () => {
    console.log('DRAG START - If you see this, drag is partially working');
    return true;
  },
  taskDragStart: () => console.log('DRAG ACTUALLY STARTED'),
  taskDrag: () => console.log('DRAGGING...'),
  taskDrop: () => console.log('DROPPED!')
}
```

## Common Issues & Solutions

### Issue 1: Drag Doesn't Start
**Symptom:** Clicking and dragging does nothing
**Solution:** 
- Ensure `features.taskDrag: true`
- Check `draggable: true` on tasks
- Verify no CSS `pointer-events: none`

### Issue 2: Component Flashing
**Symptom:** Old components appear then disappear
**Solution:**
- Clear Vite cache: `rm -rf node_modules/.vite`
- Remove conflicting imports
- Hard refresh: Ctrl+Shift+R

### Issue 3: "Cannot read property of undefined"
**Symptom:** Errors when dragging
**Solution:**
- Ensure all stores are properly initialized
- Check data has required fields (id, startDate, etc.)

### Issue 4: Drag Works But Doesn't Save
**Symptom:** Task moves but snaps back
**Solution:**
- Implement `taskDrop` listener
- Call backend API in the listener
- Update local store after API success

## Implementation Steps

### Step 1: Update BryntumGanttSimple Component
Replace minimal config with full feature set (see examples above)

### Step 2: Connect Real Data
Map production operations and resources to Bryntum format

### Step 3: Implement Event Handlers
Add listeners for all drag, resize, and edit events

### Step 4: Test Each Feature
1. Test drag between dates
2. Test drag between resources
3. Test task resize
4. Test dependency creation
5. Test progress updates

### Step 5: Backend Integration
Ensure all changes persist to database via API calls

## Quick Test Code
Add this to browser console to test if drag is enabled:
```javascript
const gantt = document.querySelector('.b-gantt')?.bryntum;
if (gantt) {
  console.log('Drag enabled?', gantt.features.taskDrag?.enabled);
  console.log('Tasks draggable?', gantt.taskStore.first?.draggable);
  console.log('Feature list:', Object.keys(gantt.features));
}
```

## Next Actions
1. Replace minimal test config with full feature configuration
2. Add proper event listeners for drag-drop
3. Connect real production data
4. Test all interactions
5. Implement backend persistence

## Resources
- [Bryntum Gantt Docs](https://bryntum.com/docs/gantt)
- [Drag Drop Guide](https://bryntum.com/docs/gantt/#Gantt/feature/TaskDrag)
- [React Integration](https://bryntum.com/docs/gantt/#Gantt/guides/integration/react.md)

---
*Last Updated: August 12, 2025*
*Issue: Drag-drop not working due to minimal configuration without features enabled*
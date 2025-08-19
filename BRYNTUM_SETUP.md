# Bryntum Gantt Integration Setup Guide

## Quick Start

### 1. HTML Script Setup (client/index.html)
```html
<!-- Load Bryntum Gantt UMD build -->
<script src="/bryntum-trial/gantt.umd.js"></script>
<link rel="stylesheet" href="/bryntum-trial/gantt.stockholm.css">
```

### 2. Component Implementation (BryntumSchedulerWrapper.tsx)

#### Key Requirements:
- Wait for `window.bryntum.gantt` to be available
- Use minimal configuration initially
- Add instance guard to prevent duplicates
- Proper cleanup in useEffect

#### Working Code Pattern:
```typescript
useEffect(() => {
  // Guard conditions
  if (isLoading || !containerRef.current || !operations || !resources) {
    return;
  }

  const initScheduler = async () => {
    // Prevent multiple instances
    if (schedulerRef.current) {
      return;
    }
    
    // Wait for Bryntum
    if (!window.bryntum?.gantt) {
      setTimeout(initScheduler, 500);
      return;
    }

    const { Gantt } = window.bryntum.gantt;
    
    // Minimal config
    const config = {
      appendTo: containerRef.current,
      height: 400, // Use number, not string
      startDate: '2025-08-19',
      endDate: '2025-08-31',
      columns: [
        { type: 'name', text: 'Task', width: 250 }
      ],
      tasks: transformedTasks
    };
    
    schedulerRef.current = new Gantt(config);
  };

  initScheduler();

  // Cleanup
  return () => {
    if (schedulerRef.current) {
      schedulerRef.current.destroy();
      schedulerRef.current = null;
    }
  };
}, [isLoading, operations, resources]); // Don't include isInitialized!
```

### 3. Data Transformation

Transform PT operations to Gantt tasks:
```typescript
const tasks = operations.map(op => ({
  id: op.id,
  name: op.name,
  startDate: op.scheduledStart.split('T')[0], // YYYY-MM-DD format
  duration: Math.max(1, calculateDaysFromDates(op.scheduledStart, op.scheduledEnd)),
  percentDone: op.percentComplete || 0
}));
```

## Troubleshooting Checklist

### Issue: "Cannot read properties of undefined"
✅ Solution: Bryntum not loaded yet - add retry logic with setTimeout

### Issue: Component creates/destroys repeatedly
✅ Solution: Remove `isInitialized` from useEffect dependencies

### Issue: Multiple Gantt instances created
✅ Solution: Add `if (schedulerRef.current) return;` guard

### Issue: No visual output
✅ Solution: 
- Use numeric height value (400 not "400px")
- Ensure container has proper dimensions
- Check browser console for errors

### Issue: React Strict Mode double-mounting
✅ Solution: Instance guard and proper cleanup handle this automatically

## Console Success Indicators

Look for these messages in browser console:
- ✅ "Bryntum.gantt available? true"
- ✅ "Gantt constructor found: function"
- ✅ "✅ Gantt created successfully!"
- ✅ "Loading real tasks: 20 tasks"
- ✅ "Scheduler initialized successfully"

## Files Involved

1. `/client/index.html` - Script tag loading
2. `/client/src/components/bryntum/BryntumSchedulerWrapper.tsx` - Main wrapper component
3. `/client/src/pages/demo.tsx` - Demo page using the component
4. `/bryntum-trial/` - Bryntum trial files (gantt.umd.js, CSS files)

## API Endpoints Used

- `/api/pt-operations` - Fetches operation data
- `/api/resources` - Fetches resource data
- `/api/pt-jobs` - Fetches job data

## Next Steps for Advanced Features

Once basic Gantt is working, gradually add:
1. Resource assignments
2. Dependencies between tasks
3. Drag and drop (eventDrag, eventResize)
4. Context menus
5. Custom tooltips
6. Export functionality

Remember: Start simple, add complexity gradually!
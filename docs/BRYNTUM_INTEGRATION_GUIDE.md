# Bryntum Gantt React Integration Guide

## Current Setup (UMD Build)

We're currently using the UMD build of Bryntum Gantt for development. This guide documents both the current implementation and the production-ready NPM approach.

## Production Setup (NPM Packages)

### Prerequisites
- Node.js 16+
- npm 6.9.0+ or 7.11.0+ (for package aliasing)
- React 18.0.0+ (minimum 16.0.0)
- TypeScript 4.0.0+ (minimum 3.6.0)

### Installation Steps

1. **Configure NPM Registry** (see `BRYNTUM_NPM_SETUP.md`)
2. **Login to Bryntum Registry**
3. **Install Packages**:
   ```bash
   npm install @bryntum/gantt@npm:@bryntum/gantt-trial@6.3.1
   npm install @bryntum/gantt-react@6.3.1
   ```

### Vite Configuration Updates

Add to `vite.config.ts` (when using NPM packages):
```javascript
{
  optimizeDeps: {
    include: ['@bryntum/gantt', '@bryntum/gantt-react']
  },
  build: {
    rollupOptions: {
      onLog(level, log, handler) {
        if (log.code === 'CIRCULAR_DEPENDENCY') {
          return; // Ignore for Bryntum thin packages
        }
        handler(level, log);
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'legacy-js-api']
      }
    }
  }
}
```

## React Component Best Practices

### 1. Component Lifecycle Management

```tsx
import { useEffect, useRef } from 'react';
import { BryntumGantt } from '@bryntum/gantt-react';

function GanttComponent() {
  const ganttRef = useRef(null);

  useEffect(() => {
    // Access Gantt instance
    const gantt = ganttRef.current?.instance;
    
    return () => {
      // Cleanup is handled automatically by wrapper
    };
  }, []);

  return <BryntumGantt ref={ganttRef} {...config} />;
}
```

### 2. Data Binding

```tsx
// Use project configuration for data
const ganttConfig = {
  project: {
    tasks: taskData,
    resources: resourceData,
    assignments: assignmentData,
    dependencies: dependencyData
  },
  // Or use inline data (deprecated pattern)
  tasks: taskData,  // Deprecated
  resources: resourceData,  // Deprecated
  assignments: assignmentData  // Deprecated
};
```

### 3. Event Handling

```tsx
const handleTaskDrop = ({ context }) => {
  console.log('Task dropped:', context.newResource);
};

const handleTaskResize = ({ taskRecord, startDate, endDate }) => {
  console.log('Task resized:', taskRecord.name);
};

<BryntumGantt
  onTaskDrop={handleTaskDrop}
  onTaskResizeEnd={handleTaskResize}
  onBeforeTaskEdit={({ taskRecord }) => {
    // Return false to prevent editing
    return taskRecord.editable !== false;
  }}
/>
```

### 4. Feature Configuration

```tsx
const ganttConfig = {
  features: {
    taskDrag: {
      enabled: true,
      showTooltip: true
    },
    taskResize: {
      enabled: true,
      showTooltip: true
    },
    taskEdit: {
      enabled: true,
      items: {
        generalTab: {
          items: {
            // Avoid trial-limited features
            percentDone: false,
            effort: false
          }
        },
        predecessorsTab: false,  // Trial limitation
        successorsTab: false     // Trial limitation
      }
    },
    criticalPaths: false,  // Trial limitation
    progressLine: false,   // Trial limitation
    dependencies: false    // Trial limitation
  }
};
```

### 5. Resource-Based View Configuration

```tsx
const ganttConfig = {
  viewPreset: 'weekAndDayLetter',
  barMargin: 10,
  rowHeight: 45,
  
  // Configure columns for resource view
  columns: [
    { type: 'resourceInfo', text: 'Resource', width: 200 },
    { type: 'name', text: 'Task', width: 200 }
  ],
  
  // Enable resource histogram
  partnerConfig: {
    resourceHistogram: {
      type: 'resourcehistogram',
      height: 200
    }
  }
};
```

## Common Issues and Solutions

### Issue 1: React StrictMode Errors
**Problem**: Component mounts twice in development
**Solution**: Handle cleanup properly in useEffect

### Issue 2: Missing Icons
**Problem**: Font icons not rendering
**Solution**: Ensure @charset "UTF-8" is preserved in CSS

### Issue 3: Memory Leaks
**Problem**: Gantt instance not destroyed
**Solution**: Use ref cleanup or wrapper's automatic cleanup

### Issue 4: Data Not Updating
**Problem**: Changes to data not reflected
**Solution**: Use immutable updates or project.commitAsync()

### Issue 5: Trial Limitations
**Problem**: Features not working in trial
**Solution**: Disable percentDone, progressLine, dependencies features

## Performance Optimization

### 1. Large Datasets
```tsx
const ganttConfig = {
  // Enable performance features
  animateRemovingRows: false,
  enableTextSelection: false,
  
  // Use paging for large datasets
  features: {
    paging: {
      enabled: true,
      pageSize: 50
    }
  }
};
```

### 2. Memory Management
```tsx
useEffect(() => {
  return () => {
    // Ensure cleanup on unmount
    if (ganttRef.current?.instance) {
      ganttRef.current.instance.destroy();
    }
  };
}, []);
```

### 3. Rendering Optimization
```tsx
// Use React.memo for expensive components
const GanttWrapper = React.memo(({ data }) => {
  return <BryntumGantt {...config} />;
}, (prevProps, nextProps) => {
  // Custom comparison logic
  return prevProps.data === nextProps.data;
});
```

## Styling and Theming

### 1. Import Theme
```tsx
// In your main component or App.tsx
import '@bryntum/gantt/gantt.stockholm.css';
// Or other themes: material, classic, classic-dark, classic-light
```

### 2. Custom Styling
```css
/* Override Bryntum styles */
.b-gantt {
  --gantt-task-color: #3498db;
  --gantt-task-border-color: #2980b9;
}

.b-gantt-task {
  border-radius: 4px;
}
```

## Testing Recommendations

### 1. Unit Testing
- Mock Bryntum components
- Test event handlers separately
- Use React Testing Library

### 2. Integration Testing
- Test data flow
- Verify event emissions
- Check feature interactions

### 3. E2E Testing
- Use Playwright or Cypress
- Test drag-drop operations
- Verify visual rendering

## Migration Path

### From UMD to NPM
1. Complete NPM setup (see `BRYNTUM_NPM_SETUP.md`)
2. Remove UMD script from index.html
3. Update imports to use @bryntum/gantt-react
4. Update component to use BryntumGantt wrapper
5. Test all features thoroughly

### From Trial to Licensed
1. Update package.json dependencies
2. Enable previously disabled features
3. Remove trial limitation workarounds
4. Run `npm install`

## Resources

- [Official Documentation](https://bryntum.com/products/gantt/docs/)
- [React Integration Guide](https://bryntum.com/products/gantt/docs/guide/Gantt/integration/react/guide)
- [API Reference](https://bryntum.com/products/gantt/docs/api/Gantt/view/Gantt)
- [Examples](https://bryntum.com/products/gantt/examples/?framework=react)
- [Support Forum](https://forum.bryntum.com/)

## Support

For issues:
1. Check troubleshooting section
2. Review console errors
3. Verify version compatibility
4. Contact Bryntum support with license

## License

Currently using trial version with limitations.
Production deployment requires valid Bryntum license.
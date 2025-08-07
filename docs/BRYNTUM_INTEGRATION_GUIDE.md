# Bryntum Gantt Integration Guide

## Overview
This guide explains how to integrate Bryntum Gantt into the PlanetTogether ERP system.

## Licensing Options

### Trial License (Evaluation)
1. **Getting the Trial**
   - Visit https://bryntum.com/products/gantt/
   - Click "Download Trial"
   - You'll receive a zip file with the library and documentation
   - Trial includes full functionality with a small watermark

2. **Installation for Trial**
   ```bash
   # Extract the trial package to a local folder
   # Then install from local path:
   npm install ./path-to-bryntum-gantt-trial/
   ```

3. **Trial Limitations**
   - Small watermark appears on the Gantt chart
   - Full functionality otherwise
   - 45-day evaluation period
   - Can be extended by contacting Bryntum

### Full License (Production)
1. **After Purchase**
   - You receive a license key
   - Access to npm private registry
   - No watermark
   - Priority support

2. **Installation with License**
   ```bash
   # Configure npm to use Bryntum registry
   npm config set "@bryntum:registry" https://npm.bryntum.com

   # Login with your credentials
   npm login --registry https://npm.bryntum.com

   # Install the packages
   npm install @bryntum/gantt @bryntum/gantt-react
   ```

3. **Adding License Key**
   ```javascript
   // In your app initialization (e.g., App.tsx)
   import { Gantt } from '@bryntum/gantt';
   
   // Set the license key (store in environment variable)
   Gantt.licenseKey = process.env.VITE_BRYNTUM_LICENSE_KEY;
   ```

## Integration Steps

### Step 1: Install Bryntum
```bash
# For trial (after downloading)
npm install ./bryntum-gantt-5.x.x-trial/

# For licensed version
npm install @bryntum/gantt @bryntum/gantt-react
```

### Step 2: Import Styles
Add to your main CSS file (`client/src/index.css`):
```css
/* Bryntum Gantt styles */
@import '@bryntum/gantt/gantt.stockholm.css';

/* Custom theme overrides */
.b-gantt {
  --gantt-header-background: var(--background);
  --gantt-header-color: var(--foreground);
}
```

### Step 3: Update Environment Variables
Add to `.env`:
```
# For licensed version only
VITE_BRYNTUM_LICENSE_KEY=your-license-key-here
```

### Step 4: Replace Current Gantt Implementation

Update `client/src/pages/production-schedule.tsx`:
```typescript
import { BryntumGantt, transformToБryntumTasks, transformToBryntumResources, ganttPresets } from '@/components/ui/bryntum-integration';

// In your component:
const bryntumTasks = transformToБryntumTasks(operations, productionOrders);
const bryntumResources = transformToBryntumResources(resources);

// Replace current GanttChart with:
<BryntumGantt
  tasks={bryntumTasks}
  resources={bryntumResources}
  {...ganttPresets.production}
  rowHeight={ganttRowHeight}
  onTaskDrop={handleTaskDrop}
  onTaskResize={handleTaskResize}
/>
```

### Step 5: Implement Event Handlers
```typescript
const handleTaskDrop = async (event: any) => {
  const { taskRecord, newResource, newStartDate } = event;
  
  // Update operation in database
  await updateOperation({
    id: taskRecord.id,
    workCenterId: newResource.id,
    startTime: newStartDate
  });
  
  // Refresh data
  refetchOperations();
};

const handleTaskResize = async (event: any) => {
  const { taskRecord, startDate, endDate } = event;
  
  // Update operation timing
  await updateOperation({
    id: taskRecord.id,
    startTime: startDate,
    endTime: endDate
  });
  
  refetchOperations();
};
```

## Features Available

### Core Features
- ✅ Drag & Drop operations between resources
- ✅ Resize operations to change duration
- ✅ Dependencies with drag-to-create
- ✅ Critical path highlighting
- ✅ Resource utilization view
- ✅ Zoom controls (hour to year)
- ✅ Export to PDF/PNG/Excel
- ✅ Undo/Redo support
- ✅ Keyboard navigation

### Advanced Features
- ✅ Resource histograms
- ✅ Baseline comparison
- ✅ Progress tracking
- ✅ Non-working time highlighting
- ✅ Constraints (must start on, finish no later than)
- ✅ Task splitting
- ✅ Resource leveling
- ✅ What-if scenarios

## Customization

### Custom Task Renderer
```javascript
features: {
  taskRenderer({ taskRecord, renderData }) {
    renderData.cls = `custom-task status-${taskRecord.status}`;
    renderData.iconCls = taskRecord.priority > 5 ? 'high-priority' : '';
    
    return {
      html: `
        <div class="task-content">
          <div class="task-name">${taskRecord.name}</div>
          <div class="task-progress">${taskRecord.percentDone}%</div>
        </div>
      `
    };
  }
}
```

### Custom Columns
```javascript
columns: [
  {
    field: 'name',
    text: 'Operation',
    width: 200,
    renderer({ record }) {
      return `
        <div class="operation-cell">
          <span class="op-name">${record.name}</span>
          <span class="op-status badge-${record.status}">${record.status}</span>
        </div>
      `;
    }
  }
]
```

## Migration Checklist

- [ ] Download/install Bryntum trial or licensed version
- [ ] Add Bryntum styles to index.css
- [ ] Set up license key (if licensed)
- [ ] Update bryntum-integration.tsx with actual imports
- [ ] Replace GanttChart component with BryntumGantt
- [ ] Test drag & drop functionality
- [ ] Test export functionality
- [ ] Customize styling to match brand
- [ ] Add event handlers for database updates
- [ ] Test with production data

## Support Resources

- **Documentation**: https://bryntum.com/docs/gantt/
- **Examples**: https://bryntum.com/examples/gantt/
- **Forum**: https://forum.bryntum.com/
- **Support** (licensed): support@bryntum.com

## Notes

1. **Performance**: Bryntum can handle 10,000+ tasks smoothly
2. **Browser Support**: Works in all modern browsers (Chrome, Firefox, Safari, Edge)
3. **Mobile**: Touch-enabled for tablets, responsive design
4. **Accessibility**: WCAG 2.1 AA compliant
5. **Localization**: Supports 30+ languages out of the box
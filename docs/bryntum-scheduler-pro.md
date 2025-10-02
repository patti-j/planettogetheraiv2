# Bryntum Scheduler Pro Documentation

## Overview

This application uses Bryntum Scheduler Pro 6.3.2 for production scheduling functionality. The scheduler is implemented as a standalone HTML page embedded via iframe to maintain the comprehensive Bryntum feature set while integrating with the React application.

## Official Documentation Links

- **Main Documentation**: https://bryntum.com/products/schedulerpro/docs/
- **Quick Start Guide**: https://bryntum.com/products/schedulerpro/docs/guide/SchedulerPro/quick-start/javascript-npm
- **API Reference**: https://bryntum.com/products/schedulerpro/docs/api/SchedulerPro/view/SchedulerPro
- **Examples**: https://bryntum.com/products/schedulerpro/examples/
- **Feature Guide**: https://bryntum.com/products/schedulerpro/docs/guide/SchedulerPro/basics/features

## Implementation Architecture

### File Locations

- **React Wrapper**: `client/src/pages/production-scheduler.tsx`
- **Scheduler HTML**: `public/production-scheduler.html`
- **Backend Routes**: `server/routes.ts` (Bryntum asset serving)
- **Bryntum Assets**: `attached_assets/build/`
  - `schedulerpro.umd.js` - UMD JavaScript bundle
  - `thin/schedulerpro.classic-light.thin.css` - Light theme CSS
  - `thin/fonts/` - Font files

### Architecture Pattern

The Production Scheduler uses a **hybrid iframe/React architecture**:

1. **React Wrapper Component**: Provides navigation, AI panels, and theme integration
2. **Standalone HTML**: Contains the Bryntum scheduler implementation
3. **Backend API Routes**: Serves Bryntum assets and scheduler HTML

**Critical Routes**:
- Frontend: `/production-scheduler` → React app with navigation wrapper
- Backend: `/api/production-scheduler` → Raw HTML for iframe
- Assets: `/schedulerpro.umd.js`, `/schedulerpro.classic-light.css`, `/schedulerpro.classic-dark.css`

## Theme Implementation

### How Theme Switching Works

1. **Main App Theme Detection**: Uses `ThemeAdapterProvider` to manage theme state
2. **Theme Parameter Passing**: React component passes theme via URL: `?theme=light` or `?theme=dark`
3. **Dynamic CSS Loading**: JavaScript in HTML head reads theme parameter and loads appropriate CSS
4. **Custom Dark Mode Overrides**: Comprehensive CSS overrides for Bryntum components in dark mode

### Theme Files

```html
<!-- Light theme -->
<link rel="stylesheet" href="/schedulerpro.classic-light.css">

<!-- Dark theme -->
<link rel="stylesheet" href="/schedulerpro.classic-dark.css">
```

### Available Themes

According to Bryntum documentation, the following CSS files are available:
- `schedulerpro.classic-dark.css` - Classic-Dark theme
- `schedulerpro.classic.css` - Classic theme
- `schedulerpro.classic-light.css` - Classic-Light theme
- `schedulerpro.material.css` - Material theme
- `schedulerpro.stockholm.css` - Stockholm theme

**Current Implementation**: Uses Classic-Light theme with custom CSS overrides for dark mode.

## Configured Features

The scheduler is configured with 16+ comprehensive Bryntum features:

### Core Features

1. **CrudManager**: Automatic data synchronization with backend APIs
2. **Critical Path**: Highlights critical path operations for bottleneck visualization
3. **Resource Histogram**: Visual resource utilization graphs
4. **Project Model**: Advanced scheduling engine with ASAP/ALAP algorithms

### Editor Features

5. **Task Editor**: Double-click to edit operations with modal dialog
6. **Dependency Editor**: Manage operation relationships and dependencies
7. **Resource Editor**: Configure resource properties and capabilities

### Time Management

8. **Non-Working Time**: Weekend and holiday handling
9. **Time Ranges**: Visual time period indicators
10. **Schedule Tooltip**: Hover information display

### Interaction Features

11. **Event Drag Create**: Drag to create new operations
12. **Event Drag Select**: Select multiple operations
13. **Event Resize**: Resize operations by dragging edges
14. **Event Menu**: Right-click context menus
15. **Context Menu**: Grid and timeline context menus

### Grid Features

16. **Column Reordering**: Drag columns to reorder
17. **Column Resize**: Resize columns by dragging

### Additional Capabilities

- **Drag-and-drop rescheduling**: Move operations between resources
- **Optimization algorithms**: ASAP, ALAP, Critical Path, Resource Leveling
- **Real-time synchronization**: Backend data sync via CrudManager
- **Resource capabilities matching**: Operations assigned to appropriate equipment

## Data Integration

### API Endpoints

The scheduler integrates with PT (PlanetTogether) database tables:

- **Resources**: `GET /api/resources` - Returns 12 manufacturing resources
- **Operations**: `GET /api/pt-operations` - Returns 34 scheduled operations
- **Dependencies**: `GET /api/pt-dependencies` - Returns 29 operation dependencies
- **Resource Capabilities**: `GET /api/resources-with-capabilities` - Resource-operation matching

### Data Model

```typescript
// Resources
{
  id: number,
  name: string,
  resource_type: string,
  capacity: number,
  available_hours: number,
  // ... other fields
}

// Operations
{
  id: number,
  operation_name: string,
  scheduled_start: Date,
  scheduled_end: Date,
  job_name: string,
  priority: number,
  resourceId: number, // Assigned resource
  // ... other fields
}

// Dependencies
{
  id: string,
  from: number, // From operation ID
  to: number,   // To operation ID
  type: number, // Dependency type
  lag: number   // Lag time
}
```

## UMD Build Usage

The scheduler uses Bryntum's UMD build, accessed via global `bryntum` namespace:

```javascript
// Accessing SchedulerPro from UMD build
const SchedulerPro = bryntum.schedulerpro?.SchedulerPro || bryntum.SchedulerPro;

// Creating scheduler instance
const scheduler = new SchedulerPro({
  appendTo: 'scheduler',
  startDate: new Date(2025, 0, 1),
  endDate: new Date(2025, 2, 1),
  // ... configuration
});
```

## Scheduling Algorithms

### ASAP (As Soon As Possible)
Forward scheduling algorithm that schedules operations as early as possible.

### ALAP (As Late As Possible)
Backward scheduling algorithm that schedules operations as late as possible without affecting completion date.

### Critical Path
Highlights the sequence of operations that determines the minimum project duration.

### Resource Leveling
Balances resource utilization to prevent overallocation.

## Capability-Based Resource Matching

The system uses `ptresourcecapabilities` table for intelligent resource assignment:

```typescript
// Capability IDs
1 = MILLING
2 = MASHING
3 = LAUTERING
4 = BOILING
5 = FERMENTATION
6 = CONDITIONING
7 = DRY_HOPPING
8 = PACKAGING
9 = PASTEURIZATION
```

Operations are matched to resources based on required capabilities rather than hardcoded logic.

## Common Customizations

### Adding New Features

To enable additional Bryntum features, update the scheduler configuration in `public/production-scheduler.html`:

```javascript
const scheduler = new SchedulerPro({
  features: {
    newFeature: {
      // Feature configuration
    }
  }
});
```

### Customizing Appearance

1. **Light Theme Customization**: Modify CSS in `<style>` section of HTML
2. **Dark Theme Customization**: Update `.dark` CSS overrides
3. **Bryntum Component Styling**: Override `.b-*` classes with `!important`

### Modifying Data Sources

Update API endpoints in the `loadSchedulerData()` function:

```javascript
const [resources, operations, dependencies] = await Promise.all([
  fetch('/api/resources').then(res => res.json()),
  fetch('/api/pt-operations').then(res => res.json()),
  fetch('/api/pt-dependencies').then(res => res.json())
]);
```

## Troubleshooting

### Common Issues

1. **Scheduler Not Rendering**
   - Check browser console for JavaScript errors
   - Verify Bryntum UMD file is loading: `/schedulerpro.umd.js`
   - Verify CSS file is loading: `/schedulerpro.classic-light.css`

2. **Theme Not Applying**
   - Check theme parameter in iframe URL: `?theme=light` or `?theme=dark`
   - Verify `document.documentElement` has `light` or `dark` class
   - Check CSS overrides are properly scoped with `.dark` prefix

3. **Data Not Loading**
   - Check API endpoints return valid JSON
   - Verify data format matches expected structure
   - Check browser network tab for failed requests

4. **Features Not Working**
   - Verify feature is enabled in configuration
   - Check for JavaScript console errors
   - Ensure Bryntum license is valid (trial or licensed)

### Debugging Tips

1. **Enable Console Logging**: Add debug statements in scheduler initialization
2. **Check API Responses**: Use browser DevTools Network tab
3. **Verify Bryntum Version**: Check loaded UMD file matches expected version
4. **Test Bryntum Examples**: Compare with official Bryntum examples

## Version Information

- **Bryntum Scheduler Pro**: 6.3.2
- **Build Type**: UMD (Universal Module Definition)
- **Theme**: Classic-Light with custom dark mode overrides
- **Integration Method**: Standalone HTML in iframe

## Support Resources

- **Bryntum Support**: https://bryntum.com/support
- **Community Forum**: https://forum.bryntum.com/
- **GitHub Examples**: https://github.com/bryntum/
- **Trial Downloads**: https://bryntum.com/download/

## License

This application uses Bryntum Scheduler Pro. License details can be found at:
https://bryntum.com/license

---

*Last Updated: October 2, 2025*
*Bryntum Version: 6.3.2*

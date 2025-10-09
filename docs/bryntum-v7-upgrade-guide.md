# Bryntum Scheduler Pro v7.0.0 Upgrade Guide
## PlanetTogether Manufacturing System

### Document Version: 1.0
### Date: October 9, 2025
### Status: v6.3.3 in Production, v7.0.0-alpha.1 Testing Failed

---

## Executive Summary

This document captures our experience upgrading to Bryntum Scheduler Pro v7.0.0-alpha.1 and the critical issues encountered. We are maintaining v6.3.3 in production until v7.0.0 reaches stable release with resolved rendering issues.

---

## v7.0.0-alpha.1 Testing Results

### ❌ Critical Issues Found

#### 1. **Vertical Time Axis Rendering**
- **Issue**: Time axis renders vertically (hours listed down left side) instead of horizontally
- **Expected**: Dates/times should display across the top as column headers
- **Impact**: Makes scheduler unusable as a Gantt chart
- **Files Tested**: 
  - `/public/production-scheduler.html`
  - `/public/production-scheduler-debug.html`
  - `/public/production-scheduler-inspect.html`

#### 2. **Missing Visual Grid**
- **Issue**: No actual scheduling grid renders, only text labels
- **Expected**: Full grid with resource rows and time columns
- **Impact**: Cannot visualize or interact with scheduled operations

#### 3. **Events Not Displaying**
- **Issue**: Operations/events don't render as bars in the grid
- **Expected**: Visual task bars showing operation duration and timing
- **Impact**: Cannot see production schedule

### ✅ What Works in v7.0.0-alpha.1

- Library loads without JavaScript errors
- Event listeners fire correctly (paint, renderrow, etc.)
- Data loads successfully from API
- Stockholm theme CSS files load
- DOM elements are created (but positioned incorrectly)

---

## v6.3.3 Current Implementation

### Configuration That Works

```javascript
// Working v6.3.3 configuration with Stockholm theme
const scheduler = new bryntum.schedulerpro.SchedulerPro({
    appendTo: 'schedulerContainer',
    
    // Time range
    startDate: new Date('2024-09-02'),
    endDate: new Date('2024-09-16'),
    
    // View configuration
    viewPreset: 'weekAndDay',
    rowHeight: 60,
    barMargin: 8,
    
    // Columns
    columns: [
        { 
            type: 'resourceInfo',
            text: 'Resources', 
            field: 'name', 
            width: 220
        }
    ],
    
    // Features
    features: {
        eventDrag: true,
        eventResize: true,
        eventTooltip: true,
        percentBar: true,
        dependencies: true,
        timeRanges: {
            showCurrentTimeLine: true
        }
    },
    
    // Data
    resources: resourcesData,
    events: eventsData,
    assignments: assignmentsData
});
```

### Required Files for v6.3.3
1. `/public/schedulerpro.umd.js` (v6.3.3)
2. `/public/schedulerpro.css` (base styles)
3. `/public/schedulerpro.stockholm.css` (theme)
4. FontAwesome icons (included in v6.3.3)

---

## Migration Checklist for Future v7.0.0 Stable

When v7.0.0 stable is released, use this checklist:

### Pre-Migration
- [ ] Verify v7.0.0 is stable release (not alpha/beta)
- [ ] Review changelog for breaking changes
- [ ] Test in development environment first
- [ ] Backup current v6.3.3 implementation

### Code Changes Required

#### 1. **API Property Name Changes (v7.0.0)**
```javascript
// v6.3.3 (deprecated in v7)
eventsData: events
resourcesData: resources  
assignmentsData: assignments
calendarsData: calendars

// v7.0.0 (new names)
events: events
resources: resources
assignments: assignments
calendars: calendars
```

#### 2. **CSS Class Name Changes**
```css
/* v6.3.3 (camelCase) */
.b-schedulerpro
.b-timeAxisColumn

/* v7.0.0 (kebab-case) */
.b-scheduler-pro
.b-time-axis-column
```

#### 3. **FontAwesome Requirement**
```html
<!-- v6.3.3: FontAwesome included -->
<!-- v7.0.0: Must load separately -->
<link rel="stylesheet" href="/fontawesome/css/all.min.css">
```

#### 4. **Resource Images**
```javascript
// v6.3.3: Default .jpg extension
resourceImagePath: 'users/'

// v7.0.0: Default .png extension  
resourceImageExtension: '.jpg' // Must specify if using jpg
```

### Testing Requirements

#### Functionality Tests
- [ ] Scheduler renders with horizontal timeline
- [ ] Resources display in left column
- [ ] Operations display as bars in grid
- [ ] Drag & drop works
- [ ] Resize operations works
- [ ] Tooltips display correctly
- [ ] Current time line shows
- [ ] Zoom in/out functions work

#### Data Integration Tests
- [ ] PT resources load from database
- [ ] PT operations load from database
- [ ] Changes save back to database
- [ ] Real-time updates work

#### Visual Tests
- [ ] Stockholm theme displays correctly
- [ ] Mobile responsive layout works
- [ ] Print view renders properly
- [ ] Export to PDF/Excel works

### Rollback Plan
If issues occur after v7.0.0 upgrade:
1. Restore v6.3.3 files from backup
2. Clear browser cache
3. Restart workflows
4. Verify scheduler loads correctly

---

## Database Integration Details

### Working API Endpoints
- `/api/ptresources` - Returns PT resources
- `/api/ptoperations` - Returns PT job operations  

### Data Mapping
```javascript
// PT Resource → Bryntum Resource
{
    id: ptResource.resource_id || ptResource.id,
    name: ptResource.name,
    calendar: 'general'
}

// PT Operation → Bryntum Event
{
    id: ptOperation.id,
    name: ptOperation.name,
    startDate: ptOperation.scheduled_start,
    endDate: ptOperation.scheduled_end,
    duration: ptOperation.cycle_hrs,
    resourceId: assignedResourceId
}
```

---

## Support Resources

### Bryntum Documentation
- v6.3.3 Docs: https://bryntum.com/products/schedulerpro/docs/
- v7.0.0 Docs: https://bryntum.com/products/schedulerpro-next/docs/
- Changelog: https://bryntum.com/products/schedulerpro/changelog/
- Forum: https://forum.bryntum.com/

### Issue Tracking
- GitHub Issues: https://github.com/bryntum/support/issues
- Our Issue Report: `/docs/bryntum-v7-alpha-issue-report.md`

---

## Recommendations

1. **Stay on v6.3.3** until v7.0.0 stable release
2. **Monitor Bryntum changelog** for v7.0.0 stable announcement
3. **Test thoroughly** in development before upgrading production
4. **Consider filing bug report** with Bryntum about v7.0.0-alpha.1 rendering issues

---

## Appendix: Test Files Created

During v7.0.0-alpha.1 testing, these files were created and can be deleted after stable migration:

- `/public/production-scheduler-debug.html`
- `/public/production-scheduler-fixed.html`
- `/public/production-scheduler-inspect.html`
- `/docs/bryntum-scheduler-implementation-fixes.md`
- `/docs/bryntum-v7-alpha-issue-report.md`

---

*Last Updated: October 9, 2025*
*Next Review: When v7.0.0 stable is released*
# Bryntum Scheduler Pro v7.0.0-alpha.1 Issue Report

## Date: October 9, 2025
## Reported By: PlanetTogether Development Team

## Executive Summary
After extensive testing and debugging, we have identified a critical rendering issue in Bryntum Scheduler Pro v7.0.0-alpha.1 that prevents it from functioning as a proper Gantt chart scheduler.

## Issue Description

### Expected Behavior
- Horizontal timeline with dates/times across the top
- Resources listed vertically on the left
- Task bars displayed in the grid showing operation schedules
- Stockholm theme providing clean, professional appearance

### Actual Behavior
- Time axis renders vertically (hours listed down the left side)
- Resources not properly displayed
- Events/operations not visible in the grid
- No actual Gantt chart grid rendered
- Stockholm theme CSS loads but doesn't apply correctly

## Technical Details

### Environment
- **Version**: Bryntum Scheduler Pro v7.0.0-alpha.1
- **Theme**: Stockholm Light
- **Browser**: All modern browsers tested
- **Framework**: Vanilla JavaScript (UMD build)

### Files Tested
- `schedulerpro.umd.js` (7.0.0-alpha.1)
- `schedulerpro.css` (427KB base styles)
- `stockholm-light.css` (26KB theme overlay)

### Configurations Attempted
1. Basic SchedulerPro with inline data
2. SchedulerPro with ProjectModel
3. Resource view with explicit viewPreset configurations
4. Different column configurations
5. Multiple data loading approaches (API and inline)

### API Integration Status
✅ Successfully loading data from PT database:
- 12 resources from `ptresources` table
- 41 operations from `ptoperations` table

## Root Cause Analysis

The v7.0.0-alpha.1 appears to have a fundamental issue with:
1. **View Mode Initialization**: The scheduler initializes in an incorrect view mode
2. **CSS Rendering**: Despite loading all CSS files correctly, the grid layout is broken
3. **Component Architecture**: Internal components (grid, timeline, events) don't render properly

## Evidence
- Library loads successfully (confirmed via console)
- Events fire correctly (paint, renderrow, renderevent)
- DOM elements are created but display incorrectly
- Time axis appears vertically instead of horizontally

## Recommendations

### Option 1: Downgrade to Stable v6.3.3 (RECOMMENDED)
**Pros:**
- Immediate working solution
- Stockholm theme available
- Proven stability in production
- All features functional

**Cons:**
- Missing v7.0.0 features (if any are critical)
- Will need to upgrade later when v7 is stable

### Option 2: Wait for v7.0.0 Stable Release
**Pros:**
- Latest features when released
- No rework needed

**Cons:**
- Unknown timeline (could be weeks/months)
- Project blocked until then

### Option 3: Contact Bryntum Support
**Pros:**
- May get early patch or workaround
- Direct vendor support

**Cons:**
- Response time uncertain
- May still need to downgrade

## Conclusion
The v7.0.0-alpha.1 has a critical rendering bug that makes it unusable for production scheduling. The alpha version is not ready for deployment.

## Next Steps
1. **Immediate Action**: Downgrade to Bryntum Scheduler Pro v6.3.3
2. **Preserve Work**: Keep v7 configuration for future upgrade
3. **Monitor**: Watch for v7.0.0 stable release announcement
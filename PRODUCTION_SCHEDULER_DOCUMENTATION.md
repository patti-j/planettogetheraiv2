# Production Scheduler Documentation

## Overview
The Production Scheduler is a visual planning tool built on Bryntum Scheduler Pro that provides real-time production scheduling with drag-and-drop functionality, AI-powered optimization, and automatic persistence of all changes.

## Core Architecture

### Technology Stack
- **Frontend**: Bryntum Scheduler Pro (standalone HTML implementation)
- **Backend**: Express.js with PostgreSQL database
- **Database**: `ptjoboperations` table with Drizzle ORM
- **Delivery**: Hybrid iframe/React architecture

### Data Flow
1. Scheduler loads operations from `GET /api/pt-operations`
2. User interactions trigger feature-level events
3. Changes auto-save to `PATCH /api/pt-operations/schedule`
4. Database stores positions with `manually_scheduled` flag
5. Subsequent loads preserve manual positions

## Auto-Save System

### Manual Changes (Feature-Level Events)
The scheduler automatically saves ALL manual user interactions:

#### 1. **Drag & Drop Operations**
```javascript
afterEventDrop: async ({ eventRecords }) => {
    // Mark as manually scheduled to preserve from algorithms
    eventRecords.forEach(event => {
        event.manuallyScheduled = true;
    });
    
    // Auto-save to database
    await saveOperationChanges(eventRecords);
}
```

**Behavior:**
- ✅ Saves immediately after drag completes
- ✅ Marks operation as `manuallyScheduled: true`
- ✅ Preserves position across page refreshes
- ✅ Exempts from future algorithm optimizations

#### 2. **Resize Operations**
```javascript
afterEventResize: async ({ eventRecords }) => {
    eventRecords.forEach(event => {
        event.manuallyScheduled = true;
    });
    
    await saveOperationChanges(eventRecords);
}
```

**Behavior:**
- ✅ Saves new start/end times after resize
- ✅ Marks as manually scheduled
- ✅ Respects new duration in future schedules

#### 3. **Direct Edits (Cell Editing)**
```javascript
afterEventSave: async ({ record }) => {
    record.manuallyScheduled = true;
    await saveOperationChanges([record]);
}
```

**Behavior:**
- ✅ Saves edits to event fields
- ✅ Supports inline cell editing
- ✅ Marks as manually positioned

### Algorithm Results (Programmatic Changes)
When algorithms run (ASAP, ALAP, Critical Path), results are auto-saved:

```javascript
// After algorithm applies changes
const modifiedEvents = scheduler.eventStore.records.filter(e => e.isModified);
await saveOperationChanges(modifiedEvents);
```

**Behavior:**
- ✅ Saves all algorithm results to database
- ✅ Does NOT mark as `manuallyScheduled`
- ✅ Allows future algorithms to re-optimize

## Manual Position Preservation

### The `manuallyScheduled` Flag
When a user manually positions an operation, it's **protected from future algorithmic changes**.

#### Database Schema
```sql
ALTER TABLE ptjoboperations 
ADD COLUMN manually_scheduled BOOLEAN DEFAULT FALSE;
```

#### How It Works
1. **User drags operation** → `manuallyScheduled = true` → Saved to DB
2. **Algorithm runs** → Checks flag → Skips manually positioned events
3. **Page refresh** → Flag loads from DB → Position preserved

#### Algorithm Implementation Pattern
```javascript
events.forEach(event => {
    if (event.manuallyScheduled) {
        console.log(`🔒 Preserving manual position for: ${event.name}`);
        return;  // Skip - don't apply algorithm constraints
    }
    
    // Apply algorithm constraints to non-manual events
    event.setConstraint({
        type: 'startnoearlierthan',
        date: calculatedDate
    });
});
```

**Applied to:**
- ✅ ASAP (As Soon As Possible)
- ✅ ALAP (As Late As Possible)
- ✅ Critical Path Analysis
- ✅ All custom scheduling algorithms

### Clearing Manual Positions
To allow an operation to be re-optimized:

1. **Reset single operation**:
   ```javascript
   event.manuallyScheduled = false;
   await saveOperationChanges([event]);
   ```

2. **Clear all manual positions** (future enhancement):
   ```javascript
   scheduler.eventStore.forEach(event => {
       event.manuallyScheduled = false;
   });
   await saveAllChanges();
   ```

## Event Types

### Feature-Level Events (Manual Only)
These fire **ONLY** for manual user actions:
- `afterEventDrop` - After drag & drop
- `afterEventResize` - After resize handles
- `afterEventSave` - After cell editing

### Store-Level Events (All Changes)
These fire for ALL changes (manual + programmatic):
- `update` - Any event modification
- `change` - Any store change

**Important:** We use feature-level events for auto-save to avoid saving intermediate algorithm calculations.

## Refresh Behavior

### AI Action Refresh Pattern
After AI reschedule actions, the scheduler automatically refreshes:

```javascript
// Max AI Service triggers refresh
case 'refresh_scheduler':
    if (isOnSchedulerPage) {
        // Refresh iframe with retry logic
        await refreshSchedulerIframe();
    } else {
        // Navigate to scheduler, then refresh
        await navigateToScheduler();
        await refreshSchedulerIframe();
    }
```

**Behavior:**
- ✅ Detects current page location
- ✅ Navigates if needed
- ✅ Refreshes iframe with retry logic
- ✅ Shows new AI-optimized schedule

## Save Endpoint

### Request Format
```typescript
PATCH /api/pt-operations/schedule
Content-Type: application/json

{
    "operations": [
        {
            "id": 123,
            "start": "2024-01-15T08:00:00.000Z",
            "end": "2024-01-15T12:00:00.000Z",
            "manuallyScheduled": true  // Flag for preservation
        }
    ]
}
```

### Response Format
```json
{
    "success": true,
    "updated": 1,
    "total": 1
}
```

### Database Update
```sql
UPDATE ptjoboperations 
SET 
    scheduled_start = $1,
    scheduled_end = $2,
    manually_scheduled = $3,
    updated_at = NOW()
WHERE id = $4
```

## Load Behavior

### Initial Load
```javascript
// Load operations with manually_scheduled flag
const operations = await fetch('/api/pt-operations').then(r => r.json());

// Apply to scheduler
scheduler.eventStore.data = operations.map(op => ({
    id: op.id,
    name: op.name,
    startDate: op.scheduled_start,
    endDate: op.scheduled_end,
    manuallyScheduled: op.manually_scheduled || false  // Restore flag
}));
```

### Zoom-to-Fit
The scheduler auto-zooms to fit all operations **on initial load only**:
```javascript
scheduler.on('paint', () => {
    scheduler.zoomToFit({ leftMargin: 50, rightMargin: 50 });
}, { once: true });  // Only first time
```

## Best Practices

### For Developers

1. **Always use feature-level events for auto-save**
   - Ensures only manual changes trigger saves
   - Avoids saving intermediate algorithm states

2. **Check `manuallyScheduled` flag in algorithms**
   - Preserves user intent
   - Prevents overwriting manual positions

3. **Save algorithm results explicitly**
   - Algorithms make programmatic changes
   - Must manually trigger save after completion

4. **Use retry logic for refresh**
   - Iframe may not be ready immediately
   - Implement exponential backoff

### For Users

1. **Manual positions are preserved**
   - Drag an operation → It stays where you put it
   - Algorithms work around your manual edits

2. **To clear manual positioning**
   - Currently requires re-running full schedule
   - Future: "Clear Manual Positions" button

3. **All changes are saved automatically**
   - No save button needed
   - Changes persist across sessions

## Troubleshooting

### Changes Not Saving
1. Check browser console for save errors
2. Verify network request to `/api/pt-operations/schedule`
3. Check database for `manually_scheduled` column
4. Ensure `saveOperationChanges()` is called

### Manual Positions Not Preserved
1. Verify `manuallyScheduled` flag in database
2. Check algorithm skips flagged events
3. Ensure flag loads on scheduler init
4. Check for algorithm override logic

### Refresh Not Working
1. Verify iframe ID matches selector
2. Check retry logic in refresh function
3. Ensure scheduler page route is correct
4. Check Max AI service triggers refresh action

## Algorithm Implementation Status

### ⚠️ Critical Issues Identified (October 14, 2025)

A comprehensive review against Bryntum Scheduler Pro documentation revealed several critical issues with the current algorithm implementations:

#### **ASAP Algorithm**
- ❌ Uses invalid constraint type `'assoonaspossible'` (not supported by Bryntum)
- ❌ Does not preserve manually positioned events
- ✅ Auto-saves results to database

#### **ALAP Algorithm**
- ❌ Uses invalid constraint type `'aslateaspossible'` (not supported by Bryntum)
- ❌ Does not preserve manually positioned events
- ⚠️ ALAP is not natively supported in Scheduler Pro (Gantt only)
- ✅ Auto-saves results to database

#### **Critical Path Algorithm**
- ❌ Checks for `event.critical` property that doesn't exist in Scheduler Pro
- ❌ Does not preserve manually positioned events
- ⚠️ Critical Path is exclusive to Bryntum Gantt, not Scheduler Pro
- ❌ No auto-save implemented

### Valid Bryntum Constraint Types
- `startnoearlierthan` (SNET) - Semi-flexible
- `finishnoearlierthan` (FNET) - Semi-flexible
- `startnolaterthan` (SNLT) - Semi-flexible
- `finishnolaterthan` (FNLT) - Semi-flexible
- `muststarton` (MSO) - Inflexible
- `mustfinishon` (MFO) - Inflexible

### Required Corrections
See detailed corrections in:
- **[Algorithm Analysis & Corrections](./SCHEDULER_ALGORITHM_ANALYSIS.md)** - Complete analysis with fixed implementations
- **[Algorithm Test Plan](./SCHEDULER_ALGORITHM_TESTS.md)** - Comprehensive test cases for validation

## Future Enhancements

### High Priority (Algorithm Fixes)
- [ ] Fix ASAP to use valid constraint types
- [ ] Fix ALAP or implement workaround for Scheduler Pro
- [ ] Implement custom Critical Path with slack calculation
- [ ] Add manual position preservation to all algorithms
- [ ] Implement auto-save for Critical Path results

### Planned Features
- [ ] Bulk "Clear Manual Positions" action
- [ ] Visual indicator for manually positioned events
- [ ] Undo/redo for manual changes
- [ ] Manual position lock/unlock toggle
- [ ] Conflict detection for manual positions
- [ ] Manual position validation warnings

### Under Consideration
- [ ] Upgrade to Bryntum Gantt for full ALAP/Critical Path support
- [ ] Save queue for offline capability
- [ ] Real-time multi-user sync
- [ ] Position history/audit trail
- [ ] Smart suggestions for manual positioning
- [ ] Drag constraints based on dependencies

## Related Documentation
- [Bryntum Scheduler Pro Documentation](https://bryntum.com/products/schedulerpro/docs/)
- [PT Tables Schema Documentation](./PT-Tables-Complete-Documentation.md)
- [Max AI Service Documentation](./replit.md#ai-integration)
- [Production Scheduler Architecture](./replit.md#production-scheduler-architecture)
- **[Scheduler Algorithm Analysis](./SCHEDULER_ALGORITHM_ANALYSIS.md)** - Critical issues and corrections
- **[Scheduler Algorithm Tests](./SCHEDULER_ALGORITHM_TESTS.md)** - Comprehensive test plan

---

**Last Updated**: October 14, 2025  
**Status**: Algorithm Issues Identified - Corrections Documented  
**Maintainer**: PlanetTogether Development Team

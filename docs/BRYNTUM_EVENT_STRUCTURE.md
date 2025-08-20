# Bryntum Scheduler Pro Event Structure Documentation

## Drag and Drop Events

Based on the official Bryntum documentation and API, the correct event structure for drag and drop operations is:

### eventDrop Event  

The `eventDrop` event (camelCase) is fired after an event has been dropped. The event parameters include:

```javascript
{
  source: Scheduler,     // The scheduler instance
  context: {
    eventRecords: [],    // Array of dropped event records (or eventRecord for single)
    startDate: Date,     // New start date
    endDate: Date,       // New end date
    resourceRecord: Resource, // Target resource
    valid: boolean,      // Whether the drop is valid
    // Additional context properties
  }
}
```

### beforeEventDropFinalize Event

The `beforeEventDropFinalize` event is used for validation before finalizing the drop:

```javascript
{
  context: {
    eventRecords: [],    // Events being dropped
    startDate: Date,     // Proposed start date
    endDate: Date,       // Proposed end date
    resourceRecord: Resource, // Target resource
    async: boolean,      // Set to true for async validation
    finalize: Function   // Call with true/false to accept/reject
  }
}
```

### Key Implementation Notes

1. **Event Names Are CamelCase**: Use `eventDrop` not `aftereventdrop`
2. **Use beforeEventDropFinalize for Validation**: This is the proper place to prevent invalid drops
3. **Context Contains Event Data**: Access dropped events via `context.eventRecords` or `context.eventRecord`
4. **Async Validation Support**: Set `context.async = true` and call `context.finalize()` when ready

### Example Implementation

```javascript
beforeEventDropFinalize: ({ context }) => {
  // Synchronous validation
  if (!isValidDrop(context)) {
    return false; // Prevent the drop
  }
  return true; // Allow the drop
},

eventDrop: ({ source, context }) => {
  const eventRecord = context.eventRecords?.[0] || context.eventRecord;
  const targetResource = context.resourceRecord;
  
  if (eventRecord && targetResource) {
    // Handle successful drop
    updateOperation({
      operationId: eventRecord.id,
      resourceId: targetResource.id,
      startDate: context.startDate || eventRecord.startDate
    });
  }
}
```

## Other Important Events

- `beforeEventDrop`: Initial validation, rarely used
- `eventResizeEnd`: Fired after an event has been resized
- `dragCreateEnd`: Fired after a new event has been created via drag
- `eventDragAbort`: Fired when drag is cancelled

## Current Implementation Status

✅ Event handlers updated to use camelCase names (eventDrop, beforeEventDropFinalize)
✅ Handling both eventRecords array and single eventRecord from context
✅ Properly extracting resourceRecord from context for new resource assignment
✅ Using beforeEventDropFinalize for validation
✅ Database update mutations connected in eventDrop handler

The drag-and-drop functionality is now fully operational with proper event handling that matches Bryntum's official API structure.
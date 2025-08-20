# Bryntum Scheduler Pro Event Structure Documentation

## Drag and Drop Events

Based on the official Bryntum demo, the correct event structure for drag and drop operations is:

### aftereventdrop Event

The `aftereventdrop` event (all lowercase) is fired after an event has been dropped. The event object contains:

```javascript
{
  eventRecord: {          // Single event record (NOT an array)
    id: string,          // Event ID
    name: string,        // Event name
    startDate: Date,     // New start date after drop
    endDate: Date,       // New end date after drop
    resourceId: string,  // Current resource ID
    data: object        // Custom data
  },
  targetResourceRecord: { // The resource the event was dropped on
    id: string,
    name: string,
    // ... other resource properties
  },
  valid: boolean,        // Whether the drop is valid
  context: object,       // Additional context information
  source: object        // Source scheduler instance
}
```

### Key Implementation Notes

1. **Event Names Must Be Lowercase**: Use `aftereventdrop` not `afterEventDrop`
2. **Single Event Record**: The event contains `eventRecord` (singular), not `eventRecords` (array)
3. **Resource Assignment**: After a drop, the new resource is in `targetResourceRecord.id`
4. **Validation**: Always check the `valid` flag before processing the drop

### Example Implementation

```javascript
aftereventdrop: function(event) {
  const { eventRecord, targetResourceRecord, valid } = event;
  
  if (!valid) {
    console.log('Drop was invalid');
    return;
  }
  
  if (eventRecord && targetResourceRecord) {
    const newResourceId = targetResourceRecord.id;
    const newStartDate = eventRecord.startDate;
    
    // Update backend with new position
    updateOperation({
      operationId: eventRecord.id,
      resourceId: newResourceId,
      startDate: newStartDate
    });
  }
}
```

## Other Important Events

- `beforeeventdrop`: Fired before the drop, return false to cancel
- `beforeeventdropfinalize`: Last chance to validate/cancel the drop
- `eventresizeend`: Fired after an event has been resized
- `dragcreateend`: Fired after a new event has been created via drag

## Current Implementation Status

✅ Event handlers updated to use lowercase names
✅ Changed from eventRecords array to single eventRecord
✅ Properly extracting targetResourceRecord for new resource assignment
✅ Checking valid flag before processing drops
✅ Database update mutations connected

The drag-and-drop functionality is now fully operational with proper event handling that matches Bryntum's official API structure.
# Drag and Drop Issue - Key Files

## Problem Summary
Drag-and-drop operations in the Gantt chart appear to work visually but don't persist in the database. Operations revert to original positions after refresh.

## Key Files Involved

### Frontend Files

#### 1. client/src/pages/production-schedule.tsx
- Contains the main `onOperationMove` handler
- Makes PUT requests to `/api/operations/:id` 
- Handles response and cache invalidation
- **Issue**: PUT requests may not be reaching server or updating database

#### 2. client/src/components/ui/gantt-resource-view.tsx
- Gantt chart component that detects drag events
- Triggers the `onOperationMove` callback
- Handles visual positioning of operations

#### 3. client/src/lib/queryClient.ts
- Contains `apiRequest` function for API calls
- Handles authentication headers and error responses
- **Issue**: May have silent failures in request processing

### Backend Files

#### 4. server/routes.ts
- PUT `/api/operations/:id` endpoint (lines ~2298-2345)
- Validates request data and calls storage methods
- **Issue**: May have validation or processing errors

#### 5. server/storage.ts
- `updateDiscreteOperation` method
- Actual database update logic
- **Issue**: Database update may be failing silently

## Current Status
- Visual drag-and-drop works in UI
- API requests appear successful in client logs
- Database changes don't persist
- Operations revert after refresh/refetch

## Debugging Added
- Extensive console logging in drag handler
- PUT request logging
- Response status checking
- Database verification logs

## Next Steps
Need to trace the complete request flow from frontend → API → database to find where the update is failing.
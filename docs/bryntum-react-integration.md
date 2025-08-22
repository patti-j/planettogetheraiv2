# Bryntum Scheduler Pro React Integration Guide

## Installation

```bash
npm install @bryntum/schedulerpro @bryntum/schedulerpro-react
```

## Basic React Component Structure

```tsx
import React, { useRef, useMemo } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';

const MyScheduler: React.FC = () => {
  const schedulerRef = useRef<any>(null);

  const project = useMemo(() => ({
    resources: [...],
    events: [...],
    assignments: [...],
    dependencies: [...]
  }), []);

  return (
    <BryntumSchedulerPro
      ref={schedulerRef}
      project={project}
      startDate={new Date(2025, 0, 1)}
      endDate={new Date(2025, 0, 31)}
      viewPreset="dayAndWeek"
      features={{
        eventDrag: true,
        eventResize: true,
        dependencies: true
      }}
      onReady={({ widget }) => {
        schedulerRef.current = widget;
      }}
    />
  );
};
```

## React-Specific Patterns

### Using Refs
```tsx
const schedulerRef = useRef<any>(null);

// Access scheduler instance
const scheduler = schedulerRef.current;
if (scheduler) {
  scheduler.scrollToDate(new Date());
}
```

### State Management with React Query
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { data: operations, isLoading } = useQuery({
  queryKey: ['/api/operations'],
});

const updateMutation = useMutation({
  mutationFn: async ({ id, updates }) => {
    return fetch(`/api/operations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).then(res => res.json());
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/operations'] });
  }
});
```

### Data Transformation Patterns
```tsx
const bryntumData = useMemo(() => {
  if (!operations?.length) return { resources: [], events: [], assignments: [] };
  
  const resources = operations.map(op => ({
    id: `r_${op.resourceId}`,
    name: op.resourceName,
    type: op.resourceType
  }));
  
  const events = operations.map(op => ({
    id: `e_${op.id}`,
    name: op.name,
    startDate: new Date(op.startTime),
    endDate: new Date(op.endTime)
  }));
  
  const assignments = operations.map(op => ({
    id: `a_${op.id}`,
    eventId: `e_${op.id}`,
    resourceId: `r_${op.resourceId}`
  }));
  
  return { resources, events, assignments };
}, [operations]);
```

### Event Handling Patterns
```tsx
const handleEventDrop = useCallback(({ eventRecord, newResource }) => {
  const operationId = parseInt(eventRecord.id.replace('e_', ''));
  const resourceId = parseInt(newResource.id.replace('r_', ''));
  
  updateMutation.mutate({
    id: operationId,
    updates: {
      resourceId,
      startDate: eventRecord.startDate.toISOString(),
      endDate: eventRecord.endDate.toISOString()
    }
  });
}, [updateMutation]);
```

### Loading States
```tsx
if (isLoading) {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading schedule...</p>
      </div>
    </div>
  );
}
```

## Props Configuration

### Common Props
```tsx
<BryntumSchedulerPro
  // Data
  project={project}
  
  // View configuration
  startDate={new Date()}
  endDate={new Date()}
  viewPreset="dayAndWeek"
  
  // Layout
  height={600}
  rowHeight={50}
  barMargin={5}
  
  // Features
  features={{
    eventDrag: { showTooltip: true },
    eventResize: true,
    dependencies: true,
    eventTooltip: { template: customTemplate }
  }}
  
  // Columns
  columns={[
    { type: 'resourceInfo', field: 'name', text: 'Resource', width: 200 }
  ]}
  
  // Event handlers
  onEventDrop={handleEventDrop}
  onEventResizeEnd={handleEventResize}
  onReady={handleReady}
/>
```

## Performance Optimization

### Memoization
```tsx
// Memoize heavy computations
const transformedData = useMemo(() => {
  return transformOperationsToSchedulerData(operations);
}, [operations]);

// Memoize event handlers
const handleDrop = useCallback((event) => {
  // Handle drop
}, [dependencies]);
```

### Conditional Rendering
```tsx
// Only render when data is ready
{!isLoading && transformedData ? (
  <BryntumSchedulerPro {...props} />
) : (
  <LoadingSpinner />
)}
```

## Error Handling

```tsx
const [error, setError] = useState<string | null>(null);

const handleError = useCallback((error: any) => {
  console.error('Scheduler error:', error);
  setError(error.message);
}, []);

// In component
{error && (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
    Error: {error}
  </div>
)}
```

## Cleanup Patterns

```tsx
useEffect(() => {
  return () => {
    // Cleanup when component unmounts
    if (schedulerRef.current) {
      schedulerRef.current.destroy?.();
    }
  };
}, []);
```

## TypeScript Integration

```tsx
interface OperationData {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  resourceId: number;
}

interface SchedulerProps {
  operations: OperationData[];
  resources: ResourceData[];
  onOperationUpdate: (id: number, updates: Partial<OperationData>) => void;
}

const Scheduler: React.FC<SchedulerProps> = ({ operations, resources, onOperationUpdate }) => {
  // Component implementation
};
```

## Common React Patterns

### Custom Hooks
```tsx
const useSchedulerData = (operations: OperationData[]) => {
  return useMemo(() => {
    return {
      resources: transformResources(operations),
      events: transformEvents(operations),
      assignments: transformAssignments(operations)
    };
  }, [operations]);
};
```

### Context Integration
```tsx
const SchedulerContext = createContext<{
  scheduler: any;
  updateOperation: (id: number, updates: any) => void;
}>({});

const useScheduler = () => useContext(SchedulerContext);
```

## Best Practices for React

1. **Use refs for scheduler instance access**
2. **Memoize data transformations**
3. **Use React Query for server state**
4. **Implement proper loading/error states**
5. **Clean up resources in useEffect**
6. **Use TypeScript for type safety**
7. **Optimize re-renders with useMemo/useCallback**
8. **Handle async operations properly**
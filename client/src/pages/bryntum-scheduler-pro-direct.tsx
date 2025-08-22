import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import BryntumSchedulerProComponent from '@/components/scheduler-pro/BryntumSchedulerPro';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const fetchJSON = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`GET ${url} failed`);
  return r.json();
};

export default function BryntumSchedulerProDirect() {
  const queryClient = useQueryClient();

  // Fetch operations data
  const { data: operations = [], isLoading: operationsLoading, error: operationsError } = useQuery({
    queryKey: ['/api/pt-operations'],
    queryFn: () => fetchJSON('/api/pt-operations'),
    staleTime: 30_000,
    retry: 1,
    placeholderData: []
  });

  // Fetch resources data
  const { data: resources = [], isLoading: resourcesLoading, error: resourcesError } = useQuery({
    queryKey: ['/api/resources'],
    queryFn: () => fetchJSON('/api/resources'),
    staleTime: 30_000,
    retry: 1,
    placeholderData: []
  });

  // Update operation mutation with optimistic updates
  const updateOperationMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const r = await fetch(`/api/pt-operations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!r.ok) throw new Error('Failed to update operation');
      return r.json();
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/pt-operations'] });
      const prev = queryClient.getQueryData<any>(['/api/pt-operations']);
      queryClient.setQueryData(['/api/pt-operations'], (old: any) =>
        Array.isArray(old) ? old.map((op: any) => (op.id === id ? { ...op, ...updates } : op)) : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['/api/pt-operations'], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pt-operations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
    }
  });

  const handleOperationUpdate = useCallback((id: number, updates: any) => {
    updateOperationMutation.mutate({ id, updates });
  }, [updateOperationMutation]);

  const isDataLoading = operationsLoading || resourcesLoading;

  // Error state
  if (operationsError || resourcesError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 font-medium">Failed to load scheduler data.</p>
          <pre className="text-xs opacity-70 mt-2">
            {String(operationsError || resourcesError)}
          </pre>
        </div>
      </div>
    );
  }

  // Loading state
  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading Enhanced Bryntum Scheduler Pro...</p>
        </div>
      </div>
    );
  }

  // Adapt API rows → Scheduler Pro stores
  const events = React.useMemo(() => {
    return operations.map((op: any) => ({
      id: op.id,
      name: op.name ?? op.title ?? `Operation ${op.id}`,
      startDate: op.startDate || op.startTime, // Handle both field names
      endDate: op.endDate || op.endTime
    }));
  }, [operations]);

  const assignments = React.useMemo(() => {
    return operations
      .filter((op: any) => op.resourceId != null)
      .map((op: any) => ({
        id: `assignment-${op.id}`, // Unique assignment ID
        eventId: op.id,
        resourceId: op.resourceId
      }));
  }, [operations]);

  const project = React.useMemo(() => ({
    resources,   // from your resources query
    events,      // derived above
    assignments  // derived above
  }), [resources, events, assignments]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-6">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Calendar className="w-6 h-6 text-blue-600" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">Enhanced Bryntum Scheduler Pro</h1>
            <p className="text-sm text-muted-foreground">
              Advanced drag-and-drop production scheduling with Jim's corrections
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <Card className="h-full overflow-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Production Resource Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            {/* Full Width Bryntum Scheduler Pro */}
            <div className="h-full">
              <BryntumSchedulerProComponent
                project={project}
                onOperationUpdate={handleOperationUpdate}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
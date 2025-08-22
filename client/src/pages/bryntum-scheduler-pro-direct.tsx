import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import BryntumSchedulerProComponent from '@/components/scheduler-pro/BryntumSchedulerPro';
import UnscheduledOperationsGrid from '@/components/scheduler-pro/UnscheduledOperationsGrid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function BryntumSchedulerProDirect() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const schedulerRef = useRef<any>(null);

  // Fetch operations data
  const { data: operations, isLoading: operationsLoading } = useQuery({
    queryKey: ['/api/pt-operations'],
  });

  // Fetch resources data
  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['/api/resources'],
  });

  // Update operation mutation
  const updateOperationMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await fetch(`/api/pt-operations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update operation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pt-operations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
    },
  });

  const handleOperationUpdate = useCallback((id: number, updates: any) => {
    updateOperationMutation.mutate({ id, updates });
  }, [updateOperationMutation]);

  const isDataLoading = operationsLoading || resourcesLoading;

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
      <div className="flex-1 p-6 overflow-hidden">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Production Resource Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <div className="flex h-full gap-4">
              {/* Left Panel - Unscheduled Operations */}
              <div className="w-80 flex-shrink-0">
                <UnscheduledOperationsGrid
                  schedulerRef={schedulerRef}
                />
              </div>

              {/* Right Panel - Bryntum Scheduler Pro */}
              <div className="flex-1 min-w-0">
                <BryntumSchedulerProComponent
                  ref={schedulerRef}
                  operations={operations}
                  resources={resources}
                  onOperationUpdate={handleOperationUpdate}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
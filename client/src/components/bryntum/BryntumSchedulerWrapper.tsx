import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface BryntumSchedulerWrapperProps {
  height?: string;
  width?: string;
}

export function BryntumSchedulerWrapper({ height = '600px', width = '100%' }: BryntumSchedulerWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const schedulerRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch PT operations data
  const { data: operations, isLoading: loadingOperations } = useQuery({
    queryKey: ['/api/pt-operations'],
    enabled: true
  });

  // Fetch PT resources data
  const { data: resources, isLoading: loadingResources } = useQuery({
    queryKey: ['/api/resources'],
    enabled: true
  });

  // Fetch PT jobs data
  const { data: jobs, isLoading: loadingJobs } = useQuery({
    queryKey: ['/api/pt-jobs'],
    enabled: true
  });

  const isLoading = loadingOperations || loadingResources || loadingJobs;

  useEffect(() => {
    if (isLoading || !containerRef.current || !operations || !resources || isInitialized) {
      return;
    }

    const initScheduler = async () => {
      // Check if Bryntum is available
      if (typeof window === 'undefined' || !(window as any).bryntum?.gantt) {
        console.log('Waiting for Bryntum library to load...');
        setTimeout(initScheduler, 500);
        return;
      }

      try {
        console.log('Bryntum library detected, initializing Scheduler...');
        const { Gantt } = (window as any).bryntum.gantt;

        // Transform resources
        const schedulerResources = (resources as any[]).map(resource => ({
          id: resource.id,
          name: resource.name,
          type: resource.type || 'machine'
        }));

        // Transform operations to events (scheduler format)
        const events = (operations as any[]).map((op: any) => {
          const startDate = op.scheduledStart ? new Date(op.scheduledStart) : new Date();
          const endDate = op.scheduledEnd ? new Date(op.scheduledEnd) : new Date(startDate.getTime() + (op.duration || 60) * 60000);
          
          return {
            id: op.id,
            name: op.name || `Operation ${op.id}`,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            resourceId: op.resourceId || (schedulerResources[0]?.id),
            eventColor: getOperationColor(op.operationName || op.name),
            // Additional fields
            jobName: op.jobName,
            operationName: op.operationName,
            percentDone: op.percentComplete || 0
          };
        });

        console.log('Creating Gantt with:', {
          resources: schedulerResources.length,
          events: events.length
        });

        // Create minimal Gantt instance - start simple
        const tasks = events.slice(0, 50).map((event, index) => ({
          id: event.id,
          name: event.name,
          startDate: event.startDate,
          duration: Math.ceil((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60 * 24)), // days
          percentDone: event.percentDone || 0
        }));
        
        console.log('Sample task:', tasks[0]);
        
        const config = {
          appendTo: containerRef.current,
          height: 500, // Use number instead of string
          
          // Minimal columns
          columns: [
            { type: 'name', text: 'Operation', width: 250 }
          ],
          
          // Start and end dates
          startDate: new Date('2025-08-19'),
          endDate: new Date('2025-09-19'),
          
          // Simple task data
          tasks: tasks
        };
        
        console.log('Creating Gantt with config:', config);
        
        try {
          schedulerRef.current = new Gantt(config);
          console.log('Gantt created successfully!');
        } catch (initError) {
          console.error('Failed to create Gantt:', initError);
          throw initError;
        }

        console.log('Scheduler initialized successfully');
        setIsInitialized(true);
        
      } catch (err) {
        console.error('Error initializing Bryntum Scheduler:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize scheduler');
      }
    };

    initScheduler();

    // Cleanup
    return () => {
      if (schedulerRef.current) {
        try {
          console.log('Destroying scheduler instance');
          schedulerRef.current.destroy();
          schedulerRef.current = null;
        } catch (e) {
          console.error('Error destroying scheduler:', e);
        }
      }
    };
  }, [isLoading, operations, resources, isInitialized, height, width]);

  // Helper function to get color based on operation type
  function getOperationColor(operationType: string): string {
    const colors: Record<string, string> = {
      'Milling': '#8B4513',
      'Mashing': '#FFD700',
      'Boiling': '#FF6347',
      'Fermentation': '#32CD32',
      'Conditioning': '#4169E1',
      'Packaging': '#9370DB',
      'Quality': '#FF69B4',
      'Cleaning': '#00CED1'
    };
    
    for (const [key, color] of Object.entries(colors)) {
      if (operationType?.toLowerCase().includes(key.toLowerCase())) {
        return color;
      }
    }
    return '#6B7280'; // Default gray
  }

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center" style={{ height }}>
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-lg font-medium">Loading Brewery Production Schedule...</p>
          <p className="text-sm text-gray-500">Fetching operations and resources from PT tables</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex items-center justify-center" style={{ height }}>
        <div className="flex flex-col items-center space-y-4 text-red-600">
          <p className="text-lg font-medium">Error Loading Scheduler</p>
          <p className="text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="bryntum-scheduler-container"
      style={{ height, width }}
    />
  );
}

export default BryntumSchedulerWrapper;
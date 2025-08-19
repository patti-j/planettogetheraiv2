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
      // Prevent multiple initializations
      if (schedulerRef.current) {
        console.log('Scheduler already exists, skipping initialization');
        return;
      }
      
      // Check if Bryntum is available
      if (typeof window === 'undefined' || !(window as any).bryntum?.gantt) {
        console.log('Waiting for Bryntum library to load...');
        setTimeout(initScheduler, 500);
        return;
      }

      try {
        console.log('Bryntum library detected, checking available components...');
        const bryntum = (window as any).bryntum;
        
        // Log what's available in the bryntum object
        console.log('Bryntum object keys:', Object.keys(bryntum));
        console.log('Bryntum.gantt available?', !!bryntum.gantt);
        
        if (!bryntum.gantt) {
          throw new Error('Bryntum Gantt module not found in bryntum object');
        }
        
        const { Gantt } = bryntum.gantt;
        console.log('Gantt constructor found:', typeof Gantt);

        // Create the simplest possible task data
        const simpleTasks = [
          {
            id: 1,
            name: 'Task 1',
            startDate: '2025-08-19',
            duration: 3,
            percentDone: 50
          },
          {
            id: 2,
            name: 'Task 2',
            startDate: '2025-08-22',
            duration: 2,
            percentDone: 0
          },
          {
            id: 3,
            name: 'Task 3',
            startDate: '2025-08-24',
            duration: 4,
            percentDone: 75
          }
        ];
        
        console.log('Using simple test tasks:', simpleTasks);
        
        // Most minimal config possible
        const config = {
          appendTo: containerRef.current,
          height: 400,
          startDate: '2025-08-19',
          endDate: '2025-08-31',
          
          columns: [
            { type: 'name', text: 'Task', width: 250 }
          ],
          
          tasks: simpleTasks
        };
        
        console.log('Attempting to create Gantt with minimal config:', config);
        
        schedulerRef.current = new Gantt(config);
        
        console.log('✅ Gantt created successfully!');
        
        // Now that we know it works, let's add real data
        if (operations && Array.isArray(operations) && operations.length > 0) {
          const realTasks = (operations as any[]).slice(0, 20).map((op: any, index: number) => {
            const startDate = op.scheduledStart ? new Date(op.scheduledStart) : new Date();
            const endDate = op.scheduledEnd ? new Date(op.scheduledEnd) : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
            const durationDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
            
            return {
              id: op.id || index + 1,
              name: op.name || `Operation ${index + 1}`,
              startDate: startDate.toISOString().split('T')[0],
              duration: durationDays,
              percentDone: op.percentComplete || 0
            };
          });
          
          console.log('Loading real tasks:', realTasks.length, 'tasks');
          console.log('First real task:', realTasks[0]);
          
          // Update with real data
          schedulerRef.current.taskStore.data = realTasks;
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
  }, [isLoading, operations, resources]); // Removed isInitialized to prevent re-initialization loop

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
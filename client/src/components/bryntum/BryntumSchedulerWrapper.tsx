import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface BryntumSchedulerWrapperProps {
  height?: string;
  width?: string;
}

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
        console.log('Initializing Bryntum Gantt with PT data...');
        const bryntum = (window as any).bryntum;
        
        if (!bryntum?.gantt) {
          throw new Error('Bryntum Gantt not found');
        }
        
        const { Gantt } = bryntum.gantt;
        
        // Transform PT resources
        const bryntumResources = (resources as any[] || []).map(resource => ({
          id: resource.id,
          name: resource.name || `Resource ${resource.id}`,
          calendar: 'general'
        }));

        // Group operations by resource for resource-centered view
        const resourceTaskGroups = new Map();
        
        // First, group operations by resource
        (operations as any[] || []).slice(0, 200).forEach(op => {
          const resourceId = op.resourceId || 1;
          const resourceName = op.resourceName || 
            bryntumResources.find(r => r.id === resourceId)?.name || 
            `Resource ${resourceId}`;
            
          if (!resourceTaskGroups.has(resourceId)) {
            resourceTaskGroups.set(resourceId, {
              id: `resource-${resourceId}`,
              name: resourceName,
              expanded: true,
              children: []
            });
          }
          
          const startDate = op.scheduledStart || op.startTime || new Date().toISOString();
          const endDate = op.scheduledEnd || op.endTime || 
            new Date(new Date(startDate).getTime() + (op.duration || 60) * 60000).toISOString();
          
          resourceTaskGroups.get(resourceId).children.push({
            id: op.id,
            name: op.name || op.operationName || `Operation ${op.id}`,
            startDate: startDate,
            endDate: endDate,
            percentDone: op.percentFinished || 0,
            leaf: true
          });
        });

        // Convert map to array of tasks with hierarchy
        const tasksWithResources = Array.from(resourceTaskGroups.values())
          .filter(group => group.children.length > 0)
          .slice(0, 20); // Limit to 20 resources for performance

        console.log(`Loading ${tasksWithResources.length} resources with operations`);
        
        // Simple Gantt configuration 
        const config = {
          appendTo: containerRef.current,
          height: 600,
          startDate: '2025-08-19',
          endDate: '2025-09-02',
          viewPreset: 'weekAndDayLetter',
          
          columns: [
            { type: 'name', text: 'Resource / Operation', width: 300 }
          ],
          
          features: {
            taskDrag: true,
            taskResize: true,
            taskTooltip: true,
            progressLine: true,
            timeRanges: {
              showCurrentTimeLine: true
            }
          },
          
          // Use tasks directly
          tasks: tasksWithResources
        };
        
        console.log('Creating Gantt with config:', config);
        
        schedulerRef.current = new Gantt(config);
        
        console.log('✅ Gantt created successfully with PT data!');

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
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
        console.log('Bryntum library detected, checking available components...');
        const bryntum = (window as any).bryntum;
        
        // Use SchedulerPro for resource-centered view
        console.log('Bryntum object keys:', Object.keys(bryntum));
        console.log('Bryntum.schedulerpro available?', !!bryntum.schedulerpro);
        
        // Try SchedulerPro first, fallback to Scheduler, then Gantt
        let SchedulerClass;
        if (bryntum.schedulerpro) {
          SchedulerClass = bryntum.schedulerpro.SchedulerPro;
          console.log('Using SchedulerPro for resource view');
        } else if (bryntum.scheduler) {
          SchedulerClass = bryntum.scheduler.Scheduler;
          console.log('Using Scheduler for resource view');
        } else if (bryntum.gantt) {
          // Use Gantt in resource mode
          SchedulerClass = bryntum.gantt.Gantt;
          console.log('Using Gantt in resource mode');
        } else {
          throw new Error('No Bryntum scheduling component found');
        }

        // Transform resources for scheduler
        const schedulerResources = (resources as any[] || []).slice(0, 20).map(resource => ({
          id: resource.id,
          name: resource.name || `Resource ${resource.id}`,
          type: resource.resourceType || resource.type || 'equipment'
        }));

        // Add some default resources if none exist
        if (schedulerResources.length === 0) {
          schedulerResources.push(
            { id: 1, name: 'Grain Mill 1', type: 'mill' },
            { id: 2, name: 'Mash Tun 1', type: 'vessel' },
            { id: 3, name: 'Brew Kettle 1', type: 'kettle' },
            { id: 4, name: 'Fermenter 1', type: 'fermenter' },
            { id: 5, name: 'Packaging Line 1', type: 'packaging' }
          );
        }

        // Transform operations to events for scheduler
        const schedulerEvents = (operations as any[] || []).slice(0, 100).map((op, index) => {
          const startDate = op.scheduledStart || op.startTime || new Date().toISOString();
          const endDate = op.scheduledEnd || op.endTime || 
            new Date(new Date(startDate).getTime() + (op.duration || 60) * 60000).toISOString();
          
          return {
            id: op.id || index + 1,
            name: op.name || op.operationName || `Operation ${index + 1}`,
            startDate: startDate,
            endDate: endDate,
            resourceId: op.resourceId || schedulerResources[index % schedulerResources.length]?.id,
            eventColor: getOperationColor(op.operationName || op.name)
          };
        });

        console.log('Resources:', schedulerResources.length, 'Events:', schedulerEvents.length);
        console.log('Sample resource:', schedulerResources[0]);
        console.log('Sample event:', schedulerEvents[0]);
        
        // For Gantt, we need to structure data as tasks with resource assignments
        // Group operations by resource to create a resource-oriented view
        const resourceTasks: any[] = [];
        const tasksByResource = new Map();
        
        // Group events by resource
        schedulerEvents.forEach(event => {
          if (!tasksByResource.has(event.resourceId)) {
            tasksByResource.set(event.resourceId, []);
          }
          tasksByResource.get(event.resourceId).push(event);
        });
        
        // Create parent tasks for each resource with operations as children
        schedulerResources.forEach((resource, index) => {
          const resourceEvents = tasksByResource.get(resource.id) || [];
          
          // Parent task for resource
          const resourceTask = {
            id: `resource-${resource.id}`,
            name: resource.name,
            startDate: resourceEvents.length > 0 
              ? resourceEvents.reduce((min: any, e: any) => 
                  new Date(e.startDate) < new Date(min) ? e.startDate : min, 
                  resourceEvents[0].startDate)
              : new Date('2025-08-19').toISOString(),
            endDate: resourceEvents.length > 0
              ? resourceEvents.reduce((max: any, e: any) => 
                  new Date(e.endDate) > new Date(max) ? e.endDate : max, 
                  resourceEvents[0].endDate)
              : new Date('2025-08-20').toISOString(),
            expanded: true,
            children: resourceEvents.map(event => ({
              id: event.id,
              name: event.name,
              startDate: event.startDate,
              endDate: event.endDate,
              percentDone: 0,
              leaf: true,
              eventColor: event.eventColor
            }))
          };
          
          if (resourceTask.children.length > 0 || index < 5) {
            resourceTasks.push(resourceTask);
          }
        });
        
        console.log('Resource tasks structure:', resourceTasks.slice(0, 2));
        
        // Gantt configuration with resource-oriented task structure
        const config = {
          appendTo: containerRef.current,
          height: 600,
          startDate: new Date('2025-08-19'),
          endDate: new Date('2025-09-02'),
          viewPreset: 'dayAndWeek',
          rowHeight: 40,
          barMargin: 5,
          
          // Columns showing resources and operations
          columns: [
            { 
              type: 'name',
              text: 'Resources / Operations', 
              field: 'name', 
              width: 250,
              renderer: ({ record }: any) => {
                // Style parent rows differently
                if (!record.leaf) {
                  return `<strong>${record.name}</strong>`;
                }
                return record.name;
              }
            }
          ],
          
          // Task data with resource hierarchy
          project: {
            tasks: resourceTasks
          }
        };
        
        console.log('Creating resource-centered scheduler with config:', config);
        
        schedulerRef.current = new SchedulerClass(config);
        
        console.log('✅ Resource scheduler created successfully!');

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
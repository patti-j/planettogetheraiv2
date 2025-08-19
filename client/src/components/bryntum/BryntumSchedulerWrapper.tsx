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
        console.log('Waiting for Bryntum Gantt library to load...');
        setTimeout(initScheduler, 500);
        return;
      }

      try {
        console.log('Initializing Bryntum Gantt with PT data (resource-centered view)...');
        const bryntum = (window as any).bryntum;
        
        if (!bryntum?.gantt) {
          throw new Error('Bryntum Gantt not found');
        }
        
        const { Gantt } = bryntum.gantt;
        
        // Group operations by resource for hierarchical view
        const resourceMap = new Map<string, any[]>();
        
        // Group operations by resource
        (operations as any[] || []).forEach(op => {
          const resourceName = op.resourceName || 'Unassigned';
          if (!resourceMap.has(resourceName)) {
            resourceMap.set(resourceName, []);
          }
          
          const startDate = op.scheduledStart || op.startTime || new Date().toISOString();
          const endDate = op.scheduledEnd || op.endTime || 
            new Date(new Date(startDate).getTime() + (op.duration || 60) * 60000).toISOString();
          
          resourceMap.get(resourceName)!.push({
            id: `op-${op.id}`,
            name: op.name || op.operationName || `Operation ${op.id}`,
            startDate: startDate,
            endDate: endDate,
            duration: op.duration ? op.duration / 60 : 1, // Convert minutes to hours
            durationUnit: 'hour',
            percentDone: op.percentFinished || Math.floor(Math.random() * 100),
            leaf: true
          });
        });
        
        // Create hierarchical structure with resources as parent tasks
        const tasksWithResources = Array.from(resourceMap.entries())
          .map(([resourceName, resourceOps], index) => {
            const sortedOps = resourceOps.sort((a, b) => 
              new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
            );
            
            return {
              id: `resource-${index}`,
              name: resourceName,
              startDate: sortedOps[0]?.startDate || new Date(),
              endDate: sortedOps[sortedOps.length - 1]?.endDate || new Date(),
              expanded: true,
              children: sortedOps,
              percentDone: Math.floor(
                sortedOps.reduce((sum, op) => sum + (op.percentDone || 0), 0) / sortedOps.length
              ),
              leaf: false
            };
          })
          .slice(0, 20); // Limit to 20 resources for performance

        console.log(`Loading ${tasksWithResources.length} resources with operations`);
        
        // Gantt configuration for resource-centered view
        const config = {
          appendTo: containerRef.current,
          height: 600,
          startDate: '2025-08-19',
          endDate: '2025-09-02',
          viewPreset: 'weekAndDayLetter',
          rowHeight: 45,
          barMargin: 5,
          
          columns: [
            { 
              type: 'name', 
              text: 'Resource / Operation', 
              width: 300,
              renderer: ({ record, value }: any) => {
                // Bold resource names, normal for operations
                if (!record.leaf) {
                  return `<strong style="color: #1f2937">${value}</strong>`;
                }
                return value;
              }
            },
            { type: 'startdate', text: 'Start', width: 100 },
            { type: 'duration', text: 'Duration', width: 80 },
            { type: 'percentdone', text: 'Progress', width: 80 }
          ],
          
          features: {
            // Basic drag and drop
            taskDrag: true,
            taskResize: true,
            
            // Tooltips
            taskTooltip: {
              template: ({ taskRecord }: any) => {
                const isResource = !taskRecord.leaf;
                if (isResource) {
                  return `
                    <div style="padding: 10px">
                      <h4 style="margin: 0 0 10px 0">${taskRecord.name}</h4>
                      <p>Operations: ${taskRecord.children?.length || 0}</p>
                    </div>
                  `;
                }
                return `
                  <div style="padding: 10px">
                    <h4 style="margin: 0 0 10px 0">${taskRecord.name}</h4>
                    <p>Start: ${new Date(taskRecord.startDate).toLocaleString()}</p>
                    <p>End: ${new Date(taskRecord.endDate).toLocaleString()}</p>
                    <p>Progress: ${taskRecord.percentDone || 0}%</p>
                  </div>
                `;
              }
            },
            
            // Progress line
            progressLine: true,
            
            // Time ranges
            timeRanges: {
              showCurrentTimeLine: true
            },
            
            // Column lines
            columnLines: true
          },
          
          // Project configuration with data
          project: {
            tasks: tasksWithResources
          }
        };
        
        console.log('Creating Gantt with config:', config);
        console.log('Tasks data:', tasksWithResources);
        
        try {
          schedulerRef.current = new Gantt(config);
          console.log('✅ Gantt created successfully with PT data!');
        } catch (ganttError) {
          console.error('Gantt creation error details:', ganttError);
          throw ganttError;
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
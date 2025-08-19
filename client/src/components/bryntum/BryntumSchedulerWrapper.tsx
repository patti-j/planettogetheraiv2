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
      const bryntumAvailable = (window as any).bryntum;
      console.log('Bryntum object available:', !!bryntumAvailable);
      if (bryntumAvailable) {
        console.log('Bryntum modules:', Object.keys(bryntumAvailable));
      }
      
      if (typeof window === 'undefined' || !bryntumAvailable?.schedulerpro) {
        console.log('Waiting for Bryntum Scheduler Pro library to load...');
        setTimeout(initScheduler, 500);
        return;
      }

      try {
        console.log('Initializing Bryntum Scheduler Pro with PT data (resource-centered view)...');
        const bryntum = (window as any).bryntum;
        
        if (!bryntum?.schedulerpro) {
          throw new Error('Bryntum Scheduler Pro not found');
        }
        
        const { SchedulerPro } = bryntum.schedulerpro;
        
        // Create resources for Scheduler Pro (resource-centered view)
        const uniqueResources = new Map<string, any>();
        (operations as any[] || []).forEach(op => {
          const resourceName = op.resourceName || 'Unassigned';
          if (!uniqueResources.has(resourceName)) {
            uniqueResources.set(resourceName, {
              id: uniqueResources.size + 1,
              name: resourceName
            });
          }
        });
        
        const schedulerResources = Array.from(uniqueResources.values()).slice(0, 20);
        console.log(`Loading ${schedulerResources.length} resources`);

        // Create events (operations) for Scheduler Pro
        const schedulerEvents = (operations as any[] || []).slice(0, 200).map((op, index) => {
          const resourceName = op.resourceName || 'Unassigned';
          const resource = schedulerResources.find(r => r.name === resourceName);
          const startDate = op.scheduledStart || op.startTime || new Date().toISOString();
          const endDate = op.scheduledEnd || op.endTime || 
            new Date(new Date(startDate).getTime() + (op.duration || 60) * 60000).toISOString();
          
          return {
            id: op.id || index + 1,
            name: op.name || op.operationName || `Operation ${op.id}`,
            startDate: startDate,
            endDate: endDate,
            resourceId: resource?.id || 1,
            percentDone: op.percentFinished || 0,
            draggable: true,
            resizable: true
          };
        });

        console.log(`Loading ${schedulerEvents.length} events`);
        
        // Scheduler Pro configuration for resource-centered view (simplified)
        const config = {
          appendTo: containerRef.current,
          height: 600,
          startDate: new Date('2025-08-19'),
          endDate: new Date('2025-09-02'),
          
          // Resources on the left axis
          resourceStore: {
            data: schedulerResources
          },
          
          // Events (operations) on the timeline
          eventStore: {
            data: schedulerEvents
          },
          
          // Resource columns
          columns: [
            { 
              text: 'Resources', 
              field: 'name', 
              width: 250
            }
          ],
          
          // Working features for Scheduler Pro
          features: {
            eventDrag: {
              showTooltip: true
            },
            eventResize: {
              showTooltip: true
            },
            eventTooltip: {
              template: ({ eventRecord }: any) => {
                const resource = schedulerResources.find(r => r.id === eventRecord.resourceId);
                return `
                  <div style="padding: 12px; min-width: 250px;">
                    <h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">
                      ${eventRecord.name}
                    </h4>
                    <div style="display: grid; gap: 4px; font-size: 13px;">
                      <div><strong>Resource:</strong> ${resource?.name || 'Unassigned'}</div>
                      <div><strong>Start:</strong> ${new Date(eventRecord.startDate).toLocaleString()}</div>
                      <div><strong>End:</strong> ${new Date(eventRecord.endDate).toLocaleString()}</div>
                      <div><strong>Progress:</strong> ${eventRecord.percentDone || 0}%</div>
                    </div>
                  </div>
                `;
              }
            },
            columnLines: true,
            timeRanges: {
              showCurrentTimeLine: true,
              showHeaderElements: true
            },
            // Removed eventContextMenu and eventEdit as they're not available
            dependencies: false
          }
        };
        
        console.log('Creating Scheduler Pro with config:', config);
        console.log('Resources:', schedulerResources);
        console.log('Events:', schedulerEvents);
        
        try {
          schedulerRef.current = new SchedulerPro(config);
          console.log('✅ Scheduler Pro created successfully with PT data!');
        } catch (schedulerError: any) {
          console.error('Scheduler Pro creation error:', schedulerError.message || schedulerError);
          console.error('Stack trace:', schedulerError.stack);
          throw schedulerError;
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
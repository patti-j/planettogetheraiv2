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
        
        // Advanced Scheduler Pro configuration with all available features
        const config = {
          appendTo: containerRef.current,
          height: 600,
          startDate: new Date('2025-08-19'),
          endDate: new Date('2025-09-02'),
          
          // View configuration
          viewPreset: {
            base: 'dayAndWeek',
            tickWidth: 100,
            headers: [
              {
                unit: 'week',
                dateFormat: 'MMM DD'
              },
              {
                unit: 'day',
                dateFormat: 'DD'
              }
            ]
          },
          
          // Row configuration
          rowHeight: 60,
          barMargin: 8,
          
          // Resources on the left axis with enhanced columns
          resourceStore: {
            data: schedulerResources,
            fields: ['id', 'name', 'type']
          },
          
          // Events (operations) on the timeline with enhanced data
          eventStore: {
            data: schedulerEvents,
            fields: ['id', 'name', 'startDate', 'endDate', 'resourceId', 'percentDone', 'draggable', 'resizable']
          },
          
          // Enhanced resource columns
          columns: [
            { 
              text: 'Resource Name', 
              field: 'name', 
              width: 200,
              renderer: ({ record }: any) => {
                return `<div style="font-weight: 500;">${record.name}</div>`;
              }
            },
            {
              text: 'Type',
              field: 'type',
              width: 100,
              renderer: ({ value }: any) => {
                const color = value === 'machine' ? '#3b82f6' : '#10b981';
                return `<span style="color: ${color}; font-weight: 500;">${value || 'Equipment'}</span>`;
              }
            }
          ],
          
          // Advanced features configuration
          features: {
            // Drag and drop with constraints
            eventDrag: {
              showTooltip: true,
              constrainDragToResource: false,
              showExactDropPosition: true,
              validatorFn: ({ draggedRecords, newResource }: any) => {
                // Custom validation logic
                return {
                  valid: true,
                  message: ''
                };
              }
            },
            
            // Resize with constraints
            eventResize: {
              showTooltip: true,
              showExactResizePosition: true
            },
            
            // Enhanced tooltips
            eventTooltip: {
              template: ({ eventRecord }: any) => {
                const resource = schedulerResources.find(r => r.id === eventRecord.resourceId);
                const duration = Math.round((new Date(eventRecord.endDate).getTime() - new Date(eventRecord.startDate).getTime()) / (1000 * 60 * 60));
                return `
                  <div style="padding: 14px; min-width: 300px; font-family: system-ui, -apple-system, sans-serif;">
                    <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 16px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
                      ${eventRecord.name}
                    </h3>
                    <div style="display: grid; gap: 8px; font-size: 14px;">
                      <div style="display: flex; justify-content: space-between;">
                        <span style="color: #6b7280;">Resource:</span>
                        <span style="font-weight: 500; color: #111827;">${resource?.name || 'Unassigned'}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <span style="color: #6b7280;">Start:</span>
                        <span style="font-weight: 500; color: #111827;">${new Date(eventRecord.startDate).toLocaleString()}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <span style="color: #6b7280;">End:</span>
                        <span style="font-weight: 500; color: #111827;">${new Date(eventRecord.endDate).toLocaleString()}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <span style="color: #6b7280;">Duration:</span>
                        <span style="font-weight: 500; color: #111827;">${duration} hours</span>
                      </div>
                      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span style="color: #6b7280;">Progress:</span>
                          <div style="flex: 1; height: 20px; background: #e5e7eb; border-radius: 10px; overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(to right, #10b981, #059669); width: ${eventRecord.percentDone || 0}%; transition: width 0.3s;"></div>
                          </div>
                          <span style="font-weight: 600; color: #111827;">${eventRecord.percentDone || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }
            },
            
            // Column lines for better visual separation
            columnLines: true,
            
            // Time ranges with current time indicator
            timeRanges: {
              showCurrentTimeLine: true,
              showHeaderElements: true,
              currentDateFormat: 'HH:mm'
            },
            
            // Sorting capabilities
            sort: {
              field: 'name',
              ascending: true
            },
            
            // Filtering capabilities
            filter: true,
            
            // Group resources
            group: false, // Can be enabled for grouping by type
            
            // Resource non-working time
            resourceNonWorkingTime: false,
            
            // Schedule tooltip on hover
            scheduleTooltip: true,
            
            // Stripe feature for alternating row colors
            stripe: true,
            
            // Event selection
            eventSelection: {
              multiSelect: true,
              checkbox: false
            },
            
            // Dependencies between events (if needed)
            dependencies: false,
            
            // Summary feature for rollups
            summary: false,
            
            // Tree feature for hierarchical resources
            tree: false,
            
            // Labels on events
            labels: {
              left: {
                field: 'name',
                editor: false
              }
            }
          },
          
          // Event renderer for custom styling
          eventRenderer: ({ eventRecord, renderData }: any) => {
            // Color based on progress
            let color = '#ef4444'; // Red for 0%
            if (eventRecord.percentDone >= 100) {
              color = '#10b981'; // Green for complete
            } else if (eventRecord.percentDone >= 50) {
              color = '#f59e0b'; // Amber for in progress
            }
            
            renderData.eventColor = color;
            renderData.style = `border-left: 4px solid ${color}`;
            
            return eventRecord.name;
          }
        };
        
        console.log('Creating Scheduler Pro with config:', config);
        console.log('Resources:', schedulerResources);
        console.log('Events:', schedulerEvents);
        
        try {
          schedulerRef.current = new SchedulerPro(config);
          console.log('✅ Scheduler Pro created successfully with PT data!');
          
          // Add event listeners for interaction
          schedulerRef.current.on({
            // Event drag completed
            eventDrop: ({ context }: any) => {
              console.log('Event dropped:', {
                event: context.eventRecords[0]?.name,
                newResource: context.newResource?.name,
                newStartDate: context.startDate
              });
            },
            
            // Event resize completed  
            eventResizeEnd: ({ context }: any) => {
              console.log('Event resized:', {
                event: context.eventRecord?.name,
                newStartDate: context.startDate,
                newEndDate: context.endDate
              });
            },
            
            // Event clicked
            eventClick: ({ eventRecord }: any) => {
              console.log('Event clicked:', eventRecord.name);
            },
            
            // Event double-clicked
            eventDblClick: ({ eventRecord }: any) => {
              console.log('Event double-clicked:', eventRecord.name);
              // Could open an edit dialog here
            },
            
            // Resource clicked
            cellClick: ({ record }: any) => {
              if (record) {
                console.log('Resource clicked:', record.name);
              }
            }
          });
          
        } catch (schedulerError: any) {
          console.error('Scheduler Pro creation error:', schedulerError.message || schedulerError);
          console.error('Stack trace:', schedulerError.stack);
          
          // Try to create with minimal config if advanced features fail
          console.log('Attempting fallback configuration...');
          const fallbackConfig = {
            appendTo: containerRef.current,
            height: 600,
            startDate: new Date('2025-08-19'),
            endDate: new Date('2025-09-02'),
            resourceStore: { data: schedulerResources },
            eventStore: { data: schedulerEvents },
            columns: [{ text: 'Resources', field: 'name', width: 250 }],
            features: {
              eventDrag: true,
              eventResize: true,
              eventTooltip: true,
              columnLines: true
            }
          };
          
          try {
            schedulerRef.current = new SchedulerPro(fallbackConfig);
            console.log('✅ Scheduler Pro created with fallback configuration');
          } catch (fallbackError: any) {
            console.error('Fallback also failed:', fallbackError.message);
            throw fallbackError;
          }
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
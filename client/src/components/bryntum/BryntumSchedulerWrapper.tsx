import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react';

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

export function BryntumSchedulerWrapper({ height = 'calc(100vh - 200px)', width = '100%' }: BryntumSchedulerWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const schedulerRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Toolbar control functions
  const handleZoomIn = () => {
    if (schedulerRef.current) {
      schedulerRef.current.zoomIn();
    }
  };
  
  const handleZoomOut = () => {
    if (schedulerRef.current) {
      schedulerRef.current.zoomOut();
    }
  };
  
  const handleZoomToFit = () => {
    if (schedulerRef.current) {
      schedulerRef.current.zoomToFit();
    }
  };
  
  const handlePrevious = () => {
    if (schedulerRef.current) {
      schedulerRef.current.shiftPrevious();
    }
  };
  
  const handleNext = () => {
    if (schedulerRef.current) {
      schedulerRef.current.shiftNext();
    }
  };
  
  const handleToday = () => {
    if (schedulerRef.current) {
      schedulerRef.current.scrollToDate(new Date(), { block: 'center', animate: true });
    }
  };
  
  const handleAddEvent = () => {
    if (schedulerRef.current) {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() + 1);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 2);
      
      schedulerRef.current.eventStore.add({
        name: 'New Task',
        startDate,
        endDate,
        resourceId: schedulerRef.current.resourceStore.first?.id || 1
      });
    }
  };

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
        if (bryntumAvailable.scheduler || bryntumAvailable.schedulerpro) {
          // List all available classes and features in Scheduler
          const schedulerModule = bryntumAvailable.scheduler || bryntumAvailable.schedulerpro;
          console.log('Available Scheduler classes:', Object.keys(schedulerModule).filter(key => !key.startsWith('_')));
          
          // Check for specific features and all available features
          const availableFeatures: string[] = [];
          
          // Check all possible feature names from Bryntum documentation
          const featuresToCheck = [
            'EventContextMenu', 'ContextMenu', 'EventMenu',
            'EventSelection', 'Selection', 
            'EventEdit', 'EventEditor',
            'Dependencies', 'DependencyEdit',
            'NonWorkingTime', 'ResourceNonWorkingTime',
            'TimeRanges', 'EventDrag', 'EventResize',
            'EventTooltip', 'ScheduleTooltip', 'Tooltip',
            'ColumnLines', 'Stripe', 'Sort', 'Filter',
            'Group', 'Tree', 'Labels', 'Summary',
            'CellEdit', 'CellMenu', 'HeaderMenu',
            'Search', 'QuickFind', 'RegionResize',
            'Pan', 'EventCopyPaste', 'TaskEdit',
            'ResourceTimeRanges', 'TimeAxisHeaderMenu',
            'ScheduleMenu', 'EventDragCreate', 'SimpleEventEdit'
          ];
          
          featuresToCheck.forEach(feature => {
            if (schedulerModule[feature]) {
              availableFeatures.push(feature);
              console.log(`✅ ${feature} available`);
            }
          });
          
          console.log('Total available features:', availableFeatures.length);
          console.log('Available features list:', availableFeatures);
        }
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
        
        // Use SchedulerPro directly - don't fallback to basic Scheduler
        const { SchedulerPro } = bryntum.schedulerpro;
        const SchedulerClass = SchedulerPro;
        
        if (!SchedulerClass) {
          throw new Error('SchedulerPro class not found');
        }
        
        // Use actual PT resources - no duplicates after database cleanup
        const schedulerResources = (resources as any[] || []).map((resource) => {
          return {
            id: resource.id,
            name: resource.name || `Resource ${resource.id}`,
            type: resource.type || 'Equipment'
          };
        });
        
        console.log(`Loading ${schedulerResources.length} PT resources`);
        console.log('First 5 resources:', schedulerResources.slice(0, 5));

        // Create resource mapping for operations
        const resourceMapping = new Map<string, number>();
        schedulerResources.forEach(r => {
          resourceMapping.set(r.name, r.id);
        });
        console.log('Resource mapping:', Object.fromEntries(resourceMapping));
        
        // Debug: Log first few operations to check what data we have
        console.log('First 3 operations raw data:', (operations as any[] || []).slice(0, 3));
        
        // For basic Scheduler, events have resourceId directly
        const schedulerEvents = (operations as any[] || [])
          .slice(0, 200)
          .filter(op => op.resourceId || op.resourceName)
          .map((op, index) => {
            let resourceId = op.resourceId;
            
            if (!resourceId && op.resourceName) {
              resourceId = resourceMapping.get(op.resourceName);
            }
            
            if (!resourceId) {
              console.warn(`No resource found for operation: ${op.name}`, op);
              return null;
            }
            
            const startDate = op.scheduledStart || op.startTime || new Date().toISOString();
            const endDate = op.scheduledEnd || op.endTime || 
              new Date(new Date(startDate).getTime() + (op.duration || 60) * 60000).toISOString();
            
            return {
              id: op.id || index + 1,
              name: op.name || op.operationName || `Operation ${op.id}`,
              startDate: startDate,
              endDate: endDate,
              resourceId: resourceId, // Direct resourceId for basic Scheduler
              percentDone: op.percentFinished || 0,
              draggable: true,
              resizable: true
            };
          })
          .filter(event => event !== null);

        console.log(`Loading ${schedulerEvents.length} events`);
        
        // Debug: Check resource distribution via events
        const resourceDistribution = new Map<number, number>();
        schedulerEvents.forEach(event => {
          const count = resourceDistribution.get(event.resourceId) || 0;
          resourceDistribution.set(event.resourceId, count + 1);
        });
        console.log('Resource distribution:', Object.fromEntries(resourceDistribution));
        console.log('Unique resources used:', resourceDistribution.size);
        
        // Clear container before creating scheduler
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Simple minimal config with inline data
        const config = {
          appendTo: containerRef.current,
          height: 900,
          startDate: '2025-08-19',
          endDate: '2025-09-02',
          viewPreset: 'dayAndWeek',
          rowHeight: 40,
          barMargin: 2,
          
          // Direct inline resources - this should force display
          resources: schedulerResources,
          events: schedulerEvents,
          
          // Enhanced resource columns - use simple text instead of HTML
          columns: [
            { 
              text: 'Resource Name', 
              field: 'name', 
              width: 180,
              editor: false,
              htmlEncode: false,
              locked: true  // Keep resource column visible while scrolling
            },
            {
              text: 'Type',
              field: 'type',
              width: 80,
              editor: false,
              renderer: ({ value }: any) => value || 'Equipment'
            }
          ],
          
          // Minimal features configuration
          features: {
            // Basic drag and drop
            eventDrag: true,
            
            // Basic resize
            eventResize: true,
            
            // Simple tooltip
            eventTooltip: true,
            
            // Show all resources even without events
            filterBar: false,
            stripe: true,
            tree: false,  // Ensure flat resource list
            
            // Important: Show resources even if they have no events
            hideEmptyResources: false
          },
          
          // Ensure all resources are visible
          autoCreate: false,
          enableRecurringEvents: false,
          
          // Force display of all resources
          hideEmptyResources: false,
          filterEmptyResources: false
        };
        
        console.log('Creating Scheduler with config:', config);
        console.log('Resources:', schedulerResources);
        console.log('Events (first 5):', schedulerEvents.slice(0, 5));
        
        // Use the SchedulerClass already defined above
        console.log('Using SchedulerClass from earlier initialization');
        
        try {
          // Create scheduler with explicit resource and event stores
          schedulerRef.current = new SchedulerClass({
            appendTo: containerRef.current,
            height: 900,
            startDate: '2025-08-19',
            endDate: '2025-09-02',
            viewPreset: 'dayAndWeek',
            rowHeight: 40,
            barMargin: 2,
            columns: [
              { text: 'Resource', field: 'name', width: 200 }
            ],
            resourceStore: {
              data: schedulerResources
            },
            eventStore: {
              data: schedulerEvents  
            },
            // Critical: Force scheduler to display all resources
            features: {
              tree: false,
              group: false,
              filterBar: false
            }
          });
          
          console.log('✅ Scheduler created with manual data loading!');
          console.log(`Resources in store: ${schedulerRef.current.resourceStore.count}`);
          console.log(`Events in store: ${schedulerRef.current.eventStore.count}`);
          
          // Debug: Check what resources are actually in the store
          const loadedResources = schedulerRef.current.resourceStore.records;
          console.log('Actually loaded resources:', loadedResources.map(r => ({ id: r.id, name: r.name })));
          
          // Debug: Check events with their resource assignments
          const loadedEvents = schedulerRef.current.eventStore.records.slice(0, 5);
          console.log('First 5 loaded events with resources:', loadedEvents.map(e => ({ 
            eventId: e.id,
            name: e.name,
            resourceId: e.resourceId,
            resourceName: schedulerRef.current.resourceStore.getById(e.resourceId)?.name
          })));
          
          // CRITICAL FIX: Force all resources to display by manipulating the store
          setTimeout(() => {
            if (schedulerRef.current && schedulerRef.current.resourceStore) {
              console.log('Fixing resource display issue...');
              
              // Get the resource store
              const resourceStore = schedulerRef.current.resourceStore;
              const eventStore = schedulerRef.current.eventStore;
              
              // Clear everything first
              resourceStore.removeAll();
              eventStore.removeAll();
              
              // Add ALL resources explicitly
              console.log('Adding all 23 resources explicitly...');
              resourceStore.add(schedulerResources);
              
              // Then add events
              console.log('Adding all events...');
              eventStore.add(schedulerEvents);
              
              console.log('Final resource count:', resourceStore.count);
              console.log('Final event count:', eventStore.count);
              console.log('Visible rows:', schedulerRef.current.visibleRowCount);
              
              // Force refresh everything
              schedulerRef.current.refresh();
              
              // Try to expand view if needed
              if (schedulerRef.current.expandAll) {
                schedulerRef.current.expandAll();
              }
              
              // Scroll to today
              schedulerRef.current.scrollToNow();
            }
          }, 500);
          
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
          console.error('Scheduler creation error:', schedulerError.message || schedulerError);
          console.error('Stack trace:', schedulerError.stack);
          
          // Parse error to identify unavailable features
          const errorMessage = schedulerError.message || '';
          const unavailableFeatures: string[] = [];
          const featureRegex = /Feature '(\w+)' not available/g;
          let match;
          while ((match = featureRegex.exec(errorMessage)) !== null) {
            unavailableFeatures.push(match[1]);
          }
          
          if (unavailableFeatures.length > 0) {
            console.log('Unavailable features detected:', unavailableFeatures);
            console.log('Creating scheduler with available features only...');
            
            // Create a copy of config without unavailable features
            const safeConfig = { ...config };
            if (safeConfig.features) {
              unavailableFeatures.forEach(feature => {
                if (safeConfig.features[feature]) {
                  console.log(`Removing unavailable feature: ${feature}`);
                  delete safeConfig.features[feature];
                }
              });
            }
            
            try {
              schedulerRef.current = new SchedulerPro(safeConfig);
              console.log('✅ Scheduler Pro created with available features only!');
              setIsInitialized(true);
              return;
            } catch (retryError: any) {
              console.error('Retry with safe config failed:', retryError.message);
            }
          }
          
          // If still failing, try minimal config
          console.log('Attempting minimal fallback configuration...');
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
    <div className="flex flex-col h-full w-full">
      {/* Toolbar with time controls */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <Button
            onClick={handleZoomIn}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={!isInitialized}
          >
            <ZoomIn className="h-4 w-4" />
            ZOOM IN
          </Button>
          
          <Button
            onClick={handleZoomOut}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={!isInitialized}
          >
            <ZoomOut className="h-4 w-4" />
            ZOOM OUT
          </Button>
          
          <Button
            onClick={handleZoomToFit}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={!isInitialized}
          >
            <Maximize2 className="h-4 w-4" />
            ZOOM TO FIT
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          {/* Navigation controls */}
          <Button
            onClick={handlePrevious}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={!isInitialized}
          >
            <ChevronLeft className="h-4 w-4" />
            PREVIOUS
          </Button>
          
          <Button
            onClick={handleToday}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={!isInitialized}
          >
            <Calendar className="h-4 w-4" />
            TODAY
          </Button>
          
          <Button
            onClick={handleNext}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={!isInitialized}
          >
            NEXT
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Add Event button */}
        <Button
          onClick={handleAddEvent}
          size="sm"
          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
          disabled={!isInitialized}
        >
          <Plus className="h-4 w-4" />
          ADD EVENT
        </Button>
      </div>
      
      {/* Scheduler container */}
      <div 
        ref={containerRef} 
        className="bryntum-scheduler-container flex-1"
        style={{ 
          height: `calc(${height} - 60px)`,
          width,
          position: 'relative',
          overflow: 'hidden',
          isolation: 'isolate'
        }}
      />
    </div>
  );
}

export default BryntumSchedulerWrapper;
import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  Calendar, 
  Clock, 
  RotateCcw
} from 'lucide-react';

declare global {
  interface Window {
    bryntum: any;
  }
}

interface SimpleBryntumGanttProps {
  operations: any[];
  resources: any[];
  onOperationMove?: (operationId: number, newResourceId: number, newStartTime: Date, newEndTime: Date) => Promise<void>;
  className?: string;
}

export function SimpleBryntumGantt({ 
  operations, 
  resources, 
  onOperationMove, 
  className = '' 
}: SimpleBryntumGanttProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<any>(null);
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 10;

  // Add logging to track when component receives data
  useEffect(() => {
    console.log('SimpleBryntumGantt: Component mounted/updated with:', {
      operationsCount: operations?.length || 0,
      resourcesCount: resources?.length || 0,
      isInitialized,
      hasContainer: !!containerRef.current
    });
    
    // Check for Bryntum availability on mount
    console.log('Checking for Bryntum on window:', {
      hasBryntum: !!(window as any).bryntum,
      hasBryntumGantt: !!(window as any).bryntum?.gantt,
      windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('bryntum') || k.toLowerCase().includes('gantt'))
    });
  }, [operations, resources, isInitialized]);

  // Initialize Bryntum Gantt
  useEffect(() => {
    console.log('SimpleBryntumGantt: useEffect triggered - checking initialization conditions:', {
      hasContainer: !!containerRef.current,
      isInitialized,
      hasOperations: !!(operations && operations.length > 0),
      hasResources: !!(resources && resources.length > 0)
    });
    
    if (isInitialized) {
      console.log('SimpleBryntumGantt: Already initialized, skipping');
      return;
    }
    
    // Verify we have data before trying to initialize
    if (!operations || operations.length === 0 || !resources || resources.length === 0) {
      console.log('SimpleBryntumGantt: Waiting for data...', { 
        operations: operations?.length, 
        resources: resources?.length,
        operationsType: typeof operations,
        resourcesType: typeof resources,
        operationsArray: Array.isArray(operations),
        resourcesArray: Array.isArray(resources)
      });
      setIsLoading(false); // Don't keep showing loading if we're just waiting for data
      return;
    }

    const initializeGantt = async () => {
      if (!containerRef.current) {
        console.log('SimpleBryntumGantt: Container not ready, waiting...');
        // Don't retry here - let the effect handle it
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Access Bryntum from window
        const bryntum = (window as any).bryntum;
        
        // Wait for Bryntum to be fully loaded
        if (!bryntum || !bryntum.gantt) {
          if (retryCount < MAX_RETRIES) {
            console.warn(`Bryntum Gantt not available, retry ${retryCount + 1}/${MAX_RETRIES}...`, {
              hasBryntum: !!bryntum,
              hasGantt: !!bryntum?.gantt,
              bryntumType: typeof bryntum
            });
            
            setRetryCount(prev => prev + 1);
            setTimeout(initializeGantt, 500); // Retry after 500ms
            return;
          } else {
            console.error('Failed to load Bryntum after maximum retries');
            setIsLoading(false);
            return;
          }
        }
        
        const bryntumGantt = bryntum.gantt;

        console.log('SimpleBryntumGantt: Checking Bryntum structure:', {
          bryntumKeys: Object.keys(bryntum),
          ganttKeys: Object.keys(bryntumGantt),
          operations: operations.length, 
          resources: resources.length
        });
        
        console.log('Raw operations data:', operations);
        console.log('Raw resources data:', resources);

        // The Gantt class should be directly on bryntum.gantt
        const Gantt = bryntumGantt.Gantt;
        
        console.log('Gantt constructor found:', !!Gantt);
        console.log('Gantt type:', typeof Gantt);
        
        // For now, let's create a simple mock to test the rest of our code
        if (!Gantt) {
          console.error('Could not find Gantt constructor. Using fallback initialization.');
          
          // Create a simple Gantt display using native DOM
          const container = containerRef.current;
          if (!container) return;
          
          // Clear container
          container.innerHTML = '';
          
          // Create a simple Gantt visualization
          const ganttContainer = document.createElement('div');
          ganttContainer.className = 'bryntum-gantt-container';
          ganttContainer.style.height = '100%';
          ganttContainer.style.position = 'relative';
          ganttContainer.style.overflow = 'auto';
          ganttContainer.innerHTML = `
            <div style="padding: 20px; color: white;">
              <h3>Production Schedule</h3>
              <p>Operations: ${operations.length}</p>
              <p>Resources: ${resources.length}</p>
              <div style="margin-top: 20px;">
                ${operations.map(op => `
                  <div style="margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 4px;">
                    <strong>${op.operationName}</strong><br/>
                    Resource: ${resources.find(r => r.id === op.workCenterId)?.name || 'Unknown'}<br/>
                    Start: ${new Date(op.startTime).toLocaleString()}<br/>
                    End: ${new Date(op.endTime).toLocaleString()}
                  </div>
                `).join('')}
              </div>
            </div>
          `;
          container.appendChild(ganttContainer);
          
          setIsInitialized(true);
          setIsLoading(false);
          return;
        }

        // Transform operations to Bryntum task format
        const tasks = operations.map((op, index) => {
          console.log(`Processing operation ${index + 1}:`, op);
          
          const startDate = new Date(op.startTime);
          const endDate = new Date(op.endTime);
          
          console.log(`Operation ${op.id} dates:`, {
            startTime: op.startTime,
            endTime: op.endTime,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            isValidStart: !isNaN(startDate.getTime()),
            isValidEnd: !isNaN(endDate.getTime())
          });
          
          const task = {
            id: op.id,
            name: op.operationName || `Operation ${op.id}`,
            startDate: startDate,
            endDate: endDate,
            duration: Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))), // Calculate duration in minutes
            durationUnit: 'minute',
            percentDone: op.completionPercentage || 0,
            cls: `status-${op.status || 'scheduled'}`,
            // Resource assignment
            resourceId: op.workCenterId,
            // Custom data
            productionOrderId: op.productionOrderId,
            status: op.status || 'scheduled',
            priority: op.priority || 5
          };
          console.log(`Created task ${index + 1}:`, task);
          return task;
        });

        console.log('All tasks created:', tasks);
        console.log('Tasks summary:', tasks.map(t => ({ id: t.id, name: t.name, start: t.startDate, end: t.endDate, resource: t.resourceId })));

        // Transform resources to Bryntum format
        const bryntumResources = resources.map(res => ({
          id: res.id,
          name: res.name,
          type: res.type
        }));

        console.log('Bryntum resources:', bryntumResources);
        console.log('Resources summary:', bryntumResources.map(r => ({ id: r.id, name: r.name })));

        // Create assignments
        const assignments = tasks.map(task => ({
          id: `${task.id}-${task.resourceId}`,
          event: task.id,
          resource: task.resourceId
        }));

        console.log('Task-Resource assignments:', assignments);

        // Create tasks with parent-child structure for resources
        const resourceTasks = bryntumResources.map(resource => ({
          id: `resource-${resource.id}`,
          name: resource.name,
          startDate: new Date('2025-08-06'),
          endDate: new Date('2025-08-10'),
          expanded: true,
          children: tasks.filter(t => t.resourceId === resource.id),
          cls: 'resource-parent',
          resourceId: resource.id,
          isResource: true,
          type: resource.type
        }));

        // Create Gantt with resource hierarchy
        const gantt = new Gantt({
          appendTo: containerRef.current,
          
          // Use hierarchical task structure
          project: {
            tasksData: resourceTasks,
            resourcesData: bryntumResources,
            assignmentsData: assignments
          },
          
          // Layout
          viewPreset: 'dayAndWeek',
          rowHeight: 50,
          barMargin: 5,
          
          // Columns for resource hierarchy view
          columns: [
            { 
              type: 'name', 
              field: 'name', 
              text: 'Resource / Task',
              width: 300,
              htmlEncode: false, // Allow HTML in renderer
              renderer: ({ record }: any) => {
                // Check if this is a resource parent row
                if (record.isResource) {
                  return `<strong>${record.name}</strong> <em style="font-size: 0.9em; opacity: 0.7;">(${record.type || 'Resource'})</em>`;
                }
                // Regular task
                return record.name;
              }
            },
            { 
              type: 'startdate',
              text: 'Start',
              width: 100
            },
            { 
              type: 'enddate',
              text: 'End',
              width: 100
            },
            { 
              type: 'duration',
              text: 'Duration',
              width: 80
            },
            {
              type: 'percentdone',
              text: 'Progress',
              width: 80
            }
          ],
          
          // Features for hierarchical resource view
          features: {
            taskDrag: {
              constrainDragToTimeline: false,
              showTooltip: true,
              validatorFn: ({ draggedRecords, newResource }: any) => {
                // Allow dragging tasks between resources
                return true;
              }
            },
            taskResize: {
              showTooltip: true
            },
            taskTooltip: {
              template: ({ taskRecord }: any) => `
                <div class="gantt-tooltip">
                  <h4>${taskRecord.name}</h4>
                  <p><strong>Status:</strong> ${taskRecord.status}</p>
                  <p><strong>Resource:</strong> ${taskRecord.resourceId}</p>
                  <p><strong>Duration:</strong> ${taskRecord.duration} ${taskRecord.durationUnit}</p>
                  <p><strong>Progress:</strong> ${taskRecord.percentDone}%</p>
                </div>
              `
            },
            dependencies: true,
            columnLines: true,
            progressLine: {
              disabled: false,
              statusDate: new Date()
            },
            // Resource histogram view
            resourceTimeRanges: false,
            nonWorkingTime: true,
            timeRanges: true
          },
          
          // Configure for resource scheduling
          resourceImagePath: '',
          showRollupTasks: false,
          enableEventAnimations: true,

          // Simple toolbar
          tbar: [
            {
              type: 'button',
              text: 'Previous',
              icon: 'b-fa-chevron-left',
              onAction: () => gantt.shiftPrevious()
            },
            {
              type: 'button', 
              text: 'Next',
              icon: 'b-fa-chevron-right',
              onAction: () => gantt.shiftNext()
            },
            {
              type: 'button',
              text: 'Today',
              icon: 'b-fa-calendar-day',
              onAction: () => gantt.scrollToDate(new Date(), { block: 'center' })
            },
            '|',
            {
              type: 'button',
              text: 'Zoom In',
              icon: 'b-fa-search-plus',
              onAction: () => gantt.zoomIn()
            },
            {
              type: 'button',
              text: 'Zoom Out',
              icon: 'b-fa-search-minus', 
              onAction: () => gantt.zoomOut()
            },
            '->',
            {
              type: 'button',
              text: 'Fit to Data',
              icon: 'b-fa-expand-arrows-alt',
              onAction: () => gantt.zoomToFit()
            }
          ],

          // Event listeners
          listeners: {
            beforeTaskDrop: async ({ context }: any) => {
              if (!onOperationMove) return true;

              const { draggedRecords, newResource, startDate } = context;
              
              try {
                for (const task of draggedRecords) {
                  const endDate = new Date(startDate);
                  endDate.setMinutes(endDate.getMinutes() + task.duration);
                  
                  await onOperationMove(
                    task.id,
                    newResource?.id || task.resourceId,
                    startDate,
                    endDate
                  );
                }
                
                toast({
                  title: "Success",
                  description: "Operation rescheduled successfully"
                });
                return true;
              } catch (error) {
                toast({
                  title: "Error", 
                  description: "Failed to reschedule operation",
                  variant: "destructive"
                });
                return false;
              }
            }
          }
        });

        ganttRef.current = gantt;
        setIsInitialized(true);
        setIsLoading(false);

        console.log('SimpleBryntumGantt: Initialized with', tasks.length, 'operations and', bryntumResources.length, 'resources');

      } catch (error) {
        console.error('Error initializing Bryntum Gantt:', error);
        setIsLoading(false);
        
        // Try to provide more specific error information
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Detailed error:', errorMsg);
        
        toast({
          title: "Gantt Loading Error",
          description: `Failed to initialize: ${errorMsg}`,
          variant: "destructive"
        });
      }
    };

    // Wait for container to be available in the DOM
    let containerCheckCount = 0;
    const MAX_CONTAINER_CHECKS = 20;
    
    const checkContainerAndInit = () => {
      if (!containerRef.current) {
        containerCheckCount++;
        if (containerCheckCount < MAX_CONTAINER_CHECKS) {
          console.log(`SimpleBryntumGantt: Container not ready, check ${containerCheckCount}/${MAX_CONTAINER_CHECKS}...`);
          setTimeout(checkContainerAndInit, 100);
        } else {
          console.error('SimpleBryntumGantt: Container never became ready after maximum checks');
          setIsLoading(false);
        }
        return;
      }
      
      console.log('SimpleBryntumGantt: Container ready, initializing...');
      initializeGantt();
    };

    // Start the initialization process
    setTimeout(checkContainerAndInit, 50);

    return () => {
      if (ganttRef.current) {
        try {
          ganttRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying Gantt:', e);
        }
        ganttRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [operations, resources, onOperationMove]);

  // Apply theme and update CSS link
  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const linkElement = document.getElementById('bryntum-theme') as HTMLLinkElement;
      
      // Update CSS file
      if (linkElement) {
        linkElement.href = isDark ? '/gantt.classic-dark.css' : '/gantt.classic-light.css';
        console.log('Updated Bryntum CSS to:', isDark ? 'dark' : 'light');
      }
      
      // Update Gantt element classes
      if (ganttRef.current && ganttRef.current.element) {
        const ganttElement = ganttRef.current.element;
        if (isDark) {
          ganttElement.classList.add('b-theme-classic-dark');
          ganttElement.classList.remove('b-theme-classic-light');
        } else {
          ganttElement.classList.add('b-theme-classic-light');
          ganttElement.classList.remove('b-theme-classic-dark');
        }
      }
    };
    
    // Initial update
    updateTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(() => updateTheme());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, [isInitialized]);

  // Always render the container, but show loading overlay when needed
  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">Production Schedule - Gantt View</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1">
              <Clock className="w-4 h-4 mr-1" />
              {operations?.length || 0} Operations
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {resources?.length || 0} Resources
            </Badge>
            <Badge className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              Bryntum Professional
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={containerRef} 
          id="bryntum-gantt-container"
          className="bryntum-gantt-container"
          style={{ 
            height: 'calc(100vh - 250px)',
            minHeight: '600px',
            width: '100%',
            position: 'relative'
          }}
        >
          {/* Show loading overlay if still loading */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading Gantt Chart...</p>
              </div>
            </div>
          )}
          
          {/* Show data status if no data */}
          {!isLoading && (!operations || operations.length === 0 || !resources || resources.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">
                Waiting for data... Operations: {operations?.length || 0}, Resources: {resources?.length || 0}
              </p>
            </div>
          )}
          
          {/* Bryntum Gantt will be rendered here */}
        </div>
      </CardContent>
    </Card>
  );
}
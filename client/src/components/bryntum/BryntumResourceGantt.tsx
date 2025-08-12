import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface BryntumResourceGanttProps {
  operations: any[];
  resources: any[];
  onOperationMove?: (operationId: number, newResourceId: number, newStartTime: Date, newEndTime: Date) => Promise<void>;
  className?: string;
}

export function BryntumResourceGantt({ 
  operations, 
  resources, 
  onOperationMove, 
  className = '' 
}: BryntumResourceGanttProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let ganttInstance: any = null;

    const initGantt = async () => {
      console.log('BryntumResourceGantt: Starting initialization...');
      
      // Wait for Bryntum to be available
      let attempts = 0;
      while (!window.bryntum && attempts < 20) {
        console.log(`BryntumResourceGantt: Waiting for Bryntum... attempt ${attempts + 1}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.bryntum) {
        console.error('BryntumResourceGantt: Bryntum library failed to load');
        setError('Bryntum library failed to load');
        setIsLoading(false);
        return;
      }

      // Try to access Gantt in different ways to avoid the Helpers.constructor error
      let GanttClass;
      try {
        // Method 1: Try direct access
        if (window.bryntum.gantt && window.bryntum.gantt.Gantt) {
          GanttClass = window.bryntum.gantt.Gantt;
          console.log('Found Gantt via window.bryntum.gantt.Gantt');
        }
      } catch (e) {
        console.log('Method 1 failed:', e);
      }

      if (!GanttClass) {
        console.error('Could not find Gantt class');
        setError('Could not initialize Gantt component');
        setIsLoading(false);
        return;
      }

      if (!mounted || !containerRef.current) return;

      try {
        console.log('Creating Gantt with resource view...');
        
        // Convert data to Bryntum format
        const ganttResources = resources.map(r => ({
          id: r.id,
          name: r.name,
          type: r.type || 'Standard'
        }));

        const ganttTasks = operations.map(op => ({
          id: op.id,
          name: op.name || op.operationName || `Operation ${op.id}`,
          startDate: op.startTime || new Date().toISOString(),
          endDate: op.endTime || new Date(Date.now() + 3600000).toISOString(),
          // Ensure task is draggable
          draggable: true,
          resizable: true,
          // Add resource assignment
          resourceId: op.assignedResourceId || op.workCenterId
        }));

        // Try to create instance with wrapped initialization to catch errors
        try {
          // Use a factory method approach to avoid direct constructor issues
          const config = {
            appendTo: containerRef.current,
            height: 500,
            
            // Configure columns for resource view
            columns: [
              { type: 'name', field: 'name', text: 'Resource/Task', width: 250, tree: true }
            ],
            
            // View preset for proper timeline
            viewPreset: 'hourAndDay',
            
            // Enable drag-drop features - but carefully to avoid errors
            features: {
              taskDrag: {
                disabled: false,
                showTooltip: true,
                constrainDragToResource: false
              },
              taskResize: {
                disabled: false,
                showTooltip: true
              },
              taskEdit: false, // Disable for now to avoid errors
              // Disable features that might cause issues
              percentDone: false,
              progressLine: false,
              dependencies: false,
              dependencyEdit: false
            },
            
            // Resource-based view configuration
            resourceImagePath: null,
            
            // Set up project model with resources
            project: {
              // Inline data
              resourcesData: ganttResources,
              eventsData: ganttTasks,
              
              // Resource assignment mode
              resourceTimeRanges: false,
              
              // Disable auto sync
              autoSync: false,
              autoLoad: false
            },
            
            // Event listeners for drag-drop
            listeners: {
              beforeTaskDrag: ({ taskRecords, context }) => {
                console.log('Task drag started:', taskRecords[0]?.name);
                return true; // Allow drag
              },
              
              taskDrop: async ({ taskRecords, targetResource, context }) => {
                console.log('Task dropped:', {
                  task: taskRecords[0]?.name,
                  resource: targetResource?.name
                });
                
                if (!onOperationMove || !taskRecords[0]) return;
                
                const task = taskRecords[0];
                const newResourceId = targetResource?.id || task.resourceId;
                
                try {
                  await onOperationMove(
                    task.id,
                    newResourceId,
                    new Date(task.startDate),
                    new Date(task.endDate)
                  );
                  console.log('Operation move successful');
                } catch (error) {
                  console.error('Failed to move operation:', error);
                  // Revert the change
                  task.setStartEndDate(task.originalData.startDate, task.originalData.endDate);
                  task.resourceId = task.originalData.resourceId;
                }
              },
              
              taskResizeEnd: async ({ taskRecord, context }) => {
                console.log('Task resized:', taskRecord.name);
                
                if (!onOperationMove) return;
                
                try {
                  await onOperationMove(
                    taskRecord.id,
                    taskRecord.resourceId,
                    new Date(taskRecord.startDate),
                    new Date(taskRecord.endDate)
                  );
                  console.log('Operation resize successful');
                } catch (error) {
                  console.error('Failed to resize operation:', error);
                  // Revert
                  taskRecord.setStartEndDate(
                    taskRecord.originalData.startDate,
                    taskRecord.originalData.endDate
                  );
                }
              }
            }
          };
          
          console.log('Attempting to create Gantt with config:', config);
          
          // Try creating the instance
          ganttInstance = new GanttClass(config);
          
          console.log('Gantt instance created successfully');
          ganttRef.current = ganttInstance;
          setIsLoading(false);
          
        } catch (innerError: any) {
          console.error('Failed to create Gantt instance:', innerError);
          console.error('Error details:', innerError.message, innerError.stack);
          
          // If Bryntum fails, show error
          setError(`Bryntum initialization failed: ${innerError.message}`);
          setIsLoading(false);
        }
        
      } catch (error: any) {
        console.error('Error in Gantt setup:', error);
        setError(error.message || 'Failed to initialize Gantt');
        setIsLoading(false);
      }
    };

    initGantt();

    return () => {
      mounted = false;
      if (ganttInstance) {
        try {
          ganttInstance.destroy();
        } catch (e) {
          console.error('Error destroying Gantt:', e);
        }
      }
    };
  }, [operations, resources, onOperationMove]);

  return (
    <Card className={className}>
      <CardContent className="p-4">
        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600 font-medium">Gantt Initialization Error</p>
            <p className="text-sm text-red-500 mt-1">{error}</p>
            <p className="text-xs text-gray-600 mt-2">
              The Bryntum library encountered an issue. Using fallback visualization.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-[500px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Initializing Bryntum Gantt...</p>
            </div>
          </div>
        ) : (
          <div ref={containerRef} className="bryntum-gantt-container" />
        )}
      </CardContent>
    </Card>
  );
}
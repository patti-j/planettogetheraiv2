import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface BryntumGanttWrapperProps {
  operations: any[];
  resources: any[];
  onOperationMove?: (operationId: number, newResourceId: number, newStartTime: Date, newEndTime: Date) => Promise<void>;
  className?: string;
}

export function BryntumGanttWrapper({ 
  operations, 
  resources, 
  onOperationMove, 
  className = '' 
}: BryntumGanttWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let ganttInstance: any = null;

    const initGantt = async () => {
      // Wait for Bryntum to be available
      let attempts = 0;
      while (!window.bryntum && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.bryntum) {
        setError('Bryntum library failed to load');
        setIsLoading(false);
        return;
      }

      // Access the Gantt constructor directly from window.bryntum.gantt
      const { Gantt } = window.bryntum.gantt || {};
      
      if (!Gantt) {
        setError('Gantt component not found in Bryntum library');
        setIsLoading(false);
        return;
      }

      if (!mounted || !containerRef.current) return;

      try {
        // Convert our data to Bryntum format
        const ganttResources = resources.map(r => ({
          id: r.id,
          name: r.name,
          type: r.type
        }));

        const ganttTasks = operations.map(op => ({
          id: op.id,
          name: op.name || op.operationName,
          startDate: op.startTime,
          endDate: op.endTime,
          resourceId: op.assignedResourceId || op.workCenterId,
          // Add status class for styling
          cls: `status-${op.status || 'scheduled'}`,
          status: op.status,
          // Store original data for reference
          originalData: op
        }));

        // Create the Gantt instance with minimal configuration
        ganttInstance = new Gantt({
          appendTo: containerRef.current,
          
          // Use resource view
          viewPreset: 'weekAndDayLetter',
          
          // Define columns for the left grid
          columns: [
            { 
              type: 'resourceInfo',
              text: 'Resources',
              width: 200,
              field: 'name'
            }
          ],

          // Configure features - disable those not in trial
          features: {
            // Core features that should work in trial
            cellEdit: false,
            taskEdit: {
              disabled: false,
              items: {
                generalTab: {
                  items: {
                    // Only show basic fields
                    nameField: true,
                    startDateField: true,
                    endDateField: true,
                    resourceField: true
                  }
                }
              }
            },
            taskDrag: true,
            taskResize: true,
            
            // Disable features not available in trial
            percentDone: false,
            progressLine: false,
            dependencies: false,
            dependencyEdit: false,
            baselines: false,
            criticalPaths: false,
            rollups: false,
            summary: false
          },

          // Set up the project with inline data
          project: {
            resourcesData: ganttResources,
            tasksData: ganttTasks,
            
            // Disable auto-sync to prevent errors
            autoSync: false,
            autoLoad: false
          },

          // Height of the component
          height: 500,

          // Resource histogram configuration
          resourceUtilization: {
            disabled: true  // Disable if causing issues
          },

          // Listen to task changes
          listeners: {
            taskDrop: async ({ taskRecords, newResource }) => {
              if (!onOperationMove) return;
              
              const task = taskRecords[0];
              if (task) {
                try {
                  await onOperationMove(
                    task.id,
                    newResource.id,
                    new Date(task.startDate),
                    new Date(task.endDate)
                  );
                } catch (error) {
                  console.error('Failed to move operation:', error);
                  // Revert the change
                  task.resourceId = task.originalData.assignedResourceId;
                }
              }
            },

            taskResizeEnd: async ({ taskRecord }) => {
              if (!onOperationMove) return;
              
              try {
                await onOperationMove(
                  taskRecord.id,
                  taskRecord.resourceId,
                  new Date(taskRecord.startDate),
                  new Date(taskRecord.endDate)
                );
              } catch (error) {
                console.error('Failed to resize operation:', error);
              }
            }
          }
        });

        ganttRef.current = ganttInstance;
        setIsLoading(false);
        setError(null);

      } catch (err) {
        console.error('Error creating Gantt:', err);
        setError(`Failed to initialize Gantt: ${err.message}`);
        setIsLoading(false);
      }
    };

    initGantt();

    // Cleanup
    return () => {
      mounted = false;
      if (ganttRef.current) {
        try {
          ganttRef.current.destroy();
        } catch (e) {
          console.error('Error destroying Gantt:', e);
        }
        ganttRef.current = null;
      }
    };
  }, [operations, resources, onOperationMove]);

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-[500px]">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading Gantt chart</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-[500px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading Gantt chart...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <style>{`
        /* Status-based styling */
        .b-gantt-task.status-completed {
          background-color: #22c55e !important;
        }
        .b-gantt-task.status-in-progress {
          background-color: #3b82f6 !important;
        }
        .b-gantt-task.status-scheduled {
          background-color: #9ca3af !important;
        }
        .b-gantt-task.status-delayed {
          background-color: #ef4444 !important;
        }
        
        /* Hide features not available in trial */
        .b-task-percent-bar,
        .b-task-percent-text,
        .b-dependency-arrow {
          display: none !important;
        }
      `}</style>
      <div className={className}>
        <div ref={containerRef} className="bryntum-gantt-container" />
      </div>
    </>
  );
}
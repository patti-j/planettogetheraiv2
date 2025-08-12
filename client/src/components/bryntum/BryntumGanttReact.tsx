import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ganttConfig, formatGanttData } from './GanttConfig';

interface BryntumGanttReactProps {
  operations: any[];
  resources: any[];
  onOperationMove?: (operationId: number, newResourceId: number, newStartTime: Date, newEndTime: Date) => Promise<void>;
  className?: string;
}

export function BryntumGanttReact({ 
  operations, 
  resources, 
  onOperationMove, 
  className = '' 
}: BryntumGanttReactProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<any>(null);

  useEffect(() => {
    // Cleanup function
    const cleanup = () => {
      if (ganttRef.current) {
        try {
          console.log('Cleaning up Gantt instance');
          ganttRef.current.destroy();
          ganttRef.current = null;
        } catch (e) {
          console.error('Error destroying Gantt:', e);
        }
      }
    };

    // Initialize Gantt
    const initializeGantt = async () => {
      // Wait for Bryntum to be available
      let attempts = 0;
      while (!window.bryntum?.gantt?.Gantt && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.bryntum?.gantt?.Gantt) {
        console.error('Bryntum Gantt library not found');
        return;
      }

      if (!containerRef.current) {
        console.error('Container ref not available');
        return;
      }

      // Clean up any existing instance
      cleanup();

      try {
        const Gantt = window.bryntum.gantt.Gantt;
        
        // Format data according to Bryntum structure
        const { resources: formattedResources, tasks: formattedTasks, assignments: formattedAssignments } = 
          formatGanttData(operations, resources);
        
        console.log('Creating Gantt with data:', {
          resourceCount: formattedResources.rows.length,
          taskCount: formattedTasks.rows.length,
          assignmentCount: formattedAssignments.rows.length
        });

        // Create the Gantt instance in resource scheduling mode
        const gantt = new Gantt({
          appendTo: containerRef.current,
          height: 500,
          
          // Use configuration from ganttConfig
          ...ganttConfig,
          
          // Configure for resource-based scheduling view
          // Resources appear as rows, operations as timeline events
          showRollupTasks: false,
          scheduleByConstraints: false,
          
          // Override project with our data
          project: {
            ...ganttConfig.project,
            // Load inline data
            resources: formattedResources.rows,
            tasks: formattedTasks.rows,
            assignments: formattedAssignments.rows,
            
            // Configure stores for resource-based view
            taskStore: {
              transformFlatData: true
            }
          },
          
          // Event listeners
          listeners: {
            // Task drag events
            beforeTaskDrag: ({ taskRecords }) => {
              console.log('Starting drag for task:', taskRecords[0]?.name);
              return true; // Allow drag
            },
            
            afterTaskDrop: async ({ taskRecords, valid }) => {
              if (!valid || !taskRecords[0] || !onOperationMove) return;
              
              const task = taskRecords[0];
              console.log('Task dropped:', {
                id: task.id,
                name: task.name,
                startDate: task.startDate,
                endDate: task.endDate,
                resourceId: task.resourceId
              });
              
              // Find the assigned resource
              const assignment = task.assignments?.[0];
              const newResourceId = assignment?.resourceId || task.resourceId;
              
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
                // TODO: Revert the change
              }
            },
            
            // Task resize events
            taskResizeEnd: async ({ taskRecord, valid }) => {
              if (!valid || !onOperationMove) return;
              
              console.log('Task resized:', {
                id: taskRecord.id,
                name: taskRecord.name,
                startDate: taskRecord.startDate,
                endDate: taskRecord.endDate
              });
              
              const assignment = taskRecord.assignments?.[0];
              const resourceId = assignment?.resourceId || taskRecord.resourceId;
              
              try {
                await onOperationMove(
                  taskRecord.id,
                  resourceId,
                  new Date(taskRecord.startDate),
                  new Date(taskRecord.endDate)
                );
                console.log('Operation resize successful');
              } catch (error) {
                console.error('Failed to resize operation:', error);
              }
            }
          }
        });

        ganttRef.current = gantt;
        console.log('Gantt instance created successfully');
        
      } catch (error: any) {
        console.error('Failed to create Gantt:', error);
        console.error('Error details:', error.message, error.stack);
      }
    };

    // Initialize the Gantt
    initializeGantt();

    // Cleanup on unmount
    return cleanup;
  }, [operations, resources, onOperationMove]);

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div ref={containerRef} className="bryntum-gantt-container" />
      </CardContent>
    </Card>
  );
}
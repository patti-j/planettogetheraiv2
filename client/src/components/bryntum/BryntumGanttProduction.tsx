import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

declare global {
  interface Window {
    bryntum: any;
  }
}

interface BryntumGanttProductionProps {
  operations: any[];
  resources: any[];
  onOperationMove?: (operationId: number, newResourceId: number, newStartTime: Date, newEndTime: Date) => Promise<void>;
  className?: string;
}

export function BryntumGanttProduction({ 
  operations, 
  resources, 
  onOperationMove, 
  className = '' 
}: BryntumGanttProductionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<any>(null);

  useEffect(() => {
    // Clean up any existing instance
    if (ganttRef.current) {
      ganttRef.current.destroy();
      ganttRef.current = null;
    }

    // Check for container and data
    if (!containerRef.current) {
      return;
    }
    
    if (!operations?.length || !resources?.length) {
      return;
    }

    // Check if Bryntum is available
    const bryntumGantt = window.bryntum?.gantt;
    const Gantt = bryntumGantt?.Gantt;
    
    if (!Gantt) {
      console.error('Bryntum Gantt not available');
      return;
    }

    try {
        // Group operations by resource
        const tasksByResource: any[] = [];
        const resourceMap = new Map();
        
        // Create parent tasks for each resource
        resources.forEach((resource, index) => {
          // Add icon based on resource type
          const typeIcon = resource.type?.toLowerCase() === 'equipment' ? '⚙️' : 
                          resource.type?.toLowerCase() === 'labor' ? '👷' :
                          resource.type?.toLowerCase() === 'tool' ? '🔧' : '📦';
          
          const resourceTask = {
            id: `resource-${resource.id}`,
            name: `${typeIcon} ${resource.name} (${resource.type || 'Resource'})`,
            expanded: true,
            children: [],
            manuallyScheduled: true,
            cls: 'resource-parent'
          };
          tasksByResource.push(resourceTask);
          resourceMap.set(resource.id, resourceTask);
        });
      
        // Add operations as children of their assigned resources
        operations.forEach((op) => {
          const resourceId = op.workCenterId || op.assignedResourceId || 1;
          const resourceTask = resourceMap.get(resourceId);
          
          if (resourceTask) {
            resourceTask.children.push({
              id: op.id,
              name: op.name || op.operationName || 'Operation',
              startDate: op.startTime || new Date(),
              duration: Math.max(1, Math.ceil((new Date(op.endTime).getTime() - new Date(op.startTime).getTime()) / (1000 * 60 * 60 * 24))),
              draggable: true,
              resizable: true
            });
          }
        });
      
        // Create Gantt with resource-oriented view
        const gantt = new Gantt({
          appendTo: containerRef.current,
          height: 500,
          
          // Enable available features in trial version
          features: {
            taskDrag: true,
            taskResize: true,
            taskEdit: false,
            cellEdit: false,
            timeRanges: false,
            rollups: false,
            baselines: false,
            progressLine: false,
            dependencies: false,
            percentDone: false
          },
        
        columns: [
          { type: 'name', field: 'name', text: 'Resource / Operation', width: 250, tree: true },
          { type: 'startdate', text: 'Start Date', width: 100 },
          { type: 'duration', text: 'Duration', width: 80 }
        ],
        
        subGridConfigs: {
          locked: {
            width: 450
          }
        },
        
        viewPreset: 'weekAndDayLetter',
        startDate: new Date('2025-08-01'),
        endDate: new Date('2025-08-31'),
        
        listeners: {
          beforeTaskDrag: ({ taskRecords }) => {
            // Only allow dragging of operations, not resource groups
            return taskRecords[0] && !taskRecords[0].id.toString().startsWith('resource-');
          },
          taskDrop: ({ taskRecords, targetDate }) => {
            if (onOperationMove && taskRecords[0] && !taskRecords[0].id.toString().startsWith('resource-')) {
              const task = taskRecords[0];
              const endDate = new Date(targetDate);
              endDate.setDate(endDate.getDate() + task.duration);
              
              // Find the parent resource ID
              const parentId = task.parent?.id;
              const resourceId = parentId ? parseInt(parentId.toString().replace('resource-', '')) : 1;
              
              onOperationMove(
                task.id,
                resourceId,
                targetDate,
                endDate
              );
            }
          },
          taskResizeEnd: ({ taskRecord, startDate, endDate }) => {
            if (onOperationMove && taskRecord && !taskRecord.id.toString().startsWith('resource-')) {
              // Find the parent resource ID
              const parentId = taskRecord.parent?.id;
              const resourceId = parentId ? parseInt(parentId.toString().replace('resource-', '')) : 1;
              
              onOperationMove(
                taskRecord.id,
                resourceId,
                startDate,
                endDate
              );
            }
          }
        },
        
        project: {
          tasks: tasksByResource,
          autoSync: false,
          validateResponse: false
        }
      });

      ganttRef.current = gantt;
      
      // Force refresh after creation
      setTimeout(() => {
        if (gantt && gantt.element) {
          gantt.refresh();
          gantt.element.style.display = 'block';
          gantt.element.style.visibility = 'visible';
          gantt.element.style.height = '500px';
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to create Gantt:', error instanceof Error ? error.message : error);
    }

    // Cleanup
    return () => {
      if (ganttRef.current) {
        ganttRef.current.destroy();
        ganttRef.current = null;
      }
    };
  }, [operations, resources, onOperationMove]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Production Schedule - Resource View</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {operations.length} operations scheduled across {resources.length} resources
        </p>
      </CardHeader>
      <CardContent className="p-4">
        <div 
          ref={containerRef} 
          className="bryntum-gantt-container"
          style={{ 
            height: '600px',
            width: '100%',
            position: 'relative',
            minHeight: '500px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}
        />
      </CardContent>
    </Card>
  );
}
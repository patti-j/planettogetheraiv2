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
      // Create Gantt with full features enabled
      const gantt = new Gantt({
        appendTo: containerRef.current,
        height: 500,
        width: '100%',
        
        // Enable all drag-drop features
        features: {
          taskDrag: true,
          taskDragCreate: true,
          taskResize: true,
          taskEdit: true,
          dependencies: true,
          dependencyEdit: true,
          percentDone: true,
          progressLine: true,
          cellEdit: true,
          columnLines: true,
          rowLines: true,
        },
        
        columns: [
          { type: 'name', field: 'name', text: 'Task', width: 250, editor: true },
          { type: 'startdate', text: 'Start Date' },
          { type: 'duration', text: 'Duration' },
          { type: 'percentdone', text: 'Progress', width: 80 }
        ],
        
        listeners: {
          beforeTaskDrag: () => true,
          taskDrop: ({ taskRecords, targetDate }) => {
            if (onOperationMove && taskRecords[0]) {
              const task = taskRecords[0];
              const endDate = new Date(targetDate);
              endDate.setDate(endDate.getDate() + task.duration);
              onOperationMove(
                task.id,
                task.resourceId || 1,
                targetDate,
                endDate
              );
            }
          },
          taskResizeEnd: ({ taskRecord, startDate, endDate }) => {
            if (onOperationMove && taskRecord) {
              onOperationMove(
                taskRecord.id,
                taskRecord.resourceId || 1,
                startDate,
                endDate
              );
            }
          }
        },
        
        project: {
          tasks: operations.map((op, index) => ({
            id: op.id || index + 1,
            name: op.name || op.operationName || `Operation ${index + 1}`,
            startDate: op.startTime || new Date(),
            duration: op.duration || Math.ceil((new Date(op.endTime).getTime() - new Date(op.startTime).getTime()) / (1000 * 60 * 60 * 24)) || 1,
            percentDone: op.completionPercentage || 0,
            draggable: true,
            resizable: true,
            resourceId: op.workCenterId || op.assignedResourceId || 1
          }))
        }
      });

      ganttRef.current = gantt;
      
      // Force refresh after creation
      setTimeout(() => {
        if (gantt && gantt.element) {
          gantt.refresh();
          gantt.element.style.display = 'block';
          gantt.element.style.visibility = 'visible';
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to create Gantt:', error);
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
        <CardTitle>Production Schedule</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={containerRef} 
          style={{ 
            height: '600px',
            width: '100%',
            backgroundColor: '#f0f0f0'
          }}
        />
      </CardContent>
    </Card>
  );
}
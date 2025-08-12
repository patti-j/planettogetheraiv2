import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

declare global {
  interface Window {
    bryntum: any;
  }
}

interface BryntumGanttDebugProps {
  operations: any[];
  resources: any[];
  onOperationMove?: (operationId: number, newResourceId: number, newStartTime: Date, newEndTime: Date) => Promise<void>;
  className?: string;
}

// Component with VERY CLEAR debug name
export function BryntumGanttDebug({ 
  operations, 
  resources, 
  onOperationMove, 
  className = '' 
}: BryntumGanttDebugProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<any>(null);

  useEffect(() => {
    console.log('🔴 BryntumGanttDebug: Mounting with ops:', operations?.length, 'resources:', resources?.length);
    
    // Clean up any existing instance
    if (ganttRef.current) {
      ganttRef.current.destroy();
      ganttRef.current = null;
    }

    // Check for container and data
    if (!containerRef.current) {
      console.log('🔴 BryntumGanttDebug: No container');
      return;
    }
    
    if (!operations?.length || !resources?.length) {
      console.log('🔴 BryntumGanttDebug: No data');
      return;
    }

    // Check if Bryntum is available
    const bryntumGantt = window.bryntum?.gantt;
    const Gantt = bryntumGantt?.Gantt;
    
    if (!Gantt) {
      console.error('🔴 BryntumGanttDebug: Bryntum not available');
      return;
    }

    console.log('🔴 BryntumGanttDebug: Creating Gantt instance');

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
              // Handle task drop
            }
          },
          taskResizeEnd: ({ taskRecord, startDate, endDate }) => {
            if (onOperationMove && taskRecord) {
              // Handle task resize
            }
          }
        },
        
        project: {
          tasks: operations.map((op, index) => ({
            id: op.id || index + 1,
            name: op.name || `Operation ${index + 1}`,
            startDate: op.startTime || new Date(),
            duration: op.duration || 1,
            percentDone: op.completionPercentage || 0,
            draggable: true,
            resizable: true
          }))
        }
      });

      ganttRef.current = gantt;
      console.log('🔴 BryntumGanttDebug: Gantt created successfully');
      
      // Force refresh after creation
      setTimeout(() => {
        if (gantt && gantt.element) {
          gantt.refresh();
          gantt.element.style.display = 'block';
          gantt.element.style.visibility = 'visible';
        }
      }, 100);
      
    } catch (error) {
      console.error('🔴 BryntumGanttDebug: Failed to create Gantt', error);
    }

    // Cleanup
    return () => {
      console.log('🔴 BryntumGanttDebug: Unmounting');
      if (ganttRef.current) {
        ganttRef.current.destroy();
        ganttRef.current = null;
      }
    };
  }, [operations, resources, onOperationMove]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Production Schedule (DEBUG VERSION)</CardTitle>
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

// Add displayName to help with debugging
BryntumGanttDebug.displayName = 'BryntumGanttDebug';
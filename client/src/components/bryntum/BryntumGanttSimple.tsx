import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

declare global {
  interface Window {
    bryntum: any;
  }
}

interface BryntumGanttSimpleProps {
  operations: any[];
  resources: any[];
  onOperationMove?: (operationId: number, newResourceId: number, newStartTime: Date, newEndTime: Date) => Promise<void>;
  className?: string;
}

export function BryntumGanttSimple({ 
  operations, 
  resources, 
  onOperationMove, 
  className = '' 
}: BryntumGanttSimpleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<any>(null);
  const [instanceId] = useState(() => `gantt-${Date.now()}-${Math.random()}`);

  useEffect(() => {
    console.log(`BryntumGanttSimple[${instanceId}]: Starting initialization`);
    
    // Clean up ALL existing Gantt instances on the page
    if (window.bryntum?.gantt?.Gantt?.instances) {
      console.log(`BryntumGanttSimple[${instanceId}]: Found existing instances, destroying all`);
      window.bryntum.gantt.Gantt.instances.forEach((instance: any) => {
        try {
          instance.destroy();
        } catch (e) {
          console.log('Failed to destroy instance:', e);
        }
      });
    }
    
    // Clean up our specific instance
    if (ganttRef.current) {
      console.log(`BryntumGanttSimple[${instanceId}]: Cleaning up our instance`);
      ganttRef.current.destroy();
      ganttRef.current = null;
    }

    // Check for container and data
    if (!containerRef.current) {
      console.log('BryntumGanttSimple: No container ref');
      return;
    }
    
    if (!operations?.length || !resources?.length) {
      console.log('BryntumGanttSimple: No operations or resources', { 
        operationsCount: operations?.length || 0, 
        resourcesCount: resources?.length || 0 
      });
      return;
    }

    // Check if Bryntum is available
    const bryntumGantt = window.bryntum?.gantt;
    console.log('BryntumGanttSimple: Checking Bryntum', { 
      bryntum: !!window.bryntum, 
      gantt: !!bryntumGantt 
    });
    
    const Gantt = bryntumGantt?.Gantt;
    if (!Gantt) {
      console.error('BryntumGanttSimple: Bryntum Gantt constructor not found');
      return;
    }
    
    console.log('BryntumGanttSimple: Bryntum Gantt constructor found, proceeding with initialization');

    try {
      // Simple task data
      const tasks = operations.map(op => ({
        id: op.id,
        name: op.operationName || `Operation ${op.id}`,
        startDate: new Date(op.startTime),
        endDate: new Date(op.endTime),
        resourceId: op.workCenterId
      }));

      // Simple resource data
      const resourceData = resources.map(res => ({
        id: res.id,
        name: res.name
      }));
      
      console.log('BryntumGanttSimple: Creating Gantt with data', {
        tasksCount: tasks.length,
        resourcesCount: resourceData.length,
        container: containerRef.current
      });

      // Create Gantt with minimal configuration
      const gantt = new Gantt({
        appendTo: containerRef.current,
        
        // Data
        tasks: tasks,
        resources: resourceData,
        assignments: tasks.map(t => ({
          id: `${t.id}-${t.resourceId}`,
          event: t.id,
          resource: t.resourceId
        })),
        
        // Basic configuration
        viewPreset: 'weekAndDayLetter',
        rowHeight: 45,
        
        // Simple columns
        columns: [
          { type: 'name', field: 'name', text: 'Task', width: 250 },
          { type: 'startdate', text: 'Start', width: 100 },
          { type: 'duration', text: 'Duration', width: 100 }
        ],
        
        // Enable drag and drop
        features: {
          taskDrag: {
            disabled: false
          },
          taskResize: {
            disabled: false
          }
        },
        
        // Handle drag/drop events
        listeners: {
          taskDrop: async ({ taskRecords, targetStartDate, targetResourceRecord }) => {
            if (onOperationMove && taskRecords.length > 0) {
              const task = taskRecords[0];
              const endDate = new Date(targetStartDate);
              endDate.setTime(endDate.getTime() + (task.endDate - task.startDate));
              
              try {
                await onOperationMove(
                  task.id,
                  targetResourceRecord?.id || task.resourceId,
                  targetStartDate,
                  endDate
                );
              } catch (error) {
                console.error('Failed to move task:', error);
              }
            }
          }
        }
      });

      console.log('BryntumGanttSimple: Gantt instance created successfully', gantt);
      ganttRef.current = gantt;
    } catch (error) {
      console.error('BryntumGanttSimple: Failed to create Gantt', error);
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
            width: '100%'
          }}
        />
      </CardContent>
    </Card>
  );
}
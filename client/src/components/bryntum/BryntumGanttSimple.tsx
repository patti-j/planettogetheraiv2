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
    
    // Test that Bryntum is fully loaded
    console.log('Bryntum namespace:', {
      hasProjectModel: !!bryntumGantt.ProjectModel,
      hasTaskStore: !!bryntumGantt.TaskStore,
      hasGantt: !!Gantt
    });

    try {
      // Full featured configuration with drag-drop enabled
      const gantt = new Gantt({
        appendTo: containerRef.current,
        height: 500,
        width: '100%',
        
        // CRITICAL: Enable all features including drag-drop
        features: {
          taskDrag: true,           // Enable task dragging - THIS IS WHAT WAS MISSING!
          taskDragCreate: true,     // Create tasks by dragging
          taskResize: true,         // Resize tasks by dragging
          taskEdit: true,           // Double-click to edit
          dependencies: true,       // Show task dependencies
          dependencyEdit: true,     // Edit dependencies
          percentDone: true,        // Show progress
          progressLine: true,       // Show progress line
          cellEdit: true,          // Edit cells in grid
          columnLines: true,       // Show column lines
          rowLines: true,          // Show row lines
        },
        
        // Configure columns for the grid
        columns: [
          { type: 'name', field: 'name', text: 'Task', width: 250, editor: true },
          { type: 'startdate', text: 'Start Date' },
          { type: 'duration', text: 'Duration' },
          { type: 'percentdone', text: 'Progress', width: 80 }
        ],
        
        // Add event listeners to verify drag is working
        listeners: {
          beforeTaskDrag: ({ taskRecords }) => {
            console.log('🎯 DRAG STARTING! Task:', taskRecords[0]?.name);
            return true; // Allow drag
          },
          taskDrag: ({ context }) => {
            console.log('🎯 DRAGGING...', context);
          },
          taskDrop: ({ taskRecords, targetDate }) => {
            console.log('🎯 DROPPED! New date:', targetDate);
            // Here we would call onOperationMove to update backend
          },
          taskResizeEnd: ({ taskRecord, startDate, endDate }) => {
            console.log('🎯 RESIZED! New dates:', startDate, endDate);
          }
        },
        
        project: {
          tasks: [
            {
              id: 1,
              name: 'Test Task 1 - Try dragging me!',
              startDate: '2025-01-12',
              duration: 5,
              percentDone: 25,
              // IMPORTANT: Enable dragging on the task itself
              draggable: true,
              resizable: true
            },
            {
              id: 2,
              name: 'Test Task 2 - I can be dragged too!',
              startDate: '2025-01-19',
              duration: 3,
              percentDone: 50,
              draggable: true,
              resizable: true
            },
            {
              id: 3,
              name: 'Test Task 3 - Resize my edges!',
              startDate: '2025-01-15',
              duration: 4,
              percentDone: 75,
              draggable: true,
              resizable: true
            }
          ]
        }
      });

      console.log('BryntumGanttSimple: Gantt instance created successfully');
      console.log('Gantt instance id:', gantt?.id);
      console.log('Gantt element:', gantt?.element);
      console.log('Gantt is visible:', gantt?.isVisible);
      console.log('Gantt width:', gantt?.width);
      console.log('Gantt height:', gantt?.height);
      ganttRef.current = gantt;
      
      // Force render after a short delay
      setTimeout(() => {
        if (gantt && gantt.element) {
          gantt.refresh();
          console.log('Forced refresh - Gantt visible now?', gantt.isVisible);
          console.log('Gantt DOM element exists:', !!document.querySelector('.b-gantt'));
          console.log('Container children:', containerRef.current?.children.length);
          
          const ganttEl = document.querySelector('.b-gantt');
          if (ganttEl) {
            console.log('✅ Bryntum Gantt is in the DOM!');
            console.log('Gantt element bounds:', ganttEl.getBoundingClientRect());
          }
          
          // Make sure the Gantt is visible
          if (gantt.element) {
            gantt.element.style.display = 'block';
            gantt.element.style.visibility = 'visible';
          }
        }
      }, 100);
    } catch (error) {
      console.error('BryntumGanttSimple: Failed to create Gantt');
      console.error('Error message:', error?.message || 'Unknown error');
      console.error('Error stack:', error?.stack || 'No stack trace');
      console.error('Full error:', error);
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
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

    // Try to initialize Gantt with a delay to ensure library is loaded
    const initializeGantt = () => {
      console.log('Initializing Bryntum Gantt...');
      console.log('Window bryntum object:', window.bryntum);
      
      // Check what's available in bryntum
      if (window.bryntum) {
        console.log('Bryntum modules available:', Object.keys(window.bryntum));
        if (window.bryntum.gantt) {
          console.log('Gantt module available:', Object.keys(window.bryntum.gantt));
        }
      }
      
      // The UMD build exports everything under bryntum.gantt
      const GanttModule = window.bryntum?.gantt;
      if (!GanttModule) {
        console.error('Gantt module not found in window.bryntum');
        return;
      }
      
      // The Gantt class should be available in the module
      const Gantt = GanttModule.Gantt;
      console.log('Gantt class found:', !!Gantt);
    
    if (!Gantt) {
      console.error('Bryntum Gantt not available - check if the library is loaded');
      // Try to show what's available
      if (window.bryntum) {
        console.log('Available Bryntum modules:', Object.keys(window.bryntum));
      }
      // Show a message in the container
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div style="padding: 40px; text-align: center; color: #666;">
            <h3 style="margin-bottom: 10px;">Gantt Chart Loading...</h3>
            <p>The Bryntum Gantt library is being initialized.</p>
            <p style="font-size: 12px; margin-top: 20px;">If this message persists, please refresh the page.</p>
          </div>
        `;
      }
      return;
    }

    try {
        console.log('About to create Gantt instance...');
        
        // Create simple test data
        const testTasks = [
          {
            id: 1,
            name: 'Task 1',
            startDate: '2025-08-01',
            duration: 3,
            durationUnit: 'day'
          },
          {
            id: 2,
            name: 'Task 2',
            startDate: '2025-08-05',
            duration: 2,
            durationUnit: 'day'
          }
        ];
        
        console.log('Creating Gantt with test tasks:', testTasks);
        
        // Create the simplest possible Gantt configuration
        const gantt = new Gantt({
          appendTo: containerRef.current,
          height: 500,
          
          columns: [
            { type: 'name', field: 'name', text: 'Task', width: 250 }
          ],
          
          project: {
            tasks: testTasks
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
    };
    
    // Try to initialize immediately and also with a delay
    const tryInit = () => {
      if (window.bryntum) {
        initializeGantt();
      } else {
        console.log('Bryntum not available yet, retrying in 500ms...');
        setTimeout(tryInit, 500);
      }
    };
    
    tryInit();

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
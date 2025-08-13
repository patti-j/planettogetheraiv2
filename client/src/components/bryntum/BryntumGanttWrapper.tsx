import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatGanttData, ganttConfig } from './GanttConfig';

// Extend window type for Bryntum
declare global {
  interface Window {
    bryntum: any;
  }
}

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
      console.log('BryntumGanttWrapper: Starting initialization...');
      
      // Wait for Bryntum to be available
      let attempts = 0;
      while (!window.bryntum && attempts < 20) {
        console.log(`BryntumGanttWrapper: Waiting for Bryntum... attempt ${attempts + 1}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.bryntum) {
        console.error('BryntumGanttWrapper: Bryntum library failed to load after 20 attempts');
        setError('Bryntum library failed to load');
        setIsLoading(false);
        return;
      }

      console.log('BryntumGanttWrapper: window.bryntum found:', window.bryntum);
      
      // Try different ways to access the Gantt constructor
      let Gantt;
      
      // Method 1: Direct access
      if (window.bryntum && window.bryntum.gantt && window.bryntum.gantt.Gantt) {
        Gantt = window.bryntum.gantt.Gantt;
        console.log('BryntumGanttWrapper: Found Gantt via window.bryntum.gantt.Gantt');
      }
      // Method 2: Capital G for Gantt namespace
      else if (window.bryntum && window.bryntum.Gantt) {
        Gantt = window.bryntum.Gantt;
        console.log('BryntumGanttWrapper: Found Gantt via window.bryntum.Gantt');
      }
      // Method 3: Through widget namespace
      else if (window.bryntum && window.bryntum.widget && window.bryntum.widget.Gantt) {
        Gantt = window.bryntum.widget.Gantt;
        console.log('BryntumGanttWrapper: Found Gantt via window.bryntum.widget.Gantt');
      }
      
      if (!Gantt) {
        console.error('BryntumGanttWrapper: Gantt component not found in Bryntum library');
        console.log('Available Bryntum properties:', Object.keys(window.bryntum || {}));
        if (window.bryntum) {
          if (window.bryntum.gantt) {
            console.log('window.bryntum.gantt properties:', Object.keys(window.bryntum.gantt));
          }
          if (window.bryntum.widget) {
            console.log('window.bryntum.widget properties:', Object.keys(window.bryntum.widget));
          }
        }
        setError('Gantt component not found in Bryntum library');
        setIsLoading(false);
        return;
      }
      
      console.log('BryntumGanttWrapper: Gantt constructor found, proceeding with initialization...');

      if (!mounted || !containerRef.current) return;

      try {
        console.log('BryntumGanttWrapper: Container ref available:', !!containerRef.current);
        console.log('BryntumGanttWrapper: Resources:', resources.length, 'Operations:', operations.length);
        
        // Format data for resource-based scheduling view
        const formattedData = formatGanttData(operations, resources);
        console.log('BryntumGanttWrapper: Formatted data:', formattedData);
        
        // Calculate height based on number of resources
        // Minimum 400px, but expand to show all resources
        const rowHeight = ganttConfig.rowHeight || 70;
        const headerHeight = 100; // Header and toolbar
        const minHeight = 400;
        const calculatedHeight = Math.max(minHeight, (resources.length * rowHeight) + headerHeight);
        
        // Use the resource-based configuration from GanttConfig
        const config = {
          appendTo: containerRef.current,
          height: calculatedHeight,
          minHeight: minHeight,
          autoHeight: false, // Don't auto-expand beyond calculated height
          
          // Use resource-focused columns
          columns: ganttConfig.columns,
          
          // Use resource scheduling view preset
          viewPreset: ganttConfig.viewPreset || 'weekAndDay',
          barMargin: ganttConfig.barMargin || 5,
          rowHeight: rowHeight,
          
          // Configure features for resource scheduling
          features: {
            taskDrag: true,  // Enable drag for resource scheduling
            taskResize: true,  // Enable resize
            taskEdit: false,  // Disable edit dialog
            columnLines: true,
            percentDone: false,  // Trial limitation
            progressLine: false,  // Trial limitation
            dependencies: false  // Trial limitation
          },
          
          // Use formatted data
          tasks: formattedData.tasks.rows,
          resources: formattedData.resources.rows,
          assignments: formattedData.assignments.rows,
          
          // Project configuration for resource scheduling
          project: {
            autoLoad: false,
            autoSync: false
          },
          
          // Event handlers
          listeners: {
            taskDrop: ({ taskRecords, targetResource }) => {
              if (onOperationMove && taskRecords[0]) {
                const task = taskRecords[0];
                onOperationMove(
                  task.id,
                  targetResource?.id || task.resourceId,
                  new Date(task.startDate),
                  new Date(task.endDate)
                );
              }
            }
          }
        };
        
        console.log('BryntumGanttWrapper: Creating Gantt with config:', config);
        
        // Create the instance
        ganttInstance = new Gantt(config);

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
        <div 
          ref={containerRef} 
          className="bryntum-gantt-container"
          style={{ 
            height: `${Math.max(400, (resources.length * 70) + 100)}px`,
            minHeight: '400px',
            position: 'relative'
          }}
        />
      </div>
    </>
  );
}
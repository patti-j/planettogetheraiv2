import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatGanttData, ganttConfig } from './GanttConfig';

// Extend window type for Bryntum
declare global {
  interface Window {
    bryntum?: any;
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
      if (window.bryntum && (window.bryntum as any).gantt && (window.bryntum as any).gantt.Gantt) {
        Gantt = (window.bryntum as any).gantt.Gantt;
        console.log('BryntumGanttWrapper: Found Gantt via window.bryntum.gantt.Gantt');
      }
      // Method 2: Capital G for Gantt namespace
      else if (window.bryntum && (window.bryntum as any).Gantt) {
        Gantt = (window.bryntum as any).Gantt;
        console.log('BryntumGanttWrapper: Found Gantt via window.bryntum.Gantt');
      }
      // Method 3: Through widget namespace
      else if (window.bryntum && (window.bryntum as any).widget && (window.bryntum as any).widget.Gantt) {
        Gantt = (window.bryntum as any).widget.Gantt;
        console.log('BryntumGanttWrapper: Found Gantt via window.bryntum.widget.Gantt');
      }
      
      if (!Gantt) {
        console.error('BryntumGanttWrapper: Gantt component not found in Bryntum library');
        console.log('Available Bryntum properties:', Object.keys(window.bryntum || {}));
        if (window.bryntum) {
          if ((window.bryntum as any).gantt) {
            console.log('window.bryntum.gantt properties:', Object.keys((window.bryntum as any).gantt));
          }
          if ((window.bryntum as any).widget) {
            console.log('window.bryntum.widget properties:', Object.keys((window.bryntum as any).widget));
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
        
        // Fixed height to ensure all resources are visible
        // Set to 700px to guarantee all 3 resources are shown without scrolling
        const fixedHeight = 700;
        
        // Use the resource-based configuration from GanttConfig
        const config = {
          appendTo: containerRef.current,
          height: fixedHeight,
          minHeight: fixedHeight,
          autoHeight: false, // Don't auto-expand beyond calculated height
          
          // Use resource-focused columns
          columns: ganttConfig.columns,
          
          // Configure view preset with proper time units
          viewPreset: {
            base: 'weekAndDay',
            headers: [
              {
                unit: 'month',
                dateFormat: 'MMM YYYY'
              },
              {
                unit: 'week',
                dateFormat: 'DD MMM'
              }
            ],
            columnWidth: 50,
            shiftIncrement: 1,
            shiftUnit: 'month', // Make navigation buttons move by month
            timeResolution: {
              unit: 'day',
              increment: 1
            }
          },
          
          barMargin: ganttConfig.barMargin || 5,
          rowHeight: 80, // Use consistent row height
          
          // Configure features for resource scheduling
          features: {
            taskDrag: true,  // Enable drag for resource scheduling
            taskResize: true,  // Enable resize
            taskEdit: false,  // Disable edit dialog
            columnLines: true,
            percentDone: false,  // Trial limitation
            progressLine: false,  // Trial limitation
            dependencies: false,  // Trial limitation
            // Add navigation and zoom features
            timeRanges: true,
            eventTooltip: true,
            scheduleTooltip: true,
            zoomOnMouseWheel: true,
            zoomOnTimeAxisDoubleClick: true
          },
          
          // Configure toolbar with zoom controls
          tbar: {
            items: [
              {
                type: 'button',
                text: 'Previous Month',
                icon: 'b-icon-left',
                onClick: () => {
                  if (ganttRef.current) {
                    const startDate = new Date(ganttRef.current.startDate);
                    startDate.setMonth(startDate.getMonth() - 1);
                    const endDate = new Date(ganttRef.current.endDate);
                    endDate.setMonth(endDate.getMonth() - 1);
                    ganttRef.current.setTimeSpan(startDate, endDate);
                  }
                }
              },
              {
                type: 'button',
                text: 'Today',
                onClick: () => {
                  if (ganttRef.current) {
                    const today = new Date();
                    const start = new Date(today);
                    start.setDate(start.getDate() - 7);
                    const end = new Date(today);
                    end.setDate(end.getDate() + 30);
                    ganttRef.current.setTimeSpan(start, end);
                  }
                }
              },
              {
                type: 'button',
                text: 'Next Month',
                icon: 'b-icon-right',
                onClick: () => {
                  if (ganttRef.current) {
                    const startDate = new Date(ganttRef.current.startDate);
                    startDate.setMonth(startDate.getMonth() + 1);
                    const endDate = new Date(ganttRef.current.endDate);
                    endDate.setMonth(endDate.getMonth() + 1);
                    ganttRef.current.setTimeSpan(startDate, endDate);
                  }
                }
              },
              '|', // Separator
              {
                type: 'button',
                text: 'Zoom In',
                icon: 'b-icon-search-plus',
                onClick: () => {
                  if (ganttRef.current) {
                    ganttRef.current.zoomIn();
                  }
                }
              },
              {
                type: 'button',
                text: 'Zoom Out',
                icon: 'b-icon-search-minus',
                onClick: () => {
                  if (ganttRef.current) {
                    ganttRef.current.zoomOut();
                  }
                }
              },
              {
                type: 'button',
                text: 'Zoom to Fit',
                icon: 'b-icon-expand',
                onClick: () => {
                  if (ganttRef.current) {
                    ganttRef.current.zoomToFit();
                  }
                }
              }
            ]
          },
          
          // Use formatted data
          tasks: formattedData.tasks.rows,
          resources: formattedData.resources.rows,
          assignments: formattedData.assignments.rows,
          
          // Configure scrolling to show all resources
          scrollable: {
            // Disable vertical scrolling to show all resources
            overflowY: false
          },
          
          // Configure subgrid sizes
          subGridConfigs: {
            locked: {
              width: 250, // Resource column width
              scrollable: {
                overflowY: false // No vertical scroll in locked section
              }
            },
            normal: {
              scrollable: {
                overflowY: false // No vertical scroll in schedule section
              }
            }
          },
          
          // Set timeline date range
          startDate: new Date('2025-08-01'),
          endDate: new Date('2025-09-01'),
          
          // Configure zoom levels
          zoomLevels: [
            { 
              name: 'Days',
              tickWidth: 100,
              bottomHeader: { unit: 'day', dateFormat: 'DD' },
              topHeader: { unit: 'week', dateFormat: 'MMM DD' }
            },
            {
              name: 'Weeks', 
              tickWidth: 50,
              bottomHeader: { unit: 'week', dateFormat: 'DD MMM' },
              topHeader: { unit: 'month', dateFormat: 'MMM YYYY' }
            },
            {
              name: 'Months',
              tickWidth: 150,
              bottomHeader: { unit: 'month', dateFormat: 'MMM' },
              topHeader: { unit: 'year', dateFormat: 'YYYY' }
            }
          ],
          
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
        
        /* Ensure full height for Gantt viewport */
        .b-gantt-locked-grid,
        .b-gantt-normal-grid {
          height: 100% !important;
          max-height: none !important;
          overflow-y: visible !important;
        }
        
        /* Force vertical scroller to show all content */
        .b-gantt-vertical-scroller,
        .b-vertical-scroller {
          display: none !important;
        }
        
        /* Ensure grid body shows all rows */
        .b-gantt .b-grid-body-container,
        .b-grid-body-container {
          height: auto !important;
          min-height: 400px !important;
          transform: none !important;
        }
        
        /* Force viewport to expand */
        .b-grid-body-scrollable,
        .b-grid-scrollable {
          overflow-y: visible !important;
          height: auto !important;
        }
        
        /* Ensure rows container shows all resources */
        .b-grid-row-container {
          transform: none !important;
          position: relative !important;
        }
      `}</style>
      <div className={className}>
        <div 
          ref={containerRef} 
          className="bryntum-gantt-container"
          style={{ 
            height: '700px',
            minHeight: '700px',
            position: 'relative'
          }}
        />
      </div>
    </>
  );
}
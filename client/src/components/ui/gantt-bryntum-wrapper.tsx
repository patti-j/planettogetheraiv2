/**
 * Bryntum Gantt Wrapper Component
 * This component wraps the Bryntum Gantt with our application's data and styling
 */

import React, { useRef, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Dynamic import for Bryntum Gantt from local trial files
let BryntumGantt: any = null;

interface GanttBryntumWrapperProps {
  operations: any[];
  productionOrders: any[];
  resources: any[];
  rowHeight?: number;
  onOperationUpdate?: (operation: any) => Promise<void>;
  onOperationMove?: (operationId: number, newResourceId: number, newStartTime: Date) => Promise<void>;
  onExportReady?: (exportHandler: () => Promise<void>) => void;
}

export function GanttBryntumWrapper({
  operations,
  productionOrders,
  resources,
  rowHeight = 50,
  onOperationUpdate,
  onOperationMove,
  onExportReady
}: GanttBryntumWrapperProps) {
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstanceRef = useRef<any>(null);
  const { toast } = useToast();
  const [isReady, setIsReady] = useState(true); // Bryntum is available

  // Transform operations to Bryntum task format
  const transformToTasks = () => {
    return operations.map(op => {
      const order = productionOrders.find(o => o.id === op.productionOrderId);
      
      // Calculate duration in hours
      const duration = op.standardDuration || 
        (op.endTime && op.startTime ? 
          (new Date(op.endTime).getTime() - new Date(op.startTime).getTime()) / (1000 * 60 * 60) : 
          1);

      return {
        id: op.id,
        name: op.operationName,
        startDate: op.startTime || new Date(),
        duration: duration,
        durationUnit: 'hour',
        resourceId: op.workCenterId,
        percentDone: op.completionPercentage || 0,
        
        // Custom fields for our rendering
        workOrderNumber: order?.orderNumber || '',
        workOrderName: order?.name || '',
        status: op.status,
        priority: op.priority || 0,
        
        // Styling
        cls: `operation-status-${op.status}`,
        eventColor: getStatusColor(op.status),
        
        // Constraints
        manuallyScheduled: true, // Allow manual scheduling
        draggable: true,
        resizable: 'end', // Can resize from end only
      };
    });
  };

  // Transform resources for Bryntum
  const transformToResources = () => {
    return resources.map(res => ({
      id: res.id,
      name: res.name,
      // Custom fields
      type: res.type,
      capabilities: res.capabilities || [],
      status: res.status
    }));
  };

  // Get color based on status
  const getStatusColor = (status: string): string => {
    switch(status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'scheduled': return '#f59e0b';
      case 'waiting': return '#f59e0b';
      case 'ready': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Bryntum configuration
  const ganttConfig = {
    project: {
      tasks: transformToTasks(),
      resources: transformToResources(),
      calendar: 'general', // 24/7 calendar for manufacturing
    },

    // View configuration
    startDate: new Date(2025, 7, 1), // August 1, 2025
    endDate: new Date(2025, 8, 30), // September 30, 2025
    viewPreset: 'dayAndWeek',
    rowHeight: rowHeight,
    barMargin: 5,

    // Columns for the left grid
    columns: [
      { 
        type: 'name', 
        field: 'name', 
        text: 'Operation',
        width: 200,
        renderer: ({ record }: any) => {
          return `
            <div class="operation-name-cell">
              <div class="font-medium">${record.workOrderNumber}</div>
              <div class="text-sm text-muted-foreground">${record.name}</div>
            </div>
          `;
        }
      },
      {
        text: 'Status',
        field: 'status',
        width: 100,
        renderer: ({ value }: any) => {
          const colors: any = {
            completed: 'bg-green-100 text-green-800',
            in_progress: 'bg-blue-100 text-blue-800',
            scheduled: 'bg-orange-100 text-orange-800',
            waiting: 'bg-orange-100 text-orange-800',
            ready: 'bg-green-100 text-green-800',
          };
          return `<span class="px-2 py-1 rounded text-xs ${colors[value] || 'bg-gray-100'}">${value}</span>`;
        }
      },
      {
        text: 'Duration',
        field: 'duration',
        width: 80,
        align: 'center',
        renderer: ({ record }: any) => {
          return `${record.duration}h`;
        }
      },
      {
        text: 'Progress',
        type: 'percentdone',
        field: 'percentDone',
        width: 80,
        align: 'center'
      }
    ],

    // Features configuration
    features: {
      // Task editing
      taskEdit: {
        items: {
          generalTab: {
            items: {
              name: { label: 'Operation Name' },
              percentDone: { label: 'Progress %' },
              duration: { label: 'Duration (hours)' }
            }
          }
        }
      },

      // Drag and drop
      taskDrag: {
        showTooltip: true,
        constrainDragToTimeline: true
      },

      // Resize tasks
      taskResize: {
        showTooltip: true
      },

      // Dependencies
      dependencies: true,
      dependencyEdit: true,

      // Critical path
      criticalPath: {
        disabled: false
      },

      // Progress line showing current date
      progressLine: {
        disabled: false,
        statusDate: new Date()
      },

      // Context menu
      taskMenu: {
        items: {
          editTask: true,
          deleteTask: true,
          add: {
            text: 'Add',
            menu: {
              successor: { text: 'New successor' },
              predecessor: { text: 'New predecessor' }
            }
          }
        }
      },

      // Column lines in timeline
      columnLines: true,

      // Non-working time shading
      nonWorkingTime: {
        disabled: true // 24/7 manufacturing
      },

      // Labels on tasks
      labels: {
        left: {
          field: 'workOrderNumber',
          cls: 'font-medium'
        }
      },

      // Task tooltips
      taskTooltip: {
        template: ({ taskRecord }: any) => `
          <div class="p-2">
            <h4 class="font-bold">${taskRecord.name}</h4>
            <div>Work Order: ${taskRecord.workOrderNumber}</div>
            <div>Status: ${taskRecord.status}</div>
            <div>Progress: ${taskRecord.percentDone}%</div>
            <div>Duration: ${taskRecord.duration}h</div>
          </div>
        `
      },

      // Export
      pdfExport: {
        exportServer: undefined // Use client-side export
      },

      excelExporter: true,

      // Filtering
      filter: true,

      // Search
      search: true,

      // Undo/redo
      undo: true,

      // Time axis header menu
      timeAxisHeaderMenu: true,

      // Schedule tooltip
      scheduleTooltip: true
    },

    // Task renderer for custom appearance
    taskRenderer({ renderData, taskRecord }: any) {
      // Add custom classes based on status
      renderData.cls = `task-${taskRecord.status}`;
      
      // Custom HTML content for the task bar
      renderData.innerHTML = `
        <div class="task-content flex flex-col h-full justify-center px-2">
          <div class="font-medium text-white text-sm">${taskRecord.workOrderNumber}</div>
          <div class="text-xs text-white/90">${taskRecord.name}</div>
        </div>
      `;

      return renderData;
    },

    // Event listeners
    listeners: {
      // When a task is dropped to a new position
      afterTaskDrop: async ({ context }: any) => {
        const { newResource, draggedRecords, startDate } = context;
        
        for (const task of draggedRecords) {
          if (onOperationMove) {
            try {
              await onOperationMove(
                task.id,
                newResource?.id || task.resourceId,
                startDate || task.startDate
              );
              
              toast({
                title: "Operation Moved",
                description: `${task.name} has been rescheduled`,
              });
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to update operation",
                variant: "destructive"
              });
              
              // Revert the change
              context.valid = false;
            }
          }
        }
      },

      // When a task is resized
      afterTaskResize: async ({ taskRecord, startDate, endDate }: any) => {
        if (onOperationUpdate) {
          const duration = (endDate - startDate) / (1000 * 60 * 60); // Convert to hours
          
          try {
            await onOperationUpdate({
              id: taskRecord.id,
              startTime: startDate,
              endTime: endDate,
              standardDuration: duration
            });
            
            toast({
              title: "Duration Updated",
              description: `${taskRecord.name} duration changed to ${duration.toFixed(1)} hours`,
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to update duration",
              variant: "destructive"
            });
          }
        }
      },

      // When dependencies are created
      afterDependencyCreate: ({ dependency }: any) => {
        toast({
          title: "Dependency Created",
          description: `Linked operations successfully`,
        });
      }
    }
  };

  // Load Bryntum library via script tag and initialize
  useEffect(() => {
    const loadBryntumScript = () => {
      // Check if Bryntum is already loaded globally
      // @ts-ignore
      if (window.bryntum?.gantt?.Gantt) {
        // @ts-ignore
        BryntumGantt = window.bryntum.gantt.Gantt;
        initializeGantt();
        return;
      }
      
      // Load Bryntum script if not already loaded
      const existingScript = document.querySelector('script[src="/gantt.module.js"]');
      if (existingScript) {
        // Script already exists, wait for it to load
        existingScript.addEventListener('load', () => {
          // @ts-ignore
          BryntumGantt = window.bryntum?.gantt?.Gantt;
          initializeGantt();
        });
        return;
      }
      
      // Create and load the script
      const script = document.createElement('script');
      script.src = '/gantt.module.js';
      script.type = 'module';
      script.onload = () => {
        console.log('Bryntum script loaded');
        // Wait a moment for module to initialize
        setTimeout(() => {
          // @ts-ignore
          BryntumGantt = window.bryntum?.gantt?.Gantt;
          if (!BryntumGantt) {
            // Try different global paths
            // @ts-ignore
            BryntumGantt = window.Gantt || window.bryntum?.Gantt;
          }
          initializeGantt();
        }, 100);
      };
      script.onerror = () => {
        console.error('Failed to load Bryntum script');
        setIsReady(false);
      };
      
      document.head.appendChild(script);
    };
    
    const initializeGantt = () => {
      if (ganttRef.current && !ganttInstanceRef.current && BryntumGantt) {
        try {
          // Create Bryntum Gantt instance
          ganttInstanceRef.current = new BryntumGantt({
            appendTo: ganttRef.current,
            ...ganttConfig
          });
          
          console.log('Bryntum Gantt initialized successfully');
          
          toast({
            title: "Bryntum Gantt Loaded",
            description: "Professional Gantt chart is now active",
          });
        } catch (error) {
          console.error('Failed to initialize Bryntum Gantt:', error);
          setIsReady(false);
        }
      } else if (!BryntumGantt) {
        console.log('Bryntum Gantt class not found, falling back to placeholder');
        setIsReady(false);
      }
    };
    
    loadBryntumScript();
    
    // Cleanup on unmount
    return () => {
      if (ganttInstanceRef.current) {
        ganttInstanceRef.current.destroy();
        ganttInstanceRef.current = null;
      }
    };
  }, []);

  // Update data when operations/resources change
  useEffect(() => {
    if (ganttInstanceRef.current) {
      const tasks = transformToTasks();
      const resources = transformToResources();
      
      ganttInstanceRef.current.project.loadInlineData({
        tasks,
        resources
      });
    }
  }, [operations, productionOrders, resources]);

  // Export handler
  useEffect(() => {
    if (onExportReady && ganttInstanceRef.current) {
      const exportHandler = async () => {
        try {
          if (ganttInstanceRef.current.features.pdfExport) {
            await ganttInstanceRef.current.features.pdfExport.export({
              filename: 'production-schedule',
              format: 'A3',
              orientation: 'landscape'
            });
            
            toast({
              title: "Export Complete",
              description: "Schedule exported successfully",
            });
          }
        } catch (error) {
          console.error('Export failed:', error);
          toast({
            title: "Export Failed",
            description: "Could not export schedule",
            variant: "destructive"
          });
        }
      };
      
      onExportReady(exportHandler);
    }
  }, [onExportReady, toast]);

  // Placeholder while Bryntum is not installed
  if (!isReady) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/10 rounded-lg border-2 border-dashed">
        <div className="text-center max-w-2xl p-8">
          <h3 className="text-lg font-semibold mb-4">Ready for Bryntum Gantt</h3>
          <div className="space-y-3 text-left">
            <p className="text-muted-foreground">
              To activate the professional Gantt chart:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Download the trial from bryntum.com/download/gantt/</li>
              <li>Extract the zip file</li>
              <li>Upload the <code className="px-1 bg-muted rounded">build</code> folder to <code className="px-1 bg-muted rounded">bryntum-trial/</code></li>
              <li>Upload the React wrapper from <code className="px-1 bg-muted rounded">lib/</code></li>
              <li>I'll handle the integration automatically</li>
            </ol>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-md">
              <p className="text-sm">
                <strong>Note:</strong> The trial includes all features. Only difference is a small watermark.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Return the container div for Bryntum Gantt
  return (
    <div 
      ref={ganttRef} 
      className="h-full w-full bryntum-gantt-container"
      style={{ height: '100%', width: '100%' }}
    />
  );
}
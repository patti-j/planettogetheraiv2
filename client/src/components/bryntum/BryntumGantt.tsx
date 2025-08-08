import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Calendar, 
  Clock, 
  Save,
  Undo,
  Redo,
  Filter,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

declare global {
  interface Window {
    bryntum: any;
  }
}

interface BryntumGanttProps {
  operations: any[];
  resources: any[];
  onOperationUpdate?: (operation: any) => Promise<void>;
  onOperationMove?: (operationId: number, newResourceId: number, newStartTime: Date, newEndTime: Date) => Promise<void>;
  className?: string;
}

export function BryntumGantt({ 
  operations, 
  resources, 
  onOperationUpdate,
  onOperationMove, 
  className = '' 
}: BryntumGanttProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<any>(null);
  const { toast } = useToast();
  const [viewPreset, setViewPreset] = useState('dayAndWeek');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('asap');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Bryntum Gantt
  useEffect(() => {
    if (!containerRef.current || !window.bryntum || isInitialized) return;

    const { Gantt, ProjectModel, StringHelper } = window.bryntum.gantt;

    // Transform operations to Bryntum task format
    const tasks = operations.map(op => ({
      id: op.id,
      name: op.operationName || 'Operation',
      startDate: op.startTime,
      endDate: op.endTime,
      duration: op.standardDuration,
      durationUnit: 'minute',
      resourceId: op.workCenterId,
      productionOrderId: op.productionOrderId,
      status: op.status,
      percentDone: op.completionPercentage || 0,
      cls: `status-${op.status}`,
      eventColor: getStatusColor(op.status),
      draggable: true,
      resizable: 'both',
      // Custom fields
      customFields: {
        priority: op.priority || 5,
        qualityCheckRequired: op.qualityCheckRequired || false,
        notes: op.notes || ''
      }
    }));

    // Transform resources to Bryntum format
    const bryntumResources = resources.map(res => ({
      id: res.id,
      name: res.name,
      type: res.type,
      isDrum: res.isDrum || false,
      eventColor: res.isDrum ? 'red' : undefined
    }));

    // Create project model
    const project = new ProjectModel({
      tasksData: tasks,
      resourcesData: bryntumResources,
      assignmentsData: tasks.map(task => ({
        id: `${task.id}-${task.resourceId}`,
        event: task.id,
        resource: task.resourceId
      })),
      autoSync: false,
      // Enable scheduling
      schedulingEngine: {
        type: 'default'
      }
    });

    // Create Gantt instance
    const gantt = new Gantt({
      appendTo: containerRef.current,
      project,
      
      // Layout configuration
      viewPreset: 'dayAndWeek',
      rowHeight: 45,
      barMargin: 8,
      
      // Columns configuration
      columns: [
        { 
          type: 'name', 
          field: 'name', 
          text: 'Operation',
          width: 250,
          renderer: ({ record }: any) => {
            const status = record.status || 'pending';
            const statusBadge = `<span class="status-badge ${status}">${status}</span>`;
            return `${record.name} ${statusBadge}`;
          }
        },
        { 
          type: 'resourceassignment',
          text: 'Resource',
          width: 150,
          showAvatars: false
        },
        { 
          type: 'startdate',
          text: 'Start',
          width: 100
        },
        { 
          type: 'duration',
          text: 'Duration',
          width: 80
        },
        {
          type: 'percentdone',
          text: 'Progress',
          width: 80,
          showCircle: true
        },
        {
          text: 'Priority',
          field: 'customFields.priority',
          width: 70,
          align: 'center',
          renderer: ({ value }: any) => {
            const color = value <= 3 ? 'red' : value <= 7 ? 'orange' : 'green';
            return `<span style="color: ${color}; font-weight: bold;">${value || 5}</span>`;
          }
        }
      ],

      // Features configuration
      features: {
        // Drag and drop configuration
        taskDrag: {
          constrainDragToTimeline: false,
          showTooltip: true,
          validatorFn: ({ draggedRecords, targetRecord }: any) => {
            // Custom validation logic
            return true;
          }
        },
        taskResize: {
          showTooltip: true
        },
        taskEdit: {
          items: {
            generalTab: {
              items: {
                name: { label: 'Operation Name' },
                percentDone: { label: 'Completion %' },
                priority: { 
                  type: 'number',
                  label: 'Priority (1-10)',
                  min: 1,
                  max: 10
                }
              }
            },
            resourcesTab: {
              label: 'Resources'
            },
            notesTab: {
              label: 'Notes',
              items: {
                notes: {
                  type: 'text',
                  label: 'Notes'
                }
              }
            }
          }
        },
        // Critical path highlighting
        criticalPaths: true,
        // Dependencies
        dependencies: true,
        dependencyEdit: true,
        // Labels on tasks
        labels: {
          left: {
            field: 'name',
            editor: false
          }
        },
        // Progress line
        progressLine: {
          disabled: false,
          statusDate: new Date()
        },
        // Time ranges (for highlighting shifts, breaks, etc.)
        timeRanges: {
          showCurrentTimeLine: true,
          showHeaderElements: true
        },
        // Task tooltip
        taskTooltip: {
          template: ({ taskRecord }: any) => `
            <div class="b-gantt-task-tooltip">
              <h4>${taskRecord.name}</h4>
              <p><strong>Status:</strong> ${taskRecord.status}</p>
              <p><strong>Resource:</strong> ${taskRecord.resourceId}</p>
              <p><strong>Start:</strong> ${new Date(taskRecord.startDate).toLocaleString()}</p>
              <p><strong>End:</strong> ${new Date(taskRecord.endDate).toLocaleString()}</p>
              <p><strong>Duration:</strong> ${taskRecord.duration} ${taskRecord.durationUnit}</p>
              <p><strong>Progress:</strong> ${taskRecord.percentDone}%</p>
              ${taskRecord.customFields?.notes ? `<p><strong>Notes:</strong> ${taskRecord.customFields.notes}</p>` : ''}
            </div>
          `
        },
        // Undo/Redo
        undo: true,
        // Search
        search: true,
        // Column lines
        columnLines: true,
        // Sorting
        sort: 'name',
        // Filtering
        filter: true,
        // Export features
        pdfExport: {
          exportServer: '/api/export' // You'll need to implement this endpoint
        },
        excelExporter: true
      },

      // Toolbar configuration
      tbar: {
        items: [
          {
            type: 'button',
            text: 'Previous',
            icon: 'b-fa-chevron-left',
            onAction: () => gantt.shiftPrevious()
          },
          {
            type: 'button',
            text: 'Next',
            icon: 'b-fa-chevron-right',
            onAction: () => gantt.shiftNext()
          },
          {
            type: 'button',
            text: 'Today',
            icon: 'b-fa-calendar-day',
            onAction: () => gantt.scrollToDate(new Date(), { block: 'center', animate: true })
          },
          '|',
          {
            type: 'button',
            text: 'Zoom In',
            icon: 'b-fa-search-plus',
            onAction: () => gantt.zoomIn()
          },
          {
            type: 'button',
            text: 'Zoom Out',
            icon: 'b-fa-search-minus',
            onAction: () => gantt.zoomOut()
          },
          {
            type: 'combo',
            label: 'View',
            value: 'dayAndWeek',
            items: [
              { value: 'hourAndDay', text: 'Hour/Day' },
              { value: 'dayAndWeek', text: 'Day/Week' },
              { value: 'weekAndMonth', text: 'Week/Month' },
              { value: 'monthAndYear', text: 'Month/Year' }
            ],
            onChange: ({ value }: any) => {
              gantt.viewPreset = value;
              setViewPreset(value);
            }
          },
          '|',
          {
            type: 'button',
            text: 'Undo',
            icon: 'b-fa-undo',
            onAction: () => gantt.features.undo.undo()
          },
          {
            type: 'button',
            text: 'Redo',
            icon: 'b-fa-redo',
            onAction: () => gantt.features.undo.redo()
          },
          '|',
          {
            type: 'buttongroup',
            items: [
              {
                type: 'button',
                text: 'Critical Path',
                icon: 'b-fa-project-diagram',
                pressed: true,
                toggleable: true,
                onToggle: ({ pressed }: any) => {
                  gantt.features.criticalPaths.disabled = !pressed;
                }
              },
              {
                type: 'button',
                text: 'Progress Line',
                icon: 'b-fa-chart-line',
                pressed: true,
                toggleable: true,
                onToggle: ({ pressed }: any) => {
                  gantt.features.progressLine.disabled = !pressed;
                }
              }
            ]
          },
          '->',
          {
            type: 'combo',
            label: 'Algorithm',
            value: 'asap',
            items: [
              { value: 'asap', text: 'ASAP - As Soon As Possible' },
              { value: 'alap', text: 'ALAP - As Late As Possible' },
              { value: 'critical', text: 'Critical Chain' },
              { value: 'resource', text: 'Resource Leveling' },
              { value: 'toc', text: 'Theory of Constraints' }
            ],
            onChange: ({ value }: any) => {
              setSelectedAlgorithm(value);
              applySchedulingAlgorithm(gantt, value);
            }
          },
          {
            type: 'button',
            text: 'Reschedule',
            icon: 'b-fa-sync',
            cls: 'b-green',
            onAction: () => rescheduleOperations(gantt)
          }
        ]
      },

      // Event listeners
      listeners: {
        // Handle task drag/drop
        beforeTaskDrop: async ({ context }: any) => {
          const { draggedRecords, newResource, startDate } = context;
          
          if (onOperationMove) {
            try {
              for (const task of draggedRecords) {
                const endDate = new Date(startDate);
                endDate.setMinutes(endDate.getMinutes() + task.duration);
                
                await onOperationMove(
                  task.id,
                  newResource?.id || task.resourceId,
                  startDate,
                  endDate
                );
              }
              
              toast({
                title: "Success",
                description: "Operation rescheduled successfully"
              });
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to reschedule operation",
                variant: "destructive"
              });
              return false; // Cancel the drop
            }
          }
        },

        // Handle task resize
        afterTaskResize: async ({ taskRecord, oldDuration }: any) => {
          if (onOperationUpdate) {
            try {
              await onOperationUpdate({
                id: taskRecord.id,
                standardDuration: taskRecord.duration,
                startTime: taskRecord.startDate,
                endTime: taskRecord.endDate
              });
              
              toast({
                title: "Success",
                description: "Operation duration updated"
              });
            } catch (error) {
              // Revert the change
              taskRecord.duration = oldDuration;
              toast({
                title: "Error",
                description: "Failed to update operation",
                variant: "destructive"
              });
            }
          }
        },

        // Handle task edit
        afterTaskEdit: async ({ taskRecord, changes }: any) => {
          if (onOperationUpdate && Object.keys(changes).length > 0) {
            try {
              await onOperationUpdate({
                id: taskRecord.id,
                ...changes
              });
              
              toast({
                title: "Success",
                description: "Operation updated successfully"
              });
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to update operation",
                variant: "destructive"
              });
            }
          }
        }
      }
    });

    ganttRef.current = gantt;
    setIsInitialized(true);

    // Apply dark theme if needed
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      gantt.element.classList.add('b-theme-classic-dark');
    }

    // Cleanup
    return () => {
      gantt.destroy();
      ganttRef.current = null;
      setIsInitialized(false);
    };
  }, [operations, resources, onOperationMove, onOperationUpdate]);

  // Helper function to get status color
  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'completed': '#10b981',
      'in-progress': '#3b82f6',
      'scheduled': '#f59e0b',
      'delayed': '#ef4444',
      'on-hold': '#6b7280',
      'pending': '#a855f7'
    };
    return colors[status] || '#6b7280';
  }

  // Apply scheduling algorithm
  function applySchedulingAlgorithm(gantt: any, algorithm: string) {
    const project = gantt.project;
    
    toast({
      title: "Applying Algorithm",
      description: `Rescheduling with ${algorithm.toUpperCase()} algorithm...`
    });

    switch (algorithm) {
      case 'asap':
        // Schedule all tasks as soon as possible
        project.propagate();
        break;
      
      case 'alap':
        // Schedule tasks as late as possible
        project.tasks.forEach((task: any) => {
          if (!task.hasChildren) {
            task.schedulingMode = 'Late';
          }
        });
        project.propagate();
        break;
      
      case 'critical':
        // Focus on critical path
        gantt.features.criticalPaths.disabled = false;
        gantt.features.criticalPaths.highlightTasks = true;
        break;
      
      case 'resource':
        // Resource leveling - spread tasks to avoid overallocation
        const resourceUtilization: Record<number, any[]> = {};
        
        project.tasks.forEach((task: any) => {
          if (task.resourceId) {
            if (!resourceUtilization[task.resourceId]) {
              resourceUtilization[task.resourceId] = [];
            }
            resourceUtilization[task.resourceId].push(task);
          }
        });
        
        // Sort and reschedule tasks per resource
        Object.values(resourceUtilization).forEach(tasks => {
          tasks.sort((a, b) => a.startDate - b.startDate);
          for (let i = 1; i < tasks.length; i++) {
            const prevTask = tasks[i - 1];
            const currentTask = tasks[i];
            if (currentTask.startDate < prevTask.endDate) {
              currentTask.startDate = prevTask.endDate;
            }
          }
        });
        
        project.propagate();
        break;
      
      case 'toc':
        // Theory of Constraints - identify and optimize bottlenecks
        const drumResources = resources.filter(r => r.isDrum);
        if (drumResources.length > 0) {
          // Focus on drum resources
          project.tasks.forEach((task: any) => {
            if (drumResources.find(r => r.id === task.resourceId)) {
              task.cls = 'drum-task';
              task.priority = 10;
            }
          });
        }
        project.propagate();
        break;
    }

    toast({
      title: "Algorithm Applied",
      description: `Schedule optimized using ${algorithm.toUpperCase()}`
    });
  }

  // Reschedule all operations
  function rescheduleOperations(gantt: any) {
    gantt.project.propagate();
    toast({
      title: "Rescheduled",
      description: "All operations have been rescheduled"
    });
  }

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">Production Schedule - Gantt View</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1">
              <Clock className="w-4 h-4 mr-1" />
              {operations.length} Operations
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {resources.length} Resources
            </Badge>
            <Badge className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              Algorithm: {selectedAlgorithm.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={containerRef} 
          className="bryntum-gantt-container"
          style={{ 
            height: 'calc(100vh - 250px)',
            minHeight: '600px'
          }}
        />
      </CardContent>
    </Card>
  );
}
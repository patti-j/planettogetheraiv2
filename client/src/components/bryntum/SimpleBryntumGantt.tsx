import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  Calendar, 
  Clock, 
  RotateCcw
} from 'lucide-react';

declare global {
  interface Window {
    bryntum: any;
  }
}

interface SimpleBryntumGanttProps {
  operations: any[];
  resources: any[];
  onOperationMove?: (operationId: number, newResourceId: number, newStartTime: Date, newEndTime: Date) => Promise<void>;
  className?: string;
}

export function SimpleBryntumGantt({ 
  operations, 
  resources, 
  onOperationMove, 
  className = '' 
}: SimpleBryntumGanttProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<any>(null);
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Bryntum Gantt
  useEffect(() => {
    if (!containerRef.current || !window.bryntum || isInitialized) return;

    const initializeGantt = async () => {
      try {
        setIsLoading(true);
        
        // Wait for Bryntum to be fully loaded
        if (!window.bryntum.gantt?.Gantt) {
          console.warn('Bryntum Gantt not available, retrying...');
          setTimeout(() => setIsLoading(false), 1000);
          return;
        }

        const { Gantt, ProjectModel } = window.bryntum.gantt;

        // Transform operations to Bryntum task format
        const tasks = operations.map(op => ({
          id: op.id,
          name: op.operationName || `Operation ${op.id}`,
          startDate: new Date(op.startTime),
          endDate: new Date(op.endTime),
          duration: op.standardDuration || 60,
          durationUnit: 'minute',
          percentDone: op.completionPercentage || 0,
          cls: `status-${op.status}`,
          // Resource assignment
          resourceId: op.workCenterId,
          // Custom data
          productionOrderId: op.productionOrderId,
          status: op.status || 'scheduled',
          priority: op.priority || 5
        }));

        // Transform resources to Bryntum format
        const bryntumResources = resources.map(res => ({
          id: res.id,
          name: res.name,
          type: res.type
        }));

        // Create assignments
        const assignments = tasks.map(task => ({
          id: `${task.id}-${task.resourceId}`,
          event: task.id,
          resource: task.resourceId
        }));

        // Create project model
        const project = new ProjectModel({
          tasksData: tasks,
          resourcesData: bryntumResources,
          assignmentsData: assignments
        });

        // Create Gantt with minimal configuration
        const gantt = new Gantt({
          appendTo: containerRef.current,
          project,
          
          // Layout
          viewPreset: 'dayAndWeek',
          rowHeight: 45,
          barMargin: 8,
          
          // Columns
          columns: [
            { 
              type: 'name', 
              field: 'name', 
              text: 'Operation',
              width: 250
            },
            { 
              type: 'resourceassignment',
              text: 'Resource',
              width: 150
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
              width: 80
            }
          ],

          // Basic features only
          features: {
            taskDrag: {
              constrainDragToTimeline: false,
              showTooltip: true
            },
            taskResize: {
              showTooltip: true
            },
            taskTooltip: {
              template: ({ taskRecord }: any) => `
                <div class="gantt-tooltip">
                  <h4>${taskRecord.name}</h4>
                  <p><strong>Status:</strong> ${taskRecord.status}</p>
                  <p><strong>Resource:</strong> ${taskRecord.resourceId}</p>
                  <p><strong>Duration:</strong> ${taskRecord.duration} ${taskRecord.durationUnit}</p>
                  <p><strong>Progress:</strong> ${taskRecord.percentDone}%</p>
                </div>
              `
            },
            dependencies: true,
            columnLines: true,
            progressLine: {
              disabled: false,
              statusDate: new Date()
            }
          },

          // Simple toolbar
          tbar: [
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
              onAction: () => gantt.scrollToDate(new Date(), { block: 'center' })
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
            '->',
            {
              type: 'button',
              text: 'Fit to Data',
              icon: 'b-fa-expand-arrows-alt',
              onAction: () => gantt.zoomToFit()
            }
          ],

          // Event listeners
          listeners: {
            beforeTaskDrop: async ({ context }: any) => {
              if (!onOperationMove) return true;

              const { draggedRecords, newResource, startDate } = context;
              
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
                return true;
              } catch (error) {
                toast({
                  title: "Error", 
                  description: "Failed to reschedule operation",
                  variant: "destructive"
                });
                return false;
              }
            }
          }
        });

        ganttRef.current = gantt;
        setIsInitialized(true);
        setIsLoading(false);

        console.log('Bryntum Gantt initialized successfully');

      } catch (error) {
        console.error('Error initializing Bryntum Gantt:', error);
        setIsLoading(false);
        toast({
          title: "Gantt Loading Error",
          description: "Failed to initialize the Gantt chart. Please refresh the page.",
          variant: "destructive"
        });
      }
    };

    // Delay initialization to ensure DOM is ready
    const timeout = setTimeout(initializeGantt, 100);

    return () => {
      clearTimeout(timeout);
      if (ganttRef.current) {
        try {
          ganttRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying Gantt:', e);
        }
        ganttRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [operations, resources, onOperationMove]);

  // Apply dark theme
  useEffect(() => {
    if (ganttRef.current) {
      const isDark = document.documentElement.classList.contains('dark');
      const ganttElement = ganttRef.current.element;
      
      if (isDark) {
        ganttElement.classList.add('b-theme-classic-dark');
        ganttElement.classList.remove('b-theme-classic-light');
      } else {
        ganttElement.classList.add('b-theme-classic-light');
        ganttElement.classList.remove('b-theme-classic-dark');
      }
    }
  }, [isInitialized]);

  if (isLoading) {
    return (
      <Card className={`h-full ${className}`}>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Production Schedule - Gantt View</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading Gantt Chart...</p>
          </div>
        </CardContent>
      </Card>
    );
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
              Bryntum Professional
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
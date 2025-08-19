import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface BryntumGanttWrapperProps {
  height?: string;
  width?: string;
}

export function BryntumGanttWrapper({ height = '600px', width = '100%' }: BryntumGanttWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [bryntumAvailable, setBryntumAvailable] = useState(false);

  // Fetch PT operations data
  const { data: operations, isLoading: loadingOperations } = useQuery({
    queryKey: ['/api/pt-operations'],
    enabled: true
  });

  // Fetch PT resources data
  const { data: resources, isLoading: loadingResources } = useQuery({
    queryKey: ['/api/resources'],
    enabled: true
  });

  // Fetch PT jobs data
  const { data: jobs, isLoading: loadingJobs } = useQuery({
    queryKey: ['/api/pt-jobs'],
    enabled: true
  });

  const isLoading = loadingOperations || loadingResources || loadingJobs;

  // Transform PT data to Bryntum format
  const transformDataForBryntum = () => {
    if (!operations || !resources || !jobs) return null;

    // Transform resources to Bryntum format
    const bryntumResources = (resources as any[]).map((resource: any) => ({
      id: `resource_${resource.id}`,
      name: resource.name,
      type: resource.type || 'machine',
      calendar: 'general'
    }));

    // Transform operations to Bryntum events/tasks
    const bryntumTasks = (operations as any[]).map((op: any, index: number) => {
      const startDate = op.startTime || op.scheduledStart || new Date().toISOString();
      const duration = op.duration || Math.round((op.cycleTime || 1) * 60);
      
      return {
        id: `task_${op.id}`,
        name: op.operationName || op.name,
        startDate: startDate,
        duration: duration,
        durationUnit: 'minute',
        percentDone: op.percentFinished || 0,
        resourceId: op.resourceId ? `resource_${op.resourceId}` : undefined,
        eventColor: getOperationColor(op.operationName || op.name),
        cls: getStatusClass(op.activityStatus || op.status),
        job: op.jobName || `Job ${op.jobId}`,
        outputName: op.outputName,
        status: op.activityStatus || op.status || 'Scheduled'
      };
    });

    // Transform dependencies if any operations have predecessors
    const dependencies = (operations as any[])
      .filter((op: any) => op.predecessorId)
      .map((op: any, index: number) => ({
        id: `dep_${index}`,
        from: `task_${op.predecessorId}`,
        to: `task_${op.id}`,
        type: 2 // Finish to Start
      }));

    return {
      project: {
        startDate: '2025-08-01',
        calendar: 'general',
        hoursPerDay: 24,
        daysPerWeek: 7,
        daysPerMonth: 30
      },
      calendars: {
        rows: [
          {
            id: 'general',
            name: 'Brewery Calendar 24/7',
            intervals: [] // 24/7 operation for brewery
          }
        ]
      },
      resources: {
        rows: bryntumResources
      },
      tasks: {
        rows: bryntumTasks
      },
      dependencies: {
        rows: dependencies
      },
      assignments: {
        rows: bryntumTasks
          .filter((task: any) => task.resourceId)
          .map((task: any, index: number) => ({
            id: `assign_${index}`,
            event: task.id,
            resource: task.resourceId
          }))
      }
    };
  };

  // Get operation color based on type
  const getOperationColor = (operationName: string) => {
    if (operationName?.includes('Milling')) return '#FFA500';
    if (operationName?.includes('Mashing')) return '#FFC107';
    if (operationName?.includes('Boiling')) return '#DC3545';
    if (operationName?.includes('Fermentation')) return '#9C27B0';
    if (operationName?.includes('Conditioning')) return '#2196F3';
    if (operationName?.includes('Filtration')) return '#00BCD4';
    if (operationName?.includes('Carbonation')) return '#3F51B5';
    if (operationName?.includes('Packaging')) return '#4CAF50';
    if (operationName?.includes('Quality')) return '#FFEB3B';
    return '#9E9E9E';
  };

  // Get status class
  const getStatusClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'in progress': return 'status-in-progress';
      case 'not started': return 'status-not-started';
      default: return 'status-scheduled';
    }
  };

  useEffect(() => {
    // Clean up previous instance if it exists
    if (ganttRef.current) {
      ganttRef.current.destroy();
      ganttRef.current = null;
    }

    // Only initialize when we have data and container
    if (!isLoading && containerRef.current && operations && resources && !isInitialized) {
      // Wait for Bryntum to be available
      const initGantt = () => {
        if (typeof window !== 'undefined' && (window as any).bryntum?.gantt) {
          const { Gantt } = (window as any).bryntum.gantt;
          
          const ganttData = transformDataForBryntum();
          if (!ganttData) return;

          try {
            ganttRef.current = new Gantt({
              appendTo: containerRef.current,
              height: height,
              width: width,
              
              // Features
              features: {
                percentBar: true,
                progressLine: true,
                rollups: true,
                baselines: false,
                dependencies: true,
                timeRanges: true,
                eventTooltip: {
                  template: (data: any) => `
                    <div class="brewery-tooltip">
                      <div class="tooltip-header">${data.eventRecord.name}</div>
                      <div class="tooltip-body">
                        <div>Job: ${data.eventRecord.job || 'N/A'}</div>
                        <div>Status: ${data.eventRecord.status}</div>
                        <div>Duration: ${data.eventRecord.duration} ${data.eventRecord.durationUnit}</div>
                        <div>Progress: ${data.eventRecord.percentDone}%</div>
                        ${data.eventRecord.outputName ? `<div>Output: ${data.eventRecord.outputName}</div>` : ''}
                      </div>
                    </div>
                  `
                }
              },

              // Columns configuration
              columns: [
                { type: 'name', field: 'name', text: 'Operation', width: 250 },
                { field: 'job', text: 'Job', width: 150 },
                { field: 'status', text: 'Status', width: 100,
                  renderer: ({ value }: any) => {
                    const color = value === 'Completed' ? 'green' : 
                                value === 'In Progress' ? 'blue' : 
                                value === 'Not Started' ? 'gray' : 'orange';
                    return `<span style="color: ${color}; font-weight: bold;">${value}</span>`;
                  }
                },
                { type: 'startdate', text: 'Start Date' },
                { type: 'duration', text: 'Duration' },
                { type: 'percentdone', text: 'Progress', width: 80 }
              ],

              // View preset
              viewPreset: 'weekAndDayLetter',
              barMargin: 5,
              rowHeight: 40,

              // Load the transformed data
              project: ganttData.project,
              calendars: ganttData.calendars,
              resources: ganttData.resources,
              tasks: ganttData.tasks,
              dependencies: ganttData.dependencies,
              assignments: ganttData.assignments
            });

            setIsInitialized(true);
          } catch (error) {
            console.error('Failed to initialize Bryntum Gantt:', error);
          }
        } else {
          // Retry if Bryntum is not loaded yet
          setTimeout(initGantt, 100);
        }
      };

      initGantt();
    }

    // Cleanup function
    return () => {
      if (ganttRef.current) {
        ganttRef.current.destroy();
        ganttRef.current = null;
      }
    };
  }, [isLoading, operations, resources, jobs, height, width, isInitialized]);

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center" style={{ height }}>
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-lg font-medium">Loading Brewery Production Schedule...</p>
          <p className="text-sm text-gray-500">Fetching operations and resources from PT tables</p>
        </div>
      </Card>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="bryntum-gantt-container"
      style={{ height, width }}
    />
  );
}

// Export both as named and default to handle any import style
export default BryntumGanttWrapper;
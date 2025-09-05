import React, { useRef, useEffect, useState } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import { ProjectModel } from '@bryntum/schedulerpro';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  Users, 
  Activity, 
  Settings, 
  ZoomIn, 
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Home
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

// Scheduler Pro Page based on official Bryntum documentation
// https://bryntum.com/products/schedulerpro/docs/api/widgets/SchedulerPro/view/SchedulerPro

export default function SchedulerPro() {
  const schedulerRef = useRef<any>(null);
  const [schedulerInstance, setSchedulerInstance] = useState<any>(null);
  const [currentViewPreset, setCurrentViewPreset] = useState('weekAndDay');
  const [isLoading, setIsLoading] = useState(true);
  const [projectData, setProjectData] = useState<any>(null);
  const { toast } = useToast();

  // Fetch PT data for the scheduler
  const { data: ptOperations } = useQuery({
    queryKey: ['/api/pt-operations'],
    enabled: true
  });

  // Initialize project data
  useEffect(() => {
    if (ptOperations) {
      // Extract unique resources from PT operations
      const resources = extractResourcesFromOperations(ptOperations || []);
      const events = transformEvents(ptOperations || []);
      const assignments = createAssignments(ptOperations || [], resources);
      const dependencies = createDependencies(ptOperations || []);
      const calendars = createCalendars();

      setProjectData({
        calendars: calendars,  // Use 'calendars' instead of deprecated 'calendarsData'
        calendar: 'business', // Set default project calendar
        resources: resources,
        events: events,
        assignments: assignments,
        dependencies: dependencies
      });
      
      setIsLoading(false);
    }
  }, [ptOperations]);

  // Extract unique resources from PT operations
  function extractResourcesFromOperations(ptOperations: any[]): any[] {
    if (!Array.isArray(ptOperations)) return [];
    
    // Create unique resources from operations data
    const resourceMap = new Map();
    
    ptOperations.forEach((op: any) => {
      const resourceId = op.assignedResourceId || op.resourceId;
      const resourceName = op.assignedResourceName || op.resourceName;
      
      if (resourceId && !resourceMap.has(resourceId)) {
        resourceMap.set(resourceId, {
          id: resourceId,
          name: resourceName || `Resource ${resourceId}`,
          type: op.resourceType || 'Machine',
          calendar: determineCalendarFromResource(resourceName),
          efficiency: 100,
          department: op.workCenterName || 'Production',
          image: false // Disable images for cleaner look
        });
      }
    });
    
    // Ensure we have at least some resources
    const resourceArray = Array.from(resourceMap.values());
    console.log('Extracted resources:', resourceArray.length, 'unique resources from', ptOperations.length, 'operations');
    
    return resourceArray;
  }
  
  // Determine calendar based on resource name or type
  function determineCalendarFromResource(resourceName: string): string {
    if (!resourceName) return 'business';
    const name = resourceName.toLowerCase();
    if (name.includes('night') || name.includes('3rd shift')) return 'night';
    if (name.includes('24/7') || name.includes('continuous')) return '24/7';
    if (name.includes('day') || name.includes('1st shift')) return 'day';
    return 'business';
  }

  // Transform events (operations) to Bryntum format
  function transformEvents(ptOperations: any[]): any[] {
    if (!Array.isArray(ptOperations)) return [];
    
    return ptOperations.map((op: any) => {
      const startDate = new Date(op.startTime);
      const duration = op.duration || 4; // Default 4 hours
      const endDate = op.endTime ? 
        new Date(op.endTime) : 
        new Date(startDate.getTime() + duration * 60 * 60 * 1000);
      
      return {
        id: op.id || op.operationId,
        name: `${op.jobName}: ${op.operationName}`,
        startDate: startDate,
        endDate: endDate,
        duration: duration,
        durationUnit: 'hour',
        percentDone: op.percentComplete || 0,
        effort: duration,
        effortUnit: 'hour',
        constraintType: op.constraintType || 'startnoearlierthan',
        constraintDate: startDate,
        // Custom fields
        priority: op.priority || 5,
        status: op.status || 'scheduled',
        jobId: op.jobId,
        operationId: op.operationId,
        cls: getEventClass(op)
      };
    });
  }

  // Create assignments linking events to resources
  function createAssignments(operations: any[], resources: any[]): any[] {
    if (!operations || !resources || resources.length === 0) return [];
    
    const assignments: any[] = [];
    
    operations.forEach((op: any) => {
      const resourceId = op.assignedResourceId || op.resourceId || op.resource_id;
      if (resourceId) {
        // Find resource by ID (convert to string for comparison)
        const resource = resources.find(r => String(r.id) === String(resourceId));
        if (resource) {
          assignments.push({
            id: `${op.id || op.operationId}_${resourceId}`,
            eventId: op.id || op.operationId,
            resourceId: String(resourceId),
            units: 100 // 100% allocation
          });
        } else {
          console.log(`Resource not found for operation ${op.operationName} with resourceId ${resourceId}`);
        }
      }
    });
    
    console.log('Created assignments:', assignments.length, 'from', operations.length, 'operations');
    return assignments;
  }

  // Create dependencies between operations
  function createDependencies(operations: any[]): any[] {
    // Create sample dependencies for demonstration
    // In production, these would come from actual PT data
    const dependencies: any[] = [];
    
    // Create dependencies based on job sequence
    const jobGroups = new Map();
    operations.forEach(op => {
      const jobId = op.jobId;
      if (!jobGroups.has(jobId)) {
        jobGroups.set(jobId, []);
      }
      jobGroups.get(jobId).push(op);
    });
    
    // Link operations within same job
    jobGroups.forEach((ops) => {
      ops.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      for (let i = 0; i < ops.length - 1; i++) {
        dependencies.push({
          id: `dep_${ops[i].id}_${ops[i + 1].id}`,
          fromEvent: ops[i].id || ops[i].operationId,
          toEvent: ops[i + 1].id || ops[i + 1].operationId,
          type: 2, // Finish-to-Start
          lag: 0,
          lagUnit: 'hour'
        });
      }
    });
    
    return dependencies;
  }

  // Create calendars for working/non-working time
  function createCalendars(): any[] {
    return [
      {
        id: 'business',
        name: 'Business Hours',
        intervals: [
          {
            recurrentStartDate: 'on Mon-Fri at 08:00',
            recurrentEndDate: 'on Mon-Fri at 17:00',
            isWorking: true
          },
          {
            recurrentStartDate: 'on Sat at 00:00',
            recurrentEndDate: 'on Sat at 23:59',
            isWorking: false
          },
          {
            recurrentStartDate: 'on Sun at 00:00',
            recurrentEndDate: 'on Sun at 23:59',
            isWorking: false
          }
        ]
      },
      {
        id: 'day',
        name: 'Day Shift',
        intervals: [
          {
            recurrentStartDate: 'every day at 06:00',
            recurrentEndDate: 'every day at 14:00',
            isWorking: true
          }
        ]
      },
      {
        id: 'night',
        name: 'Night Shift',
        intervals: [
          {
            recurrentStartDate: 'every day at 22:00',
            recurrentEndDate: 'every day at 23:59',
            isWorking: true
          },
          {
            recurrentStartDate: 'every day at 00:00',
            recurrentEndDate: 'every day at 06:00',
            isWorking: true
          }
        ]
      },
      {
        id: '24/7',
        name: '24/7 Operations',
        intervals: [
          {
            recurrentStartDate: 'every day at 00:00',
            recurrentEndDate: 'every day at 23:59',
            isWorking: true
          }
        ]
      }
    ];
  }

  // Get CSS class for event styling
  function getEventClass(operation: any): string {
    if (operation.priority > 8) return 'high-priority';
    if (operation.status === 'delayed') return 'delayed';
    if (operation.status === 'completed') return 'completed';
    return 'normal';
  }

  // Capture scheduler instance after mount
  useEffect(() => {
    if (!projectData) return;
    
    const checkInterval = setInterval(() => {
      if (schedulerRef.current) {
        const instance = schedulerRef.current.schedulerProInstance || 
                        schedulerRef.current.instance;
        
        if (instance) {
          setSchedulerInstance(instance);
          clearInterval(checkInterval);
          
          // Initial view setup
          setTimeout(() => {
            if (instance.zoomToFit) {
              instance.zoomToFit();
            }
          }, 500);
        }
      }
    }, 100);
    
    return () => clearInterval(checkInterval);
  }, [projectData]);

  // Toolbar actions
  const handleZoomIn = () => {
    if (schedulerInstance?.zoomIn) {
      schedulerInstance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (schedulerInstance?.zoomOut) {
      schedulerInstance.zoomOut();
    }
  };

  const handleZoomToFit = () => {
    if (schedulerInstance?.zoomToFit) {
      schedulerInstance.zoomToFit();
    }
  };

  const handlePreviousTimeSpan = () => {
    if (schedulerInstance?.shiftPrevious) {
      schedulerInstance.shiftPrevious();
    }
  };

  const handleNextTimeSpan = () => {
    if (schedulerInstance?.shiftNext) {
      schedulerInstance.shiftNext();
    }
  };

  const handleToday = () => {
    if (schedulerInstance?.scrollToDate) {
      schedulerInstance.scrollToDate(new Date(), { block: 'center' });
    }
  };

  const changeViewPreset = (preset: string) => {
    if (schedulerInstance) {
      schedulerInstance.viewPreset = preset;
      setCurrentViewPreset(preset);
    }
  };

  const runSchedulingEngine = async () => {
    if (!schedulerInstance) return;
    
    toast({
      title: "Scheduling Engine",
      description: "Running automatic scheduling optimization...",
    });
    
    // The scheduling engine runs automatically in SchedulerPro
    // Here we can trigger a project commit to ensure all calculations are complete
    if (schedulerInstance.project) {
      await schedulerInstance.project.commitAsync();
      
      toast({
        title: "Scheduling Complete",
        description: "All operations have been optimized according to constraints and dependencies.",
      });
    }
  };

  if (isLoading || !projectData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading scheduler...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Production Scheduler Pro</h1>
          </div>
          
          {/* View Preset Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">View:</span>
            <Button
              variant={currentViewPreset === 'hourAndDay' ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeViewPreset('hourAndDay')}
            >
              Hour
            </Button>
            <Button
              variant={currentViewPreset === 'weekAndDay' ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeViewPreset('weekAndDay')}
            >
              Day
            </Button>
            <Button
              variant={currentViewPreset === 'weekAndMonth' ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeViewPreset('weekAndMonth')}
            >
              Week
            </Button>
            <Button
              variant={currentViewPreset === 'monthAndYear' ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeViewPreset('monthAndYear')}
            >
              Month
            </Button>
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center gap-2">
            {/* Navigation Controls */}
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousTimeSpan}
              title="Previous time span"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleToday}
              title="Go to today"
            >
              <Home className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextTimeSpan}
              title="Next time span"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <div className="h-8 w-px bg-border mx-2" />
            
            {/* Zoom Controls */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomToFit}
              title="Zoom to fit"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              onClick={runSchedulingEngine}
              className="gap-2"
            >
              <Activity className="h-4 w-4" />
              Run Scheduling Engine
            </Button>
          </div>
        </div>
      </div>

      {/* Scheduler Container */}
      <div className="flex-1 overflow-hidden p-4">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <BryntumSchedulerPro
              ref={schedulerRef}
              
              // Project configuration - the heart of SchedulerPro
              project={{
                ...projectData,
                autoSync: false,
                validateResponse: true
              }}
              
              // Time axis configuration
              startDate={new Date(2025, 8, 1)} // September 1, 2025
              endDate={new Date(2025, 8, 30)}   // September 30, 2025
              viewPreset={currentViewPreset}
              
              // Layout configuration
              rowHeight={50}
              barMargin={5}
              
              // Resource columns
              columns={[
                {
                  type: 'resourceInfo',
                  text: 'Resource',
                  width: 200,
                  showEventCount: true,
                  showRole: true
                },
                {
                  text: 'Type',
                  field: 'type',
                  width: 100
                },
                {
                  text: 'Calendar',
                  field: 'calendar',
                  width: 100
                },
                {
                  text: 'Efficiency %',
                  field: 'efficiency',
                  width: 100,
                  type: 'number'
                }
              ]}
              
              // Features configuration based on documentation
              {...{ features: {
                // Core scheduling features
                dependencies: true,
                dependencyEdit: {
                  showTooltip: true
                },
                
                // Event manipulation
                eventDrag: {
                  constrainDragToTimeline: true,
                  showTooltip: true
                },
                eventDragCreate: true,
                eventEdit: {
                  items: {
                    generalTab: {
                      items: {
                        // Define which fields are editable
                        nameField: { label: 'Operation' },
                        percentDoneField: { label: 'Progress %' },
                        effortField: { label: 'Effort (hours)' }
                      }
                    },
                    predecessorsTab: true,
                    successorsTab: true,
                    advancedTab: true
                  }
                },
                eventResize: true,
                eventTooltip: {
                  template: ({ eventRecord }: any) => `
                    <div class="b-sch-event-tooltip">
                      <h3>${eventRecord.name}</h3>
                      <dl>
                        <dt>Start:</dt><dd>${eventRecord.startDate?.toLocaleString()}</dd>
                        <dt>End:</dt><dd>${eventRecord.endDate?.toLocaleString()}</dd>
                        <dt>Duration:</dt><dd>${eventRecord.duration} ${eventRecord.durationUnit}</dd>
                        <dt>Progress:</dt><dd>${eventRecord.percentDone || 0}%</dd>
                        <dt>Priority:</dt><dd>${eventRecord.priority || 'Normal'}</dd>
                        <dt>Status:</dt><dd>${eventRecord.status || 'Scheduled'}</dd>
                      </dl>
                    </div>
                  `
                },
                
                // Progress tracking
                percentBar: true,
                
                // Timeline features
                timeRanges: {
                  showCurrentTimeLine: true
                },
                nonWorkingTime: true,
                
                // Grid features
                cellEdit: false,
                columnLines: true,
                columnReorder: true,
                columnResize: true,
                filterBar: true,
                group: false,
                headerMenu: true,
                sort: 'name',
                stripe: true,
                tree: true,
                
                // Critical path highlighting
                criticalPaths: true,
                
                // Resource histogram can be added as a partner widget
                resourceTimeRanges: true,
                
                // Schedule tooltip showing conflicts
                scheduleTooltip: true
              }}}
              
              // Event handlers
              onBeforeEventEdit={({ eventRecord }: any) => {
                console.log('Editing event:', eventRecord.name);
                return true; // Allow edit
              }}
              
              onEventDrop={({ eventRecords, targetResourceRecord, valid }: any) => {
                if (valid) {
                  const eventNames = eventRecords.map((r: any) => r.name).join(', ');
                  toast({
                    title: "Operation Rescheduled",
                    description: `${eventNames} moved to ${targetResourceRecord.name}`,
                  });
                }
              }}
              
              onDependencyAdd={({ fromEvent, toEvent }: any) => {
                toast({
                  title: "Dependency Created",
                  description: `${fromEvent.name} → ${toEvent.name}`,
                });
              }}
              
              onBeforeEventDelete={({ eventRecords }: any) => {
                const eventNames = eventRecords.map((r: any) => r.name).join(', ');
                return confirm(`Delete ${eventNames}?`);
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Status Bar */}
      <div className="border-t">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {projectData.resources.length} Resources
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              {projectData.events.length} Operations
            </span>
            <span className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              {projectData.dependencies.length} Dependencies
            </span>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              On Schedule
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              At Risk
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              Delayed
            </span>
          </div>
        </div>
      </div>

      {/* Custom styles for event classes */}
      <style>{`
        .b-sch-event.high-priority {
          background-color: #ef4444 !important;
        }
        .b-sch-event.delayed {
          background-color: #f59e0b !important;
        }
        .b-sch-event.completed {
          background-color: #10b981 !important;
          opacity: 0.8;
        }
        .b-sch-event.normal {
          background-color: #3b82f6 !important;
        }
        .b-sch-event-tooltip {
          padding: 10px;
        }
        .b-sch-event-tooltip h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          font-weight: bold;
        }
        .b-sch-event-tooltip dl {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 5px 10px;
          margin: 0;
        }
        .b-sch-event-tooltip dt {
          font-weight: 600;
        }
        .b-sch-event-tooltip dd {
          margin: 0;
        }
      `}</style>
    </div>
  );
}

// Set display name for debugging
SchedulerPro.displayName = 'SchedulerPro';
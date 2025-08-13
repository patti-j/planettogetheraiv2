import React, { useRef, useEffect } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Import Bryntum styles
import '@bryntum/schedulerpro/schedulerpro.material.css';

interface SchedulerProProps {
  height?: string;
  startDate?: Date;
  endDate?: Date;
}

const BryntumSchedulerProComponent: React.FC<SchedulerProProps> = ({ 
  height = '600px',
  startDate = new Date(new Date().setHours(0, 0, 0, 0)), // Today at midnight
  endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
}) => {
  const schedulerRef = useRef<any>(null);

  // Fetch production orders
  const { data: productionOrders, isLoading: loadingOrders } = useQuery<any[]>({
    queryKey: ['/api/production-orders']
  });

  // Fetch resources
  const { data: resources, isLoading: loadingResources } = useQuery<any[]>({
    queryKey: ['/api/resources']
  });

  // Fetch operations
  const { data: operations, isLoading: loadingOperations } = useQuery<any[]>({
    queryKey: ['/api/operations']
  });

  const isLoading = loadingOrders || loadingResources || loadingOperations;

  // Transform data for Bryntum Scheduler Pro
  const transformDataForScheduler = () => {
    if (!productionOrders || !resources || !operations) {
      return { events: [], resources: [], assignments: [] };
    }

    // Transform resources
    const schedulerResources = resources.map((resource: any) => ({
      id: `resource-${resource.id}`,
      name: resource.name,
      type: resource.type,
      capacity: resource.capacity || 100,
      efficiency: resource.efficiency || 100,
      eventColor: resource.type === 'production_line' ? 'blue' : 
                  resource.type === 'assembly' ? 'green' : 
                  resource.type === 'packaging' ? 'orange' : 'gray'
    }));

    // Transform operations to events
    const schedulerEvents = operations.map((operation: any, index: number) => {
      // Parse dates properly
      const startDate = operation.startTime ? new Date(operation.startTime) : new Date(Date.now() + index * 24 * 60 * 60 * 1000);
      const endDate = operation.endTime ? new Date(operation.endTime) : 
                     new Date(startDate.getTime() + (operation.duration || operation.standardDuration || 120) * 60 * 1000);
      
      return {
        id: `operation-${operation.id}`,
        name: operation.name || operation.operationName || `Operation ${operation.id}`,
        startDate: startDate,
        endDate: endDate,
        duration: operation.duration || operation.standardDuration || 120,
        durationUnit: 'minute',
        effort: operation.duration || operation.standardDuration || 120,
        effortUnit: 'minute',
        percentDone: operation.completionPercentage || 0,
        priority: operation.priority || 5,
        constraintType: 'muststarton',
        constraintDate: startDate,
        eventColor: operation.status === 'completed' ? 'green' :
                    operation.status === 'in_progress' ? 'blue' :
                    operation.status === 'scheduled' ? 'orange' : 'gray',
        status: operation.status,
        productionOrderId: operation.productionOrderId || operation.routingId,
        description: operation.description || `${operation.operationName} - ${operation.status}`
      };
    });

    // Create assignments (link operations to resources)
    // Use workCenterId or assignedResourceId for resource mapping
    const schedulerAssignments = operations
      .filter((op: any) => op.workCenterId || op.assignedResourceId)
      .map((operation: any) => ({
        id: `assignment-${operation.id}`,
        eventId: `operation-${operation.id}`,
        resourceId: `resource-${operation.workCenterId || operation.assignedResourceId}`,
        units: 100 // Percentage of resource capacity used
      }));
    
    return {
      events: schedulerEvents,
      resources: schedulerResources,
      assignments: schedulerAssignments
    };
  };

  const schedulerConfig = {
    startDate,
    endDate,
    viewPreset: 'dayAndWeek',
    barMargin: 5,
    rowHeight: 60,
    resourceImagePath: 'users/',
    eventStyle: 'colored' as const,
    eventColor: null, // Let individual events control their color
    scrollable: true,
    infiniteScroll: false,
    zoomOnTimeAxisDoubleClick: false,
    zoomOnMouseWheel: false,
    // Scroll to today on load
    visibleDate: {
      date: new Date(),
      block: 'center' as const
    },
    
    columns: [
      { 
        text: 'Resource', 
        field: 'name', 
        width: 220,
        locked: true,
        htmlEncode: false,
        renderer: ({ record }: any) => {
          const typeIcon = record.type === 'production_line' ? '🏭' :
                          record.type === 'assembly' ? '🔧' :
                          record.type === 'packaging' ? '📦' : 
                          record.type === 'quality_control' ? '✅' :
                          record.type === 'maintenance' ? '🔨' : '⚙️';
          // Return simple text with icon - Bryntum will handle the display
          return `${typeIcon} ${record.name}`;
        }
      },
      { 
        text: 'Status', 
        field: 'status', 
        width: 100,
        renderer: ({ record }: any) => {
          return record.status || 'Available';
        }
      },
      { 
        text: 'Type', 
        field: 'type', 
        width: 130,
        renderer: ({ value }: any) => {
          return value ? value.replace(/_/g, ' ').toUpperCase() : '';
        }
      },
      { 
        text: 'Utilization', 
        field: 'utilization', 
        width: 100,
        align: 'center' as const,
        renderer: ({ record }: any) => {
          const utilization = record.utilization || 0;
          return `${utilization}%`;
        }
      },
      { 
        text: 'Capacity', 
        field: 'capacity', 
        width: 80,
        align: 'center' as const,
        renderer: ({ value }: any) => `${value || 100}%`
      },
      { 
        text: 'Efficiency', 
        field: 'efficiency', 
        width: 80,
        align: 'center' as const,
        renderer: ({ value }: any) => {
          const eff = value || 100;
          return `${eff}%`;
        }
      }
    ],

    features: {
      // Enable key features
      eventDrag: true,
      eventDragCreate: true,
      eventResize: true,
      eventEdit: {
        items: {
          generalTab: {
            items: {
              name: { label: 'Operation Name' },
              startDate: { label: 'Start Time' },
              endDate: { label: 'End Time' },
              duration: { label: 'Duration (minutes)' },
              percentDone: { label: 'Progress (%)' },
              priority: { label: 'Priority (1-10)' }
            }
          }
        }
      },
      eventTooltip: {
        template: ({ eventRecord }: any) => {
          return {
            header: eventRecord.name,
            body: `Status: ${eventRecord.status || 'Scheduled'}
Progress: ${eventRecord.percentDone || 0}%
Priority: ${eventRecord.priority || 5}
${eventRecord.description ? `Description: ${eventRecord.description}` : ''}`
          };
        }
      },
      dependencies: true,
      dependencyEdit: true,
      criticalPaths: true,
      nonWorkingTime: true,
      timeRanges: true,
      resourceTimeRanges: true,
      scheduleTooltip: true,
      cellEdit: false,
      taskEdit: false,
      percentBar: true,
      summary: true,
      indicators: true,
      sort: 'name'
    },

    // Configure working time
    calendars: [
      {
        id: 'general',
        name: 'General',
        intervals: [
          {
            recurrentStartDate: 'on Mon at 08:00',
            recurrentEndDate: 'on Mon at 17:00',
            isWorking: true
          },
          {
            recurrentStartDate: 'on Tue at 08:00',
            recurrentEndDate: 'on Tue at 17:00',
            isWorking: true
          },
          {
            recurrentStartDate: 'on Wed at 08:00',
            recurrentEndDate: 'on Wed at 17:00',
            isWorking: true
          },
          {
            recurrentStartDate: 'on Thu at 08:00',
            recurrentEndDate: 'on Thu at 17:00',
            isWorking: true
          },
          {
            recurrentStartDate: 'on Fri at 08:00',
            recurrentEndDate: 'on Fri at 17:00',
            isWorking: true
          }
        ]
      }
    ],

    // Event handlers
    listeners: {
      beforeEventSave: ({ source, eventRecord, values }: any) => {
        console.log('Saving event:', eventRecord, values);
        // Here you would call API to save changes
        return true;
      },
      eventDrop: ({ context }: any) => {
        console.log('Event dropped:', context);
        // Here you would call API to update event timing
      },
      eventResizeEnd: ({ context }: any) => {
        console.log('Event resized:', context);
        // Here you would call API to update event duration
      }
    },

    tbar: [
      {
        type: 'button',
        text: 'Optimize Schedule',
        icon: 'b-fa-magic',
        onAction: () => {
          console.log('Optimizing schedule...');
          // Call optimization API
        }
      },
      {
        type: 'button',
        text: 'Critical Path',
        icon: 'b-fa-project-diagram',
        onAction: () => {
          const scheduler = schedulerRef.current?.instance;
          if (scheduler) {
            scheduler.features.criticalPaths.highlighted = !scheduler.features.criticalPaths.highlighted;
          }
        }
      },
      {
        type: 'button',
        text: 'Export',
        icon: 'b-fa-file-export',
        onAction: () => {
          const scheduler = schedulerRef.current?.instance;
          if (scheduler) {
            scheduler.features.pdfExport?.showExportDialog();
          }
        }
      },
      {
        type: 'widget',
        html: '|'
      },
      {
        type: 'viewpresetcombo',
        label: 'View:',
        width: 150
      },
      {
        type: 'datefield',
        label: 'Start:',
        ref: 'startDateField',
        value: startDate,
        onChange: ({ value }: any) => {
          const scheduler = schedulerRef.current?.instance;
          if (scheduler) {
            scheduler.startDate = value;
          }
        }
      }
    ]
  };

  // Update scheduler data when it changes
  useEffect(() => {
    if (schedulerRef.current?.instance && !isLoading) {
      const { events, resources, assignments } = transformDataForScheduler();
      const scheduler = schedulerRef.current.instance;
      
      scheduler.resources = resources;
      scheduler.events = events;
      scheduler.assignments = assignments;
    }
  }, [productionOrders, resources, operations, isLoading]);

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center" style={{ height }}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading schedule data...</span>
        </div>
      </Card>
    );
  }

  const { events, resources: schedulerResources, assignments } = transformDataForScheduler();

  return (
    <div className="bryntum-scheduler-container">
      <BryntumSchedulerPro
        ref={schedulerRef}
        {...schedulerConfig}
        resources={schedulerResources}
        events={events}
        assignments={assignments}
        height={height}
      />
    </div>
  );
};

export default BryntumSchedulerProComponent;
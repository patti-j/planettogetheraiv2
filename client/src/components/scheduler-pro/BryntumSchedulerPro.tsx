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
      efficiency: resource.efficiency || 100
    }));

    // Transform operations to events
    const schedulerEvents = operations.map((operation: any, index: number) => {
      // Parse dates properly
      const startDate = operation.startTime ? new Date(operation.startTime) : new Date(Date.now() + index * 24 * 60 * 60 * 1000);
      const endDate = operation.endTime ? new Date(operation.endTime) : 
                     new Date(startDate.getTime() + (operation.duration || operation.standardDuration || 120) * 60 * 1000);
      
      // Generate vibrant colors similar to the core app
      const colors = ['#4285F4', '#DB4437', '#F4B400', '#0F9D58', '#AB47BC', '#00ACC1', '#FF7043', '#9E9D24'];
      const colorIndex = index % colors.length;
      
      return {
        id: `operation-${operation.id}`,
        name: `${operation.name || operation.operationName || 'Operation'} [${operation.productionOrderId || operation.id}]`,
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
        eventColor: colors[colorIndex],
        cls: 'custom-event',
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
    viewPreset: 'weekAndDayLetter',
    barMargin: 1,
    rowHeight: 35,
    resourceImagePath: 'users/',
    eventStyle: 'plain' as const,
    eventColor: null, // Let individual events control their color
    scrollable: true,
    infiniteScroll: false,
    zoomOnTimeAxisDoubleClick: true,
    zoomOnMouseWheel: true,
    // Scroll to today on load
    visibleDate: {
      date: new Date(),
      block: 'center' as const
    },
    
    columns: [
      { 
        text: 'Resource Name', 
        field: 'name', 
        width: 150,
        locked: true,
        htmlEncode: false,
        renderer: ({ record }: any) => {
          // Simple clean resource name
          return record.name;
        }
      },
      { 
        text: 'Workcentre', 
        field: 'type', 
        width: 100,
        renderer: ({ value }: any) => {
          return value ? value.replace(/_/g, ' ').charAt(0).toUpperCase() + value.replace(/_/g, ' ').slice(1) : '';
        }
      }
    ],

    features: {
      // Enable key features like core app
      eventDrag: true,
      eventDragCreate: false,
      eventResize: true,
      eventEdit: false, // Disable double-click edit to match core app
      eventTooltip: {
        template: ({ eventRecord }: any) => {
          return {
            header: eventRecord.name,
            body: `Start: ${eventRecord.startDate.toLocaleString()}
End: ${eventRecord.endDate.toLocaleString()}
Duration: ${eventRecord.duration} ${eventRecord.durationUnit}
Status: ${eventRecord.status || 'Scheduled'}`
          };
        }
      },
      dependencies: false, // Clean view without dependency lines
      nonWorkingTime: true,
      timeRanges: false,
      resourceTimeRanges: false,
      scheduleTooltip: false,
      cellEdit: false,
      taskEdit: false,
      percentBar: false,
      summary: false,
      indicators: false,
      sort: false
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
        text: 'Previous Month',
        icon: 'b-fa-chevron-left',
        onAction: () => {
          const scheduler = schedulerRef.current?.instance;
          if (scheduler) {
            scheduler.shiftPrevious();
          }
        }
      },
      {
        type: 'button',
        text: 'Today',
        icon: 'b-fa-calendar-day',
        onAction: () => {
          const scheduler = schedulerRef.current?.instance;
          if (scheduler) {
            scheduler.scrollToDate(new Date(), { block: 'center' });
          }
        }
      },
      {
        type: 'button',
        text: 'Next Month',
        icon: 'b-fa-chevron-right',
        onAction: () => {
          const scheduler = schedulerRef.current?.instance;
          if (scheduler) {
            scheduler.shiftNext();
          }
        }
      },
      {
        type: 'widget',
        html: '|'
      },
      {
        type: 'viewpresetcombo',
        width: 120
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
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
    queryKey: ['/api/pt-jobs']
  });

  // Fetch resources
  const { data: resources, isLoading: loadingResources } = useQuery<any[]>({
    queryKey: ['/api/resources']
  });

  // Fetch PT operations (jobs, operations, and activities)
  const { data: operations, isLoading: loadingOperations } = useQuery<any[]>({
    queryKey: ['/api/pt-operations']
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
      cls: 'resource-row' // Add CSS class for styling
    }));
    
    console.log('Scheduler resources:', schedulerResources);

    // Transform PT operations to events with comprehensive job, operation, and activity data
    const schedulerEvents = operations.map((operation: any, index: number) => {
      // Parse dates from PT data
      const startDate = operation.startTime ? new Date(operation.startTime) : new Date(Date.now() + index * 4 * 60 * 60 * 1000);
      const endDate = operation.endTime ? new Date(operation.endTime) : 
                     new Date(startDate.getTime() + (operation.duration || 120) * 60 * 1000);
      
      // Enhanced colors based on PT status and priority
      const getEventColor = (op: any) => {
        if (op.onHold) return '#FFA500'; // Orange for on hold
        if (op.status === 'completed') return '#4CAF50'; // Green
        if (op.status === 'in_progress') return '#2196F3'; // Blue
        if (op.status === 'delayed') return '#F44336'; // Red
        if (op.priority <= 2) return '#9C27B0'; // Purple for high priority
        return '#757575'; // Gray for scheduled
      };
      
      // Create comprehensive display name: Sequence. Job: Operation (MO)
      const displayName = [
        operation.sequence > 0 ? `${operation.sequence}.` : '',
        operation.jobName || 'Job',
        operation.operationName || 'Operation',
        operation.manufacturingOrderName && operation.manufacturingOrderName !== operation.jobName ? 
          `(MO: ${operation.manufacturingOrderName})` : ''
      ].filter(Boolean).join(' ');
      
      // Enhanced description with timing breakdown
      const timingDetails = [];
      if (operation.setupTime > 0) timingDetails.push(`Setup: ${Math.round(operation.setupTime)}min`);
      if (operation.cycleTime > 0) timingDetails.push(`Cycle: ${Math.round(operation.cycleTime)}min`);
      if (operation.cleanupTime > 0) timingDetails.push(`Cleanup: ${Math.round(operation.cleanupTime)}min`);
      if (operation.postProcessTime > 0) timingDetails.push(`Post: ${Math.round(operation.postProcessTime)}min`);
      
      const description = [
        operation.description || '',
        timingDetails.length > 0 ? `Timing: ${timingDetails.join(', ')}` : '',
        operation.requiredQuantity > 0 ? `Quantity: ${operation.requiredQuantity}` : '',
        operation.productCode ? `Product: ${operation.productCode}` : ''
      ].filter(Boolean).join('\n');
      
      return {
        id: `pt-operation-${operation.id}`,
        name: displayName,
        startDate: startDate,
        endDate: endDate,
        duration: operation.duration || 120,
        durationUnit: 'minute',
        effort: operation.duration || 120,
        effortUnit: 'minute',
        percentDone: operation.completionPercentage || 0,
        priority: operation.priority || 5,
        constraintType: operation.onHold ? 'muststarton' : null,
        constraintDate: operation.onHold ? startDate : null,
        eventColor: getEventColor(operation),
        cls: `pt-event ${operation.onHold ? 'on-hold' : ''} status-${(operation.status || 'scheduled').replace(/[^a-zA-Z0-9]/g, '-')}`,
        
        // PT-specific data
        jobId: operation.jobId,
        jobName: operation.jobName,
        operationId: operation.operationId,
        operationName: operation.operationName,
        manufacturingOrderId: operation.manufacturingOrderId,
        manufacturingOrderName: operation.manufacturingOrderName,
        sequence: operation.sequence || 0,
        productCode: operation.productCode || '',
        outputName: operation.outputName || '',
        requiredQuantity: operation.requiredQuantity || 0,
        onHold: operation.onHold || false,
        holdReason: operation.holdReason || '',
        
        // Activity timing breakdown
        setupTime: operation.setupTime || 0,
        cycleTime: operation.cycleTime || 0,
        cleanupTime: operation.cleanupTime || 0,
        postProcessTime: operation.postProcessTime || 0,
        
        status: operation.status || 'scheduled',
        description: description
      };
    });

    // Create assignments (link PT operations to resources)
    // Use assignedResourceId or workCenterId from PT data
    const schedulerAssignments = operations
      .filter((op: any) => op.assignedResourceId || op.workCenterId)
      .map((operation: any) => ({
        id: `pt-assignment-${operation.id}`,
        eventId: `pt-operation-${operation.id}`,
        resourceId: `resource-${operation.assignedResourceId || operation.workCenterId}`,
        units: operation.onHold ? 0 : 100 // No capacity used if on hold
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
    viewPreset: {
      base: 'weekAndDayLetter',
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
      shiftIncrement: 1,
      shiftUnit: 'month', // Makes navigation move by month
      columnWidth: 50
    },
    barMargin: 1,
    rowHeight: 100, // Increased row height for better visibility
    resourceImagePath: 'users/',
    eventStyle: 'plain' as const,
    eventColor: null, // Let individual events control their color
    scrollable: true, // Enable scrolling to see all resources
    infiniteScroll: false,
    enableTextSelection: false,
    fillLastColumn: false,
    
    // Force all rows to be visible by disabling virtualization
    disableGridRowModelWarning: true,
    
    zoomOnTimeAxisDoubleClick: true,
    zoomOnMouseWheel: true,
    
    // Configure zoom levels
    zoomLevels: [
      {
        name: 'Days',
        preset: {
          base: 'hourAndDay',
          headers: [
            { unit: 'day', dateFormat: 'DD MMM' },
            { unit: 'hour', dateFormat: 'HH' }
          ]
        },
        width: 100
      },
      {
        name: 'Weeks',
        preset: {
          base: 'weekAndDayLetter',
          headers: [
            { unit: 'week', dateFormat: 'w MMM' },
            { unit: 'day', dateFormat: 'DD' }
          ]
        },
        width: 50
      },
      {
        name: 'Months',
        preset: {
          base: 'monthAndYear',
          headers: [
            { unit: 'year', dateFormat: 'YYYY' },
            { unit: 'month', dateFormat: 'MMM' }
          ]
        },
        width: 150
      }
    ],
    
    // Scroll to today on load
    visibleDate: {
      date: new Date(),
      block: 'center' as const
    },
    
    // Add toolbar with navigation and zoom controls
    tbar: {
      items: [
        {
          type: 'button',
          text: 'Previous Month',
          icon: 'b-icon-left',
          onClick: () => {
            const scheduler = schedulerRef.current?.instance;
            if (scheduler) {
              const currentStart = new Date(scheduler.startDate);
              const currentEnd = new Date(scheduler.endDate);
              currentStart.setMonth(currentStart.getMonth() - 1);
              currentEnd.setMonth(currentEnd.getMonth() - 1);
              scheduler.setTimeSpan(currentStart, currentEnd);
            }
          }
        },
        {
          type: 'button',
          text: 'Today',
          onClick: () => {
            const scheduler = schedulerRef.current?.instance;
            if (scheduler) {
              scheduler.scrollToDate(new Date(), { block: 'center', animate: true });
            }
          }
        },
        {
          type: 'button',
          text: 'Next Month',
          icon: 'b-icon-right',
          onClick: () => {
            const scheduler = schedulerRef.current?.instance;
            if (scheduler) {
              const currentStart = new Date(scheduler.startDate);
              const currentEnd = new Date(scheduler.endDate);
              currentStart.setMonth(currentStart.getMonth() + 1);
              currentEnd.setMonth(currentEnd.getMonth() + 1);
              scheduler.setTimeSpan(currentStart, currentEnd);
            }
          }
        },
        '|', // Separator
        {
          type: 'button',
          text: 'Zoom In',
          icon: 'b-icon-search-plus',
          onClick: () => {
            const scheduler = schedulerRef.current?.instance;
            if (scheduler) {
              scheduler.zoomIn();
            }
          }
        },
        {
          type: 'button',
          text: 'Zoom Out',
          icon: 'b-icon-search-minus',
          onClick: () => {
            const scheduler = schedulerRef.current?.instance;
            if (scheduler) {
              scheduler.zoomOut();
            }
          }
        },
        {
          type: 'button',
          text: 'Zoom to Fit',
          icon: 'b-icon-expand',
          onClick: () => {
            const scheduler = schedulerRef.current?.instance;
            if (scheduler) {
              scheduler.zoomToFit();
            }
          }
        }
      ]
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
    }
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
      <style>{`
        /* Ensure scheduler container has proper height */
        .bryntum-scheduler-container .b-schedulerpro {
          min-height: 900px !important;
        }
      `}</style>
      <BryntumSchedulerPro
        ref={schedulerRef}
        {...schedulerConfig}
        resources={schedulerResources}
        events={events}
        assignments={assignments}
        height="800px"
        minHeight="600px"
        autoHeight={true}
      />
    </div>
  );
};

export default BryntumSchedulerProComponent;
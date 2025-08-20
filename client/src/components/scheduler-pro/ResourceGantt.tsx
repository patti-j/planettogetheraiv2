import React, { useMemo, useRef, useState, useEffect } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ResourceGanttProps {
  height?: string;
  startDate?: Date;
  endDate?: Date;
  onExport?: () => void;
}

export default function ResourceGantt({ 
  height = '600px',
  startDate: propStartDate,
  endDate: propEndDate,
  onExport
}: ResourceGanttProps) {
  const schedulerRef = useRef<any>(null);
  const { toast } = useToast();
  
  // Set date range - default to current month
  const startDate = propStartDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1, 8);
  const endDate = propEndDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 18);
  
  // State for managing data
  const [dataState, setDataState] = useState<{
    resources: any[];
    events: any[];
    assignments: any[];
  }>({ resources: [], events: [], assignments: [] });

  // Fetch PT operations (jobs, operations, and activities)
  const { data: ptOperations, isLoading: operationsLoading, refetch: refetchOperations } = useQuery<any[]>({
    queryKey: ['/api/pt-operations']
  });

  // Fetch resources
  const { data: resources, isLoading: resourcesLoading, refetch: refetchResources } = useQuery<any[]>({
    queryKey: ['/api/resources']
  });

  const isLoading = operationsLoading || resourcesLoading;

  // Transform PT data to Scheduler Pro format
  useEffect(() => {
    if (!ptOperations || !resources) return;

    // Transform resources
    const schedulerResources = resources.map((resource: any) => ({
      id: resource.id,
      name: resource.name || `Resource ${resource.id}`,
      type: resource.type || 'default',
      capacity: resource.capacity || 8,
      efficiency: resource.efficiency || 100
    }));

    // Transform PT operations to events
    const schedulerEvents = ptOperations.map((operation: any, index: number) => {
      // Parse dates from PT data
      const opStartDate = operation.startTime ? 
        new Date(operation.startTime) : 
        new Date(startDate.getTime() + index * 2 * 60 * 60 * 1000); // Stagger by 2 hours
      
      const opEndDate = operation.endTime ? 
        new Date(operation.endTime) : 
        new Date(opStartDate.getTime() + (operation.duration || 120) * 60 * 1000);
      
      // Create display name with job and operation details
      const displayName = [
        operation.sequence > 0 ? `${operation.sequence}.` : '',
        operation.jobName || 'Job',
        operation.operationName ? `- ${operation.operationName}` : ''
      ].filter(Boolean).join(' ');
      
      return {
        id: operation.id,
        resourceId: operation.assignedResourceId || operation.workCenterId || resources[index % resources.length]?.id,
        name: displayName,
        startDate: opStartDate,
        endDate: opEndDate,
        // Additional PT-specific fields
        jobId: operation.jobId,
        jobName: operation.jobName,
        operationName: operation.operationName,
        manufacturingOrderName: operation.manufacturingOrderName,
        productCode: operation.productCode,
        requiredQuantity: operation.requiredQuantity || 0,
        status: operation.status || 'scheduled',
        priority: operation.priority || 5,
        onHold: operation.onHold || false,
        percentDone: operation.completionPercentage || 0,
        eventColor: getEventColor(operation)
      };
    });

    // Create assignments (linking events to resources)
    const schedulerAssignments = schedulerEvents.map((event: any) => ({
      id: `assignment-${event.id}`,
      eventId: event.id,
      resourceId: event.resourceId,
      units: event.onHold ? 0 : 100
    }));

    setDataState({
      resources: schedulerResources,
      events: schedulerEvents,
      assignments: schedulerAssignments
    });
  }, [ptOperations, resources, startDate]);

  // Get event color based on status
  const getEventColor = (operation: any) => {
    if (operation.onHold) return '#FFA500'; // Orange for on hold
    if (operation.status === 'completed') return '#4CAF50'; // Green
    if (operation.status === 'in_progress') return '#2196F3'; // Blue
    if (operation.status === 'delayed') return '#F44336'; // Red
    if (operation.priority <= 2) return '#9C27B0'; // Purple for high priority
    return '#757575'; // Gray for scheduled
  };

  // Scheduler configuration
  const schedulerProps = useMemo(() => ({
    startDate,
    endDate,
    viewPreset: 'hourAndDay',
    rowHeight: 60,
    barMargin: 8,
    
    // Data
    resources: dataState.resources,
    events: dataState.events,
    assignments: dataState.assignments,
    
    // Columns configuration
    columns: [
      { 
        type: 'resourceInfo' as const, 
        text: 'Resource', 
        width: 220, 
        field: 'name',
        showEventCount: true
      },
      { 
        text: 'Type', 
        width: 100, 
        field: 'type', 
        align: 'center' as const
      },
      { 
        text: 'Capacity', 
        width: 80, 
        field: 'capacity', 
        align: 'center' as const,
        renderer: ({ value }: any) => `${value}h`
      }
    ],
    
    // Features configuration
    features: {
      // Enable drag & drop with validation
      eventDrag: {
        showTooltip: true,
        constrainDragToResource: false, // Allow moving between resources
        constrainDragToTimeSlot: false, // Allow moving in time
        // Validation function - prevent drops before 7 AM
        validatorFn: ({ startDate: dragStartDate }: any) => {
          const hour = dragStartDate.getHours();
          if (hour < 7) {
            toast({
              title: "Invalid time",
              description: "Operations cannot start before 7:00 AM",
              variant: "destructive"
            });
            return false;
          }
          return true;
        }
      },
      
      // Enable event editing via double-click
      eventEdit: {
        editorConfig: {
          title: 'Edit Operation',
          items: {
            nameField: {
              type: 'text',
              name: 'name',
              label: 'Operation Name'
            },
            resourceField: {
              type: 'combo',
              name: 'resourceId',
              label: 'Resource',
              weight: 200
            },
            startDateField: {
              type: 'datetime',
              name: 'startDate',
              label: 'Start'
            },
            endDateField: {
              type: 'datetime',
              name: 'endDate',
              label: 'End'
            },
            percentDoneField: {
              type: 'number',
              name: 'percentDone',
              label: 'Progress %',
              min: 0,
              max: 100
            }
          }
        }
      },
      
      // Enable event resize
      eventResize: {
        showTooltip: true,
        validatorFn: ({ endDate: resizeEndDate }: any) => {
          const hour = resizeEndDate.getHours();
          if (hour > 22) {
            toast({
              title: "Invalid time",
              description: "Operations cannot end after 10:00 PM",
              variant: "destructive"
            });
            return false;
          }
          return true;
        }
      },
      
      // Resource non-working time
      resourceNonWorkingTime: true,
      
      // Time ranges for showing shifts, breaks, etc.
      timeRanges: {
        showCurrentTimeLine: true,
        showHeaderElements: true
      },
      
      // Dependencies between events
      dependencies: true,
      
      // Event tooltips
      eventTooltip: {
        template: ({ eventRecord }: any) => `
          <div class="b-sch-event-tooltip">
            <h4>${eventRecord.name}</h4>
            ${eventRecord.jobName ? `<p><strong>Job:</strong> ${eventRecord.jobName}</p>` : ''}
            ${eventRecord.operationName ? `<p><strong>Operation:</strong> ${eventRecord.operationName}</p>` : ''}
            ${eventRecord.productCode ? `<p><strong>Product:</strong> ${eventRecord.productCode}</p>` : ''}
            ${eventRecord.requiredQuantity ? `<p><strong>Quantity:</strong> ${eventRecord.requiredQuantity}</p>` : ''}
            <p><strong>Status:</strong> ${eventRecord.status}</p>
            <p><strong>Progress:</strong> ${eventRecord.percentDone}%</p>
            ${eventRecord.onHold ? '<p style="color: orange;"><strong>ON HOLD</strong></p>' : ''}
          </div>
        `
      },
      
      // Sort and filter
      sort: true,
      filter: true,
      
      // Group resources
      group: {
        field: 'type'
      }
    },
    
    // Event listeners
    listeners: {
      // Update React state after drag & drop
      eventDrop: ({ context }: any) => {
        if (context.valid) {
          const instance = schedulerRef.current?.instance;
          if (!instance) return;
          
          // Get updated events from the store
          const updatedEvents = instance.eventStore.records.map((record: any) => ({
            id: record.id,
            resourceId: record.resourceId,
            name: record.name,
            startDate: record.startDate,
            endDate: record.endDate,
            percentDone: record.percentDone,
            eventColor: record.eventColor,
            // Preserve PT-specific data
            jobId: record.jobId,
            jobName: record.jobName,
            operationName: record.operationName,
            manufacturingOrderName: record.manufacturingOrderName,
            productCode: record.productCode,
            requiredQuantity: record.requiredQuantity,
            status: record.status,
            priority: record.priority,
            onHold: record.onHold
          }));
          
          // Update assignments
          const updatedAssignments = instance.assignmentStore.records.map((record: any) => ({
            id: record.id,
            eventId: record.eventId,
            resourceId: record.resourceId,
            units: record.units
          }));
          
          setDataState(prev => ({
            ...prev,
            events: updatedEvents,
            assignments: updatedAssignments
          }));
          
          toast({
            title: "Operation rescheduled",
            description: "The operation has been successfully moved."
          });
        }
      },
      
      // Handle event resize
      eventResizeEnd: ({ context }: any) => {
        if (context.valid) {
          toast({
            title: "Duration updated",
            description: "The operation duration has been adjusted."
          });
        }
      },
      
      // Handle event edit
      afterEventEdit: () => {
        toast({
          title: "Operation updated",
          description: "The operation details have been saved."
        });
      }
    }
  }), [dataState, startDate, endDate, toast]);

  // Handle refresh
  const handleRefresh = async () => {
    await Promise.all([
      refetchOperations(),
      refetchResources()
    ]);
    toast({
      title: "Data refreshed",
      description: "The schedule has been updated with the latest data."
    });
  };

  // Handle zoom
  const handleZoomIn = () => {
    const instance = schedulerRef.current?.instance;
    if (instance) {
      instance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    const instance = schedulerRef.current?.instance;
    if (instance) {
      instance.zoomOut();
    }
  };

  // Handle export
  const handleExport = () => {
    const instance = schedulerRef.current?.instance;
    if (instance && onExport) {
      onExport();
    }
  };

  if (isLoading) {
    return (
      <Card className="h-96 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading schedule data...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Resource Schedule</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          {onExport && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Info message */}
      <Card className="p-3 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Drag & Drop Enabled:</strong> Drag operations to reschedule in time or drop onto another resource to reassign. 
          Operations cannot start before 7:00 AM or end after 10:00 PM. Double-click to edit operation details.
        </p>
      </Card>

      {/* Scheduler */}
      <Card className="p-0 overflow-hidden" style={{ height }}>
        <BryntumSchedulerPro
          ref={schedulerRef}
          {...schedulerProps}
        />
      </Card>
    </div>
  );
}
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Maximize } from 'lucide-react';

export default function ProductionSchedulerReact() {
  const schedulerRef = useRef<any>(null);

  // Fetch operations data
  const { data: operationsData = [], isLoading: isLoadingOps, refetch: refetchOps } = useQuery({
    queryKey: ['/api/pt-operations'],
    refetchInterval: 60000,
  });

  // Fetch resources data  
  const { data: resourcesData = [], isLoading: isLoadingRes, refetch: refetchRes } = useQuery({
    queryKey: ['/api/resources'],
  });

  // Fetch dependencies data
  const { data: dependenciesData = [], refetch: refetchDeps } = useQuery({
    queryKey: ['/api/pt-dependencies'],
  });

  // Transform data for Bryntum - following the documentation pattern
  const [events, setEvents] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [dependencies, setDependencies] = useState<any[]>([]);

  useEffect(() => {
    const opsArray = Array.isArray(operationsData) ? operationsData : [];
    const resArray = Array.isArray(resourcesData) ? resourcesData : [];
    const depsArray = Array.isArray(dependenciesData) ? dependenciesData : [];

    // Transform resources - use actual IDs without prefixes
    const transformedResources = resArray.map((resource: any) => ({
      id: resource.id,
      name: resource.name || resource.resource_name || `Resource ${resource.id}`,
      type: resource.resource_type || 'equipment',
      capacity: resource.capacity || 100
    }));

    // Transform operations to events - use actual IDs without prefixes
    const transformedEvents = opsArray
      .filter((op: any) => op.scheduledStart && op.scheduledEnd)
      .map((op: any) => ({
        id: op.id,
        name: op.name || 'Operation',
        startDate: op.scheduledStart,
        endDate: op.scheduledEnd,
        percentDone: op.percentFinished || 0,
        eventColor: op.jobPriority > 5 ? 'red' : op.jobPriority > 3 ? 'orange' : 'green'
      }));

    // Create assignments - CRITICAL: use 'event' and 'resource' properties
    const transformedAssignments = opsArray
      .filter((op: any) => op.scheduledStart && op.scheduledEnd && op.resourceId)
      .map((op: any, index: number) => ({
        id: index + 1, // Simple numeric ID for assignment
        event: op.id,  // Reference to event ID (no prefix)
        resource: op.resourceId  // Reference to resource ID (no prefix)
      }));

    // Transform dependencies - use actual IDs
    const transformedDependencies = depsArray.map((dep: any, index: number) => ({
      id: index + 1,
      from: dep.from,
      to: dep.to,
      type: dep.type || 2 // Finish-to-Start
    }));

    // Update state with transformed data
    setResources(transformedResources);
    setEvents(transformedEvents);
    setAssignments(transformedAssignments);
    setDependencies(transformedDependencies);

    // Debug log to verify data structure
    console.log('Resources:', transformedResources.length, transformedResources.slice(0, 3));
    console.log('Events:', transformedEvents.length, transformedEvents.slice(0, 3));
    console.log('Assignments:', transformedAssignments.length, transformedAssignments.slice(0, 3));
    console.log('Dependencies:', transformedDependencies.length, transformedDependencies.slice(0, 3));
  }, [operationsData, resourcesData, dependenciesData]);

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    if (!events.length) {
      const now = new Date();
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 2, 0)
      };
    }

    const dates = events
      .filter((e: any) => e.startDate)
      .map((e: any) => new Date(e.startDate).getTime());
    
    if (dates.length === 0) {
      const now = new Date();
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 2, 0)
      };
    }

    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 14);
    
    return { startDate: minDate, endDate: maxDate };
  }, [events]);

  const handleZoomToFit = () => {
    if (schedulerRef.current?.instance) {
      schedulerRef.current.instance.zoomToFit();
    }
  };

  const handleRefresh = () => {
    refetchOps();
    refetchRes();
    refetchDeps();
  };

  const isLoading = isLoadingOps || isLoadingRes;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg">Loading scheduler data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => window.location.href = '/production-schedule'}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Production Schedule
        </Button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Production Scheduler - React Integration
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomToFit}
            className="gap-2"
            title="Fit to View"
          >
            <Maximize className="h-4 w-4" />
            Fit View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Scheduler Component - Data binding per documentation */}
      <div className="flex-1 overflow-hidden">
        <BryntumSchedulerPro
          ref={schedulerRef}
          
          // Data props - passed directly as per documentation
          resources={resources}
          events={events}
          assignments={assignments}
          dependencies={dependencies}
          
          // Time axis configuration
          startDate={startDate}
          endDate={endDate}
          viewPreset="weekAndDayLetter"
          
          // Visual configuration
          barMargin={5}
          rowHeight={45}
          eventColor="eventColor"
          
          // Column configuration
          columns={[
            { 
              text: 'Resource', 
              field: 'name', 
              width: 200,
              tree: true
            },
            { 
              text: 'Type', 
              field: 'type', 
              width: 100 
            },
            {
              text: 'Capacity',
              field: 'capacity',
              width: 80,
              align: 'center'
            }
          ]}
          
          // Features configuration
          eventDragFeature={{
            constrainDragToResource: false,
            showExactDropPosition: true
          }}
          eventResizeFeature={{
            showExactResizePosition: true
          }}
          dependenciesFeature={true}
          timeRangesFeature={{
            showCurrentTimeLine: true
          }}
          
          // Toolbar configuration
          tbar={{
            items: [
              {
                type: 'button',
                text: 'Today',
                icon: 'b-fa b-fa-calendar-day',
                onAction: () => {
                  if (schedulerRef.current?.instance) {
                    schedulerRef.current.instance.scrollToDate(new Date(), { block: 'center' });
                  }
                }
              },
              {
                type: 'button',
                text: 'Zoom to Fit',
                icon: 'b-fa b-fa-expand',
                onAction: handleZoomToFit
              },
              '->',
              {
                type: 'viewpresetcombo'
              }
            ]
          }}
          
          // Event handlers
          onEventDrop={(event: any) => {
            console.log('Event dropped:', event);
            // Here you would update the backend
          }}
          
          onEventResizeEnd={(event: any) => {
            console.log('Event resized:', event);
            // Here you would update the backend
          }}
          
          // Ready handler
          onDataChange={() => {
            // Auto-fit on data load after a short delay
            setTimeout(() => {
              if (schedulerRef.current?.instance) {
                schedulerRef.current.instance.zoomToFit();
              }
            }, 100);
          }}
        />
      </div>
    </div>
  );
}
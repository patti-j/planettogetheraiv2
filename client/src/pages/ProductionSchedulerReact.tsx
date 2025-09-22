import React, { useRef, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Maximize } from 'lucide-react';

export default function ProductionSchedulerReact() {
  const schedulerRef = useRef<any>(null);

  // Fetch operations data
  const { data: operations = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/pt-operations'],
    refetchInterval: 60000,
  });

  // Fetch resources data
  const { data: resources = [] } = useQuery({
    queryKey: ['/api/resources'],
  });

  // Fetch dependencies data
  const { data: dependencies = [] } = useQuery({
    queryKey: ['/api/pt-dependencies'],
  });

  // Configure the scheduler
  const schedulerConfig = useMemo(() => {
    const opsArray = Array.isArray(operations) ? operations : [];
    const resArray = Array.isArray(resources) ? resources : [];
    const depsArray = Array.isArray(dependencies) ? dependencies : [];

    // Transform resources for Bryntum
    const resourcesData = resArray.map((resource: any) => ({
      id: resource.id,
      name: resource.name || resource.resource_name || 'Resource',
      type: resource.resource_type || 'equipment'
    }));

    // Transform operations to events for Bryntum
    const eventsData = opsArray
      .filter((op: any) => op.scheduledStart && op.scheduledEnd)
      .map((op: any) => ({
        id: op.id,
        name: op.name || 'Operation',
        startDate: op.scheduledStart,
        endDate: op.scheduledEnd,
        resourceId: op.resourceId || op.actualResourceId,
        percentDone: op.percentFinished || 0,
        eventColor: op.jobPriority > 5 ? 'red' : op.jobPriority > 3 ? 'orange' : 'green'
      }));

    // Transform dependencies  
    const dependenciesData = depsArray.map((dep: any) => ({
      id: dep.id || `dep_${dep.from}_${dep.to}`,
      from: dep.from,
      to: dep.to,
      type: dep.type || 2 // Finish-to-Start
    }));

    return {
      resources: resourcesData,
      events: eventsData,
      dependencies: dependenciesData,
      assignments: eventsData
        .filter((e: any) => e.resourceId)
        .map((e: any) => ({
          id: `a_${e.id}`,
          event: e.id,
          resource: e.resourceId
        }))
    };
  }, [operations, resources, dependencies]);

  // Calculate date range
  const dateRange = useMemo(() => {
    const opsArray = Array.isArray(operations) ? operations : [];
    const dates = opsArray
      .filter((op: any) => op.scheduledStart)
      .map((op: any) => new Date(op.scheduledStart).getTime());
    
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
    
    return {
      startDate: minDate,
      endDate: maxDate
    };
  }, [operations]);

  const handleZoomToFit = useCallback(() => {
    if (schedulerRef.current?.instance) {
      schedulerRef.current.instance.zoomToFit();
    }
  }, []);

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
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Scheduler Component */}
      <div className="flex-1 overflow-hidden">
        <BryntumSchedulerPro
          ref={schedulerRef}
          
          // Data configuration
          resources={schedulerConfig.resources}
          events={schedulerConfig.events}
          dependencies={schedulerConfig.dependencies}
          assignments={schedulerConfig.assignments}
          
          // Time axis configuration
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
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
            }
          ]}
          
          // Features configuration - using simpler format
          eventDragFeature={true}
          eventResizeFeature={true}
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
              '->',
              {
                type: 'viewpresetcombo'
              }
            ]
          }}
          
          // Event handlers
          onEventDrop={(event: any) => {
            console.log('Event dropped:', event.eventRecords);
          }}
          
          onEventResizeEnd={(event: any) => {
            console.log('Event resized:', event.eventRecord);
          }}
          
          // Ready handler
          onDataChange={() => {
            // Auto-fit on data load
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
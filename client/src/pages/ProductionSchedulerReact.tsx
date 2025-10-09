import React, { useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Maximize } from 'lucide-react';

export default function ProductionSchedulerReact() {
  const schedulerRef = useRef<any>(null);

  // Fetch operations data
  const { data: operationsData = [], isLoading: isLoadingOps, refetch: refetchOps } = useQuery({
    queryKey: ['/pt-operations'],
    refetchInterval: 60000,
  });

  // Fetch resources data  
  const { data: resourcesData = [], isLoading: isLoadingRes, refetch: refetchRes } = useQuery({
    queryKey: ['/pt-resources'],
  });

  // Fetch dependencies data
  const { data: dependenciesData = [], refetch: refetchDeps } = useQuery({
    queryKey: ['/pt-dependencies'],
  });

  // Helper function to assign colors based on operation type (matching standalone HTML version)
  const getOperationColor = (operationName: string): string => {
    if (!operationName) return 'blue';
    const name = operationName.toLowerCase();
    
    // Brewing-specific operations
    if (name.includes('milling') || name.includes('mill')) return '#2563eb'; // Blue
    if (name.includes('mash')) return '#7c3aed'; // Purple  
    if (name.includes('lauter')) return '#0891b2'; // Cyan
    if (name.includes('boil')) return '#dc2626'; // Red
    if (name.includes('ferment') || name.includes('lager')) return '#059669'; // Green
    if (name.includes('condition') || name.includes('dry hop')) return '#0d9488'; // Teal
    if (name.includes('packag')) return '#ea580c'; // Orange
    if (name.includes('pasteur')) return '#7c2d12'; // Brown
    
    // Generic manufacturing operations
    if (name.includes('machining')) return '#2563eb'; // Blue
    if (name.includes('assembly')) return '#059669'; // Green
    if (name.includes('quality') || name.includes('testing')) return '#7c3aed'; // Purple
    if (name.includes('filtration')) return '#0d9488'; // Teal
    if (name.includes('carbonation')) return '#eab308'; // Yellow
    
    return '#2563eb'; // Default blue
  };

  // Helper function to determine operation type from name
  const getOperationType = (operationName: string): string => {
    if (!operationName) return 'unknown';
    const name = operationName.toLowerCase();
    
    // Brewing operations - order matters for specificity
    if (name.includes('decoction')) return 'mashing'; // Decoction is a type of mashing
    if (name.includes('milling') || name.includes('mill')) return 'milling';
    if (name.includes('mash')) return 'mashing';
    if (name.includes('lauter')) return 'lautering';
    if (name.includes('boil')) return 'boiling';
    if (name.includes('ferment')) return 'fermentation';
    if (name.includes('lager')) return 'fermentation'; // Lagering is a type of fermentation
    if (name.includes('condition')) return 'conditioning';
    if (name.includes('dry hop')) return 'conditioning';
    if (name.includes('bright')) return 'conditioning'; // Bright tank operations
    if (name.includes('packag')) return 'packaging';
    if (name.includes('bottle') || name.includes('can')) return 'packaging';
    if (name.includes('pasteur')) return 'pasteurization';
    
    // Generic manufacturing operations
    if (name.includes('machining')) return 'machining';
    if (name.includes('assembly')) return 'assembly';
    if (name.includes('quality') || name.includes('testing')) return 'quality';
    if (name.includes('filtration')) return 'filtration';
    if (name.includes('carbonation')) return 'carbonation';
    
    return 'general';
  };

  // Helper function to determine if a resource can handle an operation type
  const isResourceCompatible = (resourceName: string, operationType: string): boolean => {
    if (!resourceName || !operationType) return false;
    const resource = resourceName.toLowerCase();
    
    // Define compatibility mappings
    const compatibilityMap: Record<string, string[]> = {
      'milling': ['grain mill', 'mill', 'crusher'],
      'mashing': ['mash tun', 'mash vessel', 'mash kettle', 'lauter tun'], // Lauter tun can do mashing too
      'lautering': ['lauter tun', 'lauter vessel'],
      'boiling': ['brew kettle', 'boil kettle', 'kettle', 'copper'],
      'fermentation': ['fermenter', 'fermentation tank', 'fermenting vessel', 'unitank'],
      'conditioning': ['bright tank', 'conditioning tank', 'brite tank', 'maturation tank'],
      'packaging': ['bottling line', 'canning line', 'keg line', 'packaging line', 'bottle filler', 'can filler', 'filler line'],
      'pasteurization': ['pasteurizer', 'flash pasteurizer', 'tunnel pasteurizer'],
      // Generic operations
      'machining': ['cnc machine', 'lathe', 'mill', 'drill press'],
      'assembly': ['assembly line', 'assembly station', 'workstation'],
      'quality': ['inspection station', 'quality control', 'testing lab'],
      'general': [] // General operations can go anywhere (for now)
    };
    
    const allowedResources = compatibilityMap[operationType];
    if (!allowedResources) return true; // If operation type not mapped, allow for now
    if (allowedResources.length === 0) return true; // General operations allowed everywhere
    
    // Check if resource name contains any of the allowed resource types
    return allowedResources.some(allowed => resource.includes(allowed));
  };

  // Transform data using useMemo to avoid re-renders
  const { resources, events, assignments, dependencies } = useMemo(() => {
    const opsArray = Array.isArray(operationsData) ? operationsData : [];
    const resArray = Array.isArray(resourcesData) ? resourcesData : [];
    const depsArray = Array.isArray(dependenciesData) ? dependenciesData : [];

    // Debug log to see what data we have
    console.log('Raw operations data:', opsArray.length, 'items');
    if (opsArray.length > 0) {
      console.log('Sample operation:', opsArray[0]);
      console.log('Operation has startDate?', !!opsArray[0].startDate);
      console.log('Operation has endDate?', !!opsArray[0].endDate);
    }
    console.log('Raw resources data:', resArray.length, 'items');
    if (resArray.length > 0) {
      console.log('Sample resource:', resArray[0]);
    }

    // Transform resources - Use resource_id (STRING) as canonical ID per Bryntum best practices
    const transformedResources = resArray
      .map((resource: any) => ({
        // CRITICAL: Use resource_id (string) as the canonical ID, NOT the numeric id
        id: String(resource.resource_id || resource.id), // resource_id is the STRING identifier
        name: resource.name || resource.resource_name || `Resource ${resource.id}`,
        type: resource.resource_type || resource.category || 'equipment',
        capacity: resource.capacity || resource.efficiency || 100,
        category: resource.plantName || resource.plant_name || 'Default',
        isBottleneck: resource.isBottleneck || false
      }))
      .sort((a, b) => {
        // Sort by numeric value if possible, otherwise alphabetically
        const aNum = parseInt(a.id);
        const bNum = parseInt(b.id);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.id.localeCompare(b.id);
      });

    // Transform operations to events
    const transformedEvents: any[] = [];
    const transformedAssignments: any[] = [];

    opsArray.forEach((op: any) => {
      // Check if operation has required data - PT API returns scheduledStart/scheduledEnd
      const startDate = op.scheduledStart || op.startDate;
      const endDate = op.scheduledEnd || op.endDate;
      
      if (startDate && endDate) {
        // CRITICAL: Ensure event ID is a string for consistency
        const eventId = String(op.id || op.operation_id);
        
        // Create the event - NOTE: Do NOT put resourceId on events when using AssignmentStore
        const operationName = op.name || op.operationName || op.operation_name || 'Operation';
        const event = {
          id: eventId, // Use STRING operation ID for consistency
          name: operationName,
          startDate: new Date(startDate), // Ensure it's a Date object
          endDate: new Date(endDate), // Ensure it's a Date object
          percentDone: op.percentFinished || op.percent_done || 0,
          eventColor: getOperationColor(operationName), // Use operation-based coloring
          // Add custom fields for tooltips/columns
          jobName: op.jobName || op.job_name,
          jobId: op.jobId || op.job_id,
          priority: op.priority || 5,
          dueDate: op.dueDate || op.due_date
        };
        transformedEvents.push(event);

        // Create assignment if there's a resource
        // CRITICAL: Use the STRING resource_id that matches resourceStore.id
        const resourceId = op.resourceId || op.resource_id || op.actual_resource_id;
        if (resourceId) {
          transformedAssignments.push({
            id: `a_${eventId}_${resourceId}`, // Synthetic ID for assignment
            eventId: eventId,  // Must be STRING to match event.id
            resourceId: String(resourceId)  // MUST match the resource.id (string) in resourceStore
          });
        }
      }
    });

    // Transform dependencies - use fromEvent/toEvent per Bryntum documentation
    const transformedDependencies = depsArray.map((dep: any, index: number) => ({
      id: String(index + 1), // String ID for consistency
      fromEvent: String(dep.from || dep.fromEvent || dep.predecessor_operation_id), // String ID
      toEvent: String(dep.to || dep.toEvent || dep.successor_operation_id), // String ID
      type: dep.type || 2, // 2 = Finish-to-Start (default)
      lag: dep.lag || 0,
      lagUnit: dep.lagUnit || 'hour'
    }));

    // Debug log transformed data
    console.log('Transformed resources:', transformedResources);
    console.log('Transformed events (first 3):', transformedEvents.slice(0, 3));
    console.log('Transformed assignments (first 3):', transformedAssignments.slice(0, 3));
    console.log('Transformed dependencies:', transformedDependencies.length);
    console.log('Event/Assignment counts:', {
      resources: transformedResources.length,
      events: transformedEvents.length,
      assignments: transformedAssignments.length,
      dependencies: transformedDependencies.length
    });
    
    // Debug resource ID mapping
    const resourceIds = new Set(transformedResources.map(r => String(r.id)));
    const assignmentResourceIds = new Set(transformedAssignments.map(a => String(a.resourceId)));
    console.log('Resource IDs available:', Array.from(resourceIds).sort());
    console.log('Resource IDs in assignments:', Array.from(assignmentResourceIds).sort());
    console.log('Mismatched resource IDs:', Array.from(assignmentResourceIds).filter(id => !resourceIds.has(id)));

    return {
      resources: transformedResources,
      events: transformedEvents,
      assignments: transformedAssignments,
      dependencies: transformedDependencies
    };
  }, [operationsData, resourcesData, dependenciesData]);

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    if (!events.length) {
      // Default to Aug-Sep 2025 where our PT operations are scheduled
      return {
        startDate: new Date(2025, 7, 15), // Aug 15, 2025
        endDate: new Date(2025, 9, 30) // Oct 30, 2025
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
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg">Loading scheduler data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Scheduler Controls Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Production Scheduler
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

      {/* Debug Info - Remove this in production */}
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-xs">
        <span className="mr-4">Resources: {resources.length}</span>
        <span className="mr-4">Events: {events.length}</span>
        <span className="mr-4">Assignments: {assignments.length}</span>
        <span>Dependencies: {dependencies.length}</span>
      </div>

      {/* Scheduler Component */}
      <div className="flex-1 overflow-hidden">
        <BryntumSchedulerPro
          ref={schedulerRef}
          
          // Data configuration - using stores for resource-centric view
          resources={resources}
          events={events}
          assignments={assignments}
          dependencies={dependencies}
          
          // Enable assignment mode for resource-centric view
          useInitialAnimation={false}
          managedEventSizing={true}
          
          // Time axis configuration
          startDate={startDate}
          endDate={endDate}
          viewPreset="weekAndDayLetter"
          
          // Visual configuration for resource-centric timeline view
          barMargin={2}  // Smaller margin for better visibility
          rowHeight={50}  // Adjusted for optimal resource row display
          eventLayout="stack"  // Stack events on resource rows
          eventColor="eventColor"
          
          // Column configuration
          columns={[
            { 
              text: 'Resource', 
              field: 'name', 
              width: 200
            },
            {
              text: 'Category',
              field: 'category',
              width: 120
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
            },
            {
              text: 'Bottleneck',
              field: 'isBottleneck',
              width: 80,
              align: 'center',
              renderer: ({ value }: any) => value ? '⚠️' : ''
            }
          ]}
          
          // Features configuration per Bryntum best practices 
          eventDragFeature={{
            constrainDragToResource: false,
            showExactDropPosition: true,
            // Validation function to prevent dragging operations to incompatible resources
            validatorFn: ({ context }: any) => {
              const targetResource = context.newResource;
              const eventRecords = context.eventRecords;
              
              // If no target resource or no events being dragged, allow
              if (!targetResource || !eventRecords || eventRecords.length === 0) {
                return true;
              }
              
              // Get the first event being dragged
              const draggedEvent = eventRecords[0];
              if (!draggedEvent || !draggedEvent.name) {
                return true;
              }
              
              // Determine operation type from the event name
              const operationType = getOperationType(draggedEvent.name);
              
              // Check if the target resource can handle this operation type
              const isCompatible = isResourceCompatible(targetResource.name, operationType);
              
              // Log validation for debugging
              if (!isCompatible) {
                console.warn(
                  `❌ Cannot assign "${draggedEvent.name}" (${operationType}) to "${targetResource.name}" - incompatible resource type`
                );
              }
              
              return isCompatible;
            }
          }}
          eventResizeFeature={{
            showExactResizePosition: true
          }}
          dependenciesFeature={true}
          timeRangesFeature={{
            showCurrentTimeLine: true
          }}
          stripeFeature={true}  // Add striping for better row visibility
          percentBarFeature={true}  // Show percentage completion bars
          
          // Toolbar configuration
          tbar={{
            items: [
              {
                type: 'button',
                text: 'Today',
                icon: 'fa fa-calendar-day',
                onAction: () => {
                  if (schedulerRef.current?.instance) {
                    schedulerRef.current.instance.scrollToDate(new Date(), { block: 'center' });
                  }
                }
              },
              {
                type: 'button',
                text: 'Zoom to Fit',
                icon: 'fa fa-expand',
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
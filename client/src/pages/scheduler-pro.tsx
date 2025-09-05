import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Users, 
  Activity, 
  ZoomIn, 
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Home
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

// Add Bryntum CSS
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';

// Type assertion for Bryntum UMD global  
type BryntumGlobal = any;

export default function SchedulerPro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const schedulerRef = useRef<any>(null);
  const [currentViewPreset, setCurrentViewPreset] = useState('weekAndDay');
  const [isSchedulerReady, setIsSchedulerReady] = useState(false);
  const { toast } = useToast();

  // Fetch resources and PT operations data
  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['/api/resources'],
    enabled: true
  });
  
  const { data: ptOperations, isLoading: operationsLoading } = useQuery({
    queryKey: ['/api/pt-operations'],
    enabled: true
  });
  
  const isLoading = resourcesLoading || operationsLoading;

  // Initialize the vanilla JavaScript Bryntum SchedulerPro
  useEffect(() => {
    if (!containerRef.current || !resources || !ptOperations || isLoading) return;

    // Cleanup function for previous instance
    if (schedulerRef.current) {
      schedulerRef.current.destroy();
      schedulerRef.current = null;
    }

    try {
      // Check if Bryntum is loaded
      const bryntumWindow = window as any;
      if (!bryntumWindow.bryntum?.schedulerpro) {
        console.error('Bryntum SchedulerPro not loaded');
        toast({
          title: "Error",
          description: "Scheduler library not loaded. Please refresh the page.",
          variant: "destructive"
        });
        return;
      }

      const { SchedulerPro } = bryntumWindow.bryntum.schedulerpro as BryntumGlobal;

    // Helper function to assign colors based on operation type
    const getOperationColor = (operationName: string) => {
      const colors: any = {
        'Milling': '#4CAF50',
        'Mashing': '#2196F3',
        'Lautering': '#FF9800',
        'Boiling': '#F44336',
        'Whirlpool': '#9C27B0',
        'Cooling': '#00BCD4',
        'Fermentation': '#795548',
        'Equipment Maintenance': '#607D8B',
        'Packaging': '#FFEB3B',
        'Assembly': '#3F51B5'
      };
      return colors[operationName] || '#9E9E9E';
    };

    // Map resources to create resource lookup
    const resourceMap = new Map();
    const resourceByName = new Map();
    
    // First, map existing resources from API with proper prefixing
    const apiResources = (resources as any[]).map((resource: any) => {
      const resourceObj = {
        id: `r_${resource.id}`, // Use prefixed IDs
        name: resource.name,
        category: resource.type || 'General',
        originalId: resource.id // Keep original ID for matching
      };
      resourceMap.set(resource.id.toString(), resourceObj);
      resourceByName.set(resource.name.toLowerCase(), resourceObj);
      return resourceObj;
    });
    
    // Collect unique resource names from operations that don't exist in API
    const missingResources = new Set<string>();
    (ptOperations as any[]).forEach((op: any) => {
      if (op.resourceName && !resourceByName.has(op.resourceName.toLowerCase())) {
        missingResources.add(op.resourceName);
      }
    });
    
    // Create resources for missing ones from operations
    let nextId = 1000; // Start with a high ID to avoid conflicts
    const additionalResources = Array.from(missingResources).map(name => {
      const resourceObj = {
        id: `r_${nextId++}`, // Use prefixed IDs
        name: name,
        category: 'Operations',
        originalId: nextId - 1 // Keep original ID for matching
      };
      resourceByName.set(name.toLowerCase(), resourceObj);
      return resourceObj;
    });
    
    // Combine all resources and only include ones that have operations
    const allResources = [...apiResources, ...additionalResources];
    
    // Get resource IDs that actually have operations
    const resourcesWithOps = new Set<string>();
    (ptOperations as any[]).forEach((op: any) => {
      if (op.resourceName) {
        const resource = resourceByName.get(op.resourceName.toLowerCase());
        if (resource) {
          resourcesWithOps.add(resource.id);
        }
      }
    });
    
    // Filter to only include resources that have operations
    const bryntumResources = allResources.filter(r => resourcesWithOps.has(r.id));
    
    // Helper function to find the correct resource ID
    const findResourceId = (operation: any) => {
      // Try to match by resource name first (most reliable)
      if (operation.resourceName) {
        const resource = resourceByName.get(operation.resourceName.toLowerCase());
        if (resource) return resource.id;
      }
      // Fallback to first available resource
      return bryntumResources[0]?.id || '1';
    };
    
    // Transform PT operations into events with proper ID prefixing
    const events = (ptOperations as any[]).map((op: any, index: number) => {
      const startDate = new Date(op.startTime);
      const endDate = op.endTime ? new Date(op.endTime) : 
                      new Date(startDate.getTime() + (op.duration || 4) * 60 * 60 * 1000);
      
      const eventId = `e_${op.id || index + 1}`; // Use prefixed IDs
      const resourceId = findResourceId(op); // Get the resource ID for single assignment mode
      
      return {
        id: eventId,
        name: `${op.jobName}: ${op.operationName}`,
        startDate: startDate,
        endDate: endDate,
        duration: op.duration || 4,
        durationUnit: 'hour',
        resourceId: resourceId, // Include resourceId for single assignment mode
        percentDone: op.percentDone || 0,
        eventColor: getOperationColor(op.operationName)
      };
    });
    
    // Create assignments to link events to resources with proper prefixes
    const assignments = (ptOperations as any[]).map((op: any, index: number) => {
      const eventId = `e_${op.id || index + 1}`;
      const resourceId = findResourceId(op);
      
      return {
        id: `a_${op.id || index + 1}_${index}`, // Prefixed assignment ID
        eventId: eventId,
        resourceId: resourceId,
        units: 100 // Add units property like the wrapper component
      };
    });
    
    console.log('Initializing Bryntum with:', {
      resources: bryntumResources.length,
      apiResources: apiResources.length,
      additionalResources: additionalResources.length,
      events: events.length
    });
    
    // Log resource distribution for debugging using assignments
    const resourceDistribution: any = {};
    const resourceNameDistribution: any = {};
    assignments.forEach(assignment => {
      resourceDistribution[assignment.resourceId] = (resourceDistribution[assignment.resourceId] || 0) + 1;
      const resource = bryntumResources.find(r => r.id === assignment.resourceId);
      if (resource) {
        resourceNameDistribution[resource.name] = (resourceNameDistribution[resource.name] || 0) + 1;
      }
    });
    console.log('Resource distribution by ID:', resourceDistribution);
    console.log('Resource distribution by name:', resourceNameDistribution);
    console.log('Sample resources:', bryntumResources.slice(0, 5));

      // Ensure container has proper dimensions
      if (containerRef.current) {
        containerRef.current.style.height = '600px';
        containerRef.current.style.minHeight = '600px';
      }
      
      // Create the SchedulerPro instance using vanilla JavaScript
      schedulerRef.current = new SchedulerPro({
        appendTo: containerRef.current,
      
      // Disable ResizeObserver to prevent loop errors
      monitorResize: false,
      
      // Add error handlers
      listeners: {
        exception: (event: any) => {
          console.error('Scheduler exception:', event.message || 'Unknown error');
        },
        dataError: (event: any) => {
          console.error('Scheduler data error:', event.message || 'Unknown error');
        }
      },
      
      // Create an empty project with single assignment mode enabled
      project: {
        autoLoad: false,
        autoSync: false,
        eventStore: {
          singleAssignment: true  // Critical: Enable single assignment mode
        }
      },
      
      // Time axis configuration
      startDate: new Date('2025-08-20'),
      endDate: new Date('2025-09-10'),
      viewPreset: currentViewPreset,
      
      // Auto calculate project dates
      autoCalculateStartDate: false,
      autoCalculateEndDate: false,
      
      // Layout configuration
      rowHeight: 60,
      barMargin: 5,
      autoHeight: false,
      
      // Resource columns
      columns: [
        {
          text: 'Resource',
          field: 'name',
          width: 200,
          locked: true
        },
        {
          text: 'Category',
          field: 'category',
          width: 150
        }
      ],
      
      // Features configuration
      features: {
        eventDrag: true,
        eventResize: true,
        eventTooltip: true,
        timeRanges: {
          showCurrentTimeLine: true
        },
        columnLines: true,
        stripe: true,
        dependencies: false, // Disable for performance
        criticalPaths: false, // Disable for performance
        filterBar: false,
        tree: false
      }
    });
      
      // Load the data directly into stores after scheduler is created
      if (schedulerRef.current) {
        // Access the stores directly
        const resourceStore = schedulerRef.current.resourceStore;
        const eventStore = schedulerRef.current.eventStore;
        
        // Load data into stores (no assignments needed in single assignment mode)
        if (resourceStore) {
          resourceStore.data = bryntumResources;
        }
        if (eventStore) {
          eventStore.data = events;
        }
        // Don't load assignments - using resourceId directly with single assignment mode
      }
      
      // Force refresh and log resource store after initialization
      setTimeout(() => {
        if (schedulerRef.current) {
          schedulerRef.current.refresh();
          const resourceCount = schedulerRef.current.resourceStore?.count || 0;
          const eventCount = schedulerRef.current.eventStore?.count || 0;
          console.log('Scheduler refreshed - Resources in store:', resourceCount, 'Events in store:', eventCount);
          
          // Log first few resources to debug
          const storeResources = schedulerRef.current.resourceStore?.records || [];
          console.log('Resources in scheduler store:', storeResources.slice(0, 5).map((r: any) => ({ id: r.id, name: r.name })));
          
          // Try to force refresh and show all resources
          schedulerRef.current.scrollRowIntoView(0, { block: 'start' });
          
          // Log successful load
          console.log('Scheduler fully loaded');
        }
      }, 100);
      
      setIsSchedulerReady(true);
      console.log('Bryntum SchedulerPro initialized successfully');
    } catch (error: any) {
      console.error('Failed to initialize Bryntum SchedulerPro:', error?.message || error);
      console.error('Error stack:', error?.stack);
      toast({
        title: "Error",
        description: error?.message || "Failed to initialize scheduler. Please try refreshing the page.",
        variant: "destructive"
      });
    }

    // Cleanup function
    return () => {
      try {
        if (schedulerRef.current) {
          schedulerRef.current.destroy();
          schedulerRef.current = null;
          setIsSchedulerReady(false);
        }
      } catch (error) {
        console.error('Error destroying scheduler:', error);
      }
    };
  }, [resources, ptOperations, isLoading, toast]);

  // Update view preset when state changes
  useEffect(() => {
    if (schedulerRef.current && isSchedulerReady) {
      schedulerRef.current.viewPreset = currentViewPreset;
    }
  }, [currentViewPreset, isSchedulerReady]);

  // Toolbar actions
  const handleZoomIn = () => {
    if (schedulerRef.current) {
      schedulerRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (schedulerRef.current) {
      schedulerRef.current.zoomOut();
    }
  };

  const handleZoomToFit = () => {
    if (schedulerRef.current) {
      schedulerRef.current.zoomToFit();
    }
  };

  const handlePreviousTimeSpan = () => {
    if (schedulerRef.current) {
      schedulerRef.current.shiftPrevious();
    }
  };

  const handleNextTimeSpan = () => {
    if (schedulerRef.current) {
      schedulerRef.current.shiftNext();
    }
  };

  const handleToday = () => {
    if (schedulerRef.current) {
      schedulerRef.current.scrollToDate(new Date(), { block: 'center' });
    }
  };

  const changeViewPreset = (preset: string) => {
    setCurrentViewPreset(preset);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading scheduler data...</p>
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
              disabled={!isSchedulerReady}
            >
              Hour
            </Button>
            <Button
              variant={currentViewPreset === 'weekAndDay' ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeViewPreset('weekAndDay')}
              disabled={!isSchedulerReady}
            >
              Day
            </Button>
            <Button
              variant={currentViewPreset === 'weekAndMonth' ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeViewPreset('weekAndMonth')}
              disabled={!isSchedulerReady}
            >
              Week
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
              disabled={!isSchedulerReady}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleToday}
              title="Go to today"
              disabled={!isSchedulerReady}
            >
              <Home className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextTimeSpan}
              title="Next time span"
              disabled={!isSchedulerReady}
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
              disabled={!isSchedulerReady}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              title="Zoom out"
              disabled={!isSchedulerReady}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomToFit}
              title="Zoom to fit"
              disabled={!isSchedulerReady}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Scheduler Container */}
      <div className="flex-1 overflow-hidden p-4">
        <Card className="h-full">
          <CardContent className="p-0 h-full relative">
            {/* This div will contain the vanilla JS Bryntum SchedulerPro */}
            <div ref={containerRef} className="w-full h-full" />
            
            {/* Show loading overlay while scheduler initializes */}
            {!isSchedulerReady && ptOperations && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Initializing scheduler...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Bar */}
      <div className="border-t">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {ptOperations ? `${new Set((ptOperations as any[]).map((op: any) => op.resourceName)).size} Resources` : '0 Resources'}
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              {ptOperations ? `${(ptOperations as any[]).length} Operations` : '0 Operations'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Set display name for debugging
SchedulerPro.displayName = 'SchedulerPro';
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

// Extend Window interface for Bryntum UMD
interface BryntumWindow extends Window {
  bryntum?: {
    schedulerpro?: {
      SchedulerPro: any;
    };
  };
}

export default function SchedulerPro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const schedulerRef = useRef<any>(null);
  const [currentViewPreset, setCurrentViewPreset] = useState('weekAndDay');
  const [isSchedulerReady, setIsSchedulerReady] = useState(false);
  const { toast } = useToast();

  // Fetch PT operations data
  const { data: ptOperations, isLoading } = useQuery({
    queryKey: ['/api/pt-operations'],
    enabled: true
  });

  // Initialize the vanilla JavaScript Bryntum SchedulerPro
  useEffect(() => {
    if (!containerRef.current || !ptOperations || isLoading) return;

    try {
      // Check if Bryntum is loaded
      const bryntumWindow = window as BryntumWindow;
      if (!bryntumWindow.bryntum?.schedulerpro) {
        console.error('Bryntum SchedulerPro not loaded');
        toast({
          title: "Error",
          description: "Scheduler library not loaded. Please refresh the page.",
          variant: "destructive"
        });
        return;
      }

      const { SchedulerPro } = bryntumWindow.bryntum.schedulerpro;

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

    // Extract unique resources from PT operations
    const resourceMap = new Map();
    const events: any[] = [];
    
    // First pass: collect all unique resources
    (ptOperations as any[]).forEach((op: any) => {
      const resourceName = op.resourceName || 'Unassigned';
      if (!resourceMap.has(resourceName)) {
        // Use the resource name as the ID for proper mapping
        resourceMap.set(resourceName, {
          id: resourceName,
          name: resourceName
        });
      }
    });
    
    // Second pass: create events with correct resourceId
    (ptOperations as any[]).forEach((op: any, index: number) => {
      const resourceName = op.resourceName || 'Unassigned';
      const startDate = new Date(op.startTime);
      const endDate = op.endTime ? new Date(op.endTime) : 
                      new Date(startDate.getTime() + (op.duration || 4) * 60 * 60 * 1000);
      
      events.push({
        id: `event_${op.id || index}`,
        name: `${op.jobName}: ${op.operationName}`,
        startDate: startDate,
        endDate: endDate,
        duration: op.duration || 4,
        durationUnit: 'hour',
        resourceId: resourceName, // Use resource name as ID directly
        percentDone: op.percentDone || 0,
        eventColor: getOperationColor(op.operationName)
      });
    });
    
    const resources = Array.from(resourceMap.values());
    
    console.log('Initializing Bryntum with:', {
      resources: resources.length,
      events: events.length
    });
    
    // Log resource distribution for debugging
    const resourceDistribution: any = {};
    events.forEach(event => {
      resourceDistribution[event.resourceId] = (resourceDistribution[event.resourceId] || 0) + 1;
    });
    console.log('Resource distribution:', resourceDistribution);
    console.log('Sample resources:', resources.slice(0, 3));
    console.log('Sample events:', events.slice(0, 3));

      // Create the SchedulerPro instance using vanilla JavaScript
      schedulerRef.current = new SchedulerPro({
        appendTo: containerRef.current,
      
      // Project configuration
      project: {
        resources: resources,
        events: events
      },
      
      // Time axis configuration
      startDate: '2025-08-20',
      endDate: '2025-09-10',
      viewPreset: currentViewPreset,
      
      // Layout configuration
      rowHeight: 50,
      barMargin: 5,
      
      // Resource columns
      columns: [
        {
          text: 'Resource',
          field: 'name',
          width: 200
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
          criticalPaths: false // Disable for performance
        }
      });
      
      setIsSchedulerReady(true);
      console.log('Bryntum SchedulerPro initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Bryntum SchedulerPro:', error);
      toast({
        title: "Error",
        description: "Failed to initialize scheduler. Please try refreshing the page.",
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
  }, [ptOperations, isLoading, toast]);

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
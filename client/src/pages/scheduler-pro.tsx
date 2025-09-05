import React, { useRef, useEffect, useState } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';
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

export default function SchedulerPro() {
  const schedulerRef = useRef<any>(null);
  const [schedulerInstance, setSchedulerInstance] = useState<any>(null);
  const [currentViewPreset, setCurrentViewPreset] = useState('weekAndDay');
  const { toast } = useToast();

  // Fetch PT data for the scheduler
  const { data: ptOperations, isLoading } = useQuery({
    queryKey: ['/api/pt-operations'],
    enabled: true
  });

  // Prepare scheduler config with inline data
  const schedulerConfig = React.useMemo(() => {
    if (!ptOperations || ptOperations.length === 0) {
      return null;
    }
    
    // Extract unique resources
    const resourceMap = new Map();
    const events: any[] = [];
    const assignments: any[] = [];
    
    ptOperations.forEach((op: any, index: number) => {
      // Use resourceName as unique key
      const resourceName = op.resourceName || `Resource ${index}`;
      
      // Add unique resource
      if (!resourceMap.has(resourceName)) {
        resourceMap.set(resourceName, {
          id: resourceName,
          name: resourceName
        });
      }
      
      // Create event
      const eventId = `event_${op.id || index}`;
      const startDate = new Date(op.startTime);
      const endDate = op.endTime ? new Date(op.endTime) : 
                      new Date(startDate.getTime() + (op.duration || 4) * 60 * 60 * 1000);
      
      events.push({
        id: eventId,
        name: `${op.operationName}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      // Create assignment
      assignments.push({
        id: `assign_${index}`,
        event: eventId,
        resource: resourceName
      });
    });
    
    const resources = Array.from(resourceMap.values());
    
    console.log('Scheduler Config:', {
      resources: resources.length,
      events: events.length,
      assignments: assignments.length
    });
    
    return {
      project: {
        resources: resources,
        events: events,
        assignments: assignments
      },
      startDate: '2025-08-22',
      endDate: '2025-09-05',
      viewPreset: currentViewPreset,
      rowHeight: 50,
      barMargin: 5,
      columns: [
        {
          text: 'Resource',
          field: 'name',
          width: 200
        }
      ],
      features: {
        eventDrag: false,
        eventResize: false,
        eventEdit: false,
        cellEdit: false,
        taskEdit: false,
        dependencies: false,
        timeRanges: {
          showCurrentTimeLine: true
        }
      }
    };
  }, [ptOperations, currentViewPreset]);

  // Capture scheduler instance
  useEffect(() => {
    if (!schedulerRef.current) return;
    
    const timer = setTimeout(() => {
      const instance = schedulerRef.current?.instance;
      if (instance) {
        setSchedulerInstance(instance);
        console.log('Scheduler instance ready');
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [schedulerConfig]);

  // Toolbar actions
  const handleZoomIn = () => {
    schedulerInstance?.zoomIn?.();
  };

  const handleZoomOut = () => {
    schedulerInstance?.zoomOut?.();
  };

  const handleZoomToFit = () => {
    schedulerInstance?.zoomToFit?.();
  };

  const handlePreviousTimeSpan = () => {
    schedulerInstance?.shiftPrevious?.();
  };

  const handleNextTimeSpan = () => {
    schedulerInstance?.shiftNext?.();
  };

  const handleToday = () => {
    schedulerInstance?.scrollToDate?.(new Date(), { block: 'center' });
  };

  const changeViewPreset = (preset: string) => {
    if (schedulerInstance) {
      schedulerInstance.viewPreset = preset;
    }
  };

  if (isLoading || !schedulerConfig) {
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
        </div>
      </div>

      {/* Scheduler Container */}
      <div className="flex-1 overflow-hidden p-4">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <BryntumSchedulerPro
              ref={schedulerRef}
              {...schedulerConfig}
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
              {schedulerConfig.project.resources.length} Resources
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              {schedulerConfig.project.events.length} Operations
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Set display name for debugging
SchedulerPro.displayName = 'SchedulerPro';
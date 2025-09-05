import React, { useRef, useEffect, useState } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Users, 
  Activity, 
  Settings, 
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
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch PT data for the scheduler
  const { data: ptOperations } = useQuery({
    queryKey: ['/api/pt-operations'],
    enabled: true
  });

  // Simple project configuration object
  const projectConfig = React.useMemo(() => {
    if (!ptOperations || ptOperations.length === 0) return null;
    
    // Extract unique resources from operations
    const resourceMap = new Map();
    const eventList: any[] = [];
    const assignmentList: any[] = [];
    
    ptOperations.forEach((op: any, index: number) => {
      const resourceId = String(op.assignedResourceId || op.resourceId || '1');
      const resourceName = op.assignedResourceName || op.resourceName || 'Resource';
      
      // Add resource if not already in map
      if (!resourceMap.has(resourceId)) {
        resourceMap.set(resourceId, {
          id: resourceId,
          name: resourceName,
          type: 'Machine'
        });
      }
      
      // Create event
      const eventId = String(op.id || index);
      const startDate = new Date(op.startTime);
      const endDate = op.endTime ? new Date(op.endTime) : new Date(startDate.getTime() + (op.duration || 4) * 60 * 60 * 1000);
      
      eventList.push({
        id: eventId,
        name: `${op.jobName}: ${op.operationName}`,
        startDate: startDate,
        endDate: endDate,
        duration: op.duration || 4,
        durationUnit: 'hour'
      });
      
      // Create assignment
      assignmentList.push({
        id: `${eventId}_${resourceId}`,
        event: eventId,
        resource: resourceId
      });
    });
    
    const resources = Array.from(resourceMap.values());
    
    console.log(`Prepared data: ${resources.length} resources, ${eventList.length} events`);
    
    return {
      resources: resources,
      events: eventList,
      assignments: assignmentList
    };
  }, [ptOperations]);

  // Set loading state based on data
  useEffect(() => {
    if (projectConfig) {
      setIsLoading(false);
    }
  }, [projectConfig]);

  // Capture scheduler instance after mount
  useEffect(() => {
    if (!schedulerRef.current) return;
    
    const timer = setTimeout(() => {
      const instance = schedulerRef.current?.instance;
      if (instance) {
        setSchedulerInstance(instance);
        console.log('Scheduler instance captured');
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isLoading]);

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
      setCurrentViewPreset(preset);
    }
  };

  if (isLoading || !projectConfig) {
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
              
              // Simple inline project configuration
              resources={projectConfig.resources}
              events={projectConfig.events}
              assignments={projectConfig.assignments}
              
              // Time axis configuration
              startDate="2025-08-22"
              endDate="2025-09-05"
              viewPreset={currentViewPreset}
              
              // Layout configuration
              rowHeight={50}
              barMargin={5}
              
              // Resource columns
              columns={[
                {
                  type: 'resourceInfo',
                  text: 'Resource',
                  width: 250,
                  showEventCount: true
                },
                {
                  text: 'Type',
                  field: 'type',
                  width: 100
                }
              ]}
              
              // Basic features only
              features={{
                eventDrag: true,
                eventResize: true,
                eventTooltip: true,
                timeRanges: {
                  showCurrentTimeLine: true
                },
                columnLines: true,
                stripe: true
              }}
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
              {projectConfig.resources.length} Resources
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              {projectConfig.events.length} Operations
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Set display name for debugging
SchedulerPro.displayName = 'SchedulerPro';
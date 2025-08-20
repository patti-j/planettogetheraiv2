import React, { useRef, useCallback, useState } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';
import { Chart } from 'chart.js/auto';
import { useQuery, useMutation } from '@tanstack/react-query';
import { addHours } from 'date-fns';
import { ZoomIn, ZoomOut, RotateCcw, Activity, AlertCircle, Zap, Settings2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Resource {
  id: string; // Using external_id as the id for Bryntum
  name: string;
  type?: string;
  description?: string;
  plant_name?: string;
  dbId?: number; // Store the actual database id separately
}

interface Event {
  id: number;
  name: string;
  resourceId: string;
  startDate: string;
  endDate: string;
  percentDone?: number;
}

export default function ResourceTimelineFixed() {
  const schedulerRef = useRef<any>(null);
  const [optimizationMode, setOptimizationMode] = useState<'asap' | 'alap' | 'critical-path' | 'resource-level'>('asap');
  const [engineStatus, setEngineStatus] = useState<'idle' | 'calculating' | 'optimizing'>('idle');

  // Fetch resources from PT tables
  const { data: rawResources = [], isLoading: loadingResources } = useQuery<any[]>({
    queryKey: ['/api/pt-resources-clean']
  });

  // Transform resources for Bryntum (use external_id as id)
  const resources = rawResources.map(r => ({
    id: r.external_id, // Use external_id as the Bryntum id
    name: r.name,
    type: r.type,
    description: r.description,
    plant_name: r.plant_name,
    dbId: r.id // Keep the database id for API calls
  }));

  // Fetch operations and transform for Bryntum
  const { data: rawOperations = [], isLoading: loadingOperations, refetch: refetchOperations } = useQuery<any[]>({
    queryKey: ['/api/pt-operations']
  });

  // Transform operations to events for Bryntum
  const events = rawOperations
    .filter(op => {
      const hasValidDates = (op.startTime || op.start_time) && (op.endTime || op.end_time);
      return hasValidDates;
    })
    .map(op => ({
      id: op.id,
      name: op.name,
      resourceId: op.assignedResourceId || op.resourceId || op.resource_id,
      startDate: op.startTime || op.start_time || op.startDate,
      endDate: op.endTime || op.end_time || op.endDate,
      percentDone: op.completionPercentage || op.percentFinished || op.percent_done || op.percentDone || 0
    }));

  // Mutation for updating operation schedule
  const updateOperationMutation = useMutation({
    mutationFn: async ({ operationId, resourceId, startDate }: { operationId: number, resourceId: string, startDate: Date }) => {
      // Find the resource by external_id to get its database id
      const resource = resources.find(r => r.id === resourceId);
      if (!resource) {
        throw new Error('Resource not found');
      }
      
      // Find the operation to get its duration
      const operation = events.find(op => op.id === operationId);
      const durationHours = operation ? 
        (new Date(operation.endDate).getTime() - new Date(operation.startDate).getTime()) / (1000 * 60 * 60) : 
        2;
      const endDate = addHours(startDate, durationHours);
      
      console.log('Updating operation:', {
        operationId,
        resourceId,
        resourceDbId: resource.dbId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      // Use the PT operations update endpoint with correct field names
      return await apiRequest('PUT', `/api/pt-operations/${operationId}`, {
        resourceId: resource.dbId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
    },
    onSuccess: async () => {
      toast({
        title: "Operation Updated",
        description: "The operation has been successfully rescheduled.",
      });
      
      // Refetch operations to update the timeline
      await refetchOperations();
    },
    onError: (error: any) => {
      console.error('Failed to update operation:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update the operation schedule.",
        variant: "destructive",
      });
    }
  });

  // Event handlers
  const handleEventDrop = useCallback(({ context }: any) => {
    console.log('eventDrop fired - context:', context);
    
    const eventRecord = context.eventRecords?.[0];
    const targetResource = context.resourceRecord;
    
    if (eventRecord && targetResource) {
      const newResourceId = targetResource.id;
      const newStartDate = context.startDate || eventRecord.startDate;
      
      console.log('Event dropped successfully:', {
        eventId: eventRecord.id,
        eventName: eventRecord.name,
        oldResourceId: eventRecord.resourceId,
        newResourceId: newResourceId,
        newResourceName: targetResource.name,
        newStartDate: newStartDate
      });
      
      // Update operation in backend
      updateOperationMutation.mutate({
        operationId: eventRecord.id,
        resourceId: newResourceId,
        startDate: newStartDate
      });
    }
  }, [updateOperationMutation]);

  const handleEventResizeEnd = useCallback(({ eventRecord, startDate }: any) => {
    console.log('Event resize completed:', {
      id: eventRecord.id,
      startDate
    });
    
    // Update operation duration in database
    updateOperationMutation.mutate({
      operationId: eventRecord.id,
      resourceId: eventRecord.resourceId,
      startDate: startDate
    });
  }, [updateOperationMutation]);

  const handleBeforeEventDropFinalize = useCallback(({ context }: any) => {
    console.log('beforeEventDropFinalize - context:', context);
    // Validate the drop - return false to cancel, true to allow
    return true; // Allow all drops for now
  }, []);

  // Optimization function
  const runOptimization = useCallback(() => {
    if (!schedulerRef.current) return;
    
    const scheduler = schedulerRef.current.instance;
    const project = scheduler.project;
    
    setEngineStatus('optimizing');
    
    // Apply different optimization strategies
    switch (optimizationMode) {
      case 'asap':
        project.schedulingDirection = 'forward';
        break;
      case 'alap':
        project.schedulingDirection = 'backward';
        break;
      case 'critical-path':
        project.calculateCriticalPath = true;
        break;
      case 'resource-level':
        project.levelResources = true;
        break;
    }
    
    // Trigger recalculation
    project.commitAsync().then(() => {
      setEngineStatus('idle');
      toast({
        title: "Schedule Optimized",
        description: `Applied ${optimizationMode.toUpperCase()} optimization algorithm`,
      });
    });
  }, [optimizationMode]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (schedulerRef.current) {
      schedulerRef.current.instance.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (schedulerRef.current) {
      schedulerRef.current.instance.zoomOut();
    }
  }, []);

  const handleZoomToFit = useCallback(() => {
    if (schedulerRef.current) {
      schedulerRef.current.instance.zoomToFit();
    }
  }, []);

  if (loadingResources || loadingOperations) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading schedule data...</p>
        </div>
      </div>
    );
  }

  // Bryntum Scheduler Pro configuration - SEPARATED into config and listeners
  const schedulerConfig = {
    // Data
    resources,
    events,
    
    // Basic configuration
    startDate: new Date(2025, 7, 19), // August 19, 2025
    endDate: new Date(2025, 8, 2),    // September 2, 2025
    viewPreset: 'hourAndDay',
    rowHeight: 50,
    barMargin: 5,
    
    // Columns configuration
    columns: [
      {
        text: 'Resource',
        field: 'name',
        width: 200,
        locked: true
      },
      {
        text: 'Type',
        field: 'type',
        width: 100,
        locked: true
      },
      {
        text: 'Plant',
        field: 'plant_name',
        width: 120,
        locked: true
      }
    ],
    
    // Features
    features: {
      // Enable drag and drop - SIMPLIFIED configuration like the working demo
      eventDrag: {
        showTooltip: true,
        validatorFn: () => true // Allow all drags
      },
      
      // Enable resize
      eventResize: {
        showExactResizePosition: true,
        showTooltip: true
      },
      
      // Enable creating events by dragging
      eventDragCreate: {
        showTooltip: true
      },
      
      // Enable event editing
      eventEdit: true,
      
      // Enable dependencies
      dependencies: true,
      dependencyEdit: true,
      
      // Other features
      tree: true,
      filter: true,
      columnLines: true,
      scheduleTooltip: true,
      eventMenu: true,
      timeRanges: {
        showCurrentTimeLine: true
      }
    }
  };
  
  // Separate listeners object - MUST be passed as separate prop
  const schedulerListeners = {
    beforeEventDropFinalize: handleBeforeEventDropFinalize,
    eventDrop: handleEventDrop,
    eventResizeEnd: handleEventResizeEnd,
    beforeCalculate: () => setEngineStatus('calculating'),
    calculate: () => setEngineStatus('idle')
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Controls */}
      <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Resource Timeline</h2>
            <Badge variant={engineStatus === 'idle' ? 'default' : 'secondary'}>
              {engineStatus === 'calculating' && <Activity className="w-3 h-3 mr-1 animate-pulse" />}
              {engineStatus === 'optimizing' && <Zap className="w-3 h-3 mr-1 animate-pulse" />}
              {engineStatus === 'idle' && <Settings2 className="w-3 h-3 mr-1" />}
              {engineStatus.charAt(0).toUpperCase() + engineStatus.slice(1)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Optimization Mode Selector */}
            <Select value={optimizationMode} onValueChange={(value: any) => setOptimizationMode(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Optimization Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asap">ASAP (Forward)</SelectItem>
                <SelectItem value="alap">ALAP (Backward)</SelectItem>
                <SelectItem value="critical-path">Critical Path</SelectItem>
                <SelectItem value="resource-level">Resource Leveling</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={runOptimization} disabled={engineStatus !== 'idle'}>
              <Zap className="w-4 h-4 mr-2" />
              Optimize
            </Button>
            
            <div className="border-l mx-2 h-6" />
            
            {/* Zoom Controls */}
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomToFit}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Statistics Bar */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Resources:</span>
            <span className="font-semibold">{resources.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Operations:</span>
            <span className="font-semibold">{events.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Utilization:</span>
            <Progress value={75} className="w-20" />
            <span className="text-sm font-semibold">75%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Conflicts:</span>
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              0
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Bryntum Scheduler Pro Component */}
      <div className="flex-1 relative">
        <BryntumSchedulerPro 
          ref={schedulerRef}
          onReady={({ widget }: any) => { 
            schedulerRef.current = widget;
            console.log('Scheduler ready with drag-drop enabled');
          }}
          {...schedulerConfig}
          listeners={schedulerListeners}
        />
      </div>
    </div>
  );
}
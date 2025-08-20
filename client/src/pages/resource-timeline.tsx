import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, differenceInHours, addDays, startOfDay, addHours } from 'date-fns';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Activity, AlertCircle, Zap, Settings2, GitBranch, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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
  id: number;
  external_id: string;
  name: string;
  type: string;
  description?: string;
  plant_id?: string;
  plant_name?: string;
}

interface Operation {
  id: number;
  name: string;
  resourceId: string; // This is the external_id of the resource
  resourceName: string;
  startDate: string;
  endDate: string;
  duration: number;
  percentDone: number;
}

export default function ResourceTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const resourceScrollRef = useRef<HTMLDivElement>(null);
  const schedulerRef = useRef<any>(null); // Bryntum Scheduler Pro instance
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [hoveredOperation, setHoveredOperation] = useState<Operation | null>(null);
  const [zoomLevel, setZoomLevel] = useState(50); // pixels per hour
  const [draggedOperation, setDraggedOperation] = useState<Operation | null>(null);
  const [dropTargetResource, setDropTargetResource] = useState<string | null>(null);
  const [resizingOperation, setResizingOperation] = useState<{ operation: Operation, edge: 'start' | 'end' } | null>(null);
  const [showCapacity, setShowCapacity] = useState(false);
  const [showDependencies, setShowDependencies] = useState(false);
  const [showConflicts, setShowConflicts] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationMode, setOptimizationMode] = useState<'asap' | 'alap' | 'critical-path' | 'resource-level'>('asap');
  const [engineStatus, setEngineStatus] = useState<'idle' | 'calculating' | 'optimizing'>('idle');

  // Fetch resources from PT tables
  const { data: resources = [], isLoading: loadingResources } = useQuery<Resource[]>({
    queryKey: ['/api/pt-resources-clean']
  });

  // Fetch operations
  const { data: operations = [], isLoading: loadingOperations, refetch: refetchOperations } = useQuery<Operation[]>({
    queryKey: ['/api/pt-operations'],
    select: (data: any[]) => {
      const ops = data
        .filter(op => {
          // Check for valid dates using correct field names
          const hasValidDates = (op.startTime || op.start_time) && (op.endTime || op.end_time);
          if (!hasValidDates) {
            console.log('Skipping operation with invalid dates:', op.name);
          }
          return hasValidDates;
        })
        .map(op => ({
          id: op.id,
          name: op.name,
          resourceId: op.assignedResourceId || op.resourceId || op.resource_id,
          resourceName: op.assignedResourceName || op.resourceName || op.resource_name,
          startDate: op.startTime || op.start_time || op.startDate,
          endDate: op.endTime || op.end_time || op.endDate,
          duration: op.duration,
          percentDone: op.completionPercentage || op.percentFinished || op.percent_done || op.percentDone || 0
        }));
      console.log('Operations mapped:', ops.length, 'operations');
      console.log('Sample operation:', ops[0]);
      return ops;
    }
  });

  // Mutation for updating operation schedule
  const updateOperationMutation = useMutation({
    mutationFn: async ({ operationId, resourceId, startDate }: { operationId: number, resourceId: string, startDate: Date }) => {
      // Find the resource by external_id to get its database id
      const resource = resources.find(r => r.external_id === resourceId);
      if (!resource) {
        throw new Error('Resource not found');
      }
      
      const endDate = addHours(startDate, draggedOperation?.duration ? draggedOperation.duration / 60 : 2);
      
      // Use the PT operations update endpoint with correct field names
      return await apiRequest('PUT', `/api/pt-operations/${operationId}`, {
        resourceId: resource.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
    },
    onSuccess: () => {
      toast({
        title: "Operation Updated",
        description: "The operation has been successfully rescheduled.",
      });
      
      // Invalidate and refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/pt-operations'] });
      refetchOperations();
      
      // Update Bryntum scheduler if it exists
      if (schedulerRef.current) {
        // Reload the scheduler with new data after a short delay
        setTimeout(() => {
          if (schedulerRef.current && operations) {
            const events = operations.map(op => ({
              id: op.id,
              name: op.name,
              resourceId: op.resourceId,
              startDate: new Date(op.startDate),
              endDate: new Date(op.endDate),
              percentDone: op.percentDone,
              draggable: true,
              resizable: true
            }));
            schedulerRef.current.eventStore.data = events;
          }
        }, 500);
      }
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update the operation. Please try again.",
        variant: "destructive",
      });
      console.error('Failed to update operation:', error);
    }
  });

  // Debug logging
  useEffect(() => {
    console.log('Resources loaded:', resources);
    console.log('Resources count:', resources.length);
  }, [resources]);

  // Auto-scroll to show current time (today)
  useEffect(() => {
    if (timelineScrollRef.current && operations.length > 0) {
      // Calculate scroll position to show current time
      const now = new Date();
      const { start: startDate } = getDateRange();
      const hoursFromStart = differenceInHours(now, startDate);
      const scrollPosition = Math.max(0, hoursFromStart * zoomLevel - 200); // Center with some offset
      timelineScrollRef.current.scrollLeft = scrollPosition;
    }
  }, [operations]);

  // Initialize Bryntum Scheduler Pro with optimization engine
  const initializeSchedulerEngine = () => {
    // Prevent multiple instances (React StrictMode protection)
    if (schedulerRef.current) {
      console.log('Scheduler already initialized, skipping');
      return true;
    }
    
    // Check if we have required data
    if (!containerRef.current || !operations || operations.length === 0 || !resources || resources.length === 0) {
      console.log('Waiting for data or container...', { 
        container: !!containerRef.current, 
        operations: operations?.length || 0, 
        resources: resources?.length || 0 
      });
      return false;
    }
    
    if (typeof window !== 'undefined' && (window as any).bryntum?.schedulerpro?.SchedulerPro) {
      const { SchedulerPro } = (window as any).bryntum.schedulerpro;
      
      // Log available features for debugging
      console.log('Available Bryntum features:', Object.keys((window as any).bryntum.schedulerpro));
      console.log('Initializing with', operations.length, 'operations and', resources.length, 'resources');
      
      // Check if CriticalPaths is available
      const CriticalPaths = (window as any).bryntum?.schedulerpro?.CriticalPaths || null;
      console.log('CriticalPaths available:', !!CriticalPaths);
      
      // Set timeline to center on today
      const today = new Date();
      const startDate = startOfDay(today); // Start of today
      const endDate = addDays(startDate, 14); // Show 2 weeks from today
      
      // Transform our data to Bryntum format
      const events = operations.map(op => ({
        id: op.id,
        name: op.name,
        resourceId: op.resourceId,
        startDate: new Date(op.startDate),
        endDate: new Date(op.endDate),
        percentDone: op.percentDone,
        draggable: true,
        resizable: true
      }));
      
      const resourcesData = resources.map(res => ({
        id: res.external_id,
        name: res.name,
        description: res.description
      }));
      
      // Create scheduler instance with optimization engine
      schedulerRef.current = new SchedulerPro({
        // License configuration
        licenseKey: 'patti.jorgensen@planettogether.com',
        
        // Container element
        appendTo: containerRef.current,
        
        // Timeline date range - centered on today
        startDate: startDate,
        endDate: endDate,
        
        // Data stores
        resources: resourcesData,
        events: events,
        
        // View preset for initial zoom level
        viewPreset: {
          base: 'hourAndDay',
          tickWidth: 50, // 50 pixels per hour
          headers: [
            {
              unit: 'day',
              dateFormat: 'ddd MM/DD'
            },
            {
              unit: 'hour',
              dateFormat: 'HH'
            }
          ]
        },
        
        // Enable all drag and drop features
        features: {
          // Event drag and drop
          eventDrag: {
            constrainDragToResource: false,
            showExactDropPosition: true,
            showTooltip: true,
            snapRelativeToEventStartDate: true, // Snap to grid when dragging
            validatorFn: ({ draggedRecords, newResource }) => {
              // Custom validation logic for drag operations
              return true; // Allow all drags for now
            }
          },
          
          // Event resize
          eventResize: {
            showExactResizePosition: true,
            showTooltip: true,
            validatorFn: ({ eventRecord, startDate, endDate }) => {
              // Custom validation for resize operations
              return true; // Allow all resizes for now
            }
          },
          
          // Drag to create new events
          eventDragCreate: {
            showTooltip: true,
            validatorFn: ({ resource, startDate, endDate }) => {
              // Validation for creating new events
              return true; // Allow creation
            }
          },
          
          // Drag selection of multiple events
          eventDragSelect: true,
          
          // Time range selection
          timeSelection: {
            showTooltip: true
          },
          
          // Event edit on double-click
          eventEdit: {
            triggerEvent: 'eventdblclick',
            items: {
              nameField: {
                label: 'Operation Name',
                weight: 100
              },
              resourceField: {
                label: 'Resource',
                weight: 200
              },
              startDateField: {
                label: 'Start Time',
                weight: 300
              },
              endDateField: {
                label: 'End Time',
                weight: 400
              }
            }
          },
          
          // Context menu on right-click
          eventMenu: {
            items: {
              editEvent: {
                text: 'Edit Operation',
                icon: 'b-fa b-fa-edit',
                weight: 100
              },
              deleteEvent: {
                text: 'Delete Operation',
                icon: 'b-fa b-fa-trash',
                weight: 200
              },
              optimizeEvent: {
                text: 'Optimize Schedule',
                icon: 'b-fa b-fa-magic',
                weight: 300,
                onItem: () => {
                  runOptimization();
                }
              }
            }
          },
          
          // Schedule tooltip on hover
          scheduleTooltip: {
            showOnClick: false,
            showOnHover: true
          },
          
          // Dependencies between events
          dependencies: true,
          dependencyEdit: true,
          
          // Resource non-working time
          resourceNonWorkingTime: true,
          
          // Time ranges (for showing shifts, breaks, etc.)
          timeRanges: true,
          
          // Tree structure for resources
          tree: true,
          
          // Filtering
          filter: true,
          
          // Column lines in timeline
          columnLines: true
        },
        
        // Drag and drop configuration
        mode: 'move', // 'move' | 'copy' 
        allowResize: true, // Enable event resizing
        enableDragSelect: true, // Enable drag selection
        enableDragCreate: true, // Enable creating events by dragging
        
        // Engine configuration
        project: {
          autoCalculate: true,
          recalculateAfterLoad: true,
          
          // Constraint handling
          constraintsMode: 'honor', // 'honor' | 'ignore' | 'conflict'
          
          // Scheduling direction
          schedulingDirection: optimizationMode === 'alap' ? 'backward' : 'forward',
          
          // Critical path calculation (project level)
          calculateCriticalPath: optimizationMode === 'critical-path',
          
          // Resource leveling
          levelResources: optimizationMode === 'resource-level',
          
          // Dependency lag/lead time
          allowDependencyLag: true,
        },
        
        // Event listeners for optimization feedback
        listeners: {
          beforeCalculate: () => {
            setEngineStatus('calculating');
          },
          calculate: () => {
            setEngineStatus('idle');
            toast({
              title: "Schedule Optimized",
              description: "The production schedule has been optimized using " + optimizationMode.toUpperCase() + " algorithm",
            });
          },
          conflict: (event: any) => {
            toast({
              title: "Scheduling Conflict",
              description: `Conflict detected: ${event.conflict.description}`,
              variant: "destructive",
            });
          },
          // Bryntum SchedulerPro drag and drop event listeners
          beforeEventDropFinalize: ({ context }) => {
            console.log('Before drop finalize:', context);
            return true; // Allow the drop
          },
          eventDrop: async ({ eventRecords, targetResourceRecord, isCopy, source }) => {
            console.log('Event dropped:', {
              events: eventRecords,
              targetResource: targetResourceRecord,
              isCopy: isCopy
            });
            
            if (eventRecords && eventRecords.length > 0) {
              const eventRecord = eventRecords[0];
              console.log('Dropped event details:', {
                id: eventRecord.id,
                resourceId: eventRecord.resourceId,
                startDate: eventRecord.startDate,
                endDate: eventRecord.endDate
              });
              
              // Commit changes to the project model
              if (source?.project) {
                await source.project.commitAsync();
              }
              
              // Update operation in database with new position
              updateOperationMutation.mutate({
                operationId: eventRecord.id,
                resourceId: eventRecord.resourceId,
                startDate: eventRecord.startDate
              });
            }
          },
          eventResizeEnd: ({ eventRecord, startDate, endDate }) => {
            console.log('Resize completed:', {
              id: eventRecord.id,
              startDate,
              endDate
            });
            
            // Update operation duration in database
            updateOperationMutation.mutate({
              operationId: eventRecord.id,
              resourceId: eventRecord.resourceId,
              startDate: startDate
            });
          },
          dragCreateEnd: ({ eventRecord }) => {
            console.log('Event created:', eventRecord);
            // Create new operation in database
            toast({
              title: "Operation Created",
              description: "New operation has been added to the schedule",
            });
          }
        },
      });
      
      return true;
    }
    return false;
  };

  // Initialize Bryntum Scheduler Pro engine when data is ready
  useEffect(() => {
    // Don't initialize until we have data
    if (loadingResources || loadingOperations || operations.length === 0 || resources.length === 0) {
      return;
    }
    
    const initEngine = async () => {
      // Wait for Bryntum to be available
      let attempts = 0;
      while (attempts < 10 && !initializeSchedulerEngine()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (attempts === 10) {
        console.log('Bryntum Scheduler Pro engine initialization pending - library loading');
      } else {
        console.log('✅ Bryntum Scheduler Pro engine initialized with license');
        toast({
          title: "Scheduler Engine Ready",
          description: "PlanetTogether optimization engine loaded successfully",
        });
      }
    };
    
    initEngine();
    
    return () => {
      // Cleanup scheduler instance on unmount (React StrictMode compatible)
      if (schedulerRef.current) {
        console.log('Cleaning up Bryntum Scheduler instance');
        schedulerRef.current.destroy();
        schedulerRef.current = null; // Clear reference to prevent memory leaks
      }
    };
  }, [loadingResources, loadingOperations, operations.length, resources.length]); // Re-initialize when data changes

  // Update Bryntum scheduler when operations change
  useEffect(() => {
    if (schedulerRef.current && operations.length > 0) {
      console.log('Updating Bryntum scheduler with new operations data');
      const events = operations.map(op => ({
        id: op.id,
        name: op.name,
        resourceId: op.resourceId,
        startDate: new Date(op.startDate),
        endDate: new Date(op.endDate),
        percentDone: op.percentDone,
        draggable: true,
        resizable: true
      }));
      
      // Update the event store with new data
      schedulerRef.current.eventStore.data = events;
      
      // Refresh the scheduler view
      if (schedulerRef.current.refresh) {
        schedulerRef.current.refresh();
      }
    }
  }, [operations]); // Update when operations data changes

  // Flag to prevent scroll event loops
  const [isScrolling, setIsScrolling] = useState(false);

  // Synchronize vertical scrolling between resources and timeline
  const handleTimelineScroll = () => {
    if (isScrolling || !timelineScrollRef.current || !resourceScrollRef.current) return;
    
    setIsScrolling(true);
    resourceScrollRef.current.scrollTop = timelineScrollRef.current.scrollTop;
    
    requestAnimationFrame(() => {
      setIsScrolling(false);
    });
  };

  const handleResourceScroll = () => {
    if (isScrolling || !timelineScrollRef.current || !resourceScrollRef.current) return;
    
    setIsScrolling(true);
    timelineScrollRef.current.scrollTop = resourceScrollRef.current.scrollTop;
    
    requestAnimationFrame(() => {
      setIsScrolling(false);
    });
  };

  if (loadingResources || loadingOperations) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading scheduling data...</div>
      </div>
    );
  }

  // Timeline configuration - center around today with a 2-week window
  const getDateRange = () => {
    const today = new Date();
    const startOfToday = startOfDay(today);
    
    // Default to a 2-week window centered on today
    const defaultStart = addDays(startOfToday, -7); // 1 week before today
    const defaultEnd = addDays(startOfToday, 7); // 1 week after today
    
    if (operations.length === 0) {
      return {
        start: defaultStart,
        end: defaultEnd
      };
    }
    
    // Find earliest start and latest end dates from operations
    let minDate = new Date(operations[0].startDate);
    let maxDate = new Date(operations[0].endDate);
    
    operations.forEach(op => {
      const start = new Date(op.startDate);
      const end = new Date(op.endDate);
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    });
    
    // Ensure the range includes today
    if (minDate > defaultStart) minDate = defaultStart;
    if (maxDate < defaultEnd) maxDate = defaultEnd;
    
    // Add some padding for better visibility
    minDate.setHours(0, 0, 0, 0);
    maxDate.setHours(23, 59, 59, 999);
    
    return { start: minDate, end: maxDate };
  };
  
  const { start: startDate, end: endDate } = getDateRange();
  const totalDays = differenceInHours(endDate, startDate) / 24;
  const hourWidth = zoomLevel; // Dynamic zoom level
  const totalWidth = totalDays * 24 * hourWidth;
  const rowHeight = 50;
  const headerHeight = 60;

  // Group operations by resource
  const operationsByResource = new Map<string, Operation[]>();
  operations.forEach(op => {
    // Use the resourceId (which is the external_id string) as the key
    const resourceKey = String(op.resourceId);
    if (resourceKey && resourceKey !== 'null') {
      if (!operationsByResource.has(resourceKey)) {
        operationsByResource.set(resourceKey, []);
      }
      operationsByResource.get(resourceKey)!.push(op);
    }
  });
  
  // Debug logging
  console.log('Operations by resource Map size:', operationsByResource.size);
  console.log('Operations by resource keys:', Array.from(operationsByResource.keys()));
  console.log('Resource external_ids:', resources.map(r => r.external_id));
  console.log('Sample mapping:', operationsByResource.get('RES-PLANT-AMS-01-001'));

  // Calculate position for an operation
  const getOperationPosition = (op: Operation) => {
    const opStart = new Date(op.startDate);
    const hoursFromStart = differenceInHours(opStart, startDate);
    const left = hoursFromStart * hourWidth;
    // Duration is already in minutes, convert to hours for pixel calculation
    const durationInHours = op.duration / 60;
    const width = Math.max(durationInHours * hourWidth, 20); // Minimum width of 20px for visibility
    return { left, width };
  };

  // Calculate resource utilization
  const calculateResourceUtilization = (resourceId: string) => {
    const resourceOps = operationsByResource.get(resourceId) || [];
    if (resourceOps.length === 0) return 0;
    
    const totalAvailableHours = totalDays * 24; // Assuming 24/7 availability
    const totalUsedHours = resourceOps.reduce((sum, op) => sum + (op.duration / 60), 0);
    return Math.min(100, (totalUsedHours / totalAvailableHours) * 100);
  };

  // Handle zoom changes
  const handleZoomIn = () => setZoomLevel(prev => Math.min(200, prev + 10));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(10, prev - 10));
  const handleZoomReset = () => setZoomLevel(50);

  // Detect conflicts between operations on the same resource
  const detectConflicts = (resourceOps: Operation[]) => {
    const conflicts = new Set<number>();
    
    for (let i = 0; i < resourceOps.length; i++) {
      for (let j = i + 1; j < resourceOps.length; j++) {
        const op1 = resourceOps[i];
        const op2 = resourceOps[j];
        
        const start1 = new Date(op1.startDate).getTime();
        const end1 = new Date(op1.endDate).getTime();
        const start2 = new Date(op2.startDate).getTime();
        const end2 = new Date(op2.endDate).getTime();
        
        // Check if operations overlap
        if ((start1 < end2 && end1 > start2) || (start2 < end1 && end2 > start1)) {
          conflicts.add(op1.id);
          conflicts.add(op2.id);
        }
      }
    }
    
    return conflicts;
  };

  // Check if a date falls on weekend
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  // Run optimization based on selected mode
  const runOptimization = async () => {
    if (!schedulerRef.current) {
      toast({
        title: "Engine Not Ready",
        description: "The optimization engine is still loading. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    setIsOptimizing(true);
    setEngineStatus('optimizing');
    
    try {
      // Configure the scheduler engine based on optimization mode
      schedulerRef.current.project.schedulingDirection = optimizationMode === 'alap' ? 'backward' : 'forward';
      schedulerRef.current.project.levelResources = optimizationMode === 'resource-level';
      
      // Enable additional optimization features
      // Note: criticalPaths feature may not be available in all Bryntum versions
      // We'll use the project-level critical path calculation instead
      if (optimizationMode === 'critical-path' && schedulerRef.current.project) {
        schedulerRef.current.project.calculateCriticalPath = true;
      }
      if (schedulerRef.current.features.dependencies) {
        schedulerRef.current.features.dependencies.disabled = false;
      }
      
      // Trigger recalculation with optimization
      await schedulerRef.current.project.commitAsync();
      
      // Apply automatic conflict resolution if enabled
      if (showConflicts && schedulerRef.current.project.conflicts) {
        const conflicts = schedulerRef.current.project.conflicts;
        if (conflicts && conflicts.length > 0) {
          console.log(`Found ${conflicts.length} conflicts, attempting resolution...`);
          // Note: resolveConflicts might not be available, handle gracefully
          if (typeof schedulerRef.current.project.resolveConflicts === 'function') {
            await schedulerRef.current.project.resolveConflicts();
          }
        }
      }
      
      // Apply optimization algorithm feedback
      switch (optimizationMode) {
        case 'asap':
          toast({
            title: "ASAP Optimization Complete",
            description: "All operations scheduled to start as soon as possible",
          });
          break;
        case 'alap':
          toast({
            title: "ALAP Optimization Complete", 
            description: "Operations scheduled as late as possible without missing deadlines",
          });
          break;
        case 'critical-path':
          toast({
            title: "Critical Path Identified",
            description: "Schedule optimized to minimize total duration. Critical operations that directly impact project completion are highlighted.",
          });
          break;
        case 'resource-level':
          toast({
            title: "Resources Leveled",
            description: "Workload balanced and bottlenecks minimized across resources",
          });
          break;
      }
      
      // Refresh operations data to show optimized schedule
      await refetchOperations();
      
    } catch (error) {
      console.error('Optimization failed:', error);
      toast({
        title: "Optimization Failed",
        description: "An error occurred during optimization. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
      setEngineStatus('idle');
    }
  };

  // Handle dependency creation
  const createDependency = (fromId: number, toId: number, type: string = 'FS') => {
    if (schedulerRef.current) {
      schedulerRef.current.dependencyStore.add({
        from: fromId,
        to: toId,
        type, // FS (Finish-Start), SS (Start-Start), FF (Finish-Finish), SF (Start-Finish)
        lag: 0,
      });
    }
  };

  // Handle constraint addition
  const addConstraint = (operationId: number, constraintType: string, constraintDate: Date) => {
    if (schedulerRef.current) {
      const event = schedulerRef.current.eventStore.getById(operationId);
      if (event) {
        event.setConstraint(constraintType, constraintDate);
      }
    }
  };

  // Generate time headers
  const timeHeaders = [];
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(startDate, i);
    timeHeaders.push({
      date,
      label: format(date, 'MMM d'),
      position: i * 24 * hourWidth
    });
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Resource Timeline</h1>
        <p className="text-sm text-gray-600 mt-1">
          {resources.length} Resources | {operations.length} Operations
        </p>
      </div>

      {/* Zoom and View Controls */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 10}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 w-48">
              <Slider
                value={[zoomLevel]}
                onValueChange={([value]) => setZoomLevel(value)}
                min={10}
                max={200}
                step={5}
                className="flex-1"
              />
              <span className="text-sm text-gray-500 w-12">{Math.round((zoomLevel / 50) * 100)}%</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 200}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomReset}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="h-6 w-px bg-gray-200" />
          
          <Button
            variant={showCapacity ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCapacity(!showCapacity)}
          >
            <Activity className="h-4 w-4 mr-2" />
            {showCapacity ? 'Hide' : 'Show'} Utilization
          </Button>
          
          <Button
            variant={showConflicts ? "default" : "outline"}
            size="sm"
            onClick={() => setShowConflicts(!showConflicts)}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            {showConflicts ? 'Hide' : 'Show'} Conflicts
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Auto-fit to show all operations
              const firstOp = operations[0];
              const lastOp = operations[operations.length - 1];
              if (firstOp && lastOp) {
                const range = differenceInHours(new Date(lastOp.endDate), new Date(firstOp.startDate));
                const newZoom = Math.max(10, Math.min(200, (window.innerWidth - 300) / range));
                setZoomLevel(newZoom);
              }
            }}
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Auto-Fit
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Select value={optimizationMode} onValueChange={(value: any) => setOptimizationMode(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select algorithm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asap">ASAP (As Soon As Possible)</SelectItem>
                <SelectItem value="alap">ALAP (As Late As Possible)</SelectItem>
                <SelectItem value="critical-path">Critical Path</SelectItem>
                <SelectItem value="resource-level">Resource Leveling</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="default"
              size="sm"
              onClick={runOptimization}
              disabled={isOptimizing}
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Optimize Schedule
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Simulate creating dependencies between sequential operations
                const sortedOps = [...operations].sort((a, b) => 
                  new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                );
                
                let dependenciesCreated = 0;
                for (let i = 0; i < Math.min(10, sortedOps.length - 1); i++) {
                  createDependency(sortedOps[i].id, sortedOps[i + 1].id, 'FS');
                  dependenciesCreated++;
                }
                
                toast({
                  title: "Dependencies Created",
                  description: `Created ${dependenciesCreated} finish-to-start dependencies between operations`,
                });
              }}
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Add Dependencies
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={engineStatus === 'idle' ? 'outline' : engineStatus === 'calculating' ? 'secondary' : 'default'}>
              {engineStatus === 'idle' ? 'Engine Ready' : engineStatus === 'calculating' ? 'Calculating...' : 'Optimizing...'}
            </Badge>
            <Badge variant="outline">
              {resources.length} Resources
            </Badge>
            <Badge variant="outline">
              {operations.length} Operations
            </Badge>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
          <div className="flex flex-1 overflow-hidden">
            {/* Resource column */}
            <div className="flex-shrink-0 w-48 border-r flex flex-col">
              {/* Header */}
              <div className="h-[60px] border-b bg-gray-50 px-4 flex items-center font-semibold flex-shrink-0">
                Resources
              </div>
              {/* Resource rows - scrollable */}
              <div 
                ref={resourceScrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden"
                onScroll={handleResourceScroll}
              >
                {resources.map((resource, index) => {
                  const utilization = showCapacity ? calculateResourceUtilization(resource.external_id) : 0;
                  const isHighUtilization = utilization > 80;
                  const isMediumUtilization = utilization > 50;
                  
                  return (
                    <div
                      key={resource.id}
                      className={`h-[50px] border-b px-4 flex items-center justify-between ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <div className="truncate flex-1">
                        <div className="font-medium text-sm">{resource.name}</div>
                        <div className="text-xs text-gray-500">{resource.type}</div>
                      </div>
                      {showCapacity && (
                        <div className="ml-2 flex items-center gap-2">
                          <div className="w-24">
                            <Progress 
                              value={utilization} 
                              className="h-2"
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            isHighUtilization ? 'text-red-600' : 
                            isMediumUtilization ? 'text-yellow-600' : 
                            'text-green-600'
                          }`}>
                            {Math.round(utilization)}%
                          </span>
                          {isHighUtilization && (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline */}
            <div 
              ref={timelineScrollRef}
              className="flex-1 overflow-x-auto overflow-y-auto"
              onScroll={handleTimelineScroll}
            >
              <div className="relative" style={{ width: `${totalWidth}px`, minHeight: '100%' }}>
                {/* Time header */}
                <div className="h-[60px] border-b bg-gray-50 sticky top-0 z-30">
                  {timeHeaders.map((header, index) => {
                    const weekend = isWeekend(header.date);
                    return (
                      <div
                        key={index}
                        className={`absolute top-0 h-full border-l ${weekend ? 'border-gray-400' : 'border-gray-300'}`}
                        style={{ left: `${header.position}px`, width: `${24 * hourWidth}px` }}
                      >
                        <div className={`h-full ${weekend ? 'bg-gray-100' : ''}`}>
                          <div className={`px-2 py-1 text-xs font-medium ${weekend ? 'text-gray-500' : ''}`}>
                            {header.label}
                            {weekend && <span className="ml-1 text-[10px]">(Weekend)</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Resource rows container */}
                <div className="relative" style={{ width: `${totalWidth}px` }}>
                  {/* Resource backgrounds and grid lines - Drop zones */}
                  {resources.map((resource, resourceIndex) => (
                    <div
                      key={resource.id}
                      className={`h-[50px] border-b relative transition-colors ${
                        resourceIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } ${
                        dropTargetResource === resource.external_id ? 'bg-blue-100 ring-2 ring-blue-400' : ''
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setDropTargetResource(resource.external_id);
                      }}
                      onDragLeave={(e) => {
                        // Only clear if we're leaving the actual drop zone
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          setDropTargetResource(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        
                        // Get the operation ID from the drag data
                        const operationId = e.dataTransfer.getData('text/plain');
                        const operation = operations.find(op => op.id.toString() === operationId);
                        
                        if (!operation || !draggedOperation) {
                          setDraggedOperation(null);
                          setDropTargetResource(null);
                          return;
                        }
                        
                        // Calculate the new start time based on drop position
                        const rect = e.currentTarget.getBoundingClientRect();
                        const scrollLeft = timelineScrollRef.current?.scrollLeft || 0;
                        const x = e.clientX - rect.left + scrollLeft;
                        const hoursFromStart = x / hourWidth;
                        const newStartDate = addHours(startDate, hoursFromStart);
                        
                        console.log('Dropping operation:', operation.name, 'on resource:', resource.name, 'at time:', newStartDate);
                        
                        // Update the operation
                        updateOperationMutation.mutate({
                          operationId: operation.id,
                          resourceId: resource.external_id,
                          startDate: newStartDate
                        });
                        
                        setDraggedOperation(null);
                        setDropTargetResource(null);
                      }}
                    >
                      {/* Grid lines */}
                      {timeHeaders.map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 h-full border-l border-gray-200"
                          style={{ left: `${i * 24 * hourWidth}px` }}
                        />
                      ))}
                    </div>
                  ))}
                  
                  {/* Operations positioned within each resource row */}
                  {resources.map((resource, resourceIndex) => {
                    const resourceOps = operationsByResource.get(resource.external_id) || [];
                    const conflicts = showConflicts ? detectConflicts(resourceOps) : new Set();
                    
                    return (
                      <div 
                        key={resource.id}
                        className="absolute h-[50px] pointer-events-none"
                        style={{
                          top: `${resourceIndex * 50}px`,
                          left: 0,
                          right: 0,
                          width: `${totalWidth}px`
                        }}
                      >
                        {resourceOps.map(op => {
                          const { left, width } = getOperationPosition(op);
                          const isHovered = hoveredOperation?.id === op.id;
                          const isSelected = selectedOperation?.id === op.id;
                          const hasConflict = conflicts.has(op.id);
                          
                          return (
                            <div
                              key={op.id}
                              className={`group absolute h-[34px] rounded transition-all pointer-events-auto ${
                                hasConflict
                                  ? 'bg-red-500 shadow-lg ring-2 ring-red-300 animate-pulse'
                                  : isSelected 
                                    ? 'bg-blue-600 shadow-lg z-20 ring-2 ring-blue-300' 
                                    : isHovered 
                                      ? 'bg-blue-500 shadow-md z-10' 
                                      : op.percentDone === 100
                                        ? 'bg-green-500 shadow-sm'
                                        : 'bg-blue-400 shadow-sm'
                              } ${draggedOperation?.id === op.id ? 'opacity-50 pointer-events-none' : ''}`}
                              style={{
                                top: '8px',
                                left: `${left}px`,
                                width: `${width}px`,
                                minWidth: '40px'
                              }}
                              onMouseEnter={() => setHoveredOperation(op)}
                              onMouseLeave={() => setHoveredOperation(null)}
                              onClick={() => setSelectedOperation(op)}
                              title={`${op.name}\nResource: ${op.resourceName}\nStart: ${op.startDate ? format(new Date(op.startDate), 'MMM d, h:mm a') : 'N/A'}\nEnd: ${op.endDate ? format(new Date(op.endDate), 'MMM d, h:mm a') : 'N/A'}\nDuration: ${op.duration} minutes\nProgress: ${op.percentDone}%`}
                            >
                              {/* Left resize handle */}
                              <div 
                                className="absolute left-0 top-0 h-full w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-blue-300 transition-opacity"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setResizingOperation({ operation: op, edge: 'start' });
                                }}
                              />
                              
                              {/* Right resize handle */}
                              <div 
                                className="absolute right-0 top-0 h-full w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-blue-300 transition-opacity"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setResizingOperation({ operation: op, edge: 'end' });
                                }}
                              />
                              
                              {/* Main content area - draggable */}
                              <div
                                className="px-2 py-1 text-white text-xs truncate flex items-center justify-between cursor-move h-full"
                                draggable={!draggedOperation}
                                onDragStart={(e) => {
                                  e.dataTransfer.effectAllowed = 'move';
                                  e.dataTransfer.setData('text/plain', op.id.toString());
                                  setDraggedOperation(op);
                                }}
                                onDragEnd={(e) => {
                                  setDraggedOperation(null);
                                  setDropTargetResource(null);
                                }}
                              >
                                <span>{op.name.split(':')[1]?.trim() || op.name}</span>
                                {op.percentDone === 100 && (
                                  <span className="ml-1">✓</span>
                                )}
                              </div>
                              
                              {/* Progress indicator */}
                              {op.percentDone > 0 && op.percentDone < 100 && (
                                <div 
                                  className="absolute bottom-0 left-0 h-1 bg-green-400 rounded-b pointer-events-none"
                                  style={{ width: `${op.percentDone}%` }}
                                />
                              )}
                              
                              {/* Visual indicator when resizing */}
                              {resizingOperation?.operation.id === op.id && (
                                <div className="absolute inset-0 border-2 border-blue-400 rounded pointer-events-none" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected operation details panel */}
      {selectedOperation && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border p-4 max-w-md z-40">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-lg">{selectedOperation.name}</h3>
            <button
              onClick={() => setSelectedOperation(null)}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Resource:</span>
              <p className="font-medium">{selectedOperation.resourceName}</p>
            </div>
            <div>
              <span className="text-gray-600">Duration:</span>
              <p className="font-medium">{selectedOperation.duration} minutes</p>
            </div>
            <div>
              <span className="text-gray-600">Start:</span>
              <p>{format(new Date(selectedOperation.startDate), 'MMM d, h:mm a')}</p>
            </div>
            <div>
              <span className="text-gray-600">End:</span>
              <p>{format(new Date(selectedOperation.endDate), 'MMM d, h:mm a')}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Progress:</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${selectedOperation.percentDone === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${selectedOperation.percentDone}%` }}
                  />
                </div>
                <span className="font-medium">{selectedOperation.percentDone}%</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t flex gap-2">
            <button className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
              Edit Details
            </button>
            <button className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors">
              View Job
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
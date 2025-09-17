import React, { useState, useRef, useEffect } from "react";
import { BryntumSchedulerPro } from "@bryntum/schedulerpro-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  Package,
  AlertTriangle,
  CheckCircle,
  Download,
  Upload,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Settings,
  Play,
  Pause,
  Target,
  TrendingUp,
  Factory,
  Wrench,
  Zap,
  Loader2
} from "lucide-react";
import { format, addDays, startOfDay, endOfDay } from "date-fns";

// Import Bryntum theme CSS
import "@bryntum/schedulerpro/schedulerpro.stockholm.css";

// TypeScript interfaces for PT data
interface PTResource {
  id: number;
  external_id?: string;
  name: string;
  description?: string;
  category?: string;
  capacity?: number;
  efficiency?: number;
  isBottleneck?: boolean;
  plantName?: string;
  active: boolean;
  iconCls?: string;
  eventColor?: string;
}

interface PTOperation {
  id: number;
  name: string;
  jobName?: string;
  operationName?: string;
  resourceName?: string;
  resourceId?: number;
  startTime?: string;
  startDate: string;
  endDate?: string;
  duration: number;
  percent_done?: number;
  status?: string;
  priority?: string;
  dueDate?: string;
  eventColor?: string;
  resizable?: boolean;
  draggable?: boolean;
  cls?: string;
  iconCls?: string;
}

interface PTManufacturingOrder {
  id: number;
  orderNumber?: string;
  itemName?: string;
  quantity?: number;
  status?: string;
  priority?: number;
  dueDate?: string;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
}

interface PTDependency {
  id: string;
  fromEvent: string;
  toEvent: string;
  type: number;
  lag: number;
  lagUnit: string;
}

// Interface for scheduler assignment objects
interface BryntumAssignment {
  id: string;
  eventId: string;
  resourceId: string;
  units: number;
}

// Interface for event schedule information
interface EventSchedule {
  startTime: Date;
  endTime: Date;
  duration: number;
}

// Interface for dependency cycles
interface DependencyCycle {
  path: string[];
  events: string[];
}

// Helper function to get color based on priority
const getPriorityColor = (priority?: string | number): string => {
  if (typeof priority === 'number') {
    if (priority >= 8) return 'red';
    if (priority >= 5) return 'orange';
    return 'green';
  }
  switch (priority?.toLowerCase()) {
    case 'critical':
    case 'high':
      return 'red';
    case 'medium':
      return 'orange';
    case 'low':
      return 'green';
    default:
      return 'blue';
  }
};

// Helper function to get status color
const getStatusColor = (status?: string): string => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'finished':
      return 'green';
    case 'in progress':
    case 'running':
    case 'active':
      return 'blue';
    case 'delayed':
    case 'overdue':
      return 'red';
    case 'scheduled':
    case 'planned':
      return 'orange';
    default:
      return 'gray';
  }
};

export default function ProductionSchedulePage() {
  const { toast } = useToast();
  const schedulerRef = useRef<any>(null);
  const [viewPreset, setViewPreset] = useState<string>("weekAndDay");
  const [selectedPlant, setSelectedPlant] = useState<string>("all");
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [isAutoScheduling, setIsAutoScheduling] = useState(true);
  const [activeTab, setActiveTab] = useState("schedule");
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("asap");
  const [isApplyingSchedule, setIsApplyingSchedule] = useState(false);

  // Fetch PT resources with cache busting
  const { data: ptResources = [], isLoading: isLoadingResources } = useQuery<PTResource[]>({
    queryKey: ['/api/pt-resources'],
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Fetch PT operations with cache busting
  const { data: ptOperations = [], isLoading: isLoadingOperations } = useQuery<PTOperation[]>({
    queryKey: ['/api/pt-operations'],
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Fetch manufacturing orders
  const { data: manufacturingOrders = [], isLoading: isLoadingOrders } = useQuery<PTManufacturingOrder[]>({
    queryKey: ['/api/manufacturing-orders'],
  });

  // Fetch PT dependencies
  const { data: ptDependencies = [], isLoading: isLoadingDependencies } = useQuery<PTDependency[]>({
    queryKey: ['/api/pt-dependencies'],
  });

  // Transform PT data for Bryntum format - simple flat list like working HTML version
  const transformResourcesForBryntum = (resources: PTResource[]) => {
    return resources.map((resource, index) => ({
      id: `resource-${resource.id}`,
      name: resource.name || `Resource ${resource.id}`,
      category: resource.plantName || 'Main Plant', // Show plant in category column
      capacity: resource.capacity || 100,
      efficiency: resource.efficiency || 100,
      isBottleneck: resource.isBottleneck || false,
      plantName: resource.plantName || 'Main Plant',
      iconCls: resource.isBottleneck ? 'b-fa b-fa-exclamation-triangle' : 'b-fa b-fa-industry',
      eventColor: resource.isBottleneck ? 'red' : (index % 2 === 0 ? 'blue' : 'green'),
      active: resource.active !== false
    }));
  };

  // Transform operations for Bryntum (events without resourceId - Scheduler Pro pattern)
  const transformOperationsForBryntum = (operations: PTOperation[]) => {
    console.log('🔍 Processing operations for scheduler:', operations.length);
    console.log('🔍 Operations with resourceId:', operations.filter(op => op.resourceId).length);
    console.log('🔍 First 3 operations:', operations.slice(0, 3).map(op => ({
      id: op.id,
      name: op.name,
      resourceId: op.resourceId,
      startDate: op.startDate,
      duration: op.duration
    })));
    
    return operations.map((op) => ({
      id: `event-${op.id}`,
      name: op.name || `Operation ${op.id}`,
      // NOTE: No resourceId here - Scheduler Pro uses AssignmentStore instead
      startDate: op.startDate ? new Date(op.startDate) : new Date(),
      duration: op.duration || 60, // Duration in minutes
      durationUnit: 'minute',
      percentDone: op.percent_done || 0,
      eventColor: getPriorityColor(op.priority),
      resizable: true,
      draggable: true,
      cls: op.status === 'critical' ? 'critical-operation' : '',
      iconCls: op.status === 'completed' ? 'b-fa b-fa-check-circle' : 'b-fa b-fa-tasks',
      // Custom fields
      jobName: op.jobName,
      operationName: op.operationName,
      status: op.status || 'Scheduled',
      priority: op.priority || 'Medium',
      dueDate: op.dueDate,
      // Store original resourceId for assignment creation
      _originalResourceId: op.resourceId,
      // Constraints
      constraintType: op.dueDate ? 'finishnolaterthan' : null,
      constraintDate: op.dueDate ? new Date(op.dueDate) : null,
      // Dependencies
      effort: op.duration ? op.duration / 60 : 1, // Convert to hours
      effortUnit: 'hour',
      schedulingMode: 'Normal'
    }));
  };

  // Create assignments for Scheduler Pro (required for resource-event mapping)
  const createAssignmentsForBryntum = (operations: PTOperation[]) => {
    return operations
      .filter(op => op.resourceId) // Only create assignments for operations with resources
      .map((op) => ({
        id: `assignment-${op.id}`,
        eventId: `event-${op.id}`,
        resourceId: `resource-${op.resourceId}`,
        units: 100 // 100% allocation
      }));
  };

  // Helper functions for metrics calculation
  const calculateOverallUtilization = () => {
    if (ptResources.length === 0 || ptOperations.length === 0) return 0;
    const totalCapacity = ptResources.reduce((sum, r) => sum + (r.capacity || 100), 0) * 8;
    const totalLoad = ptOperations.reduce((sum, op) => sum + (op.duration || 0), 0) / 60;
    return Math.min(100, Math.round((totalLoad / totalCapacity) * 100));
  };
  
  const calculateOEE = () => {
    // OEE = Availability × Performance × Quality
    const availability = 0.9; // 90% availability as example
    const performance = ptOperations.filter(op => op.status === 'Completed').length / Math.max(1, ptOperations.length);
    const quality = 0.95; // 95% quality rate as example
    return Math.round(availability * performance * quality * 100);
  };

  // Combine loading state
  const isLoading = isLoadingResources || isLoadingOperations || isLoadingDependencies;

  // Transform data for Bryntum Scheduler Pro (with separate stores)
  const schedulerResources = transformResourcesForBryntum(ptResources);
  const schedulerEvents = transformOperationsForBryntum(ptOperations);
  const schedulerAssignments = createAssignmentsForBryntum(ptOperations);
  const schedulerDependencies = ptDependencies.map(dep => ({
    id: dep.id,
    fromEvent: dep.fromEvent,
    toEvent: dep.toEvent,
    type: dep.type || 2,
    lag: dep.lag || 0,
    lagUnit: dep.lagUnit || 'day'
  }));

  // Resource/event mapping summary for production
  console.log(`📊 Scheduler Data: ${schedulerResources.length} resources, ${schedulerEvents.length} events, ${schedulerAssignments.length} assignments`);
  console.log(`📊 Raw Data: ${ptResources.length} PT resources, ${ptOperations.length} PT operations`);
  console.log(`📊 Operations with resourceId: ${ptOperations.filter(op => op.resourceId).length}`);
  
  // Check assignment validity instead of checking events for resourceId
  const resourceIds = new Set(schedulerResources.map(r => r.id));
  const unmatchedAssignments = schedulerAssignments.filter(a => !resourceIds.has(a.resourceId));
  
  if (unmatchedAssignments.length > 0) {
    console.warn(`⚠️ ${unmatchedAssignments.length} assignments have invalid resource references`);
  }
  
  if (schedulerEvents.length === 0 && ptOperations.length > 0) {
    console.error(`🚨 NO OPERATIONS RENDERED: ${ptOperations.length} operations fetched but 0 scheduler events created`);
    console.error('Sample operations without resourceId:', ptOperations.filter(op => !op.resourceId).slice(0, 3));
  }

  // Bryntum Scheduler Pro configuration
  const schedulerProConfig = {
    startDate: startOfDay(new Date('2025-08-01')), // Show from August to include all operations
    endDate: endOfDay(addDays(new Date(), 90)),
    viewPreset: 'weekAndDayLetter', // Use built-in Bryntum preset
    
    // Project configuration - Scheduler Pro pattern with separate stores
    project: {
      autoLoad: false,
      autoSync: false,
      resources: schedulerResources,
      events: schedulerEvents,
      assignments: schedulerAssignments, // Critical: AssignmentStore for Scheduler Pro
      dependencies: schedulerDependencies,
      
      // Event listeners
      listeners: {
        change: ({ source }: any) => {
          console.log('Project changed:', source);
        }
      }
    },
    
    // Features configuration
    features: {
      // Core scheduling features
      eventDrag: {
        showTooltip: true,
        constrainDragToResource: false,
        unifiedDrag: true
      },
      eventResize: {
        showTooltip: true
      },
      eventEdit: {
        items: {
          generalTab: {
            items: {
              name: { label: 'Operation Name' },
              resourceId: { label: 'Resource' },
              startDate: { label: 'Start Time' },
              duration: { label: 'Duration' },
              percentDone: { label: 'Progress %' },
              priority: {
                type: 'combo',
                label: 'Priority',
                items: ['Critical', 'High', 'Medium', 'Low']
              },
              status: {
                type: 'combo',
                label: 'Status',
                items: ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Delayed']
              }
            }
          }
        }
      },
      
      // Advanced features
      dependencies: true,
      dependencyEdit: {
        showLagField: true
      },
      criticalPaths: {
        disabled: !showCriticalPath
      },
      resourceNonWorkingTime: true,
      
      // Visual features
      timeRanges: {
        showCurrentTimeLine: true,
        showHeaderElements: true
      },
      eventTooltip: {
        template: (data: any) => {
          const event = data.eventRecord;
          return `
            <div class="b-tooltip-content">
              <h4>${event.name}</h4>
              <div>Job: ${event.jobName || 'N/A'}</div>
              <div>Status: <span class="status-${event.status?.toLowerCase()}">${event.status}</span></div>
              <div>Priority: <span class="priority-${event.priority?.toLowerCase()}">${event.priority}</span></div>
              <div>Progress: ${event.percentDone || 0}%</div>
              <div>Start: ${event.startDate ? format(event.startDate, 'MMM dd, HH:mm') : 'N/A'}</div>
              <div>Duration: ${event.duration} ${event.durationUnit}</div>
              ${event.dueDate ? `<div>Due: ${format(new Date(event.dueDate), 'MMM dd, HH:mm')}</div>` : ''}
            </div>
          `;
        }
      },
      eventMenu: {
        items: {
          editEvent: {
            text: 'Edit Operation',
            icon: 'b-fa b-fa-edit'
          },
          deleteEvent: {
            text: 'Delete Operation',
            icon: 'b-fa b-fa-trash'
          },
          '-': {},
          completeOperation: {
            text: 'Mark as Complete',
            icon: 'b-fa b-fa-check-circle',
            onItem: ({ eventRecord }: any) => {
              eventRecord.percentDone = 100;
              eventRecord.status = 'Completed';
              toast({
                title: "Operation Completed",
                description: `${eventRecord.name} has been marked as complete.`,
              });
            }
          },
          viewDependencies: {
            text: 'View Dependencies',
            icon: 'b-fa b-fa-project-diagram',
            onItem: ({ eventRecord }: any) => {
              toast({
                title: "Dependencies",
                description: `Viewing dependencies for ${eventRecord.name}`,
              });
            }
          }
        }
      },
      
      // Resource utilization
      resourceTimeRanges: true,
      
      // Remove tree feature - use simple flat list like working HTML version
      
      // Export features
      pdfExport: {
        exportServer: '/api/export' // Configure your export server
      },
      excelExporter: true,
      
      // Filtering and searching
      filter: true,
      search: true,
      
      // Column features for resource grid
      columnLines: true,
      stripe: true,
      sort: 'name'
    },
    
    // Columns configuration for resources
    columns: [
      {
        text: 'Resource',
        field: 'name',
        width: 200,
        renderer: ({ record, value }: any) => {
          const iconClass = record.isBottleneck ? 'text-red-500' : 'text-blue-500';
          const bottleneckIcon = record.isBottleneck ? ' ⚠️' : '';
          return `<i class="${record.iconCls} ${iconClass}"></i> ${value}${bottleneckIcon}`;
        }
      },
      {
        text: 'Plant',
        field: 'category',
        width: 150
      },
      {
        text: 'Plant',
        field: 'plantName',
        width: 120
      },
      {
        text: 'Efficiency',
        field: 'efficiency',
        width: 80,
        renderer: ({ value }: any) => `${value || 100}%`
      },
      {
        text: 'Utilization',
        field: 'utilization',
        width: 100,
        renderer: ({ record }: any) => {
          // Calculate utilization based on assigned operations vs capacity
          const assignedHours = record.events?.reduce((sum: number, event: any) => sum + (event.duration || 0), 0) || 0;
          const capacityHours = (record.capacity || 100) * 8; // Assuming 8 hour workday
          const utilization = Math.min(100, Math.round((assignedHours / capacityHours) * 100));
          const color = utilization > 80 ? 'red' : utilization > 60 ? 'orange' : 'green';
          return `
            <div class="flex items-center gap-2">
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-${color}-500 h-2 rounded-full" style="width: ${utilization}%"></div>
              </div>
              <span class="text-xs">${utilization}%</span>
            </div>
          `;
        }
      }
    ],
    
    // Bar margin for better visualization
    barMargin: 2,
    rowHeight: 50,
    
    // Enable automatic scheduling
    autoAdjustTimeAxis: true,
    
    // Remove custom timeAxis configuration - let Bryntum handle defaults
    
    // Remove custom presets - use built-in Bryntum presets only
    // Use built-in Bryntum presets only to avoid timeAxis compatibility issues
  };

  // Load data into scheduler when it's ready
  useEffect(() => {
    if (schedulerRef.current && !isLoadingResources && !isLoadingOperations && !isLoadingDependencies) {
      try {
        const scheduler = schedulerRef.current.instance;
        if (!scheduler || !scheduler.project) {
          console.warn('Scheduler or project not ready');
          return;
        }
        
        const project = scheduler.project;
        
        // Use batch updates for performance
        project.suspendAutoCommit();
        
        try {
          // Clear existing data using proper Bryntum API
          if (project.resourceStore) {
            project.resourceStore.removeAll();
          }
          if (project.eventStore) {
            project.eventStore.removeAll();
          }
          if (project.assignmentStore) {
            project.assignmentStore.removeAll();
          }
          if (project.dependencyStore) {
            project.dependencyStore.removeAll();
          }
          
          // Load resources
          const transformedResources = transformResourcesForBryntum(ptResources);
          if (project.resourceStore && transformedResources.length > 0) {
            project.resourceStore.add(transformedResources);
          }
          
          // Load events (operations)
          const transformedEvents = transformOperationsForBryntum(ptOperations);
          if (project.eventStore && transformedEvents.length > 0) {
            project.eventStore.add(transformedEvents);
          }
          
          // ✅ CRITICAL FIX: Load assignments (was missing!)
          const transformedAssignments = createAssignmentsForBryntum(ptOperations);
          if (project.assignmentStore && transformedAssignments.length > 0) {
            project.assignmentStore.add(transformedAssignments);
          }
          
          // Load dependencies with proper ID mapping
          const transformedDependencies = ptDependencies.map(dep => ({
            id: dep.id,
            fromEvent: dep.fromEvent,
            toEvent: dep.toEvent,
            type: dep.type || 2,
            lag: dep.lag || 0,
            lagUnit: dep.lagUnit || 'day'
          }));
          if (transformedDependencies.length > 0 && project.dependencyStore) {
            project.dependencyStore.add(transformedDependencies);
          }
          
          console.log(`✅ Loaded: ${transformedResources.length} resources, ${transformedEvents.length} events, ${transformedAssignments.length} assignments, ${transformedDependencies.length} dependencies`);
          
        } finally {
          // Resume commits and trigger scheduling
          project.resumeAutoCommit();
          
          // Auto-schedule if enabled
          if (isAutoScheduling) {
            project.commitAsync();
          }
        }
        
      } catch (error) {
        console.error('Error loading scheduler data:', error);
        toast({
          title: "Loading Error",
          description: "Failed to load scheduling data. Please refresh the page.",
          variant: "destructive"
        });
      }
    }
  }, [ptResources, ptOperations, ptDependencies, isLoadingResources, isLoadingOperations, isLoadingDependencies, isAutoScheduling, toast]);

  // Handle viewPreset changes
  useEffect(() => {
    if (schedulerRef.current && schedulerRef.current.instance) {
      try {
        const scheduler = schedulerRef.current.instance;
        if (scheduler.viewPreset !== viewPreset) {
          scheduler.viewPreset = viewPreset;
        }
      } catch (error) {
        console.warn('Error changing view preset:', error);
      }
    }
  }, [viewPreset]);

  // Handler functions
  const handleZoomIn = () => {
    if (schedulerRef.current?.instance) {
      try {
        const scheduler = schedulerRef.current.instance;
        scheduler.zoomIn();
      } catch (error) {
        console.warn('Error zooming in:', error);
      }
    }
  };

  const handleZoomOut = () => {
    if (schedulerRef.current?.instance) {
      try {
        const scheduler = schedulerRef.current.instance;
        scheduler.zoomOut();
      } catch (error) {
        console.warn('Error zooming out:', error);
      }
    }
  };

  const handleZoomToFit = () => {
    if (schedulerRef.current?.instance) {
      try {
        schedulerRef.current.instance.zoomToFit();
      } catch (error) {
        console.warn('Error zooming to fit:', error);
      }
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExportPDF = () => {
    if (schedulerRef.current) {
      schedulerRef.current.instance.features.pdfExport.export({
        columns: schedulerRef.current.instance.columns.visibleColumns,
        exporterType: 'multipage',
        clientURL: window.location.href
      });
    }
  };

  const handleToggleCriticalPath = () => {
    setShowCriticalPath(!showCriticalPath);
    if (schedulerRef.current?.instance?.features?.criticalPaths) {
      schedulerRef.current.instance.features.criticalPaths.disabled = showCriticalPath;
      schedulerRef.current.instance.features.criticalPaths.refresh();
    }
  };

  const handleToggleAutoScheduling = () => {
    setIsAutoScheduling(!isAutoScheduling);
    toast({
      title: isAutoScheduling ? "Auto-scheduling disabled" : "Auto-scheduling enabled",
      description: isAutoScheduling ? 
        "Manual scheduling mode active" : 
        "Operations will be automatically scheduled based on constraints",
    });
  };

  // Build dependency graph utilities
  const buildDependencyGraph = (events: any[], dependencies: any[]) => {
    const graph = new Map();
    const inDegree = new Map();
    
    // Initialize graph nodes
    events.forEach(event => {
      graph.set(event.id, []);
      inDegree.set(event.id, 0);
    });
    
    // Build adjacency list and in-degree count
    dependencies.forEach(dep => {
      if (graph.has(dep.fromEvent) && graph.has(dep.toEvent)) {
        graph.get(dep.fromEvent).push({ to: dep.toEvent, lag: dep.lag || 0, lagUnit: dep.lagUnit || 'day' });
        inDegree.set(dep.toEvent, inDegree.get(dep.toEvent) + 1);
      }
    });
    
    return { graph, inDegree };
  };
  
  const topologicalSort = (events: any[], dependencies: any[]): { sortedEvents: any[], hasCycle: boolean, cycle?: DependencyCycle } => {
    const { graph, inDegree } = buildDependencyGraph(events, dependencies);
    const queue = events.filter(event => inDegree.get(event.id) === 0);
    const result = [];
    const processed = new Set();
    
    while (queue.length > 0) {
      const current = queue.shift();
      result.push(current);
      processed.add(current.id);
      
      // Reduce in-degree for successors
      graph.get(current.id).forEach((edge: any) => {
        const newInDegree = inDegree.get(edge.to) - 1;
        inDegree.set(edge.to, newInDegree);
        if (newInDegree === 0) {
          const successor = events.find(e => e.id === edge.to);
          if (successor) queue.push(successor);
        }
      });
    }
    
    // Cycle detection: if we haven't processed all events, there's a cycle
    if (result.length !== events.length) {
      const unprocessedEvents = events.filter(e => !processed.has(e.id));
      console.warn(`🔄 Dependency cycle detected! Processed ${result.length}/${events.length} events`);
      
      // Find the cycle path using DFS
      const findCycle = (startEventId: string, visited: Set<string>, path: string[]): DependencyCycle | null => {
        if (visited.has(startEventId)) {
          const cycleStartIndex = path.indexOf(startEventId);
          if (cycleStartIndex !== -1) {
            const cyclePath = path.slice(cycleStartIndex);
            const cycleEvents = cyclePath.map(id => {
              const event = events.find(e => e.id === id);
              return event ? event.name || `Event ${id}` : `Unknown Event ${id}`;
            });
            return { path: cyclePath, events: cycleEvents };
          }
        }
        
        visited.add(startEventId);
        path.push(startEventId);
        
        const successors = graph.get(startEventId) || [];
        for (const edge of successors) {
          const cycle = findCycle(edge.to, new Set(visited), [...path]);
          if (cycle) return cycle;
        }
        
        return null;
      };
      
      // Try to find a cycle starting from unprocessed events
      let detectedCycle: DependencyCycle | undefined;
      for (const event of unprocessedEvents) {
        const cycle = findCycle(event.id, new Set(), []);
        if (cycle) {
          detectedCycle = cycle;
          break;
        }
      }
      
      return {
        sortedEvents: result,
        hasCycle: true,
        cycle: detectedCycle || {
          path: unprocessedEvents.map(e => e.id),
          events: unprocessedEvents.map(e => e.name || `Event ${e.id}`)
        }
      };
    }
    
    return { sortedEvents: result, hasCycle: false };
  };
  
  // Convert lag time to milliseconds
  const convertLagToMs = (lag: number, lagUnit: string) => {
    const conversions = {
      'minute': 60 * 1000,
      'hour': 60 * 60 * 1000,
      'day': 24 * 60 * 60 * 1000,
      'week': 7 * 24 * 60 * 60 * 1000
    };
    return lag * (conversions[lagUnit as keyof typeof conversions] || conversions.day);
  };
  
  // Working calendar utilities
  const isWorkingHour = (date: Date) => {
    const hour = date.getHours();
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    return day >= 1 && day <= 5 && hour >= 7 && hour < 17; // Monday-Friday, 7 AM - 5 PM
  };
  
  const getNextWorkingTime = (date: Date) => {
    const newDate = new Date(date);
    while (!isWorkingHour(newDate)) {
      if (newDate.getHours() >= 17 || newDate.getDay() === 0 || newDate.getDay() === 6) {
        // Move to next day 7 AM
        newDate.setDate(newDate.getDate() + 1);
        newDate.setHours(7, 0, 0, 0);
      } else if (newDate.getHours() < 7) {
        newDate.setHours(7, 0, 0, 0);
      } else {
        newDate.setMinutes(newDate.getMinutes() + 30);
      }
    }
    return newDate;
  };
  
  // Build assignment index map for performance
  const buildAssignmentIndex = (assignments: any[]) => {
    const eventToAssignments = new Map();
    const resourceToAssignments = new Map();
    
    assignments.forEach(assignment => {
      if (!eventToAssignments.has(assignment.eventId)) {
        eventToAssignments.set(assignment.eventId, []);
      }
      eventToAssignments.get(assignment.eventId).push(assignment);
      
      if (!resourceToAssignments.has(assignment.resourceId)) {
        resourceToAssignments.set(assignment.resourceId, []);
      }
      resourceToAssignments.get(assignment.resourceId).push(assignment);
    });
    
    return { eventToAssignments, resourceToAssignments };
  };

  // Scheduling Algorithm Implementations
  const asapScheduling = async () => {
    setIsApplyingSchedule(true);
    
    try {
      if (!schedulerRef.current?.instance) {
        throw new Error('Scheduler not available');
      }
      
      const scheduler = schedulerRef.current.instance;
      const events = [...scheduler.eventStore.records];
      const dependencies = [...(scheduler.dependencyStore?.records || [])];
      const assignments = [...(scheduler.assignmentStore?.records || [])];
      
      if (events.length === 0) {
        throw new Error('No operations to schedule');
      }
      
      console.log(`🔄 ASAP Scheduling: ${events.length} events, ${dependencies.length} dependencies`);
      
      // Use batch updates for performance
      scheduler.project.suspendAutoCommit();
      
      try {
        // Build performance index maps
        const { eventToAssignments, resourceToAssignments } = buildAssignmentIndex(assignments);
        
        // Topological sort to respect precedence constraints
        const topSortResult = topologicalSort(events, dependencies);
        if (topSortResult.hasCycle) {
          throw new Error(`Dependency cycle detected: ${topSortResult.cycle?.events.join(' → ')}. Please remove circular dependencies before scheduling.`);
        }
        const sortedEvents = topSortResult.sortedEvents;
        console.log(`📊 Topological sort completed: ${sortedEvents.length}/${events.length} events ordered`);
        
        // Initialize scheduling state
        const baseDate = new Date(2025, 8, 3, 7, 0, 0, 0); // September 3, 2025, 7 AM
        const resourceNextAvailable = new Map();
        const eventStartTimes = new Map();
        
        // Schedule events in topological order
        sortedEvents.forEach((event: any) => {
          let earliestStart = new Date(baseDate);
          
          // Check dependency constraints
          dependencies.forEach(dep => {
            if (dep.toEvent === event.id && eventStartTimes.has(dep.fromEvent)) {
              const predecessorEnd = eventStartTimes.get(dep.fromEvent).endTime;
              const lagMs = convertLagToMs(dep.lag || 0, dep.lagUnit || 'day');
              const dependencyStart = new Date(predecessorEnd.getTime() + lagMs);
              if (dependencyStart > earliestStart) {
                earliestStart = dependencyStart;
              }
            }
          });
          
          // Check resource constraints
          const eventAssignments = eventToAssignments.get(event.id) || [];
          eventAssignments.forEach((assignment: any) => {
            const resourceNext = resourceNextAvailable.get(assignment.resourceId) || new Date(baseDate);
            if (resourceNext > earliestStart) {
              earliestStart = resourceNext;
            }
          });
          
          // Ensure working hours
          const actualStart = getNextWorkingTime(earliestStart);
          const durationMs = (event.duration || 60) * 60 * 1000;
          const endTime = new Date(actualStart.getTime() + durationMs);
          
          // Update event times
          event.startDate = actualStart;
          event.endDate = endTime;
          eventStartTimes.set(event.id, { startTime: actualStart, endTime });
          
          // Update resource availability (with buffer)
          eventAssignments.forEach((assignment: any) => {
            const bufferMs = 15 * 60 * 1000; // 15 minute buffer
            resourceNextAvailable.set(assignment.resourceId, new Date(endTime.getTime() + bufferMs));
          });
        });
        
        console.log(`✅ ASAP scheduling completed successfully`);
        toast({
          title: "ASAP Scheduling Complete",
          description: `Successfully scheduled ${sortedEvents.length} operations with dependency constraints.`
        });
        
      } finally {
        scheduler.project.resumeAutoCommit();
      }
      
    } catch (error) {
      console.error('ASAP Scheduling Error:', error);
      toast({
        title: "ASAP Scheduling Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsApplyingSchedule(false);
    }
  };

  const alapScheduling = async () => {
    setIsApplyingSchedule(true);
    
    try {
      if (!schedulerRef.current?.instance) {
        throw new Error('Scheduler not available');
      }
      
      const scheduler = schedulerRef.current.instance;
      const events = [...scheduler.eventStore.records];
      const dependencies = [...(scheduler.dependencyStore?.records || [])];
      const assignments = [...(scheduler.assignmentStore?.records || [])];
      
      if (events.length === 0) {
        throw new Error('No operations to schedule');
      }
      
      console.log(`🔄 ALAP Scheduling: ${events.length} events, ${dependencies.length} dependencies`);
      
      // Use batch updates for performance
      scheduler.project.suspendAutoCommit();
      
      try {
        // Build performance index maps
        const { eventToAssignments } = buildAssignmentIndex(assignments);
        const { graph } = buildDependencyGraph(events, dependencies);
        
        // Reverse topological sort for ALAP (start from end events)
        const reverseGraph = new Map();
        const outDegree = new Map();
        
        // Initialize reverse graph
        events.forEach(event => {
          reverseGraph.set(event.id, []);
          outDegree.set(event.id, 0);
        });
        
        // Build reverse adjacency list
        dependencies.forEach(dep => {
          if (reverseGraph.has(dep.toEvent) && reverseGraph.has(dep.fromEvent)) {
            reverseGraph.get(dep.toEvent).push({ to: dep.fromEvent, lag: dep.lag || 0, lagUnit: dep.lagUnit || 'day' });
            outDegree.set(dep.fromEvent, outDegree.get(dep.fromEvent) + 1);
          }
        });
        
        // Find end events (no successors)
        const endEvents = events.filter(event => outDegree.get(event.id) === 0);
        const reverseSorted = [];
        const queue = [...endEvents];
        
        while (queue.length > 0) {
          const current = queue.shift();
          reverseSorted.push(current);
          
          // Process predecessors
          reverseGraph.get(current.id).forEach((edge: any) => {
            const newOutDegree = outDegree.get(edge.to) - 1;
            outDegree.set(edge.to, newOutDegree);
            if (newOutDegree === 0) {
              const predecessor = events.find(e => e.id === edge.to);
              if (predecessor) queue.push(predecessor);
            }
          });
        }
        
        console.log(`📈 Reverse topological sort completed: ${reverseSorted.length}/${events.length} events ordered`);
        
        // Initialize scheduling state - schedule backwards from September 17, 2025
        const projectDeadline = new Date(2025, 8, 17, 17, 0, 0, 0); // September 17, 2025, 5 PM
        const resourceLastAvailable = new Map();
        const eventEndTimes = new Map();
        
        // Schedule events in reverse topological order (ALAP)
        reverseSorted.forEach(event => {
          let latestEnd = new Date(projectDeadline);
          
          // Check successor dependency constraints
          dependencies.forEach(dep => {
            if (dep.fromEvent === event.id && eventEndTimes.has(dep.toEvent)) {
              const successorStart = eventEndTimes.get(dep.toEvent).startTime;
              const lagMs = convertLagToMs(dep.lag || 0, dep.lagUnit || 'day');
              const dependencyEnd = new Date(successorStart.getTime() - lagMs);
              if (dependencyEnd < latestEnd) {
                latestEnd = dependencyEnd;
              }
            }
          });
          
          // Check resource constraints (backwards)
          const eventAssignments = eventToAssignments.get(event.id) || [];
          eventAssignments.forEach((assignment: any) => {
            const resourceLast = resourceLastAvailable.get(assignment.resourceId) || new Date(projectDeadline);
            if (resourceLast < latestEnd) {
              latestEnd = resourceLast;
            }
          });
          
          // Calculate start time and ensure working hours
          const durationMs = (event.duration || 60) * 60 * 1000;
          let calculatedStart = new Date(latestEnd.getTime() - durationMs);
          
          // Adjust for working hours (backwards)
          const getPrevWorkingTime = (date: Date) => {
            const newDate = new Date(date);
            while (!isWorkingHour(newDate)) {
              if (newDate.getHours() < 7 || newDate.getDay() === 0 || newDate.getDay() === 6) {
                // Move to previous day 5 PM
                newDate.setDate(newDate.getDate() - 1);
                newDate.setHours(17, 0, 0, 0);
              } else if (newDate.getHours() >= 17) {
                newDate.setHours(16, 30, 0, 0);
              } else {
                newDate.setMinutes(newDate.getMinutes() - 30);
              }
            }
            return newDate;
          };
          
          const workingEnd = getPrevWorkingTime(latestEnd);
          const actualStart = new Date(workingEnd.getTime() - durationMs);
          const finalStart = getPrevWorkingTime(actualStart);
          const finalEnd = new Date(finalStart.getTime() + durationMs);
          
          // Update event times
          event.startDate = finalStart;
          event.endDate = finalEnd;
          eventEndTimes.set(event.id, { startTime: finalStart, endTime: finalEnd });
          
          // Update resource availability (backwards with buffer)
          eventAssignments.forEach((assignment: any) => {
            const bufferMs = 15 * 60 * 1000; // 15 minute buffer
            resourceLastAvailable.set(assignment.resourceId, new Date(finalStart.getTime() - bufferMs));
          });
        });
        
        console.log(`✅ ALAP scheduling completed successfully`);
        toast({
          title: "ALAP Scheduling Complete",
          description: `Successfully scheduled ${reverseSorted.length} operations as late as possible with constraints.`
        });
        
      } finally {
        scheduler.project.resumeAutoCommit();
      }
      
    } catch (error) {
      console.error('ALAP Scheduling Error:', error);
      toast({
        title: "ALAP Scheduling Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsApplyingSchedule(false);
    }
  };

  const criticalPathScheduling = async () => {
    setIsApplyingSchedule(true);
    
    try {
      if (!schedulerRef.current?.instance) {
        throw new Error('Scheduler not available');
      }
      
      const scheduler = schedulerRef.current.instance;
      const events = [...scheduler.eventStore.records];
      const dependencies = [...(scheduler.dependencyStore?.records || [])];
      const assignments = [...(scheduler.assignmentStore?.records || [])];
      
      if (events.length === 0) {
        throw new Error('No operations to schedule');
      }
      
      console.log(`🔄 Critical Path Scheduling: ${events.length} events, ${dependencies.length} dependencies`);
      
      // Use batch updates for performance
      scheduler.project.suspendAutoCommit();
      
      try {
        // Build performance index maps
        const { eventToAssignments } = buildAssignmentIndex(assignments);
        const eventMap = new Map(events.map(e => [e.id, e]));
        
        // Calculate Early Start (ES) and Early Finish (EF) - Forward Pass
        const earlyDates = new Map();
        const topSortResult = topologicalSort(events, dependencies);
        if (topSortResult.hasCycle) {
          throw new Error(`Dependency cycle detected: ${topSortResult.cycle?.events.join(' → ')}. Cannot perform critical path analysis with circular dependencies.`);
        }
        const sortedEvents = topSortResult.sortedEvents;
        
        const baseDate = new Date(2025, 8, 3, 7, 0, 0, 0); // September 3, 2025, 7 AM
        
        console.log(`🔍 Forward pass: calculating early dates...`);
        sortedEvents.forEach((event: any) => {
          let earliestStart = new Date(baseDate);
          
          // Check all predecessor constraints
          dependencies.forEach(dep => {
            if (dep.toEvent === event.id && earlyDates.has(dep.fromEvent)) {
              const predEF = earlyDates.get(dep.fromEvent).earlyFinish;
              const lagMs = convertLagToMs(dep.lag || 0, dep.lagUnit || 'day');
              const constraintStart = new Date(predEF.getTime() + lagMs);
              if (constraintStart > earliestStart) {
                earliestStart = constraintStart;
              }
            }
          });
          
          // Ensure working hours
          const workingStart = getNextWorkingTime(earliestStart);
          const duration = (event.duration || 60) * 60 * 1000; // Convert to ms
          const earlyFinish = new Date(workingStart.getTime() + duration);
          
          earlyDates.set(event.id, {
            earlyStart: workingStart,
            earlyFinish: earlyFinish,
            duration: event.duration || 60
          });
        });
        
        // Calculate Late Start (LS) and Late Finish (LF) - Backward Pass
        const lateDates = new Map();
        const projectEnd = Math.max(...Array.from(earlyDates.values()).map(d => d.earlyFinish.getTime()));
        const projectDeadline = new Date(projectEnd);
        
        console.log(`🔎 Backward pass: calculating late dates...`);
        // Reverse topological order for backward pass
        const reverseSorted = [...sortedEvents].reverse();
        
        reverseSorted.forEach(event => {
          let latestFinish = new Date(projectDeadline);
          
          // Check all successor constraints
          dependencies.forEach(dep => {
            if (dep.fromEvent === event.id && lateDates.has(dep.toEvent)) {
              const succLS = lateDates.get(dep.toEvent).lateStart;
              const lagMs = convertLagToMs(dep.lag || 0, dep.lagUnit || 'day');
              const constraintFinish = new Date(succLS.getTime() - lagMs);
              if (constraintFinish < latestFinish) {
                latestFinish = constraintFinish;
              }
            }
          });
          
          // If no successors found, use project deadline
          if (latestFinish.getTime() === projectDeadline.getTime()) {
            const hasSuccessors = dependencies.some(dep => dep.fromEvent === event.id);
            if (!hasSuccessors) {
              latestFinish = new Date(earlyDates.get(event.id).earlyFinish);
            }
          }
          
          const duration = (event.duration || 60) * 60 * 1000;
          const lateStart = new Date(latestFinish.getTime() - duration);
          
          lateDates.set(event.id, {
            lateStart: lateStart,
            lateFinish: latestFinish,
            duration: event.duration || 60
          });
        });
        
        // Calculate Total Slack and identify critical path
        const slackInfo = new Map();
        const criticalEvents = new Set();
        
        console.log(`⚙️ Calculating slack and critical path...`);
        events.forEach(event => {
          const early = earlyDates.get(event.id);
          const late = lateDates.get(event.id);
          
          if (early && late) {
            const totalSlackMs = late.lateStart.getTime() - early.earlyStart.getTime();
            const totalSlackDays = Math.round(totalSlackMs / (24 * 60 * 60 * 1000) * 10) / 10;
            const freeSlackMs = Math.max(0, Math.min(...dependencies
              .filter(dep => dep.fromEvent === event.id)
              .map(dep => earlyDates.get(dep.toEvent)?.earlyStart.getTime() || Infinity)
            ) - early.earlyFinish.getTime());
            const freeSlackDays = Math.round(freeSlackMs / (24 * 60 * 60 * 1000) * 10) / 10;
            
            slackInfo.set(event.id, {
              totalSlack: totalSlackDays,
              freeSlack: freeSlackDays,
              isCritical: totalSlackMs <= 0
            });
            
            if (totalSlackMs <= 0) {
              criticalEvents.add(event.id);
            }
          }
        });
        
        console.log(`🎯 Critical path identified: ${criticalEvents.size} critical operations`);
        
        // Schedule events using calculated early dates, prioritizing critical path
        const resourceNextAvailable = new Map();
        
        // Schedule critical events first with tight scheduling
        const criticalEventList = sortedEvents.filter((event: any) => criticalEvents.has(event.id));
        const nonCriticalEventList = sortedEvents.filter((event: any) => !criticalEvents.has(event.id));
        
        [...criticalEventList, ...nonCriticalEventList].forEach(event => {
          const early = earlyDates.get(event.id);
          const slack = slackInfo.get(event.id);
          const isCritical = criticalEvents.has(event.id);
          
          if (early) {
            let scheduledStart = new Date(early.earlyStart);
            
            // For non-critical events, we can use some slack for resource leveling
            if (!isCritical && slack && slack.totalSlack > 0) {
              // Check resource constraints and potentially delay within slack bounds
              const eventAssignments = eventToAssignments.get(event.id) || [];
              eventAssignments.forEach((assignment: any) => {
                const resourceNext = resourceNextAvailable.get(assignment.resourceId) || new Date(baseDate);
                const late = lateDates.get(event.id);
                if (resourceNext > scheduledStart && resourceNext <= late?.lateStart) {
                  scheduledStart = getNextWorkingTime(resourceNext);
                }
              });
            }
            
            const actualStart = getNextWorkingTime(scheduledStart);
            const duration = (event.duration || 60) * 60 * 1000;
            const endTime = new Date(actualStart.getTime() + duration);
            
            // Update event schedule
            event.startDate = actualStart;
            event.endDate = endTime;
            
            // Add visual indicators for critical path
            if (isCritical) {
              event.cls = (event.cls || '') + ' critical-path';
              event.eventColor = 'red';
            } else if (slack && slack.totalSlack < 1) {
              event.cls = (event.cls || '') + ' near-critical';
              event.eventColor = 'orange';
            }
            
            // Update resource availability
            const eventAssignments = eventToAssignments.get(event.id) || [];
            eventAssignments.forEach((assignment: any) => {
              const buffer = isCritical ? 0 : 15 * 60 * 1000; // Critical events: no buffer, others: 15min
              resourceNextAvailable.set(assignment.resourceId, new Date(endTime.getTime() + buffer));
            });
          }
        });
        
        // Generate scheduling report
        const criticalPathLength = Math.max(...Array.from(lateDates.values()).map(d => d.lateFinish.getTime()));
        const projectDuration = Math.round((criticalPathLength - baseDate.getTime()) / (24 * 60 * 60 * 1000) * 10) / 10;
        
        console.log(`✅ Critical Path Analysis complete:`);
        console.log(`  • Project Duration: ${projectDuration} days`);
        console.log(`  • Critical Operations: ${criticalEvents.size}/${events.length}`);
        console.log(`  • Average Slack: ${Array.from(slackInfo.values()).reduce((sum, s) => sum + s.totalSlack, 0) / slackInfo.size} days`);
        
        toast({
          title: "Critical Path Analysis Complete",
          description: `Identified ${criticalEvents.size} critical operations. Project duration: ${projectDuration} days.`
        });
        
      } finally {
        scheduler.project.resumeAutoCommit();
      }
      
    } catch (error) {
      console.error('Critical Path Scheduling Error:', error);
      toast({
        title: "Critical Path Analysis Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsApplyingSchedule(false);
    }
  };

  const levelResourcesScheduling = async () => {
    setIsApplyingSchedule(true);
    
    try {
      if (!schedulerRef.current?.instance) {
        throw new Error('Scheduler not available');
      }
      
      const scheduler = schedulerRef.current.instance;
      const events = [...scheduler.eventStore.records];
      const resources = [...scheduler.resourceStore.records];
      const assignments = [...(scheduler.assignmentStore?.records || [])];
      const dependencies = [...(scheduler.dependencyStore?.records || [])];
      
      if (events.length === 0 || resources.length === 0) {
        throw new Error('No operations or resources to level');
      }
      
      console.log(`🔄 Resource Leveling: ${events.length} events across ${resources.length} resources`);
      
      // Use batch updates for performance
      scheduler.project.suspendAutoCommit();
      
      try {
        // Build performance index maps
        const { eventToAssignments, resourceToAssignments } = buildAssignmentIndex(assignments);
        
        // Calculate resource capacities and efficiencies
        const resourceCapacity = new Map();
        const resourceEfficiency = new Map();
        resources.forEach(resource => {
          const capacity = resource.capacity || 100; // Default capacity percentage
          const efficiency = resource.efficiency || 100; // Default efficiency percentage
          const effectiveCapacity = (capacity * efficiency) / 10000; // Convert percentages to decimal
          resourceCapacity.set(resource.id, {
            capacity: capacity,
            efficiency: efficiency,
            effectiveCapacity: Math.max(0.1, effectiveCapacity), // Minimum 10% capacity
            isBottleneck: resource.isBottleneck || false
          });
        });
        
        console.log(`⚙️ Resource capacities calculated for ${resources.length} resources`);
        
        // Perform forward scheduling first to establish baseline
        const topSortResult = topologicalSort(events, dependencies);
        if (topSortResult.hasCycle) {
          throw new Error(`Dependency cycle detected: ${topSortResult.cycle?.events.join(' → ')}. Please remove circular dependencies before resource leveling.`);
        }
        const sortedEvents = topSortResult.sortedEvents;
        const baseDate = new Date(2025, 8, 3, 7, 0, 0, 0); // September 3, 2025, 7 AM
        
        // Initial scheduling pass - establish feasible schedule
        const resourceNextAvailable = new Map();
        const eventSchedule = new Map();
        resources.forEach(resource => {
          resourceNextAvailable.set(resource.id, new Date(baseDate));
        });
        
        // Schedule events respecting dependencies
        sortedEvents.forEach((event: any) => {
          let earliestStart = new Date(baseDate);
          
          // Check dependency constraints
          dependencies.forEach(dep => {
            if (dep.toEvent === event.id && eventSchedule.has(dep.fromEvent)) {
              const predecessorEnd = eventSchedule.get(dep.fromEvent).endTime;
              const lagMs = convertLagToMs(dep.lag || 0, dep.lagUnit || 'day');
              const dependencyStart = new Date(predecessorEnd.getTime() + lagMs);
              if (dependencyStart > earliestStart) {
                earliestStart = dependencyStart;
              }
            }
          });
          
          // Check resource availability
          const eventAssignments = eventToAssignments.get(event.id) || [];
          let resourceStart = earliestStart;
          eventAssignments.forEach((assignment: BryntumAssignment) => {
            const resourceNext = resourceNextAvailable.get(assignment.resourceId) || new Date(baseDate);
            if (resourceNext > resourceStart) {
              resourceStart = resourceNext;
            }
          });
          
          const actualStart = getNextWorkingTime(resourceStart);
          const duration = (event.duration || 60) * 60 * 1000;
          const endTime = new Date(actualStart.getTime() + duration);
          
          eventSchedule.set(event.id, {
            startTime: actualStart,
            endTime: endTime,
            duration: event.duration || 60
          });
          
          // Update resource availability
          eventAssignments.forEach((assignment: BryntumAssignment) => {
            resourceNextAvailable.set(assignment.resourceId, endTime);
          });
        });
        
        console.log(`📈 Initial schedule established, starting resource leveling...`);
        
        // Calculate resource utilization profiles
        const calculateResourceUtilization = () => {
          const utilization = new Map();
          
          resources.forEach(resource => {
            const resAssignments = resourceToAssignments.get(resource.id) || [];
            let totalLoad = 0;
            let peakLoad = 0;
            const hourlyLoad = new Map();
            
            resAssignments.forEach((assignment: BryntumAssignment) => {
              const schedule = eventSchedule.get(assignment.eventId);
              if (schedule) {
                const duration = schedule.duration;
                totalLoad += duration;
                
                // Calculate hourly distribution
                const startHour = Math.floor(schedule.startTime.getTime() / (60 * 60 * 1000));
                const durationHours = Math.ceil(duration / 60);
                
                for (let h = startHour; h < startHour + durationHours; h++) {
                  hourlyLoad.set(h, (hourlyLoad.get(h) || 0) + (duration / durationHours));
                }
              }
            });
            
            // Find peak hourly load
            peakLoad = Math.max(...Array.from(hourlyLoad.values()), 0);
            
            const capacity = resourceCapacity.get(resource.id);
            const avgUtilization = totalLoad / (8 * 60); // 8-hour workday in minutes
            const peakUtilization = peakLoad / 60; // Convert to hours
            const effectiveUtil = avgUtilization / (capacity?.effectiveCapacity || 1);
            
            utilization.set(resource.id, {
              totalLoad,
              avgUtilization: effectiveUtil,
              peakUtilization,
              variance: peakUtilization - avgUtilization,
              isOverloaded: effectiveUtil > 0.9, // Over 90% utilization
              capacity: capacity?.effectiveCapacity || 1
            });
          });
          
          return utilization;
        };
        
        let utilization = calculateResourceUtilization();
        const overloadedResources = Array.from(utilization.entries())
          .filter(([_, util]) => util.isOverloaded)
          .sort(([_, a], [__, b]) => b.peakUtilization - a.peakUtilization);
        
        console.log(`⚠️ Found ${overloadedResources.length} overloaded resources`);
        
        // Resource leveling iterations
        const maxIterations = 5;
        let iteration = 0;
        let improved = true;
        
        while (improved && iteration < maxIterations && overloadedResources.length > 0) {
          improved = false;
          iteration++;
          
          console.log(`🔄 Resource Leveling Iteration ${iteration}...`);
          
          // Try to level each overloaded resource
          for (const [resourceId, util] of overloadedResources) {
            const resAssignments = resourceToAssignments.get(resourceId) || [];
            
            // Find events that can be delayed (have slack)
            const delayableEvents = resAssignments
              .map((assignment: any) => assignment.eventId)
              .filter((eventId: any) => {
                // Check if event has any slack (not on critical path)
                const hasSlack = !dependencies.some(dep => dep.fromEvent === eventId);
                return hasSlack;
              })
              .sort((a: any, b: any) => {
                // Sort by duration (delay longer operations first)
                const aDuration = eventSchedule.get(a)?.duration || 0;
                const bDuration = eventSchedule.get(b)?.duration || 0;
                return bDuration - aDuration;
              });
            
            // Try to delay some operations to reduce peak load
            for (const eventId of delayableEvents.slice(0, 3)) { // Limit to top 3 candidates
              const currentSchedule = eventSchedule.get(eventId);
              if (currentSchedule) {
                // Try delaying by 2-8 hours
                const delayOptions = [2, 4, 6, 8].map(hours => hours * 60 * 60 * 1000);
                
                for (const delay of delayOptions) {
                  const newStart = new Date(currentSchedule.startTime.getTime() + delay);
                  const workingStart = getNextWorkingTime(newStart);
                  const newEnd = new Date(workingStart.getTime() + currentSchedule.duration * 60 * 1000);
                  
                  // Check if this delay violates any successor dependencies
                  const violatesDependencies = dependencies.some(dep => {
                    if (dep.fromEvent === eventId) {
                      const successorSchedule = eventSchedule.get(dep.toEvent);
                      if (successorSchedule) {
                        const lagMs = convertLagToMs(dep.lag || 0, dep.lagUnit || 'day');
                        return newEnd.getTime() + lagMs > successorSchedule.startTime.getTime();
                      }
                    }
                    return false;
                  });
                  
                  if (!violatesDependencies) {
                    // Apply the delay
                    eventSchedule.set(eventId, {
                      startTime: workingStart,
                      endTime: newEnd,
                      duration: currentSchedule.duration
                    });
                    improved = true;
                    break;
                  }
                }
              }
            }
          }
          
          // Recalculate utilization
          utilization = calculateResourceUtilization();
          const newOverloaded = Array.from(utilization.entries())
            .filter(([_, util]) => util.isOverloaded);
          
          if (newOverloaded.length < overloadedResources.length) {
            improved = true;
          }
        }
        
        // Apply the final schedule to events
        events.forEach(event => {
          const schedule = eventSchedule.get(event.id);
          if (schedule) {
            event.startDate = schedule.startTime;
            event.endDate = schedule.endTime;
          }
        });
        
        // Calculate final metrics
        const finalUtilization = calculateResourceUtilization();
        const avgUtilization = Array.from(finalUtilization.values())
          .reduce((sum, util) => sum + util.avgUtilization, 0) / resources.length;
        const maxUtilization = Math.max(...Array.from(finalUtilization.values())
          .map(util => util.avgUtilization));
        const finalOverloaded = Array.from(finalUtilization.entries())
          .filter(([_, util]) => util.isOverloaded).length;
        
        console.log(`✅ Resource Leveling completed:`);
        console.log(`  • Iterations: ${iteration}`);
        console.log(`  • Average Utilization: ${Math.round(avgUtilization * 100)}%`);
        console.log(`  • Peak Utilization: ${Math.round(maxUtilization * 100)}%`);
        console.log(`  • Overloaded Resources: ${finalOverloaded}/${resources.length}`);
        
        toast({
          title: "Resource Leveling Complete",
          description: `Optimized workload distribution. Average utilization: ${Math.round(avgUtilization * 100)}%, ${finalOverloaded} resources still overloaded.`
        });
        
      } finally {
        scheduler.project.resumeAutoCommit();
      }
      
    } catch (error) {
      console.error('Resource Leveling Error:', error);
      toast({
        title: "Resource Leveling Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsApplyingSchedule(false);
    }
  };

  const drumScheduling = async () => {
    setIsApplyingSchedule(true);
    
    try {
      if (!schedulerRef.current?.instance) {
        throw new Error('Scheduler not available');
      }
      
      const scheduler = schedulerRef.current.instance;
      const events = [...scheduler.eventStore.records];
      const resources = [...scheduler.resourceStore.records];
      const assignments = [...(scheduler.assignmentStore?.records || [])];
      const dependencies = [...(scheduler.dependencyStore?.records || [])];
      
      if (events.length === 0 || resources.length === 0) {
        throw new Error('No operations or resources for drum scheduling');
      }
      
      console.log(`🥁 Drum/TOC Scheduling: ${events.length} events across ${resources.length} resources`);
      
      // Use batch updates for performance
      scheduler.project.suspendAutoCommit();
      
      try {
        // Build performance index maps
        const { eventToAssignments, resourceToAssignments } = buildAssignmentIndex(assignments);
        
        // Identify bottleneck resource(s) using Theory of Constraints principles
        const resourceAnalysis = new Map();
        resources.forEach(resource => {
          const resAssignments = resourceToAssignments.get(resource.id) || [];
          const capacity = resource.capacity || 100;
          const efficiency = resource.efficiency || 100;
          const isMarkedBottleneck = resource.isBottleneck || false;
          
          // Calculate total load and effective capacity
          let totalLoad = 0;
          let totalOperations = 0;
          const operationTypes = new Set();
          
          resAssignments.forEach((assignment: BryntumAssignment) => {
            const event = events.find(e => e.id === assignment.eventId);
            if (event) {
              totalLoad += event.duration || 60;
              totalOperations++;
              operationTypes.add(event.name || 'Unknown');
            }
          });
          
          // Effective capacity considering efficiency and availability
          const effectiveCapacity = (capacity * efficiency) / 10000 * 8 * 60; // 8 hours * efficiency
          const utilizationRatio = totalLoad / Math.max(effectiveCapacity, 1);
          
          // Calculate bottleneck score (higher = more bottlenecked)
          let bottleneckScore = utilizationRatio;
          if (isMarkedBottleneck) bottleneckScore *= 2; // Double score for explicitly marked bottlenecks
          if (totalOperations > 5) bottleneckScore *= 1.2; // Bonus for high operation count
          if (operationTypes.size === 1) bottleneckScore *= 1.1; // Bonus for specialized resources
          
          resourceAnalysis.set(resource.id, {
            resource,
            totalLoad,
            totalOperations,
            effectiveCapacity,
            utilizationRatio,
            bottleneckScore,
            isMarkedBottleneck,
            operationTypes: Array.from(operationTypes)
          });
        });
        
        // Find the primary bottleneck (drum)
        const bottleneckCandidates = Array.from(resourceAnalysis.entries())
          .sort(([, a], [, b]) => b.bottleneckScore - a.bottleneckScore);
        
        if (bottleneckCandidates.length === 0) {
          throw new Error('No bottleneck resource identified');
        }
        
        const [drumResourceId, drumAnalysis] = bottleneckCandidates[0];
        const drumResource = drumAnalysis.resource;
        
        console.log(`🥁 Identified drum resource: ${drumResource.name} (Score: ${drumAnalysis.bottleneckScore.toFixed(2)})`);
        console.log(`  • Utilization: ${(drumAnalysis.utilizationRatio * 100).toFixed(1)}%`);
        console.log(`  • Operations: ${drumAnalysis.totalOperations}`);
        console.log(`  • Load: ${drumAnalysis.totalLoad} minutes`);
        
        // Get drum operations (operations that use the bottleneck resource)
        const drumEvents = events.filter(event => {
          const eventAssignments = eventToAssignments.get(event.id) || [];
          return eventAssignments.some((assignment: any) => assignment.resourceId === drumResourceId);
        });
        
        console.log(`🎼 Drum operations identified: ${drumEvents.length}/${events.length}`);
        
        // Perform forward pass to get early dates (same as ASAP but focus on drum)
        const topSortResult = topologicalSort(events, dependencies);
        if (topSortResult.hasCycle) {
          throw new Error(`Dependency cycle detected: ${topSortResult.cycle?.events.join(' → ')}. Please remove circular dependencies before drum scheduling.`);
        }
        const sortedEvents = topSortResult.sortedEvents;
        const baseDate = new Date(2025, 8, 3, 7, 0, 0, 0); // September 3, 2025, 7 AM
        const eventStartTimes = new Map();
        const resourceNextAvailable = new Map();
        
        // Initialize resource availability
        resources.forEach(resource => {
          resourceNextAvailable.set(resource.id, new Date(baseDate));
        });
        
        // First pass: Schedule all events with basic constraints
        sortedEvents.forEach((event: any) => {
          let earliestStart = new Date(baseDate);
          
          // Check dependency constraints
          dependencies.forEach(dep => {
            if (dep.toEvent === event.id && eventStartTimes.has(dep.fromEvent)) {
              const predecessorEnd = eventStartTimes.get(dep.fromEvent).endTime;
              const lagMs = convertLagToMs(dep.lag || 0, dep.lagUnit || 'day');
              const dependencyStart = new Date(predecessorEnd.getTime() + lagMs);
              if (dependencyStart > earliestStart) {
                earliestStart = dependencyStart;
              }
            }
          });
          
          // Check resource constraints
          const eventAssignments = eventToAssignments.get(event.id) || [];
          eventAssignments.forEach((assignment: any) => {
            const resourceNext = resourceNextAvailable.get(assignment.resourceId) || new Date(baseDate);
            if (resourceNext > earliestStart) {
              earliestStart = resourceNext;
            }
          });
          
          const actualStart = getNextWorkingTime(earliestStart);
          const duration = (event.duration || 60) * 60 * 1000;
          const endTime = new Date(actualStart.getTime() + duration);
          
          eventStartTimes.set(event.id, {
            startTime: actualStart,
            endTime: endTime,
            isDrumOperation: drumEvents.includes(event)
          });
          
          // Update resource availability
          eventAssignments.forEach((assignment: any) => {
            resourceNextAvailable.set(assignment.resourceId, endTime);
          });
        });
        
        // Second pass: Optimize drum schedule with buffers
        const drumSchedule: { event: any; startTime: Date; endTime: Date; bufferBefore?: number }[] = [];
        let drumTime = new Date(baseDate);
        
        // Sort drum operations by priority and dependencies
        const sortedDrumEvents = drumEvents.sort((a, b) => {
          // Priority 1: Dependency order
          const aDeps = dependencies.filter(dep => dep.toEvent === a.id).length;
          const bDeps = dependencies.filter(dep => dep.toEvent === b.id).length;
          if (aDeps !== bDeps) return bDeps - aDeps; // More dependencies = higher priority
          
          // Priority 2: Due dates if available
          const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          if (aDue !== bDue) return aDue - bDue;
          
          // Priority 3: Duration (shorter operations first for flexibility)
          return (a.duration || 60) - (b.duration || 60);
        });
        
        // Schedule drum operations with protective buffers
        sortedDrumEvents.forEach((event, index) => {
          // Add rope buffer before drum operations (except first)
          if (index > 0) {
            const ropeBufferMinutes = 30; // 30-minute rope buffer
            drumTime = new Date(drumTime.getTime() + ropeBufferMinutes * 60 * 1000);
          }
          
          const workingStart = getNextWorkingTime(drumTime);
          const duration = (event.duration || 60) * 60 * 1000;
          const endTime = new Date(workingStart.getTime() + duration);
          
          drumSchedule.push({
            event,
            startTime: workingStart,
            endTime: endTime,
            bufferBefore: index > 0 ? 30 : 0
          });
          
          // Update drum time
          drumTime = new Date(endTime);
        });
        
        console.log(`⏰ Drum schedule created with ${drumSchedule.length} operations`);
        
        // Third pass: Schedule non-drum operations around drum schedule
        const finalSchedule = new Map();
        const finalResourceAvailable = new Map();
        resources.forEach(resource => {
          finalResourceAvailable.set(resource.id, new Date(baseDate));
        });
        
        // Apply drum schedule first
        drumSchedule.forEach(({ event, startTime, endTime }: any) => {
          finalSchedule.set(event.id, { startTime, endTime, isDrum: true });
          finalResourceAvailable.set(drumResourceId, endTime);
        });
        
        // Schedule remaining operations
        const nonDrumEvents = events.filter(event => !drumEvents.includes(event));
        const finalTopSortResult = topologicalSort([...drumEvents, ...nonDrumEvents], dependencies);
        if (finalTopSortResult.hasCycle) {
          throw new Error(`Dependency cycle detected in final scheduling: ${finalTopSortResult.cycle?.events.join(' → ')}.`);
        }
        const allSortedEvents = finalTopSortResult.sortedEvents;
        
        allSortedEvents.forEach((event: any) => {
          if (finalSchedule.has(event.id)) return; // Skip already scheduled drum operations
          
          let earliestStart = new Date(baseDate);
          
          // Check dependency constraints against final schedule
          dependencies.forEach(dep => {
            if (dep.toEvent === event.id && finalSchedule.has(dep.fromEvent)) {
              const predecessorEnd = finalSchedule.get(dep.fromEvent).endTime;
              const lagMs = convertLagToMs(dep.lag || 0, dep.lagUnit || 'day');
              const dependencyStart = new Date(predecessorEnd.getTime() + lagMs);
              if (dependencyStart > earliestStart) {
                earliestStart = dependencyStart;
              }
            }
          });
          
          // Check resource constraints against final schedule
          const eventAssignments = eventToAssignments.get(event.id) || [];
          eventAssignments.forEach((assignment: any) => {
            const resourceNext = finalResourceAvailable.get(assignment.resourceId) || new Date(baseDate);
            if (resourceNext > earliestStart) {
              earliestStart = resourceNext;
            }
          });
          
          const actualStart = getNextWorkingTime(earliestStart);
          const duration = (event.duration || 60) * 60 * 1000;
          const endTime = new Date(actualStart.getTime() + duration);
          
          finalSchedule.set(event.id, {
            startTime: actualStart,
            endTime: endTime,
            isDrum: false
          });
          
          // Update resource availability with buffer for non-drum operations
          eventAssignments.forEach((assignment: any) => {
            const buffer = assignment.resourceId === drumResourceId ? 0 : 15 * 60 * 1000; // 15min buffer for non-drum
            finalResourceAvailable.set(assignment.resourceId, new Date(endTime.getTime() + buffer));
          });
        });
        
        // Apply final schedule to events with visual indicators
        events.forEach(event => {
          const schedule = finalSchedule.get(event.id);
          if (schedule) {
            event.startDate = schedule.startTime;
            event.endDate = schedule.endTime;
            
            // Add visual indicators for drum operations
            if (schedule.isDrum) {
              event.cls = (event.cls || '') + ' drum-operation';
              event.eventColor = 'purple';
            } else {
              // Check if this operation feeds the drum
              const feedsDrum = dependencies.some(dep => 
                dep.fromEvent === event.id && drumEvents.some(de => de.id === dep.toEvent)
              );
              if (feedsDrum) {
                event.cls = (event.cls || '') + ' feeds-drum';
                event.eventColor = 'blue';
              }
            }
          }
        });
        
        // Calculate performance metrics
        const drumUtilization = drumSchedule.reduce((sum: number, item) => {
          const duration = item.endTime.getTime() - item.startTime.getTime();
          return sum + duration;
        }, 0) / (8 * 60 * 60 * 1000); // 8-hour workday
        
        const totalProjectTime = Math.max(...Array.from(finalSchedule.values()).map(s => s.endTime.getTime()));
        const projectDuration = (totalProjectTime - baseDate.getTime()) / (24 * 60 * 60 * 1000);
        
        console.log(`✅ Drum/TOC Scheduling completed:`);
        console.log(`  • Drum Resource: ${drumResource.name}`);
        console.log(`  • Drum Utilization: ${(drumUtilization * 100).toFixed(1)}%`);
        console.log(`  • Drum Operations: ${drumSchedule.length}`);
        console.log(`  • Project Duration: ${projectDuration.toFixed(1)} days`);
        console.log(`  • Total Operations Scheduled: ${finalSchedule.size}`);
        
        toast({
          title: "Drum/TOC Scheduling Complete",
          description: `Optimized around bottleneck ${drumResource.name}. Drum utilization: ${(drumUtilization * 100).toFixed(1)}%, Project: ${projectDuration.toFixed(1)} days.`
        });
        
      } finally {
        scheduler.project.resumeAutoCommit();
      }
      
    } catch (error) {
      console.error('Drum/TOC Scheduling Error:', error);
      toast({
        title: "Drum/TOC Scheduling Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsApplyingSchedule(false);
    }
  };

  // Handle apply scheduling
  const handleApplyScheduling = async () => {
    if (!schedulerRef.current?.instance || isApplyingSchedule) return;
    
    setIsApplyingSchedule(true);
    
    try {
      let algorithmName = "";
      let color = "green";
      
      switch (selectedAlgorithm) {
        case "asap":
          await asapScheduling();
          algorithmName = "ASAP Forward Scheduling";
          break;
        case "alap":
          await alapScheduling();
          algorithmName = "ALAP Backward Scheduling";
          break;
        case "criticalPath":
          await criticalPathScheduling();
          algorithmName = "Critical Path Scheduling";
          break;
        case "levelResources":
          await levelResourcesScheduling();
          algorithmName = "Resource Leveling";
          break;
        case "drum":
          await drumScheduling();
          algorithmName = "Drum (TOC) Scheduling";
          break;
        default:
          throw new Error("Unknown algorithm selected");
      }
      
      // Update scheduler view
      const scheduler = schedulerRef.current.instance;
      if (scheduler) {
        // Set timespan to show all operations
        const events = [...scheduler.eventStore.records];
        if (events.length > 0) {
          const earliestStart = Math.min(...events.map((e: any) => e.startDate.getTime()));
          const latestEnd = Math.max(...events.map((e: any) => e.endDate?.getTime() || e.startDate.getTime()));
          
          const currentStartDate = new Date(earliestStart);
          const currentEndDate = new Date(latestEnd);
          currentEndDate.setDate(currentEndDate.getDate() + 1); // Add buffer day
          
          scheduler.setTimeSpan(currentStartDate, currentEndDate);
        }
      }
      
      toast({
        title: "Scheduling Applied",
        description: `${algorithmName} has been successfully applied to all operations.`,
      });
    } catch (error: any) {
      toast({
        title: "Scheduling Error",
        description: `Failed to apply scheduling: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsApplyingSchedule(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Factory className="w-8 h-8" />
            Production Schedule
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time production scheduling with drag-and-drop resource allocation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Clock className="w-4 h-4 mr-1" />
            Live
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            data-testid="button-refresh-schedule"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Control Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* View Controls */}
            <div className="flex items-center gap-2">
              <Select value={viewPreset} onValueChange={setViewPreset}>
                <SelectTrigger className="w-[180px]" data-testid="select-view-preset">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourAndDay">Hour & Day</SelectItem>
                  <SelectItem value="dayAndWeek">Day & Week</SelectItem>
                  <SelectItem value="monthAndYear">Month & Year</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-1 border-l pl-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  data-testid="button-zoom-in"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  data-testid="button-zoom-out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomToFit}
                  data-testid="button-zoom-fit"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Scheduling Algorithm Controls */}
            <div className="flex items-center gap-2 border-l pl-4">
              <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                <SelectTrigger className="w-[200px]" data-testid="select-algorithm">
                  <SelectValue placeholder="Select algorithm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asap">ASAP (Forward)</SelectItem>
                  <SelectItem value="alap">ALAP (Backward)</SelectItem>
                  <SelectItem value="criticalPath">Critical Path</SelectItem>
                  <SelectItem value="levelResources">Resource Leveling</SelectItem>
                  <SelectItem value="drum">Drum (TOC)</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="default"
                size="sm"
                onClick={handleApplyScheduling}
                disabled={isApplyingSchedule || isLoading}
                data-testid="button-apply-scheduling"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isApplyingSchedule ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-1" />
                )}
                {isApplyingSchedule ? "Applying..." : "Apply Schedule"}
              </Button>
            </div>

            {/* Feature Toggles */}
            <div className="flex items-center gap-2">
              <Button
                variant={showCriticalPath ? "default" : "outline"}
                size="sm"
                onClick={handleToggleCriticalPath}
                data-testid="button-toggle-critical-path"
              >
                <Target className="w-4 h-4 mr-1" />
                Critical Path
              </Button>
              
              <Button
                variant={isAutoScheduling ? "default" : "outline"}
                size="sm"
                onClick={handleToggleAutoScheduling}
                data-testid="button-toggle-auto-schedule"
              >
                {isAutoScheduling ? (
                  <Play className="w-4 h-4 mr-1" />
                ) : (
                  <Pause className="w-4 h-4 mr-1" />
                )}
                Auto-Schedule
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                data-testid="button-export-pdf"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Package className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{ptOperations.length}</span> Operations
              </div>
              <div className="flex items-center gap-1">
                <Wrench className="w-4 h-4 text-green-500" />
                <span className="font-medium">{ptResources.length}</span> Resources
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span className="font-medium">{calculateOverallUtilization()}%</span> Utilization
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedule" data-testid="tab-schedule">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule View
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-[600px]">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>Loading production schedule...</p>
                  </div>
                </div>
              ) : schedulerResources.length > 0 ? (
                <div style={{ height: '700px' }}>
                  {React.createElement(BryntumSchedulerPro as any, {
                    ref: schedulerRef,
                    ...schedulerProConfig,
                    onReady: (scheduler: any) => {
                      console.log('📊 Bryntum Scheduler Pro Ready - Detailed Debug:');
                      console.log('Resources in store:', scheduler.resourceStore?.count || 0);
                      console.log('Events in store:', scheduler.eventStore?.count || 0);
                      console.log('Assignments in store:', scheduler.assignmentStore?.count || 0);
                      
                      // List all resources with their visibility status
                      if (scheduler.resourceStore) {
                        const allResources = scheduler.resourceStore.records;
                        console.log('📋 Resource Details:');
                        allResources.forEach((r: any) => {
                          // Count assignments for this resource instead of checking events for resourceId
                          const assignmentCount = scheduler.assignmentStore?.records?.filter((a: any) => a.resourceId === r.id).length || 0;
                          console.log(`  - ${r.name} (id: ${r.id}) - Hidden: ${r.hidden}, Assignments: ${assignmentCount}`);
                        });
                        
                        // Force show ALL resources
                        scheduler.resourceStore.forEach((resource: any) => {
                          resource.hidden = false;
                        });
                      }
                      
                      // Clear any resource filters
                      if (scheduler.resourceStore?.clearFilters) {
                        scheduler.resourceStore.clearFilters();
                        console.log('✅ Cleared resource store filters');
                      }
                      
                      console.log('Final resource count:', scheduler.resourceStore?.count || 0);
                      console.log('✅ Scheduler Pro fully initialized with proper data model');
                    }
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[600px]">
                  <div className="text-center">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-yellow-500" />
                    <p>No resources available. Please add resources to view the schedule.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ptOperations.length}</div>
                <p className="text-xs text-muted-foreground">
                  {ptOperations.filter(op => op.status === 'In Progress').length} in progress
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Resources</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ptResources.filter(r => r.active).length}</div>
                <p className="text-xs text-muted-foreground">
                  {ptResources.filter(r => r.isBottleneck).length} bottlenecks
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calculateOEE()}%</div>
                <p className="text-xs text-muted-foreground">
                  Target: 95%
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Operations</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {ptOperations.filter(op => op.status === 'critical').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires immediate attention
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduler Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Scheduling Rules</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={isAutoScheduling} onChange={() => setIsAutoScheduling(!isAutoScheduling)} />
                    <span>Enable automatic scheduling</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={showCriticalPath} onChange={() => setShowCriticalPath(!showCriticalPath)} />
                    <span>Show critical path</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span>Honor resource constraints</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span>Consider working hours</span>
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Display Options</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span>Show resource utilization bars</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span>Show operation dependencies</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span>Show tooltips on hover</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span>Enable drag and drop</span>
                  </label>
                </div>
              </div>
              
              <Button className="w-full" data-testid="button-save-settings">
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
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
  Wrench
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

  // Fetch PT resources
  const { data: ptResources = [], isLoading: isLoadingResources } = useQuery<PTResource[]>({
    queryKey: ['/api/pt-resources'],
  });

  // Fetch PT operations
  const { data: ptOperations = [], isLoading: isLoadingOperations } = useQuery<PTOperation[]>({
    queryKey: ['/api/pt-operations'],
  });

  // Fetch manufacturing orders
  const { data: manufacturingOrders = [], isLoading: isLoadingOrders } = useQuery<PTManufacturingOrder[]>({
    queryKey: ['/api/manufacturing-orders'],
  });

  // Fetch PT dependencies
  const { data: ptDependencies = [], isLoading: isLoadingDependencies } = useQuery<PTDependency[]>({
    queryKey: ['/api/pt-dependencies'],
  });

  // Transform PT data for Bryntum format
  const transformResourcesForBryntum = (resources: PTResource[]) => {
    return resources.map((resource, index) => ({
      id: `resource-${resource.id}`,
      name: resource.name || `Resource ${resource.id}`,
      category: resource.category || 'Manufacturing',
      capacity: resource.capacity || 100,
      efficiency: resource.efficiency || 100,
      isBottleneck: resource.isBottleneck || false,
      plantName: resource.plantName || 'Main Plant',
      iconCls: resource.isBottleneck ? 'b-fa b-fa-exclamation-triangle' : 'b-fa b-fa-industry',
      eventColor: resource.isBottleneck ? 'red' : (index % 2 === 0 ? 'blue' : 'green'),
      active: resource.active !== false,
      // Additional fields for resource utilization
      maxLoad: 100,
      unit: '%'
    }));
  };

  const transformOperationsForBryntum = (operations: PTOperation[]) => {
    return operations.map((op) => ({
      id: `event-${op.id}`,
      name: op.name || `Operation ${op.id}`,
      resourceId: op.resourceId ? `resource-${op.resourceId}` : undefined,
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
      // Constraints
      constraintType: op.dueDate ? 'finishnolaterthan' : null,
      constraintDate: op.dueDate ? new Date(op.dueDate) : null,
      // Dependencies
      effort: op.duration ? op.duration / 60 : 1, // Convert to hours
      effortUnit: 'hour',
      schedulingMode: 'Normal'
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

  // Transform data for Bryntum
  const schedulerResources = transformResourcesForBryntum(ptResources);
  const schedulerEvents = transformOperationsForBryntum(ptOperations);
  const schedulerDependencies = ptDependencies.map(dep => ({
    id: dep.id,
    fromEvent: dep.fromEvent,
    toEvent: dep.toEvent,
    type: dep.type || 2,
    lag: dep.lag || 0,
    lagUnit: dep.lagUnit || 'day'
  }));

  // Debug resource/event mapping
  console.log('🔍 Resource/Event Mapping Debug:', {
    resourcesLen: schedulerResources.length,
    uniqueResourceIds: new Set(schedulerResources.map(r => r.id)).size,
    eventsLen: schedulerEvents.length,
    assignedDistinct: new Set(schedulerEvents.map(e => e.resourceId).filter(Boolean)).size,
    resourceIds: schedulerResources.map(r => r.id).slice(0, 5),
    eventResourceIds: schedulerEvents.map(e => e.resourceId).filter(Boolean).slice(0, 5)
  });

  // Bryntum Scheduler Pro configuration
  const schedulerProConfig = {
    startDate: startOfDay(new Date()),
    endDate: endOfDay(addDays(new Date(), 90)),
    viewPreset: viewPreset, // Use built-in Bryntum preset names directly
    
    // Data configuration
    resources: schedulerResources,
    events: schedulerEvents,
    dependencies: schedulerDependencies,
    
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
        text: 'Resources',
        field: 'name',
        width: 200,
        type: 'tree',
        renderer: ({ record, value }: any) => {
          const iconClass = record.isBottleneck ? 'text-red-500' : 'text-blue-500';
          return `
            <div class="flex items-center gap-2">
              <i class="${record.iconCls} ${iconClass}"></i>
              <span>${value}</span>
              ${record.isBottleneck ? '<span class="text-xs text-red-500">(Bottleneck)</span>' : ''}
            </div>
          `;
        }
      },
      {
        text: 'Type',
        field: 'category',
        width: 120
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
    
    // View presets
    presets: [
      {
        id: 'hourAndDay',
        tickWidth: 60,
        displayDateFormat: 'HH:mm',
        shiftIncrement: 1,
        shiftUnit: 'day',
        headers: [
          { unit: 'day', dateFormat: 'ddd MMM DD' },
          { unit: 'hour', dateFormat: 'HH' }
        ]
      },
      {
        id: 'weekAndDay',
        tickWidth: 100,
        displayDateFormat: 'MMM DD',
        shiftIncrement: 1,
        shiftUnit: 'week',
        headers: [
          { unit: 'week', dateFormat: 'MMM DD' },
          { unit: 'day', dateFormat: 'ddd DD' }
        ]
      },
      {
        id: 'monthAndWeek',
        tickWidth: 150,
        displayDateFormat: 'MMM DD',
        shiftIncrement: 1,
        shiftUnit: 'month',
        headers: [
          { unit: 'month', dateFormat: 'MMMM YYYY' },
          { unit: 'week', dateFormat: 'DD' }
        ]
      }
    ],
    
    // Project model configuration for automatic scheduling
    project: {
      autoLoad: false,
      autoSync: false,
      
      // Event listeners
      listeners: {
        change: ({ source }: any) => {
          console.log('Project changed:', source);
        }
      }
    }
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
        
        // Clear existing data using proper Bryntum API
        if (project.resourceStore) {
          project.resourceStore.removeAll();
        }
        if (project.eventStore) {
          project.eventStore.removeAll();
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
        
        // Load dependencies
        if (ptDependencies.length > 0 && project.dependencyStore) {
          project.dependencyStore.add(ptDependencies);
        }
        
        // Auto-schedule if enabled
        if (isAutoScheduling) {
          project.commitAsync();
        }
        
        console.log('Loaded', transformedResources.length, 'resources,', transformedEvents.length, 'events, and', ptDependencies.length, 'dependencies');
      } catch (error) {
        console.error('Error loading scheduler data:', error);
      }
    }
  }, [ptResources, ptOperations, ptDependencies, isLoadingResources, isLoadingOperations, isLoadingDependencies, isAutoScheduling]);

  // Handler functions
  const handleZoomIn = () => {
    if (schedulerRef.current) {
      schedulerRef.current.instance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (schedulerRef.current) {
      schedulerRef.current.instance.zoomOut();
    }
  };

  const handleZoomToFit = () => {
    if (schedulerRef.current) {
      schedulerRef.current.instance.zoomToFit();
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
                  <SelectItem value="weekAndDay">Week & Day</SelectItem>
                  <SelectItem value="monthAndWeek">Month & Week</SelectItem>
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
                    resources: schedulerResources,
                    events: schedulerEvents,
                    dependencies: schedulerDependencies,
                    startDate: startOfDay(new Date()),
                    endDate: endOfDay(addDays(new Date(), 90)),
                    viewPreset: "weekAndDay",
                    columns: [
                      { text: 'Name', field: 'name', width: 150 },
                      { text: 'Category', field: 'category', width: 100 }
                    ],
                    // Force show all resources including unassigned ones
                    hideUnassignedResources: false,
                    enableEventAnimations: false,
                    features: {
                      eventDrag: true,
                      eventResize: true,
                      eventEdit: true,
                      dependencies: true,
                      timeRanges: {
                        showCurrentTimeLine: true
                      },
                      // Disable resource filter to show all resources
                      resourceFilter: false
                    },
                    onSchedulerReady: (scheduler: any) => {
                      console.log('📊 Bryntum Scheduler Ready - Store Debug:');
                      console.log('Resources in store:', scheduler.resourceStore?.count || 0);
                      console.log('Events in store:', scheduler.eventStore?.count || 0);
                      console.log('Assignments in store:', scheduler.assignmentStore?.count || 0);
                      console.log('Resource filters:', scheduler.resourceStore?.filters?.length || 0);
                      
                      // Clear any resource filters
                      if (scheduler.resourceStore?.clearFilters) {
                        scheduler.resourceStore.clearFilters();
                        console.log('✅ Cleared resource store filters');
                      }
                      
                      // Disable hide unassigned resources if it exists
                      if ('hideUnassignedResources' in scheduler) {
                        scheduler.hideUnassignedResources = false;
                        console.log('✅ Disabled hideUnassignedResources');
                      }
                      
                      // Clear resource filter feature if it exists
                      if (scheduler.features?.resourceFilter?.clearFilters) {
                        scheduler.features.resourceFilter.clearFilters();
                        console.log('✅ Cleared resource filter feature');
                      }
                      
                      console.log('Final resource count:', scheduler.resourceStore?.count || 0);
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
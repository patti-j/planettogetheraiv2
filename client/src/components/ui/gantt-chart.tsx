import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal, ZoomIn, ZoomOut, Eye, Settings, GripVertical, Maximize2, Minimize2, Wrench, Users, User, Building2, Palette, Type, Edit3, Trash2, Calendar, Clock, AlertTriangle, BarChart3, Activity, Zap, Target, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import OperationBlock from "./operation-block";
import OperationForm from "../operation-form";
import ResourceForm from "../resource-form";
import ResourceViewManager from "../resource-view-manager";
import TextLabelConfigDialog from "../text-label-config-dialog";
import CustomTextLabelManager from "../custom-text-label-manager";
import { JobDetailsDialog } from "../kanban-board";
import { useOperationDrop } from "@/hooks/use-drag-drop-fixed";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useToast } from "@/hooks/use-toast";
import GanttToolbar, { ZoomLevel, FadeMode } from "./gantt-toolbar";
import ActivityBlockSegments, { ActivitySegment } from "./activity-block-segments";
import GanttActivityLinks, { ActivityLink } from "./gantt-activity-links";
import GanttSchedulingHints, { SchedulingHint, generateSchedulingHints } from "./gantt-scheduling-hints";
import { GanttExportUtility } from "./gantt-export-utility";
import type { ProductionOrder, DiscreteOperation, Resource, Capability, ResourceView } from "@shared/schema";

interface GanttChartProps {
  jobs: ProductionOrder[];
  operations: DiscreteOperation[];
  resources: Resource[];
  capabilities: Capability[];
  view: "operations" | "resources" | "customers";
  selectedResourceViewId?: number | null;
  onResourceViewChange?: (viewId: number | null) => void;
  rowHeight?: number;
  onRowHeightChange?: (height: number) => void;
}

type TimeUnit = "hour" | "shift" | "day" | "week" | "month" | "quarter" | "year" | "decade";

export default function GanttChart({ 
  jobs, 
  operations, 
  resources, 
  capabilities, 
  view,
  selectedResourceViewId: externalSelectedResourceViewId,
  onResourceViewChange,
  rowHeight = 60,
  onRowHeightChange
}: GanttChartProps) {
  
  // Debug: Log the received props to understand data structure
  console.log('GanttChart received props:', {
    jobsCount: jobs?.length,
    operationsCount: operations?.length,
    resourcesCount: resources?.length,
    firstOperation: operations?.[0],
    firstResource: resources?.[0],
    operationsWithWorkCenterId: operations?.filter(op => op.workCenterId)?.length,
    operationsWithTimes: operations?.filter(op => op.startTime && op.endTime)?.length
  });
  // Note: No longer using expandedJobs since we show resources directly
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [selectedOperation, setSelectedOperation] = useState<DiscreteOperation | null>(null);
  const [operationDialogOpen, setOperationDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ProductionOrder | null>(null);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  // Default zoom level (session-only persistence)
  const [timeUnit, setTimeUnit] = useState<TimeUnit>("day");
  const [timelineScrollLeft, setTimelineScrollLeft] = useState(0);
  const [resourceListScrollTop, setResourceListScrollTop] = useState(0);
  const [internalSelectedResourceViewId, setInternalSelectedResourceViewId] = useState<number | null>(null);
  const [resourceViewManagerOpen, setResourceViewManagerOpen] = useState(false);
  const [textConfigDialogOpen, setTextConfigDialogOpen] = useState(false);
  const [customTextLabelManagerOpen, setCustomTextLabelManagerOpen] = useState(false);
  const [defaultColorScheme, setDefaultColorScheme] = useState("priority");
  const [defaultTextLabeling, setDefaultTextLabeling] = useState("");
  const [hoveredJobId, setHoveredJobId] = useState<number | null>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(320); // Default width in pixels
  const [isResizing, setIsResizing] = useState(false);
  
  // New states for enhanced Gantt features
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');
  const [fadeMode, setFadeMode] = useState<FadeMode>('none');
  const [showTooltips, setShowTooltips] = useState(true);
  const [showActivityLinks, setShowActivityLinks] = useState(false);
  const [showSchedulingHints, setShowSchedulingHints] = useState(false);
  const [dailyView, setDailyView] = useState(false);
  const [variableZoom, setVariableZoom] = useState(false);
  const [variableZoomFactor, setVariableZoomFactor] = useState(2);
  const [anchorOnDrop, setAnchorOnDrop] = useState(false);
  const [lockOnDrop, setLockOnDrop] = useState(false);
  const [expediteSuccessors, setExpediteSuccessors] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [highlightedActivities, setHighlightedActivities] = useState<Set<number>>(new Set());
  const [activityLinks, setActivityLinks] = useState<ActivityLink[]>([]);
  const [schedulingHints, setSchedulingHints] = useState<SchedulingHint[]>([]);
  const ganttContainerRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Refs for timeline and resource list
  const timelineRef = useRef<HTMLDivElement>(null);
  const resourceListRef = useRef<HTMLDivElement>(null);
  
  // Use external state if provided, otherwise use internal state
  const selectedResourceViewId = externalSelectedResourceViewId !== undefined ? externalSelectedResourceViewId : internalSelectedResourceViewId;
  const setSelectedResourceViewId = (viewId: number | null) => {
    if (onResourceViewChange) {
      onResourceViewChange(viewId);
    } else {
      setInternalSelectedResourceViewId(viewId);
    }
  };
  // No localStorage persistence - zoom level is session-only

  // Create a truly stable base date that never changes
  const timelineBaseDate = useMemo(() => new Date(2025, 6, 13, 7, 0, 0, 0), []); // Fixed to July 13, 2025 07:00:00
  
  // Generate activity links from operations
  useEffect(() => {
    const links: ActivityLink[] = [];
    const opsByJob = new Map<number, DiscreteOperation[]>();
    
    // Group operations by job
    operations.forEach(op => {
      if (op.productionOrderId) {
        if (!opsByJob.has(op.productionOrderId)) {
          opsByJob.set(op.productionOrderId, []);
        }
        opsByJob.get(op.productionOrderId)!.push(op);
      }
    });
    
    // Generate links for operations in the same job
    opsByJob.forEach((jobOps, jobId) => {
      const sortedOps = jobOps.sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
      
      for (let i = 0; i < sortedOps.length - 1; i++) {
        if (sortedOps[i].startTime && sortedOps[i + 1].startTime) {
          links.push({
            fromId: sortedOps[i].id,
            toId: sortedOps[i + 1].id,
            type: 'finish-to-start',
            lag: 0,
            critical: false // Could be calculated based on critical path analysis
          });
        }
      }
    });
    
    setActivityLinks(links);
  }, [operations]);
  
  // Generate scheduling hints
  useEffect(() => {
    if (showSchedulingHints) {
      const hints = generateSchedulingHints(operations, resources, activityLinks);
      setSchedulingHints(hints);
    } else {
      setSchedulingHints([]);
    }
  }, [operations, resources, activityLinks, showSchedulingHints]);
  
  // Apply fade effect based on mode
  useEffect(() => {
    if (fadeMode === 'none' || !selectedActivityId) {
      setHighlightedActivities(new Set());
      return;
    }
    
    const highlighted = new Set<number>();
    const selectedOp = operations.find(op => op.id === selectedActivityId);
    
    if (!selectedOp) return;
    
    switch (fadeMode) {
      case 'activity':
        highlighted.add(selectedActivityId);
        break;
      case 'job':
        operations
          .filter(op => op.productionOrderId === selectedOp.productionOrderId)
          .forEach(op => highlighted.add(op.id));
        break;
      case 'operation':
        operations
          .filter(op => op.operationName === selectedOp.operationName)
          .forEach(op => highlighted.add(op.id));
        break;
      case 'all-relations':
        // Add all connected operations
        activityLinks
          .filter(link => link.fromId === selectedActivityId || link.toId === selectedActivityId)
          .forEach(link => {
            highlighted.add(link.fromId);
            highlighted.add(link.toId);
          });
        break;
    }
    
    setHighlightedActivities(highlighted);
  }, [fadeMode, selectedActivityId, operations, activityLinks]);
  
  // Mutation to update resource view sequence
  const updateResourceViewMutation = useMutation({
    mutationFn: async ({ viewId, resourceSequence }: { viewId: number; resourceSequence: number[] }) => {
      const response = await apiRequest("PUT", `/api/resource-views/${viewId}`, { resourceSequence });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resource-views"] });
      toast({ title: "Resource sequence updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update resource sequence", variant: "destructive" });
    },
  });
  
  // Function to handle reordering resources within a view
  const handleResourceReorder = (fromIndex: number, toIndex: number) => {
    if (!selectedResourceView || fromIndex === toIndex) return;
    
    const newSequence = [...selectedResourceView.resourceSequence];
    const [moved] = newSequence.splice(fromIndex, 1);
    newSequence.splice(toIndex, 0, moved);
    
    updateResourceViewMutation.mutate({
      viewId: selectedResourceView.id,
      resourceSequence: newSequence
    });
  }

  const handleRemoveResourceFromGantt = (resource: Resource) => {
    if (!selectedResourceView) {
      toast({ title: "No resource view selected", variant: "destructive" });
      return;
    }
    
    const updatedSequence = selectedResourceView.resourceSequence.filter(id => id !== resource.id);
    
    updateResourceViewMutation.mutate({
      viewId: selectedResourceView.id,
      resourceSequence: updatedSequence
    });
    
    toast({ title: `${resource.name} removed from ${selectedResourceView.name}` });
  };

  const handleResourceAction = (resource: Resource, action: string) => {
    switch (action) {
      case 'edit':
        // Open resource edit dialog
        setSelectedResource(resource);
        setResourceDialogOpen(true);
        break;
      case 'schedule':
        // Open scheduling dialog for resource
        console.log('Schedule operations for:', resource);
        break;
      case 'view_schedule':
        // Show detailed schedule view
        console.log('View schedule for:', resource);
        break;
      case 'maintenance':
        // Schedule maintenance for resource
        console.log('Schedule maintenance for:', resource);
        break;
      case 'remove_from_gantt':
        // Remove resource from current gantt view
        handleRemoveResourceFromGantt(resource);
        break;
      case 'delete':
        // Delete resource (with confirmation)
        if (confirm(`Are you sure you want to delete ${resource.name}?`)) {
          console.log('Delete resource:', resource);
          // TODO: Implement actual deletion
        }
        break;
      default:
        console.log('Unknown action:', action);
    }
  };
  
  // Fetch resource views
  const { data: resourceViews = [] } = useQuery<ResourceView[]>({
    queryKey: ["/api/resource-views"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/resource-views");
      return response.json();
    },
  });

  // Fetch custom text labels
  const { data: customTextLabels = [] } = useQuery({
    queryKey: ["/api/custom-text-labels"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/custom-text-labels");
      return response.json();
    },
  });
  
  // Get the currently selected resource view
  const selectedResourceView = useMemo(() => {
    if (selectedResourceViewId) {
      return resourceViews.find(v => v.id === selectedResourceViewId);
    }
    // If no view is selected, don't use any view for All Resources
    return null;
  }, [resourceViews, selectedResourceViewId]);
  
  // Calculate resource utilization and scheduling metrics
  const resourceMetrics = useMemo(() => {
    const metrics = new Map<number, {
      utilization: number;
      scheduledHours: number;
      availableHours: number;
      upcomingOperations: number;
      overdueOperations: number;
      conflictCount: number;
      efficiency: number;
    }>();

    resources.forEach(resource => {
      const resourceOperations = operations.filter(op => 
        op.workCenterId === resource.id && op.startTime && op.endTime
      );

      // Calculate scheduled hours for this resource
      let scheduledHours = 0;
      let overdueOperations = 0;
      let upcomingOperations = 0;
      let conflictCount = 0;

      const now = new Date();
      const timeSlots: Array<{start: Date, end: Date}> = [];

      resourceOperations.forEach(op => {
        const startTime = new Date(op.startTime!);
        const endTime = new Date(op.endTime!);
        const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        
        scheduledHours += durationHours;

        // Check for overdue operations
        if (endTime < now && op.status !== 'completed') {
          overdueOperations++;
        }

        // Check for upcoming operations
        if (startTime > now) {
          upcomingOperations++;
        }

        // Check for overlapping time slots (conflicts)
        const hasConflict = timeSlots.some(slot => 
          (startTime < slot.end && endTime > slot.start)
        );
        if (hasConflict) {
          conflictCount++;
        }

        timeSlots.push({start: startTime, end: endTime});
      });

      // Calculate available hours (assuming 8-hour workdays, 5 days a week)
      const availableHours = 40; // Weekly available hours
      const utilization = Math.min((scheduledHours / availableHours) * 100, 100);
      
      // Calculate efficiency based on completed vs scheduled operations
      const completedOps = resourceOperations.filter(op => op.status === 'completed').length;
      const efficiency = resourceOperations.length > 0 ? (completedOps / resourceOperations.length) * 100 : 0;

      metrics.set(resource.id, {
        utilization,
        scheduledHours,
        availableHours,
        upcomingOperations,
        overdueOperations,
        conflictCount,
        efficiency
      });
    });

    return metrics;
  }, [resources, operations]);

  // Order resources according to the selected view
  const orderedResources = useMemo(() => {
    if (view !== "resources") {
      return resources;
    }
    
    // If no specific view is selected (All Resources), show all resources
    if (!selectedResourceViewId) {
      return resources;
    }
    
    // If a specific view is selected, only show resources in that view
    if (selectedResourceView) {
      const orderedList: Resource[] = [];
      
      // Add ONLY resources in the order specified by the view
      selectedResourceView.resourceSequence.forEach(resourceId => {
        const resource = resources.find(r => r.id === resourceId);
        if (resource) {
          orderedList.push(resource);
        }
      });
      
      return orderedList;
    }
    
    // Fallback to all resources
    return resources;
  }, [resources, selectedResourceView, selectedResourceViewId, view]);

  // Get color scheme and text labeling from selected resource view or default values
  const colorScheme = selectedResourceView?.colorScheme || defaultColorScheme;
  const textLabeling = selectedResourceView?.textLabeling || defaultTextLabeling;
  
  // Debug logging
  useEffect(() => {
    console.log("Text labeling changed:", textLabeling, "for view:", selectedResourceView?.name);
  }, [textLabeling, selectedResourceView?.name]);



  // Handler for quick color scheme changes
  const handleColorSchemeChange = async (newColorScheme: string) => {
    if (!selectedResourceView) {
      toast({ title: "Select a resource view to change color scheme", variant: "destructive" });
      return;
    }
    
    try {
      await apiRequest("PUT", `/api/resource-views/${selectedResourceView.id}`, {
        colorScheme: newColorScheme
      });
      queryClient.invalidateQueries({ queryKey: ["/api/resource-views"] });
      toast({ title: `Color scheme changed to ${newColorScheme.replace("by_", "").replace("_", " ")}` });
    } catch (error) {
      toast({ title: "Failed to change color scheme", variant: "destructive" });
    }
  };

  // Handler for quick text labeling changes
  const handleTextLabelingChange = async (newTextLabeling: string) => {
    if (!selectedResourceView) {
      toast({ title: "Select a resource view to change text labeling", variant: "destructive" });
      return;
    }
    
    try {
      await apiRequest("PUT", `/api/resource-views/${selectedResourceView.id}`, {
        textLabeling: newTextLabeling
      });
      
      // Force invalidation of the resource views cache
      await queryClient.invalidateQueries({ queryKey: ["/api/resource-views"] });
      
      // Show success message with better display name
      const displayName = getTextLabelingDisplayName(newTextLabeling);
      toast({ title: `Text labeling changed to ${displayName}` });
    } catch (error) {
      console.error("Failed to change text labeling:", error);
      toast({ title: "Failed to change text labeling", variant: "destructive" });
    }
  };
  
  const isDraggingTimeline = useRef(false);
  const isDraggingResourceList = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Handle operation drag start for unscheduled operations
  const handleOperationDrag = useCallback((e: React.DragEvent, operation: DiscreteOperation) => {
    e.dataTransfer.setData("application/json", JSON.stringify({
      type: "operation",
      operation: operation
    }));
    e.dataTransfer.effectAllowed = "move";
  }, []);

  // Generate dynamic time scale based on time unit and operations
  const timeScale = useMemo(() => {
    const periods = [];
    const today = new Date(2025, 7, 7); // August 7, 2025 - today
    
    // Calculate the date range centered on today/this week
    let minDate = today;
    let maxDate = today;
    
    // Find the earliest and latest operation dates
    operations.forEach(op => {
      if (op.startTime) {
        const startDate = new Date(op.startTime);
        if (startDate < minDate) minDate = startDate;
        
        if (op.endTime) {
          const endDate = new Date(op.endTime);
          if (endDate > maxDate) maxDate = endDate;
        }
      }
    });
    
    // Always include at least this week - ensure we show current week
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
    
    // Expand range to include this week minimum
    minDate = new Date(Math.min(minDate.getTime(), weekStart.getTime()));
    maxDate = new Date(Math.max(maxDate.getTime(), weekEnd.getTime()));
    
    // Add reasonable padding based on time unit
    const paddingDays = timeUnit === 'day' ? 7 : timeUnit === 'week' ? 14 : 30;
    const paddingMs = paddingDays * 24 * 60 * 60 * 1000; 
    minDate = new Date(minDate.getTime() - paddingMs);
    maxDate = new Date(maxDate.getTime() + paddingMs);
    
    let stepMs: number;
    let periodCount: number;
    
    switch (timeUnit) {
      case "hour":
        stepMs = 60 * 60 * 1000; // 1 hour in milliseconds
        periodCount = Math.ceil((maxDate.getTime() - minDate.getTime()) / stepMs);
        break;
      case "shift":
        stepMs = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        periodCount = Math.ceil((maxDate.getTime() - minDate.getTime()) / stepMs);
        break;
      case "day":
        stepMs = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        periodCount = Math.ceil((maxDate.getTime() - minDate.getTime()) / stepMs);
        break;
      case "week":
        stepMs = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
        periodCount = Math.ceil((maxDate.getTime() - minDate.getTime()) / stepMs);
        break;
      case "month":
        stepMs = 30 * 24 * 60 * 60 * 1000; // ~1 month in milliseconds
        periodCount = Math.ceil((maxDate.getTime() - minDate.getTime()) / stepMs);
        break;
      case "quarter":
        stepMs = 90 * 24 * 60 * 60 * 1000; // ~1 quarter in milliseconds
        periodCount = Math.ceil((maxDate.getTime() - minDate.getTime()) / stepMs);
        break;
      case "year":
        stepMs = 365 * 24 * 60 * 60 * 1000; // ~1 year in milliseconds
        periodCount = Math.ceil((maxDate.getTime() - minDate.getTime()) / stepMs);
        break;
      case "decade":
        stepMs = 3650 * 24 * 60 * 60 * 1000; // ~1 decade in milliseconds
        periodCount = Math.ceil((maxDate.getTime() - minDate.getTime()) / stepMs);
        break;
    }
    
    // Ensure minimum periods for usability
    const minPeriods = timeUnit === "hour" ? 24 : timeUnit === "day" ? 30 : timeUnit === "week" ? 12 : 6;
    periodCount = Math.max(periodCount, minPeriods);
    
    for (let i = 0; i < periodCount; i++) {
      const date = new Date(minDate.getTime() + (i * stepMs));
      let label: string;
      let subLabel: string;
      
      switch (timeUnit) {
        case "hour":
          label = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
          subLabel = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
          break;
        case "shift":
          const shiftHour = date.getHours();
          const shiftName = shiftHour >= 0 && shiftHour < 8 ? "Night" : 
                           shiftHour >= 8 && shiftHour < 16 ? "Day" : "Evening";
          label = `${shiftName} Shift`;
          subLabel = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
          break;
        case "day":
          label = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
          subLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          break;
        case "week":
          const endOfWeek = new Date(date.getTime() + (6 * 24 * 60 * 60 * 1000));
          label = `Week ${Math.ceil((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
          subLabel = `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          break;
        case "month":
          label = date.toLocaleDateString('en-US', { month: 'short' });
          subLabel = date.toLocaleDateString('en-US', { year: 'numeric' });
          break;
        case "quarter":
          const quarter = Math.ceil((date.getMonth() + 1) / 3);
          label = `Q${quarter}`;
          subLabel = date.toLocaleDateString('en-US', { year: 'numeric' });
          break;
        case "year":
          label = date.toLocaleDateString('en-US', { year: 'numeric' });
          subLabel = `${date.getFullYear()}`;
          break;
        case "decade":
          const decade = Math.floor(date.getFullYear() / 10) * 10;
          label = `${decade}s`;
          subLabel = `${decade}-${decade + 9}`;
          break;
      }
      
      periods.push({
        date,
        label,
        subLabel,
        value: i
      });
    }
    
    return { periods, minDate, maxDate, stepMs };
  }, [timeUnit, operations]);

  // Calculate timeline dimensions
  const timelineWidth = useMemo(() => {
    const baseWidth = 200; // Base width per period
    return timeScale.periods.length * baseWidth;
  }, [timeScale]);

  const periodWidth = useMemo(() => {
    return timelineWidth / timeScale.periods.length;
  }, [timelineWidth, timeScale]);

  // Scroll to today function
  const handleScrollToToday = useCallback(() => {
    console.log('Scroll to today called');
    // Calculate scroll position for today's date
    // Set today to August 7, 2025 at start of day to match the actual date
    const today = new Date(2025, 7, 7, 0, 0, 0, 0); // Month is 0-indexed, so 7 = August
    const timeDiff = today.getTime() - timeScale.minDate.getTime();
    const scrollLeft = (timeDiff / timeScale.stepMs) * periodWidth;
    console.log('Today scroll calculation:', {
      today: today.toISOString(),
      minDate: timeScale.minDate.toISOString(),
      timeDiff,
      stepMs: timeScale.stepMs,
      periodWidth,
      scrollLeft
    });
    setTimelineScrollLeft(scrollLeft);
    
    if (timelineRef.current) {
      timelineRef.current.scrollLeft = scrollLeft;
    }
  }, [timeScale.minDate, timeScale.stepMs, periodWidth]);

  // AI Event Listeners
  useEffect(() => {
    const handleAIGanttZoom = (event: any) => {
      console.log('AI Gantt Zoom event received:', event.detail);
      const { zoomLevel } = event.detail;
      const validZoomLevels = ["hour", "day", "week", "month"];
      if (validZoomLevels.includes(zoomLevel)) {
        console.log('Setting zoom level to:', zoomLevel);
        setTimeUnit(zoomLevel as TimeUnit);
      }
    };

    const handleAIGanttScroll = (event: any) => {
      console.log('AI Gantt Scroll event received:', event.detail);
      const { scrollPosition } = event.detail;
      // Handle scroll position - can be percentage or date-based
      if (typeof scrollPosition === 'string' && scrollPosition.endsWith('%')) {
        const percentage = parseInt(scrollPosition.replace('%', ''));
        if (percentage >= 0 && percentage <= 100) {
          // Calculate scroll position based on timeline width
          const scrollLeft = (timelineWidth * percentage) / 100;
          console.log('Percentage scroll - setting scroll to:', scrollLeft);
          setTimelineScrollLeft(scrollLeft);
          
          // Apply to the timeline containers
          if (timelineRef.current) {
            timelineRef.current.scrollLeft = scrollLeft;
          }
        }
      } else if (typeof scrollPosition === 'string' && scrollPosition.includes('-')) {
        // Handle date-based scrolling
        try {
          const targetDate = new Date(scrollPosition);
          const timeDiff = targetDate.getTime() - timeScale.minDate.getTime();
          const scrollLeft = (timeDiff / timeScale.stepMs) * periodWidth;
          console.log('Date scroll - setting scroll to:', scrollLeft);
          setTimelineScrollLeft(scrollLeft);
          
          if (timelineRef.current) {
            timelineRef.current.scrollLeft = scrollLeft;
          }
        } catch (error) {
          console.error('Invalid date format for scroll position:', scrollPosition);
        }
      }
    };



    window.addEventListener('aiGanttZoom', handleAIGanttZoom);
    window.addEventListener('aiGanttScroll', handleAIGanttScroll);
    window.addEventListener('aiScrollToToday', handleScrollToToday);

    return () => {
      window.removeEventListener('aiGanttZoom', handleAIGanttZoom);
      window.removeEventListener('aiGanttScroll', handleAIGanttScroll);
      window.removeEventListener('aiScrollToToday', handleScrollToToday);
    };
  }, [timelineWidth, timeScale, periodWidth]);

  // Auto-scroll to today on initial load
  useEffect(() => {
    // Wait for timeline to be rendered then scroll to today
    const timer = setTimeout(() => {
      if (timelineRef.current && periodWidth > 0) {
        handleScrollToToday();
      }
    }, 500); // Give enough time for rendering
    
    return () => clearTimeout(timer);
  }, [timeScale.minDate, periodWidth, handleScrollToToday]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    const zoomLevels: TimeUnit[] = ["decade", "year", "quarter", "month", "week", "day", "shift", "hour"];
    const currentIndex = zoomLevels.indexOf(timeUnit);
    if (currentIndex < zoomLevels.length - 1) {
      setTimeUnit(zoomLevels[currentIndex + 1]);
    }
    setTimelineScrollLeft(0); // Reset scroll position when zooming
  }, [timeUnit]);

  const zoomOut = useCallback(() => {
    const zoomLevels: TimeUnit[] = ["decade", "year", "quarter", "month", "week", "day", "shift", "hour"];
    const currentIndex = zoomLevels.indexOf(timeUnit);
    if (currentIndex > 0) {
      setTimeUnit(zoomLevels[currentIndex - 1]);
    }
    setTimelineScrollLeft(0); // Reset scroll position when zooming
  }, [timeUnit]);

  const resetZoom = useCallback(() => {
    setTimeUnit("day");
    setTimelineScrollLeft(0);
    setResourceListScrollTop(0);
  }, []);

  // Timeline drag handlers
  const handleTimelineMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't interfere with operation drag and drop
    const target = e.target as HTMLElement;
    if (target.closest('[data-operation-block]') || target.classList.contains('cursor-move')) {
      return;
    }
    
    if (e.button === 0) { // Left mouse button
      isDraggingTimeline.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingTimeline.current && timelineRef.current) {
      const deltaX = e.clientX - lastMousePos.current.x;
      const newScrollLeft = Math.max(0, timelineRef.current.scrollLeft - deltaX);
      timelineRef.current.scrollLeft = newScrollLeft;
      
      // Sync all timeline content positions using transforms
      const timelineContents = document.querySelectorAll('[data-timeline-content]');
      timelineContents.forEach((content) => {
        if (content instanceof HTMLElement) {
          content.style.transform = `translateX(-${newScrollLeft}px)`;
        }
      });
      
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
    
    if (isDraggingResourceList.current && resourceListRef.current) {
      const deltaY = e.clientY - lastMousePos.current.y;
      const newScrollTop = Math.max(0, resourceListRef.current.scrollTop - deltaY);
      resourceListRef.current.scrollTop = newScrollTop;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingTimeline.current = false;
    isDraggingResourceList.current = false;
  }, []);

  // Resource list drag handlers
  const handleResourceListMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't interfere with operation drag and drop
    const target = e.target as HTMLElement;
    if (target.closest('[data-operation-block]') || target.classList.contains('cursor-move')) {
      return;
    }
    
    if (e.button === 0) { // Left mouse button
      isDraggingResourceList.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }, []);

  // Resize handlers for the movable divider
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = leftPanelWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      const newWidth = Math.max(200, Math.min(600, startWidth + delta)); // Min 200px, Max 600px
      setLeftPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [leftPanelWidth]);

  // Set up global mouse event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Sync timeline content positions using CSS transforms instead of scroll synchronization
  useEffect(() => {
    const syncTimelinePositions = (scrollLeft: number) => {
      // Find all timeline content containers and apply transform
      const timelineContents = document.querySelectorAll('[data-timeline-content]');
      timelineContents.forEach((content) => {
        if (content instanceof HTMLElement) {
          content.style.transform = `translateX(-${scrollLeft}px)`;
        }
      });
    };

    if (timelineRef.current) {
      // Initial sync
      const initialScrollLeft = timelineRef.current.scrollLeft;
      syncTimelinePositions(initialScrollLeft);
      
      // Sync on any timeline scroll
      const timelineElement = timelineRef.current;
      let rafId: number | null = null;
      let lastScrollLeft = timelineElement.scrollLeft;
      
      const handleScroll = () => {
        // Check for both timeline dragging and operation dragging
        const isDraggingOperation = document.querySelector('[data-operation-block][class*="opacity-50"]') !== null;
        
        if (!isDraggingTimeline.current && !isDraggingOperation) {
          // Use requestAnimationFrame to ensure smooth updates
          if (rafId) {
            cancelAnimationFrame(rafId);
          }
          rafId = requestAnimationFrame(() => {
            const currentScrollLeft = timelineElement.scrollLeft;
            if (currentScrollLeft !== lastScrollLeft) {
              syncTimelinePositions(currentScrollLeft);
              lastScrollLeft = currentScrollLeft;
            }
            rafId = null;
          });
        }
      };
      
      // Use scroll event with higher sensitivity
      timelineElement.addEventListener('scroll', handleScroll, { passive: true });
      
      // Also use a polling mechanism for very small movements
      const pollInterval = setInterval(() => {
        // Check for both timeline dragging and operation dragging
        const isDraggingOperation = document.querySelector('[data-operation-block][class*="opacity-50"]') !== null;
        
        if (!isDraggingTimeline.current && !isDraggingOperation) {
          const currentScrollLeft = timelineElement.scrollLeft;
          if (currentScrollLeft !== lastScrollLeft) {
            syncTimelinePositions(currentScrollLeft);
            lastScrollLeft = currentScrollLeft;
          }
        }
      }, 16); // ~60fps polling
      
      return () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        clearInterval(pollInterval);
        timelineElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [timelineRef.current, resources.length, operations.length, view]);

  // Handle scrollbar scroll events - sync all timeline containers with timeline header
  const handleTimelineScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Check for both timeline dragging and operation dragging
    const isDraggingOperation = document.querySelector('[data-operation-block][class*="opacity-50"]') !== null;
    
    if (!isDraggingTimeline.current && !isDraggingOperation) {
      // Sync all timeline containers with the timeline header scroll
      const scrollLeft = e.currentTarget.scrollLeft;
      const timelineContainers = document.querySelectorAll('[data-resource-id]');
      timelineContainers.forEach((container) => {
        if (container instanceof HTMLElement && container.scrollLeft !== scrollLeft) {
          container.scrollLeft = scrollLeft;
        }
      });
    }
  }, []);

  const handleResourceListScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Just let the native scroll happen, no state synchronization needed
  }, []);

  // Note: toggleJobExpansion removed - no longer needed for resource-based layout

  const getOperationsByJob = useCallback((jobId: number) => {
    return operations.filter(op => op.productionOrderId === jobId).sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
  }, [operations]);

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-accent text-white";
      case "completed": return "bg-green-600 text-white";
      case "planned": return "bg-warning text-white";
      default: return "bg-gray-400 text-white";
    }
  };

  const getOperationStatusColor = (status: string) => {
    switch (status) {
      case "in-progress": return "bg-warning text-white";
      case "completed": return "bg-accent text-white";
      case "planned": return "bg-gray-400 text-white";
      default: return "bg-gray-400 text-white";
    }
  };

  const getCapabilityName = (capabilityId: number) => {
    return capabilities.find(c => c.id === capabilityId)?.name || "Unknown";
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'machine':
        return <Wrench className="w-4 h-4 text-gray-500" />;
      case 'person':
      case 'operator':
        return <Users className="w-4 h-4 text-gray-500" />;
      case 'facility':
        return <Building2 className="w-4 h-4 text-gray-500" />;
      default:
        return <Wrench className="w-4 h-4 text-gray-500" />;
    }
  };

  const getResourceName = (resourceId: number) => {
    return resources.find(r => r.id === resourceId)?.name || "Unassigned";
  };

  const getTextLabelingDisplayName = (textLabeling: string) => {
    if (textLabeling?.startsWith("custom_")) {
      const customLabelId = parseInt(textLabeling.replace("custom_", ""));
      const customLabel = customTextLabels.find((label: any) => label.id === customLabelId);
      return customLabel?.name || "Custom";
    }
    
    const displayNames: { [key: string]: string } = {
      "operation_name": "Operation",
      "job_name": "Job",
      "both": "Both",
      "duration": "Duration",
      "progress": "Progress",
      "none": "None",
      "due_date": "Due Date",
      "priority": "Priority",
      "status": "Status",
      "resource_name": "Resource",
      "customer": "Customer",
      "job_description": "Job Desc",
      "operation_description": "Op Desc",
      "resource_type": "Res Type",
      "capabilities": "Capabilities",
      "start_time": "Start Time",
      "end_time": "End Time",
      "slack_days": "Slack Days",
      "days_late": "Days Late",
      "completion_percent": "Completion %"
    };
    
    return displayNames[textLabeling] || "Text";
  };

  const getOrderedResources = () => {
    if (selectedResourceView && selectedResourceView.resourceSequence) {
      // Order resources according to the selected view
      const orderedResources = selectedResourceView.resourceSequence
        .map(resourceId => resources.find(r => r.id === resourceId))
        .filter(Boolean) as Resource[];
      
      // Add any resources not in the sequence at the end
      const remainingResources = resources.filter(r => 
        !selectedResourceView.resourceSequence.includes(r.id)
      );
      
      return [...orderedResources, ...remainingResources];
    }
    
    // Default ordering
    return resources;
  };

  // State to track connection line positions
  const [connectionLines, setConnectionLines] = useState<JSX.Element[]>([]);

  // Effect to update connection lines when hoveredJobId changes
  useEffect(() => {
    if (!hoveredJobId) {
      setConnectionLines([]);
      return;
    }

    // Small delay to ensure DOM elements are rendered
    const updateConnections = () => {
      const jobOperations = getOperationsByJob(hoveredJobId)
        .filter(op => op.startTime && op.endTime && op.workCenterId)
        .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime());

      console.log('Connection lines debug:', {
        hoveredJobId,
        totalOperations: getOperationsByJob(hoveredJobId).length,
        scheduledOperations: jobOperations.length,
        operations: jobOperations.map(op => ({ id: op.id, name: op.operationName, hasTime: !!op.startTime && !!op.endTime, hasResource: !!op.workCenterId }))
      });

      if (jobOperations.length < 2) {
        console.log('Not enough scheduled operations for connections:', jobOperations.length);
        setConnectionLines([]);
        return;
      }

      const connections = [];
      const containerRect = resourceListRef.current?.getBoundingClientRect();
      
      if (!containerRect) {
        setConnectionLines([]);
        return;
      }

      for (let i = 0; i < jobOperations.length - 1; i++) {
        const currentOp = jobOperations[i];
        const nextOp = jobOperations[i + 1];

        const currentOpElement = document.querySelector(`[data-operation-id="${currentOp.id}"]`);
        const nextOpElement = document.querySelector(`[data-operation-id="${nextOp.id}"]`);

        if (currentOpElement && nextOpElement) {
          const currentRect = currentOpElement.getBoundingClientRect();
          const nextRect = nextOpElement.getBoundingClientRect();

          const startX = currentRect.right - containerRect.left;
          const startY = currentRect.top + currentRect.height / 2 - containerRect.top;
          const endX = nextRect.left - containerRect.left;
          const endY = nextRect.top + nextRect.height / 2 - containerRect.top;

          connections.push(
            <svg
              key={`connection-${currentOp.id}-${nextOp.id}`}
              className="absolute top-0 left-0 pointer-events-none"
              style={{
                width: '100%',
                height: '100%',
                zIndex: 25
              }}
            >
              <defs>
                <marker
                  id={`arrowhead-${currentOp.id}-${nextOp.id}`}
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                </marker>
              </defs>
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="5,5"
                markerEnd={`url(#arrowhead-${currentOp.id}-${nextOp.id})`}
              />
            </svg>
          );
        }
      }

      setConnectionLines(connections);
    };

    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(updateConnections);
  }, [hoveredJobId, operations]);

  const renderOperationConnections = () => {
    return connectionLines;
  };

  const unscheduledOperations = operations.filter(op => !op.workCenterId);
  
  // Function to get operation position for activity links and scheduling hints
  const getOperationPosition = useCallback((operationId: number): { x: number; y: number; width: number; height: number } | null => {
    const element = document.querySelector(`[data-operation-id="${operationId}"]`) as HTMLElement;
    if (!element || !ganttContainerRef.current) return null;
    
    const containerRect = ganttContainerRef.current.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    return {
      x: elementRect.left - containerRect.left,
      y: elementRect.top - containerRect.top,
      width: elementRect.width,
      height: elementRect.height
    };
  }, []);
  
  // Export handlers
  const handleExportPDF = useCallback(async () => {
    if (!ganttContainerRef.current) return;
    
    try {
      await GanttExportUtility.exportToPDF(
        ganttContainerRef.current,
        'Production Schedule',
        {
          orientation: 'landscape',
          includeHeaders: true
        }
      );
      toast({ title: 'PDF exported successfully' });
    } catch (error) {
      toast({ title: 'Failed to export PDF', variant: 'destructive' });
    }
  }, [toast]);
  
  const handleExportExcel = useCallback(async () => {
    try {
      await GanttExportUtility.exportToExcel(
        jobs,
        operations,
        resources,
        'Production Schedule',
        {
          selectedResources: selectedResourceView?.resourceSequence
        }
      );
      toast({ title: 'Excel exported successfully' });
    } catch (error) {
      toast({ title: 'Failed to export Excel', variant: 'destructive' });
    }
  }, [jobs, operations, resources, selectedResourceView, toast]);
  
  const handlePrint = useCallback(() => {
    if (!ganttContainerRef.current) return;
    GanttExportUtility.printGantt(ganttContainerRef.current, 'Production Schedule');
  }, []);
  
  // Toolbar handlers
  const handleJobSearch = useCallback((query: string) => {
    // Implement job search functionality
    console.log('Searching for job:', query);
  }, []);
  
  const handleResourceSearch = useCallback((query: string) => {
    // Implement resource search functionality
    console.log('Searching for resource:', query);
  }, []);
  
  const handleResizeToFit = useCallback(() => {
    // Implement resize to fit functionality
    const optimalHeight = Math.max(40, Math.min(80, 600 / resources.length));
    onRowHeightChange?.(optimalHeight);
  }, [resources.length, onRowHeightChange]);
  
  const handleDisplaySettings = useCallback(() => {
    // Open display settings dialog
    setTextConfigDialogOpen(true);
  }, []);
  
  const handleSchedulingHintClick = useCallback((hint: SchedulingHint) => {
    // Handle scheduling hint click
    toast({
      title: hint.message,
      description: hint.suggestion
    });
  }, [toast]);

  const handleViewSettingChange = async (newValue: string, settingType: "colorScheme" | "textLabeling") => {
    if (!selectedResourceView) {
      // Handle the case when "All Resources" is selected - use local state
      if (settingType === "colorScheme") {
        setDefaultColorScheme(newValue);
      } else {
        setDefaultTextLabeling(newValue);
      }
      
      // Show success message
      const displayName = settingType === "colorScheme" ? newValue : getTextLabelingDisplayName(newValue);
      const settingName = settingType === "colorScheme" ? "color scheme" : "text labeling";
      toast({ title: `${settingName} changed to ${displayName}` });
      return;
    }
    
    try {
      const updateData = {
        name: selectedResourceView.name,
        resourceSequence: selectedResourceView.resourceSequence,
        colorScheme: settingType === "colorScheme" ? newValue : selectedResourceView.colorScheme,
        textLabeling: settingType === "textLabeling" ? newValue : selectedResourceView.textLabeling,
        isDefault: selectedResourceView.isDefault
      };
      
      await apiRequest("PUT", `/api/resource-views/${selectedResourceView.id}`, updateData);
      
      // Force invalidation of the resource views cache
      await queryClient.invalidateQueries({ queryKey: ["/api/resource-views"] });
      
      // Show success message
      const displayName = settingType === "colorScheme" ? newValue : getTextLabelingDisplayName(newValue);
      const settingName = settingType === "colorScheme" ? "color scheme" : "text labeling";
      toast({ title: `${settingName} changed to ${displayName}` });
    } catch (error) {
      console.error(`Failed to change ${settingType}:`, error);
      toast({ title: `Failed to change ${settingType}`, variant: "destructive" });
    }
  };



  const renderOperationsView = () => {
    return (
      <div className="flex flex-col h-full">
        {/* Fixed Header */}
        <div className="flex-none bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
          <div className="flex">
            <div className="bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700" style={{ width: `${leftPanelWidth}px` }}>
              <div className="flex items-center justify-between px-4 py-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">Resources</span>
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={zoomOut} 
                    disabled={timeUnit === "decade"} 
                    title="Zoom Out"
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetZoom} 
                    title="Reset Zoom"
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-xs">{timeUnit}</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={zoomIn} 
                    disabled={timeUnit === "hour"} 
                    title="Zoom In"
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleScrollToToday} 
                    title="Scroll to Today"
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    <Calendar className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            {/* Resize Divider */}
            <div 
              className={`relative w-2 bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-col-resize transition-all group ${isResizing ? 'bg-blue-500 dark:bg-blue-400 w-3' : ''}`}
              onMouseDown={handleResizeMouseDown}
              title="Drag to resize"
            >
              {/* Visual grip indicator */}
              <div className="absolute inset-0 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="w-0.5 h-8 bg-gray-400 dark:bg-gray-500 rounded-full" />
              </div>
            </div>
            <div 
              data-timeline-container
              className="flex-1 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-x-auto cursor-grab active:cursor-grabbing"
              onMouseDown={handleTimelineMouseDown}
              onScroll={handleTimelineScroll}
              ref={timelineRef}
            >
              <div 
                className="flex"
                style={{ width: `${timelineWidth}px` }}
              >
                {timeScale.periods.map((period, index) => {
                  // Check if this period represents today (August 7, 2025)
                  const today = new Date(2025, 7, 7); // August 7, 2025
                  const periodDate = new Date(period.date);
                  const isToday = periodDate.toDateString() === today.toDateString();
                  
                  return (
                    <div 
                      key={index} 
                      className={`border-r border-gray-200 dark:border-gray-700 p-2 text-center flex-shrink-0 ${isToday ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`} 
                      style={{ width: `${periodWidth}px` }}
                    >
                      <div className={`text-xs font-medium ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                        {period.label} {isToday && '(Today)'}
                      </div>
                      <div className={`text-xs ${isToday ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500'}`}>
                        {period.subLabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      {/* Scrollable Content - Operations */}
      <div className="flex-1 overflow-y-auto cursor-grab active:cursor-grabbing relative" 
           onMouseDown={handleResourceListMouseDown}
           onScroll={handleResourceListScroll}
           ref={resourceListRef}>
        {getOrderedResources().map((resource) => {
          const resourceOperations = operations.filter(op => op.workCenterId === resource.id);
          
          return (
            <div key={resource.id}>
              {/* Resource Row */}
              <div className="border-b border-gray-100 dark:border-gray-800">
                <div className="flex">
                  <div className="bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700" style={{ width: `${leftPanelWidth}px` }}>
                    <div className="flex items-center px-4 py-3">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 dark:text-gray-200">{resource.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Type: {resource.type} | Operations: {resourceOperations.length}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge className={`text-xs ${resource.isDrum ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}`}>
                          {resource.isDrum ? 'Drum' : 'Available'}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedResource(resource);
                              setResourceDialogOpen(true);
                            }}>
                              Edit Resource
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              View Capacity
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Mark as Drum
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                  <div 
                    className="flex-1 relative overflow-hidden bg-gray-25 dark:bg-gray-900/50"
                    style={{ minHeight: `${rowHeight}px` }}
                  >
                    <div
                      data-timeline-content
                      className="absolute inset-0"
                      style={{ width: `${timelineWidth}px`, transform: `translateX(-${timelineScrollLeft}px)` }}
                    >
                      {/* Render all operations for this resource */}
                      {resourceOperations.map((operation) => (
                        <OperationBlock
                          key={operation.id}
                          operation={operation}
                          resourceName={resource.name}
                          jobName={jobs.find(job => job.id === operation.productionOrderId)?.name}
                          job={jobs.find(job => job.id === operation.productionOrderId)}
                          timelineWidth={timelineWidth}
                          dayWidth={periodWidth}
                          timeUnit={timeUnit}
                          timelineBaseDate={timeScale.minDate}
                          colorScheme={colorScheme}
                          textLabeling={textLabeling}
                          customTextLabels={customTextLabels.data || []}
                          rowHeight={rowHeight}
                          onHoverStart={setHoveredJobId}
                          onHoverEnd={() => setHoveredJobId(null)}
                          onViewDetails={(operation) => {
                            setSelectedOperation(operation);
                            setOperationDialogOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {/* Connection lines overlay */}
        {hoveredJobId && (
          <div className="absolute inset-0 pointer-events-none z-30">
            {renderOperationConnections()}
          </div>
        )}
      </div>
    </div>
    );
  };

  // Draggable resource row component for reordering
  const DraggableResourceRow = ({ resource, index }: { resource: Resource; index: number }) => {
    const resourceOperations = operations.filter(op => op.workCenterId === resource.id);
    const { drop, isOver, canDrop } = useOperationDrop(resource, timelineWidth, timeScale, timeUnit, timeScale.minDate);
    
    // Can only drag if we have a selected resource view
    const canReorder = selectedResourceView && selectedResourceView.resourceSequence.length > 1;
    
    const [{ isDragging }, drag, preview] = useDrag({
      type: "resource-row",
      item: { resourceId: resource.id, index },
      canDrag: !!canReorder,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });
    
    const [, dropResource] = useDrop({
      accept: "resource-row",
      hover: (item: { resourceId: number; index: number }) => {
        if (item.index !== index) {
          handleResourceReorder(item.index, index);
          item.index = index;
        }
      },
    });
    
    // Combine the operation drop ref with the resource drop ref
    const combinedRef = useCallback((node: HTMLDivElement | null) => {
      drop(node);
      dropResource(node);
    }, [drop, dropResource]);
    
    return (
      <div 
        ref={preview}
        className={`border-b border-gray-100 dark:border-gray-800 ${isDragging ? 'opacity-50' : ''}`}
      >
        <div className="flex">
          <div className="bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700" style={{ minHeight: `${rowHeight}px`, width: `${leftPanelWidth}px` }}>
            <div className="flex items-center h-full px-4">
              {canReorder && (
                <div 
                  ref={drag}
                  className="mr-2 cursor-move text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                  title="Drag to reorder resources"
                >
                  <GripVertical className="w-4 h-4" />
                </div>
              )}
              <div className="flex-1">
                <div className="font-medium text-gray-800 dark:text-gray-200">{resource.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  {getResourceTypeIcon(resource.type)}
                  <span>
                    {resource.capabilities?.map(capId => 
                      getCapabilityName(capId)
                    ).join(", ") || "None"}
                  </span>
                </div>
              </div>
              <Badge className={`text-xs mr-2 ${
                resource.status === "active" ? "bg-accent text-white" : "bg-gray-400 text-white"
              }`}>
                {resource.status}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleResourceAction(resource, 'edit')}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Resource
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleResourceAction(resource, 'schedule')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Operations
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleResourceAction(resource, 'view_schedule')}>
                    <Clock className="h-4 w-4 mr-2" />
                    View Schedule
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleResourceAction(resource, 'maintenance')}>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Schedule Maintenance
                  </DropdownMenuItem>
                  {selectedResourceView && (
                    <DropdownMenuItem onClick={() => handleResourceAction(resource, 'remove_from_gantt')}>
                      <Eye className="h-4 w-4 mr-2" />
                      Remove from Gantt
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => handleResourceAction(resource, 'delete')}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Resource
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div 
            ref={combinedRef}
            data-resource-id={resource.id}
            className={`flex-1 relative p-2 overflow-hidden ${
              isOver && canDrop ? 'bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-300 dark:border-blue-600 border-dashed' : ''
            }`}
            style={{ minHeight: `${rowHeight}px` }}
          >
            <div data-timeline-content style={{ width: `${timelineWidth}px` }}>
              {resourceOperations.map((operation) => (
                <OperationBlock
                  key={operation.id}
                  operation={operation}
                  resourceName={resource.name}
                  jobName={jobs.find(job => job.id === operation.productionOrderId)?.name}
                  job={jobs.find(job => job.id === operation.productionOrderId)}
                  timelineWidth={timelineWidth}
                  dayWidth={periodWidth}
                  timeUnit={timeUnit}
                  timelineBaseDate={timeScale.minDate}
                  colorScheme={colorScheme}
                  textLabeling={textLabeling}
                  customTextLabels={customTextLabels}
                  rowHeight={rowHeight}
                  onViewDetails={(operation) => {
                    setSelectedOperation(operation);
                    setOperationDialogOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Create a separate component to handle the drop zone for each resource (fallback)
  const ResourceRow = ({ resource }: { resource: Resource }) => {
    const resourceOperations = operations.filter(op => op.workCenterId === resource.id);
    const { drop, isOver, canDrop } = useOperationDrop(resource, timelineWidth, timeScale, timeUnit, timeScale.minDate);

    return (
      <div className="border-b border-gray-100 dark:border-gray-800">
        <div className="flex">
          <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700" style={{ minHeight: `${rowHeight}px` }}>
            <div className="flex items-center h-full px-4">
              <div className="flex-1">
                <div className="font-medium text-gray-800 dark:text-gray-200">{resource.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  {getResourceTypeIcon(resource.type)}
                  <span>
                    {resource.capabilities?.map(capId => 
                      getCapabilityName(capId)
                    ).join(", ") || "None"}
                  </span>
                </div>
              </div>
              <Badge className={`text-xs ${
                resource.status === "active" ? "bg-accent text-white" : "bg-gray-400 text-white"
              }`}>
                {resource.status}
              </Badge>
            </div>
          </div>
          <div 
            ref={drop}
            data-resource-id={resource.id}
            className={`flex-1 relative p-2 transition-colors overflow-hidden ${
              isOver ? (canDrop ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-600" : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-600") : ""
            }`}
            style={{ minHeight: `${rowHeight}px` }}
          >
            <div data-timeline-content style={{ width: `${timelineWidth}px` }}>
              {resourceOperations.map((operation) => (
                <OperationBlock
                  key={operation.id}
                  operation={operation}
                  resourceName={resource.name}
                  jobName={jobs.find(job => job.id === operation.productionOrderId)?.name}
                  job={jobs.find(job => job.id === operation.productionOrderId)}
                  timelineWidth={timelineWidth}
                  dayWidth={periodWidth}
                  timeUnit={timeUnit}
                  timelineBaseDate={timeScale.minDate}
                  colorScheme={colorScheme}
                  textLabeling={textLabeling}
                  customTextLabels={customTextLabels}
                  rowHeight={rowHeight}
                  onViewDetails={(operation) => {
                    setSelectedOperation(operation);
                    setOperationDialogOpen(true);
                  }}
                />
              ))}
              {resourceOperations.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-gray-400 text-sm">
                    {isOver ? (canDrop ? "Drop operation here" : "Incompatible capabilities") : "No operations assigned"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomersView = () => {
    // Group jobs by customer
    const customerGroups = useMemo(() => {
      const groups: { [customer: string]: ProductionOrder[] } = {};
      jobs.forEach(job => {
        const customer = job.customerId?.toString() || "Unknown Customer";
        if (!groups[customer]) {
          groups[customer] = [];
        }
        groups[customer].push(job);
      });
      return groups;
    }, [jobs]);

    const toggleCustomerExpansion = (customer: string) => {
      const newExpanded = new Set(expandedCustomers);
      if (newExpanded.has(customer)) {
        newExpanded.delete(customer);
      } else {
        newExpanded.add(customer);
      }
      setExpandedCustomers(newExpanded);
    };

    const renderCustomerRow = (customer: string, customerJobs: ProductionOrder[]) => {
      const isExpanded = expandedCustomers.has(customer);
      
      return (
        <div key={customer}>
          {/* Customer Header Row */}
          <div className="flex bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ height: `${rowHeight}px` }}>
            <div className="border-r border-gray-200 dark:border-gray-700" style={{ width: `${leftPanelWidth}px` }}>
              <div className="flex items-center px-4 py-2">
                <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCustomerExpansion(customer)}
                className="p-0 h-6 w-6 mr-2"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100">{customer}</span>
                <Badge variant="secondary" className="text-xs">
                  {customerJobs.length} jobs
                </Badge>
              </div>
              </div>
            </div>
            <div className="flex-1 relative overflow-hidden">
              <div
                className="absolute inset-0 flex items-center bg-gray-50 dark:bg-gray-800"
                style={{ transform: `translateX(-${timelineScrollLeft}px)` }}
              >
                <div className="bg-gray-100 dark:bg-gray-700 h-full flex-1 border-r border-gray-300 dark:border-gray-600"></div>
              </div>
            </div>
          </div>

          {/* Customer Jobs (when expanded) */}
          {isExpanded && customerJobs.map(job => (
            <div key={job.id} className="flex border-b border-gray-200 dark:border-gray-700" style={{ height: `${rowHeight}px` }}>
              <div className="border-r border-gray-200 dark:border-gray-700" style={{ width: `${leftPanelWidth}px` }}>
                <div className="flex items-center px-4 py-2 relative">
                <div className="ml-6 flex items-center space-x-2 flex-1 pr-8">
                  <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">{job.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {job.priority}
                  </Badge>
                </div>
                {/* Job Details Eyeball Icon */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600 z-10" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedJob(job);
                    setJobDialogOpen(true);
                  }}
                  title="View Job Details"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                </div>
              </div>
              <div className="flex-1 relative overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{ transform: `translateX(-${timelineScrollLeft}px)` }}
                >
                  <div className="relative w-full h-full">
                    {operations
                      .filter(op => op.productionOrderId === job.id)
                      .map(operation => (
                        <OperationBlock
                          key={operation.id}
                          operation={operation}
                          resourceName={resources.find(r => r.id === operation.workCenterId)?.name || "Unassigned"}
                          jobName={job.name}
                          job={job}
                          timelineWidth={timelineWidth}
                          dayWidth={periodWidth}
                          timeUnit={timeUnit}
                          timelineBaseDate={timeScale.minDate}
                          colorScheme={colorScheme}
                          textLabeling={textLabeling}
                          customTextLabels={customTextLabels}
                          rowHeight={rowHeight}
                          onHoverStart={setHoveredJobId}
                          onHoverEnd={() => setHoveredJobId(null)}
                          onViewDetails={(operation) => {
                            setSelectedOperation(operation);
                            setOperationDialogOpen(true);
                          }}
                        />
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="flex flex-col h-full">
        {/* Fixed Header */}
        <div className="flex-none bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
          <div className="flex">
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700" style={{ width: `${leftPanelWidth}px` }}>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Customer Timeline</span>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <span>H:</span>
                    <input
                      type="range"
                      min="20"
                      max="200"
                      step="5"
                      value={rowHeight}
                      onChange={(e) => onRowHeightChange?.(parseInt(e.target.value))}
                      className="w-16 md:w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((rowHeight - 20) / (200 - 20)) * 100}%, #e5e7eb ${((rowHeight - 20) / (200 - 20)) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Select 
                    value={selectedResourceView?.colorScheme || defaultColorScheme} 
                    onValueChange={(value) => {
                      handleViewSettingChange(value, "colorScheme");
                    }}
                  >
                    <SelectTrigger className="w-28 h-6 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="job">Job</SelectItem>
                      <SelectItem value="resource">Resource</SelectItem>
                      <SelectItem value="duration">Duration</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={selectedResourceView?.textLabeling || defaultTextLabeling} 
                    onValueChange={(value) => {
                      if (value === "configure") {
                        setCustomTextLabelManagerOpen(true);
                      } else {
                        handleViewSettingChange(value, "textLabeling");
                      }
                    }}
                  >
                    <SelectTrigger className="w-32 h-6 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {customTextLabels.length === 0 && (
                        <SelectItem value="no_labels" disabled>
                          No custom labels - create one below
                        </SelectItem>
                      )}
                      {customTextLabels.map((label: any) => (
                        <SelectItem key={label.id} value={`custom_${label.id}`}>
                          {label.name}
                        </SelectItem>
                      ))}
                      <div className="border-t border-gray-200 my-1"></div>
                      <SelectItem value="configure" className="text-blue-600 font-medium">
                        Configure Labels...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {/* Resize Divider */}
            <div 
              className={`relative w-2 bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-col-resize transition-all group ${isResizing ? 'bg-blue-500 dark:bg-blue-400 w-3' : ''}`}
              onMouseDown={handleResizeMouseDown}
              title="Drag to resize"
            >
              {/* Visual grip indicator */}
              <div className="absolute inset-0 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="w-0.5 h-8 bg-gray-400 dark:bg-gray-500 rounded-full" />
              </div>
            </div>
            <div className="w-auto bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 px-2 py-2">
              <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={zoomOut} 
                      disabled={timeUnit === "decade"} 
                      className="h-6 px-1.5 border-r border-gray-300 dark:border-gray-600 rounded-r-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zoom out to view longer time periods</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={zoomIn} 
                      disabled={timeUnit === "hour"} 
                      className="h-6 px-1.5 border-r border-gray-300 dark:border-gray-600 rounded-r-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zoom in to view shorter time periods</p>
                  </TooltipContent>
                </Tooltip>
                <span className="text-xs text-gray-600 dark:text-gray-400 px-2 capitalize">{timeUnit}</span>
              </div>
            </div>
            <div className="flex-1 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
              <div style={{ width: `${timelineWidth}px`, transform: `translateX(-${timelineScrollLeft}px)` }}>
                <div className="flex h-full bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  {timeScale.periods.map((period, index) => {
                    // Check if this period represents today (August 7, 2025)
                    const today = new Date(2025, 7, 7); // August 7, 2025
                    const periodDate = new Date(period.date);
                    const isToday = periodDate.toDateString() === today.toDateString();
                    
                    return (
                      <div 
                        key={index} 
                        className={`flex-none border-r border-gray-300 dark:border-gray-600 px-2 py-2 text-center ${isToday ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`} 
                        style={{ width: `${periodWidth}px` }}
                      >
                        <div className={`text-xs font-medium ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                          {period.label} {isToday && '(Today)'}
                        </div>
                        <div className={`text-xs ${isToday ? 'text-blue-500 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>
                          {period.subLabel}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto" ref={resourceListRef}>
          {Object.entries(customerGroups).map(([customer, customerJobs]) => 
            renderCustomerRow(customer, customerJobs)
          )}
          {/* Connection lines overlay */}
          {hoveredJobId && (
            <div className="absolute inset-0 pointer-events-none z-30">
              {renderOperationConnections()}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResourcesView = () => (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-none bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="flex">
          <div className="bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700" style={{ width: `${leftPanelWidth}px` }}>
            <div className="flex flex-col space-y-2 px-2 md:px-4 py-2">
              <div className="flex items-center space-x-2">
                <Select 
                  value={selectedResourceViewId?.toString() || "all"} 
                  onValueChange={(value) => {
                    if (value === "configure") {
                      setResourceViewManagerOpen(true);
                    } else {
                      const newViewId = value === "all" ? null : parseInt(value);
                      onResourceViewChange?.(newViewId);
                    }
                  }}
                >
                  <SelectTrigger className="w-24 md:w-32 h-6 md:h-7 text-xs md:text-sm">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    {resourceViews.map((view) => (
                      <SelectItem key={view.id} value={view.id.toString()}>
                        {view.name} {view.isDefault && "(Default)"}
                      </SelectItem>
                    ))}
                    <SelectItem value="configure" className="text-blue-600 font-medium">
                      Configure Views...
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <span>H:</span>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    step="5"
                    value={rowHeight}
                    onChange={(e) => onRowHeightChange?.(parseInt(e.target.value))}
                    className="w-16 md:w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((rowHeight - 20) / (200 - 20)) * 100}%, #e5e7eb ${((rowHeight - 20) / (200 - 20)) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Select 
                  value={selectedResourceView?.colorScheme || defaultColorScheme} 
                  onValueChange={(value) => {
                    handleViewSettingChange(value, "colorScheme");
                  }}
                >
                  <SelectTrigger className="w-20 md:w-28 h-6 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="job">Job</SelectItem>
                    <SelectItem value="resource">Resource</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={selectedResourceView?.textLabeling || defaultTextLabeling} 
                  onValueChange={(value) => {
                    if (value === "configure") {
                      setCustomTextLabelManagerOpen(true);
                    } else {
                      handleViewSettingChange(value, "textLabeling");
                    }
                  }}
                >
                  <SelectTrigger className="w-24 md:w-32 h-6 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {customTextLabels.length === 0 && (
                      <SelectItem value="no_labels" disabled>
                        No custom labels - create one below
                      </SelectItem>
                    )}
                    {customTextLabels.map((label: any) => (
                      <SelectItem key={label.id} value={`custom_${label.id}`}>
                        {label.name}
                      </SelectItem>
                    ))}
                    <div className="border-t border-gray-200 my-1"></div>
                    <SelectItem value="configure" className="text-blue-600 font-medium">
                      Configure Labels...
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {/* Resize Divider */}
            <div 
              className={`relative w-2 bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-col-resize transition-all group ${isResizing ? 'bg-blue-500 dark:bg-blue-400 w-3' : ''}`}
              onMouseDown={handleResizeMouseDown}
              title="Drag to resize"
            >
              {/* Visual grip indicator */}
              <div className="absolute inset-0 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="w-0.5 h-8 bg-gray-400 dark:bg-gray-500 rounded-full" />
              </div>
            </div>
          <div className="w-auto bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 px-1 md:px-2 py-2">
            <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={zoomOut} 
                    disabled={timeUnit === "decade"} 
                    className="h-6 px-1 md:px-1.5 border-r border-gray-300 dark:border-gray-600 rounded-r-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Zoom out to view longer time periods</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={zoomIn} 
                    disabled={timeUnit === "hour"} 
                    className="h-6 px-1 md:px-1.5 border-r border-gray-300 dark:border-gray-600 rounded-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Zoom in to view shorter time periods</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetZoom} 
                    className="h-6 px-1 md:px-2 border-r border-gray-300 dark:border-gray-600 rounded-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-xs font-medium">{timeUnit}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset zoom to default view</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleScrollToToday} 
                    className="h-6 px-1 md:px-1.5 rounded-l-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <Calendar className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Scroll timeline to today's date</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div 
            className="flex-1 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-x-auto cursor-grab active:cursor-grabbing"
            onMouseDown={handleTimelineMouseDown}
            onScroll={handleTimelineScroll}
            ref={timelineRef}
          >
            <div 
              className="flex"
              style={{ width: `${timelineWidth}px` }}
            >
              {timeScale.periods.map((period, index) => {
                // Check if this period represents today (August 7, 2025)
                const today = new Date(2025, 7, 7); // August 7, 2025
                const periodDate = new Date(period.date);
                const isToday = periodDate.toDateString() === today.toDateString();
                
                return (
                  <div 
                    key={index} 
                    className={`border-r border-gray-200 dark:border-gray-700 p-2 text-center flex-shrink-0 ${isToday ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`} 
                    style={{ width: `${periodWidth}px` }}
                  >
                    <div className={`text-xs font-medium ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                      {period.label} {isToday && '(Today)'}
                    </div>
                    <div className={`text-xs ${isToday ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500'}`}>
                      {period.subLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Resource List */}
      <div className="flex-1 overflow-y-auto cursor-grab active:cursor-grabbing" 
           onMouseDown={handleResourceListMouseDown}
           onScroll={handleResourceListScroll}
           ref={resourceListRef}>
        {getOrderedResources().map((resource, index) => (
          <DraggableResourceRow 
            key={resource.id} 
            resource={resource} 
            index={index}
          />
        ))}
      </div>

      {/* Unscheduled Operations */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" style={{ minHeight: `${rowHeight}px` }}>
        <div className="flex">
          <div className="bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700" style={{ minHeight: `${rowHeight}px`, width: `${leftPanelWidth}px` }}>
            <div className="flex items-center h-full px-4">
              <div className="font-medium text-gray-800 dark:text-gray-200">Unscheduled Operations</div>
            </div>
          </div>
          <div className="flex-1 p-2 overflow-x-auto" style={{ minHeight: `${rowHeight}px` }}>
            <div className="flex space-x-2">
              {unscheduledOperations.map((operation) => (
                <div 
                  key={operation.id} 
                  className="flex-shrink-0 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 shadow-sm cursor-move"
                  draggable
                  onDragStart={(e) => handleOperationDrag(e, operation)}
                >
                  <div className="text-xs font-medium text-gray-800 dark:text-gray-200">{operation.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {operation.requiredCapabilities?.map(capId => 
                      getCapabilityName(capId)
                    ).join(", ") || "No requirements"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resource View Manager Dialog */}
      <Dialog open={resourceViewManagerOpen} onOpenChange={setResourceViewManagerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Resource View Manager</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ResourceViewManager 
              resources={resources}
              selectedViewId={selectedResourceView?.id}
              onViewChange={onResourceViewChange}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Text Label Manager Dialog */}
      <Dialog open={customTextLabelManagerOpen} onOpenChange={setCustomTextLabelManagerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Custom Text Label Manager</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <CustomTextLabelManager 
              open={customTextLabelManagerOpen}
              onOpenChange={setCustomTextLabelManagerOpen}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="h-full">
        {view === "operations" ? renderOperationsView() : view === "customers" ? renderCustomersView() : renderResourcesView()}
        
        {/* Operation Dialog */}
        <Dialog open={operationDialogOpen} onOpenChange={setOperationDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Operation</DialogTitle>
            </DialogHeader>
            {selectedOperation && (
              <OperationForm
                operation={selectedOperation}
                jobs={jobs}
                resources={resources}
                capabilities={capabilities}
                onSuccess={() => setOperationDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Resource Dialog */}
        <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Resource</DialogTitle>
            </DialogHeader>
            {selectedResource && (
              <ResourceForm
                resource={selectedResource}
                capabilities={capabilities}
                onSuccess={() => setResourceDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Job Details Dialog */}
        {selectedJob && (
          <JobDetailsDialog
            job={selectedJob}
            operations={operations.filter(op => op.productionOrderId === selectedJob.id)}
            resources={resources}
            capabilities={capabilities}
            open={jobDialogOpen}
            onOpenChange={setJobDialogOpen}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

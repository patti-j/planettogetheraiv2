import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal, ZoomIn, ZoomOut, Eye, Settings, GripVertical, Maximize2, Minimize2, Wrench, Users, Building2, Palette, Type, Plus, Edit3, Trash2, Calendar, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import OperationBlock from "./operation-block";
import OperationForm from "../operation-form";
import ResourceViewManager from "../resource-view-manager";
import TextLabelConfigDialog from "../text-label-config-dialog";
import { useOperationDrop } from "@/hooks/use-drag-drop-fixed";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useToast } from "@/hooks/use-toast";
import type { Job, Operation, Resource, Capability, ResourceView } from "@shared/schema";

interface GanttChartProps {
  jobs: Job[];
  operations: Operation[];
  resources: Resource[];
  capabilities: Capability[];
  view: "operations" | "resources";
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
  const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set());
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [operationDialogOpen, setOperationDialogOpen] = useState(false);
  const [timeUnit, setTimeUnit] = useState<TimeUnit>("day");
  const [timelineScrollLeft, setTimelineScrollLeft] = useState(0);
  const [resourceListScrollTop, setResourceListScrollTop] = useState(0);
  const [internalSelectedResourceViewId, setInternalSelectedResourceViewId] = useState<number | null>(null);
  const [resourceViewManagerOpen, setResourceViewManagerOpen] = useState(false);
  const [textConfigDialogOpen, setTextConfigDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use external state if provided, otherwise use internal state
  const selectedResourceViewId = externalSelectedResourceViewId !== undefined ? externalSelectedResourceViewId : internalSelectedResourceViewId;
  const setSelectedResourceViewId = (viewId: number | null) => {
    if (onResourceViewChange) {
      onResourceViewChange(viewId);
    } else {
      setInternalSelectedResourceViewId(viewId);
    }
  };
  // Create a truly stable base date that never changes
  const timelineBaseDate = useMemo(() => new Date(2025, 6, 13, 7, 0, 0, 0), []); // Fixed to July 13, 2025 07:00:00
  
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

  const handleResourceAction = (resource: Resource, action: string) => {
    switch (action) {
      case 'edit':
        // Open resource edit dialog
        console.log('Edit resource:', resource);
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
      case 'add_operation':
        // Add new operation to resource
        console.log('Add operation to:', resource);
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
  
  // Get the currently selected resource view
  const selectedResourceView = useMemo(() => {
    if (selectedResourceViewId) {
      return resourceViews.find(v => v.id === selectedResourceViewId);
    }
    // If no view is selected, use the default view
    return resourceViews.find(v => v.isDefault);
  }, [resourceViews, selectedResourceViewId]);
  
  // Order resources according to the selected view
  const orderedResources = useMemo(() => {
    if (!selectedResourceView || view !== "resources") {
      return resources;
    }
    
    const orderedList: Resource[] = [];
    
    // Add ONLY resources in the order specified by the view
    selectedResourceView.resourceSequence.forEach(resourceId => {
      const resource = resources.find(r => r.id === resourceId);
      if (resource) {
        orderedList.push(resource);
      }
    });
    
    // Don't add remaining resources - only show resources in the view
    return orderedList;
  }, [resources, selectedResourceView, view]);

  // Get color scheme and text labeling from selected resource view
  const colorScheme = selectedResourceView?.colorScheme || "by_job";
  const textLabeling = selectedResourceView?.textLabeling || "operation_name";

  // Handler for quick color scheme changes
  const handleColorSchemeChange = async (newColorScheme: string) => {
    if (!selectedResourceView) return;
    
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
    if (!selectedResourceView) return;
    
    try {
      await apiRequest("PUT", `/api/resource-views/${selectedResourceView.id}`, {
        textLabeling: newTextLabeling
      });
      queryClient.invalidateQueries({ queryKey: ["/api/resource-views"] });
      toast({ title: `Text labeling changed to ${newTextLabeling.replace("_", " ")}` });
    } catch (error) {
      toast({ title: "Failed to change text labeling", variant: "destructive" });
    }
  };
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const resourceListRef = useRef<HTMLDivElement>(null);
  const isDraggingTimeline = useRef(false);
  const isDraggingResourceList = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Generate dynamic time scale based on time unit and operations
  const timeScale = useMemo(() => {
    const periods = [];
    const now = timelineBaseDate;
    
    // Calculate the date range based on operations
    let minDate = now;
    let maxDate = now;
    
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
    
    // Add padding to the range
    const paddingMs = 30 * 24 * 60 * 60 * 1000; // 30 days padding
    minDate = new Date(Math.min(minDate.getTime() - paddingMs, now.getTime()));
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
          subLabel = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
          break;
        case "shift":
          const shiftHour = date.getHours();
          const shiftName = shiftHour >= 0 && shiftHour < 8 ? "Night" : 
                           shiftHour >= 8 && shiftHour < 16 ? "Day" : "Evening";
          label = `${shiftName} Shift`;
          subLabel = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
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
    
    return { periods, minDate, stepMs };
  }, [timeUnit, operations]);

  // Calculate timeline dimensions
  const timelineWidth = useMemo(() => {
    const baseWidth = 200; // Base width per period
    return timeScale.periods.length * baseWidth;
  }, [timeScale]);

  const periodWidth = useMemo(() => {
    return timelineWidth / timeScale.periods.length;
  }, [timelineWidth, timeScale]);

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

  const toggleJobExpansion = useCallback((jobId: number) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  }, []);

  const getOperationsByJob = useCallback((jobId: number) => {
    return operations.filter(op => op.jobId === jobId).sort((a, b) => a.order - b.order);
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

  const renderOperationsView = () => {
    return (
      <div className="flex flex-col h-full">
        {/* Fixed Header */}
        <div className="flex-none bg-white border-b border-gray-200 z-10">
          <div className="flex">
            <div className="w-64 px-4 py-3 bg-gray-50 border-r border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Jobs & Operations</span>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" onClick={zoomOut} disabled={timeUnit === "decade"} title="Zoom Out">
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetZoom} title="Reset Zoom">
                    <span className="text-xs">{timeUnit}</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={zoomIn} disabled={timeUnit === "hour"} title="Zoom In">
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div 
              data-timeline-container
              className="flex-1 bg-gray-50 border-r border-gray-200 overflow-x-auto cursor-grab active:cursor-grabbing"
              onMouseDown={handleTimelineMouseDown}
              onScroll={handleTimelineScroll}
              ref={timelineRef}
            >
              <div 
                className="flex"
                style={{ width: `${timelineWidth}px` }}
              >
                {timeScale.periods.map((period, index) => (
                  <div key={index} className="border-r border-gray-200 p-2 text-center flex-shrink-0" style={{ width: `${periodWidth}px` }}>
                    <div className="text-xs font-medium text-gray-500">{period.label}</div>
                    <div className="text-xs text-gray-400">{period.subLabel}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      {/* Scrollable Content - Operations */}
      <div className="flex-1 overflow-y-auto cursor-grab active:cursor-grabbing" 
           onMouseDown={handleResourceListMouseDown}
           onScroll={handleResourceListScroll}
           ref={resourceListRef}>
        {jobs.map((job) => {
          const jobOperations = getOperationsByJob(job.id);
          const isExpanded = expandedJobs.has(job.id);

          return (
            <div key={job.id}>
              {/* Job Row */}
              <div className="border-b border-gray-100">
                <div className="flex">
                  <div className="w-64 px-4 py-3 bg-gray-50 border-r border-gray-200">
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto mr-2"
                        onClick={() => toggleJobExpansion(job.id)}
                      >
                        {isExpanded ? 
                          <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        }
                      </Button>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{job.name}</div>
                        <div className="text-xs text-gray-500">
                          Customer: {job.customer} | Priority: {job.priority} | Due: {job.dueDate ? new Date(job.dueDate).toLocaleDateString() : "N/A"}
                        </div>
                      </div>
                      <Badge className={`text-xs ${getJobStatusColor(job.status)}`}>
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1 bg-blue-50 border-r border-gray-100 overflow-x-hidden" style={{ minHeight: '60px' }}>
                    <div style={{ width: `${timelineWidth}px` }}>
                      {/* Job level timeline background */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Operation Rows */}
              {isExpanded && jobOperations.map((operation) => (
                <div key={operation.id} className="border-b border-gray-100">
                  <div className="flex">
                    <div className="w-64 px-4 py-3 border-r border-gray-200">
                      <div className="flex items-center ml-6">
                        <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-700">{operation.name}</div>
                          <div className="text-xs text-gray-500">
                            {operation.requiredCapabilities?.map(capId => 
                              getCapabilityName(capId)
                            ).join(", ") || "No requirements"}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Badge className={`text-xs ${getOperationStatusColor(operation.status)}`}>
                            {operation.status}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedOperation(operation);
                                setOperationDialogOpen(true);
                              }}>
                                Edit Operation
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                View Dependencies
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Delete Operation
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                    <div 
                      className="flex-1 relative p-2 min-h-[60px] overflow-hidden"
                    >
                      <div data-timeline-content style={{ width: `${timelineWidth}px` }}>
                        <OperationBlock
                          operation={operation}
                          resourceName={getResourceName(operation.assignedResourceId || 0)}
                          jobName={jobs.find(job => job.id === operation.jobId)?.name}
                          job={jobs.find(job => job.id === operation.jobId)}
                          timelineWidth={timelineWidth}
                          dayWidth={periodWidth}
                          timeUnit={timeUnit}
                          timelineBaseDate={timeScale.minDate}
                          colorScheme={colorScheme}
                          textLabeling={textLabeling}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
    );
  };

  // Draggable resource row component for reordering
  const DraggableResourceRow = ({ resource, index }: { resource: Resource; index: number }) => {
    const resourceOperations = operations.filter(op => op.assignedResourceId === resource.id);
    const { drop, isOver, canDrop } = useOperationDrop(resource, timelineWidth, timeScale, timeUnit, timeScale.minDate);
    
    // Can only drag if we have a selected resource view
    const canReorder = selectedResourceView && selectedResourceView.resourceSequence.length > 1;
    
    const [{ isDragging }, drag, preview] = useDrag({
      type: "resource-row",
      item: { resourceId: resource.id, index },
      canDrag: canReorder,
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
        className={`border-b border-gray-100 ${isDragging ? 'opacity-50' : ''}`}
      >
        <div className="flex">
          <div className="w-64 px-4 bg-gray-50 border-r border-gray-200" style={{ minHeight: `${rowHeight}px` }}>
            <div className="flex items-center h-full">
              {canReorder && (
                <div 
                  ref={drag}
                  className="mr-2 cursor-move text-gray-400 hover:text-gray-600"
                  title="Drag to reorder resources"
                >
                  <GripVertical className="w-4 h-4" />
                </div>
              )}
              <div className="flex-1">
                <div className="font-medium text-gray-800">{resource.name}</div>
                <div className="text-xs text-gray-500 flex items-center gap-2">
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
                  <DropdownMenuItem onClick={() => handleResourceAction(resource, 'add_operation')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Operation
                  </DropdownMenuItem>
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
              isOver && canDrop ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''
            }`}
            style={{ minHeight: `${rowHeight}px` }}
          >
            <div data-timeline-content style={{ width: `${timelineWidth}px` }}>
              {resourceOperations.map((operation) => (
                <OperationBlock
                  key={operation.id}
                  operation={operation}
                  resourceName={resource.name}
                  jobName={jobs.find(job => job.id === operation.jobId)?.name}
                  job={jobs.find(job => job.id === operation.jobId)}
                  timelineWidth={timelineWidth}
                  dayWidth={periodWidth}
                  timeUnit={timeUnit}
                  timelineBaseDate={timeScale.minDate}
                  colorScheme={colorScheme}
                  textLabeling={textLabeling}
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
    const resourceOperations = operations.filter(op => op.assignedResourceId === resource.id);
    const { drop, isOver, canDrop } = useOperationDrop(resource, timelineWidth, timeScale, timeUnit, timeScale.minDate);

    return (
      <div className="border-b border-gray-100">
        <div className="flex">
          <div className="w-64 px-4 bg-gray-50 border-r border-gray-200" style={{ minHeight: `${rowHeight}px` }}>
            <div className="flex items-center h-full">
              <div className="flex-1">
                <div className="font-medium text-gray-800">{resource.name}</div>
                <div className="text-xs text-gray-500 flex items-center gap-2">
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
              isOver ? (canDrop ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200") : ""
            }`}
            style={{ minHeight: `${rowHeight}px` }}
          >
            <div data-timeline-content style={{ width: `${timelineWidth}px` }}>
              {resourceOperations.map((operation) => (
                <OperationBlock
                  key={operation.id}
                  operation={operation}
                  resourceName={resource.name}
                  jobName={jobs.find(job => job.id === operation.jobId)?.name}
                  job={jobs.find(job => job.id === operation.jobId)}
                  timelineWidth={timelineWidth}
                  dayWidth={periodWidth}
                  timeUnit={timeUnit}
                  timelineBaseDate={timeScale.minDate}
                  colorScheme={colorScheme}
                  textLabeling={textLabeling}
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

  const renderResourcesView = () => (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-none bg-white border-b border-gray-200 z-10">
        <div className="flex">
          <div className="w-64 px-4 py-3 bg-gray-50 border-r border-gray-200">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Resources</span>
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={zoomOut} 
                    disabled={timeUnit === "decade"} 
                    title="Zoom Out"
                    className="flex-shrink-0 min-w-[32px] min-h-[32px]"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetZoom} 
                    title="Reset Zoom"
                    className="flex-shrink-0 min-w-[48px] min-h-[32px]"
                  >
                    <span className="text-xs">{timeUnit}</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={zoomIn} 
                    disabled={timeUnit === "hour"} 
                    title="Zoom In"
                    className="flex-shrink-0 min-w-[32px] min-h-[32px]"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Select 
                  value={selectedResourceView?.id?.toString() || "all"} 
                  onValueChange={(value) => setSelectedResourceViewId(value === "all" ? null : parseInt(value))}
                >
                  <SelectTrigger className="flex-1 h-8 text-xs">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    {resourceViews.map((view) => (
                      <SelectItem key={view.id} value={view.id.toString()}>
                        {view.name} {view.isDefault && "(Default)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setResourceViewManagerOpen(true)}
                  title="Manage Views"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Row Height:</span>
                <div className="flex items-center space-x-2 w-24">
                  <Slider
                    value={[rowHeight]}
                    onValueChange={(value) => onRowHeightChange?.(value[0])}
                    min={20}
                    max={200}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-8">{rowHeight}px</span>
                </div>
              </div>
              
              {/* Quick Switch Preset Buttons - only show when a resource view is selected */}
              {selectedResourceView && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Palette className="w-3 h-3 text-gray-500" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs"
                          title="Change Color Scheme"
                        >
                          {colorScheme === "by_job" && "Job"}
                          {colorScheme === "by_priority" && "Priority"}
                          {colorScheme === "by_status" && "Status"}
                          {colorScheme === "by_operation_type" && "Type"}
                          {colorScheme === "by_resource" && "Resource"}
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleColorSchemeChange("by_job")}>
                          By Job
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleColorSchemeChange("by_priority")}>
                          By Priority
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleColorSchemeChange("by_status")}>
                          By Status
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleColorSchemeChange("by_operation_type")}>
                          By Operation Type
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleColorSchemeChange("by_resource")}>
                          By Resource
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Type className="w-3 h-3 text-gray-500" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs"
                          title="Change Text Labeling"
                        >
                          {textLabeling === "operation_name" && "Operation"}
                          {textLabeling === "job_name" && "Job"}
                          {textLabeling === "both" && "Both"}
                          {textLabeling === "duration" && "Duration"}
                          {textLabeling === "progress" && "Progress"}
                          {textLabeling === "none" && "None"}
                          {textLabeling === "due_date" && "Due Date"}
                          {textLabeling === "priority" && "Priority"}
                          {textLabeling === "status" && "Status"}
                          {textLabeling === "resource_name" && "Resource"}
                          {textLabeling === "customer" && "Customer"}
                          {textLabeling === "job_description" && "Job Desc"}
                          {textLabeling === "operation_description" && "Op Desc"}
                          {textLabeling === "resource_type" && "Res Type"}
                          {textLabeling === "capabilities" && "Capabilities"}
                          {textLabeling === "start_time" && "Start Time"}
                          {textLabeling === "end_time" && "End Time"}
                          {textLabeling === "slack_days" && "Slack Days"}
                          {textLabeling === "days_late" && "Days Late"}
                          {textLabeling === "completion_percent" && "Completion %"}
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("operation_name")}>
                          Operation Name
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("job_name")}>
                          Job Name
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("both")}>
                          Job + Operation
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("duration")}>
                          Duration
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("progress")}>
                          Progress %
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("due_date")}>
                          Due Date
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("priority")}>
                          Priority
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("status")}>
                          Status
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("resource_name")}>
                          Resource Name
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("customer")}>
                          Customer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("job_description")}>
                          Job Description
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("operation_description")}>
                          Operation Description
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("resource_type")}>
                          Resource Type
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("capabilities")}>
                          Capabilities
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("start_time")}>
                          Start Time
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("end_time")}>
                          End Time
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("slack_days")}>
                          Slack Days
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("days_late")}>
                          Days Late
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("completion_percent")}>
                          Completion %
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTextLabelingChange("none")}>
                          No Text
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs"
                    onClick={() => setTextConfigDialogOpen(true)}
                    title="Configure Text Labels"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div 
            className="flex-1 bg-gray-50 border-r border-gray-200 overflow-x-auto cursor-grab active:cursor-grabbing"
            onMouseDown={handleTimelineMouseDown}
            onScroll={handleTimelineScroll}
            ref={timelineRef}
          >
            <div 
              className="flex"
              style={{ width: `${timelineWidth}px` }}
            >
              {timeScale.periods.map((period, index) => (
                <div key={index} className="border-r border-gray-200 p-2 text-center flex-shrink-0" style={{ width: `${periodWidth}px` }}>
                  <div className="text-xs font-medium text-gray-500">{period.label}</div>
                  <div className="text-xs text-gray-400">{period.subLabel}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content - Resources */}
      <div className="flex-1 overflow-y-auto cursor-grab active:cursor-grabbing"
           onMouseDown={handleResourceListMouseDown}
           onScroll={handleResourceListScroll}
           ref={resourceListRef}>
        
        {/* Unscheduled Operations Section */}
        <div className="border-b border-gray-200 bg-yellow-50">
          <div className="flex">
            <div className="w-64 px-4 py-3 bg-yellow-100 border-r border-yellow-200">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="font-medium text-yellow-800">Unscheduled Operations</div>
                  <div className="text-xs text-yellow-600">
                    Drag these operations to resources to schedule them
                  </div>
                </div>
                <Badge className="text-xs bg-yellow-600 text-white">
                  {operations.filter(op => !op.startTime || !op.endTime).length}
                </Badge>
              </div>
            </div>
            <div className="flex-1 p-4 bg-yellow-50 border-r border-yellow-200" style={{ minHeight: `${rowHeight}px` }}>
              <div className="flex flex-wrap gap-2">
                {operations
                  .filter(op => !op.startTime || !op.endTime)
                  .map((operation) => (
                    <OperationBlock
                      key={operation.id}
                      operation={operation}
                      resourceName="Unscheduled"
                      jobName={jobs.find(job => job.id === operation.jobId)?.name}
                      job={jobs.find(job => job.id === operation.jobId)}
                      timelineWidth={timelineWidth}
                      dayWidth={periodWidth}
                      timeUnit={timeUnit}
                      timelineBaseDate={timeScale.minDate}
                      colorScheme={colorScheme}
                      textLabeling={textLabeling}
                    />
                  ))}
                {operations.filter(op => !op.startTime || !op.endTime).length === 0 && (
                  <div className="text-yellow-600 text-sm italic">
                    All operations are scheduled
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {orderedResources.map((resource, index) => (
          <DraggableResourceRow key={resource.id} resource={resource} index={index} />
        ))}
      </div>
    </div>
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 bg-white h-full">
        {view === "operations" ? renderOperationsView() : renderResourcesView()}
        
        {/* Operation Edit Dialog */}
        <Dialog open={operationDialogOpen} onOpenChange={setOperationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Operation</DialogTitle>
            </DialogHeader>
            {selectedOperation && (
              <OperationForm
                operation={selectedOperation}
                jobs={jobs}
                capabilities={capabilities}
                resources={resources}
                onSuccess={() => {
                  setOperationDialogOpen(false);
                  setSelectedOperation(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
        
        {/* Resource View Manager Dialog */}
        <Dialog open={resourceViewManagerOpen} onOpenChange={setResourceViewManagerOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Resource Gantt Manager</DialogTitle>
            </DialogHeader>
            <ResourceViewManager
              resources={resources}
              selectedViewId={selectedResourceView?.id}
              onViewChange={(viewId) => {
                setSelectedResourceViewId(viewId);
                setResourceViewManagerOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
        
        {/* Text Label Configuration Dialog */}
        {selectedResourceView && (
          <TextLabelConfigDialog
            open={textConfigDialogOpen}
            onOpenChange={setTextConfigDialogOpen}
            resourceView={selectedResourceView}
          />
        )}
      </div>
    </DndProvider>
  );
}
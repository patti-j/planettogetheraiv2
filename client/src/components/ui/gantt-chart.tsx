import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import OperationBlock from "./operation-block";
import OperationForm from "../operation-form";
import { useOperationDrop } from "@/hooks/use-drag-drop-fixed";
import type { Job, Operation, Resource, Capability } from "@shared/schema";

interface GanttChartProps {
  jobs: Job[];
  operations: Operation[];
  resources: Resource[];
  capabilities: Capability[];
  view: "operations" | "resources";
}

type TimeUnit = "hour" | "shift" | "day" | "week" | "month" | "quarter" | "year" | "decade";

export default function GanttChart({ 
  jobs, 
  operations, 
  resources, 
  capabilities, 
  view 
}: GanttChartProps) {
  const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set());
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [operationDialogOpen, setOperationDialogOpen] = useState(false);
  const [timeUnit, setTimeUnit] = useState<TimeUnit>("day");
  const [timelineScrollLeft, setTimelineScrollLeft] = useState(0);
  const [resourceListScrollTop, setResourceListScrollTop] = useState(0);
  // Create a truly stable base date that never changes
  const timelineBaseDate = useMemo(() => new Date(2025, 6, 13, 7, 0, 0, 0), []); // Fixed to July 13, 2025 07:00:00
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const resourceListRef = useRef<HTMLDivElement>(null);
  const isDraggingTimeline = useRef(false);
  const isDraggingResourceList = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Generate dynamic time scale based on time unit
  const timeScale = useMemo(() => {
    const periods = [];
    const now = timelineBaseDate;
    
    let periodCount: number;
    let stepMs: number;
    
    switch (timeUnit) {
      case "hour":
        periodCount = 24; // Show 24 hours
        stepMs = 60 * 60 * 1000; // 1 hour in milliseconds
        break;
      case "shift":
        periodCount = 9; // Show 9 shifts (3 days worth)
        stepMs = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        break;
      case "day":
        periodCount = 7; // Show 7 days
        stepMs = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        break;
      case "week":
        periodCount = 4; // Show 4 weeks
        stepMs = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
        break;
      case "month":
        periodCount = 12; // Show 12 months
        stepMs = 30 * 24 * 60 * 60 * 1000; // ~1 month in milliseconds
        break;
      case "quarter":
        periodCount = 4; // Show 4 quarters
        stepMs = 90 * 24 * 60 * 60 * 1000; // ~1 quarter in milliseconds
        break;
      case "year":
        periodCount = 5; // Show 5 years
        stepMs = 365 * 24 * 60 * 60 * 1000; // ~1 year in milliseconds
        break;
      case "decade":
        periodCount = 3; // Show 3 decades
        stepMs = 3650 * 24 * 60 * 60 * 1000; // ~1 decade in milliseconds
        break;
    }
    
    for (let i = 0; i < periodCount; i++) {
      const date = new Date(now.getTime() + (i * stepMs));
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
    
    return periods;
  }, [timeUnit, timelineBaseDate]);

  // Calculate timeline dimensions
  const timelineWidth = useMemo(() => {
    const baseWidth = 200; // Base width per period
    return timeScale.length * baseWidth;
  }, [timeScale]);

  const periodWidth = useMemo(() => {
    return timelineWidth / timeScale.length;
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
      
      // Sync all resource rows with the timeline header scroll
      const resourceRows = document.querySelectorAll('[data-resource-id]');
      resourceRows.forEach((row) => {
        if (row instanceof HTMLElement && row.scrollLeft !== newScrollLeft) {
          row.scrollLeft = newScrollLeft;
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

  // Ensure all resource rows are synced with timeline header on mount and updates
  useEffect(() => {
    const syncResourceRows = (scrollLeft: number) => {
      // Use a more specific selector to find all resource timeline containers
      const resourceRows = document.querySelectorAll('[data-resource-id]');
      resourceRows.forEach((row) => {
        if (row instanceof HTMLElement && row.scrollLeft !== scrollLeft) {
          row.scrollLeft = scrollLeft;
        }
      });
    };

    if (timelineRef.current) {
      // Initial sync
      const initialScrollLeft = timelineRef.current.scrollLeft;
      syncResourceRows(initialScrollLeft);
      
      // Sync on any timeline scroll
      const timelineElement = timelineRef.current;
      const handleScroll = () => {
        if (!isDraggingTimeline.current) {
          syncResourceRows(timelineElement.scrollLeft);
        }
      };
      
      timelineElement.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        timelineElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [timelineRef.current, resources.length, view]);

  // Handle scrollbar scroll events - sync all resource rows with timeline header
  const handleTimelineScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!isDraggingTimeline.current) {
      // Sync all resource rows with the timeline header scroll
      const scrollLeft = e.currentTarget.scrollLeft;
      const resourceRows = document.querySelectorAll('[data-resource-id]');
      resourceRows.forEach((row) => {
        if (row instanceof HTMLElement && row.scrollLeft !== scrollLeft) {
          row.scrollLeft = scrollLeft;
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
                {timeScale.map((period, index) => (
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
                    <div className="flex-1 relative p-2 min-h-[60px] overflow-x-hidden">
                      <div style={{ width: `${timelineWidth}px` }}>
                        <OperationBlock
                          operation={operation}
                          resourceName={getResourceName(operation.assignedResourceId || 0)}
                          jobName={jobs.find(job => job.id === operation.jobId)?.name}
                          job={jobs.find(job => job.id === operation.jobId)}
                          timelineWidth={timelineWidth}
                          dayWidth={periodWidth}
                          timeUnit={timeUnit}
                          timelineBaseDate={timelineBaseDate}

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

  // Create a separate component to handle the drop zone for each resource
  const ResourceRow = ({ resource }: { resource: Resource }) => {
    const resourceOperations = operations.filter(op => op.assignedResourceId === resource.id);
    const { drop, isOver, canDrop } = useOperationDrop(resource, timelineWidth, timeScale, timeUnit, timelineBaseDate);

    return (
      <div className="border-b border-gray-100">
        <div className="flex">
          <div className="w-64 px-4 py-3 bg-gray-50 border-r border-gray-200">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="font-medium text-gray-800">{resource.name}</div>
                <div className="text-xs text-gray-500">
                  Type: {resource.type} | 
                  Capabilities: {resource.capabilities?.map(capId => 
                    getCapabilityName(capId)
                  ).join(", ") || "None"}
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
            className={`flex-1 relative p-2 min-h-[60px] transition-colors overflow-x-auto scrollbar-hide ${
              isOver ? (canDrop ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200") : ""
            }`}
            onScroll={(e) => {
              // Sync this resource row's scroll with the timeline header
              if (timelineRef.current && !isDraggingTimeline.current) {
                timelineRef.current.scrollLeft = e.currentTarget.scrollLeft;
              }
            }}
          >
            <div style={{ width: `${timelineWidth}px` }}>
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
                  timelineBaseDate={timelineBaseDate}

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
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Resources</span>
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
            className="flex-1 bg-gray-50 border-r border-gray-200 overflow-x-auto cursor-grab active:cursor-grabbing"
            onMouseDown={handleTimelineMouseDown}
            onScroll={handleTimelineScroll}
            ref={timelineRef}
          >
            <div 
              className="flex"
              style={{ width: `${timelineWidth}px` }}
            >
              {timeScale.map((period, index) => (
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
            <div className="flex-1 p-4 bg-yellow-50 border-r border-yellow-200 min-h-[80px]">
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
                      timelineBaseDate={timelineBaseDate}

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
        
        {resources.map((resource) => (
          <ResourceRow key={resource.id} resource={resource} />
        ))}
      </div>
    </div>
  );

  return (
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
    </div>
  );
}
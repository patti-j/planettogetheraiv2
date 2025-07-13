import { useState, useCallback, useMemo } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import OperationBlock from "./operation-block";
import OperationForm from "../operation-form";
import { useOperationDrop } from "@/hooks/use-drag-drop";
import type { Job, Operation, Resource, Capability } from "@shared/schema";

interface GanttChartProps {
  jobs: Job[];
  operations: Operation[];
  resources: Resource[];
  capabilities: Capability[];
  view: "operations" | "resources";
}

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
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Generate time scale for the next 7 days
  const timeScale = useMemo(() => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date,
        label: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      });
    }
    
    return days;
  }, []);

  // Calculate timeline width based on zoom level
  const timelineWidth = useMemo(() => {
    return 1200 * zoomLevel;
  }, [zoomLevel]);

  const dayWidth = useMemo(() => {
    return timelineWidth / 7;
  }, [timelineWidth]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.5, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
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

  const renderOperationsView = () => (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-none bg-white border-b border-gray-200 z-10">
        <div className="flex">
          <div className="w-64 px-4 py-3 bg-gray-50 border-r border-gray-200">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Jobs & Operations</span>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" onClick={zoomOut} title="Zoom Out">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={resetZoom} title="Reset Zoom">
                  <span className="text-xs">{(zoomLevel * 100).toFixed(0)}%</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={zoomIn} title="Zoom In">
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-gray-50 border-r border-gray-200 overflow-x-scroll gantt-visible-scrollbar">
            <div 
              className="flex"
              style={{ width: `${timelineWidth}px` }}
            >
              {timeScale.map((day, index) => (
                <div key={index} className="border-r border-gray-200 p-2 text-center select-none" style={{ width: `${dayWidth}px` }}>
                  <div className="text-xs font-medium text-gray-500">{day.label}</div>
                  <div className="text-xs text-gray-400">{day.month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content - Operations */}
      <div className="flex-1 overflow-scroll gantt-visible-scrollbar">
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
                  <div className="flex-1 bg-blue-50 border-r border-gray-100" style={{ minWidth: `${timelineWidth}px` }}>
                    {/* Job level timeline background */}
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
                    <div className="flex-1 relative p-2 min-h-[60px]" style={{ minWidth: `${timelineWidth}px` }}>
                      <OperationBlock
                        operation={operation}
                        resourceName={getResourceName(operation.assignedResourceId || 0)}
                        jobName={jobs.find(job => job.id === operation.jobId)?.name}
                        job={jobs.find(job => job.id === operation.jobId)}
                        timelineWidth={timelineWidth}
                        dayWidth={dayWidth}
                      />
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

  // Create a separate component to handle the drop zone for each resource
  const ResourceRow = ({ resource }: { resource: Resource }) => {
    const resourceOperations = operations.filter(op => op.assignedResourceId === resource.id);
    const { drop, isOver, canDrop } = useOperationDrop(resource);

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
            className={`flex-1 relative p-2 min-h-[60px] transition-colors ${
              isOver ? (canDrop ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200") : ""
            }`}
            style={{ minWidth: `${timelineWidth}px` }}
          >
            {resourceOperations.map((operation) => (
              <OperationBlock
                key={operation.id}
                operation={operation}
                resourceName={resource.name}
                jobName={jobs.find(job => job.id === operation.jobId)?.name}
                job={jobs.find(job => job.id === operation.jobId)}
                timelineWidth={timelineWidth}
                dayWidth={dayWidth}
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
                <Button variant="ghost" size="sm" onClick={zoomOut} title="Zoom Out">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={resetZoom} title="Reset Zoom">
                  <span className="text-xs">{(zoomLevel * 100).toFixed(0)}%</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={zoomIn} title="Zoom In">
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-gray-50 border-r border-gray-200 overflow-x-scroll gantt-visible-scrollbar">
            <div 
              className="flex"
              style={{ width: `${timelineWidth}px` }}
            >
              {timeScale.map((day, index) => (
                <div key={index} className="border-r border-gray-200 p-2 text-center select-none" style={{ width: `${dayWidth}px` }}>
                  <div className="text-xs font-medium text-gray-500">{day.label}</div>
                  <div className="text-xs text-gray-400">{day.month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content - Resources */}
      <div className="flex-1 overflow-scroll gantt-visible-scrollbar">
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
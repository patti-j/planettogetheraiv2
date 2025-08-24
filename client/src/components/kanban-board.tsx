import React, { useState, useMemo } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreHorizontal, Plus, Settings, Calendar, User, Building2, Wrench, ChevronDown, Maximize2, Minimize2, Briefcase, Users, Sparkles, Eye, Clock, MapPin, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import JobForm from "@/components/job-form";
import OperationForm from "@/components/operation-form";
import KanbanConfigManager from "@/components/kanban-config-manager";
import type { ProductionOrder, Operation, Resource, Capability, KanbanConfig } from "@shared/schema";

interface KanbanBoardProps {
  jobs: ProductionOrder[];
  operations: Operation[];
  resources: Resource[];
  capabilities: Capability[];
  selectedConfig?: KanbanConfig;
  onConfigChange?: (configId: number) => void;
  kanbanConfigs?: KanbanConfig[];
  isMaximized?: boolean;
  onCreateJob?: () => void;
  onCreateResource?: () => void;
  onConfigureBoards?: () => void;
  onAICreateBoards?: () => void;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  color: string;
  items: (ProductionOrder | Operation)[];
}

interface DragItem {
  id: number;
  type: string;
  sourceColumnId: string;
  index: number;
}

const JobCard = ({ job, onEdit, onViewDetails, swimLaneField, index }: { job: ProductionOrder; onEdit: (job: ProductionOrder) => void; onViewDetails: (job: ProductionOrder) => void; swimLaneField: string; index: number }) => {
  const getSourceColumnId = () => {
    switch (swimLaneField) {
      case "status":
        return job.status;
      case "priority":
        return job.priority;
      case "customer":
        return job.customerId?.toString() || 'unknown';
      default:
        return job.status;
    }
  };

  const [{ isDragging }, drag] = useDrag({
    type: "job",
    item: { id: job.id, type: "job", sourceColumnId: getSourceColumnId(), index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (draggedItem, monitor) => {
      // Prevent any default behavior that might cause screen changes
      if (monitor.didDrop()) {
        return;
      }
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div
      ref={drag}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 sm:p-3 mb-2 sm:mb-3 cursor-move hover:shadow-md transition-shadow relative ${
        isDragging ? "opacity-50 rotate-3" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 dark:text-white text-sm flex-1 pr-8">{job.name}</h4>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="h-6 w-6 p-0 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                <MoreHorizontal className="w-4 h-4" />
              </div>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(job)}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(job)}>
              Edit Job
            </DropdownMenuItem>
            <DropdownMenuItem>
              View Operations
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              Delete Job
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="truncate pr-2">Customer ID: {job.customerId}</span>
          <Badge className={`text-xs ${getPriorityColor(job.priority)} text-white flex-shrink-0`}>
            {job.priority}
          </Badge>
        </div>
        
        {job.dueDate && (
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3 h-3 mr-1" />
            Due: {new Date(job.dueDate).toLocaleDateString()}
          </div>
        )}
        
        {job.description && (
          <p className="text-xs text-gray-600 line-clamp-2">{job.description}</p>
        )}
      </div>
      
      {/* View Details button positioned at bottom right */}
      <div 
        className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600 z-10 flex items-center justify-center rounded cursor-pointer" 
        onClick={(e) => {
          e.stopPropagation();
          onViewDetails(job);
        }}
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </div>
    </div>
  );
};

const OperationCard = ({ operation, job, jobs, resources, onEdit, onViewDetails, swimLaneField, index }: { 
  operation: Operation; 
  job?: ProductionOrder; 
  jobs: ProductionOrder[];
  resources: Resource[];
  onEdit: (operation: Operation) => void;
  onViewDetails: (operation: Operation) => void;
  swimLaneField: string;
  index: number;
}) => {
  const getSourceColumnId = () => {
    switch (swimLaneField) {
      case "status":
        return operation.status;
      case "priority":
        // Operations inherit priority from their parent job
        const parentJob = job || jobs[0]; // Default to first job since operation doesn't have productionOrderId
        return parentJob?.priority || "medium";
      case "assignedResourceId":
        const resource = resources[0]; // Default to first resource since operation doesn't have assignedResourceId
        return resource?.name || "Unassigned";
      default:
        return operation.status;
    }
  };

  const [{ isDragging }, drag] = useDrag({
    type: "operation",
    item: { id: operation.id, type: "operation", sourceColumnId: getSourceColumnId(), index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (draggedItem, monitor) => {
      // Prevent any default behavior that might cause screen changes
      if (monitor.didDrop()) {
        return;
      }
    },
  });

  const assignedResource = resources.find(r => r.id === operation.assignedResourceId);
  
  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case "Machine": return <Wrench className="w-3 h-3" />;
      case "Operator": return <User className="w-3 h-3" />;
      case "Facility": return <Building2 className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };

  return (
    <div
      ref={drag}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 sm:p-3 mb-2 sm:mb-3 cursor-move hover:shadow-md transition-shadow relative ${
        isDragging ? "opacity-50 rotate-3" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 dark:text-white text-sm flex-1 pr-8">{operation.name}</h4>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="h-6 w-6 p-0 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                <MoreHorizontal className="w-4 h-4" />
              </div>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(operation)}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(operation)}>
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
      
      <div className="space-y-2">
        {job && (
          <div className="text-xs text-gray-500">
            Job: {job.name}
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex-shrink-0">Duration: {operation.duration}h</span>
          {assignedResource && (
            <div className="flex items-center truncate ml-2">
              {getResourceIcon(assignedResource.type)}
              <span className="ml-1 truncate">{assignedResource.name}</span>
            </div>
          )}
        </div>
        
        {[] && [].length > 0 && (
          <div className="text-xs text-gray-500">
            Requires: {[].join(", ")}
          </div>
        )}
        
        {operation.startTime && operation.endTime && (
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3 h-3 mr-1" />
            {new Date(operation.startTime).toLocaleDateString()} - {new Date(operation.endTime).toLocaleDateString()}
          </div>
        )}
      </div>
      
      {/* View Details button positioned at bottom right */}
      <div 
        className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600 z-10 flex items-center justify-center rounded cursor-pointer" 
        onClick={(e) => {
          e.stopPropagation();
          onViewDetails(operation);
        }}
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </div>
    </div>
  );
};

// Job Details Dialog Component
const JobDetailsDialog = ({ job, operations, resources, capabilities, open, onOpenChange }: { 
  job: ProductionOrder | null; 
  operations: Operation[];
  resources: Resource[];
  capabilities: Capability[];
  open: boolean; 
  onOpenChange: (open: boolean) => void 
}) => {
  if (!job) return null;

  // Filter operations for this job
  const jobOperations = operations.filter(op => op.productionOrderId === job.id);

  const formatDate = (date: Date | null) => {
    return date ? new Date(date).toLocaleString() : "Not set";
  };

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case "Machine": return <Wrench className="w-4 h-4" />;
      case "Operator": return <User className="w-4 h-4" />;
      case "Facility": return <Building2 className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Job Details: {job.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Basic Information</h3>
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Job ID:</span>
                  <span className="font-medium">#{job.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{job.customerId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Priority:</span>
                  <Badge className={`${job.priority === 'high' ? 'bg-red-500' : job.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'} text-white`}>
                    {job.priority}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="outline">{job.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{job.quantity} units</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Timeline</h3>
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Due Date:</span>
                </div>
                <span className="font-medium">{formatDate(job.dueDate)}</span>
                
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Scheduled Start:</span>
                </div>
                <span className="font-medium">{formatDate(job.dueDate)}</span>
                
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Scheduled End:</span>
                </div>
                <span className="font-medium">{formatDate(job.dueDate)}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Description</h3>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-700">{job.description}</p>
              </div>
            </div>
          )}

          {/* Operations */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Operations ({jobOperations.length})
            </h3>
            {jobOperations.length === 0 ? (
              <div className="bg-gray-50 p-3 rounded-lg text-center text-gray-500">
                No operations defined for this job
              </div>
            ) : (
              <div className="space-y-2">
                {jobOperations.map((operation) => {
                  const assignedResource = resources.find(r => r.id === operation.assignedResourceId);
                  const requiredCapNames = []?.map(capId => 
                    capabilities.find(c => c.id === capId)?.name || `Capability ${capId}`
                  ) || [];
                  
                  return (
                    <div key={operation.id} className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{operation.name}</h4>
                          {operation.description && (
                            <p className="text-sm text-gray-600 mt-1">{operation.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {operation.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-medium">{operation.duration}h</span>
                        </div>
                        
                        {assignedResource && (
                          <div className="flex items-center gap-2">
                            {getResourceIcon(assignedResource.type)}
                            <span className="text-gray-600">Resource:</span>
                            <span className="font-medium truncate">{assignedResource.name}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">Order:</span>
                          <span className="font-medium">{operation.id}</span>
                        </div>
                      </div>
                      
                      {requiredCapNames.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">Required Capabilities:</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {requiredCapNames.map((capName, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {capName}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {(operation.startTime || operation.endTime) && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {operation.startTime && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-green-600" />
                                <span className="text-gray-600">Scheduled Start:</span>
                                <span className="font-medium">{formatDate(operation.startTime)}</span>
                              </div>
                            )}
                            {operation.endTime && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-red-600" />
                                <span className="text-gray-600">Scheduled End:</span>
                                <span className="font-medium">{formatDate(operation.endTime)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Metadata</h3>
            <div className="bg-gray-50 p-3 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Plant ID:</span>
                <span className="font-medium">{job.plantId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">{formatDate(job.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Operation Details Dialog Component
const OperationDetailsDialog = ({ operation, job, resources, capabilities, open, onOpenChange }: { 
  operation: Operation | null; 
  job: ProductionOrder | null;
  resources: Resource[];
  capabilities: Capability[];
  open: boolean; 
  onOpenChange: (open: boolean) => void 
}) => {
  if (!operation) return null;

  const assignedResource = resources.find(r => r.id === operation.assignedResourceId);
  const requiredCapNames = []?.map(capId => 
    capabilities.find(c => c.id === capId)?.name || `Capability ${capId}`
  ) || [];

  const formatDate = (date: Date | null) => {
    return date ? new Date(date).toLocaleString() : "Not set";
  };

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case "Machine": return <Wrench className="w-4 h-4" />;
      case "Operator": return <User className="w-4 h-4" />;
      case "Facility": return <Building2 className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Operation Details: {operation.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Basic Information</h3>
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Operation ID:</span>
                  <span className="font-medium">#{operation.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Parent Job:</span>
                  <span className="font-medium">{job?.name || `Operation #${operation.id}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="outline">{operation.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{operation.duration} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order:</span>
                  <span className="font-medium">#{operation.id}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Resource Assignment</h3>
              <div className="bg-gray-50 p-3 rounded-lg">
                {assignedResource ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getResourceIcon(assignedResource.type)}
                      <span className="font-medium">{assignedResource.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Type: {assignedResource.type}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <AlertCircle className="w-4 h-4" />
                    <span>No resource assigned</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Required Capabilities */}
          {requiredCapNames.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Required Capabilities</h3>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {requiredCapNames.map((capName, index) => (
                    <Badge key={index} variant="secondary">
                      {capName}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Timeline</h3>
            <div className="bg-gray-50 p-3 rounded-lg space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Scheduled Start:</span>
                </div>
                <span className="font-medium">{formatDate(operation.startTime)}</span>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Scheduled End:</span>
                </div>
                <span className="font-medium">{formatDate(operation.endTime)}</span>
              </div>

              {operation.startTime && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Actual Start:</span>
                  </div>
                  <span className="font-medium">{formatDate(operation.startTime)}</span>
                </div>
              )}

              {operation.endTime && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Actual End:</span>
                  </div>
                  <span className="font-medium">{formatDate(operation.endTime)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Individual drop zone for resequencing
const CardDropZone = ({ 
  onDrop, 
  columnId, 
  insertIndex, 
  isFirst = false, 
  isLast = false 
}: { 
  onDrop: (item: DragItem, targetStatus: string, insertAtIndex?: number) => void;
  columnId: string;
  insertIndex: number;
  isFirst?: boolean;
  isLast?: boolean;
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ["job", "operation"],
    drop: (item: DragItem) => {
      onDrop(item, columnId, insertIndex);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`transition-all duration-200 ${
        isOver && canDrop 
          ? "h-12 bg-blue-100 border-2 border-blue-400 border-dashed rounded-lg mx-1 flex items-center justify-center shadow-sm" 
          : "h-4 hover:h-6 hover:bg-gray-50 hover:border hover:border-gray-200 hover:border-dashed hover:rounded-md"
      } ${isFirst ? "mt-2" : ""} ${isLast ? "mb-2" : ""}`}
    >
      {isOver && canDrop && (
        <div className="text-xs text-blue-600 font-medium flex items-center">
          <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
          Drop here to {isFirst ? "move to top" : "reorder"}
        </div>
      )}
    </div>
  );
};

const KanbanColumn = ({ 
  column, 
  onDrop, 
  children,
  className,
  style
}: { 
  column: KanbanColumn; 
  onDrop: (item: DragItem, targetStatus: string, insertAtIndex?: number) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ["job", "operation"],
    drop: (item: DragItem) => {
      // Default drop at the end of the column
      onDrop(item, column.status, column.items.length);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`bg-gray-50 rounded-lg p-2 sm:p-4 h-full w-72 sm:w-80 flex-shrink-0 flex flex-col ${
        isOver && canDrop ? "bg-blue-50 border-2 border-blue-300 border-dashed" : ""
      } ${className || ""}`}
      style={style}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full ${column.color} mr-2`}></div>
          <h3 className="font-medium text-gray-900">{column.title}</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {column.items.length}
        </Badge>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-0">
        {column.items.length === 0 ? (
          <div className={`text-center mt-8 p-8 rounded-lg border-2 border-dashed transition-all duration-200 ${
            isOver && canDrop 
              ? "border-blue-400 bg-blue-50 text-blue-600" 
              : "border-gray-300 text-gray-400"
          }`}>
            <p className="text-sm">No items</p>
            {isOver && canDrop && (
              <div className="flex items-center justify-center mt-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                <p className="text-xs font-medium">Drop here to update status</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Top drop zone */}
            <CardDropZone 
              onDrop={onDrop}
              columnId={column.id}
              insertIndex={0}
              isFirst={true}
            />
            
            {/* Render children with drop zones between them */}
            {React.Children.map(children, (child, index) => (
              <div key={index}>
                {child}
                {/* Drop zone after each card */}
                <CardDropZone 
                  onDrop={onDrop}
                  columnId={column.id}
                  insertIndex={index + 1}
                  isLast={index === column.items.length - 1}
                />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

function KanbanBoard({ 
  jobs, 
  operations, 
  resources, 
  capabilities,
  selectedConfig: parentSelectedConfig,
  onConfigChange,
  kanbanConfigs: parentKanbanConfigs,
  isMaximized = false,
  onCreateJob,
  onCreateResource,
  onConfigureBoards,
  onAICreateBoards
}: KanbanBoardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [operationDialogOpen, setOperationDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ProductionOrder | undefined>();
  const [selectedOperation, setSelectedOperation] = useState<Operation | undefined>();
  const [configManagerOpen, setConfigManagerOpen] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  
  // Details dialog state
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);
  const [operationDetailsOpen, setOperationDetailsOpen] = useState(false);
  const [jobForDetails, setJobForDetails] = useState<ProductionOrder | null>(null);
  const [operationForDetails, setOperationForDetails] = useState<Operation | null>(null);

  // Use parent configs if available, otherwise fetch
  const { data: fetchedKanbanConfigs = [], isLoading: configsLoading } = useQuery<KanbanConfig[]>({
    queryKey: ["/api/kanban-configs"],
    enabled: !parentKanbanConfigs,
  });

  const kanbanConfigs = parentKanbanConfigs || fetchedKanbanConfigs;
  const selectedConfig = parentSelectedConfig || kanbanConfigs.find(config => config.isDefault) || kanbanConfigs[0];

  // Derived values from selected configuration
  const view = selectedConfig?.viewType || "productionOrders";
  const swimLaneField = selectedConfig?.swimLaneField || "status";
  const swimLaneColors = selectedConfig?.swimLaneColors || {};

  // Generate columns based on selected field
  const getFieldValue = (item: ProductionOrder | Operation, field: string) => {
    switch (field) {
      case "status":
        return item.status;
      case "priority":
        // Operations inherit priority from their parent job
        if ('priority' in item) {
          return item.priority;
        } else {
          const operation = item as Operation;
          const parentJob = jobs[0]; // Default to first job since operation doesn't have productionOrderId
          return parentJob?.priority || "medium";
        }
      case "customer":
        return (item as ProductionOrder).customerId?.toString() || "Unknown";
      case "assignedResourceId":
        const operation = item as Operation;
        const resource = resources[0]; // Default to first resource since operation doesn't have assignedResourceId
        return resource?.name || "Unassigned";
      default:
        return "Unknown";
    }
  };

  const getFieldValues = (field: string) => {
    if (field === "status") {
      // Get actual status values from jobs and operations
      const items = view === "productionOrders" ? jobs : operations;
      const statusValues = Array.from(new Set(items.map(item => item.status).filter(Boolean)));
      // If no status values found, use defaults
      return statusValues.length > 0 ? statusValues : ["planned", "In-Progress", "completed", "cancelled"];
    } else if (field === "priority") {
      return ["low", "medium", "high"];
    } else if (field === "customer") {
      return Array.from(new Set(jobs.map(job => job.customerId).filter(Boolean)));
    } else if (field === "assignedResourceId") {
      return Array.from(new Set(resources.map(r => r.name).filter(Boolean)));
    }
    return [];
  };

  const getDefaultColor = (field: string, value: string, index: number) => {
    const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-orange-500"];
    
    if (field === "status") {
      const statusColors: Record<string, string> = {
        planned: "bg-blue-500",
        "In-Progress": "bg-yellow-500",
        completed: "bg-green-500",
        cancelled: "bg-red-500",
        active: "bg-yellow-500",
        pending: "bg-blue-500",
        done: "bg-green-500",
        blocked: "bg-red-500"
      };
      return statusColors[value] || colors[index % colors.length];
    } else if (field === "priority") {
      const priorityColors: Record<string, string> = {
        low: "bg-green-500",
        medium: "bg-yellow-500",
        high: "bg-red-500"
      };
      return priorityColors[value] || colors[index % colors.length];
    }
    
    return colors[index % colors.length];
  };

  const columns = useMemo(() => {
    if (!selectedConfig) return [];
    
    const fieldValues = getFieldValues(swimLaneField);
    const items = view === "productionOrders" ? jobs : operations;
    
    // Debug logging
    console.log('Kanban Debug:', {
      selectedConfig,
      view,
      swimLaneField,
      fieldValues,
      itemCount: items.length,
      items: items.slice(0, 2) // Show first 2 items for debugging
    });
    
    const columnsMap: Record<string, KanbanColumn> = {};
    
    // Initialize columns
    fieldValues.forEach((value, index) => {
      const color = swimLaneColors[value] || getDefaultColor(swimLaneField, value, index);
      columnsMap[value] = {
        id: value,
        title: value.charAt(0).toUpperCase() + value.slice(1),
        status: value,
        color,
        items: []
      };
    });
    
    // Populate columns with items
    items.forEach(item => {
      const fieldValue = getFieldValue(item, swimLaneField);
      if (columnsMap[fieldValue]) {
        columnsMap[fieldValue].items.push(item);
      } else {
        console.log('No column found for value:', fieldValue, 'from item:', item);
      }
    });

    // Sort items in each column based on saved card ordering
    Object.values(columnsMap).forEach(column => {
      const savedOrder = selectedConfig?.cardOrdering?.[column.id];
      if (savedOrder && savedOrder.length > 0) {
        // Sort items according to saved order
        column.items.sort((a, b) => {
          const aIndex = savedOrder.indexOf(a.id);
          const bIndex = savedOrder.indexOf(b.id);
          
          // If both items are in saved order, sort by their position
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
          // If only one is in saved order, prioritize it
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          // If neither is in saved order, keep current order
          return 0;
        });
      }
    });
    
    const result = Object.values(columnsMap);
    console.log('Final columns:', result.map(col => ({ title: col.title, itemCount: col.items.length })));
    return result;
  }, [jobs, operations, view, swimLaneField, swimLaneColors, resources, selectedConfig]);

  // Mutations for updating status with optimistic updates
  const updateJobMutation = useMutation({
    mutationFn: async (updateData: { id: number; [key: string]: any }) => {
      const response = await apiRequest("PUT", `/api/jobs/${updateData.id}`, updateData);
      return response.json();
    },
    onMutate: async (updateData) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["/api/jobs"] });
      
      // Snapshot the previous value
      const previousJobs = queryClient.getQueryData(["/api/jobs"]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(["/api/jobs"], (old: ProductionOrder[]) => {
        if (!old) return old;
        return old.map(job => 
          job.id === updateData.id 
            ? { ...job, ...updateData } 
            : job
        );
      });
      
      return { previousJobs };
    },
    onError: (err, updateData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousJobs) {
        queryClient.setQueryData(["/api/jobs"], context.previousJobs);
      }
      toast({ title: "Failed to update job", variant: "destructive" });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
    },
  });

  const updateOperationMutation = useMutation({
    mutationFn: async (updateData: { id: number; [key: string]: any }) => {
      const response = await apiRequest("PUT", `/api/operations/${updateData.id}`, updateData);
      return response.json();
    },
    onMutate: async (updateData) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["/api/operations"] });
      
      // Snapshot the previous value
      const previousOperations = queryClient.getQueryData(["/api/operations"]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(["/api/operations"], (old: Operation[]) => {
        if (!old) return old;
        return old.map(operation => 
          operation.id === updateData.id 
            ? { ...operation, ...updateData } 
            : operation
        );
      });
      
      return { previousOperations };
    },
    onError: (err, updateData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousOperations) {
        queryClient.setQueryData(["/api/operations"], context.previousOperations);
      }
      toast({ title: "Failed to update operation", variant: "destructive" });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
    },
  });

  // Mutation for updating Kanban card ordering
  const updateKanbanOrderMutation = useMutation({
    mutationFn: async ({ 
      configId, 
      swimLaneValue, 
      cardIds 
    }: { 
      configId: number; 
      swimLaneValue: string; 
      cardIds: number[] 
    }) => {
      // Get current config to merge with existing cardOrdering
      const currentConfig = selectedConfig;
      const newCardOrdering = {
        ...currentConfig?.cardOrdering,
        [swimLaneValue]: cardIds
      };
      
      const response = await apiRequest("PUT", `/api/kanban-configs/${configId}`, { 
        cardOrdering: newCardOrdering
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban-configs"] });
      toast({ title: "Card order updated successfully" });
    },
    onError: (error: any) => {
      console.error("Card ordering update failed:", error);
      toast({ title: "Failed to update card order", variant: "destructive" });
    },
  });

  const handleDrop = (item: DragItem, targetValue: string, insertAtIndex?: number) => {
    // Handle reordering within the same column
    if (item.sourceColumnId === targetValue && insertAtIndex !== undefined) {
      const currentColumn = columns.find(col => col.id === targetValue);
      if (currentColumn && selectedConfig) {
        const cardIds = currentColumn.items.map(cardItem => cardItem.id);
        const currentIndex = cardIds.indexOf(item.id);
        
        if (currentIndex !== -1) {
          // Remove item from current position
          cardIds.splice(currentIndex, 1);
          // Adjust insert index if dropping after the original position
          const finalInsertIndex = insertAtIndex > currentIndex ? insertAtIndex - 1 : insertAtIndex;
          // Insert at new position
          cardIds.splice(finalInsertIndex, 0, item.id);
          
          console.log('Reordering card in same column:', {
            itemId: item.id,
            currentIndex,
            insertAtIndex,
            finalInsertIndex,
            cardIds
          });
          
          // Update card ordering in the Kanban config
          updateKanbanOrderMutation.mutate({
            configId: selectedConfig.id,
            swimLaneValue: targetValue,
            cardIds
          });
        }
      }
      return;
    }

    // Handle moving between columns (existing logic)
    if (item.sourceColumnId === targetValue) return;

    // Build update object based on swim lane field
    const updateData: any = {};
    
    if (swimLaneField === "status") {
      updateData.status = targetValue;
    } else if (swimLaneField === "priority") {
      updateData.priority = targetValue;
    } else if (swimLaneField === "customer" && item.type === "job") {
      updateData.customer = targetValue;
    } else if (swimLaneField === "assignedResourceId" && item.type === "operation") {
      const resource = resources.find(r => r.name === targetValue);
      if (resource) {
        updateData.assignedResourceId = resource.id;
      }
    }

    // Only proceed if we have valid update data
    if (Object.keys(updateData).length > 0) {
      if (item.type === "job") {
        updateJobMutation.mutate({ id: item.id, ...updateData });
      } else if (item.type === "operation") {
        updateOperationMutation.mutate({ id: item.id, ...updateData });
      }
      
      // Update card ordering if provided
      if (insertAtIndex !== undefined && selectedConfig?.id) {
        const targetColumn = columns.find(col => col.id === targetValue);
        if (targetColumn) {
          const newOrder = [...targetColumn.items];
          // Remove the item if it was in this column
          const existingIndex = newOrder.findIndex(i => i.id === item.id);
          if (existingIndex !== -1) {
            newOrder.splice(existingIndex, 1);
          }
          // Insert at the target position
          newOrder.splice(insertAtIndex, 0, item);
          
          updateKanbanOrderMutation.mutate({
            configId: selectedConfig.id,
            swimLaneValue: targetValue,
            cardIds: newOrder.map(i => i.id)
          });
        }
      }
    }
  };

  const handleEditJob = (job: ProductionOrder) => {
    setSelectedJob(job);
    setJobDialogOpen(true);
  };

  const handleEditOperation = (operation: Operation) => {
    setSelectedOperation(operation);
    setOperationDialogOpen(true);
  };

  const handleViewJobDetails = (job: ProductionOrder) => {
    setJobForDetails(job);
    setJobDetailsOpen(true);
  };

  const handleViewOperationDetails = (operation: Operation) => {
    setOperationForDetails(operation);
    setOperationDetailsOpen(true);
  };

  const handleAddJob = () => {
    setSelectedJob(undefined);
    setJobDialogOpen(true);
  };

  const handleAddOperation = () => {
    setSelectedOperation(undefined);
    setOperationDialogOpen(true);
  };

  const handleJobFormSuccess = () => {
    setJobDialogOpen(false);
    setSelectedJob(undefined);
    queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
  };

  const handleOperationFormSuccess = () => {
    setOperationDialogOpen(false);
    setSelectedOperation(undefined);
    queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
    queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
  };

  // Show loading state
  if (configsLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-medium text-gray-900">Board</h2>
            <div className="w-32 sm:w-48 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex-1 bg-gray-100 p-2 sm:p-4">
          <div className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-72 sm:w-80 bg-gray-50 rounded-lg p-2 sm:p-4 h-80 sm:h-96 flex-shrink-0">
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="space-y-2">
                  <div className="h-16 sm:h-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-16 sm:h-20 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }


  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-2 border-b border-gray-200 bg-white">
          {/* Desktop header */}
          <div className="hidden md:flex items-center justify-between mb-2">
            <div className="flex items-center space-x-4">
              {selectedConfig && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Badge variant="outline">{selectedConfig.viewType === "jobs" ? "Jobs" : "Operations"}</Badge>
                  <span>•</span>
                  <span>Grouped by {selectedConfig.swimLaneField}</span>
                </div>
              )}
            </div>
            

          </div>

          {/* Mobile header */}
          <div className="md:hidden">
            {/* Mobile controls - stacked layout */}
            <div className="space-y-1.5">
              {/* Board dropdown first */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="w-full justify-between text-xs border border-gray-200 rounded px-3 py-1.5 bg-white hover:bg-gray-50 cursor-pointer flex items-center">
                    <span className="truncate">{selectedConfig?.name || "Select Board"}</span>
                    <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {kanbanConfigs.map((config) => (
                    <DropdownMenuItem
                      key={config.id}
                      onClick={() => onConfigChange && onConfigChange(config.id)}
                      className={selectedConfig?.id === config.id ? "bg-blue-50 text-blue-900" : ""}
                    >
                      <div className="flex items-center">
                        {config.viewType === "jobs" ? (
                          <Briefcase className="w-4 h-4 mr-2" />
                        ) : config.viewType === "resources" ? (
                          <Wrench className="w-4 h-4 mr-2" />
                        ) : (
                          <Users className="w-4 h-4 mr-2" />
                        )}
                        <div>
                          <div className="font-medium">{config.name}</div>
                          <div className="text-xs text-gray-500 capitalize">{config.viewType} board</div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onConfigureBoards} className="text-blue-600">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Boards
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* AI buttons - side by side */}
              <div className="flex space-x-2">
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs flex-1" 
                  size="sm"
                  onClick={onConfigureBoards}
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Configure
                </Button>
                
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs flex-1" 
                  size="sm"
                  onClick={onAICreateBoards}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Create
                </Button>
              </div>

              {/* Command button last */}
              {selectedConfig && (
                <Button 
                  className="bg-primary hover:bg-blue-700 text-white text-xs w-full" 
                  size="sm"
                  onClick={() => {
                    if (selectedConfig?.viewType === "jobs") {
                      onCreateJob && onCreateJob();
                    } else if (selectedConfig?.viewType === "operations") {
                      handleAddOperation();
                    } else if (selectedConfig?.viewType === "resources") {
                      onCreateResource && onCreateResource();
                    }
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New {selectedConfig?.viewType === "jobs" ? "Job" : selectedConfig?.viewType === "operations" ? "Operation" : "Resource"}
                </Button>
              )}
            </div>
          </div>

          {/* Desktop controls */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between space-x-2 mb-2">
              {/* Board dropdown */}
              <div className="flex-1 max-w-xs">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between">
                      <span className="truncate">{selectedConfig?.name || "Select Board"}</span>
                      <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-80">
                    {kanbanConfigs.map((config) => (
                      <DropdownMenuItem
                        key={config.id}
                        onClick={() => onConfigChange && onConfigChange(config.id)}
                        className={selectedConfig?.id === config.id ? "bg-blue-50 text-blue-900" : ""}
                      >
                        <div className="flex items-center">
                          {config.viewType === "jobs" ? (
                            <Briefcase className="w-4 h-4 mr-2" />
                          ) : config.viewType === "resources" ? (
                            <Wrench className="w-4 h-4 mr-2" />
                          ) : (
                            <Users className="w-4 h-4 mr-2" />
                          )}
                          <div>
                            <div className="font-medium">{config.name}</div>
                            <div className="text-xs text-gray-500 capitalize">{config.viewType} board</div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onConfigureBoards} className="text-blue-600">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure Boards
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* AI buttons - smaller and side by side */}
              <div className="flex items-center space-x-2">
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" 
                  size="sm"
                  onClick={onConfigureBoards}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
                
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" 
                  size="sm"
                  onClick={onAICreateBoards}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </div>
            </div>

            {/* Command buttons */}
            {selectedConfig && (
              <div className="flex items-center space-x-2">
                <Button 
                  className="bg-primary hover:bg-blue-700 text-white flex-1" 
                  size="sm"
                  onClick={() => {
                    if (selectedConfig?.viewType === "jobs") {
                      onCreateJob && onCreateJob();
                    } else if (selectedConfig?.viewType === "operations") {
                      handleAddOperation();
                    } else if (selectedConfig?.viewType === "resources") {
                      onCreateResource && onCreateResource();
                    }
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New {selectedConfig?.viewType === "productionOrders" ? "Production Order" : selectedConfig?.viewType === "operations" ? "Operation" : "Resource"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Kanban Columns */}
        <div className="flex-1 bg-gray-100 overflow-hidden">
          {!selectedConfig ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 mb-4">No Kanban configuration selected</p>
                <Button onClick={() => setConfigManagerOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Create Configuration
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full relative">
              {/* Mobile view - simplified horizontal scrolling */}
              <div className="block md:hidden h-full overflow-x-auto overflow-y-hidden">
                <div className="flex gap-4 h-full p-4" style={{ minWidth: `${columns.length * 300}px` }}>
                  {columns.map((column) => (
                    <div 
                      key={column.id}
                      className="bg-gray-50 rounded-lg p-3 flex flex-col"
                      style={{ 
                        width: '280px',
                        minWidth: '280px',
                        height: '100%',
                        flexShrink: 0
                      }}
                    >
                      <div className="flex items-center justify-between mb-3 flex-shrink-0">
                        <h3 className="text-sm font-medium text-gray-900 capitalize">
                          {column.title}
                        </h3>
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                          {column.items.length}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-2 overflow-y-auto flex-1">
                        {view === "productionOrders" ? (
                          column.items.map((item, index) => (
                            <JobCard
                              key={item.id}
                              job={item as ProductionOrder}
                              onEdit={handleEditJob}
                              onViewDetails={handleViewJobDetails}
                              swimLaneField={swimLaneField}
                              index={index}
                            />
                          ))
                        ) : (
                          column.items.map((item, index) => (
                            <OperationCard
                              key={item.id}
                              operation={item as Operation}
                              job={jobs.find(j => j.id === (item as Operation).productionOrderId)}
                              jobs={jobs}
                              resources={resources}
                              onEdit={handleEditOperation}
                              onViewDetails={handleViewOperationDetails}
                              swimLaneField={swimLaneField}
                              index={index}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop columns - hidden on mobile */}
              <div className="hidden md:block h-full overflow-x-auto overflow-y-hidden p-4">
                <div className="flex gap-4 h-full" style={{ minWidth: `${columns.length * 320}px` }}>
                  {columns.map((column) => (
                    <KanbanColumn
                      key={column.id}
                      column={column}
                      onDrop={handleDrop}
                    >
                      {view === "productionOrders" ? (
                        column.items.map((item, index) => (
                          <JobCard
                            key={item.id}
                            job={item as ProductionOrder}
                            onEdit={handleEditJob}
                            onViewDetails={handleViewJobDetails}
                            swimLaneField={swimLaneField}
                            index={index}
                          />
                        ))
                      ) : (
                        column.items.map((item, index) => (
                          <OperationCard
                            key={item.id}
                            operation={item as Operation}
                            job={jobs.find(j => j.id === (item as Operation).productionOrderId)}
                            jobs={jobs}
                            resources={resources}
                            onEdit={handleEditOperation}
                            onViewDetails={handleViewOperationDetails}
                            swimLaneField={swimLaneField}
                            index={index}
                          />
                        ))
                      )}
                    </KanbanColumn>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Job Creation/Edit Dialog */}
      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedJob ? "Edit Job" : "New Job"}</DialogTitle>
          </DialogHeader>
          <JobForm
            job={selectedJob}
            onSuccess={handleJobFormSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Operation Creation/Edit Dialog */}
      <Dialog open={operationDialogOpen} onOpenChange={setOperationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedOperation ? "Edit Operation" : "New Operation"}</DialogTitle>
          </DialogHeader>
          <OperationForm
            operation={selectedOperation}
            jobs={jobs}
            capabilities={capabilities}
            resources={resources}
            onSuccess={handleOperationFormSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Kanban Configuration Manager */}
      <KanbanConfigManager
        open={configManagerOpen}
        onOpenChange={setConfigManagerOpen}
        jobs={jobs}
        resources={resources}
        capabilities={capabilities}
      />

      {/* Job Details Dialog */}
      <JobDetailsDialog
        job={jobForDetails}
        operations={operations}
        resources={resources}
        capabilities={capabilities}
        open={jobDetailsOpen}
        onOpenChange={setJobDetailsOpen}
      />

      {/* Operation Details Dialog */}
      <OperationDetailsDialog
        operation={operationForDetails}
        job={operationForDetails ? jobs.find(j => j.id === operationForDetails.jobId) : null}
        resources={resources}
        capabilities={capabilities}
        open={operationDetailsOpen}
        onOpenChange={setOperationDetailsOpen}
      />
    </DndProvider>
  );
}

export default KanbanBoard;
export { JobDetailsDialog };
import React, { useState, useMemo } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreHorizontal, Plus, Settings, Calendar, User, Building2, Wrench, ChevronDown, Maximize2, Minimize2 } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import JobForm from "@/components/job-form";
import OperationForm from "@/components/operation-form";
import KanbanConfigManager from "@/components/kanban-config-manager";
import type { Job, Operation, Resource, Capability, KanbanConfig } from "@shared/schema";

interface KanbanBoardProps {
  jobs: Job[];
  operations: Operation[];
  resources: Resource[];
  capabilities: Capability[];
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  color: string;
  items: (Job | Operation)[];
}

interface DragItem {
  id: number;
  type: string;
  sourceColumnId: string;
  index: number;
}

const JobCard = ({ job, onEdit, swimLaneField, index }: { job: Job; onEdit: (job: Job) => void; swimLaneField: string; index: number }) => {
  const getSourceColumnId = () => {
    switch (swimLaneField) {
      case "status":
        return job.status;
      case "priority":
        return job.priority;
      case "customer":
        return job.customer;
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
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3 cursor-move hover:shadow-md transition-shadow ${
        isDragging ? "opacity-50 rotate-3" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm flex-1">{job.name}</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Customer: {job.customer}</span>
          <Badge className={`text-xs ${getPriorityColor(job.priority)} text-white`}>
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
    </div>
  );
};

const OperationCard = ({ operation, job, resources, onEdit, swimLaneField, index }: { 
  operation: Operation; 
  job?: Job; 
  resources: Resource[];
  onEdit: (operation: Operation) => void;
  swimLaneField: string;
  index: number;
}) => {
  const getSourceColumnId = () => {
    switch (swimLaneField) {
      case "status":
        return operation.status;
      case "priority":
        return operation.priority;
      case "assignedResourceId":
        const resource = resources.find(r => r.id === operation.assignedResourceId);
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
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3 cursor-move hover:shadow-md transition-shadow ${
        isDragging ? "opacity-50 rotate-3" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm flex-1">{operation.name}</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
      
      <div className="space-y-2">
        {job && (
          <div className="text-xs text-gray-500">
            Job: {job.name}
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Duration: {operation.duration}h</span>
          {assignedResource && (
            <div className="flex items-center">
              {getResourceIcon(assignedResource.type)}
              <span className="ml-1">{assignedResource.name}</span>
            </div>
          )}
        </div>
        
        {operation.requiredCapabilities && operation.requiredCapabilities.length > 0 && (
          <div className="text-xs text-gray-500">
            Requires: {operation.requiredCapabilities.join(", ")}
          </div>
        )}
        
        {operation.startTime && operation.endTime && (
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3 h-3 mr-1" />
            {new Date(operation.startTime).toLocaleDateString()} - {new Date(operation.endTime).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
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
  children 
}: { 
  column: KanbanColumn; 
  onDrop: (item: DragItem, targetStatus: string, insertAtIndex?: number) => void;
  children: React.ReactNode;
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
      className={`bg-gray-50 rounded-lg p-4 min-h-[600px] w-80 flex-shrink-0 ${
        isOver && canDrop ? "bg-blue-50 border-2 border-blue-300 border-dashed" : ""
      }`}
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
      
      <div className="space-y-0">
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
  isMaximized = false,
  onToggleMaximize
}: KanbanBoardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [operationDialogOpen, setOperationDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | undefined>();
  const [selectedOperation, setSelectedOperation] = useState<Operation | undefined>();
  const [configManagerOpen, setConfigManagerOpen] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);

  // Fetch kanban configurations
  const { data: kanbanConfigs = [], isLoading: configsLoading } = useQuery<KanbanConfig[]>({
    queryKey: ["/api/kanban-configs"],
  });

  // Get the selected configuration or default
  const selectedConfig = useMemo(() => {
    if (selectedConfigId) {
      return kanbanConfigs.find(config => config.id === selectedConfigId);
    }
    // Use default configuration if available
    const defaultConfig = kanbanConfigs.find(config => config.isDefault) || kanbanConfigs[0];
    // Set the selectedConfigId to the default config if not already set
    if (defaultConfig && !selectedConfigId) {
      setSelectedConfigId(defaultConfig.id);
    }
    return defaultConfig;
  }, [kanbanConfigs, selectedConfigId]);

  // Derived values from selected configuration
  const view = selectedConfig?.viewType || "jobs";
  const swimLaneField = selectedConfig?.swimLaneField || "status";
  const swimLaneColors = selectedConfig?.swimLaneColors || {};

  // Generate columns based on selected field
  const getFieldValue = (item: Job | Operation, field: string) => {
    switch (field) {
      case "status":
        return item.status;
      case "priority":
        return item.priority;
      case "customer":
        return (item as Job).customer || "Unknown";
      case "assignedResourceId":
        const operation = item as Operation;
        const resource = resources.find(r => r.id === operation.assignedResourceId);
        return resource?.name || "Unassigned";
      default:
        return "Unknown";
    }
  };

  const getFieldValues = (field: string) => {
    if (field === "status") {
      // Get actual status values from jobs and operations
      const items = view === "jobs" ? jobs : operations;
      const statusValues = [...new Set(items.map(item => item.status).filter(Boolean))];
      // If no status values found, use defaults
      return statusValues.length > 0 ? statusValues : ["planned", "In-Progress", "completed", "cancelled"];
    } else if (field === "priority") {
      return ["low", "medium", "high"];
    } else if (field === "customer") {
      return [...new Set(jobs.map(job => job.customer).filter(Boolean))];
    } else if (field === "assignedResourceId") {
      return [...new Set(resources.map(r => r.name).filter(Boolean))];
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
    const items = view === "jobs" ? jobs : operations;
    
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

  // Mutations for updating status
  const updateJobMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/jobs/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({ title: "Job status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update job status", variant: "destructive" });
    },
  });

  const updateOperationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/operations/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({ title: "Operation status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update operation status", variant: "destructive" });
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
    }
  };

  const handleEditJob = (job: Job) => {
    setSelectedJob(job);
    setJobDialogOpen(true);
  };

  const handleEditOperation = (operation: Operation) => {
    setSelectedOperation(operation);
    setOperationDialogOpen(true);
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
            <h2 className="text-lg font-medium text-gray-900">Kanban Board</h2>
            <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex-1 bg-gray-100 p-4">
          <div className="flex space-x-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-80 bg-gray-50 rounded-lg p-4 h-96">
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="space-y-2">
                  <div className="h-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-20 bg-gray-200 rounded animate-pulse" />
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
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-medium text-gray-900">Kanban Board</h2>
            <div className="flex items-center">
              <Select 
                value={selectedConfigId?.toString() || ""} 
                onValueChange={(value) => setSelectedConfigId(value ? parseInt(value) : null)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select configuration" />
                </SelectTrigger>
                <SelectContent>
                  {kanbanConfigs.map((config) => (
                    <SelectItem key={config.id} value={config.id.toString()}>
                      {config.name} {config.isDefault && "(Default)"}
                    </SelectItem>
                  ))}
                  <div className="border-t border-gray-200 my-1"></div>
                  <div 
                    className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 text-blue-600 font-medium"
                    onClick={() => setConfigManagerOpen(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Boards
                  </div>
                </SelectContent>
              </Select>
            </div>
            {selectedConfig && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Badge variant="outline">{selectedConfig.viewType === "jobs" ? "Jobs" : "Operations"}</Badge>
                <span>•</span>
                <span>Grouped by {selectedConfig.swimLaneField}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={view === "jobs" ? handleAddJob : handleAddOperation}>
              <Plus className="w-4 h-4 mr-2" />
              Add {view === "jobs" ? "Job" : "Operation"}
            </Button>
            {onToggleMaximize && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={onToggleMaximize}>
                    {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isMaximized ? "Minimize Kanban view" : "Maximize Kanban view"}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Kanban Columns */}
        <div className="flex-1 overflow-x-auto bg-gray-100 p-4">
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
            <div className="flex space-x-4 min-w-max">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  onDrop={handleDrop}
                >
                  {view === "jobs" ? (
                    column.items.map((item) => (
                      <JobCard
                        key={item.id}
                        job={item as Job}
                        onEdit={handleEditJob}
                        swimLaneField={swimLaneField}
                      />
                    ))
                  ) : (
                    column.items.map((item) => (
                      <OperationCard
                        key={item.id}
                        operation={item as Operation}
                        job={jobs.find(j => j.id === (item as Operation).jobId)}
                        resources={resources}
                        onEdit={handleEditOperation}
                        swimLaneField={swimLaneField}
                      />
                    ))
                  )}
                </KanbanColumn>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Job Creation/Edit Dialog */}
      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedJob ? "Edit Job" : "Create New Job"}</DialogTitle>
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
            <DialogTitle>{selectedOperation ? "Edit Operation" : "Create New Operation"}</DialogTitle>
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
    </DndProvider>
  );
}

export default KanbanBoard;
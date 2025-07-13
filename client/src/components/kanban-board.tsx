import { useState, useMemo } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoreHorizontal, Plus, Settings, Calendar, User, Building2, Wrench } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import JobForm from "@/components/job-form";
import OperationForm from "@/components/operation-form";
import KanbanConfigManager from "@/components/kanban-config-manager";
import type { Job, Operation, Resource, Capability } from "@shared/schema";

interface KanbanBoardProps {
  jobs: Job[];
  operations: Operation[];
  resources: Resource[];
  capabilities: Capability[];
  view: "jobs" | "operations";
  onViewChange: (view: "jobs" | "operations") => void;
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
}

const JobCard = ({ job, onEdit, swimLaneField }: { job: Job; onEdit: (job: Job) => void; swimLaneField: string }) => {
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
    item: { id: job.id, type: "job", sourceColumnId: getSourceColumnId() },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
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

const OperationCard = ({ operation, job, resources, onEdit, swimLaneField }: { 
  operation: Operation; 
  job?: Job; 
  resources: Resource[];
  onEdit: (operation: Operation) => void;
  swimLaneField: string;
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
    item: { id: operation.id, type: "operation", sourceColumnId: getSourceColumnId() },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
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

const KanbanColumn = ({ 
  column, 
  onDrop, 
  children 
}: { 
  column: KanbanColumn; 
  onDrop: (item: DragItem, targetStatus: string) => void;
  children: React.ReactNode;
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ["job", "operation"],
    drop: (item: DragItem) => onDrop(item, column.status),
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
      
      <div className="space-y-2">
        {children}
      </div>
      
      {column.items.length === 0 && (
        <div className="text-center text-gray-400 mt-8">
          <p className="text-sm">No items</p>
          {isOver && canDrop && (
            <p className="text-xs mt-2">Drop here to update status</p>
          )}
        </div>
      )}
    </div>
  );
};

export default function KanbanBoard({ 
  jobs, 
  operations, 
  resources, 
  capabilities, 
  view, 
  onViewChange 
}: KanbanBoardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [operationDialogOpen, setOperationDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | undefined>();
  const [selectedOperation, setSelectedOperation] = useState<Operation | undefined>();
  const [configManagerOpen, setConfigManagerOpen] = useState(false);
  const [swimLaneField, setSwimLaneField] = useState<string>("status");
  const [swimLaneColors, setSwimLaneColors] = useState<Record<string, string>>({});

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
      return ["planned", "in_progress", "completed", "cancelled"];
    } else if (field === "priority") {
      return ["low", "medium", "high"];
    } else if (field === "customer") {
      return [...new Set(jobs.map(job => job.customer))];
    } else if (field === "assignedResourceId") {
      return [...new Set(resources.map(r => r.name))];
    }
    return [];
  };

  const getDefaultColor = (field: string, value: string, index: number) => {
    const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-orange-500"];
    
    if (field === "status") {
      const statusColors: Record<string, string> = {
        planned: "bg-blue-500",
        in_progress: "bg-yellow-500",
        completed: "bg-green-500",
        cancelled: "bg-red-500"
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
    const fieldValues = getFieldValues(swimLaneField);
    const items = view === "jobs" ? jobs : operations;
    
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
      }
    });
    
    return Object.values(columnsMap);
  }, [jobs, operations, view, swimLaneField, swimLaneColors, resources]);

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

  const handleDrop = (item: DragItem, targetValue: string) => {
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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-medium text-gray-900">Kanban Board</h2>
            <Select value={view} onValueChange={(value) => onViewChange(value as "jobs" | "operations")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jobs">Jobs</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Group by:</span>
              <Select value={swimLaneField} onValueChange={setSwimLaneField}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  {view === "jobs" && <SelectItem value="customer">Customer</SelectItem>}
                  {view === "operations" && <SelectItem value="assignedResourceId">Resource</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={view === "jobs" ? handleAddJob : handleAddOperation}>
              <Plus className="w-4 h-4 mr-2" />
              Add {view === "jobs" ? "Job" : "Operation"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setConfigManagerOpen(true)}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Kanban Columns */}
        <div className="flex-1 overflow-x-auto bg-gray-100 p-4">
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
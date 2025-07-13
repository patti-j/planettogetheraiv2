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

const JobCard = ({ job, onEdit }: { job: Job; onEdit: (job: Job) => void }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "job",
    item: { id: job.id, type: "job", sourceColumnId: job.status },
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

const OperationCard = ({ operation, job, resources, onEdit }: { 
  operation: Operation; 
  job?: Job; 
  resources: Resource[];
  onEdit: (operation: Operation) => void;
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: "operation",
    item: { id: operation.id, type: "operation", sourceColumnId: operation.status },
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

  // Job status columns
  const jobColumns = useMemo(() => {
    const columns: KanbanColumn[] = [
      { id: "planned", title: "Planned", status: "planned", color: "bg-blue-500", items: [] },
      { id: "in_progress", title: "In Progress", status: "in_progress", color: "bg-yellow-500", items: [] },
      { id: "completed", title: "Completed", status: "completed", color: "bg-green-500", items: [] },
      { id: "cancelled", title: "Cancelled", status: "cancelled", color: "bg-red-500", items: [] },
    ];

    jobs.forEach(job => {
      const column = columns.find(col => col.status === job.status);
      if (column) {
        column.items.push(job);
      }
    });

    return columns;
  }, [jobs]);

  // Operation status columns
  const operationColumns = useMemo(() => {
    const columns: KanbanColumn[] = [
      { id: "planned", title: "Planned", status: "planned", color: "bg-blue-500", items: [] },
      { id: "in_progress", title: "In Progress", status: "in_progress", color: "bg-yellow-500", items: [] },
      { id: "completed", title: "Completed", status: "completed", color: "bg-green-500", items: [] },
      { id: "cancelled", title: "Cancelled", status: "cancelled", color: "bg-red-500", items: [] },
    ];

    operations.forEach(operation => {
      const column = columns.find(col => col.status === operation.status);
      if (column) {
        column.items.push(operation);
      }
    });

    return columns;
  }, [operations]);

  const columns = view === "jobs" ? jobColumns : operationColumns;

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

  const handleDrop = (item: DragItem, targetStatus: string) => {
    if (item.sourceColumnId === targetStatus) return;

    if (item.type === "job") {
      updateJobMutation.mutate({ id: item.id, status: targetStatus });
    } else if (item.type === "operation") {
      updateOperationMutation.mutate({ id: item.id, status: targetStatus });
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
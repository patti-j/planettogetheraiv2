import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, Wrench, AlertCircle, CheckCircle2, PlayCircle, PauseCircle, GripVertical, Save, RefreshCw, LayoutGrid, List } from "lucide-react";
import { format } from "date-fns";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { apiRequest } from "@/lib/queryClient";
import type { Job, Operation, Resource, Capability } from "@shared/schema";

interface MobileScheduleProps {
  jobs: Job[];
  operations: Operation[];
  resources: Resource[];
  capabilities: Capability[];
}

interface DraggableOperationCardProps {
  operation: Operation;
  index: number;
  job: Job | undefined;
  resource: Resource | undefined;
  requiredCapabilities: Capability[];
  statusInfo: { color: string; icon: any; label: string };
  getPriorityColor: (priority: string) => string;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  isCompact?: boolean;
}

const DraggableOperationCard = ({ 
  operation, 
  index, 
  job, 
  resource, 
  requiredCapabilities, 
  statusInfo, 
  getPriorityColor,
  onMove,
  isCompact = false
}: DraggableOperationCardProps) => {
  const StatusIcon = statusInfo.icon;

  const [{ isDragging }, drag, preview] = useDrag({
    type: "operation",
    item: { index, id: operation.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "operation",
    hover: (item: { index: number; id: number }) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
  });

  if (isCompact) {
    return (
      <div ref={(node) => drag(drop(node))} style={{ opacity: isDragging ? 0.5 : 1 }}>
        <Card className="border-l-4 cursor-move hover:bg-gray-50 transition-colors" style={{ borderLeftColor: statusInfo.color.replace('bg-', '#') }}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between min-w-0">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="cursor-grab active:cursor-grabbing p-1 -m-1 hover:bg-gray-100 rounded flex-shrink-0">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 min-w-0">
                    <h3 className="font-medium text-sm text-gray-900 truncate">{operation.name}</h3>
                    <Badge variant="outline" className="text-xs px-1 py-0 flex-shrink-0">{operation.status}</Badge>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1 min-w-0">
                    {job && (
                      <span className="truncate flex-shrink">{job.name}</span>
                    )}
                    <span className="flex items-center flex-shrink-0">
                      <Clock className="w-3 h-3 mr-1" />
                      {operation.duration}h
                    </span>
                    {resource && (
                      <span className="flex items-center truncate">
                        <Wrench className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{resource.name}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                <StatusIcon className="w-4 h-4" style={{ color: statusInfo.color.replace('bg-', '#') }} />
                {job && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-1 py-0 ${getPriorityColor(job.priority)}`}
                  >
                    {job.priority}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div ref={(node) => drag(drop(node))} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <Card className="border-l-4 cursor-move" style={{ borderLeftColor: statusInfo.color.replace('bg-', '#') }}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="mt-1">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-medium text-gray-900">
                  {operation.name}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {job?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`${statusInfo.color} text-white`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusInfo.label}
              </Badge>
              {job?.priority && (
                <Badge variant="outline" className={getPriorityColor(job.priority)}>
                  {job.priority}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Description */}
            {operation.description && (
              <p className="text-sm text-gray-600">
                {operation.description}
              </p>
            )}

            {/* Time and Duration */}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {operation.startTime && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {format(new Date(operation.startTime), "MMM d, h:mm a")}
                </div>
              )}
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {operation.duration}h
              </div>
            </div>

            {/* Resource and Capabilities */}
            <div className="space-y-2">
              {resource && (
                <div className="flex items-center text-sm text-gray-600">
                  <Wrench className="w-4 h-4 mr-2" />
                  <span>{resource.name}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {resource.type}
                  </Badge>
                </div>
              )}
              
              {requiredCapabilities.length > 0 && (
                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-4 h-4 mr-2" />
                  <div className="flex flex-wrap gap-1">
                    {requiredCapabilities.map(capability => (
                      <Badge key={capability.id} variant="secondary" className="text-xs">
                        {capability.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Customer */}
            {job?.customer && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Customer:</span> {job.customer}
              </div>
            )}

            {/* Due Date */}
            {job?.dueDate && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Due:</span> {format(new Date(job.dueDate), "MMM d, yyyy")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function MobileSchedule({ 
  jobs, 
  operations, 
  resources, 
  capabilities 
}: MobileScheduleProps) {
  const [selectedTab, setSelectedTab] = useState("today");
  const [selectedResource, setSelectedResource] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [orderedOperations, setOrderedOperations] = useState<Operation[]>([]);
  const [hasReorder, setHasReorder] = useState(false);
  const [isCompactView, setIsCompactView] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation for updating operation schedules
  const updateOperationMutation = useMutation({
    mutationFn: async (data: { id: number; startTime: string; endTime: string; order: number }) => {
      return apiRequest("PATCH", `/api/operations/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      toast({
        title: "Operations rescheduled",
        description: "The operation sequence has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reschedule operations. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Filter operations based on selected filters
  const filteredOperations = useMemo(() => {
    let filtered = orderedOperations.length > 0 ? orderedOperations : operations;

    // Filter by resource
    if (selectedResource !== "all") {
      filtered = filtered.filter(op => op.assignedResourceId === parseInt(selectedResource));
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(op => op.status === selectedStatus);
    }

    // Filter by time period
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    if (selectedTab === "today") {
      filtered = filtered.filter(op => {
        if (!op.startTime) return false;
        const startTime = new Date(op.startTime);
        return startTime >= today && startTime < tomorrow;
      });
    } else if (selectedTab === "week") {
      filtered = filtered.filter(op => {
        if (!op.startTime) return false;
        const startTime = new Date(op.startTime);
        return startTime >= today && startTime < weekFromNow;
      });
    }

    return filtered.sort((a, b) => {
      if (!a.startTime || !b.startTime) return 0;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }, [orderedOperations, operations, selectedResource, selectedStatus, selectedTab]);

  // Initialize ordered operations when operations change
  useEffect(() => {
    if (operations.length > 0) {
      setOrderedOperations(operations);
    }
  }, [operations]);

  // Handle drag and drop reordering
  const handleMoveOperation = useCallback((dragIndex: number, hoverIndex: number) => {
    const draggedOperation = filteredOperations[dragIndex];
    const newOperations = [...filteredOperations];
    
    // Remove the dragged operation from its current position
    newOperations.splice(dragIndex, 1);
    // Insert it at the new position
    newOperations.splice(hoverIndex, 0, draggedOperation);
    
    setOrderedOperations(newOperations);
    setHasReorder(true);
  }, [filteredOperations]);

  // Calculate new start times based on sequence
  const calculateNewSchedule = useCallback((operationsToSchedule: Operation[]) => {
    const now = new Date();
    let currentTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0); // Start at 8 AM
    
    return operationsToSchedule.map((operation, index) => {
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime);
      endTime.setHours(endTime.getHours() + operation.duration);
      
      // Move to next operation start time (add 1 hour buffer)
      currentTime = new Date(endTime);
      currentTime.setHours(currentTime.getHours() + 1);
      
      return {
        id: operation.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        order: index + 1
      };
    });
  }, []);

  // Handle drop completion - reschedule operations
  const handleReschedule = useCallback(() => {
    const newSchedule = calculateNewSchedule(filteredOperations);
    
    // Update multiple operations
    newSchedule.forEach(scheduleItem => {
      updateOperationMutation.mutate(scheduleItem);
    });
    
    setHasReorder(false);
  }, [filteredOperations, calculateNewSchedule, updateOperationMutation]);

  // Get operation details
  const getOperationDetails = (operation: Operation) => {
    const job = jobs.find(j => j.id === operation.jobId);
    const resource = resources.find(r => r.id === operation.assignedResourceId);
    const requiredCapabilities = capabilities.filter(c => 
      operation.requiredCapabilities.includes(c.id)
    );

    return { job, resource, requiredCapabilities };
  };

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "active":
        return { color: "bg-green-500", icon: PlayCircle, label: "Active" };
      case "pending":
        return { color: "bg-yellow-500", icon: PauseCircle, label: "Pending" };
      case "completed":
        return { color: "bg-blue-500", icon: CheckCircle2, label: "Completed" };
      default:
        return { color: "bg-gray-500", icon: AlertCircle, label: "Unknown" };
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-800">Op Sequencer</h1>
            <div className="flex items-center space-x-2">
              {/* View Toggle */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={isCompactView ? "ghost" : "default"}
                  size="sm"
                  onClick={() => setIsCompactView(false)}
                  className="h-7 px-2"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={isCompactView ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setIsCompactView(true)}
                  className="h-7 px-2"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              {hasReorder && (
                <Button
                  onClick={handleReschedule}
                  disabled={updateOperationMutation.isPending}
                  className="bg-primary hover:bg-blue-700 text-white"
                  size="sm"
                >
                  {updateOperationMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Reschedule
                </Button>
              )}
            </div>
          </div>
        
        {/* Filters */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Select value={selectedResource} onValueChange={setSelectedResource}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="All Resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {resources.map(resource => (
                  <SelectItem key={resource.id} value={resource.id.toString()}>
                    {resource.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Time Period Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4 flex-shrink-0">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="flex-1 overflow-y-auto min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="space-y-3 p-4 pb-8">
              {filteredOperations.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No operations found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredOperations.map((operation, index) => {
                  const { job, resource, requiredCapabilities } = getOperationDetails(operation);
                  const statusInfo = getStatusInfo(operation.status);

                  return (
                    <DraggableOperationCard
                      key={operation.id}
                      operation={operation}
                      index={index}
                      job={job}
                      resource={resource}
                      requiredCapabilities={requiredCapabilities}
                      statusInfo={statusInfo}
                      getPriorityColor={getPriorityColor}
                      onMove={handleMoveOperation}
                      isCompact={isCompactView}
                    />
                  );
                })
              )}
            </div>
        </TabsContent>
      </Tabs>
      </div>
    </DndProvider>
  );
}
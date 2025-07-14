import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Clock, Users, Settings, Wrench, Building2, Play, Pause, AlertTriangle, GripVertical, RotateCcw, PauseCircle, PlayCircle, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { Operation, Job, Resource } from "@shared/schema";

interface DraggableOperationCardProps {
  operation: Operation;
  job: Job | undefined;
  resource: Resource | undefined;
  index: number;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onStatusUpdate: (operationId: number, newStatus: string) => void;
  isUpdating: boolean;
}

const DraggableOperationCard = ({ 
  operation, 
  job, 
  resource, 
  index, 
  onMove, 
  onStatusUpdate,
  isUpdating 
}: DraggableOperationCardProps) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: "operation",
    item: { id: operation.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "operation",
    hover: (item: { id: number; index: number }) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
  });

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get resource icon
  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "machine":
        return <Wrench className="w-4 h-4" />;
      case "operator":
        return <Users className="w-4 h-4" />;
      case "facility":
        return <Building2 className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div
      ref={(node) => {
        drag(drop(node));
      }}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <Card className="border-l-4 touch-manipulation" style={{ borderLeftColor: getPriorityColor(job?.priority || "medium") }}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1 cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">{operation.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{job?.name}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {getResourceIcon(resource?.type || "")}
                  <span>{resource?.name}</span>
                </div>
              </div>
            </div>
            <Badge className={getStatusColor(operation.status)} variant="outline">
              {operation.status}
            </Badge>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-500">
              <span className="font-medium">Duration:</span> {operation.duration}h
            </div>
            <div className="text-sm text-gray-500">
              <span className="font-medium">Start:</span> {new Date(operation.startTime).toLocaleTimeString()}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            {operation.status === "Pending" && (
              <Button 
                size="sm" 
                onClick={() => onStatusUpdate(operation.id, "In-Progress")}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isUpdating}
              >
                <Play className="w-4 h-4 mr-1" />
                Start
              </Button>
            )}
            
            {operation.status === "In-Progress" && (
              <>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onStatusUpdate(operation.id, "Pending")}
                  className="flex-1"
                  disabled={isUpdating}
                >
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => onStatusUpdate(operation.id, "Completed")}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isUpdating}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Complete
                </Button>
              </>
            )}

            {operation.status === "Completed" && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onStatusUpdate(operation.id, "In-Progress")}
                className="flex-1"
                disabled={isUpdating}
              >
                Reopen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function ShopFloor() {
  const [selectedResource, setSelectedResource] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("today");
  const [localOperations, setLocalOperations] = useState<Operation[]>([]);
  const [hasReorder, setHasReorder] = useState(false);
  const [isLivePaused, setIsLivePaused] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [customMetrics, setCustomMetrics] = useState<any[]>([]);
  const queryClient = useQueryClient();

  // Fetch data
  const { data: operations = [], isLoading: operationsLoading } = useQuery<Operation[]>({
    queryKey: ["/api/operations"],
    refetchInterval: isLivePaused ? false : 30000, // Refresh every 30 seconds when not paused
  });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    refetchInterval: isLivePaused ? false : 30000, // Refresh every 30 seconds when not paused
  });

  const { data: resources = [], isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
    refetchInterval: isLivePaused ? false : 30000, // Refresh every 30 seconds when not paused
  });

  const { data: metrics } = useQuery({
    queryKey: ["/api/metrics"],
    refetchInterval: isLivePaused ? false : 30000, // Refresh every 30 seconds when not paused
  });

  // Update operation status mutation
  const updateOperationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/operations/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: "Operation Updated",
        description: "Operation status has been updated successfully.",
      });
    },
  });

  // Reschedule operations mutation
  const rescheduleOperationsMutation = useMutation({
    mutationFn: async (operationsData: { id: number; startTime: string; endTime: string }[]) => {
      const promises = operationsData.map(op => 
        apiRequest("PATCH", `/api/operations/${op.id}`, { 
          startTime: op.startTime,
          endTime: op.endTime
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      setHasReorder(false);
      toast({
        title: "Schedule Updated",
        description: "Operations have been rescheduled successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reschedule operations. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Sync local operations with server data (only when not paused and no reorder)
  useEffect(() => {
    if (!isLivePaused && !hasReorder && operations.length > 0) {
      setLocalOperations(prev => {
        // Only update if operations actually changed
        if (JSON.stringify(prev) !== JSON.stringify(operations)) {
          return operations;
        }
        return prev;
      });
    }
  }, [operations, isLivePaused, hasReorder]);

  // Prevent dropdown resets during live updates by not resetting state

  // Handle drag and drop reordering
  const handleMoveOperation = (dragIndex: number, hoverIndex: number) => {
    const filteredOps = filteredOperations;
    const newOperations = [...localOperations];
    
    // Find the actual indices in the full operations array
    const dragOp = filteredOps[dragIndex];
    const hoverOp = filteredOps[hoverIndex];
    
    const dragOpIndex = newOperations.findIndex(op => op.id === dragOp.id);
    const hoverOpIndex = newOperations.findIndex(op => op.id === hoverOp.id);
    
    // Swap the operations
    [newOperations[dragOpIndex], newOperations[hoverOpIndex]] = [newOperations[hoverOpIndex], newOperations[dragOpIndex]];
    
    setLocalOperations(newOperations);
    setHasReorder(true);
  };

  // Handle reschedule operations
  const handleReschedule = () => {
    const operationsToUpdate = localOperations.map((op, index) => {
      // Calculate new start time based on position and duration
      const baseTime = new Date();
      baseTime.setHours(8, 0, 0, 0); // Start at 8 AM
      const startTime = new Date(baseTime.getTime() + (index * 2 * 60 * 60 * 1000)); // 2 hours apart
      const endTime = new Date(startTime.getTime() + (op.duration * 60 * 60 * 1000));
      
      return {
        id: op.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      };
    });
    
    rescheduleOperationsMutation.mutate(operationsToUpdate);
  };

  // AI metrics configuration mutation
  const aiMetricsMutation = useMutation({
    mutationFn: async (prompt: string) => {
      return apiRequest("POST", "/api/ai/command", { 
        command: `CREATE_CUSTOM_METRICS: ${prompt}` 
      });
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setCustomMetrics(data.data);
        toast({
          title: "Metrics Updated",
          description: "Custom metrics have been created successfully.",
        });
      }
      setAiDialogOpen(false);
      setAiPrompt("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create custom metrics. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle AI metrics creation
  const handleAiMetrics = () => {
    if (!aiPrompt.trim()) return;
    aiMetricsMutation.mutate(aiPrompt);
  };

  // Filter operations based on selected resource and time
  const filteredOperations = localOperations.filter(op => {
    if (selectedResource !== "all" && op.resourceId !== parseInt(selectedResource)) {
      return false;
    }
    
    if (timeFilter === "today") {
      const today = new Date();
      const opDate = new Date(op.startTime);
      return opDate.toDateString() === today.toDateString();
    } else if (timeFilter === "thisWeek") {
      const today = new Date();
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
      const opDate = new Date(op.startTime);
      return opDate >= weekStart;
    }
    
    return true;
  });

  // Get resource icon
  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "machine":
        return <Wrench className="w-4 h-4" />;
      case "operator":
        return <Users className="w-4 h-4" />;
      case "facility":
        return <Building2 className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  // Quick action to update operation status
  const handleStatusUpdate = (operationId: number, newStatus: string) => {
    updateOperationMutation.mutate({ id: operationId, status: newStatus });
  };

  const getJob = (jobId: number) => jobs.find(j => j.id === jobId);
  const getResource = (resourceId: number) => resources.find(r => r.id === resourceId);

  if (operationsLoading || jobsLoading || resourcesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shop floor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3 sm:px-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="ml-12 md:ml-0">
            <h1 className="text-lg font-semibold text-gray-900">Shop Floor</h1>
            <p className="text-sm text-gray-600">Real-time production monitoring</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLivePaused(!isLivePaused)}
                className="flex items-center gap-2 hover:bg-gray-100"
              >
                {isLivePaused ? (
                  <>
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-600 font-medium">Paused</span>
                    <PlayCircle className="w-4 h-4 text-gray-600" />
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">Live</span>
                    <PauseCircle className="w-4 h-4 text-green-600" />
                  </>
                )}
              </Button>
            </div>
            
            {/* AI Metrics Configuration */}
            <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Metrics
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Configure Metrics with AI</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Describe the metrics you want to see on the shop floor:
                    </label>
                    <Textarea
                      placeholder="e.g., Show efficiency metrics, completion rates by resource type, or queue depths by priority..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setAiDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAiMetrics}
                      disabled={!aiPrompt.trim() || aiMetricsMutation.isPending}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      {aiMetricsMutation.isPending ? "Creating..." : "Create Metrics"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.activeJobs || 0}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Utilization</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.utilization || 0}%</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{metrics?.overdueOperations || 0}</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{metrics?.completedOperations || 0}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Custom AI Metrics */}
        {customMetrics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {customMetrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                      <p className="text-2xl font-bold text-blue-600">{metric.value}</p>
                      {metric.subtitle && (
                        <p className="text-xs text-gray-500">{metric.subtitle}</p>
                      )}
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedResource} onValueChange={setSelectedResource}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Resource" />
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
        </div>

        {/* Reschedule Button */}
        {hasReorder && (
          <div className="mb-4">
            <Button 
              onClick={handleReschedule}
              disabled={rescheduleOperationsMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {rescheduleOperationsMutation.isPending ? "Rescheduling..." : "Reschedule Operations"}
            </Button>
          </div>
        )}

        {/* Operations List */}
        <DndProvider backend={HTML5Backend}>
          <div className="space-y-3">
            {filteredOperations.map((operation, index) => {
              const job = getJob(operation.jobId);
              const resource = getResource(operation.resourceId);
              
              return (
                <DraggableOperationCard
                  key={operation.id}
                  operation={operation}
                  job={job}
                  resource={resource}
                  index={index}
                  onMove={handleMoveOperation}
                  onStatusUpdate={handleStatusUpdate}
                  isUpdating={updateOperationMutation.isPending}
                />
              );
            })}
          </div>
        </DndProvider>

        {filteredOperations.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Operations Found</h3>
              <p className="text-gray-600">No operations match your current filters. Try adjusting the time period or resource selection.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
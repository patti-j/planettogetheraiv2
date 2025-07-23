import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Settings, 
  User, 
  Package, 
  Wrench, 
  BarChart3,
  RefreshCw,
  MessageSquare,
  Flag,
  Calendar,
  Timer,
  ArrowRight,
  Bell,
  AlertCircle,
  Info,
  ChevronRight,
  ChevronDown,
  Activity,
  Target,
  Zap,
  TrendingUp,
  FileText,
  Camera,
  Upload,
  Send,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Job, Operation, Resource } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OperatorOperation extends Operation {
  jobName: string;
  customer: string;
  priority: string;
  dueDate: string;
  resourceName: string;
  resourceType: string;
  estimatedDuration: number;
  actualDuration?: number;
  qualityChecks: {
    id: string;
    name: string;
    status: "pending" | "passed" | "failed";
    notes?: string;
  }[];
  materials: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    available: boolean;
  }[];
  tools: {
    id: string;
    name: string;
    available: boolean;
    condition: "good" | "fair" | "needs_maintenance";
  }[];
}

interface StatusReport {
  id: string;
  operationId: number;
  type: "progress" | "issue" | "completion" | "quality";
  status: "in_progress" | "completed" | "blocked" | "issue";
  description: string;
  timestamp: string;
  operator: string;
  images?: string[];
  nextSteps?: string;
}

export default function OperatorDashboard() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedResource, setSelectedResource] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("upcoming");
  const [selectedOperation, setSelectedOperation] = useState<OperatorOperation | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState<string>("progress");
  const [reportDescription, setReportDescription] = useState("");
  const [expandedOperation, setExpandedOperation] = useState<number | null>(null);
  const [currentOperator] = useState("John Smith"); // In real app, this would come from auth
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch production data
  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ["/api/operations"],
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
    }, 30000);

    return () => clearInterval(interval);
  }, [queryClient]);

  // Transform operations for operator view
  const operatorOperations: OperatorOperation[] = operations.map(op => {
    const job = jobs.find(j => j.id === op.jobId);
    const resource = resources.find(r => r.id === op.resourceId);
    
    return {
      ...op,
      jobName: job?.name || "Unknown Job",
      customer: job?.customer || "Unknown Customer",
      priority: job?.priority || "medium",
      dueDate: job?.dueDate || "",
      resourceName: resource?.name || "Unknown Resource",
      resourceType: resource?.type || "Unknown",
      estimatedDuration: 4, // Mock duration in hours
      qualityChecks: [
        { id: "1", name: "Dimensional Check", status: "pending" },
        { id: "2", name: "Surface Finish", status: "pending" },
        { id: "3", name: "Material Verification", status: "pending" }
      ],
      materials: [
        { id: "1", name: "Steel Rod 10mm", quantity: 50, unit: "pcs", available: true },
        { id: "2", name: "Cutting Fluid", quantity: 2, unit: "L", available: true }
      ],
      tools: [
        { id: "1", name: "End Mill 6mm", available: true, condition: "good" },
        { id: "2", name: "Drill Bit Set", available: true, condition: "fair" }
      ]
    };
  });

  // Filter operations based on selected resource and status
  const filteredOperations = operatorOperations.filter(op => {
    const matchesResource = selectedResource === "all" || op.resourceId?.toString() === selectedResource;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "upcoming" && op.status === "pending") ||
      (statusFilter === "in_progress" && op.status === "in_progress") ||
      (statusFilter === "completed" && op.status === "completed");
    
    return matchesResource && matchesStatus;
  });

  // Sort operations by priority and due date
  const sortedOperations = filteredOperations.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 2;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 2;
    
    if (aPriority !== bPriority) return aPriority - bPriority;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // Update operation status mutation
  const updateOperationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/operations/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Operation status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update operation status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit status report mutation
  const submitReportMutation = useMutation({
    mutationFn: async (report: Omit<StatusReport, "id" | "timestamp">) => {
      // In real app, this would submit to an API endpoint
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "Your status report has been submitted successfully.",
      });
      setReportDialogOpen(false);
      setReportDescription("");
      setSelectedOperation(null);
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "blocked": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  // Handle operation start
  const handleStartOperation = (operation: OperatorOperation) => {
    updateOperationMutation.mutate({ id: operation.id, status: "in_progress" });
  };

  // Handle operation completion
  const handleCompleteOperation = (operation: OperatorOperation) => {
    updateOperationMutation.mutate({ id: operation.id, status: "completed" });
  };

  // Handle status report submission
  const handleSubmitReport = () => {
    if (!selectedOperation || !reportDescription.trim()) return;
    
    submitReportMutation.mutate({
      operationId: selectedOperation.id,
      type: reportType as any,
      status: reportType === "completion" ? "completed" : 
             reportType === "issue" ? "blocked" : "in_progress",
      description: reportDescription,
      operator: currentOperator
    });
  };

  // Get operation counts based on current resource selection
  const resourceFilteredOperations = operatorOperations.filter(op => 
    selectedResource === "all" || op.resourceId?.toString() === selectedResource
  );
  
  const upcomingCount = resourceFilteredOperations.filter(op => op.status === "pending").length;
  const inProgressCount = resourceFilteredOperations.filter(op => op.status === "in_progress").length;
  const completedTodayCount = resourceFilteredOperations.filter(op => op.status === "completed").length;

  return (
    <div className={`bg-gray-50 ${isMaximized ? 'fixed inset-0 z-50' : 'h-screen'} flex flex-col`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-3 sm:p-6 flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="md:ml-0 ml-12">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800">Operator Dashboard</h1>
            <p className="text-sm md:text-base text-gray-600">Review upcoming operations and report status</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{currentOperator}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMaximized(!isMaximized)}
              className="flex items-center gap-2"
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              {isMaximized ? "Minimize" : "Maximize"}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white border-b px-4 py-3 sm:px-6 flex-shrink-0">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{upcomingCount}</div>
            <div className="text-sm text-gray-500">Upcoming</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{inProgressCount}</div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedTodayCount}</div>
            <div className="text-sm text-gray-500">Completed Today</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b px-4 py-3 sm:px-6 flex-shrink-0">
        <div className="flex flex-wrap gap-4">
          <Select value={selectedResource} onValueChange={setSelectedResource}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              {resources.map((resource) => (
                <SelectItem key={resource.id} value={resource.id.toString()}>
                  {resource.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Operations</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Operations List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="space-y-4">
          {sortedOperations.map((operation) => (
            <Card key={operation.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(operation.priority)}`}></div>
                      <h3 className="font-semibold text-lg">{operation.name}</h3>
                      <Badge className={getStatusColor(operation.status)}>
                        {operation.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-1">{operation.jobName}</p>
                    <p className="text-sm text-gray-500">Customer: {operation.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="font-medium">{new Date(operation.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Resource and Duration Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Resource</p>
                    <p className="font-medium">{operation.resourceName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium">{operation.resourceType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Est. Duration</p>
                    <p className="font-medium">{operation.estimatedDuration}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Progress</p>
                    <div className="flex items-center gap-2">
                      <Progress value={operation.status === "completed" ? 100 : operation.status === "in_progress" ? 50 : 0} className="flex-1" />
                      <span className="text-sm">
                        {operation.status === "completed" ? "100%" : operation.status === "in_progress" ? "50%" : "0%"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expandable Details */}
                <div className="mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedOperation(expandedOperation === operation.id ? null : operation.id)}
                    className="p-0 h-auto text-blue-600 hover:text-blue-800"
                  >
                    {expandedOperation === operation.id ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                    {expandedOperation === operation.id ? "Hide Details" : "Show Details"}
                  </Button>
                </div>

                {expandedOperation === operation.id && (
                  <div className="space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    {/* Materials */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Materials Required
                      </h4>
                      <div className="space-y-2">
                        {operation.materials.map((material) => (
                          <div key={material.id} className="flex items-center justify-between bg-white p-2 rounded">
                            <span>{material.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">{material.quantity} {material.unit}</span>
                              <Badge variant={material.available ? "default" : "destructive"}>
                                {material.available ? "Available" : "Out of Stock"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tools */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        Tools Required
                      </h4>
                      <div className="space-y-2">
                        {operation.tools.map((tool) => (
                          <div key={tool.id} className="flex items-center justify-between bg-white p-2 rounded">
                            <span>{tool.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={tool.available ? "default" : "destructive"}>
                                {tool.available ? "Available" : "In Use"}
                              </Badge>
                              <Badge variant={tool.condition === "good" ? "default" : tool.condition === "fair" ? "secondary" : "destructive"}>
                                {tool.condition.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quality Checks */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Quality Checks
                      </h4>
                      <div className="space-y-2">
                        {operation.qualityChecks.map((check) => (
                          <div key={check.id} className="flex items-center justify-between bg-white p-2 rounded">
                            <span>{check.name}</span>
                            <Badge className={getStatusColor(check.status)}>
                              {check.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {operation.status === "pending" && (
                    <Button
                      onClick={() => handleStartOperation(operation)}
                      disabled={updateOperationMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Start Operation
                    </Button>
                  )}
                  
                  {operation.status === "in_progress" && (
                    <>
                      <Button
                        onClick={() => handleCompleteOperation(operation)}
                        disabled={updateOperationMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Complete
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedOperation(operation);
                          setReportType("progress");
                          setReportDialogOpen(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Report Progress
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedOperation(operation);
                      setReportType("issue");
                      setReportDialogOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Report Issue
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedOperation(operation);
                      setReportType("quality");
                      setReportDialogOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Flag className="w-4 h-4" />
                    Quality Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sortedOperations.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Operations Found</h3>
            <p className="text-gray-500">No operations match your current filters.</p>
          </div>
        )}
      </div>

      {/* Status Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit Status Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOperation && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{selectedOperation.name}</p>
                <p className="text-sm text-gray-600">{selectedOperation.jobName}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Report Type
              </label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="progress">Progress Update</SelectItem>
                  <SelectItem value="issue">Issue Report</SelectItem>
                  <SelectItem value="quality">Quality Concern</SelectItem>
                  <SelectItem value="completion">Completion Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Description
              </label>
              <Textarea
                placeholder="Describe the current status, issue, or observation..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setReportDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReport}
                disabled={!reportDescription.trim() || submitReportMutation.isPending}
              >
                {submitReportMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
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
  Send
} from "lucide-react";
import { Job, Operation, Resource } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMaxDock } from "@/contexts/MaxDockContext";

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
  type: "progress" | "issue" | "completion" | "quality" | "production";
  status: "in_progress" | "completed" | "blocked" | "issue";
  description: string;
  timestamp: string;
  operator: string;
  images?: string[];
  nextSteps?: string;
  // Production status fields
  quantityProduced?: number;
  quantityComplete?: number;
  quantityScrap?: number;
  timeSpent?: number; // in minutes
  targetQuantity?: number;
}

export default function OperatorDashboard() {

  const [selectedResource, setSelectedResource] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("upcoming");
  const [selectedOperation, setSelectedOperation] = useState<OperatorOperation | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState<string>("progress");
  const [reportDescription, setReportDescription] = useState("");
  
  // Production reporting states
  const [quantityProduced, setQuantityProduced] = useState<number>(0);
  const [quantityComplete, setQuantityComplete] = useState<number>(0);
  const [quantityScrap, setQuantityScrap] = useState<number>(0);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [expandedOperation, setExpandedOperation] = useState<number | null>(null);
  const [currentOperator, setCurrentOperator] = useState("John Smith");
  const [operatorSwitchDialogOpen, setOperatorSwitchDialogOpen] = useState(false);
  
  // Operation control states
  const [operationControlDialogOpen, setOperationControlDialogOpen] = useState(false);
  const [controlAction, setControlAction] = useState<"start" | "pause" | "finish" | "hold">("start");
  const [controlNotes, setControlNotes] = useState("");
  const [controllingOperation, setControllingOperation] = useState<OperatorOperation | null>(null);
  
  // Time tracking states
  const [timeTrackingDialogOpen, setTimeTrackingDialogOpen] = useState(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<number[]>([]);
  const [clockingMode, setClockingMode] = useState<"individual" | "team">("individual");
  const [productionReportDialogOpen, setProductionReportDialogOpen] = useState(false);
  const [teamName, setTeamName] = useState<string>("");

  // Equipment problem reporting states
  const [equipmentProblemDialogOpen, setEquipmentProblemDialogOpen] = useState(false);
  const [equipmentProblem, setEquipmentProblem] = useState({
    resourceId: null as number | null,
    downtimeType: "mechanical",
    severity: "medium",
    title: "",
    description: "",
    priority: "medium",
    estimatedDowntime: "",
    impactedOperations: "",
    partsRequired: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isMaxOpen } = useMaxDock();

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

  // Get current user for time tracking
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  // Get active time entries
  const { data: activeTimeEntry } = useQuery({
    queryKey: ['/api/time-tracking/active', currentUser?.id],
    enabled: !!currentUser?.id,
  });

  // Get all users for team selection
  const { data: allUsers = [] } = useQuery({
    queryKey: ['/api/users-with-roles'],
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
    // Match job by jobId (operation.jobId should match job.jobId or job.id)
    const job = jobs.find(j => j.id === op.jobId || j.jobId === op.jobId);
    // Match resource by assignedResourceId or workCenterId
    const resource = resources.find(r => r.id === op.assignedResourceId || r.id === op.workCenterId);
    
    // Extract meaningful data from PT Publish tables
    const jobName = job?.externalId || job?.description || job?.name || op.name || "Unknown Job";
    const customer = job?.customers || "Manufacturing Order";
    const priority = job?.priority ? 
      (job.priority <= 2 ? "urgent" : 
       job.priority <= 4 ? "high" : 
       job.priority <= 6 ? "medium" : "low") : "medium";
    const dueDate = job?.needDateTime || job?.scheduledEndDateTime || op.endTime || "";
    const resourceName = resource?.name || "Unassigned Resource";
    const resourceType = resource?.type || "equipment";
    
    // Calculate estimated duration from operation data
    const estimatedDuration = op.duration || 
      (op.endTime && op.startTime ? 
        Math.round((new Date(op.endTime).getTime() - new Date(op.startTime).getTime()) / (1000 * 60 * 60)) : 
        4);
    
    return {
      ...op,
      jobName,
      customer,
      priority,
      dueDate,
      resourceName,
      resourceType,
      estimatedDuration,
      qualityChecks: op.name?.toLowerCase().includes('mill') || op.description?.toLowerCase().includes('mill') ? [
        { id: "1", name: "Grain Size Check", status: "pending" },
        { id: "2", name: "Moisture Content", status: "pending" },
        { id: "3", name: "Temperature Verification", status: "pending" }
      ] : op.name?.toLowerCase().includes('ferment') || op.description?.toLowerCase().includes('ferment') ? [
        { id: "1", name: "pH Level Check", status: "pending" },
        { id: "2", name: "Yeast Viability", status: "pending" },
        { id: "3", name: "Sugar Content (Brix)", status: "pending" }
      ] : op.name?.toLowerCase().includes('boil') || op.description?.toLowerCase().includes('boil') ? [
        { id: "1", name: "Temperature Control", status: "pending" },
        { id: "2", name: "Hop Addition Timing", status: "pending" },
        { id: "3", name: "Specific Gravity", status: "pending" }
      ] : [
        { id: "1", name: "Process Parameters", status: "pending" },
        { id: "2", name: "Quality Standards", status: "pending" },
        { id: "3", name: "Safety Check", status: "pending" }
      ],
      materials: op.name?.toLowerCase().includes('mill') || op.description?.toLowerCase().includes('mill') ? [
        { id: "1", name: "Malted Barley", quantity: job?.qty || 5804, unit: "kg", available: true },
        { id: "2", name: "Water", quantity: 2000, unit: "L", available: true }
      ] : op.name?.toLowerCase().includes('ferment') || op.description?.toLowerCase().includes('ferment') ? [
        { id: "1", name: "Yeast Culture", quantity: 50, unit: "kg", available: true },
        { id: "2", name: "Nutrient Solution", quantity: 25, unit: "L", available: true }
      ] : op.name?.toLowerCase().includes('boil') || op.description?.toLowerCase().includes('boil') ? [
        { id: "1", name: "Hops - Cascade", quantity: 15, unit: "kg", available: true },
        { id: "2", name: "Irish Moss", quantity: 2, unit: "kg", available: true }
      ] : [
        { id: "1", name: "Process Materials", quantity: 100, unit: "units", available: true },
        { id: "2", name: "Cleaning Solution", quantity: 50, unit: "L", available: true }
      ],
      tools: resourceType === "machine" ? [
        { id: "1", name: resource?.name || "Primary Equipment", available: true, condition: "good" },
        { id: "2", name: "Temperature Sensor", available: true, condition: "good" },
        { id: "3", name: "Control Panel", available: true, condition: "good" }
      ] : [
        { id: "1", name: "Process Tools", available: true, condition: "good" },
        { id: "2", name: "Measurement Equipment", available: true, condition: "fair" }
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

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: async ({ operationId, teamMembers }: { operationId: number; teamMembers?: number[] }) => {
      if (clockingMode === "team" && teamMembers && teamMembers.length > 0) {
        const response = await apiRequest("POST", "/api/time-tracking/team-clock-in", {
          operationId,
          teamMembers,
          teamName: teamName || `Team for Operation ${operationId}`,
          location: "Production Floor"
        });
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/time-tracking/clock-in", {
          operationId,
          location: "Production Floor"
        });
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Clocked In Successfully",
        description: clockingMode === "team" ? "Team has been clocked into the operation" : "You have been clocked into the operation",
      });
      setTimeTrackingDialogOpen(false);
      setSelectedTeamMembers([]);
      setTeamName("");
      queryClient.invalidateQueries({ queryKey: ['/api/time-tracking/active'] });
    },
    onError: () => {
      toast({
        title: "Clock In Failed", 
        description: "Failed to clock in. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Equipment problem report mutation
  const submitEquipmentProblemMutation = useMutation({
    mutationFn: async (problemData: typeof equipmentProblem) => {
      const response = await apiRequest("POST", "/api/unplanned-downtime", {
        resourceId: problemData.resourceId,
        downtimeType: problemData.downtimeType,
        severity: problemData.severity,
        title: problemData.title,
        description: problemData.description,
        priority: problemData.priority,
        estimatedDowntime: problemData.estimatedDowntime ? parseInt(problemData.estimatedDowntime) : null,
        impactedOperations: problemData.impactedOperations,
        partsRequired: problemData.partsRequired,
        reportedBy: currentUser?.id,
        startTime: new Date().toISOString(),
        plantId: 1 // Assume main plant for now
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Equipment Problem Reported",
        description: "Your equipment problem report has been submitted successfully.",
      });
      setEquipmentProblemDialogOpen(false);
      setEquipmentProblem({
        resourceId: null,
        downtimeType: "mechanical",
        severity: "medium",
        title: "",
        description: "",
        priority: "medium",
        estimatedDowntime: "",
        impactedOperations: "",
        partsRequired: ""
      });
    },
    onError: () => {
      toast({
        title: "Report Failed",
        description: "Failed to submit equipment problem report. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Operation control mutation
  const operationControlMutation = useMutation({
    mutationFn: async ({ operationId, action, notes }: { operationId: number; action: string; notes?: string }) => {
      console.log("Operation control request:", { operationId, action, notes, operatorId: currentUser?.id, operatorName: currentUser?.username || currentOperator });
      
      const requestData = {
        action,
        notes,
        timestamp: new Date().toISOString(),
        operatorId: currentUser?.id || 4, // Fallback for demo
        operatorName: currentUser?.username || currentOperator
      };
      
      const response = await apiRequest("POST", `/api/operations/${operationId}/control`, requestData);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Operation control error:", response.status, errorText);
        throw new Error(`Request failed: ${response.status} ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      console.log("Operation control success:", data);
      
      const actionMessages = {
        start: "Operation started successfully",
        pause: "Operation paused",
        finish: "Operation completed",
        hold: "Operation put on hold"
      };
      
      toast({
        title: "Operation Updated",
        description: actionMessages[variables.action as keyof typeof actionMessages] || "Operation status updated",
      });
      
      setOperationControlDialogOpen(false);
      setControlNotes("");
      setControllingOperation(null);
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
    },
    onError: (error: any) => {
      console.error("Operation control mutation error:", error);
      toast({
        title: "Action Failed",
        description: `Failed to update operation: ${error.message || "Please try again."}`,
        variant: "destructive",
      });
    },
  });

  // Production report mutation
  const submitProductionReportMutation = useMutation({
    mutationFn: async (productionData: {
      operationId: number;
      quantityProduced: number;
      quantityComplete: number;
      quantityScrap: number;
      timeSpent: number;
      notes?: string;
    }) => {
      const response = await apiRequest("POST", "/api/production-reports", productionData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Production Report Submitted",
        description: "Production data has been recorded successfully.",
      });
      setProductionReportDialogOpen(false);
      setQuantityProduced(0);
      setQuantityComplete(0);
      setQuantityScrap(0);
      setTimeSpent(0);
      setReportDescription("");
      setSelectedOperation(null);
    },
    onError: () => {
      toast({
        title: "Report Failed",
        description: "Failed to submit production report. Please try again.",
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

  // Handle operation control actions
  const handleOperationControl = (operation: OperatorOperation, action: "start" | "pause" | "finish" | "hold") => {
    setControllingOperation(operation);
    setControlAction(action);
    setOperationControlDialogOpen(true);
  };

  // Submit operation control action
  const handleSubmitOperationControl = () => {
    if (!controllingOperation) return;
    
    operationControlMutation.mutate({
      operationId: controllingOperation.id,
      action: controlAction,
      notes: controlNotes
    });
  };

  // Get available actions for operation based on status
  const getAvailableActions = (status: string) => {
    switch (status) {
      case "pending":
        return ["start"];
      case "in_progress":
        return ["pause", "finish", "hold"];
      case "paused":
        return ["start", "finish", "hold"];
      case "on_hold":
        return ["start"];
      case "completed":
        return [];
      default:
        return ["start"];
    }
  };

  // Get operation timing display
  const getOperationTiming = (operation: OperatorOperation) => {
    const now = new Date();
    const startTime = operation.startTime ? new Date(operation.startTime) : null;
    const endTime = operation.endTime ? new Date(operation.endTime) : null;
    
    if (operation.status === "completed" && startTime && endTime) {
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      return {
        started: startTime.toLocaleTimeString(),
        finished: endTime.toLocaleTimeString(),
        duration: `${duration} min`
      };
    } else if (operation.status === "in_progress" && startTime) {
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      return {
        started: startTime.toLocaleTimeString(),
        elapsed: `${elapsed} min`
      };
    } else if (operation.status === "paused" && startTime) {
      return {
        started: startTime.toLocaleTimeString(),
        status: "Paused"
      };
    }
    return {};
  };

  // Handle operation start (legacy - kept for compatibility)
  const handleStartOperation = (operation: OperatorOperation) => {
    handleOperationControl(operation, "start");
  };

  // Handle operation completion (legacy - kept for compatibility) 
  const handleCompleteOperation = (operation: OperatorOperation) => {
    handleOperationControl(operation, "finish");
  };

  // Handle status report submission
  const handleSubmitReport = () => {
    if (!selectedOperation || !reportDescription.trim()) return;
  };

  // Handle clock in
  const handleClockIn = (operation: OperatorOperation) => {
    setSelectedOperation(operation);
    setTimeTrackingDialogOpen(true);
  };

  // Handle production report
  const handleProductionReport = (operation: OperatorOperation) => {
    setSelectedOperation(operation);
    setProductionReportDialogOpen(true);
  };

  // Submit production report
  const handleSubmitProductionReport = () => {
    if (!selectedOperation) return;
    
    submitProductionReportMutation.mutate({
      operationId: selectedOperation.id,
      quantityProduced,
      quantityComplete,
      quantityScrap,
      timeSpent,
      notes: reportDescription
    });
  };

  // Submit clock in
  const handleSubmitClockIn = () => {
    if (!selectedOperation) return;
    
    clockInMutation.mutate({
      operationId: selectedOperation.id,
      teamMembers: clockingMode === "team" ? selectedTeamMembers : undefined
    });
    
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
    <div className="bg-gray-50 h-screen flex flex-col">
      {/* Header - Much more compact on mobile */}
      <div className="bg-white shadow-sm border-b p-1 sm:p-3 md:p-6 flex-shrink-0">
        <div className="relative">
          <div className={`${isMaxOpen ? 'md:ml-0' : 'md:ml-12'} ml-12`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base sm:text-lg md:text-2xl font-semibold text-gray-800 flex items-center">
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Operator Dashboard</span>
                  <span className="sm:hidden">Operator</span>
                </h1>
                <p className="text-xs text-gray-600 hidden md:block">Review upcoming operations and report status</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Equipment Problem Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEquipmentProblemDialogOpen(true)}
                  className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span className="hidden sm:inline">Report Equipment Problem</span>
                  <span className="sm:hidden">Report Problem</span>
                </Button>
                {/* Operator info - very compact on mobile with switch button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOperatorSwitchDialogOpen(true)}
                  className="flex items-center gap-1 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                >
                  <User className="w-3 h-3" />
                  <span className="hidden sm:inline">{currentOperator}</span>
                  <span className="sm:hidden">{currentOperator.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats - Much more compact on mobile */}
      <div className="bg-white border-b px-2 py-1 sm:px-4 sm:py-2 md:px-6 md:py-3 flex-shrink-0">
        <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-4">
          <div className="text-center">
            <div className="text-sm sm:text-lg md:text-2xl font-bold text-blue-600">{upcomingCount}</div>
            <div className="text-xs text-gray-500">Upcoming</div>
          </div>
          <div className="text-center">
            <div className="text-sm sm:text-lg md:text-2xl font-bold text-orange-600">{inProgressCount}</div>
            <div className="text-xs text-gray-500">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-sm sm:text-lg md:text-2xl font-bold text-green-600">{completedTodayCount}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
        </div>
      </div>

      {/* Filters - Much more compact on mobile */}
      <div className="bg-white border-b px-2 py-1 sm:px-4 sm:py-2 md:px-6 md:py-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 md:gap-4">
          <Select value={selectedResource} onValueChange={setSelectedResource}>
            <SelectTrigger className="w-full sm:w-40 md:w-48 h-8 sm:h-9 md:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Resource" />
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
            <SelectTrigger className="w-full sm:w-40 md:w-48 h-8 sm:h-9 md:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Status" />
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
                      <Badge className={getStatusColor(operation.status || "pending")}>
                        {(operation.status || "pending").replace("_", " ")}
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
                      <Progress value={(operation.status || "pending") === "completed" ? 100 : (operation.status || "pending") === "in_progress" ? 50 : 0} className="flex-1" />
                      <span className="text-sm">
                        {(operation.status || "pending") === "completed" ? "100%" : (operation.status || "pending") === "in_progress" ? "50%" : "0%"}
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

                {/* Operation Timing Information */}
                {(() => {
                  const timing = getOperationTiming(operation);
                  return Object.keys(timing).length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Timer className="w-4 h-4 text-blue-600" />
                        <h4 className="font-medium text-blue-900">Operation Timing</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        {timing.started && (
                          <div>
                            <p className="text-gray-600">Started</p>
                            <p className="font-medium text-blue-900">{timing.started}</p>
                          </div>
                        )}
                        {timing.finished && (
                          <div>
                            <p className="text-gray-600">Finished</p>
                            <p className="font-medium text-blue-900">{timing.finished}</p>
                          </div>
                        )}
                        {timing.duration && (
                          <div>
                            <p className="text-gray-600">Total Duration</p>
                            <p className="font-medium text-blue-900">{timing.duration}</p>
                          </div>
                        )}
                        {timing.elapsed && (
                          <div>
                            <p className="text-gray-600">Elapsed Time</p>
                            <p className="font-medium text-blue-900">{timing.elapsed}</p>
                          </div>
                        )}
                        {timing.status && (
                          <div>
                            <p className="text-gray-600">Status</p>
                            <p className="font-medium text-blue-900">{timing.status}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Operation Control Buttons */}
                <div className="mb-4">
                  <h4 className="font-medium mb-2 text-gray-700">Operation Control</h4>
                  <div className="flex flex-wrap gap-2">
                    {getAvailableActions(operation.status).map((action) => (
                      <Button
                        key={action}
                        onClick={() => handleOperationControl(operation, action as any)}
                        disabled={operationControlMutation.isPending}
                        variant={action === "start" ? "default" : action === "finish" ? "default" : "outline"}
                        className={`flex items-center gap-2 ${
                          action === "start" ? "bg-green-600 hover:bg-green-700" :
                          action === "pause" ? "bg-orange-600 hover:bg-orange-700 text-white" :
                          action === "finish" ? "bg-blue-600 hover:bg-blue-700" :
                          action === "hold" ? "bg-red-600 hover:bg-red-700 text-white" : ""
                        }`}
                      >
                        {action === "start" && <Play className="w-4 h-4" />}
                        {action === "pause" && <Pause className="w-4 h-4" />}
                        {action === "finish" && <CheckCircle className="w-4 h-4" />}
                        {action === "hold" && <XCircle className="w-4 h-4" />}
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Additional Action Buttons */}
                <div>
                  <h4 className="font-medium mb-2 text-gray-700">Additional Actions</h4>
                  <div className="flex flex-wrap gap-2">

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
                    
                    <Button
                      variant="outline"
                      onClick={() => handleClockIn(operation)}
                      className="flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Clock In
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleProductionReport(operation)}
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Production Report
                    </Button>
                  </div>
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

      {/* Time Tracking Dialog */}
      <Dialog open={timeTrackingDialogOpen} onOpenChange={setTimeTrackingDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Clock In to Operation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOperation && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{selectedOperation.name}</p>
                <p className="text-sm text-gray-600">{selectedOperation.jobName}</p>
                <p className="text-sm text-gray-500">Resource: {selectedOperation.resourceName}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Clock In Mode
              </label>
              <Select value={clockingMode} onValueChange={(value: "individual" | "team") => setClockingMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual Clock In</SelectItem>
                  <SelectItem value="team">Team Clock In</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {clockingMode === "team" && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Team Name (Optional)
                  </label>
                  <Input
                    placeholder="Enter team name..."
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Select Team Members
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                    {allUsers.map((user: any) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`user-${user.id}`}
                          checked={selectedTeamMembers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTeamMembers(prev => [...prev, user.id]);
                            } else {
                              setSelectedTeamMembers(prev => prev.filter(id => id !== user.id));
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`user-${user.id}`} className="text-sm">
                          {user.username} {user.department && `(${user.department})`}
                        </label>
                      </div>
                    ))}
                  </div>
                  {clockingMode === "team" && selectedTeamMembers.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">Please select at least one team member.</p>
                  )}
                </div>
              </>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setTimeTrackingDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitClockIn}
                disabled={clockInMutation.isPending || (clockingMode === "team" && selectedTeamMembers.length === 0)}
              >
                {clockInMutation.isPending ? "Clocking In..." : "Clock In"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Production Report Dialog */}
      <Dialog open={productionReportDialogOpen} onOpenChange={setProductionReportDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Production Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOperation && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{selectedOperation.name}</p>
                <p className="text-sm text-gray-600">{selectedOperation.jobName}</p>
                <p className="text-sm text-gray-500">Resource: {selectedOperation.resourceName}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Quantity Produced
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={quantityProduced || ''}
                  onChange={(e) => setQuantityProduced(parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Quantity Complete
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={quantityComplete || ''}
                  onChange={(e) => setQuantityComplete(parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Quantity Scrap
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={quantityScrap || ''}
                  onChange={(e) => setQuantityScrap(parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Time Spent (minutes)
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={timeSpent || ''}
                  onChange={(e) => setTimeSpent(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Production Notes
              </label>
              <Textarea
                placeholder="Add any notes about production status, issues, or observations..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setProductionReportDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitProductionReport}
                disabled={submitProductionReportMutation.isPending}
              >
                {submitProductionReportMutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Equipment Problem Report Dialog */}
      <Dialog open={equipmentProblemDialogOpen} onOpenChange={setEquipmentProblemDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Report Equipment Problem
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Equipment Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Equipment/Resource *
                </label>
                <Select 
                  value={equipmentProblem.resourceId?.toString() || ""} 
                  onValueChange={(value) => setEquipmentProblem({
                    ...equipmentProblem, 
                    resourceId: parseInt(value)
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {resources.map((resource) => (
                      <SelectItem key={resource.id} value={resource.id.toString()}>
                        {resource.name} ({resource.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Problem Type
                </label>
                <Select 
                  value={equipmentProblem.downtimeType} 
                  onValueChange={(value) => setEquipmentProblem({
                    ...equipmentProblem, 
                    downtimeType: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mechanical">Mechanical Issue</SelectItem>
                    <SelectItem value="electrical">Electrical Issue</SelectItem>
                    <SelectItem value="software">Software/Control Issue</SelectItem>
                    <SelectItem value="maintenance">Maintenance Required</SelectItem>
                    <SelectItem value="safety">Safety Concern</SelectItem>
                    <SelectItem value="quality">Quality Issue</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Severity and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Severity
                </label>
                <Select 
                  value={equipmentProblem.severity} 
                  onValueChange={(value) => setEquipmentProblem({
                    ...equipmentProblem, 
                    severity: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical - Production Stopped</SelectItem>
                    <SelectItem value="high">High - Reduced Performance</SelectItem>
                    <SelectItem value="medium">Medium - Minor Impact</SelectItem>
                    <SelectItem value="low">Low - Preventive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Priority
                </label>
                <Select 
                  value={equipmentProblem.priority} 
                  onValueChange={(value) => setEquipmentProblem({
                    ...equipmentProblem, 
                    priority: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent - Fix Immediately</SelectItem>
                    <SelectItem value="high">High - Fix Today</SelectItem>
                    <SelectItem value="medium">Medium - Fix This Week</SelectItem>
                    <SelectItem value="low">Low - Schedule When Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Problem Title */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Problem Title *
              </label>
              <Input
                placeholder="Brief summary of the equipment problem"
                value={equipmentProblem.title}
                onChange={(e) => setEquipmentProblem({
                  ...equipmentProblem, 
                  title: e.target.value
                })}
              />
            </div>

            {/* Problem Description */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Detailed Description *
              </label>
              <Textarea
                placeholder="Describe what happened, symptoms observed, when it started, what was happening at the time..."
                value={equipmentProblem.description}
                onChange={(e) => setEquipmentProblem({
                  ...equipmentProblem, 
                  description: e.target.value
                })}
                rows={4}
              />
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Estimated Downtime (minutes)
                </label>
                <Input
                  type="number"
                  placeholder="e.g., 30"
                  value={equipmentProblem.estimatedDowntime}
                  onChange={(e) => setEquipmentProblem({
                    ...equipmentProblem, 
                    estimatedDowntime: e.target.value
                  })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Parts Required
                </label>
                <Input
                  placeholder="List any parts needed for repair"
                  value={equipmentProblem.partsRequired}
                  onChange={(e) => setEquipmentProblem({
                    ...equipmentProblem, 
                    partsRequired: e.target.value
                  })}
                />
              </div>
            </div>

            {/* Impacted Operations */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Impacted Operations/Jobs
              </label>
              <Textarea
                placeholder="List operations or jobs that are affected by this equipment problem..."
                value={equipmentProblem.impactedOperations}
                onChange={(e) => setEquipmentProblem({
                  ...equipmentProblem, 
                  impactedOperations: e.target.value
                })}
                rows={2}
              />
            </div>

            {/* Safety Warning */}
            {equipmentProblem.severity === 'critical' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Critical Issue Reported:</strong> This problem will be escalated immediately to maintenance and management teams. 
                  If there is immediate safety danger, stop all operations and contact your supervisor immediately.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setEquipmentProblemDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => submitEquipmentProblemMutation.mutate(equipmentProblem)}
                disabled={
                  !equipmentProblem.resourceId || 
                  !equipmentProblem.title.trim() || 
                  !equipmentProblem.description.trim() ||
                  submitEquipmentProblemMutation.isPending
                }
                className="bg-red-600 hover:bg-red-700"
              >
                {submitEquipmentProblemMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Reporting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Report Problem
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Operation Control Dialog */}
      <Dialog open={operationControlDialogOpen} onOpenChange={setOperationControlDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {controlAction === "start" && <Play className="w-5 h-5 text-green-600" />}
              {controlAction === "pause" && <Pause className="w-5 h-5 text-orange-600" />}
              {controlAction === "finish" && <CheckCircle className="w-5 h-5 text-blue-600" />}
              {controlAction === "hold" && <XCircle className="w-5 h-5 text-red-600" />}
              {controlAction.charAt(0).toUpperCase() + controlAction.slice(1)} Operation
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {controllingOperation && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{controllingOperation.name}</h4>
                <p className="text-sm text-gray-600 mb-1">Job: {controllingOperation.jobName}</p>
                <p className="text-sm text-gray-600 mb-1">Resource: {controllingOperation.resourceName}</p>
                <p className="text-sm text-gray-600">Current Status: 
                  <Badge className={`ml-2 ${getStatusColor(controllingOperation.status)}`}>
                    {controllingOperation.status.replace("_", " ")}
                  </Badge>
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Action Confirmation
                </label>
                <div className={`p-3 rounded-lg border-2 ${
                  controlAction === "start" ? "border-green-200 bg-green-50" :
                  controlAction === "pause" ? "border-orange-200 bg-orange-50" :
                  controlAction === "finish" ? "border-blue-200 bg-blue-50" :
                  "border-red-200 bg-red-50"
                }`}>
                  <p className={`text-sm font-medium ${
                    controlAction === "start" ? "text-green-800" :
                    controlAction === "pause" ? "text-orange-800" :
                    controlAction === "finish" ? "text-blue-800" :
                    "text-red-800"
                  }`}>
                    {controlAction === "start" && "This will start the operation and begin timing tracking."}
                    {controlAction === "pause" && "This will pause the operation and stop timing tracking."}
                    {controlAction === "finish" && "This will mark the operation as completed and stop timing tracking."}
                    {controlAction === "hold" && "This will put the operation on hold due to external factors."}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Notes (Optional)
                </label>
                <Textarea
                  placeholder={`Add any notes about ${controlAction === "finish" ? "completion" : controlAction === "hold" ? "the hold reason" : `${controlAction}ing`} this operation...`}
                  value={controlNotes}
                  onChange={(e) => setControlNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {controlAction === "finish" && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Operation Completion:</strong> This will mark the operation as finished. 
                    Make sure all work is complete and quality checks are satisfied.
                  </AlertDescription>
                </Alert>
              )}
              
              {controlAction === "hold" && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Operation Hold:</strong> This will temporarily stop the operation. 
                    Please specify the reason in the notes section.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setOperationControlDialogOpen(false);
                  setControlNotes("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitOperationControl}
                disabled={operationControlMutation.isPending}
                className={
                  controlAction === "start" ? "bg-green-600 hover:bg-green-700" :
                  controlAction === "pause" ? "bg-orange-600 hover:bg-orange-700" :
                  controlAction === "finish" ? "bg-blue-600 hover:bg-blue-700" :
                  "bg-red-600 hover:bg-red-700"
                }
              >
                {operationControlMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {controlAction === "start" && <Play className="w-4 h-4 mr-2" />}
                    {controlAction === "pause" && <Pause className="w-4 h-4 mr-2" />}
                    {controlAction === "finish" && <CheckCircle className="w-4 h-4 mr-2" />}
                    {controlAction === "hold" && <XCircle className="w-4 h-4 mr-2" />}
                    {controlAction.charAt(0).toUpperCase() + controlAction.slice(1)} Operation
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Operator Switch Dialog */}
      <Dialog open={operatorSwitchDialogOpen} onOpenChange={setOperatorSwitchDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Switch Operator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Operator</label>
              <Select 
                value={currentOperator} 
                onValueChange={setCurrentOperator}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an operator" />
                </SelectTrigger>
                <SelectContent>
                  {/* Default operators for quick switching */}
                  <SelectItem value="John Smith">John Smith</SelectItem>
                  <SelectItem value="Maria Rodriguez">Maria Rodriguez</SelectItem>
                  <SelectItem value="David Chen">David Chen</SelectItem>
                  <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                  <SelectItem value="Michael Brown">Michael Brown</SelectItem>
                  <SelectItem value="Lisa Wilson">Lisa Wilson</SelectItem>
                  <SelectItem value="James Taylor">James Taylor</SelectItem>
                  <SelectItem value="Jennifer Davis">Jennifer Davis</SelectItem>
                  
                  {/* Dynamic operators from database */}
                  {allUsers.filter(user => 
                    !["John Smith", "Maria Rodriguez", "David Chen", "Sarah Johnson", 
                      "Michael Brown", "Lisa Wilson", "James Taylor", "Jennifer Davis"].includes(
                        user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username
                      )
                  ).map((user) => (
                    <SelectItem 
                      key={user.id} 
                      value={user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                    >
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Operator Switch:</strong> All future operations and reports will be recorded under the selected operator. 
                This is useful for shared workstations where multiple operators use the same terminal.
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setOperatorSwitchDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setOperatorSwitchDialogOpen(false);
                toast({
                  title: "Operator Switched",
                  description: `Now operating as ${currentOperator}`,
                });
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <User className="w-4 h-4 mr-2" />
              Switch Operator
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
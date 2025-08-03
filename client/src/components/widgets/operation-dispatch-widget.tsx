import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Play,
  Pause,
  CheckCircle,
  Clock,
  Settings,
  AlertTriangle,
  Factory,
  Package,
  Calendar,
  Timer,
  Activity,
  Wrench,
  Trash2,
  BarChart3,
  User,
  ChevronRight,
  SkipForward,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DiscreteOperation {
  id: number;
  productionOrderId: number;
  operationNumber: string;
  operationName: string;
  resourceId: number;
  status: string;
  scheduledStartDate: string;
  scheduledEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  setupTimeStandard: number;
  runTimeStandard: number;
  cleanupTimeStandard: number;
  setupTimeActual?: number;
  runTimeActual?: number;
  cleanupTimeActual?: number;
  quantity: number;
  quantityGood?: number;
  quantityScrap?: number;
  unitOfMeasure: string;
  priority: string;
  description?: string;
}

interface Resource {
  id: number;
  name: string;
  type: string;
  status: string;
}

interface UserResourceAssignment {
  id: number;
  userId: number;
  resourceId: number;
  canSkipOperations: boolean;
  scheduleVisibilityDays: number;
  resource: Resource;
}

interface OperationStatusReport {
  phaseType: "setup" | "running" | "cleanup";
  phaseStatus: "started" | "completed" | "paused" | "skipped";
  timeSpent?: number;
  goodQuantity?: number;
  scrapQuantity?: number;
  comments?: string;
  skipReason?: string;
  skipReasonCategory?: string;
}

interface OperationDispatchWidgetProps {
  config?: {
    userId?: number;
    defaultResourceId?: number;
    showQuantityFields?: boolean;
    showTimeFields?: boolean;
    showCommentsField?: boolean;
    cardDisplayFields?: string[];
    autoRefreshInterval?: number;
  };
  data?: any;
  onAction?: (action: string, data: any) => void;
}

const SKIP_REASONS = [
  { category: "material_shortage", reasons: ["Raw materials not available", "Wrong material delivered", "Material quality issue"] },
  { category: "equipment_issue", reasons: ["Equipment malfunction", "Maintenance required", "Tooling problem", "Calibration needed"] },
  { category: "quality_problem", reasons: ["Previous operation failed quality check", "Specification change", "Customer hold"] },
  { category: "scheduling_conflict", reasons: ["Higher priority job", "Resource double-booked", "Operator not available"] },
  { category: "maintenance_required", reasons: ["Scheduled maintenance", "Emergency repair", "Safety inspection due"] },
  { category: "other", reasons: ["Other (specify in comments)"]}
];

export default function OperationDispatchWidget({ 
  config = {}, 
  data, 
  onAction 
}: OperationDispatchWidgetProps) {
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(config.defaultResourceId || null);
  const [activeOperation, setActiveOperation] = useState<DiscreteOperation | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [reportData, setReportData] = useState<OperationStatusReport>({
    phaseType: "setup",
    phaseStatus: "started"
  });
  const [skipReason, setSkipReason] = useState("");
  const [skipCategory, setSkipCategory] = useState("");
  const [currentUserId] = useState(config.userId || 1); // Demo user ID
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's resource assignments
  const { data: resourceAssignments } = useQuery<UserResourceAssignment[]>({
    queryKey: ['/api/user-resource-assignments', currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/user-resource-assignments/${currentUserId}`);
      if (!response.ok) throw new Error('Failed to fetch resource assignments');
      return response.json();
    }
  });

  // Fetch operations for selected resource
  const { data: operations, isLoading: operationsLoading, refetch: refetchOperations } = useQuery<DiscreteOperation[]>({
    queryKey: ['/api/discrete-operations', selectedResourceId],
    queryFn: async () => {
      if (!selectedResourceId) return [];
      const response = await fetch(`/api/discrete-operations?resourceId=${selectedResourceId}&status=released,in_progress`);
      if (!response.ok) throw new Error('Failed to fetch operations');
      return response.json();
    },
    enabled: !!selectedResourceId
  });

  // Auto-refresh operations
  useEffect(() => {
    if (config.autoRefreshInterval && selectedResourceId) {
      const interval = setInterval(() => {
        refetchOperations();
      }, config.autoRefreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [config.autoRefreshInterval, selectedResourceId, refetchOperations]);

  // Report operation status mutation
  const reportStatusMutation = useMutation({
    mutationFn: async (report: OperationStatusReport & { operationId: number }) => {
      return apiRequest('/api/operation-status-reports', 'POST', {
        discreteOperationId: report.operationId,
        reportedBy: currentUserId,
        resourceId: selectedResourceId,
        ...report
      });
    },
    onSuccess: () => {
      toast({
        title: "Status Reported",
        description: "Operation status has been successfully reported.",
      });
      setReportDialogOpen(false);
      setReportData({ phaseType: "setup", phaseStatus: "started" });
      refetchOperations();
      queryClient.invalidateQueries({ queryKey: ['/api/operation-status-reports'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to report status: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Skip operation mutation
  const skipOperationMutation = useMutation({
    mutationFn: async ({ operationId, reason, category }: { operationId: number; reason: string; category: string }) => {
      return apiRequest('/api/operation-status-reports', 'POST', {
        discreteOperationId: operationId,
        reportedBy: currentUserId,
        resourceId: selectedResourceId,
        phaseType: "setup",
        phaseStatus: "skipped",
        skipReason: reason,
        skipReasonCategory: category,
        comments: reportData.comments
      });
    },
    onSuccess: () => {
      toast({
        title: "Operation Skipped",
        description: "Operation has been skipped with reason provided.",
      });
      setSkipDialogOpen(false);
      setSkipReason("");
      setSkipCategory("");
      refetchOperations();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to skip operation: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'released': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'on_hold': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const canSkipOperation = (operation: DiscreteOperation) => {
    const assignment = resourceAssignments?.find(ra => ra.resourceId === selectedResourceId);
    return assignment?.canSkipOperations || false;
  };

  const isFirstOperation = (operation: DiscreteOperation) => {
    if (!operations) return false;
    const sortedOps = [...operations].sort((a, b) => a.operationNumber.localeCompare(b.operationNumber));
    return sortedOps[0]?.id === operation.id;
  };

  const handleStartOperation = (operation: DiscreteOperation) => {
    setActiveOperation(operation);
    setReportData({
      phaseType: "setup",
      phaseStatus: "started"
    });
    setReportDialogOpen(true);
  };

  const handleSkipOperation = (operation: DiscreteOperation) => {
    if (!canSkipOperation(operation)) {
      toast({
        title: "Cannot Skip",
        description: "You don't have permission to skip operations.",
        variant: "destructive",
      });
      return;
    }
    setActiveOperation(operation);
    setSkipDialogOpen(true);
  };

  const handleReportSubmit = () => {
    if (!activeOperation) return;
    
    reportStatusMutation.mutate({
      operationId: activeOperation.id,
      ...reportData
    });
  };

  const handleSkipSubmit = () => {
    if (!activeOperation || !skipReason || !skipCategory) {
      toast({
        title: "Missing Information",
        description: "Please select a skip reason and category.",
        variant: "destructive",
      });
      return;
    }

    skipOperationMutation.mutate({
      operationId: activeOperation.id,
      reason: skipReason,
      category: skipCategory
    });
  };

  const selectedAssignment = resourceAssignments?.find(ra => ra.resourceId === selectedResourceId);

  if (!resourceAssignments?.length) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5" />
            Operation Dispatch
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-gray-600 dark:text-gray-400">No resources assigned</p>
            <p className="text-sm text-gray-500">Contact your supervisor to assign resources</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full h-full space-y-4">
      {/* Resource Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5" />
            Operation Dispatch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="resource-select">Select Resource</Label>
              <Select 
                value={selectedResourceId?.toString() || ""} 
                onValueChange={(value) => setSelectedResourceId(parseInt(value))}
              >
                <SelectTrigger id="resource-select">
                  <SelectValue placeholder="Choose a resource..." />
                </SelectTrigger>
                <SelectContent>
                  {resourceAssignments.map((assignment) => (
                    <SelectItem key={assignment.resourceId} value={assignment.resourceId.toString()}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${assignment.resource.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                        {assignment.resource.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchOperations()}
              disabled={!selectedResourceId}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
          {selectedAssignment && (
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <SkipForward className="w-4 h-4" />
                <span>Skip: {selectedAssignment.canSkipOperations ? 'Allowed' : 'Not Allowed'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Visibility: {selectedAssignment.scheduleVisibilityDays} days</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operations List */}
      {selectedResourceId && (
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>Scheduled Operations</span>
              {operations?.length && (
                <Badge variant="secondary">{operations.length} operations</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {operationsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center space-y-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
                  <p className="text-gray-600 dark:text-gray-400">Loading operations...</p>
                </div>
              </div>
            ) : !operations?.length ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center space-y-2">
                  <Package className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="text-gray-600 dark:text-gray-400">No operations scheduled</p>
                  <p className="text-sm text-gray-500">Check back later for new assignments</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {operations.map((operation, index) => (
                    <Card key={operation.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{operation.operationNumber}</Badge>
                              <h4 className="font-semibold">{operation.operationName}</h4>
                              <Badge className={getPriorityColor(operation.priority)}>
                                {operation.priority}
                              </Badge>
                            </div>
                            
                            {operation.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {operation.description}
                              </p>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div className="flex items-center gap-1">
                                <Package className="w-4 h-4 text-blue-500" />
                                <span>{operation.quantity} {operation.unitOfMeasure}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Timer className="w-4 h-4 text-green-500" />
                                <span>Setup: {formatTime(operation.setupTimeStandard)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Activity className="w-4 h-4 text-orange-500" />
                                <span>Run: {formatTime(operation.runTimeStandard)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Trash2 className="w-4 h-4 text-purple-500" />
                                <span>Cleanup: {formatTime(operation.cleanupTimeStandard)}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>Scheduled: {new Date(operation.scheduledStartDate).toLocaleString()}</span>
                              <span>-</span>
                              <span>{new Date(operation.scheduledEndDate).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(operation.status)}`} />
                            <div className="flex gap-1">
                              {index === 0 || isFirstOperation(operation) ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleStartOperation(operation)}
                                  className="flex items-center gap-1"
                                >
                                  <Play className="w-3 h-3" />
                                  Start
                                </Button>
                              ) : (
                                <Button size="sm" disabled variant="outline">
                                  <Clock className="w-3 h-3" />
                                  Waiting
                                </Button>
                              )}
                              
                              {canSkipOperation(operation) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSkipOperation(operation)}
                                >
                                  <SkipForward className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* Report Status Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report Operation Status</DialogTitle>
          </DialogHeader>
          
          {activeOperation && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <p className="font-medium">{activeOperation.operationName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Operation {activeOperation.operationNumber}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Phase Type</Label>
                  <Select 
                    value={reportData.phaseType} 
                    onValueChange={(value: "setup" | "running" | "cleanup") => 
                      setReportData(prev => ({ ...prev, phaseType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="setup">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4" />
                          Setup
                        </div>
                      </SelectItem>
                      <SelectItem value="running">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Running
                        </div>
                      </SelectItem>
                      <SelectItem value="cleanup">
                        <div className="flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          Cleanup
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select 
                    value={reportData.phaseStatus} 
                    onValueChange={(value: "started" | "completed" | "paused") => 
                      setReportData(prev => ({ ...prev, phaseStatus: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="started">
                        <div className="flex items-center gap-2">
                          <Play className="w-4 h-4" />
                          Started
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Completed
                        </div>
                      </SelectItem>
                      <SelectItem value="paused">
                        <div className="flex items-center gap-2">
                          <Pause className="w-4 h-4" />
                          Paused
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {config.showTimeFields && (
                <div>
                  <Label htmlFor="time-spent">Time Spent (minutes)</Label>
                  <Input
                    id="time-spent"
                    type="number"
                    value={reportData.timeSpent || ""}
                    onChange={(e) => setReportData(prev => ({ 
                      ...prev, 
                      timeSpent: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="Enter time in minutes"
                  />
                </div>
              )}

              {config.showQuantityFields && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="good-qty">Good Quantity</Label>
                    <Input
                      id="good-qty"
                      type="number"
                      step="0.0001"
                      value={reportData.goodQuantity || ""}
                      onChange={(e) => setReportData(prev => ({ 
                        ...prev, 
                        goodQuantity: e.target.value ? parseFloat(e.target.value) : undefined 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="scrap-qty">Scrap Quantity</Label>
                    <Input
                      id="scrap-qty"
                      type="number"
                      step="0.0001"
                      value={reportData.scrapQuantity || ""}
                      onChange={(e) => setReportData(prev => ({ 
                        ...prev, 
                        scrapQuantity: e.target.value ? parseFloat(e.target.value) : undefined 
                      }))}
                    />
                  </div>
                </div>
              )}

              {config.showCommentsField && (
                <div>
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea
                    id="comments"
                    value={reportData.comments || ""}
                    onChange={(e) => setReportData(prev => ({ ...prev, comments: e.target.value }))}
                    placeholder="Enter any comments or notes..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReportSubmit} disabled={reportStatusMutation.isPending}>
              {reportStatusMutation.isPending ? "Reporting..." : "Report Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip Operation Dialog */}
      <Dialog open={skipDialogOpen} onOpenChange={setSkipDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Skip Operation</DialogTitle>
          </DialogHeader>
          
          {activeOperation && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <p className="font-medium">{activeOperation.operationName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Operation {activeOperation.operationNumber}
                </p>
              </div>

              <div>
                <Label>Skip Category</Label>
                <Select value={skipCategory} onValueChange={setSkipCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SKIP_REASONS.map((category) => (
                      <SelectItem key={category.category} value={category.category}>
                        {category.category.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {skipCategory && (
                <div>
                  <Label>Skip Reason</Label>
                  <Select value={skipReason} onValueChange={setSkipReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SKIP_REASONS.find(cat => cat.category === skipCategory)?.reasons.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="skip-comments">Additional Comments</Label>
                <Textarea
                  id="skip-comments"
                  value={reportData.comments || ""}
                  onChange={(e) => setReportData(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Provide additional details..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSkipDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleSkipSubmit} 
              disabled={skipOperationMutation.isPending || !skipReason || !skipCategory}
            >
              {skipOperationMutation.isPending ? "Skipping..." : "Skip Operation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
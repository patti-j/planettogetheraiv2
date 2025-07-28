import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { History, Clock, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Play, Eye, BarChart3, Users, Filter, Download } from "lucide-react";
import { format } from "date-fns";

interface SchedulingHistory {
  id: number;
  algorithmName: string;
  algorithmVersion: string;
  triggeredBy: number;
  plantId: number;
  executionStartTime: string;
  executionEndTime?: string;
  executionDuration?: number;
  status: string;
  makespan?: number;
  resourceUtilization?: number;
  onTimeDeliveryRate?: number;
  costOptimization?: number;
  qualityScore?: number;
  parameters?: Record<string, any>;
  notes?: string;
  errorMessage?: string;
  createdAt: string;
}

interface SchedulingResult {
  id: number;
  historyId: number;
  operationId: number;
  jobId: number;
  originalStartTime?: string;
  originalEndTime?: string;
  newStartTime?: string;
  newEndTime?: string;
  resourceId?: number;
  improvementType?: string;
  improvementValue?: number;
  notes?: string;
}

interface AlgorithmPerformance {
  id: number;
  algorithmName: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime?: number;
  averageMakespanImprovement?: number;
  averageUtilizationImprovement?: number;
  averageCostSavings?: number;
  performanceTrend: string;
  lastExecutionDate?: string;
}

export default function SchedulingHistory() {
  const [selectedHistory, setSelectedHistory] = useState<SchedulingHistory | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAlgorithm, setFilterAlgorithm] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch scheduling history
  const { data: historyData = [], isLoading: historyLoading, error: historyError } = useQuery<SchedulingHistory[]>({
    queryKey: ["/api/scheduling-history"],
    enabled: true,
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch algorithm performance data
  const { data: performanceData = [], isLoading: performanceLoading, error: performanceError } = useQuery<AlgorithmPerformance[]>({
    queryKey: ["/api/algorithm-performance"],
    enabled: true,
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch scheduling results for selected history
  const { data: resultsData = [], isLoading: resultsLoading } = useQuery<SchedulingResult[]>({
    queryKey: ["/api/scheduling-history", selectedHistory?.id, "results"],
    enabled: !!selectedHistory?.id,
  });

  // Delete history mutation
  const deleteHistoryMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/scheduling-history/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduling-history"] });
      toast({
        title: "Success",
        description: "Scheduling history deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete scheduling history",
        variant: "destructive",
      });
    },
  });

  // Filter and search data
  const filteredHistory = historyData.filter((item) => {
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const matchesAlgorithm = filterAlgorithm === "all" || item.algorithmName === filterAlgorithm;
    const matchesSearch = searchTerm === "" || 
      item.algorithmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesAlgorithm && matchesSearch;
  });

  // Get unique algorithms for filter
  const uniqueAlgorithms = Array.from(new Set(historyData.map((item) => item.algorithmName)));

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      running: { variant: "secondary" as const, icon: Play, color: "text-blue-600" },
      failed: { variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" },
      cancelled: { variant: "outline" as const, icon: AlertCircle, color: "text-gray-600" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.completed;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status}
      </Badge>
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  // Debug logging
  console.log("Scheduling History Debug:", {
    historyLoading,
    performanceLoading,
    historyError: historyError?.message,
    performanceError: performanceError?.message,
    historyData: historyData?.length,
    performanceData: performanceData?.length
  });

  if (historyLoading || performanceLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Scheduling History</h1>
            <p className="text-muted-foreground">Track and analyze algorithm execution results</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show error state if data failed to load
  if (historyError || performanceError) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Scheduling History</h1>
            <p className="text-muted-foreground">Track and analyze algorithm execution results</p>
          </div>
        </div>
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Data Loading Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyError && (
              <div className="mb-2">
                <strong>History Error:</strong> {historyError.message}
              </div>
            )}
            {performanceError && (
              <div>
                <strong>Performance Error:</strong> {performanceError.message}
              </div>
            )}
            <Button 
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/scheduling-history"] });
                queryClient.invalidateQueries({ queryKey: ["/api/algorithm-performance"] });
              }}
              className="mt-4"
            >
              Retry Loading Data
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-8 w-8" />
            Scheduling History
          </h1>
          <p className="text-muted-foreground">Track and analyze algorithm execution results</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historyData.length}</div>
            <p className="text-xs text-muted-foreground">All algorithm runs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {historyData.length > 0 
                ? Math.round((historyData.filter((h) => h.status === "completed").length / historyData.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Completed successfully</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historyData.length > 0 
                ? Math.round(historyData.reduce((acc, h) => acc + (h.executionDuration || 0), 0) / historyData.length)
                : 0}s
            </div>
            <p className="text-xs text-muted-foreground">Per algorithm run</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Algorithms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueAlgorithms.length}</div>
            <p className="text-xs text-muted-foreground">Different algorithms used</p>
          </CardContent>
        </Card>
      </div>

      {/* Algorithm Performance Overview */}
      {performanceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Algorithm Performance
            </CardTitle>
            <CardDescription>Performance trends and statistics for each algorithm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {performanceData.map((perf) => (
                <Card key={perf.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{perf.algorithmName}</CardTitle>
                      {getTrendIcon(perf.performanceTrend)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Success Rate:</span>
                      <span className="font-medium">
                        {perf.totalExecutions > 0 
                          ? Math.round((perf.successfulExecutions / perf.totalExecutions) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg Time:</span>
                      <span className="font-medium">{perf.averageExecutionTime || 0}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Executions:</span>
                      <span className="font-medium">{perf.totalExecutions}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by algorithm or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="algorithm-filter">Algorithm</Label>
              <Select value={filterAlgorithm} onValueChange={setFilterAlgorithm}>
                <SelectTrigger>
                  <SelectValue placeholder="All algorithms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Algorithms</SelectItem>
                  {uniqueAlgorithms.map((algorithm) => (
                    <SelectItem key={algorithm} value={algorithm}>
                      {algorithm}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                  setFilterAlgorithm("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
          <CardDescription>
            {filteredHistory.length} of {historyData.length} executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Algorithm</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Triggered By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((history: SchedulingHistory) => (
                <TableRow key={history.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{history.algorithmName}</div>
                      <div className="text-sm text-muted-foreground">v{history.algorithmVersion}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(history.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(history.executionStartTime), "MMM dd, yyyy")}
                      <br />
                      <span className="text-muted-foreground">
                        {format(new Date(history.executionStartTime), "HH:mm:ss")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {history.executionDuration ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {history.executionDuration}s
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {history.makespan && (
                        <div className="text-sm">Makespan: {history.makespan}min</div>
                      )}
                      {history.resourceUtilization && (
                        <div className="text-sm">Utilization: {history.resourceUtilization}%</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      User {history.triggeredBy}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedHistory(history)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Execution Details</DialogTitle>
                            <DialogDescription>
                              Algorithm: {history.algorithmName} v{history.algorithmVersion}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Status</Label>
                                <div className="mt-1">{getStatusBadge(history.status)}</div>
                              </div>
                              <div>
                                <Label>Execution Time</Label>
                                <div className="mt-1 flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {history.executionDuration || 0}s
                                </div>
                              </div>
                            </div>

                            {/* Performance Metrics */}
                            <div>
                              <Label>Performance Metrics</Label>
                              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                                {history.makespan && (
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="text-2xl font-bold">{history.makespan}</div>
                                      <div className="text-sm text-muted-foreground">Makespan (min)</div>
                                    </CardContent>
                                  </Card>
                                )}
                                {history.resourceUtilization && (
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="text-2xl font-bold">{history.resourceUtilization}%</div>
                                      <div className="text-sm text-muted-foreground">Resource Utilization</div>
                                    </CardContent>
                                  </Card>
                                )}
                                {history.onTimeDeliveryRate && (
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="text-2xl font-bold">{history.onTimeDeliveryRate}%</div>
                                      <div className="text-sm text-muted-foreground">On-Time Delivery</div>
                                    </CardContent>
                                  </Card>
                                )}
                                {history.qualityScore && (
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="text-2xl font-bold">{history.qualityScore}%</div>
                                      <div className="text-sm text-muted-foreground">Quality Score</div>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            </div>

                            {/* Parameters */}
                            {history.parameters && (
                              <div>
                                <Label>Algorithm Parameters</Label>
                                <Card className="mt-2">
                                  <CardContent className="p-4">
                                    <pre className="text-sm bg-gray-50 p-2 rounded">
                                      {JSON.stringify(history.parameters, null, 2)}
                                    </pre>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {/* Notes */}
                            {history.notes && (
                              <div>
                                <Label>Notes</Label>
                                <Card className="mt-2">
                                  <CardContent className="p-4">
                                    <p className="text-sm">{history.notes}</p>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {/* Error Message */}
                            {history.errorMessage && (
                              <div>
                                <Label>Error Message</Label>
                                <Card className="mt-2 border-red-200">
                                  <CardContent className="p-4">
                                    <p className="text-sm text-red-600">{history.errorMessage}</p>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {/* Scheduling Results */}
                            {resultsData.length > 0 && (
                              <div>
                                <Label>Scheduling Results ({resultsData.length} operations)</Label>
                                <Card className="mt-2">
                                  <CardContent className="p-4">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Operation</TableHead>
                                          <TableHead>Job</TableHead>
                                          <TableHead>Resource</TableHead>
                                          <TableHead>Original Time</TableHead>
                                          <TableHead>New Time</TableHead>
                                          <TableHead>Improvement</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {resultsData.slice(0, 10).map((result: SchedulingResult) => (
                                          <TableRow key={result.id}>
                                            <TableCell>Op {result.operationId}</TableCell>
                                            <TableCell>Job {result.jobId}</TableCell>
                                            <TableCell>Res {result.resourceId}</TableCell>
                                            <TableCell>
                                              {result.originalStartTime && format(new Date(result.originalStartTime), "MMM dd HH:mm")}
                                            </TableCell>
                                            <TableCell>
                                              {result.newStartTime && format(new Date(result.newStartTime), "MMM dd HH:mm")}
                                            </TableCell>
                                            <TableCell>
                                              {result.improvementType && result.improvementValue && (
                                                <Badge variant="secondary">
                                                  {result.improvementType}: {result.improvementValue}
                                                </Badge>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                    {resultsData.length > 10 && (
                                      <div className="text-center mt-4">
                                        <p className="text-sm text-muted-foreground">
                                          Showing 10 of {resultsData.length} results
                                        </p>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteHistoryMutation.mutate(history.id)}
                        disabled={deleteHistoryMutation.isPending}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredHistory.length === 0 && (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No scheduling history found</h3>
              <p className="text-muted-foreground">
                {historyData.length === 0 
                  ? "No algorithm executions have been recorded yet."
                  : "No executions match your current filters."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
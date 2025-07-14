import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Clock, Users, Settings, Wrench, Building2, Play, Pause, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Operation, Job, Resource } from "@shared/schema";

export default function ShopFloor() {
  const [selectedResource, setSelectedResource] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("today");
  const queryClient = useQueryClient();

  // Fetch data
  const { data: operations = [], isLoading: operationsLoading } = useQuery<Operation[]>({
    queryKey: ["/api/operations"],
  });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: resources = [], isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const { data: metrics } = useQuery({
    queryKey: ["/api/metrics"],
    refetchInterval: 30000, // Refresh every 30 seconds
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

  // Filter operations based on selected resource and time
  const filteredOperations = operations.filter(op => {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Shop Floor</h1>
            <p className="text-sm text-gray-600">Real-time production monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="px-4 py-4">
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

        {/* Operations List */}
        <div className="space-y-3">
          {filteredOperations.map(operation => {
            const job = getJob(operation.jobId);
            const resource = getResource(operation.resourceId);
            
            return (
              <Card key={operation.id} className="border-l-4" style={{ borderLeftColor: getPriorityColor(job?.priority || "medium") }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{operation.name}</h3>
                      <p className="text-sm text-gray-600 mb-1">{job?.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {getResourceIcon(resource?.type || "")}
                        <span>{resource?.name}</span>
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
                        onClick={() => handleStatusUpdate(operation.id, "In-Progress")}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        disabled={updateOperationMutation.isPending}
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
                          onClick={() => handleStatusUpdate(operation.id, "Pending")}
                          className="flex-1"
                          disabled={updateOperationMutation.isPending}
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusUpdate(operation.id, "Completed")}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          disabled={updateOperationMutation.isPending}
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
                        onClick={() => handleStatusUpdate(operation.id, "In-Progress")}
                        className="flex-1"
                        disabled={updateOperationMutation.isPending}
                      >
                        Reopen
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

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
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, Wrench, AlertCircle, CheckCircle2, PlayCircle, PauseCircle } from "lucide-react";
import { format } from "date-fns";
import type { Job, Operation, Resource, Capability } from "@shared/schema";

interface MobileScheduleProps {
  jobs: Job[];
  operations: Operation[];
  resources: Resource[];
  capabilities: Capability[];
}

export default function MobileSchedule({ 
  jobs, 
  operations, 
  resources, 
  capabilities 
}: MobileScheduleProps) {
  const [selectedTab, setSelectedTab] = useState("today");
  const [selectedResource, setSelectedResource] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Filter operations based on selected filters
  const filteredOperations = useMemo(() => {
    let filtered = operations;

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
  }, [operations, selectedResource, selectedStatus, selectedTab]);

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
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <h1 className="text-xl font-semibold text-gray-800 mb-4">Mobile Schedule</h1>
        
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

        <TabsContent value={selectedTab} className="flex-1 px-4 pb-4 overflow-y-auto min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="space-y-3 pt-4 pb-8">
              {filteredOperations.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No operations found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredOperations.map(operation => {
                  const { job, resource, requiredCapabilities } = getOperationDetails(operation);
                  const statusInfo = getStatusInfo(operation.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <Card key={operation.id} className="border-l-4" style={{ borderLeftColor: statusInfo.color.replace('bg-', '#') }}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-medium text-gray-900">
                              {operation.name}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              {job?.name}
                            </p>
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
                  );
                })
              )}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Clock, CheckCircle, XCircle, Plus, Calendar, User, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertDisruptionSchema, insertDisruptionActionSchema, insertDisruptionEscalationSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";

type Disruption = {
  id: number;
  title: string;
  description: string;
  type: "machine" | "material" | "personnel" | "quality" | "external";
  severity: number;
  status: "active" | "investigating" | "resolved" | "cancelled";
  affectedResource: string;
  department: string;
  reportedBy: string;
  assignedTo?: string;
  startTime: string;
  estimatedDuration?: number;
  actualEndTime?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
};

type DisruptionAction = {
  id: number;
  disruptionId: number;
  actionType: "immediate" | "planned" | "corrective" | "preventive";
  title: string;
  description: string;
  assignedTo: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  scheduledTime?: string;
  completedTime?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  resources?: string;
  createdAt: string;
};

type DisruptionEscalation = {
  id: number;
  disruptionId: number;
  escalatedTo: string;
  escalatedBy: string;
  escalationLevel: number;
  reason: string;
  expectedResponse?: string;
  actualResponse?: string;
  responseReceived: boolean;
  createdAt: string;
};

function getSeverityColor(severity: number) {
  if (severity >= 80) return "bg-red-500";
  if (severity >= 60) return "bg-orange-500";
  if (severity >= 40) return "bg-yellow-500";
  return "bg-green-500";
}

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "destructive" as const;
    case "investigating":
      return "default" as const;
    case "resolved":
      return "outline" as const;
    case "cancelled":
      return "secondary" as const;
    default:
      return "default" as const;
  }
}

function DisruptionForm({ disruption, onSuccess }: { disruption?: Disruption; onSuccess: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(insertDisruptionSchema),
    defaultValues: {
      title: disruption?.title || "",
      description: disruption?.description || "",
      type: disruption?.type || "machine",
      severity: disruption?.severity || 50,
      status: disruption?.status || "active",
      affectedResource: disruption?.affectedResource || "",
      department: disruption?.department || "",
      reportedBy: disruption?.reportedBy || "",
      assignedTo: disruption?.assignedTo || "",
      startTime: disruption?.startTime ? new Date(disruption.startTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      estimatedDuration: disruption?.estimatedDuration || 60,
      resolutionNotes: disruption?.resolutionNotes || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const options = {
        method: disruption ? "PUT" : "POST",
        body: JSON.stringify(data),
      };
      const url = disruption ? `/api/disruptions/${disruption.id}` : "/api/disruptions";
      return apiRequest(url, options);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disruptions"] });
      toast({
        title: "Success",
        description: `Disruption ${disruption ? "updated" : "created"} successfully`,
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to ${disruption ? "update" : "create"} disruption: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Brief description of the disruption" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select disruption type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="machine">Machine Breakdown</SelectItem>
                    <SelectItem value="material">Material Shortage</SelectItem>
                    <SelectItem value="personnel">Personnel Absence</SelectItem>
                    <SelectItem value="quality">Quality Issue</SelectItem>
                    <SelectItem value="external">External Disruption</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Detailed description of the disruption and its impact" 
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="severity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Severity (1-100)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    max="100" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="estimatedDuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Duration (minutes)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="affectedResource"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Affected Resource</FormLabel>
                <FormControl>
                  <Input placeholder="Machine, material, or person affected" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="Department or area" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="reportedBy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reported By</FormLabel>
                <FormControl>
                  <Input placeholder="Name of person reporting" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned To</FormLabel>
                <FormControl>
                  <Input placeholder="Name of person assigned" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="startTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {disruption?.status === "resolved" && (
          <FormField
            control={form.control}
            name="resolutionNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resolution Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Details about how the disruption was resolved"
                    className="min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
            <span className="hidden sm:inline">{mutation.isPending ? "Saving..." : disruption ? "Update Disruption" : "Create Disruption"}</span>
            <span className="sm:hidden">{mutation.isPending ? "Saving..." : disruption ? "Update" : "Create"}</span>
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function DisruptionManagement() {
  const [selectedDisruption, setSelectedDisruption] = useState<Disruption | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: disruptions = [], isLoading } = useQuery<Disruption[]>({
    queryKey: ["/api/disruptions"],
  });

  const { data: activeDisruptions = [] } = useQuery<Disruption[]>({
    queryKey: ["/api/disruptions/active"],
  });

  const deleteDisruptionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/disruptions/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disruptions"] });
      toast({
        title: "Success",
        description: "Disruption deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete disruption: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 md:ml-0 ml-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Disruption Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track and manage production disruptions including machine breakdowns, material shortages, and personnel issues
          </p>
        </div>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Report Disruption</span>
              <span className="sm:hidden">Report</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Report New Disruption</DialogTitle>
              <DialogDescription>
                Record a new production disruption to track and manage its resolution
              </DialogDescription>
            </DialogHeader>
            <DisruptionForm onSuccess={() => setShowCreateForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Disruptions</CardTitle>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-red-600">{activeDisruptions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Disruptions</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold">{disruptions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {disruptions.filter((d: Disruption) => 
                d.status === "resolved" && 
                new Date(d.updatedAt).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold">2.5h</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Active Disruptions</span>
            <span className="sm:hidden">Active</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">All Disruptions</span>
            <span className="sm:hidden">All</span>
          </TabsTrigger>
          <TabsTrigger value="resolved" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Recently Resolved</span>
            <span className="sm:hidden">Resolved</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeDisruptions.map((disruption: Disruption) => (
              <Card key={disruption.id} className="relative">
                <div className={`absolute top-0 left-0 w-1 h-full ${getSeverityColor(disruption.severity)} rounded-l-lg`} />
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-sm sm:text-lg flex-1 min-w-0">{disruption.title}</CardTitle>
                    <Badge variant={getStatusColor(disruption.status)} className="text-xs shrink-0">
                      {disruption.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                    {disruption.type.replace("_", " ")} • {disruption.department}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-3 sm:p-4">
                  <p className="text-xs sm:text-sm line-clamp-2">{disruption.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span className="truncate">Severity: {disruption.severity}/100</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Settings className="h-3 w-3 shrink-0" />
                      <span className="truncate">Resource: {disruption.affectedResource}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <User className="h-3 w-3 shrink-0" />
                      <span className="truncate">Assigned: {disruption.assignedTo || "Unassigned"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span className="truncate">Started: {format(new Date(disruption.startTime), "MMM d, HH:mm")}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm">
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">Details</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Disruption</DialogTitle>
                          <DialogDescription>
                            Update disruption status and details
                          </DialogDescription>
                        </DialogHeader>
                        <DisruptionForm 
                          disruption={disruption} 
                          onSuccess={() => setSelectedDisruption(null)} 
                        />
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteDisruptionMutation.mutate(disruption.id)}
                      disabled={deleteDisruptionMutation.isPending}
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {activeDisruptions.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">No Active Disruptions</h3>
              <p className="text-muted-foreground">All systems running smoothly!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {disruptions.map((disruption: Disruption) => (
              <Card key={disruption.id} className="relative">
                <div className={`absolute top-0 left-0 w-1 h-full ${getSeverityColor(disruption.severity)} rounded-l-lg`} />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{disruption.title}</CardTitle>
                    <Badge variant={getStatusColor(disruption.status)}>
                      {disruption.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm text-muted-foreground">
                    {disruption.type.replace("_", " ")} • {disruption.department}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm line-clamp-2">{disruption.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Severity: {disruption.severity}/100</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Settings className="h-3 w-3" />
                      <span>Resource: {disruption.affectedResource}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3 w-3" />
                      <span>Reported by: {disruption.reportedBy}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3 w-3" />
                      <span>Started: {format(new Date(disruption.startTime), "MMM d, HH:mm")}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Disruption</DialogTitle>
                          <DialogDescription>
                            Update disruption status and details
                          </DialogDescription>
                        </DialogHeader>
                        <DisruptionForm 
                          disruption={disruption} 
                          onSuccess={() => setSelectedDisruption(null)} 
                        />
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteDisruptionMutation.mutate(disruption.id)}
                      disabled={deleteDisruptionMutation.isPending}
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {disruptions
              .filter((d: Disruption) => d.status === "resolved")
              .slice(0, 6)
              .map((disruption: Disruption) => (
                <Card key={disruption.id} className="relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-lg" />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{disruption.title}</CardTitle>
                      <Badge variant="success">
                        {disruption.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm text-muted-foreground">
                      {disruption.type.replace("_", " ")} • {disruption.department}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm line-clamp-2">{disruption.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Settings className="h-3 w-3" />
                        <span>Resource: {disruption.affectedResource}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3" />
                        <span>Resolved: {disruption.actualEndTime ? format(new Date(disruption.actualEndTime), "MMM d, HH:mm") : "Unknown"}</span>
                      </div>
                      {disruption.resolutionNotes && (
                        <div className="text-sm">
                          <span className="font-medium">Resolution:</span>
                          <p className="text-muted-foreground line-clamp-2">{disruption.resolutionNotes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
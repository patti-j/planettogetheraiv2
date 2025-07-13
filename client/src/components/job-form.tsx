import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Edit, Trash2, MoreHorizontal, Settings, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertJobSchema, type Job, type Operation, type Capability, type Resource } from "@shared/schema";
import OperationForm from "./operation-form";

const jobFormSchema = insertJobSchema.extend({
  dueDate: z.string().optional(),
});

type JobFormData = z.infer<typeof jobFormSchema>;

interface JobFormProps {
  job?: Job;
  onSuccess?: () => void;
}

export default function JobForm({ job, onSuccess }: JobFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [operationDialogOpen, setOperationDialogOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      name: job?.name || "",
      description: job?.description || "",
      customer: job?.customer || "",
      priority: job?.priority || "medium",
      status: job?.status || "planned",
      dueDate: job?.dueDate ? new Date(job.dueDate).toISOString().split('T')[0] : "",
    },
  });

  // Fetch operations for this job if editing
  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ["/api/jobs", job?.id, "operations"],
    queryFn: async () => {
      if (!job?.id) return [];
      const response = await fetch(`/api/jobs/${job.id}/operations`);
      if (!response.ok) throw new Error("Failed to fetch operations");
      return response.json();
    },
    enabled: !!job?.id,
  });

  // Fetch capabilities and resources for operation form
  const { data: capabilities = [] } = useQuery<Capability[]>({
    queryKey: ["/api/capabilities"],
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      const jobData = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      };
      const url = job ? `/api/jobs/${job.id}` : "/api/jobs";
      const method = job ? "PUT" : "POST";
      const response = await apiRequest(method, url, jobData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({ title: job ? "Job updated successfully" : "Job created successfully" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: job ? "Failed to update job" : "Failed to create job", variant: "destructive" });
    },
  });

  const deleteOperationMutation = useMutation({
    mutationFn: async (operationId: number) => {
      const response = await fetch(`/api/operations/${operationId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete operation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", job?.id, "operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({ title: "Operation deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete operation", variant: "destructive" });
    },
  });

  const onSubmit = (data: JobFormData) => {
    createJobMutation.mutate(data);
  };

  const handleEditOperation = (operation: Operation) => {
    setEditingOperation(operation);
    setOperationDialogOpen(true);
  };

  const handleDeleteOperation = (operationId: number) => {
    if (confirm("Are you sure you want to delete this operation?")) {
      deleteOperationMutation.mutate(operationId);
    }
  };

  const handleOperationDialogClose = () => {
    setOperationDialogOpen(false);
    setEditingOperation(null);
  };

  const getCapabilityName = (capabilityId: number) => {
    const capability = capabilities.find(c => c.id === capabilityId);
    return capability?.name || `Capability ${capabilityId}`;
  };

  const getResourceName = (resourceId: number | null) => {
    if (!resourceId) return "Unassigned";
    const resource = resources.find(r => r.id === resourceId);
    return resource?.name || `Resource ${resourceId}`;
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter job name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <FormControl>
                <Input placeholder="Enter customer name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Job description" rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Operations Section - Only show for existing jobs */}
        {job && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Operations</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOperationDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Operation
              </Button>
            </div>
            
            {operations.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No operations yet</p>
                <p className="text-sm text-gray-500">Add operations to define the work steps for this job.</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-3 border rounded-lg p-2">
                {operations.map((operation) => (
                  <Card key={operation.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{operation.name}</h4>
                          <Badge variant="secondary" className="capitalize">
                            {operation.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{operation.duration}h duration</span>
                          </div>
                          <div>
                            <span className="font-medium">Assigned:</span> {getResourceName(operation.assignedResourceId)}
                          </div>
                        </div>
                        
                        {operation.requiredCapabilities && operation.requiredCapabilities.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">Required Capabilities:</p>
                            <div className="flex flex-wrap gap-1">
                              {operation.requiredCapabilities.map((capId) => (
                                <Badge key={capId} variant="outline" className="text-xs">
                                  {getCapabilityName(capId)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {operation.description && (
                          <p className="text-sm text-gray-600">{operation.description}</p>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditOperation(operation)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteOperation(operation.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={createJobMutation.isPending}>
            {createJobMutation.isPending ? (job ? "Updating..." : "Creating...") : (job ? "Update Job" : "Create Job")}
          </Button>
        </div>
        </form>
      </Form>

      {/* Operation Dialog */}
      <Dialog open={operationDialogOpen} onOpenChange={handleOperationDialogClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOperation ? "Edit Operation" : "Add Operation"}
            </DialogTitle>
          </DialogHeader>
          <OperationForm
            operation={editingOperation || undefined}
            jobs={job ? [job] : []}
            capabilities={capabilities}
            resources={resources}
            onSuccess={handleOperationDialogClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

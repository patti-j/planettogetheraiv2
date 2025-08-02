import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertDiscreteOperationSchema } from "@shared/schema";
import type { DiscreteOperation, ProductionOrder, Capability, Resource } from "@shared/schema";

const operationFormSchema = insertDiscreteOperationSchema.extend({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
}).omit({
  createdAt: true,
  updatedAt: true,
});

type OperationFormData = z.infer<typeof operationFormSchema>;

interface OperationFormProps {
  operation?: DiscreteOperation;
  jobs: ProductionOrder[];
  capabilities: Capability[];
  resources: Resource[];
  onSuccess?: () => void;
}

export default function OperationForm({ 
  operation, 
  jobs, 
  capabilities, 
  resources, 
  onSuccess 
}: OperationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!operation;

  const form = useForm<OperationFormData>({
    resolver: zodResolver(operationFormSchema),
    defaultValues: {
      routingId: operation?.routingId || 1,
      operationName: operation?.operationName || "",
      description: operation?.description || "",
      status: operation?.status || "planned",
      standardDuration: operation?.standardDuration || 8,
      sequenceNumber: operation?.sequenceNumber || 1,
      workCenterId: operation?.workCenterId || undefined,
      priority: operation?.priority || 5,
      completionPercentage: operation?.completionPercentage || 0,
      qualityCheckRequired: operation?.qualityCheckRequired || false,
      qualityStatus: operation?.qualityStatus || "pending",
      startTime: operation?.startTime ? new Date(operation.startTime).toISOString().slice(0, 16) : "",
      endTime: operation?.endTime ? new Date(operation.endTime).toISOString().slice(0, 16) : "",
      notes: operation?.notes || "",
    },
  });

  const createOperationMutation = useMutation({
    mutationFn: async (data: OperationFormData) => {
      const operationData = {
        ...data,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
      };
      const response = await apiRequest("POST", "/api/operations", operationData);
      return response.json();
    },
    onSuccess: (newOperation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", newOperation.jobId, "operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({ title: "Operation created successfully" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to create operation", variant: "destructive" });
    },
  });

  const updateOperationMutation = useMutation({
    mutationFn: async (data: OperationFormData) => {
      const operationData = {
        ...data,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
      };
      const response = await apiRequest("PUT", `/api/operations/${operation!.id}`, operationData);
      return response.json();
    },
    onSuccess: (updatedOperation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", updatedOperation.jobId, "operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({ title: "Operation updated successfully" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to update operation", variant: "destructive" });
    },
  });

  const onSubmit = (data: OperationFormData) => {
    if (isEditing) {
      updateOperationMutation.mutate(data);
    } else {
      createOperationMutation.mutate(data);
    }
  };

  const selectedCapabilities = form.watch("requiredCapabilities") || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="jobId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Operation Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter operation name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (hours)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="8" 
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
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assignedResourceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assigned Resource</FormLabel>
              <Select onValueChange={(value) => field.onChange(value === "unassigned" ? undefined : parseInt(value))} value={field.value?.toString() || "unassigned"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resource" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {resources.map((resource) => (
                    <SelectItem key={resource.id} value={resource.id.toString()}>
                      {resource.name} ({resource.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requiredCapabilities"
          render={() => (
            <FormItem>
              <FormLabel>Required Capabilities</FormLabel>
              <div className="space-y-2">
                {capabilities.map((capability) => (
                  <div key={capability.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`capability-${capability.id}`}
                      checked={selectedCapabilities.includes(capability.id)}
                      onCheckedChange={(checked) => {
                        const currentValue = form.getValues("requiredCapabilities") || [];
                        if (checked) {
                          form.setValue("requiredCapabilities", [...currentValue, capability.id]);
                        } else {
                          form.setValue("requiredCapabilities", currentValue.filter(id => id !== capability.id));
                        }
                      }}
                    />
                    <label htmlFor={`capability-${capability.id}`} className="text-sm">
                      {capability.name}
                    </label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time (Optional)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time (Optional)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
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
                <Textarea placeholder="Operation description" rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={createOperationMutation.isPending || updateOperationMutation.isPending}>
            {(createOperationMutation.isPending || updateOperationMutation.isPending) ? 
              (isEditing ? "Updating..." : "Creating...") : 
              (isEditing ? "Update Operation" : "New Operation")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}

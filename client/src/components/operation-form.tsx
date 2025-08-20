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
import { insertPtPublishJobOperationsSchema, ptPublishJobOperations } from "@shared/pt-publish-schema";
import type { PtPublishJobOperation } from "@shared/pt-publish-schema";
import type { ProductionOrder, Capability, Resource } from "@shared/schema";

const operationFormSchema = z.object({
  jobId: z.number(),
  operationId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  cycleHrs: z.string().optional(),
  sequenceNumber: z.number().optional(),
  scheduledStart: z.date().optional(),
  scheduledEnd: z.date().optional(),
  defaultResourceId: z.number().optional(),
  priority: z.number().optional(),
  percentFinished: z.number().optional(),
  notes: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

type OperationFormData = z.infer<typeof operationFormSchema>;

interface OperationFormProps {
  operation?: PtPublishJobOperation;
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
      jobId: operation?.jobId || 1,
      operationId: operation?.operationId || `OP-${Date.now()}`,
      name: operation?.name || "",
      description: operation?.description || "",
      cycleHrs: operation?.cycleHrs || "8",
      sequenceNumber: operation?.sequenceNumber || 1,
      defaultResourceId: operation?.defaultResourceId || undefined,
      priority: operation?.priority || 5,
      percentFinished: operation?.percentFinished || 0,
      scheduledStart: operation?.scheduledStart || undefined,
      scheduledEnd: operation?.scheduledEnd || undefined,
      startTime: operation?.scheduledStart ? new Date(operation.scheduledStart).toISOString().slice(0, 16) : "",
      endTime: operation?.scheduledEnd ? new Date(operation.scheduledEnd).toISOString().slice(0, 16) : "",
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

  // Remove capabilities watch since PT schema doesn't have this field
  // const selectedCapabilities = form.watch("requiredCapabilities") || [];

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
          name="cycleHrs"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cycle Time (hours)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="8" 
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sequenceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sequence Number</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="1" 
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
          name="defaultResourceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Resource</FormLabel>
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
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority (1-10)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1" 
                  max="10" 
                  placeholder="5" 
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
          name="percentFinished"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Percent Complete (%)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  max="100" 
                  placeholder="0" 
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
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

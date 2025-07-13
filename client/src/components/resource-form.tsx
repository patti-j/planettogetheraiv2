import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertResourceSchema } from "@shared/schema";
import type { Resource, Capability } from "@shared/schema";

const resourceFormSchema = insertResourceSchema;

type ResourceFormData = z.infer<typeof resourceFormSchema>;

interface ResourceFormProps {
  resource?: Resource;
  capabilities: Capability[];
  onSuccess?: () => void;
}

export default function ResourceForm({ 
  resource, 
  capabilities, 
  onSuccess 
}: ResourceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!resource;

  const form = useForm<ResourceFormData>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      name: resource?.name || "",
      type: resource?.type || "",
      status: resource?.status || "active",
      capabilities: resource?.capabilities || [],
    },
  });

  const createResourceMutation = useMutation({
    mutationFn: async (data: ResourceFormData) => {
      const response = await apiRequest("POST", "/api/resources", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({ title: "Resource created successfully" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to create resource", variant: "destructive" });
    },
  });

  const updateResourceMutation = useMutation({
    mutationFn: async (data: ResourceFormData) => {
      const response = await apiRequest("PUT", `/api/resources/${resource!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({ title: "Resource updated successfully" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to update resource", variant: "destructive" });
    },
  });

  const onSubmit = (data: ResourceFormData) => {
    if (isEditing) {
      updateResourceMutation.mutate(data);
    } else {
      createResourceMutation.mutate(data);
    }
  };

  const selectedCapabilities = form.watch("capabilities") || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resource Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter resource name" {...field} />
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
              <FormLabel>Resource Type</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Machine, Station, Equipment" {...field} />
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
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capabilities"
          render={() => (
            <FormItem>
              <FormLabel>Capabilities</FormLabel>
              <div className="space-y-2">
                {capabilities.map((capability) => (
                  <div key={capability.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`capability-${capability.id}`}
                      checked={selectedCapabilities.includes(capability.id)}
                      onCheckedChange={(checked) => {
                        const currentValue = form.getValues("capabilities") || [];
                        if (checked) {
                          form.setValue("capabilities", [...currentValue, capability.id]);
                        } else {
                          form.setValue("capabilities", currentValue.filter(id => id !== capability.id));
                        }
                      }}
                    />
                    <label htmlFor={`capability-${capability.id}`} className="text-sm">
                      {capability.name}
                      {capability.description && (
                        <span className="text-gray-500 ml-1">- {capability.description}</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={createResourceMutation.isPending || updateResourceMutation.isPending}>
            {(createResourceMutation.isPending || updateResourceMutation.isPending) ? 
              (isEditing ? "Updating..." : "Creating...") : 
              (isEditing ? "Update Resource" : "Create Resource")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}

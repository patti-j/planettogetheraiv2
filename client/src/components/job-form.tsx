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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertJobSchema, type Job } from "@shared/schema";

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

  const onSubmit = (data: JobFormData) => {
    createJobMutation.mutate(data);
  };

  return (
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

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={createJobMutation.isPending}>
            {createJobMutation.isPending ? "Creating..." : "Create Job"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

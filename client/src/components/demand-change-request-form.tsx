import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const demandChangeRequestSchema = z.object({
  requestType: z.enum(['increase', 'decrease', 'timeline_change', 'product_mix', 'cancellation']),
  requestedBy: z.number(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  businessJustification: z.string().min(20, "Business justification must be at least 20 characters"),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  demandForecastId: z.number().optional(),
  plantId: z.number().optional(),
  proposedValues: z.object({
    quantity: z.number().optional(),
    targetDate: z.string().optional(),
    productMix: z.array(z.object({
      productId: z.number(),
      quantity: z.number(),
      percentage: z.number().optional()
    })).optional(),
    timeline: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      milestones: z.array(z.object({
        name: z.string(),
        date: z.string(),
        description: z.string().optional()
      })).optional()
    }).optional()
  }),
  impactAnalysis: z.object({
    costImpact: z.number().optional(),
    resourceImpact: z.string().optional(),
    timelineImpact: z.string().optional(),
    riskAssessment: z.string().optional()
  }).optional(),
  approvalDeadline: z.string().optional(),
  implementationDeadline: z.string().optional()
});

type DemandChangeRequestFormData = z.infer<typeof demandChangeRequestSchema>;

interface DemandChangeRequestFormProps {
  onCancel: () => void;
  onSuccess: (id: number) => void;
}

export default function DemandChangeRequestForm({ onCancel, onSuccess }: DemandChangeRequestFormProps) {
  const [isDraft, setIsDraft] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DemandChangeRequestFormData>({
    resolver: zodResolver(demandChangeRequestSchema),
    defaultValues: {
      requestedBy: 1, // TODO: Get from current user context
      priority: 'medium',
      proposedValues: {},
      impactAnalysis: {}
    },
  });

  const { data: demandForecasts = [] } = useQuery({
    queryKey: ["/api/demand-forecasts"],
  });

  const { data: plants = [] } = useQuery({
    queryKey: ["/api/plants"],
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: DemandChangeRequestFormData & { status?: string }) => {
      return apiRequest("/api/demand-change-requests", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/demand-change-requests"] });
      toast({
        title: isDraft ? "Draft saved" : "Request submitted",
        description: isDraft 
          ? "Your change request has been saved as a draft."
          : "Your change request has been submitted for review.",
      });
      onSuccess(result.id);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create change request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DemandChangeRequestFormData) => {
    const requestData = {
      ...data,
      status: isDraft ? 'draft' : 'submitted',
      createdBy: data.requestedBy,
    };
    createRequestMutation.mutate(requestData);
  };

  const requestType = form.watch('requestType');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onCancel} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Change Request</h1>
            <p className="text-gray-600">Submit a new demand change request for review</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="requestType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Request Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select request type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="increase">Demand Increase</SelectItem>
                            <SelectItem value="decrease">Demand Decrease</SelectItem>
                            <SelectItem value="timeline_change">Timeline Change</SelectItem>
                            <SelectItem value="product_mix">Product Mix Change</SelectItem>
                            <SelectItem value="cancellation">Order Cancellation</SelectItem>
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
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
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
                          placeholder="Describe the change request in detail..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessJustification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Justification</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Explain the business reasons for this change..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {demandForecasts.length > 0 && (
                    <FormField
                      control={form.control}
                      name="demandForecastId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Related Demand Forecast (Optional)</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select forecast" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {demandForecasts.map((forecast: any) => (
                                <SelectItem key={forecast.id} value={forecast.id.toString()}>
                                  {forecast.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {plants.length > 0 && (
                    <FormField
                      control={form.control}
                      name="plantId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plant (Optional)</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select plant" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {plants.map((plant: any) => (
                                <SelectItem key={plant.id} value={plant.id.toString()}>
                                  {plant.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="approvalDeadline">Approval Deadline (Optional)</Label>
                    <Input
                      id="approvalDeadline"
                      type="datetime-local"
                      {...form.register('approvalDeadline')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="implementationDeadline">Implementation Deadline (Optional)</Label>
                    <Input
                      id="implementationDeadline"
                      type="datetime-local"
                      {...form.register('implementationDeadline')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Proposed Values Section - Dynamic based on request type */}
            {requestType && (
              <Card>
                <CardHeader>
                  <CardTitle>Proposed Changes</CardTitle>
                </CardHeader>
                <CardContent>
                  {(requestType === 'increase' || requestType === 'decrease') && (
                    <div>
                      <Label htmlFor="quantity">Quantity Change</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="Enter quantity change"
                        {...form.register('proposedValues.quantity', { valueAsNumber: true })}
                      />
                    </div>
                  )}

                  {requestType === 'timeline_change' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startDate">New Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            {...form.register('proposedValues.timeline.startDate')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="endDate">New End Date</Label>
                          <Input
                            id="endDate"
                            type="date"
                            {...form.register('proposedValues.timeline.endDate')}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Impact Analysis Section */}
            <Card>
              <CardHeader>
                <CardTitle>Impact Analysis (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="costImpact">Cost Impact ($)</Label>
                    <Input
                      id="costImpact"
                      type="number"
                      step="0.01"
                      placeholder="Enter cost impact"
                      {...form.register('impactAnalysis.costImpact', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="resourceImpact">Resource Impact</Label>
                    <Input
                      id="resourceImpact"
                      placeholder="Describe resource impact"
                      {...form.register('impactAnalysis.resourceImpact')}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="timelineImpact">Timeline Impact</Label>
                  <Textarea
                    id="timelineImpact"
                    placeholder="Describe timeline impact..."
                    {...form.register('impactAnalysis.timelineImpact')}
                  />
                </div>

                <div>
                  <Label htmlFor="riskAssessment">Risk Assessment</Label>
                  <Textarea
                    id="riskAssessment"
                    placeholder="Assess risks associated with this change..."
                    {...form.register('impactAnalysis.riskAssessment')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="outline"
                onClick={() => setIsDraft(true)}
                disabled={createRequestMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
              <Button
                type="submit"
                onClick={() => setIsDraft(false)}
                disabled={createRequestMutation.isPending}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Submit Request
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
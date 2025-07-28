import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar, CalendarIcon, Plus, Target, Clock, CheckCircle, AlertCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import type { ProductionPlan, ProductionTarget, ResourceAllocation, ProductionMilestone, Plant, Job, Resource } from '@shared/schema';

// Form schemas
const productionPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional(),
  plantId: z.number().min(1, "Plant is required"),
  planType: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).default('weekly'),
  startDate: z.date(),
  endDate: z.date(),
  targetUnits: z.number().min(0, "Target units must be non-negative"),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  createdBy: z.string().min(1, "Created by is required"),
});

type ProductionPlanFormData = z.infer<typeof productionPlanSchema>;

export default function ProductionPlanningPage() {
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch data
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['/api/production-plans'],
  });

  const { data: plants = [] } = useQuery({
    queryKey: ['/api/plants'],
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/jobs'],
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['/api/resources'],
  });

  const { data: targets = [] } = useQuery({
    queryKey: ['/api/production-targets'],
    enabled: !!selectedPlan,
  });

  const { data: allocations = [] } = useQuery({
    queryKey: ['/api/resource-allocations'],
    enabled: !!selectedPlan,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['/api/production-milestones'],
    enabled: !!selectedPlan,
  });

  // Create production plan form
  const form = useForm<ProductionPlanFormData>({
    resolver: zodResolver(productionPlanSchema),
    defaultValues: {
      planType: 'weekly',
      priority: 'medium',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      targetUnits: 100,
      createdBy: 'Current User', // In real app, get from auth context
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: ProductionPlanFormData) => {
      const response = await fetch('/api/production-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          status: 'draft',
        }),
      });
      if (!response.ok) throw new Error('Failed to create production plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/production-plans'] });
      setCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Production plan created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create production plan",
        variant: "destructive",
      });
    },
  });

  const approvePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      const response = await fetch(`/api/production-plans/${planId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: 'Current User' }),
      });
      if (!response.ok) throw new Error('Failed to approve plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/production-plans'] });
      toast({
        title: "Success",
        description: "Production plan approved successfully",
      });
    },
  });

  const onSubmit = (data: ProductionPlanFormData) => {
    createPlanMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = (plan: ProductionPlan) => {
    if (plan.targetUnits === 0) return 0;
    return Math.round((plan.actualUnits / plan.targetUnits) * 100);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="md:ml-0 ml-12">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6" />
            Production Planning
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Plan and track production goals, resource allocation, and delivery milestones
          </p>
        </div>
        
        <div className="flex gap-2 lg:flex-shrink-0">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Production Plan</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plan Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Q1 Production Plan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="plantId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plant</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select plant" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {plants.map((plant: Plant) => (
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
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Plan description..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="planType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plan Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="targetUnits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Units</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date("1900-01-01")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date("1900-01-01")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createPlanMutation.isPending}>
                      {createPlanMutation.isPending ? 'Creating...' : 'Create Plan'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {plansLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Production Plans</h3>
            <p className="text-gray-600">
              Get started by creating your first production plan using the "New Plan" button above to track goals and allocate resources.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan: ProductionPlan) => {
            const progress = calculateProgress(plan);
            const plant = plants.find((p: Plant) => p.id === plan.plantId);
            
            return (
              <Card 
                key={plan.id} 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedPlan?.id === plan.id && "ring-2 ring-blue-500"
                )}
                onClick={() => setSelectedPlan(plan)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="flex gap-1">
                      <Badge className={getStatusColor(plan.status)}>
                        {plan.status}
                      </Badge>
                      <Badge className={getPriorityColor(plan.priority)}>
                        {plan.priority}
                      </Badge>
                    </div>
                  </div>
                  {plant && (
                    <p className="text-sm text-gray-600">{plant.name}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{plan.actualUnits} / {plan.targetUnits} units</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">{progress}% complete</p>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Duration</span>
                      <span>{plan.planType}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Period</span>
                      <span>{format(new Date(plan.startDate), 'MMM d')} - {format(new Date(plan.endDate), 'MMM d')}</span>
                    </div>

                    {plan.status === 'draft' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          approvePlanMutation.mutate(plan.id);
                        }}
                        disabled={approvePlanMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Plan
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {selectedPlan.name} - Detailed View
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="targets">Targets</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="milestones">Milestones</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Target Units</p>
                          <p className="text-2xl font-bold">{selectedPlan.targetUnits.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Actual Units</p>
                          <p className="text-2xl font-bold">{selectedPlan.actualUnits.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium">Efficiency</p>
                          <p className="text-2xl font-bold">{selectedPlan.efficiency || 0}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {selectedPlan.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{selectedPlan.description}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="targets" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Production Targets</h3>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Target
                  </Button>
                </div>
                {targets.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No production targets defined for this plan.</p>
                ) : (
                  <div className="space-y-3">
                    {targets.map((target: ProductionTarget) => {
                      const job = jobs.find((j: Job) => j.id === target.jobId);
                      return (
                        <Card key={target.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{job?.name || `Job ${target.jobId}`}</h4>
                                <p className="text-sm text-gray-600">Target: {target.targetQuantity} units</p>
                                <p className="text-sm text-gray-600">
                                  {format(new Date(target.targetStartDate), 'MMM d')} - {format(new Date(target.targetEndDate), 'MMM d')}
                                </p>
                              </div>
                              <Badge className={getStatusColor(target.status)}>
                                {target.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="resources" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Resource Allocations</h3>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Allocate Resource
                  </Button>
                </div>
                {allocations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No resource allocations defined for this plan.</p>
                ) : (
                  <div className="space-y-3">
                    {allocations.map((allocation: ResourceAllocation) => {
                      const resource = resources.find((r: Resource) => r.id === allocation.resourceId);
                      return (
                        <Card key={allocation.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{resource?.name || `Resource ${allocation.resourceId}`}</h4>
                                <p className="text-sm text-gray-600">
                                  {allocation.allocationType} - {allocation.allocatedHours}h allocated
                                </p>
                                <p className="text-sm text-gray-600">
                                  Target utilization: {allocation.utilizationTarget}%
                                </p>
                              </div>
                              <Badge className={getStatusColor(allocation.status)}>
                                {allocation.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="milestones" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Production Milestones</h3>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Milestone
                  </Button>
                </div>
                {milestones.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No milestones defined for this plan.</p>
                ) : (
                  <div className="space-y-3">
                    {milestones.map((milestone: ProductionMilestone) => (
                      <Card key={milestone.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{milestone.name}</h4>
                              {milestone.description && (
                                <p className="text-sm text-gray-600">{milestone.description}</p>
                              )}
                              <p className="text-sm text-gray-600">
                                Target: {format(new Date(milestone.targetDate), 'MMM d, yyyy')}
                              </p>
                              {milestone.actualDate && (
                                <p className="text-sm text-green-600">
                                  Completed: {format(new Date(milestone.actualDate), 'MMM d, yyyy')}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(milestone.status)}>
                                {milestone.status}
                              </Badge>
                              {milestone.status === 'pending' && (
                                <Button size="sm" variant="outline">
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import React, { useState, useMemo, useEffect } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, CalendarIcon, Plus, Target, Clock, CheckCircle, AlertCircle, TrendingUp, BarChart3, Users, Settings, Factory, Package, Zap, TimerIcon, AlertTriangle, FileText, Edit2, Trash2, Copy, Download, Upload, Filter, Search, RotateCcw, Forward, Eye, EyeOff, Move, ArrowRight, ArrowLeft, Maximize2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { format, differenceInDays, addDays, startOfWeek, endOfWeek, addWeeks, addMonths, addQuarters, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, isAfter, isBefore, isWithinInterval } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { apiRequest } from '@/lib/queryClient';
import type { ProductionPlan, ProductionTarget, ResourceAllocation, ProductionMilestone, Plant, ProductionOrder, Resource, DemandForecast, PlannedOrder } from '@shared/schema';

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
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'gantt' | 'capacity'>('timeline');
  const [activeTab, setActiveTab] = useState('future-planning');
  const [filterPlant, setFilterPlant] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('next-3-months');
  const [planningHorizon, setPlanningHorizon] = useState<string>('12-weeks');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailView, setShowDetailView] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const queryClient = useQueryClient();

  // Fetch comprehensive production data with enhanced future planning
  const { data: plans = [], isLoading: plansLoading } = useQuery<ProductionPlan[]>({
    queryKey: ['/api/production-plans'],
  });

  const { data: plants = [] } = useQuery<Plant[]>({
    queryKey: ['/api/plants'],
  });

  const { data: productionOrders = [] } = useQuery<ProductionOrder[]>({
    queryKey: ['/api/production-orders'],
  });

  const { data: plannedOrders = [] } = useQuery<PlannedOrder[]>({
    queryKey: ['/api/planned-orders'],
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ['/api/resources'],
  });

  const { data: targets = [] } = useQuery<ProductionTarget[]>({
    queryKey: ['/api/production-targets'],
  });

  const { data: allocations = [] } = useQuery<ResourceAllocation[]>({
    queryKey: ['/api/resource-allocations'],
  });

  const { data: milestones = [] } = useQuery<ProductionMilestone[]>({
    queryKey: ['/api/production-milestones'],
  });

  const { data: forecasts = [] } = useQuery<DemandForecast[]>({
    queryKey: ['/api/demand-forecasts'],
  });

  // Calculate plan metrics and insights
  const planMetrics = useMemo(() => {
    if (!selectedPlan) return null;
    
    const planTargets = targets.filter(t => t.planId === selectedPlan.id);
    const planAllocations = allocations.filter(a => a.planId === selectedPlan.id);
    const planMilestones = milestones.filter(m => m.planId === selectedPlan.id);
    
    const totalTargetQuantity = planTargets.reduce((sum, t) => sum + t.targetQuantity, 0);
    const completedTargets = planTargets.filter(t => t.status === 'completed').length;
    const allocatedResources = planAllocations.length;
    const completedMilestones = planMilestones.filter(m => m.status === 'completed').length;
    
    const completionPercentage = planTargets.length > 0 ? (completedTargets / planTargets.length) * 100 : 0;
    
    return {
      totalTargets: planTargets.length,
      completedTargets,
      totalTargetQuantity,
      allocatedResources,
      totalMilestones: planMilestones.length,
      completedMilestones,
      completionPercentage
    };
  }, [selectedPlan, targets, allocations, milestones]);

  // Enhanced future planning data with horizon calculations
  const planningHorizonData = useMemo(() => {
    const now = new Date();
    let endDate = new Date();
    
    switch (planningHorizon) {
      case '6-weeks':
        endDate = addWeeks(now, 6);
        break;
      case '12-weeks':
        endDate = addWeeks(now, 12);
        break;
      case '6-months':
        endDate = addMonths(now, 6);
        break;
      case '12-months':
        endDate = addMonths(now, 12);
        break;
      default:
        endDate = addWeeks(now, 12);
    }
    
    return { startDate: now, endDate };
  }, [planningHorizon]);

  // Filter and organize production data with future focus
  const filteredPlans = useMemo(() => {
    let filtered = [...plans];
    
    if (filterPlant !== 'all') {
      filtered = filtered.filter(plan => plan.plantId === parseInt(filterPlant));
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(plan => plan.status === filterStatus);
    }
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(plan => 
        plan.name.toLowerCase().includes(search) ||
        plan.description?.toLowerCase().includes(search)
      );
    }
    
    if (filterPeriod !== 'all') {
      const now = new Date();
      switch (filterPeriod) {
        case 'current':
          filtered = filtered.filter(plan => 
            new Date(plan.startDate) <= now && new Date(plan.endDate) >= now
          );
          break;
        case 'next-month':
          const nextMonth = addMonths(now, 1);
          filtered = filtered.filter(plan => 
            new Date(plan.startDate) <= nextMonth && new Date(plan.endDate) >= now
          );
          break;
        case 'next-3-months':
          const next3Months = addMonths(now, 3);
          filtered = filtered.filter(plan => 
            new Date(plan.startDate) <= next3Months && new Date(plan.endDate) >= now
          );
          break;
        case 'next-6-months':
          const next6Months = addMonths(now, 6);
          filtered = filtered.filter(plan => 
            new Date(plan.startDate) <= next6Months && new Date(plan.endDate) >= now
          );
          break;
        case 'future':
          filtered = filtered.filter(plan => new Date(plan.startDate) > now);
          break;
        case 'past':
          filtered = filtered.filter(plan => new Date(plan.endDate) < now);
          break;
      }
    }
    
    return filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [plans, filterPlant, filterStatus, filterPeriod, searchTerm]);

  // Future capacity and demand analysis
  const futureAnalysis = useMemo(() => {
    const { startDate, endDate } = planningHorizonData;
    const now = new Date();
    
    // Future production orders within horizon
    const futureOrders = productionOrders.filter(order => {
      const orderDate = new Date(order.dueDate || order.scheduledStartDate || now);
      return isAfter(orderDate, startDate) && isBefore(orderDate, endDate);
    });
    
    // Planned orders for future production
    const futurePlannedOrders = plannedOrders.filter(order => {
      const orderDate = new Date(order.requiredDate);
      return isAfter(orderDate, startDate) && isBefore(orderDate, endDate);
    });
    
    // Future demand from forecasts
    const futureDemand = forecasts.filter(forecast => {
      const forecastDate = new Date(forecast.forecastDate);
      return isAfter(forecastDate, startDate) && isBefore(forecastDate, endDate);
    });
    
    // Resource availability analysis
    const resourceUtilization = resources.map(resource => {
      const allocatedHours = allocations
        .filter(alloc => alloc.resourceId === resource.id)
        .reduce((sum, alloc) => sum + alloc.allocatedHours, 0);
      
      return {
        resourceId: resource.id,
        resourceName: resource.name,
        type: resource.type,
        totalAllocated: allocatedHours,
        utilization: allocatedHours > 0 ? Math.min(100, (allocatedHours / 160) * 100) : 0, // Assume 160 hours/month capacity
        status: resource.status
      };
    });
    
    return {
      futureOrders,
      futurePlannedOrders,
      futureDemand,
      resourceUtilization,
      totalFutureCapacity: futureOrders.length + futurePlannedOrders.length,
      demandVolume: futureDemand.reduce((sum, d) => sum + d.forecastQuantity, 0)
    };
  }, [planningHorizonData, productionOrders, plannedOrders, forecasts, resources, allocations]);

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

  // Set default plant when plants are loaded
  useEffect(() => {
    if (plants.length > 0 && !form.getValues('plantId')) {
      form.setValue('plantId', plants[0].id);
    }
  }, [plants, form]);

  const createPlanMutation = useMutation({
    mutationFn: async (data: ProductionPlanFormData) => {
      return await apiRequest('POST', '/api/production-plans', {
        ...data,
        status: 'draft',
      });
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
    onError: (error: any) => {
      console.error("Production plan creation error:", error);
      const errorMessage = error?.message || "Failed to create production plan";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const approvePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      return await apiRequest('PATCH', `/api/production-plans/${planId}/approve`, {
        approvedBy: 'Current User'
      });
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
      {/* Header Section with Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="md:ml-0 ml-12">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            Production Planning
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            Create, manage, and track comprehensive production plans with resource allocation and milestone tracking
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 lg:flex-shrink-0">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Plans
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
          </Button>
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
              <div className="text-sm text-gray-600 mb-4">
                Create a comprehensive production plan with targets, milestones, and resource allocation.
              </div>
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
                    <FormField
                      control={form.control}
                      name="targetUnits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Units</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="1000" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
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
                        <FormItem className="flex flex-col">
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
                                disabled={(date) =>
                                  date < new Date()
                                }
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
                        <FormItem className="flex flex-col">
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
                                disabled={(date) =>
                                  date < new Date()
                                }
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
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createPlanMutation.isPending}>
                      {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Production Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Plans</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{plans.length}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Plans</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {plans.filter(p => p.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resources Allocated</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{allocations.length}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {plans.length > 0 ? Math.round((plans.filter(p => p.status === 'completed').length / plans.length) * 100) : 0}%
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Enhanced Future Planning Controls */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <div>
              <Label htmlFor="planningHorizon" className="text-sm font-medium">Planning Horizon</Label>
              <Select value={planningHorizon} onValueChange={setPlanningHorizon}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Select horizon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6-weeks">6 Weeks</SelectItem>
                  <SelectItem value="12-weeks">12 Weeks</SelectItem>
                  <SelectItem value="6-months">6 Months</SelectItem>
                  <SelectItem value="12-months">12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="plantFilter" className="text-sm font-medium">Plant</Label>
              <Select value={filterPlant} onValueChange={setFilterPlant}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Plants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plants</SelectItem>
                  {plants.map((plant: Plant) => (
                    <SelectItem key={plant.id} value={plant.id.toString()}>
                      {plant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="periodFilter" className="text-sm font-medium">Time Period</Label>
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="next-month">Next Month</SelectItem>
                  <SelectItem value="next-3-months">Next 3 Months</SelectItem>
                  <SelectItem value="next-6-months">Next 6 Months</SelectItem>
                  <SelectItem value="future">All Future</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="search" className="text-sm font-medium">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-40"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('timeline')}
              className="flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Timeline
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </Button>
            <Button
              variant={viewMode === 'capacity' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('capacity')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Capacity
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetailView(!showDetailView)}
              className="flex items-center gap-2"
            >
              {showDetailView ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showDetailView ? 'Simple' : 'Details'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content with Enhanced Future Planning Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="future-planning">Future Planning</TabsTrigger>
          <TabsTrigger value="capacity-analysis">Capacity Analysis</TabsTrigger>
          <TabsTrigger value="demand-forecast">Demand & Forecast</TabsTrigger>
          <TabsTrigger value="production-plans">Production Plans</TabsTrigger>
          <TabsTrigger value="modifications">Plan Modifications</TabsTrigger>
        </TabsList>

        {/* Future Planning Tab - Primary focus */}
        <TabsContent value="future-planning" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Future Planning Timeline */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Forward className="w-5 h-5 text-blue-600" />
                      Future Planning Horizon ({planningHorizon})
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit2 className="w-4 h-4" />
                        Modify
                      </Button>
                      <Button variant="outline" size="sm">
                        <RotateCcw className="w-4 h-4" />
                        Refresh
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Planning Horizon Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Future Orders</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{futureAnalysis.totalFutureCapacity}</p>
                        <p className="text-xs text-gray-600">Production + Planned</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">Demand Volume</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{futureAnalysis.demandVolume.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">Forecasted Units</p>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium">Resource Load</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">
                          {Math.round(futureAnalysis.resourceUtilization.reduce((avg, r) => avg + r.utilization, 0) / futureAnalysis.resourceUtilization.length)}%
                        </p>
                        <p className="text-xs text-gray-600">Avg Utilization</p>
                      </div>
                    </div>

                    {/* Future Timeline View */}
                    {viewMode === 'timeline' && (
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <ArrowRight className="w-4 h-4" />
                          Future Production Orders Timeline
                        </h4>
                        {futureAnalysis.futureOrders.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No future production orders found in planning horizon</p>
                            <p className="text-sm">Expand horizon or add planned orders</p>
                          </div>
                        ) : (
                          futureAnalysis.futureOrders.slice(0, 10).map((order) => (
                            <Card key={order.id} className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <div>
                                    <p className="font-medium">{order.orderNumber}</p>
                                    <p className="text-sm text-gray-600">{order.description}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">
                                    {format(new Date(order.dueDate || order.scheduledStartDate), 'MMM dd, yyyy')}
                                  </p>
                                  <Badge variant="outline">{order.status}</Badge>
                                </div>
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    )}

                    {/* Future Planned Orders */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Planned Orders ({futureAnalysis.futurePlannedOrders.length})
                      </h4>
                      {futureAnalysis.futurePlannedOrders.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                          <Target className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No planned orders in horizon</p>
                        </div>
                      ) : (
                        futureAnalysis.futurePlannedOrders.slice(0, 5).map((order, index) => (
                          <Card key={index} className="p-3 border-dashed">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <div>
                                  <p className="font-medium">{order.materialNumber}</p>
                                  <p className="text-sm text-gray-600">Qty: {order.quantity}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  {format(new Date(order.requiredDate), 'MMM dd, yyyy')}
                                </p>
                                <Badge variant="secondary">Planned</Badge>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Future Planning Controls */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Planning Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Planning Actions</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <Button variant="outline" size="sm" className="justify-start">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Future Plan
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start">
                        <Move className="w-4 h-4 mr-2" />
                        Adjust Timeline
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start">
                        <Maximize2 className="w-4 h-4 mr-2" />
                        Extend Horizon
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Quick Filters</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <Button 
                        variant={filterStatus === 'all' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setFilterStatus('all')}
                        className="justify-start"
                      >
                        All Orders
                      </Button>
                      <Button 
                        variant={filterStatus === 'high' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setFilterStatus('high')}
                        className="justify-start"
                      >
                        High Priority
                      </Button>
                      <Button 
                        variant={filterStatus === 'critical' ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setFilterStatus('critical')}
                        className="justify-start"
                      >
                        Critical Orders
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Planning Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {futureAnalysis.resourceUtilization.filter(r => r.utilization > 90).length > 0 && (
                      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                          High Resource Utilization
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-300">
                          {futureAnalysis.resourceUtilization.filter(r => r.utilization > 90).length} resources over 90%
                        </p>
                      </div>
                    )}
                    {futureAnalysis.futureOrders.length === 0 && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Planning Opportunity
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-300">
                          No future orders - consider adding planned production
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Capacity Analysis Tab */}
        <TabsContent value="capacity-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Resource Capacity Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {futureAnalysis.resourceUtilization.map((resource) => (
                  <div key={resource.resourceId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{resource.resourceName}</p>
                        <p className="text-sm text-gray-600">{resource.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{Math.round(resource.utilization)}%</p>
                        <Badge 
                          variant={resource.utilization > 90 ? 'destructive' : resource.utilization > 70 ? 'secondary' : 'outline'}
                        >
                          {resource.status}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={resource.utilization} className="h-2" />
                    {resource.utilization > 90 && (
                      <p className="text-xs text-red-600">⚠️ Capacity constraint - consider load balancing</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demand & Forecast Tab */}
        <TabsContent value="demand-forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Demand Forecasting & Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {futureAnalysis.futureDemand.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No demand forecasts available</p>
                    <p className="text-sm">Add forecasting data to enable demand planning</p>
                  </div>
                ) : (
                  futureAnalysis.futureDemand.slice(0, 10).map((forecast, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Forecast #{forecast.id}</p>
                          <p className="text-sm text-gray-600">{forecast.forecastMethod}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{forecast.forecastQuantity} units</p>
                          <p className="text-xs text-gray-600">
                            {format(new Date(forecast.forecastDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production Plans Tab */}
        <TabsContent value="production-plans" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Plans List */}
            <div className="lg:col-span-2 space-y-4">
              {viewMode === 'timeline' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Production Plans ({filteredPlans.length})</span>
                  {plansLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredPlans.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Factory className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No production plans found matching your filters.</p>
                    <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Plan
                    </Button>
                  </div>
                ) : (
                  filteredPlans.map((plan: ProductionPlan) => {
                    const plant = plants.find((p: Plant) => p.id === plan.plantId);
                    const progress = calculateProgress(plan);
                    const daysRemaining = differenceInDays(new Date(plan.endDate), new Date());
                    
                    return (
                      <Card 
                        key={plan.id} 
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800",
                          selectedPlan?.id === plan.id && "ring-2 ring-blue-500"
                        )}
                        onClick={() => setSelectedPlan(plan)}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {plan.name}
                                </h3>
                                <Badge className={getStatusColor(plan.status)}>
                                  {plan.status}
                                </Badge>
                                <Badge className={getPriorityColor(plan.priority)}>
                                  {plan.priority}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Factory className="w-4 h-4" />
                                  {plant?.name || 'Unknown Plant'}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Target className="w-4 h-4" />
                                  {plan.targetUnits} units
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
                                </div>
                              </div>
                              
                              <div className="mt-3">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Progress</span>
                                  <span>{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Edit plan functionality
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Copy plan functionality
                                }}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}

          {viewMode === 'calendar' && (
            <Card>
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Calendar view coming soon</p>
                  <p className="text-sm">View production plans in a calendar format</p>
                </div>
              </CardContent>
            </Card>
          )}

              {viewMode === 'capacity' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Capacity Chart View</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Capacity chart view coming soon</p>
                      <p className="text-sm">Visualize production capacity and utilization</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Plan Details Panel */}
            <div className="space-y-4">
              {selectedPlan ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{selectedPlan.name}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {planMetrics && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{planMetrics.totalTargets}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Targets</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{planMetrics.completedTargets}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{planMetrics.allocatedResources}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Resources</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">{Math.round(planMetrics.completionPercentage)}%</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-medium mb-2">Plan Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Type:</span>
                            <span className="capitalize">{selectedPlan.planType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                            <span>{format(new Date(selectedPlan.startDate), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">End Date:</span>
                            <span>{format(new Date(selectedPlan.endDate), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Target Units:</span>
                            <span>{selectedPlan.targetUnits}</span>
                          </div>
                        </div>
                      </div>

                      {selectedPlan.description && (
                        <div>
                          <h4 className="font-medium mb-2">Description</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPlan.description}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Select a production plan to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Plan Modifications Tab */}
        <TabsContent value="modifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-purple-600" />
                Plan Modifications & Adjustments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Edit2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Plan modifications interface</p>
                <p className="text-sm">Adjust timelines, resources, and capacity allocations</p>
                <Button className="mt-4" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Modification Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
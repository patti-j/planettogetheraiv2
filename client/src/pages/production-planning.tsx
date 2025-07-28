import React, { useState, useMemo } from 'react';
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
import { Calendar, CalendarIcon, Plus, Target, Clock, CheckCircle, AlertCircle, TrendingUp, BarChart3, Users, Settings, Factory, Package, Zap, TimerIcon, AlertTriangle, FileText, Edit2, Trash2, Copy, Download, Upload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { format, differenceInDays, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { apiRequest } from '@/lib/queryClient';
import type { ProductionPlan, ProductionTarget, ResourceAllocation, ProductionMilestone, Plant, ProductionOrder, Resource } from '@shared/schema';

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
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'gantt'>('list');
  const [activeTab, setActiveTab] = useState('overview');
  const [filterPlant, setFilterPlant] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('current');
  const queryClient = useQueryClient();

  // Fetch comprehensive production data
  const { data: plans = [], isLoading: plansLoading } = useQuery<ProductionPlan[]>({
    queryKey: ['/api/production-plans'],
  });

  const { data: plants = [] } = useQuery<Plant[]>({
    queryKey: ['/api/plants'],
  });

  const { data: productionOrders = [] } = useQuery<ProductionOrder[]>({
    queryKey: ['/api/production-orders'],
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

  // Filter and organize production data
  const filteredPlans = useMemo(() => {
    let filtered = [...plans];
    
    if (filterPlant !== 'all') {
      filtered = filtered.filter(plan => plan.plantId === parseInt(filterPlant));
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(plan => plan.status === filterStatus);
    }
    
    if (filterPeriod !== 'all') {
      const now = new Date();
      switch (filterPeriod) {
        case 'current':
          filtered = filtered.filter(plan => 
            new Date(plan.startDate) <= now && new Date(plan.endDate) >= now
          );
          break;
        case 'upcoming':
          filtered = filtered.filter(plan => new Date(plan.startDate) > now);
          break;
        case 'past':
          filtered = filtered.filter(plan => new Date(plan.endDate) < now);
          break;
      }
    }
    
    return filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [plans, filterPlant, filterStatus, filterPeriod]);

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

      {/* Filters and View Controls */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-3">
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
              <Label htmlFor="statusFilter" className="text-sm font-medium">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="periodFilter" className="text-sm font-medium">Period</Label>
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Periods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              List
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
              variant={viewMode === 'gantt' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('gantt')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Gantt
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content Area - Production Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plans List */}
        <div className="lg:col-span-2 space-y-4">
          {viewMode === 'list' && (
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

          {viewMode === 'gantt' && (
            <Card>
              <CardHeader>
                <CardTitle>Gantt Chart View</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Gantt chart view coming soon</p>
                  <p className="text-sm">Visualize production timeline and dependencies</p>
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

              <Card>
                <CardHeader>
                  <CardTitle>Plan Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start" variant="outline">
                    <Target className="w-4 h-4 mr-2" />
                    Manage Targets
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Allocate Resources
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Set Milestones
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                  {selectedPlan.status === 'draft' && (
                    <Button 
                      className="w-full justify-start" 
                      onClick={() => approvePlanMutation.mutate(selectedPlan.id)}
                      disabled={approvePlanMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {approvePlanMutation.isPending ? 'Approving...' : 'Approve Plan'}
                    </Button>
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
    </div>
  );
}
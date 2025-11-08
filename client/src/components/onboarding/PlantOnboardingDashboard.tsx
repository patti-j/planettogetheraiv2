import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Factory, Plus, Calendar as CalendarIcon, Target, CheckCircle2,
  Clock, Users, FileText, TrendingUp, Package, Settings,
  ChevronRight, AlertCircle, BookTemplate, Copy, Eye,
  Sparkles, BarChart3, Download, Upload, Loader2
} from 'lucide-react';

// Schema for creating new onboarding
const createOnboardingSchema = z.object({
  plantId: z.number().min(1, 'Plant is required'),
  templateId: z.number().optional(),
  name: z.string().min(1, 'Name is required'),
  startDate: z.date(),
  targetCompletionDate: z.date(),
  assignedTo: z.number().optional(),
  notes: z.string().optional()
});

// Schema for creating template
const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  industry: z.string().optional(),
  plantType: z.string().optional(),
  estimatedDurationDays: z.number().optional(),
  isPublic: z.boolean().default(false)
});

// Type definitions
interface Plant {
  plantCode: number;
  plantName: string;
}

interface Template {
  id: number;
  name: string;
  description?: string;
  industry?: string;
  plant_type?: string;
  phases?: any[];
  goals?: any[];
  estimated_duration_days?: number;
  is_public: boolean;
  created_at: string;
}

interface Onboarding {
  id: number;
  plant_id: number;
  template_id?: number;
  name: string;
  status: string;
  start_date?: string;
  target_completion_date?: string;
  actual_completion_date?: string;
  overall_progress: number;
  current_phase?: string;
  custom_phases?: any[];
  custom_goals?: any[];
  notes?: string;
  plant_name?: string;
  template_name?: string;
  created_by_name?: string;
  assigned_to_name?: string;
}

export const PlantOnboardingDashboard: React.FC = () => {
  const [selectedPlant, setSelectedPlant] = useState<number | null>(null);
  const [selectedOnboarding, setSelectedOnboarding] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Fetch plants
  const { data: plants = [] } = useQuery<Plant[]>({
    queryKey: ['/api/plants'],
    enabled: true
  });

  // Fetch templates
  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ['/api/onboarding/templates'],
    enabled: true
  });

  // Fetch plant onboardings
  const { data: onboardings = [], isLoading: onboardingsLoading } = useQuery<Onboarding[]>({
    queryKey: ['/api/onboarding/plants', { plantId: selectedPlant }],
    enabled: true
  });

  // Fetch selected onboarding details
  const { data: onboardingDetails } = useQuery({
    queryKey: ['/api/onboarding/plants', selectedOnboarding, 'phases'],
    queryFn: async () => {
      if (!selectedOnboarding) return null;
      const phases = await queryClient.fetchQuery({
        queryKey: [`/api/onboarding/plants/${selectedOnboarding}/phases`]
      });
      const metrics = await queryClient.fetchQuery({
        queryKey: [`/api/onboarding/plants/${selectedOnboarding}/metrics`]
      });
      return { phases, metrics };
    },
    enabled: !!selectedOnboarding
  });

  // Create new onboarding form
  const createOnboardingForm = useForm<z.infer<typeof createOnboardingSchema>>({
    resolver: zodResolver(createOnboardingSchema),
    defaultValues: {
      plantId: selectedPlant || undefined,
      startDate: new Date(),
      targetCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
    }
  });

  // Create template form
  const createTemplateForm = useForm<z.infer<typeof createTemplateSchema>>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      isPublic: false
    }
  });

  // Create onboarding mutation
  const createOnboardingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createOnboardingSchema>) => {
      return await apiRequest('POST', '/api/onboarding/plants', {
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/plants'] });
      setShowCreateDialog(false);
      createOnboardingForm.reset();
      toast({
        title: 'Success',
        description: 'Plant onboarding created successfully'
      });
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/onboarding/templates', {
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/templates'] });
      setShowTemplateDialog(false);
      createTemplateForm.reset();
      toast({
        title: 'Success',
        description: 'Template created successfully'
      });
    }
  });

  // Update phase progress mutation
  const updatePhaseMutation = useMutation({
    mutationFn: async ({ phaseId, data }: { phaseId: number; data: any }) => {
      return await apiRequest('PATCH', `/api/onboarding/phases/${phaseId}`, {
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/plants'] });
      toast({
        title: 'Success',
        description: 'Phase updated successfully'
      });
    }
  });

  // Save template from existing onboarding
  const saveAsTemplate = async (onboardingId: number) => {
    const onboarding = onboardings.find((o) => o.id === onboardingId);
    if (!onboarding) return;

    const templateData = {
      name: `${onboarding.name} Template`,
      description: `Template created from ${onboarding.plant_name} onboarding`,
      industry: 'Food & Beverage',
      plantType: 'Manufacturing',
      phases: onboarding.custom_phases || [],
      goals: onboarding.custom_goals || [],
      estimatedDurationDays: 90,
      isPublic: false
    };

    await createTemplateMutation.mutateAsync(templateData);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-4 sm:py-6 px-3 sm:px-4 max-w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Factory className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">Plant Onboarding Assistant</h1>
              <p className="text-sm text-muted-foreground">
                Track and manage onboarding progress by plant
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowTemplateDialog(true)} variant="outline">
              <BookTemplate className="h-4 w-4 mr-2" />
              Create Template
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Onboarding
            </Button>
          </div>
        </div>

        {/* Plant Selector */}
        <div className="flex items-center gap-4">
          <Select
            value={selectedPlant?.toString() || ''}
            onValueChange={(value) => setSelectedPlant(parseInt(value))}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a plant to view onboarding" />
            </SelectTrigger>
            <SelectContent>
              {plants.map((plant: any) => (
                <SelectItem key={plant.plantCode} value={plant.plantCode.toString()}>
                  {plant.plantName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPlant && onboardings.length > 0 && (
            <Select
              value={selectedOnboarding?.toString() || ''}
              onValueChange={(value) => setSelectedOnboarding(parseInt(value))}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select onboarding session" />
              </SelectTrigger>
              <SelectContent>
                {onboardings.map((onboarding: any) => (
                  <SelectItem key={onboarding.id} value={onboarding.id.toString()}>
                    {onboarding.name} ({onboarding.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Main Content */}
      {selectedPlant ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Plants Overview */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">All Plants Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {plants.map((plant) => {
                      const plantOnboardings = onboardings.filter(
                        (o) => o.plant_id === plant.plantCode
                      );
                      const activeOnboarding = plantOnboardings.find(
                        (o) => o.status === 'in-progress'
                      );
                      return (
                        <div
                          key={plant.plantCode}
                          className={cn(
                            'p-3 rounded-lg border cursor-pointer transition-colors',
                            selectedPlant === plant.plantCode
                              ? 'bg-blue-50 border-blue-300'
                              : 'hover:bg-gray-50'
                          )}
                          onClick={() => setSelectedPlant(plant.plantCode)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{plant.plantName}</span>
                            {activeOnboarding && (
                              <Badge variant="outline" className="text-xs">
                                {activeOnboarding.overall_progress}%
                              </Badge>
                            )}
                          </div>
                          {activeOnboarding && (
                            <Progress
                              value={activeOnboarding.overall_progress}
                              className="h-1"
                            />
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {plantOnboardings.length} onboarding(s)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Templates Quick Access */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="p-2 rounded border text-sm hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {template.estimated_duration_days} days • {template.phases?.length || 0} phases
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {selectedOnboarding && onboardingDetails ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="phases">Phases</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Overall Progress</p>
                            <p className="text-2xl font-bold">
                              {onboardings.find((o) => o.id === selectedOnboarding)?.overall_progress || 0}%
                            </p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-blue-600" />
                        </div>
                        <Progress
                          value={onboardings.find((o) => o.id === selectedOnboarding)?.overall_progress || 0}
                          className="mt-3"
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Current Phase</p>
                            <p className="text-lg font-semibold">
                              {onboardings.find((o) => o.id === selectedOnboarding)?.current_phase || 'Not Started'}
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Target Date</p>
                            <p className="text-lg font-semibold">
                              {onboardings.find((o) => o.id === selectedOnboarding)?.target_completion_date
                                ? format(new Date(onboardings.find((o) => o.id === selectedOnboarding)!.target_completion_date!), 'MMM d, yyyy')
                                : 'Not Set'}
                            </p>
                          </div>
                          <Target className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Onboarding Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const currentOnboarding = onboardings.find((o) => o.id === selectedOnboarding);
                        return currentOnboarding ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm text-muted-foreground">Status</span>
                                <div className="mt-1">
                                  <Badge className={getStatusColor(currentOnboarding.status)}>
                                    {currentOnboarding.status}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground">Template Used</span>
                                <p className="mt-1 font-medium">
                                  {currentOnboarding.template_name || 'Custom'}
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground">Assigned To</span>
                                <p className="mt-1 font-medium">
                                  {currentOnboarding.assigned_to_name || 'Unassigned'}
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground">Start Date</span>
                                <p className="mt-1 font-medium">
                                  {currentOnboarding.start_date
                                    ? format(new Date(currentOnboarding.start_date), 'MMM d, yyyy')
                                    : 'Not Started'}
                                </p>
                              </div>
                            </div>
                            {currentOnboarding.notes && (
                              <div>
                                <span className="text-sm text-muted-foreground">Notes</span>
                                <p className="mt-1 text-sm">{currentOnboarding.notes}</p>
                              </div>
                            )}
                            <div className="pt-3 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => saveAsTemplate(currentOnboarding.id)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Save as Template
                              </Button>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="phases" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Implementation Phases</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(onboardingDetails?.phases as any[] || []).map((phase: any) => (
                          <div key={phase.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  'h-10 w-10 rounded-full flex items-center justify-center',
                                  phase.status === 'completed'
                                    ? 'bg-green-100'
                                    : phase.status === 'in-progress'
                                    ? 'bg-blue-100'
                                    : 'bg-gray-100'
                                )}>
                                  {phase.status === 'completed' ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : phase.status === 'in-progress' ? (
                                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                                  ) : (
                                    <Clock className="h-5 w-5 text-gray-600" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold">{phase.phase_name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {phase.completed_tasks}/{phase.total_tasks} tasks completed
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{phase.progress}%</p>
                                <Badge className={getStatusColor(phase.status)}>
                                  {phase.status}
                                </Badge>
                              </div>
                            </div>
                            <Progress value={phase.progress} className="mb-3" />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  updatePhaseMutation.mutate({
                                    phaseId: phase.id,
                                    data: {
                                      status: 'in-progress',
                                      progress: phase.progress + 10
                                    }
                                  });
                                }}
                              >
                                Update Progress
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  updatePhaseMutation.mutate({
                                    phaseId: phase.id,
                                    data: {
                                      status: 'completed',
                                      progress: 100
                                    }
                                  });
                                }}
                              >
                                Mark Complete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="metrics" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Key Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(onboardingDetails?.metrics as any[] || []).map((metric: any) => (
                          <div key={metric.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{metric.metric_name}</span>
                              <Badge
                                className={
                                  metric.status === 'on-track'
                                    ? 'bg-green-100 text-green-800'
                                    : metric.status === 'at-risk'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }
                              >
                                {metric.status}
                              </Badge>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold">
                                {metric.metric_value}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                / {metric.target_value} {metric.metric_unit}
                              </span>
                            </div>
                            {metric.notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {metric.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Onboarding Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          Document management coming soon
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Factory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Onboarding</h3>
                    <p className="text-muted-foreground mb-4">
                      Select a plant and create a new onboarding to get started
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Start New Onboarding
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Factory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Plant</h3>
              <p className="text-muted-foreground">
                Choose a plant from the dropdown above to view its onboarding status
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Onboarding Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Plant Onboarding</DialogTitle>
            <DialogDescription>
              Start a new onboarding process for a plant
            </DialogDescription>
          </DialogHeader>
          <Form {...createOnboardingForm}>
            <form onSubmit={createOnboardingForm.handleSubmit((data) => createOnboardingMutation.mutate(data))}>
              <div className="space-y-4">
                <FormField
                  control={createOnboardingForm.control}
                  name="plantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plant</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a plant" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {plants.map((plant) => (
                            <SelectItem key={plant.plantCode} value={plant.plantCode.toString()}>
                              {plant.plantName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createOnboardingForm.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template (Optional)</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template or start from scratch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createOnboardingForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Onboarding Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Q1 2025 Implementation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createOnboardingForm.control}
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
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createOnboardingForm.control}
                    name="targetCompletionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Completion</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createOnboardingForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes or context..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createOnboardingMutation.isPending}>
                  {createOnboardingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Onboarding
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Onboarding Template</DialogTitle>
            <DialogDescription>
              Create a reusable template for future plant onboardings
            </DialogDescription>
          </DialogHeader>
          <Form {...createTemplateForm}>
            <form onSubmit={createTemplateForm.handleSubmit((data) => {
              const templateData = {
                ...data,
                phases: [
                  { id: 'discovery', name: 'Discovery & Assessment', tasks: [], milestones: [] },
                  { id: 'setup', name: 'System Setup', tasks: [], milestones: [] },
                  { id: 'training', name: 'Training & Education', tasks: [], milestones: [] },
                  { id: 'testing', name: 'Testing & Validation', tasks: [], milestones: [] },
                  { id: 'golive', name: 'Go-Live', tasks: [], milestones: [] }
                ],
                goals: []
              };
              createTemplateMutation.mutate(templateData);
            })}>
              <div className="space-y-4">
                <FormField
                  control={createTemplateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Brewery Standard Onboarding" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createTemplateForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe this template..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createTemplateForm.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Food & Beverage" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createTemplateForm.control}
                    name="plantType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plant Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Brewery" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createTemplateForm.control}
                  name="estimatedDurationDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Duration (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="90"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createTemplateForm.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">
                        Make this template public (visible to other organizations)
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setShowTemplateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTemplateMutation.isPending}>
                  {createTemplateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Template
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
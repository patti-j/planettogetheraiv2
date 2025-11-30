import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Target, CheckCircle2, Clock, AlertTriangle, Factory,
  Settings, Layers, Database, Flag, BarChart3,
  TrendingUp, Plus, RefreshCw, Loader2, ChevronRight,
  GitBranch, Sparkles, FileCheck, Beaker, Rocket, Archive
} from 'lucide-react';

interface ImplementationGoal {
  id: number;
  business_goal_id?: number;
  plant_id?: number;
  onboarding_id?: number;
  target_value?: string;
  current_value?: string;
  target_unit?: string;
  status: string;
  priority: string;
  start_date?: string;
  target_date?: string;
  completion_date?: string;
  notes?: string;
}

interface ImplementationFeature {
  id: number;
  feature_name: string;
  feature_category?: string;
  description?: string;
  plant_id?: number;
  onboarding_id?: number;
  is_universal: boolean;
  implementation_status: string;
  configuration_progress: number;
  testing_progress: number;
  deployment_progress: number;
  priority: string;
  estimated_hours?: number;
  actual_hours?: number;
}

interface DataRequirement {
  id: number;
  data_name: string;
  data_category?: string;
  description?: string;
  plant_id?: number;
  feature_id?: number;
  source_system?: string;
  data_format?: string;
  frequency?: string;
  is_required: boolean;
  collection_status: string;
  validation_status: string;
  quality_score?: number;
  mapping_progress: number;
}

interface ManufacturingRequirement {
  id: number;
  requirement_name: string;
  requirement_category?: string;
  description?: string;
  plant_id?: number;
  is_universal: boolean;
  lifecycle_status: string;
  modeling_progress: number;
  testing_progress: number;
  deployment_progress: number;
  priority: string;
  business_impact?: string;
}

interface Milestone {
  id: number;
  milestone_name: string;
  description?: string;
  milestone_type?: string;
  plant_id?: number;
  is_company_wide: boolean;
  status: string;
  target_date?: string;
  completion_date?: string;
  success_criteria?: string;
}

interface KPITarget {
  id: number;
  kpi_name: string;
  kpi_category?: string;
  description?: string;
  plant_id?: number;
  baseline_value?: string;
  target_value?: string;
  current_value?: string;
  unit?: string;
  measurement_frequency?: string;
  status: string;
}

interface DashboardSummary {
  goals: { total: number; completed: number; in_progress: number; at_risk: number };
  features: { total: number; completed: number; in_progress: number; blocked: number; avg_config_progress: number; avg_testing_progress: number; avg_deployment_progress: number };
  manufacturingRequirements: { total: number; completed: number; modeling: number; testing: number; deployment: number };
  dataRequirements: { total: number; integrated: number; validated: number; failed_validation: number; avg_quality_score: number; avg_mapping_progress: number };
  milestones: { total: number; completed: number; in_progress: number; delayed: number; next_milestone_date: string };
  kpis: { total: number; achieved: number; on_track: number; at_risk: number; off_track: number };
}

const featureSchema = z.object({
  featureName: z.string().min(1, 'Feature name is required'),
  featureCategory: z.string().optional(),
  description: z.string().optional(),
  plantId: z.number().optional().nullable(),
  isUniversal: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  estimatedHours: z.coerce.number().optional()
});

const requirementSchema = z.object({
  requirementName: z.string().min(1, 'Requirement name is required'),
  requirementCategory: z.string().optional(),
  description: z.string().optional(),
  plantId: z.number().optional().nullable(),
  isUniversal: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  businessImpact: z.string().optional()
});

const dataRequirementSchema = z.object({
  dataName: z.string().min(1, 'Data name is required'),
  dataCategory: z.string().optional(),
  description: z.string().optional(),
  sourceSystem: z.string().optional(),
  dataFormat: z.string().optional(),
  frequency: z.string().optional(),
  isRequired: z.boolean().default(true)
});

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': case 'achieved': case 'integrated': case 'passed': return 'bg-green-500/20 text-green-700 dark:text-green-400';
    case 'in_progress': case 'on_track': case 'tracking': case 'validated': return 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
    case 'pending': case 'not_started': case 'identified': return 'bg-gray-500/20 text-gray-700 dark:text-gray-400';
    case 'at_risk': case 'delayed': case 'needs_review': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
    case 'blocked': case 'failed': case 'off_track': return 'bg-red-500/20 text-red-700 dark:text-red-400';
    case 'modeling': case 'testing': case 'deployment': return 'bg-purple-500/20 text-purple-700 dark:text-purple-400';
    default: return 'bg-gray-500/20 text-gray-600 dark:text-gray-400';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-500/20 text-red-700 dark:text-red-400';
    case 'high': return 'bg-orange-500/20 text-orange-700 dark:text-orange-400';
    case 'medium': return 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
    case 'low': return 'bg-gray-500/20 text-gray-600 dark:text-gray-400';
    default: return 'bg-gray-500/20 text-gray-600 dark:text-gray-400';
  }
};

const getLifecycleIcon = (status: string) => {
  switch (status) {
    case 'identified': return <Target className="h-4 w-4" />;
    case 'modeling': return <Beaker className="h-4 w-4" />;
    case 'testing': return <FileCheck className="h-4 w-4" />;
    case 'deployment': return <Rocket className="h-4 w-4" />;
    case 'completed': return <CheckCircle2 className="h-4 w-4" />;
    case 'archived': return <Archive className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
};

export const ImplementationFrameworkHub: React.FC<{ plantId?: number; onboardingId?: number }> = ({ plantId, onboardingId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showFeatureDialog, setShowFeatureDialog] = useState(false);
  const [showRequirementDialog, setShowRequirementDialog] = useState(false);
  const [showDataDialog, setShowDataDialog] = useState(false);
  const { toast } = useToast();

  const dashboardUrl = plantId ? `/api/implementation/dashboard?plantId=${plantId}` : '/api/implementation/dashboard';
  const { data: dashboard, isLoading: dashboardLoading, refetch: refetchDashboard } = useQuery<DashboardSummary>({
    queryKey: [dashboardUrl]
  });

  const goalsUrl = plantId ? `/api/implementation/goals?plantId=${plantId}` : '/api/implementation/goals';
  const { data: goals = [], isLoading: goalsLoading } = useQuery<ImplementationGoal[]>({
    queryKey: [goalsUrl]
  });

  const featuresUrl = plantId ? `/api/implementation/features?plantId=${plantId}` : '/api/implementation/features';
  const { data: features = [], isLoading: featuresLoading } = useQuery<ImplementationFeature[]>({
    queryKey: [featuresUrl]
  });

  const dataUrl = plantId ? `/api/implementation/data-requirements?plantId=${plantId}` : '/api/implementation/data-requirements';
  const { data: dataRequirements = [], isLoading: dataLoading } = useQuery<DataRequirement[]>({
    queryKey: [dataUrl]
  });

  const mfgUrl = plantId ? `/api/implementation/manufacturing-requirements?plantId=${plantId}` : '/api/implementation/manufacturing-requirements';
  const { data: manufacturingRequirements = [], isLoading: mfgLoading } = useQuery<ManufacturingRequirement[]>({
    queryKey: [mfgUrl]
  });

  const milestonesUrl = plantId ? `/api/implementation/milestones?plantId=${plantId}` : '/api/implementation/milestones';
  const { data: milestones = [], isLoading: milestonesLoading } = useQuery<Milestone[]>({
    queryKey: [milestonesUrl]
  });

  const kpisUrl = plantId ? `/api/implementation/kpi-targets?plantId=${plantId}` : '/api/implementation/kpi-targets';
  const { data: kpis = [], isLoading: kpisLoading } = useQuery<KPITarget[]>({
    queryKey: [kpisUrl]
  });

  const featureForm = useForm<z.infer<typeof featureSchema>>({
    resolver: zodResolver(featureSchema),
    defaultValues: { priority: 'medium', isUniversal: false, plantId: plantId || null }
  });

  const requirementForm = useForm<z.infer<typeof requirementSchema>>({
    resolver: zodResolver(requirementSchema),
    defaultValues: { priority: 'medium', isUniversal: false, plantId: plantId || null }
  });

  const dataForm = useForm<z.infer<typeof dataRequirementSchema>>({
    resolver: zodResolver(dataRequirementSchema),
    defaultValues: { isRequired: true }
  });

  const generateSampleDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/implementation/generate-sample-data', {
        body: JSON.stringify({ plantId: plantId || 1, onboardingId: onboardingId || 1 })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/implementation') 
      });
      refetchDashboard();
      toast({ title: 'Success', description: 'Sample implementation data generated' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to generate sample data', variant: 'destructive' });
    }
  });

  const createFeatureMutation = useMutation({
    mutationFn: async (data: z.infer<typeof featureSchema>) => {
      return await apiRequest('POST', '/api/implementation/features', { body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/implementation/features') 
      });
      refetchDashboard();
      setShowFeatureDialog(false);
      featureForm.reset();
      toast({ title: 'Success', description: 'Feature created successfully' });
    }
  });

  const createRequirementMutation = useMutation({
    mutationFn: async (data: z.infer<typeof requirementSchema>) => {
      return await apiRequest('POST', '/api/implementation/manufacturing-requirements', { body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/implementation/manufacturing-requirements') 
      });
      refetchDashboard();
      setShowRequirementDialog(false);
      requirementForm.reset();
      toast({ title: 'Success', description: 'Requirement created successfully' });
    }
  });

  const createDataRequirementMutation = useMutation({
    mutationFn: async (data: z.infer<typeof dataRequirementSchema>) => {
      return await apiRequest('POST', '/api/implementation/data-requirements', { body: JSON.stringify({ ...data, plantId }) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/implementation/data-requirements') 
      });
      refetchDashboard();
      setShowDataDialog(false);
      dataForm.reset();
      toast({ title: 'Success', description: 'Data requirement created successfully' });
    }
  });

  const updateFeatureProgressMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: number; field: string; value: number }) => {
      return await apiRequest('PATCH', `/api/implementation/features/${id}`, {
        body: JSON.stringify({ [field]: value })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/implementation/features') 
      });
      refetchDashboard();
    }
  });

  const updateRequirementProgressMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: number; field: string; value: number }) => {
      return await apiRequest('PATCH', `/api/implementation/manufacturing-requirements/${id}`, {
        body: JSON.stringify({ [field]: value })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/implementation/manufacturing-requirements') 
      });
      refetchDashboard();
    }
  });

  const isLoading = dashboardLoading || goalsLoading || featuresLoading || dataLoading || mfgLoading || milestonesLoading || kpisLoading;

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Goals Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.goals?.completed || 0} / {dashboard?.goals?.total || 0}
            </div>
            <Progress 
              value={dashboard?.goals?.total ? ((dashboard.goals.completed || 0) / dashboard.goals.total) * 100 : 0} 
              className="mt-2"
            />
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-blue-600">{dashboard?.goals?.in_progress || 0} in progress</span>
              <span className="text-yellow-600">{dashboard?.goals?.at_risk || 0} at risk</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-500" />
              Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.features?.completed || 0} / {dashboard?.features?.total || 0}
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Config</span>
                <span>{Math.round(Number(dashboard?.features?.avg_config_progress) || 0)}%</span>
              </div>
              <Progress value={Number(dashboard?.features?.avg_config_progress) || 0} className="h-1" />
              <div className="flex justify-between text-xs">
                <span>Testing</span>
                <span>{Math.round(Number(dashboard?.features?.avg_testing_progress) || 0)}%</span>
              </div>
              <Progress value={Number(dashboard?.features?.avg_testing_progress) || 0} className="h-1" />
              <div className="flex justify-between text-xs">
                <span>Deploy</span>
                <span>{Math.round(Number(dashboard?.features?.avg_deployment_progress) || 0)}%</span>
              </div>
              <Progress value={Number(dashboard?.features?.avg_deployment_progress) || 0} className="h-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-green-500" />
              Data Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.dataRequirements?.integrated || 0} / {dashboard?.dataRequirements?.total || 0}
            </div>
            <Progress 
              value={dashboard?.dataRequirements?.total ? ((dashboard.dataRequirements.integrated || 0) / Number(dashboard.dataRequirements.total)) * 100 : 0} 
              className="mt-2"
            />
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-green-600">{dashboard?.dataRequirements?.validated || 0} validated</span>
              <span className="text-red-600">{dashboard?.dataRequirements?.failed_validation || 0} failed</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4 text-orange-500" />
              Manufacturing Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.manufacturingRequirements?.completed || 0} / {dashboard?.manufacturingRequirements?.total || 0}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1 text-xs">
              <div className="text-center">
                <div className="font-medium">{dashboard?.manufacturingRequirements?.modeling || 0}</div>
                <div className="text-muted-foreground">Model</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{dashboard?.manufacturingRequirements?.testing || 0}</div>
                <div className="text-muted-foreground">Test</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{dashboard?.manufacturingRequirements?.deployment || 0}</div>
                <div className="text-muted-foreground">Deploy</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600">{dashboard?.manufacturingRequirements?.completed || 0}</div>
                <div className="text-muted-foreground">Done</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flag className="h-4 w-4 text-indigo-500" />
              Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.milestones?.completed || 0} / {dashboard?.milestones?.total || 0}
            </div>
            <Progress 
              value={dashboard?.milestones?.total ? ((dashboard.milestones.completed || 0) / Number(dashboard.milestones.total)) * 100 : 0} 
              className="mt-2"
            />
            <div className="mt-2 text-xs text-muted-foreground">
              {dashboard?.milestones?.next_milestone_date && (
                <span>Next: {format(new Date(dashboard.milestones.next_milestone_date), 'MMM d, yyyy')}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-500" />
              KPI Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.kpis?.achieved || 0} / {dashboard?.kpis?.total || 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">achieved</span>
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-green-600">{dashboard?.kpis?.on_track || 0} on track</span>
              <span className="text-yellow-600">{dashboard?.kpis?.at_risk || 0} at risk</span>
              <span className="text-red-600">{dashboard?.kpis?.off_track || 0} off track</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recent Feature Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {features.slice(0, 5).map((feature) => (
                  <div key={feature.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{feature.feature_name}</span>
                        {feature.is_universal && (
                          <Badge variant="outline" className="text-xs">Universal</Badge>
                        )}
                      </div>
                      <Badge className={cn('text-xs', getStatusColor(feature.implementation_status))}>
                        {feature.implementation_status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Config: {feature.configuration_progress}%</span>
                        <span>Test: {feature.testing_progress}%</span>
                        <span>Deploy: {feature.deployment_progress}%</span>
                      </div>
                      <Progress 
                        value={(feature.configuration_progress + feature.testing_progress + feature.deployment_progress) / 3} 
                        className="h-1.5"
                      />
                    </div>
                  </div>
                ))}
                {features.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No features yet. Add some to get started.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Requirement Lifecycle Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {manufacturingRequirements.slice(0, 5).map((req) => (
                  <div key={req.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getLifecycleIcon(req.lifecycle_status)}
                        <span className="font-medium text-sm">{req.requirement_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn('text-xs', getPriorityColor(req.priority))}>
                          {req.priority}
                        </Badge>
                        <Badge className={cn('text-xs', getStatusColor(req.lifecycle_status))}>
                          {req.lifecycle_status}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Modeling</div>
                        <Progress value={req.modeling_progress} className="h-1.5" />
                        <div className="text-xs mt-1">{req.modeling_progress}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Testing</div>
                        <Progress value={req.testing_progress} className="h-1.5" />
                        <div className="text-xs mt-1">{req.testing_progress}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Deployment</div>
                        <Progress value={req.deployment_progress} className="h-1.5" />
                        <div className="text-xs mt-1">{req.deployment_progress}%</div>
                      </div>
                    </div>
                  </div>
                ))}
                {manufacturingRequirements.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No requirements yet. Add some to start tracking.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderFeaturesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Implementation Features</h3>
        <Button onClick={() => setShowFeatureDialog(true)} size="sm" data-testid="button-add-feature">
          <Plus className="h-4 w-4 mr-2" />
          Add Feature
        </Button>
      </div>
      
      <div className="grid gap-4">
        {features.map((feature) => (
          <Card key={feature.id} data-testid={`card-feature-${feature.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{feature.feature_name}</h4>
                    {feature.is_universal && (
                      <Badge variant="outline" className="text-xs">Universal</Badge>
                    )}
                    <Badge className={cn('text-xs', getPriorityColor(feature.priority))}>
                      {feature.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {feature.feature_category} {feature.description && `- ${feature.description}`}
                  </p>
                </div>
                <Badge className={cn(getStatusColor(feature.implementation_status))}>
                  {feature.implementation_status.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Configuration</label>
                  <div className="flex items-center gap-2">
                    <Progress value={feature.configuration_progress} className="flex-1" />
                    <span className="text-sm font-medium w-12">{feature.configuration_progress}%</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Testing</label>
                  <div className="flex items-center gap-2">
                    <Progress value={feature.testing_progress} className="flex-1" />
                    <span className="text-sm font-medium w-12">{feature.testing_progress}%</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Deployment</label>
                  <div className="flex items-center gap-2">
                    <Progress value={feature.deployment_progress} className="flex-1" />
                    <span className="text-sm font-medium w-12">{feature.deployment_progress}%</span>
                  </div>
                </div>
              </div>
              
              {(feature.estimated_hours || feature.actual_hours) && (
                <div className="mt-3 pt-3 border-t flex gap-4 text-sm">
                  {feature.estimated_hours && (
                    <span className="text-muted-foreground">Est: {feature.estimated_hours}h</span>
                  )}
                  {feature.actual_hours && (
                    <span className="text-muted-foreground">Actual: {feature.actual_hours}h</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {features.length === 0 && !featuresLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Features Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start by adding implementation features to track.
              </p>
              <Button onClick={() => setShowFeatureDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Feature
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderRequirementsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Manufacturing Requirements</h3>
        <Button onClick={() => setShowRequirementDialog(true)} size="sm" data-testid="button-add-requirement">
          <Plus className="h-4 w-4 mr-2" />
          Add Requirement
        </Button>
      </div>
      
      <div className="grid gap-4">
        {manufacturingRequirements.map((req) => (
          <Card key={req.id} data-testid={`card-requirement-${req.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    {getLifecycleIcon(req.lifecycle_status)}
                    <h4 className="font-medium">{req.requirement_name}</h4>
                    {req.is_universal && (
                      <Badge variant="outline" className="text-xs">Universal</Badge>
                    )}
                    <Badge className={cn('text-xs', getPriorityColor(req.priority))}>
                      {req.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {req.requirement_category} {req.description && `- ${req.description}`}
                  </p>
                </div>
                <Badge className={cn(getStatusColor(req.lifecycle_status))}>
                  {req.lifecycle_status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Beaker className="h-5 w-5 mx-auto mb-2 text-purple-500" />
                  <div className="text-xs text-muted-foreground mb-1">Modeling</div>
                  <Progress value={req.modeling_progress} className="h-2 mb-1" />
                  <span className="text-sm font-medium">{req.modeling_progress}%</span>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <FileCheck className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                  <div className="text-xs text-muted-foreground mb-1">Testing</div>
                  <Progress value={req.testing_progress} className="h-2 mb-1" />
                  <span className="text-sm font-medium">{req.testing_progress}%</span>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Rocket className="h-5 w-5 mx-auto mb-2 text-green-500" />
                  <div className="text-xs text-muted-foreground mb-1">Deployment</div>
                  <Progress value={req.deployment_progress} className="h-2 mb-1" />
                  <span className="text-sm font-medium">{req.deployment_progress}%</span>
                </div>
              </div>
              
              {req.business_impact && (
                <div className="mt-3 pt-3 border-t">
                  <span className="text-xs text-muted-foreground">Business Impact: </span>
                  <span className="text-sm">{req.business_impact}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {manufacturingRequirements.length === 0 && !mfgLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Manufacturing Requirements</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add requirements to track their lifecycle from modeling to deployment.
              </p>
              <Button onClick={() => setShowRequirementDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Requirement
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Data Requirements</h3>
        <Button onClick={() => setShowDataDialog(true)} size="sm" data-testid="button-add-data">
          <Plus className="h-4 w-4 mr-2" />
          Add Data Requirement
        </Button>
      </div>
      
      <div className="grid gap-4">
        {dataRequirements.map((data) => (
          <Card key={data.id} data-testid={`card-data-${data.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-green-500" />
                    <h4 className="font-medium">{data.data_name}</h4>
                    {data.is_required && (
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700">Required</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {data.data_category} • {data.source_system} • {data.data_format} • {data.frequency}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge className={cn('text-xs', getStatusColor(data.collection_status))}>
                    {data.collection_status.replace('_', ' ')}
                  </Badge>
                  <Badge className={cn('text-xs', getStatusColor(data.validation_status))}>
                    {data.validation_status}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Mapping Progress</label>
                  <div className="flex items-center gap-2">
                    <Progress value={data.mapping_progress} className="flex-1" />
                    <span className="text-sm font-medium w-12">{data.mapping_progress}%</span>
                  </div>
                </div>
                {data.quality_score !== null && data.quality_score !== undefined && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Quality Score</label>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={data.quality_score} 
                        className={cn("flex-1", data.quality_score >= 80 ? "bg-green-100" : data.quality_score >= 60 ? "bg-yellow-100" : "bg-red-100")} 
                      />
                      <span className="text-sm font-medium w-12">{data.quality_score}%</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {dataRequirements.length === 0 && !dataLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Data Requirements</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Define what data needs to be collected and integrated.
              </p>
              <Button onClick={() => setShowDataDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Data Requirement
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderKPIsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">KPI Targets</h3>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {kpis.map((kpi) => (
          <Card key={kpi.id} data-testid={`card-kpi-${kpi.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium">{kpi.kpi_name}</h4>
                  <p className="text-sm text-muted-foreground">{kpi.kpi_category}</p>
                </div>
                <Badge className={cn(getStatusColor(kpi.status))}>
                  {kpi.status.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Baseline:</span>
                  <span className="font-medium">{kpi.baseline_value} {kpi.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target:</span>
                  <span className="font-medium text-blue-600">{kpi.target_value} {kpi.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-medium text-green-600">{kpi.current_value} {kpi.unit}</span>
                </div>
              </div>
              
              {kpi.measurement_frequency && (
                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  Measured: {kpi.measurement_frequency}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {kpis.length === 0 && !kpisLoading && (
          <Card className="md:col-span-2">
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No KPI Targets</h3>
              <p className="text-sm text-muted-foreground">
                KPI targets will be created when goals are defined.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderMilestonesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Implementation Milestones</h3>
      </div>
      
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="relative pl-10" data-testid={`milestone-${milestone.id}`}>
              <div className={cn(
                "absolute left-2 top-2 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-background",
                milestone.status === 'completed' ? 'border-green-500 bg-green-50' :
                milestone.status === 'in_progress' ? 'border-blue-500 bg-blue-50' :
                milestone.status === 'delayed' ? 'border-red-500 bg-red-50' :
                'border-gray-300'
              )}>
                {milestone.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                {milestone.status === 'in_progress' && <Clock className="h-3 w-3 text-blue-500" />}
                {milestone.status === 'delayed' && <AlertTriangle className="h-3 w-3 text-red-500" />}
              </div>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{milestone.milestone_name}</h4>
                        {milestone.is_company_wide && (
                          <Badge variant="outline" className="text-xs">Company-wide</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                    </div>
                    <Badge className={cn(getStatusColor(milestone.status))}>
                      {milestone.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                    {milestone.target_date && (
                      <span>Target: {format(new Date(milestone.target_date), 'MMM d, yyyy')}</span>
                    )}
                    {milestone.completion_date && (
                      <span className="text-green-600">
                        Completed: {format(new Date(milestone.completion_date), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  
                  {milestone.success_criteria && (
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">Success criteria: </span>
                      {milestone.success_criteria}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
          
          {milestones.length === 0 && !milestonesLoading && (
            <Card className="ml-10">
              <CardContent className="py-12 text-center">
                <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No Milestones</h3>
                <p className="text-sm text-muted-foreground">
                  Milestones will be created as part of the implementation roadmap.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            Implementation Framework Hub
          </h2>
          <p className="text-muted-foreground">
            Track business goals, features, requirements, and implementation progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchDashboard()}
            disabled={isLoading}
            data-testid="button-refresh"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          {(goals.length === 0 && features.length === 0) && (
            <Button 
              size="sm" 
              onClick={() => generateSampleDataMutation.mutate()}
              disabled={generateSampleDataMutation.isPending}
              data-testid="button-generate-sample"
            >
              {generateSampleDataMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate Sample Data
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-1" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-1" data-testid="tab-features">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Features</span>
          </TabsTrigger>
          <TabsTrigger value="requirements" className="flex items-center gap-1" data-testid="tab-requirements">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Requirements</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-1" data-testid="tab-data">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
          <TabsTrigger value="kpis" className="flex items-center gap-1" data-testid="tab-kpis">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">KPIs</span>
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-1" data-testid="tab-milestones">
            <Flag className="h-4 w-4" />
            <span className="hidden sm:inline">Milestones</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverviewTab()}
        </TabsContent>
        <TabsContent value="features" className="mt-6">
          {renderFeaturesTab()}
        </TabsContent>
        <TabsContent value="requirements" className="mt-6">
          {renderRequirementsTab()}
        </TabsContent>
        <TabsContent value="data" className="mt-6">
          {renderDataTab()}
        </TabsContent>
        <TabsContent value="kpis" className="mt-6">
          {renderKPIsTab()}
        </TabsContent>
        <TabsContent value="milestones" className="mt-6">
          {renderMilestonesTab()}
        </TabsContent>
      </Tabs>

      <Dialog open={showFeatureDialog} onOpenChange={setShowFeatureDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Implementation Feature</DialogTitle>
            <DialogDescription>
              Define a new feature to implement and track.
            </DialogDescription>
          </DialogHeader>
          <Form {...featureForm}>
            <form onSubmit={featureForm.handleSubmit((data) => createFeatureMutation.mutate(data))} className="space-y-4">
              <FormField
                control={featureForm.control}
                name="featureName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feature Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Real-time Production Monitoring" {...field} data-testid="input-feature-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={featureForm.control}
                name="featureCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-feature-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Monitoring">Monitoring</SelectItem>
                        <SelectItem value="Planning">Planning</SelectItem>
                        <SelectItem value="Quality">Quality</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Logistics">Logistics</SelectItem>
                        <SelectItem value="Analytics">Analytics</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={featureForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the feature..." {...field} data-testid="textarea-feature-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={featureForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-feature-priority">
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
                <FormField
                  control={featureForm.control}
                  name="estimatedHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Hours</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} data-testid="input-feature-hours" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowFeatureDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createFeatureMutation.isPending} data-testid="button-submit-feature">
                  {createFeatureMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Feature
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showRequirementDialog} onOpenChange={setShowRequirementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manufacturing Requirement</DialogTitle>
            <DialogDescription>
              Define a new manufacturing requirement to track through its lifecycle.
            </DialogDescription>
          </DialogHeader>
          <Form {...requirementForm}>
            <form onSubmit={requirementForm.handleSubmit((data) => createRequirementMutation.mutate(data))} className="space-y-4">
              <FormField
                control={requirementForm.control}
                name="requirementName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirement Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Multi-machine constraint handling" {...field} data-testid="input-requirement-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={requirementForm.control}
                name="requirementCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-requirement-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Scheduling">Scheduling</SelectItem>
                        <SelectItem value="Production">Production</SelectItem>
                        <SelectItem value="Quality">Quality</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Sustainability">Sustainability</SelectItem>
                        <SelectItem value="Compliance">Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={requirementForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the requirement..." {...field} data-testid="textarea-requirement-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={requirementForm.control}
                name="businessImpact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Impact</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the business impact..." {...field} data-testid="textarea-requirement-impact" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={requirementForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-requirement-priority">
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowRequirementDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRequirementMutation.isPending} data-testid="button-submit-requirement">
                  {createRequirementMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Requirement
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDataDialog} onOpenChange={setShowDataDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Data Requirement</DialogTitle>
            <DialogDescription>
              Define a new data requirement for implementation.
            </DialogDescription>
          </DialogHeader>
          <Form {...dataForm}>
            <form onSubmit={dataForm.handleSubmit((data) => createDataRequirementMutation.mutate(data))} className="space-y-4">
              <FormField
                control={dataForm.control}
                name="dataName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Production Orders" {...field} data-testid="input-data-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={dataForm.control}
                  name="dataCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-data-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Planning">Planning</SelectItem>
                          <SelectItem value="Equipment">Equipment</SelectItem>
                          <SelectItem value="Quality">Quality</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                          <SelectItem value="Sustainability">Sustainability</SelectItem>
                          <SelectItem value="Financial">Financial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={dataForm.control}
                  name="sourceSystem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source System</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., SAP, PLC" {...field} data-testid="input-data-source" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={dataForm.control}
                  name="dataFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Format</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-data-format">
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="iDoc">iDoc</SelectItem>
                          <SelectItem value="OPC-UA">OPC-UA</SelectItem>
                          <SelectItem value="CSV">CSV</SelectItem>
                          <SelectItem value="JSON">JSON</SelectItem>
                          <SelectItem value="API">API</SelectItem>
                          <SelectItem value="MQTT">MQTT</SelectItem>
                          <SelectItem value="Database">Database</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={dataForm.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-data-frequency">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Real-time">Real-time</SelectItem>
                          <SelectItem value="Minute">Every Minute</SelectItem>
                          <SelectItem value="Hourly">Hourly</SelectItem>
                          <SelectItem value="Daily">Daily</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Per event">Per Event</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={dataForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the data requirement..." {...field} data-testid="textarea-data-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDataDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createDataRequirementMutation.isPending} data-testid="button-submit-data">
                  {createDataRequirementMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Data Requirement
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImplementationFrameworkHub;

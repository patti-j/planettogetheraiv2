import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Link } from 'wouter';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, LineChart, Line
} from 'recharts';
import {
  Factory, TrendingUp, Clock, CheckCircle2, AlertCircle, Users,
  Package, Target, Calendar, FileText, Sparkles, Building2,
  ChevronRight, Globe, Activity, Award, Layers, Upload, 
  Play, Pause, Check, Loader2, FlaskConical, Rocket, GitBranch
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImplementationFrameworkHub } from '@/components/onboarding/ImplementationFrameworkHub';
import { BenefitsROISection } from '@/components/onboarding/BenefitsROISection';

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  teal: '#14B8A6'
};

const STATUS_COLORS = {
  'completed': COLORS.success,
  'in-progress': COLORS.primary,
  'paused': COLORS.warning,
  'not-started': '#94A3B8'
};

interface CustomerRequirement {
  id: number;
  customerName: string;
  segment: string;
  requirementName: string;
  lifecycleStatus: string;
  modelingProgress: number;
  testingProgress: number;
  deploymentProgress: number;
  createdAt: string;
}

interface RequirementStats {
  total: number;
  byStatus: Array<{ status: string; count: number }>;
  bySegment: Array<{ segment: string; count: number }>;
  summary: {
    uploaded: number;
    inModeling: number;
    inTesting: number;
    inDeployment: number;
    deployed: number;
    completionRate: number;
  };
}

const LIFECYCLE_STAGES = [
  { key: 'modeling', label: 'Modeling', icon: FileText, color: 'blue' },
  { key: 'testing', label: 'Testing', icon: FlaskConical, color: 'purple' },
  { key: 'deployment', label: 'Deployment', icon: Rocket, color: 'orange' }
];

export default function CompanyOnboardingOverview() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<any>(null);

  const { data: apiData, isLoading } = useQuery<{
    overview: any;
    plants: any[];
    summary: {
      total: number;
      completed: number;
      inProgress: number;
      notStarted: number;
      paused: number;
    }
  }>({
    queryKey: ['/api/onboarding/company/overview']
  });
  
  const overviewData = apiData?.plants || [];

  const { data: recommendations = [] } = useQuery({
    queryKey: ['/api/onboarding/recommendations/summary']
  });

  const { data: customerRequirements = [], isLoading: loadingReqs } = useQuery<CustomerRequirement[]>({
    queryKey: ['/api/customer-requirements']
  });

  const { data: requirementsStats } = useQuery<RequirementStats>({
    queryKey: ['/api/customer-requirements/stats']
  });

  const processedData = {
    byStatus: [] as Array<{ name: string; value: number; color: string }>,
    byProgress: [] as Array<{ name: string; value: number }>,
    byRegion: [
      { name: 'North America', plants: 12, progress: 68, onTrack: 9, atRisk: 3 },
      { name: 'Europe', plants: 8, progress: 75, onTrack: 7, atRisk: 1 },
      { name: 'Asia Pacific', plants: 15, progress: 62, onTrack: 10, atRisk: 5 },
      { name: 'Latin America', plants: 5, progress: 80, onTrack: 5, atRisk: 0 }
    ],
    timeline: [] as any[],
    metrics: {
      totalPlants: apiData?.overview?.totalPlants || overviewData.length || 0,
      activeOnboardings: apiData?.summary?.inProgress || 0,
      completedOnboardings: apiData?.summary?.completed || 0,
      averageProgress: 0,
      onTrackCount: 0,
      atRiskCount: 0
    }
  };

  if (overviewData.length) {
    const statusCounts = overviewData.reduce((acc: any, plant: any) => {
      const status = plant.status || 'not-started';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    processedData.byStatus = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('-', ' ').charAt(0).toUpperCase() + status.slice(1),
      value: count as number,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS]
    }));

    const progressRanges = [
      { range: '0-25%', min: 0, max: 25, count: 0 },
      { range: '26-50%', min: 26, max: 50, count: 0 },
      { range: '51-75%', min: 51, max: 75, count: 0 },
      { range: '76-100%', min: 76, max: 100, count: 0 }
    ];

    overviewData.forEach((plant: any) => {
      const progress = plant.overall_progress || 0;
      const range = progressRanges.find(r => progress >= r.min && progress <= r.max);
      if (range) range.count++;
    });

    processedData.byProgress = progressRanges.map(r => ({
      name: r.range,
      value: r.count
    }));

    processedData.timeline = overviewData
      .filter((p: any) => p.start_date)
      .map((plant: any) => ({
        date: plant.start_date,
        plant: plant.plant_name,
        progress: plant.overall_progress || 0,
        status: plant.status
      }))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    processedData.metrics = {
      totalPlants: apiData?.overview?.totalPlants || overviewData.length,
      activeOnboardings: apiData?.summary?.inProgress || overviewData.filter((p: any) => p.status === 'in-progress').length,
      completedOnboardings: apiData?.summary?.completed || overviewData.filter((p: any) => p.status === 'completed').length,
      averageProgress: Math.round(
        overviewData.reduce((sum: number, p: any) => sum + (p.progress || 0), 0) / 
        (overviewData.length || 1)
      ),
      onTrackCount: overviewData.filter((p: any) => {
        if (!p.targetCompletionDate) return true;
        const daysRemaining = Math.ceil(
          (new Date(p.targetCompletionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysRemaining >= 0 || p.progress >= 80;
      }).length,
      atRiskCount: overviewData.filter((p: any) => {
        if (!p.targetCompletionDate) return false;
        const daysRemaining = Math.ceil(
          (new Date(p.targetCompletionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysRemaining < 0 && p.progress < 80;
      }).length
    };
  }

  const getStatusBadge = (status: string) => {
    const colors: any = {
      'completed': 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'paused': 'bg-yellow-100 text-yellow-800',
      'not-started': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getLifecycleStage = (status: string) => {
    if (status.includes('deploy') || status === 'deployed') return 'deployment';
    if (status.includes('testing')) return 'testing';
    return 'modeling';
  };

  const getStageProgress = (req: CustomerRequirement, stage: string) => {
    if (stage === 'modeling') return req.modelingProgress;
    if (stage === 'testing') return req.testingProgress;
    return req.deploymentProgress;
  };

  const requirementsByStage = {
    modeling: customerRequirements.filter(r => 
      r.lifecycleStatus.includes('modeling') || r.lifecycleStatus === 'uploaded'
    ),
    testing: customerRequirements.filter(r => r.lifecycleStatus.includes('testing')),
    deployment: customerRequirements.filter(r => 
      r.lifecycleStatus.includes('deploy') || r.lifecycleStatus === 'deployed'
    )
  };

  const lifecycleChartData = LIFECYCLE_STAGES.map(stage => ({
    name: stage.label,
    count: requirementsByStage[stage.key as keyof typeof requirementsByStage].length,
    fill: stage.color === 'blue' ? COLORS.primary : 
          stage.color === 'purple' ? COLORS.purple : COLORS.warning
  }));

  const segmentChartData = requirementsStats?.bySegment?.map(s => ({
    name: s.segment,
    value: Number(s.count)
  })) || [];

  return (
    <div className="container mx-auto py-6 px-4 max-w-full">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Globe className="h-10 w-10 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">Company-Wide Onboarding Overview</h1>
              <p className="text-muted-foreground">
                Track onboarding progress and customer requirements across all plants
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/manufacturing-requirements">
              <Button variant="outline" data-testid="button-manage-requirements">
                <Upload className="h-4 w-4 mr-2" />
                Manage Requirements
              </Button>
            </Link>
            <Button>
              <Sparkles className="h-4 w-4 mr-2" />
              AI Analysis
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Plants</p>
                <p className="text-2xl font-bold">{processedData.metrics.totalPlants}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{processedData.metrics.activeOnboardings}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Requirements</p>
                <p className="text-2xl font-bold">{requirementsStats?.total || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Modeling</p>
                <p className="text-2xl font-bold text-blue-600">{requirementsStats?.summary?.inModeling || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Testing</p>
                <p className="text-2xl font-bold text-purple-600">{requirementsStats?.summary?.inTesting || 0}</p>
              </div>
              <FlaskConical className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Deployed</p>
                <p className="text-2xl font-bold text-green-600">{requirementsStats?.summary?.deployed || 0}</p>
              </div>
              <Rocket className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="getting-started" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="getting-started" data-testid="tab-getting-started" className="flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            Getting Started
          </TabsTrigger>
          <TabsTrigger value="requirements" data-testid="tab-requirements">Requirements Tracking</TabsTrigger>
          <TabsTrigger value="implementation" data-testid="tab-implementation" className="flex items-center gap-1">
            <GitBranch className="h-4 w-4" />
            Implementation
          </TabsTrigger>
          <TabsTrigger value="overview" data-testid="tab-overview">Plant Overview</TabsTrigger>
          <TabsTrigger value="regional" data-testid="tab-regional">Regional View</TabsTrigger>
          <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
          <TabsTrigger value="ai-insights" data-testid="tab-ai-insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started" className="space-y-4">
          <BenefitsROISection />
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Requirement Lifecycle Pipeline</CardTitle>
                    <CardDescription>Track requirements through modeling, testing, and deployment</CardDescription>
                  </div>
                  <Link href="/manufacturing-requirements">
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload More
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {loadingReqs ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : customerRequirements.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Requirements Uploaded</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload customer requirements to track their implementation progress
                    </p>
                    <Link href="/manufacturing-requirements">
                      <Button>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Requirements
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      {LIFECYCLE_STAGES.map(stage => {
                        const reqs = requirementsByStage[stage.key as keyof typeof requirementsByStage];
                        const completed = reqs.filter(r => 
                          (stage.key === 'modeling' && r.lifecycleStatus === 'modeling_complete') ||
                          (stage.key === 'testing' && r.lifecycleStatus === 'testing_complete') ||
                          (stage.key === 'deployment' && r.lifecycleStatus === 'deployed')
                        ).length;
                        
                        return (
                          <Card key={stage.key} className={cn(
                            "p-4 border-2",
                            stage.color === 'blue' && "border-blue-200 bg-blue-50 dark:bg-blue-950/20",
                            stage.color === 'purple' && "border-purple-200 bg-purple-50 dark:bg-purple-950/20",
                            stage.color === 'orange' && "border-orange-200 bg-orange-50 dark:bg-orange-950/20"
                          )}>
                            <div className="flex items-center gap-2 mb-3">
                              <stage.icon className={cn(
                                "h-5 w-5",
                                stage.color === 'blue' && "text-blue-600",
                                stage.color === 'purple' && "text-purple-600",
                                stage.color === 'orange' && "text-orange-600"
                              )} />
                              <h4 className="font-semibold">{stage.label}</h4>
                            </div>
                            <div className="text-3xl font-bold mb-1">{reqs.length}</div>
                            <div className="text-sm text-muted-foreground">
                              {completed} completed
                            </div>
                            <Progress 
                              value={reqs.length > 0 ? (completed / reqs.length) * 100 : 0} 
                              className="h-2 mt-2" 
                            />
                          </Card>
                        );
                      })}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">Recent Requirements</h4>
                      <ScrollArea className="h-[300px]">
                        {customerRequirements.slice(0, 10).map(req => {
                          const stage = getLifecycleStage(req.lifecycleStatus);
                          const stageInfo = LIFECYCLE_STAGES.find(s => s.key === stage);
                          const progress = getStageProgress(req, stage);
                          
                          return (
                            <div 
                              key={req.id} 
                              className="flex items-center justify-between p-3 border rounded-lg mb-2 hover:bg-muted/50"
                              data-testid={`requirement-row-${req.id}`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{req.requirementName}</span>
                                  <Badge variant="outline" className="text-xs">{req.segment}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {req.customerName}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="flex items-center gap-1 text-sm">
                                    {stageInfo && <stageInfo.icon className="h-3 w-3" />}
                                    <span>{stageInfo?.label}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">{progress}%</div>
                                </div>
                                <div className="w-[80px]">
                                  <Progress value={progress} className="h-2" />
                                </div>
                                {req.lifecycleStatus === 'deployed' && (
                                  <Badge className="bg-green-600 text-white">
                                    <Check className="h-3 w-3 mr-1" />
                                    Done
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>By Lifecycle Stage</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={lifecycleChartData} layout="vertical">
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>By Segment</CardTitle>
                </CardHeader>
                <CardContent>
                  {segmentChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={segmentChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          dataKey="value"
                          label={(entry) => entry.name}
                        >
                          {segmentChartData.map((_, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={[COLORS.primary, COLORS.purple, COLORS.teal, COLORS.warning, COLORS.success][index % 5]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">
                      {requirementsStats?.summary?.completionRate || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {requirementsStats?.summary?.deployed || 0} of {requirementsStats?.total || 0} deployed
                    </p>
                    <Progress 
                      value={requirementsStats?.summary?.completionRate || 0} 
                      className="h-3 mt-4" 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="implementation" className="space-y-4">
          <ImplementationFrameworkHub />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Status Distribution</CardTitle>
                <CardDescription>Current status across all plants</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={processedData.byStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {processedData.byStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress Distribution</CardTitle>
                <CardDescription>Plants grouped by completion percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={processedData.byProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Plant Onboarding Details</CardTitle>
              <CardDescription>Detailed status for each plant</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {overviewData.map((plant: any) => (
                    <div
                      key={plant.plant_code}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => setSelectedPlant(plant)}
                    >
                      <div className="flex items-center gap-4">
                        <Factory className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="font-semibold">{plant.plant_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {plant.onboarding_name || 'No active onboarding'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Progress</p>
                          <p className="font-semibold">{plant.overall_progress || 0}%</p>
                        </div>
                        <Progress 
                          value={plant.overall_progress || 0} 
                          className="w-[100px]"
                        />
                        <Badge className={getStatusBadge(plant.status || 'not-started')}>
                          {plant.status || 'Not Started'}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Regional Distribution</CardTitle>
                <CardDescription>Onboarding progress by region</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="10%" 
                    outerRadius="90%" 
                    data={processedData.byRegion}
                  >
                    <RadialBar
                      minAngle={15}
                      label={{ position: 'insideStart', fill: '#fff' }}
                      background
                      clockWise
                      dataKey="progress"
                      fill={COLORS.primary}
                    />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Performance</CardTitle>
                <CardDescription>Detailed metrics by region</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {processedData.byRegion.map((region) => (
                    <div
                      key={region.name}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-colors",
                        selectedRegion === region.name ? "bg-blue-50 border-blue-300 dark:bg-blue-950" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                      onClick={() => setSelectedRegion(region.name)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{region.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {region.plants} plants
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                            {region.onTrack} on track
                          </Badge>
                          {region.atRisk > 0 && (
                            <Badge variant="outline" className="bg-red-50 dark:bg-red-950">
                              {region.atRisk} at risk
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Average Progress</span>
                          <span className="font-medium">{region.progress}%</span>
                        </div>
                        <Progress value={region.progress} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Timeline</CardTitle>
              <CardDescription>Historical progress across all plants</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={processedData.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => {
                      try {
                        return format(new Date(date), 'MMM dd');
                      } catch {
                        return date;
                      }
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => {
                      try {
                        return format(new Date(date), 'MMM dd, yyyy');
                      } catch {
                        return date;
                      }
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="progress" 
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    dot={{ fill: COLORS.primary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI-Powered Insights & Recommendations
              </CardTitle>
              <CardDescription>
                Intelligent analysis of onboarding patterns and optimization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Key Insights
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg bg-green-50 border-green-200 dark:bg-green-950/30">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        High Success Pattern Detected
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Requirements that complete modeling within 14 days have 85% higher deployment success rate
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Common Bottleneck Identified
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Testing phase takes 40% longer than estimated across all segments
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg bg-blue-50 border-blue-200 dark:bg-blue-950/30">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Optimization Opportunity
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Parallel testing of similar requirements could reduce overall timeline by 25%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Recommended Actions
                  </h3>
                  <div className="space-y-2">
                    <Button className="w-full justify-start" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Custom Template for Life Sciences Requirements
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Schedule Group Testing Session for Chemical Industry
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Package className="h-4 w-4 mr-2" />
                      Deploy Quick Start Package to Requirements At Risk
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Layers className="h-4 w-4 mr-2" />
                      Enable Advanced Analytics for Deployed Requirements
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

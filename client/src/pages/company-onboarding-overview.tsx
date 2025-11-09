import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, LineChart, Line, Area
} from 'recharts';
import {
  Factory, TrendingUp, Clock, CheckCircle2, AlertCircle, Users,
  Package, Target, Calendar, FileText, Sparkles, Building2,
  ChevronRight, Globe, Activity, Award, Layers, Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Color scheme for charts
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

export default function CompanyOnboardingOverview() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<any>(null);

  // Fetch company-wide onboarding data
  const { data: overviewData = [], isLoading } = useQuery({
    queryKey: ['/api/onboarding/company-overview']
  });

  // Fetch AI recommendations summary
  const { data: recommendations = [] } = useQuery({
    queryKey: ['/api/onboarding/recommendations/summary']
  });

  // Process data for visualizations
  const processedData = React.useMemo(() => {
    if (!overviewData.length) return {
      byStatus: [],
      byProgress: [],
      byRegion: [],
      timeline: [],
      metrics: {
        totalPlants: 0,
        activeOnboardings: 0,
        completedOnboardings: 0,
        averageProgress: 0,
        onTrackCount: 0,
        atRiskCount: 0
      }
    };

    // Group by status
    const statusCounts = overviewData.reduce((acc: any, plant: any) => {
      const status = plant.status || 'not-started';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('-', ' ').charAt(0).toUpperCase() + status.slice(1),
      value: count as number,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS]
    }));

    // Group by progress ranges
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

    const byProgress = progressRanges.map(r => ({
      name: r.range,
      value: r.count
    }));

    // Mock regional data (in production, this would come from the backend)
    const byRegion = [
      { name: 'North America', plants: 12, progress: 68, onTrack: 9, atRisk: 3 },
      { name: 'Europe', plants: 8, progress: 75, onTrack: 7, atRisk: 1 },
      { name: 'Asia Pacific', plants: 15, progress: 62, onTrack: 10, atRisk: 5 },
      { name: 'Latin America', plants: 5, progress: 80, onTrack: 5, atRisk: 0 }
    ];

    // Timeline data
    const timeline = overviewData
      .filter((p: any) => p.start_date)
      .map((plant: any) => ({
        date: plant.start_date,
        plant: plant.plant_name,
        progress: plant.overall_progress || 0,
        status: plant.status
      }))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate metrics
    const metrics = {
      totalPlants: overviewData.length,
      activeOnboardings: overviewData.filter((p: any) => p.status === 'in-progress').length,
      completedOnboardings: overviewData.filter((p: any) => p.status === 'completed').length,
      averageProgress: Math.round(
        overviewData.reduce((sum: number, p: any) => sum + (p.overall_progress || 0), 0) / 
        (overviewData.length || 1)
      ),
      onTrackCount: overviewData.filter((p: any) => {
        if (!p.target_completion_date) return true;
        const daysRemaining = Math.ceil(
          (new Date(p.target_completion_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysRemaining >= 0 || p.overall_progress >= 80;
      }).length,
      atRiskCount: overviewData.filter((p: any) => {
        if (!p.target_completion_date) return false;
        const daysRemaining = Math.ceil(
          (new Date(p.target_completion_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysRemaining < 0 && p.overall_progress < 80;
      }).length
    };

    return {
      byStatus,
      byProgress,
      byRegion,
      timeline,
      metrics
    };
  }, [overviewData]);

  const getStatusBadge = (status: string) => {
    const colors: any = {
      'completed': 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'paused': 'bg-yellow-100 text-yellow-800',
      'not-started': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Globe className="h-10 w-10 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Company-Wide Onboarding Overview</h1>
              <p className="text-muted-foreground">
                Track onboarding progress across all plants globally
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Requirements
            </Button>
            <Button>
              <Sparkles className="h-4 w-4 mr-2" />
              AI Analysis
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
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
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{processedData.metrics.completedOnboardings}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold">{processedData.metrics.averageProgress}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On Track</p>
                <p className="text-2xl font-bold text-green-600">
                  {processedData.metrics.onTrackCount}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="text-2xl font-bold text-red-600">
                  {processedData.metrics.atRiskCount}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="regional">Regional View</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
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

            {/* Progress Distribution */}
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

          {/* Plant Details Table */}
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
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
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

        {/* Regional View Tab */}
        <TabsContent value="regional" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Regional Map */}
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

            {/* Regional Details */}
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
                        selectedRegion === region.name ? "bg-blue-50 border-blue-300" : "hover:bg-gray-50"
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
                          <Badge variant="outline" className="bg-green-50">
                            {region.onTrack} on track
                          </Badge>
                          {region.atRisk > 0 && (
                            <Badge variant="outline" className="bg-red-50">
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

        {/* Timeline Tab */}
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
                    tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
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

        {/* AI Insights Tab */}
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
                {/* Key Insights */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Key Insights
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg bg-green-50 border-green-200">
                      <p className="text-sm font-medium text-green-800">
                        🎯 High Success Pattern Detected
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        Plants that complete Phase 1 within 14 days have 85% higher success rate
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                      <p className="text-sm font-medium text-yellow-800">
                        ⚠️ Common Bottleneck Identified
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Data integration phase takes 40% longer than estimated across all regions
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                      <p className="text-sm font-medium text-blue-800">
                        💡 Optimization Opportunity
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Implementing parallel training tracks could reduce overall timeline by 25%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recommended Actions */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Recommended Actions
                  </h3>
                  <div className="space-y-2">
                    <Button className="w-full justify-start" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Custom Template for Chemical Industry
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Schedule Group Training for Asia Pacific Plants
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Package className="h-4 w-4 mr-2" />
                      Deploy Quick Start Package to 3 At-Risk Plants
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Layers className="h-4 w-4 mr-2" />
                      Enable Advanced Analytics for Completed Plants
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
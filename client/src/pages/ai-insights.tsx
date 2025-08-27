import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Activity, 
  Play, 
  Eye,
  Clock,
  BarChart3,
  Target,
  Zap,
  Brain,
  Search,
  Filter,
  Calendar,
  Download,
  RefreshCw,
  ChevronRight,
  Users,
  Factory,
  Cog,
  ArrowUpRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

interface AIInsight {
  id: string;
  type: 'insight' | 'anomaly' | 'recommendation' | 'simulation' | 'optimization' | 'bottleneck' | 'conflict' | 'forecast' | 'quality' | 'maintenance';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  source: 'max_ai' | 'monitoring_agent' | 'production_optimizer' | 'quality_ai' | 'predictive_maintenance';
  category: 'production' | 'quality' | 'maintenance' | 'supply_chain' | 'finance' | 'safety' | 'efficiency';
  status: 'new' | 'in_progress' | 'resolved' | 'dismissed';
  actionable: boolean;
  impact?: string;
  recommendation?: string;
  confidence?: number;
  affected_areas?: string[];
  estimated_savings?: number;
  implementation_time?: string;
  related_insights?: string[];
}

const INSIGHT_TYPES = [
  { value: 'all', label: 'All Types', icon: Sparkles },
  { value: 'insight', label: 'Insights', icon: Lightbulb },
  { value: 'anomaly', label: 'Anomalies', icon: AlertTriangle },
  { value: 'recommendation', label: 'Recommendations', icon: Target },
  { value: 'optimization', label: 'Optimizations', icon: Zap },
  { value: 'forecast', label: 'Forecasts', icon: TrendingUp },
  { value: 'quality', label: 'Quality', icon: CheckCircle },
  { value: 'maintenance', label: 'Maintenance', icon: Cog }
];

const PRIORITY_FILTERS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' }
];

export default function AIInsightsPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [timeRange, setTimeRange] = useState('7d');

  // Fetch insights data
  const { data: insights = [], isLoading, refetch } = useQuery<AIInsight[]>({
    queryKey: ['/api/ai-insights', { timeRange, location }],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mutation to update insight status
  const updateInsightMutation = useMutation({
    mutationFn: async ({ insightId, status }: { insightId: string; status: string }) => {
      return await apiRequest('PATCH', `/api/ai-insights/${insightId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-insights'] });
    },
  });

  // Filter and search insights
  const filteredInsights = useMemo(() => {
    return insights.filter(insight => {
      const matchesSearch = !searchQuery || 
        insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insight.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'all' || insight.type === typeFilter;
      const matchesPriority = priorityFilter === 'all' || insight.priority === priorityFilter;
      const matchesStatus = statusFilter === 'all' || insight.status === statusFilter;
      
      return matchesSearch && matchesType && matchesPriority && matchesStatus;
    });
  }, [insights, searchQuery, typeFilter, priorityFilter, statusFilter]);

  // Group insights by category
  const insightsByCategory = useMemo(() => {
    const grouped = filteredInsights.reduce((acc, insight) => {
      const category = insight.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(insight);
      return acc;
    }, {} as Record<string, AIInsight[]>);
    return grouped;
  }, [filteredInsights]);

  // Get insight statistics
  const stats = useMemo(() => {
    const total = insights.length;
    const newCount = insights.filter(i => i.status === 'new').length;
    const criticalCount = insights.filter(i => i.priority === 'critical').length;
    const actionableCount = insights.filter(i => i.actionable).length;
    const totalSavings = insights
      .filter(i => i.estimated_savings)
      .reduce((sum, i) => sum + (i.estimated_savings || 0), 0);

    return {
      total,
      new: newCount,
      critical: criticalCount,
      actionable: actionableCount,
      totalSavings
    };
  }, [insights]);

  const getTypeIcon = (type: string) => {
    const iconMap = {
      insight: Lightbulb,
      anomaly: AlertTriangle,
      recommendation: Target,
      optimization: Zap,
      bottleneck: Activity,
      conflict: XCircle,
      forecast: TrendingUp,
      quality: CheckCircle,
      maintenance: Cog,
      simulation: Brain
    };
    return iconMap[type as keyof typeof iconMap] || Sparkles;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'dismissed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleInsightAction = async (insight: AIInsight, action: string) => {
    try {
      if (action === 'apply' && insight.recommendation) {
        // Handle applying recommendation
        console.log('Applying recommendation:', insight.recommendation);
      } else if (action === 'investigate') {
        // Navigate to relevant page or open detailed view
        setSelectedInsight(insight);
      } else if (action === 'resolve') {
        await updateInsightMutation.mutateAsync({
          insightId: insight.id,
          status: 'resolved'
        });
      } else if (action === 'dismiss') {
        await updateInsightMutation.mutateAsync({
          insightId: insight.id,
          status: 'dismissed'
        });
      }
    } catch (error) {
      console.error('Error handling insight action:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  AI Insights Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Comprehensive insights from Max AI and other intelligent agents
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Insights</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                </div>
                <Sparkles className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Actionable</p>
                  <p className="text-2xl font-bold text-green-600">{stats.actionable}</p>
                </div>
                <Target className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Est. Savings</p>
                  <p className="text-2xl font-bold text-purple-600">${stats.totalSavings.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {INSIGHT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_FILTERS.map(filter => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map(filter => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredInsights.map((insight) => {
            const TypeIcon = getTypeIcon(insight.type);
            return (
              <Card 
                key={insight.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-purple-500"
                onClick={() => setSelectedInsight(insight)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <TypeIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-sm leading-tight">{insight.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                            {insight.priority}
                          </Badge>
                          <Badge className={cn("text-xs", getStatusColor(insight.status))}>
                            {insight.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
                    {insight.description}
                  </p>
                  
                  {insight.confidence && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Confidence</span>
                        <span className="font-medium">{insight.confidence}%</span>
                      </div>
                      <Progress value={insight.confidence} className="h-1" />
                    </div>
                  )}

                  {insight.estimated_savings && (
                    <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Est. savings: ${insight.estimated_savings.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="capitalize">{insight.source.replace('_', ' ')}</span>
                    <span>{new Date(insight.timestamp).toLocaleDateString()}</span>
                  </div>

                  {insight.actionable && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInsightAction(insight, 'apply');
                        }}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Apply
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInsightAction(insight, 'investigate');
                        }}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredInsights.length === 0 && (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No insights found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your filters or check back later for new insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
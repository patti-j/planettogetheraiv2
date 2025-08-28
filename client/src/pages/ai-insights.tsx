import React, { useState } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Target,
  Zap,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  Factory,
  Cog,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  ArrowUpRight,
  Play,
  X,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface AIInsight {
  id: string;
  type: 'optimization' | 'quality' | 'maintenance' | 'inventory' | 'bottleneck' | 'forecast';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  source: string;
  category: string;
  status: 'new' | 'applied' | 'ignored' | 'in_progress';
  actionable: boolean;
  impact?: string;
  recommendation?: string;
  confidence?: number;
  affected_areas?: string[];
  estimated_savings?: number;
  implementation_time?: string;
}

const INSIGHT_TYPES = [
  { value: 'all', label: 'All Types', icon: Sparkles },
  { value: 'optimization', label: 'Optimizations', icon: Zap },
  { value: 'quality', label: 'Quality', icon: CheckCircle },
  { value: 'maintenance', label: 'Maintenance', icon: Cog },
  { value: 'inventory', label: 'Inventory', icon: Factory },
  { value: 'bottleneck', label: 'Bottlenecks', icon: AlertTriangle },
  { value: 'forecast', label: 'Forecasts', icon: TrendingUp }
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
  { value: 'applied', label: 'Applied' },
  { value: 'ignored', label: 'Ignored' }
];

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'critical': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
}

function getTypeIcon(type: string) {
  const iconMap = {
    optimization: Zap,
    quality: CheckCircle,
    maintenance: Cog,
    inventory: Factory,
    bottleneck: AlertTriangle,
    forecast: TrendingUp
  };
  return iconMap[type as keyof typeof iconMap] || Lightbulb;
}

export default function AIInsightsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Generate sample insights directly in component
  const generateSampleInsights = (): AIInsight[] => {
    const timestamp = new Date().toISOString();
    const baseTime = Date.now();
    
    return [
      {
        id: `insight_${baseTime}_1`,
        type: 'optimization',
        title: 'Brewing Sequence Optimization Available',
        description: 'Analysis shows potential 15% efficiency gain by reordering upcoming brewing operations.',
        priority: 'high',
        timestamp,
        source: 'scheduling_optimizer',
        category: 'production',
        status: 'new',
        actionable: true,
        impact: 'Reduce total production time by 3.8 hours',
        recommendation: 'Apply optimized sequence starting tomorrow morning',
        confidence: 94,
        affected_areas: ['Brew Kettle 1', 'Fermentation Tank 2'],
        estimated_savings: 1850,
        implementation_time: '10 minutes'
      },
      {
        id: `insight_${baseTime}_2`,
        type: 'quality',
        title: 'Temperature Variance Alert',
        description: 'Fermentation temperatures in Tank 3 showing 0.8°C variance from optimal range.',
        priority: 'medium',
        timestamp,
        source: 'quality_monitor',
        category: 'quality',
        status: 'new',
        actionable: true,
        impact: 'Prevent potential batch quality issues',
        recommendation: 'Calibrate temperature sensors and check insulation',
        confidence: 92,
        affected_areas: ['Fermentation Tank 3'],
        estimated_savings: 850,
        implementation_time: '45 minutes'
      },
      {
        id: `insight_${baseTime}_3`,
        type: 'maintenance',
        title: 'Pump Performance Degradation',
        description: 'Transfer Pump P-102 showing 15% decrease in flow rate over past week.',
        priority: 'critical',
        timestamp,
        source: 'predictive_maintenance',
        category: 'maintenance',
        status: 'new',
        actionable: true,
        impact: 'Prevent unplanned downtime',
        recommendation: 'Schedule pump inspection during next maintenance window',
        confidence: 87,
        affected_areas: ['Transfer Pump P-102'],
        estimated_savings: 3200,
        implementation_time: '2 hours'
      },
      {
        id: `insight_${baseTime}_4`,
        type: 'inventory',
        title: 'Raw Material Stock Optimization',
        description: 'Hops inventory shows opportunity to reduce carrying costs while maintaining production schedule.',
        priority: 'low',
        timestamp,
        source: 'inventory_optimizer',
        category: 'supply_chain',
        status: 'new',
        actionable: true,
        impact: 'Reduce inventory carrying costs',
        recommendation: 'Adjust next hops delivery by 3 days',
        confidence: 76,
        affected_areas: ['Raw Materials Warehouse'],
        estimated_savings: 420,
        implementation_time: '10 minutes'
      },
      {
        id: `insight_${baseTime}_5`,
        type: 'bottleneck',
        title: 'Packaging Line Bottleneck',
        description: 'Packaging Line 2 operating at 134% capacity, creating downstream delays.',
        priority: 'high',
        timestamp,
        source: 'throughput_monitor',
        category: 'production',
        status: 'new',
        actionable: true,
        impact: 'Potential 6-hour production delay',
        recommendation: 'Redistribute workload to Packaging Line 1',
        confidence: 92,
        affected_areas: ['Packaging Line 2'],
        estimated_savings: 2400,
        implementation_time: '30 minutes'
      },
      // Add some insights with different statuses for demonstration
      {
        id: `insight_${baseTime}_6`,
        type: 'optimization',
        title: 'Energy Usage Optimization',
        description: 'HVAC system running 18% above optimal during off-peak hours.',
        priority: 'medium',
        timestamp,
        source: 'energy_monitor',
        category: 'efficiency',
        status: 'applied',
        actionable: true,
        impact: 'Reduce energy costs by 12%',
        recommendation: 'Adjust HVAC schedule for off-peak optimization',
        confidence: 84,
        affected_areas: ['HVAC System'],
        estimated_savings: 850,
        implementation_time: '15 minutes'
      },
      {
        id: `insight_${baseTime}_7`,
        type: 'quality',
        title: 'Batch Consistency Improvement',
        description: 'Temperature variance in Fermentation Tank 3 exceeds quality standards.',
        priority: 'high',
        timestamp,
        source: 'quality_monitor',
        category: 'quality',
        status: 'in_progress',
        actionable: true,
        impact: 'Maintain product quality standards',
        recommendation: 'Calibrate temperature sensors and adjust control parameters',
        confidence: 91,
        affected_areas: ['Fermentation Tank 3'],
        estimated_savings: 1200,
        implementation_time: '45 minutes'
      },
      {
        id: `insight_${baseTime}_8`,
        type: 'maintenance',
        title: 'Conveyor Belt Wear Analysis',
        description: 'Belt tension fluctuations indicate potential wear on Conveyor B-7.',
        priority: 'low',
        timestamp,
        source: 'vibration_analysis',
        category: 'maintenance',
        status: 'ignored',
        actionable: true,
        impact: 'Prevent unexpected belt failure',
        recommendation: 'Schedule belt inspection and tension adjustment',
        confidence: 67,
        affected_areas: ['Conveyor B-7'],
        estimated_savings: 300,
        implementation_time: '1 hour'
      }
    ];
  };

  // Use local state for insights data
  const [insights, setInsights] = useState<AIInsight[]>(generateSampleInsights());

  // Filter insights based on search and filters
  const filteredInsights = insights.filter(insight => {
    const matchesSearch = insight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         insight.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || insight.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || insight.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || insight.status === statusFilter;
    
    return matchesSearch && matchesType && matchesPriority && matchesStatus;
  });

  // Action functions for insights
  const applyRecommendation = (insightId: string) => {
    setInsights(prev => prev.map(insight => 
      insight.id === insightId 
        ? { ...insight, status: 'applied' as const }
        : insight
    ));
    
    const insight = insights.find(i => i.id === insightId);
    toast({
      title: "Recommendation Applied",
      description: `Applied: ${insight?.title}. Implementation time: ${insight?.implementation_time}`,
      variant: "default"
    });
  };

  const ignoreRecommendation = (insightId: string) => {
    setInsights(prev => prev.map(insight => 
      insight.id === insightId 
        ? { ...insight, status: 'ignored' as const }
        : insight
    ));
    
    const insight = insights.find(i => i.id === insightId);
    toast({
      title: "Recommendation Ignored",
      description: `Ignored: ${insight?.title}`,
      variant: "default"
    });
  };

  const markInProgress = (insightId: string) => {
    setInsights(prev => prev.map(insight => 
      insight.id === insightId 
        ? { ...insight, status: 'in_progress' as const }
        : insight
    ));
    
    const insight = insights.find(i => i.id === insightId);
    toast({
      title: "Marked In Progress",
      description: `Working on: ${insight?.title}`,
      variant: "default"
    });
  };

  // Refresh insights
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    toast({
      title: "Max AI Analyzing",
      description: "Generating fresh insights from current production data...",
    });

    // Simulate brief processing time
    setTimeout(() => {
      setInsights(generateSampleInsights());
      setIsRefreshing(false);
      
      toast({
        title: "Fresh Insights Generated",
        description: `Generated ${filteredInsights.length} new insights with updated recommendations.`,
      });
    }, 1000);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            AI Insights
          </h1>
          <p className="text-muted-foreground">
            Real-time AI analysis and recommendations for production optimization
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            {isRefreshing ? 'Analyzing...' : 'Refresh with AI'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.length}</div>
            <p className="text-xs text-muted-foreground">
              {insights.filter(i => i.priority === 'critical' || i.priority === 'high').length} high priority
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${insights.reduce((sum, i) => sum + (i.estimated_savings || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Est. this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(insights.reduce((sum, i) => sum + (i.confidence || 0), 0) / insights.length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              AI confidence level
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Wins</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.filter(i => i.implementation_time?.includes('minute')).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Under 1 hour to implement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search insights..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INSIGHT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_FILTERS.map(priority => (
                <SelectItem key={priority.value} value={priority.value}>
                  {priority.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredInsights.map((insight) => {
          const IconComponent = getTypeIcon(insight.type);
          
          return (
            <Card key={insight.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4 text-primary" />
                    <Badge variant="outline" className="text-xs">
                      {insight.type}
                    </Badge>
                  </div>
                  <div className={cn("w-2 h-2 rounded-full", getPriorityColor(insight.priority))} />
                </div>
                <CardTitle className="text-sm font-medium leading-tight">
                  {insight.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-3">
                <p className="text-sm text-muted-foreground">
                  {insight.description}
                </p>
                
                {insight.impact && (
                  <div className="text-xs bg-muted p-2 rounded">
                    <strong>Impact:</strong> {insight.impact}
                  </div>
                )}
                
                {insight.recommendation && (
                  <div className="text-xs bg-blue-50 dark:bg-blue-950/20 p-2 rounded border-l-2 border-blue-500">
                    <strong>Recommendation:</strong> {insight.recommendation}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{insight.confidence}% confidence</span>
                  <span>{insight.implementation_time}</span>
                </div>
                
                {insight.estimated_savings && (
                  <div className="text-sm font-medium text-green-600">
                    Est. savings: ${insight.estimated_savings.toLocaleString()}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  {new Date(insight.timestamp).toLocaleString()}
                </div>

                {/* Action Buttons */}
                {insight.status === 'new' && insight.actionable && (
                  <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                    <TooltipProvider>
                      <div className="grid grid-cols-3 gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => ignoreRecommendation(insight.id)}
                              className="h-6 px-1 text-[10px] py-0"
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ignore this recommendation</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markInProgress(insight.id)}
                              className="h-6 px-1 text-[10px] py-0"
                            >
                              <Play className="h-2 w-2" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mark as in progress</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => applyRecommendation(insight.id)}
                              className="h-6 px-1 text-[10px] bg-green-600 hover:bg-green-700 text-white py-0"
                            >
                              <Check className="h-2 w-2" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Apply recommendation</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>
                )}

                {/* Status indicators for non-new insights */}
                {insight.status !== 'new' && (
                  <div className="pt-3 border-t">
                    <Badge 
                      variant={insight.status === 'applied' ? 'default' : insight.status === 'ignored' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {insight.status === 'applied' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {insight.status === 'ignored' && <XCircle className="h-3 w-3 mr-1" />}
                      {insight.status === 'in_progress' && <Clock className="h-3 w-3 mr-1" />}
                      {insight.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredInsights.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Sparkles className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No insights found</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Try adjusting your filters or refresh to generate new insights.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
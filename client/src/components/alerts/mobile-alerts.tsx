import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  ChevronRight,
  ChevronDown,
  Clock,
  User,
  MessageSquare,
  TrendingUp,
  Shield,
  Zap,
  Eye,
  EyeOff,
  Filter,
  Brain,
  Bell,
  BellOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Alert {
  id: number;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'active' | 'acknowledged' | 'resolved' | 'escalated';
  type: string;
  plantId?: number;
  departmentId?: number;
  resourceId?: number;
  jobId?: number;
  operationId?: number;
  metadata?: any;
  suggestedActions?: string[];
  aiInsights?: string;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: number;
  resolvedAt?: string;
  resolvedBy?: number;
  resolution?: string;
  rootCause?: string;
  escalatedTo?: number;
  escalationReason?: string;
}

interface AlertStats {
  total: number;
  active: number;
  acknowledged: number;
  resolved: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  byType: Record<string, number>;
  avgResolutionTime: number;
  trendsLastWeek: {
    date: string;
    count: number;
  }[];
}

export function MobileAlerts() {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<number>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  const [resolution, setResolution] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [showAcknowledgeDialog, setShowAcknowledgeDialog] = useState(false);
  const [acknowledgeComment, setAcknowledgeComment] = useState('');
  
  // AI Settings state
  const [aiSettings, setAiSettings] = useState({
    globalAiEnabled: true,
    confidenceThreshold: 75,
    autoCreateAlerts: true,
    emailNotifications: true,
    smartFiltering: true,
    learningMode: true
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch alerts
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/alerts', severityFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const response = await apiRequest('GET', `/api/alerts?${params}`);
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch alert statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/alerts/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/alerts/stats');
      return response.json();
    }
  });

  // AI insights will be integrated with Max AI service
  const aiInsights = null;

  // Acknowledge alert mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: number; comment?: string }) => {
      const response = await apiRequest('POST', `/api/alerts/${id}/acknowledge`, { comment });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/stats'] });
      toast({
        title: "Alert Acknowledged",
        description: "The alert has been acknowledged successfully."
      });
      setShowAcknowledgeDialog(false);
      setAcknowledgeComment('');
    }
  });

  // Resolve alert mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ id, resolution, rootCause }: { id: number; resolution: string; rootCause?: string }) => {
      const response = await apiRequest('POST', `/api/alerts/${id}/resolve`, { resolution, rootCause });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/stats'] });
      toast({
        title: "Alert Resolved",
        description: "The alert has been resolved successfully."
      });
      setShowResolutionDialog(false);
      setResolution('');
      setRootCause('');
    }
  });

  // AI Settings mutation
  const updateAiSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await apiRequest('PUT', '/api/alerts/ai-settings', settings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "AI Settings Updated",
        description: "Your AI alert preferences have been saved successfully."
      });
    }
  });

  // Generate AI alert mutation
  const generateAIAlertMutation = useMutation({
    mutationFn: async (context: any) => {
      const response = await apiRequest('POST', '/api/alerts/ai', {
        title: "AI-Generated Alert",
        description: "Analyzing system conditions...",
        type: "ai_analysis",
        context
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({
        title: "AI Alert Created",
        description: "AI has analyzed the system and created relevant alerts."
      });
    }
  });

  const toggleAlertExpansion = (alertId: number) => {
    const newExpanded = new Set(expandedAlerts);
    if (newExpanded.has(alertId)) {
      newExpanded.delete(alertId);
    } else {
      newExpanded.add(alertId);
    }
    setExpandedAlerts(newExpanded);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="destructive">Active</Badge>;
      case 'acknowledged':
        return <Badge variant="secondary">Acknowledged</Badge>;
      case 'resolved':
        return <Badge variant="default">Resolved</Badge>;
      case 'escalated':
        return <Badge variant="outline">Escalated</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Filter alerts based on selected filters
  const getFilteredAlerts = (tabStatus: string) => {
    return alerts.filter((alert: Alert) => {
      if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
      if (tabStatus !== 'all' && alert.status !== tabStatus) return false;
      return true;
    });
  };
  
  const filteredAlerts = getFilteredAlerts('active');

  // Group alerts by severity for quick overview
  const criticalAlerts = filteredAlerts.filter((a: Alert) => a.severity === 'critical' && a.status === 'active');
  const highAlerts = filteredAlerts.filter((a: Alert) => a.severity === 'high' && a.status === 'active');

  return (
    <div className="space-y-4 p-3 sm:p-4">
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
          <TabsTrigger value="acknowledged" className="text-xs">Ack'd</TabsTrigger>
          <TabsTrigger value="resolved" className="text-xs">Resolved</TabsTrigger>
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="ai-settings" className="flex items-center gap-1 text-xs">
            <Sparkles className="h-3 w-3" />
            AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          {/* Quick Stats */}
          {stats && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Card className="bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.critical || 0}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.high || 0}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Insights Panel */}
      {aiInsights?.insights && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{aiInsights.insights}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => generateAIAlertMutation.mutate({})}
            >
              <Zap className="h-3 w-3 mr-1" />
              Generate AI Alerts
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-[120px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {criticalAlerts.length} Critical Alert{criticalAlerts.length !== 1 ? 's' : ''} Require Immediate Attention
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Alerts List */}
      <ScrollArea className="h-[calc(100vh-400px)]">
        <div className="space-y-2">
          {alertsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading alerts...
            </div>
          ) : filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No alerts matching your filters
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert: Alert) => {
              const isExpanded = expandedAlerts.has(alert.id);
              
              return (
                <Card key={alert.id} className={`transition-colors ${
                  alert.severity === 'critical' ? 'border-red-300 dark:border-red-700' :
                  alert.severity === 'high' ? 'border-orange-300 dark:border-orange-700' :
                  ''
                }`}>
                  <CardHeader 
                    className="pb-2 cursor-pointer"
                    onClick={() => toggleAlertExpansion(alert.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1">
                          <h3 className="font-medium text-sm leading-tight">
                            {alert.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(alert.createdAt), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(alert.status)}
                        {isExpanded ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="pt-2">
                      <p className="text-sm text-muted-foreground mb-3">
                        {alert.description}
                      </p>
                      
                      {alert.aiInsights && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="h-3 w-3 text-purple-500" />
                            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                              AI Analysis
                            </span>
                          </div>
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            {alert.aiInsights}
                          </p>
                        </div>
                      )}
                      
                      {alert.suggestedActions && alert.suggestedActions.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium mb-1">Suggested Actions:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {alert.suggestedActions.map((action, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {alert.status === 'active' && (
                        <div className="flex flex-col sm:flex-row gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full sm:w-auto justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAlert(alert);
                              setShowAcknowledgeDialog(true);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Acknowledge
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            className="w-full sm:w-auto justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAlert(alert);
                              setShowResolutionDialog(true);
                            }}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolve
                          </Button>
                        </div>
                      )}
                      
                      {alert.status === 'resolved' && alert.resolution && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mt-3">
                          <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                            Resolution:
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            {alert.resolution}
                          </p>
                          {alert.rootCause && (
                            <>
                              <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1 mt-2">
                                Root Cause:
                              </p>
                              <p className="text-xs text-green-600 dark:text-green-400">
                                {alert.rootCause}
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
        </TabsContent>

        <TabsContent value="acknowledged" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-2">
              {getFilteredAlerts('acknowledged').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No acknowledged alerts found
                </div>
              ) : (
                getFilteredAlerts('acknowledged').map((alert: Alert) => (
                  <Card key={alert.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(alert.severity)}
                          <div>
                            <h3 className="font-medium text-sm">{alert.title}</h3>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(alert.createdAt), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(alert.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-2">
              {getFilteredAlerts('resolved').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No resolved alerts found
                </div>
              ) : (
                getFilteredAlerts('resolved').map((alert: Alert) => (
                  <Card key={alert.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(alert.severity)}
                          <div>
                            <h3 className="font-medium text-sm">{alert.title}</h3>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(alert.createdAt), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(alert.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-2">
              {getFilteredAlerts('all').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No alerts found
                </div>
              ) : (
                getFilteredAlerts('all').map((alert: Alert) => (
                  <Card key={alert.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(alert.severity)}
                          <div>
                            <h3 className="font-medium text-sm">{alert.title}</h3>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(alert.createdAt), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(alert.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="ai-settings" className="space-y-4 mt-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  AI Alert Generation
                </CardTitle>
                <CardDescription className="text-sm">
                  Control how AI analyzes your data and creates alerts automatically
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="global-ai" className="text-sm">Enable AI Alert Generation</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow AI to analyze production data and create alerts automatically
                    </p>
                  </div>
                  <Switch
                    id="global-ai"
                    checked={aiSettings.globalAiEnabled}
                    onCheckedChange={(checked) => 
                      setAiSettings(prev => ({ ...prev, globalAiEnabled: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="confidence-threshold" className="text-sm">AI Confidence: {aiSettings.confidenceThreshold}%</Label>
                    <span className="text-xs text-muted-foreground">
                      {aiSettings.confidenceThreshold >= 90 ? 'Very Conservative' :
                       aiSettings.confidenceThreshold >= 75 ? 'Conservative' :
                       aiSettings.confidenceThreshold >= 50 ? 'Balanced' : 'Aggressive'}
                    </span>
                  </div>
                  <div className="px-2">
                    <input
                      type="range"
                      value={aiSettings.confidenceThreshold}
                      onChange={(e) => 
                        setAiSettings(prev => ({ ...prev, confidenceThreshold: parseInt(e.target.value) }))
                      }
                      max={100}
                      min={25}
                      step={5}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      disabled={!aiSettings.globalAiEnabled}
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((aiSettings.confidenceThreshold - 25) / (100 - 25)) * 100}%, #e5e7eb ${((aiSettings.confidenceThreshold - 25) / (100 - 25)) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>More Alerts</span>
                      <span>Fewer Alerts</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-create" className="text-sm">Auto-Create Alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically create alerts when AI detects issues
                    </p>
                  </div>
                  <Switch
                    id="auto-create"
                    checked={aiSettings.autoCreateAlerts}
                    onCheckedChange={(checked) => 
                      setAiSettings(prev => ({ ...prev, autoCreateAlerts: checked }))
                    }
                    disabled={!aiSettings.globalAiEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="h-4 w-4 text-blue-500" />
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-sm">
                  Choose how you want to be notified about AI-generated alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications" className="text-sm">Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive email notifications for AI-generated alerts
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={aiSettings.emailNotifications}
                    onCheckedChange={(checked) => 
                      setAiSettings(prev => ({ ...prev, emailNotifications: checked }))
                    }
                    disabled={!aiSettings.globalAiEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="smart-filtering" className="text-sm">Smart Filtering</Label>
                    <p className="text-xs text-muted-foreground">
                      AI filters duplicate or similar alerts to reduce noise
                    </p>
                  </div>
                  <Switch
                    id="smart-filtering"
                    checked={aiSettings.smartFiltering}
                    onCheckedChange={(checked) => 
                      setAiSettings(prev => ({ ...prev, smartFiltering: checked }))
                    }
                    disabled={!aiSettings.globalAiEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="learning-mode" className="text-sm">Learning Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      AI learns from your feedback to improve alert quality
                    </p>
                  </div>
                  <Switch
                    id="learning-mode"
                    checked={aiSettings.learningMode}
                    onCheckedChange={(checked) => 
                      setAiSettings(prev => ({ ...prev, learningMode: checked }))
                    }
                    disabled={!aiSettings.globalAiEnabled}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Acknowledge Dialog */}
      <Dialog open={showAcknowledgeDialog} onOpenChange={setShowAcknowledgeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acknowledge Alert</DialogTitle>
            <DialogDescription>
              Acknowledge that you've seen this alert and are investigating.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAlert && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <p className="font-medium text-sm">{selectedAlert.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedAlert.description}
                </p>
              </div>
            )}
            <Textarea
              placeholder="Add a comment (optional)"
              value={acknowledgeComment}
              onChange={(e) => setAcknowledgeComment(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcknowledgeDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedAlert) {
                  acknowledgeMutation.mutate({ 
                    id: selectedAlert.id, 
                    comment: acknowledgeComment 
                  });
                }
              }}
              disabled={acknowledgeMutation.isPending}
            >
              Acknowledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolution Dialog */}
      <Dialog open={showResolutionDialog} onOpenChange={setShowResolutionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Provide details about how this alert was resolved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAlert && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <p className="font-medium text-sm">{selectedAlert.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedAlert.description}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Resolution *</label>
              <Textarea
                placeholder="Describe how the issue was resolved"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Root Cause (optional)</label>
              <Textarea
                placeholder="What caused this issue?"
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolutionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedAlert && resolution) {
                  resolveMutation.mutate({ 
                    id: selectedAlert.id, 
                    resolution,
                    rootCause 
                  });
                }
              }}
              disabled={!resolution || resolveMutation.isPending}
            >
              Resolve Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
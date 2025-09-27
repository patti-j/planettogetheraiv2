import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { WorkWithAgentModal } from '@/components/WorkWithAgentModal';
import { ReferUserModal } from '@/components/ReferUserModal';
import { 
  Sparkles, 
  Activity, 
  Bell, 
  Inbox, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  MessageSquare,
  Users,
  Eye,
  MoreHorizontal,
  ChevronDown,
  Filter,
  Calendar,
  Zap,
  Bot,
  Target,
  TrendingUp,
  Package,
  Settings,
  RefreshCw,
  Archive,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDeviceType } from '@/hooks/useDeviceType';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Types for our data structures
interface ActionRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  confidence: number;
  estimatedImpact: string;
  createdAt: string;
  aiAgent: string;
}

interface SystemEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'active' | 'resolved' | 'dismissed';
  source: string;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  status: 'unread' | 'read' | 'archived';
}

interface InboxMessage {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
  participants: string[];
}

interface DashboardItem {
  id: number;
  name: string;
  description?: string;
  isDefault: boolean;
  configuration: {
    standardWidgets: any[];
    customWidgets: any[];
  };
}

interface DashboardMetrics {
  activeJobs: number;
  utilization: number;
  alertsCount: number;
  onTimePercentage: number;
  timestamp: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const isMobile = useDeviceType() === 'mobile';
  const [selectedDashboard, setSelectedDashboard] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('actions');
  const [isDashboardCollapsed, setIsDashboardCollapsed] = useState(false);
  const [workWithAgentModal, setWorkWithAgentModal] = useState<{
    isOpen: boolean;
    recommendation: ActionRecommendation | null;
  }>({ isOpen: false, recommendation: null });
  
  const [referUserModal, setReferUserModal] = useState<{
    isOpen: boolean;
    recommendation: ActionRecommendation | null;
  }>({ isOpen: false, recommendation: null });

  const openWorkWithAgent = (recommendation: ActionRecommendation) => {
    setWorkWithAgentModal({ isOpen: true, recommendation });
  };

  const closeWorkWithAgent = () => {
    setWorkWithAgentModal({ isOpen: false, recommendation: null });
  };

  const openReferUser = (recommendation: ActionRecommendation) => {
    setReferUserModal({ isOpen: true, recommendation });
  };

  const closeReferUser = () => {
    setReferUserModal({ isOpen: false, recommendation: null });
  };

  // Fetch available dashboards
  const { data: dashboards = [] } = useQuery<DashboardItem[]>({
    queryKey: ['/api/dashboard-configs'],
  });

  // Fetch real dashboard metrics with retry
  const { 
    data: dashboardMetrics, 
    isLoading: isLoadingMetrics, 
    error: metricsError,
    refetch: refetchMetrics 
  } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard-metrics'],
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch data for the tabs using proper API endpoints
  const { 
    data: aiRecommendations = [], 
    isLoading: isLoadingRecommendations, 
    error: recommendationsError,
    refetch: refetchRecommendations 
  } = useQuery<ActionRecommendation[]>({
    queryKey: ['/api/ai/recommendations'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const { 
    data: systemEvents = [], 
    isLoading: isLoadingEvents, 
    error: eventsError,
    refetch: refetchEvents 
  } = useQuery<SystemEvent[]>({
    queryKey: ['/api/system/events'],
    refetchInterval: 60000, // Refresh every minute
  });

  const { 
    data: alertsData, 
    isLoading: isLoadingAlerts, 
    error: alertsError,
    refetch: refetchAlerts 
  } = useQuery<Alert[]>({
    queryKey: ['/api/alerts'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Ensure alerts is always an array to prevent null errors
  const alerts = alertsData || [];

  const { 
    data: inboxMessages = [], 
    isLoading: isLoadingInbox, 
    error: inboxError,
    refetch: refetchInbox 
  } = useQuery<InboxMessage[]>({
    queryKey: ['/api/inbox'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Get default dashboard or first available
  const defaultDashboard = dashboards.find(d => d.isDefault) || dashboards[0];
  const displayDashboard = selectedDashboard 
    ? dashboards.find(d => d.id === selectedDashboard) 
    : defaultDashboard;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className={`border-b ${isMobile ? 'p-4' : 'p-6'}`}>

        {/* Dashboard Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Dashboard:</label>
            <Select 
              value={selectedDashboard?.toString() || defaultDashboard?.id?.toString() || ''}
              onValueChange={(value) => setSelectedDashboard(parseInt(value))}
              data-testid="dashboard-selector"
            >
              <SelectTrigger className="w-64" data-testid="dashboard-selector-trigger">
                <SelectValue placeholder="Select dashboard..." />
              </SelectTrigger>
              <SelectContent>
                {dashboards.map(dashboard => (
                  <SelectItem 
                    key={dashboard.id} 
                    value={dashboard.id.toString()}
                    data-testid={`dashboard-option-${dashboard.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {dashboard.name}
                      {dashboard.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Dashboard Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDashboardCollapsed(!isDashboardCollapsed)}
            className="gap-2"
            data-testid="dashboard-toggle-button"
          >
            {isDashboardCollapsed ? (
              <>
                <Eye className="w-4 h-4" />
                Show Dashboard
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                Hide Dashboard
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Dashboard Preview - Collapsible */}
      {!isDashboardCollapsed && (
        <div className={`h-1/3 ${isMobile ? 'p-4' : 'p-6'} border-b bg-gray-50 dark:bg-gray-900/20 overflow-auto`}>
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5" />
              {displayDashboard?.name || 'No Dashboard Selected'}
            </CardTitle>
            {displayDashboard?.description && (
              <p className="text-sm text-muted-foreground">
                {displayDashboard.description}
              </p>
            )}
          </CardHeader>
          <CardContent className="pb-6">
            {/* Loading State */}
            {isLoadingMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
                    <div className="w-6 h-6 mx-auto mb-2 bg-gray-300 dark:bg-gray-600 rounded" />
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2 mx-auto w-16" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mx-auto w-20" />
                  </div>
                ))}
              </div>
            )}

            {/* Error State with Retry */}
            {metricsError && !isLoadingMetrics && (
              <div className="text-center p-6 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                  Failed to load dashboard metrics
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchMetrics()}
                  className="border-red-200 text-red-600"
                  data-testid="retry-metrics-button"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            )}

            {/* Real Metrics Display */}
            {!isLoadingMetrics && !metricsError && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg" data-testid="metric-active-jobs">
                  <Package className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{dashboardMetrics?.activeJobs || 0}</div>
                  <div className="text-sm text-muted-foreground">Active Jobs</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg" data-testid="metric-utilization">
                  <Activity className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">{dashboardMetrics?.utilization || 0}%</div>
                  <div className="text-sm text-muted-foreground">Utilization</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg" data-testid="metric-alerts">
                  <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold">{dashboardMetrics?.alertsCount || 0}</div>
                  <div className="text-sm text-muted-foreground">Alerts</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg" data-testid="metric-ontime">
                  <Target className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold">{dashboardMetrics?.onTimePercentage || 0}%</div>
                  <div className="text-sm text-muted-foreground">On-Time</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      )}

      {/* Tabbed Interface - Adaptive height */}
      <div className={`${isDashboardCollapsed ? 'flex-1' : 'h-2/3'} overflow-hidden`}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col" data-testid="main-tabs">
          <div className={`border-b ${isMobile ? 'px-4' : 'px-6'}`}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="actions" className="flex items-center gap-2" data-testid="tab-actions">
                <Sparkles className="w-4 h-4" />
                Actions
                {!isLoadingRecommendations && aiRecommendations.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs" data-testid="actions-count">
                    {aiRecommendations.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2" data-testid="tab-events">
                <Activity className="w-4 h-4" />
                Events
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-2" data-testid="tab-alerts">
                <Bell className="w-4 h-4" />
                Alerts
                {!isLoadingAlerts && alerts.filter(a => a.status === 'unread').length > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs" data-testid="alerts-unread-count">
                    {alerts.filter(a => a.status === 'unread').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="inbox" className="flex items-center gap-2" data-testid="tab-inbox">
                <Inbox className="w-4 h-4" />
                Inbox
                {!isLoadingInbox && inboxMessages.filter(m => !m.isRead).length > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs" data-testid="inbox-unread-count">
                    {inboxMessages.filter(m => !m.isRead).length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto">
            {/* Actions Tab */}
            <TabsContent value="actions" className="h-full p-6 space-y-4" data-testid="actions-tab-content">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">AI Recommendations</h3>
                  <p className="text-sm text-muted-foreground">
                    Smart insights and actionable recommendations from your AI agents
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" data-testid="actions-filter-button">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm" data-testid="actions-settings-button">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>

              {/* Loading State */}
              {isLoadingRecommendations && (
                <div className="space-y-4" data-testid="actions-loading">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                        <div className="h-3 bg-gray-100 rounded mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded mb-4 w-2/3"></div>
                        <div className="flex gap-2">
                          <div className="h-8 bg-gray-200 rounded w-24"></div>
                          <div className="h-8 bg-gray-200 rounded w-32"></div>
                          <div className="h-8 bg-gray-200 rounded w-28"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Error State */}
              {recommendationsError && (
                <Card className="border-red-200 bg-red-50" data-testid="actions-error">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      <h4 className="font-medium">Failed to load AI recommendations</h4>
                    </div>
                    <p className="text-sm text-red-700 mb-4">
                      Unable to fetch the latest recommendations. Please check your connection and try again.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-red-200 text-red-600"
                      onClick={() => refetchRecommendations()}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Content */}
              {!isLoadingRecommendations && !recommendationsError && (
                <div className="space-y-4" data-testid="actions-content">
                  {aiRecommendations.map((recommendation) => (
                    <Card 
                      key={recommendation.id} 
                      className="hover:shadow-md transition-shadow"
                      data-testid={`recommendation-card-${recommendation.id}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                className={`text-xs ${getPriorityColor(recommendation.priority)}`}
                                data-testid={`priority-${recommendation.priority}`}
                              >
                                {recommendation.priority.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {recommendation.category}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                <Bot className="w-3 h-3 mr-1" />
                                {recommendation.aiAgent}
                              </Badge>
                            </div>
                            <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-2">
                              {recommendation.description}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm">
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4 text-green-600" />
                                {recommendation.confidence}% confidence
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                {recommendation.estimatedImpact}
                              </span>
                              <span className="text-muted-foreground">
                                {format(new Date(recommendation.createdAt), 'MMM d, h:mm a')}
                              </span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" data-testid={`more-options-${recommendation.id}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                size="sm" 
                                className="gap-2"
                                data-testid={`resolve-dropdown-${recommendation.id}`}
                              >
                                <CheckCircle className="w-4 h-4" />
                                Resolve
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-64">
                              <DropdownMenuItem 
                                className="flex items-start gap-3 p-4 cursor-pointer"
                                data-testid={`resolve-now-${recommendation.id}`}
                              >
                                <Zap className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="font-medium">Resolve Now</div>
                                  <div className="text-sm text-muted-foreground">Execute the action immediately</div>
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-start gap-3 p-4 cursor-pointer"
                                data-testid={`show-plan-${recommendation.id}`}
                              >
                                <Eye className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="font-medium">Show Plan First</div>
                                  <div className="text-sm text-muted-foreground">Review implementation steps</div>
                                </div>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => openWorkWithAgent(recommendation)}
                            data-testid={`work-with-agent-${recommendation.id}`}
                          >
                            <Bot className="w-4 h-4" />
                            Work with Agent
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => openReferUser(recommendation)}
                            data-testid={`refer-to-user-${recommendation.id}`}
                          >
                            <Users className="w-4 h-4" />
                            Refer to User
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2 rounded-md"
                                data-testid={`ignore-${recommendation.id}`}
                              >
                                <X className="w-4 h-4" />
                                Ignore
                                <ChevronDown className="w-3 h-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[260px]">
                              <div className="px-3 py-2 border-b">
                                <div className="flex items-center gap-2 font-medium">
                                  <X className="w-4 h-4" />
                                  Ignore Action
                                </div>
                              </div>
                              <DropdownMenuItem 
                                className="flex items-start gap-3 p-4 cursor-pointer"
                                onClick={() => console.log('Ignore for 1 hour')}
                                data-testid={`ignore-1hour-${recommendation.id}`}
                              >
                                <Clock className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="font-medium">Ignore for 1 hour</div>
                                  <div className="text-sm text-muted-foreground">Hide until 1 hour from now</div>
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-start gap-3 p-4 cursor-pointer"
                                onClick={() => console.log('Ignore for 1 day')}
                                data-testid={`ignore-1day-${recommendation.id}`}
                              >
                                <Clock className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="font-medium">Ignore for 1 day</div>
                                  <div className="text-sm text-muted-foreground">Hide until tomorrow</div>
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-start gap-3 p-4 cursor-pointer"
                                onClick={() => console.log('Ignore for 1 week')}
                                data-testid={`ignore-1week-${recommendation.id}`}
                              >
                                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="font-medium">Ignore for 1 week</div>
                                  <div className="text-sm text-muted-foreground">Hide until next week</div>
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-start gap-3 p-4 cursor-pointer"
                                onClick={() => console.log('Ignore permanently')}
                                data-testid={`ignore-permanently-${recommendation.id}`}
                              >
                                <X className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="font-medium">Ignore permanently</div>
                                  <div className="text-sm text-muted-foreground">Never show this action again</div>
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-start gap-3 p-4 cursor-pointer"
                                onClick={() => console.log('Custom duration')}
                                data-testid={`ignore-custom-${recommendation.id}`}
                              >
                                <Clock className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="font-medium">Custom duration...</div>
                                  <div className="text-sm text-muted-foreground">Set a specific time period</div>
                                </div>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="h-full p-6 space-y-4" data-testid="events-tab-content">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">System Events</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time feed of system activities and status updates
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Live Feed
                  </div>
                  <Button variant="outline" size="sm" data-testid="events-refresh-button">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Loading State */}
              {isLoadingEvents && (
                <div className="space-y-3" data-testid="events-loading">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                            <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Error State */}
              {eventsError && (
                <Card className="border-red-200 bg-red-50" data-testid="events-error">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      <h4 className="font-medium">Failed to load system events</h4>
                    </div>
                    <p className="text-sm text-red-700 mb-4">
                      Unable to fetch the latest events. Please check your connection and try again.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-red-200 text-red-600"
                      onClick={() => refetchEvents()}
                      data-testid="events-retry-button"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Content */}
              {!isLoadingEvents && !eventsError && (
                <div className="space-y-3" data-testid="events-content">
                  {systemEvents.map((event) => (
                    <Card 
                      key={event.id} 
                      className="hover:shadow-sm transition-shadow"
                      data-testid={`event-card-${event.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            event.status === 'active' ? 'bg-blue-100 text-blue-600' :
                            event.status === 'resolved' ? 'bg-green-100 text-green-600' :
                            'bg-gray-100 text-gray-600'
                          )}>
                            <Activity className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{event.title}</h4>
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  event.status === 'active' ? 'default' :
                                  event.status === 'resolved' ? 'secondary' : 'outline'
                                } className="text-xs" data-testid={`event-status-${event.status}`}>
                                  {event.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(event.timestamp), 'MMM d, h:mm a')}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.description}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                Source: {event.source}
                              </span>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" data-testid={`view-details-${event.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Button>
                                <Button variant="ghost" size="sm" data-testid={`acknowledge-${event.id}`}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Acknowledge
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="h-full p-6 space-y-4" data-testid="alerts-tab-content">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">System Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    Important notifications and system messages requiring attention
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" data-testid="mark-all-read-button">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark All Read
                  </Button>
                  <Button variant="outline" size="sm" data-testid="alerts-filter-button">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>

              {/* Loading State */}
              {isLoadingAlerts && (
                <div className="space-y-3" data-testid="alerts-loading">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                            <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Error State */}
              {alertsError && (
                <Card className="border-red-200 bg-red-50" data-testid="alerts-error">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      <h4 className="font-medium">Failed to load alerts</h4>
                    </div>
                    <p className="text-sm text-red-700 mb-4">
                      Unable to fetch the latest alerts. Please check your connection and try again.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-red-200 text-red-600"
                      onClick={() => refetchAlerts()}
                      data-testid="alerts-retry-button"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Content */}
              {!isLoadingAlerts && !alertsError && (
                <div className="space-y-3" data-testid="alerts-content">
                  {alerts.map((alert) => (
                    <Card 
                      key={alert.id} 
                      className={cn(
                        "hover:shadow-sm transition-shadow",
                        alert.status === 'unread' ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''
                      )}
                      data-testid={`alert-card-${alert.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{alert.title}</h4>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  className={`text-xs ${getPriorityColor(alert.priority)}`}
                                  data-testid={`alert-priority-${alert.priority}`}
                                >
                                  {alert.priority.toUpperCase()}
                                </Badge>
                                {alert.status === 'unread' && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full" data-testid="alert-unread-indicator" />
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {alert.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(alert.timestamp), 'MMM d, h:mm a')}
                              </span>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" data-testid={`acknowledge-${alert.id}`}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Acknowledge
                                </Button>
                                <Button variant="ghost" size="sm" data-testid={`archive-${alert.id}`}>
                                  <Archive className="w-4 h-4 mr-2" />
                                  Archive
                                </Button>
                                <Button variant="ghost" size="sm" data-testid={`schedule-${alert.id}`}>
                                  <Clock className="w-4 h-4 mr-2" />
                                  Schedule
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Inbox Tab */}
            <TabsContent value="inbox" className="h-full p-6 space-y-4" data-testid="inbox-tab-content">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Inbox</h3>
                  <p className="text-sm text-muted-foreground">
                    Communication hub for team collaboration and messages
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="gap-2" data-testid="new-message-button">
                    <MessageSquare className="w-4 h-4" />
                    New Message
                  </Button>
                </div>
              </div>

              {/* Loading State */}
              {isLoadingInbox && (
                <div className="space-y-3" data-testid="inbox-loading">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
                            <div className="h-4 bg-gray-100 rounded mb-2 w-3/4"></div>
                            <div className="h-3 bg-gray-100 rounded w-full"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Error State */}
              {inboxError && (
                <Card className="border-red-200 bg-red-50" data-testid="inbox-error">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      <h4 className="font-medium">Failed to load inbox messages</h4>
                    </div>
                    <p className="text-sm text-red-700 mb-4">
                      Unable to fetch your messages. Please check your connection and try again.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-red-200 text-red-600"
                      onClick={() => refetchInbox()}
                      data-testid="inbox-retry-button"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Content */}
              {!isLoadingInbox && !inboxError && (
                <div className="space-y-3" data-testid="inbox-content">
                  {inboxMessages.map((message) => (
                    <Card 
                      key={message.id} 
                      className={cn(
                        "hover:shadow-sm transition-shadow cursor-pointer",
                        !message.isRead ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''
                      )}
                      data-testid={`message-card-${message.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className={cn(
                                  "text-sm",
                                  !message.isRead ? 'font-semibold' : 'font-medium'
                                )}>
                                  {message.sender}
                                </h4>
                                <p className={cn(
                                  "text-sm",
                                  !message.isRead ? 'font-medium' : 'text-muted-foreground'
                                )}>
                                  {message.subject}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                                </span>
                                {!message.isRead && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full ml-auto mt-1" />
                                )}
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {message.preview}
                            </p>

                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {message.participants.length} participants
                              </span>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" data-testid={`open-message-${message.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Open
                                </Button>
                                <Button variant="ghost" size="sm" data-testid={`archive-message-${message.id}`}>
                                  <Archive className="w-4 h-4 mr-2" />
                                  Archive
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Work with Agent Modal */}
      <WorkWithAgentModal
        isOpen={workWithAgentModal.isOpen}
        onClose={closeWorkWithAgent}
        recommendation={workWithAgentModal.recommendation}
      />
      
      {referUserModal.recommendation && (
        <ReferUserModal
          isOpen={referUserModal.isOpen}
          onClose={closeReferUser}
          recommendation={referUserModal.recommendation}
        />
      )}
    </div>
  );
}
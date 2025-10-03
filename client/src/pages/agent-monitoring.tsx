import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  Activity, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Settings,
  Play,
  Pause,
  Ban,
  Clock,
  Cpu,
  Database,
  Link2,
  User,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Info,
  RefreshCw,
  Eye,
  EyeOff,
  Filter,
  Download
} from "lucide-react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Types
interface AgentConnection {
  id: number;
  agentName: string;
  agentType: string;
  connectionType: 'api' | 'webhook' | 'websocket' | 'polling';
  status: 'active' | 'suspended' | 'error' | 'revoked' | 'pending';
  isEnabled: boolean;
  connectedAt: string;
  disconnectedAt?: string;
  lastActivityAt?: string;
  configuration?: any;
  metadata?: any;
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
  errorCount: number;
  lastError?: string;
}

interface AgentAction {
  id: number;
  agentConnectionId: number;
  actionType: string;
  actionDetails?: any;
  performedAt: string;
  sessionId?: string;
  userId?: number;
  result?: string;
  errorMessage?: string;
}

interface AgentMetrics {
  id: number;
  agentConnectionId: number;
  timestamp: string;
  actionsPerformed: number;
  errorsOccurred: number;
  averageResponseTime: number;
  successRate: number;
  dataProcessed?: any;
}

interface AgentPolicy {
  id: number;
  agentConnectionId: number;
  policyType: string;
  policyName: string;
  policyDetails?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface AgentAlert {
  id: number;
  agentConnectionId: number;
  alertType: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  details?: any;
  triggeredAt: string;
  acknowledged: boolean;
  acknowledgedBy?: number;
  acknowledgedAt?: string;
}

export function AgentMonitoring() {
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<AgentConnection | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showDisabledAgents, setShowDisabledAgents] = useState(true);
  const [configureRateLimitDialog, setConfigureRateLimitDialog] = useState(false);
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState<string>('');
  const [rateLimitPerHour, setRateLimitPerHour] = useState<string>('');

  // Queries
  const { data: connections = [], isLoading: connectionsLoading, refetch: refetchConnections } = useQuery({
    queryKey: ['/api/agent-control/connections'],
    refetchInterval: 5000 // Auto-refresh every 5 seconds
  });

  const { data: actionsData = { actions: [] } } = useQuery({
    queryKey: ['/api/agent-control/actions', selectedAgent?.id],
    enabled: !!selectedAgent
  });

  const { data: metricsData = { metrics: [] } } = useQuery({
    queryKey: ['/api/agent-control/metrics', selectedAgent?.id],
    enabled: !!selectedAgent
  });

  const { data: policiesData = { policies: [] } } = useQuery({
    queryKey: ['/api/agent-control/policies', selectedAgent?.id],
    enabled: !!selectedAgent
  });

  const { data: alertsData = { alerts: [] } } = useQuery({
    queryKey: ['/api/agent-control/alerts'],
    refetchInterval: 10000 // Check for new alerts every 10 seconds
  });

  // Mutations
  const disableAgentMutation = useMutation({
    mutationFn: (agentId: number) => 
      apiRequest(`/api/agent-control/connections/${agentId}/disable`, { method: 'POST' }),
    onSuccess: () => {
      toast({ title: "Agent disabled successfully" });
      refetchConnections();
    },
    onError: () => {
      toast({ title: "Failed to disable agent", variant: "destructive" });
    }
  });

  const enableAgentMutation = useMutation({
    mutationFn: (agentId: number) => 
      apiRequest(`/api/agent-control/connections/${agentId}/enable`, { method: 'POST' }),
    onSuccess: () => {
      toast({ title: "Agent enabled successfully" });
      refetchConnections();
    },
    onError: () => {
      toast({ title: "Failed to enable agent", variant: "destructive" });
    }
  });

  const revokeAgentMutation = useMutation({
    mutationFn: (agentId: number) => 
      apiRequest(`/api/agent-control/connections/${agentId}/revoke`, { method: 'POST' }),
    onSuccess: () => {
      toast({ title: "Agent access revoked" });
      refetchConnections();
    },
    onError: () => {
      toast({ title: "Failed to revoke agent access", variant: "destructive" });
    }
  });

  const updateRateLimitsMutation = useMutation({
    mutationFn: (params: { agentId: number; rateLimitPerMinute: number; rateLimitPerHour: number }) =>
      apiRequest(`/api/agent-control/connections/${params.agentId}/rate-limits`, {
        method: 'PATCH',
        body: JSON.stringify({
          rateLimitPerMinute: params.rateLimitPerMinute,
          rateLimitPerHour: params.rateLimitPerHour
        })
      }),
    onSuccess: () => {
      toast({ title: "Rate limits updated successfully" });
      refetchConnections();
      setConfigureRateLimitDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to update rate limits", variant: "destructive" });
    }
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: (alertId: number) =>
      apiRequest(`/api/agent-control/alerts/${alertId}/acknowledge`, {
        method: 'PATCH',
        body: JSON.stringify({ userId: 1 }) // TODO: Get actual user ID
      }),
    onSuccess: () => {
      toast({ title: "Alert acknowledged" });
      queryClient.invalidateQueries({ queryKey: ['/api/agent-control/alerts'] });
    },
    onError: () => {
      toast({ title: "Failed to acknowledge alert", variant: "destructive" });
    }
  });

  // Filter connections
  const filteredConnections = connections?.connections?.filter((conn: AgentConnection) => {
    if (!showDisabledAgents && !conn.isEnabled) return false;
    if (filterStatus !== 'all' && conn.status !== filterStatus) return false;
    if (filterType !== 'all' && conn.connectionType !== filterType) return false;
    return true;
  }) || [];

  // Calculate statistics
  const stats = {
    total: connections?.connections?.length || 0,
    active: connections?.connections?.filter((c: AgentConnection) => c.status === 'active').length || 0,
    suspended: connections?.connections?.filter((c: AgentConnection) => c.status === 'suspended').length || 0,
    errors: connections?.connections?.filter((c: AgentConnection) => c.status === 'error').length || 0,
    revoked: connections?.connections?.filter((c: AgentConnection) => c.status === 'revoked').length || 0
  };

  // Process metrics for charts
  const metricsForChart = metricsData?.metrics?.slice(-24).map((m: AgentMetrics) => ({
    time: format(new Date(m.timestamp), 'HH:mm'),
    actions: m.actionsPerformed,
    errors: m.errorsOccurred,
    responseTime: m.averageResponseTime,
    successRate: m.successRate * 100
  })) || [];

  // Agent type distribution for pie chart
  const typeDistribution = connections?.connections?.reduce((acc: any, conn: AgentConnection) => {
    const type = conn.agentType;
    if (!acc[type]) acc[type] = 0;
    acc[type]++;
    return acc;
  }, {}) || {};

  const pieChartData = Object.entries(typeDistribution).map(([name, value]) => ({ name, value }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'suspended': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      case 'revoked': return 'text-gray-500';
      case 'pending': return 'text-blue-500';
      default: return 'text-gray-400';
    }
  };

  // Get connection type icon
  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'api': return <Zap className="w-4 h-4" />;
      case 'webhook': return <Link2 className="w-4 h-4" />;
      case 'websocket': return <Activity className="w-4 h-4" />;
      case 'polling': return <RefreshCw className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      case 'info': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="w-8 h-8" />
            AI Agent Monitoring & Control
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage all AI agent connections, activities, and performance
          </p>
        </div>
        <Button onClick={() => refetchConnections()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Agents</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Bot className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-green-500">{stats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Suspended</p>
              <p className="text-2xl font-bold text-yellow-500">{stats.suspended}</p>
            </div>
            <Pause className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Errors</p>
              <p className="text-2xl font-bold text-red-500">{stats.errors}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Revoked</p>
              <p className="text-2xl font-bold text-gray-500">{stats.revoked}</p>
            </div>
            <Ban className="w-8 h-8 text-gray-500" />
          </div>
        </Card>
      </div>

      {/* Alerts Section */}
      {alertsData?.alerts?.filter((a: AgentAlert) => !a.acknowledged).length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Active Alerts ({alertsData.alerts.filter((a: AgentAlert) => !a.acknowledged).length})</p>
              {alertsData.alerts
                .filter((a: AgentAlert) => !a.acknowledged)
                .slice(0, 3)
                .map((alert: AgentAlert) => (
                  <div key={alert.id} className="flex items-center justify-between border-t pt-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span className="text-sm">{alert.message}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                      data-testid={`button-acknowledge-${alert.id}`}
                    >
                      Acknowledge
                    </Button>
                  </div>
                ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent List */}
        <Card className="lg:col-span-1">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold mb-3">Agent Connections</h2>
            
            {/* Filters */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="flex-1" data-testid="select-filter-status">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="flex-1" data-testid="select-filter-type">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="websocket">WebSocket</SelectItem>
                    <SelectItem value="polling">Polling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={showDisabledAgents ? "default" : "outline"}
                  onClick={() => setShowDisabledAgents(!showDisabledAgents)}
                  data-testid="button-toggle-disabled"
                >
                  {showDisabledAgents ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span className="ml-2">
                    {showDisabledAgents ? "Showing" : "Hiding"} Disabled
                  </span>
                </Button>
              </div>
            </div>
          </div>
          
          <ScrollArea className="h-[600px]">
            <div className="p-4 space-y-2">
              {connectionsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading agents...
                </div>
              ) : filteredConnections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No agents found
                </div>
              ) : (
                filteredConnections.map((agent: AgentConnection) => (
                  <Card
                    key={agent.id}
                    className={`p-3 cursor-pointer transition-colors ${
                      selectedAgent?.id === agent.id ? 'bg-accent' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedAgent(agent)}
                    data-testid={`card-agent-${agent.id}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Bot className={`w-5 h-5 ${getStatusColor(agent.status)}`} />
                          <div>
                            <p className="font-semibold">{agent.agentName}</p>
                            <p className="text-sm text-muted-foreground">{agent.agentType}</p>
                          </div>
                        </div>
                        <Badge variant={agent.isEnabled ? "default" : "secondary"}>
                          {agent.isEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {getConnectionIcon(agent.connectionType)}
                          <span>{agent.connectionType}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(agent.connectedAt), 'HH:mm')}</span>
                        </div>
                      </div>
                      
                      {agent.errorCount > 0 && (
                        <div className="flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="w-3 h-3" />
                          <span>{agent.errorCount} errors</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Agent Details */}
        <Card className="lg:col-span-2">
          {selectedAgent ? (
            <Tabs defaultValue="overview" className="h-full">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedAgent.agentName}</h2>
                    <p className="text-sm text-muted-foreground">{selectedAgent.agentType}</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedAgent.isEnabled ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => disableAgentMutation.mutate(selectedAgent.id)}
                        data-testid={`button-disable-${selectedAgent.id}`}
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Disable
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => enableAgentMutation.mutate(selectedAgent.id)}
                        data-testid={`button-enable-${selectedAgent.id}`}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Enable
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRateLimitPerMinute(selectedAgent.rateLimitPerMinute?.toString() || '60');
                        setRateLimitPerHour(selectedAgent.rateLimitPerHour?.toString() || '1000');
                        setConfigureRateLimitDialog(true);
                      }}
                      data-testid={`button-configure-${selectedAgent.id}`}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Configure
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Are you sure you want to revoke this agent\'s access? This action cannot be undone.')) {
                          revokeAgentMutation.mutate(selectedAgent.id);
                        }
                      }}
                      data-testid={`button-revoke-${selectedAgent.id}`}
                    >
                      <Ban className="w-4 h-4 mr-1" />
                      Revoke
                    </Button>
                  </div>
                </div>
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  <TabsTrigger value="policies">Policies</TabsTrigger>
                  <TabsTrigger value="config">Config</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedAgent.status === 'active' ? 'bg-green-500' :
                        selectedAgent.status === 'suspended' ? 'bg-yellow-500' :
                        selectedAgent.status === 'error' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`} />
                      <span className="font-medium capitalize">{selectedAgent.status}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Connection Type</Label>
                    <p className="font-medium capitalize flex items-center gap-2 mt-1">
                      {getConnectionIcon(selectedAgent.connectionType)}
                      {selectedAgent.connectionType}
                    </p>
                  </div>
                  <div>
                    <Label>Connected At</Label>
                    <p className="font-medium">
                      {format(new Date(selectedAgent.connectedAt), 'PPp')}
                    </p>
                  </div>
                  <div>
                    <Label>Last Activity</Label>
                    <p className="font-medium">
                      {selectedAgent.lastActivityAt
                        ? format(new Date(selectedAgent.lastActivityAt), 'PPp')
                        : 'No activity'}
                    </p>
                  </div>
                  <div>
                    <Label>Rate Limit (per minute)</Label>
                    <p className="font-medium">{selectedAgent.rateLimitPerMinute || 'Unlimited'}</p>
                  </div>
                  <div>
                    <Label>Rate Limit (per hour)</Label>
                    <p className="font-medium">{selectedAgent.rateLimitPerHour || 'Unlimited'}</p>
                  </div>
                  <div>
                    <Label>Error Count</Label>
                    <p className="font-medium text-red-500">{selectedAgent.errorCount}</p>
                  </div>
                  <div>
                    <Label>Last Error</Label>
                    <p className="font-medium text-red-500">
                      {selectedAgent.lastError || 'No errors'}
                    </p>
                  </div>
                </div>

                {selectedAgent.configuration && (
                  <div>
                    <Label>Configuration</Label>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedAgent.configuration, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedAgent.metadata && (
                  <div>
                    <Label>Metadata</Label>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedAgent.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="activity" className="p-4">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {actionsData?.actions?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No activity recorded
                      </div>
                    ) : (
                      actionsData?.actions?.map((action: AgentAction) => (
                        <Card key={action.id} className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-500" />
                                <span className="font-medium">{action.actionType}</span>
                                {action.result && (
                                  <Badge variant="outline" className="text-xs">
                                    {action.result}
                                  </Badge>
                                )}
                              </div>
                              {action.actionDetails && (
                                <pre className="text-xs text-muted-foreground overflow-x-auto">
                                  {JSON.stringify(action.actionDetails, null, 2)}
                                </pre>
                              )}
                              {action.errorMessage && (
                                <p className="text-sm text-red-500">{action.errorMessage}</p>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(action.performedAt), 'HH:mm:ss')}
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="metrics" className="p-4 space-y-4">
                {metricsForChart.length > 0 ? (
                  <>
                    <div>
                      <h3 className="font-medium mb-2">Actions & Errors Over Time</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={metricsForChart}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="actions" stroke="#8884d8" name="Actions" />
                          <Line type="monotone" dataKey="errors" stroke="#ff7777" name="Errors" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Response Time (ms)</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={metricsForChart}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="responseTime" stroke="#82ca9d" fill="#82ca9d" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Success Rate (%)</h3>
                      <ResponsiveContainer width="100%" height={100}>
                        <BarChart data={metricsForChart}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Bar dataKey="successRate" fill="#ffc658" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No metrics data available
                  </div>
                )}
              </TabsContent>

              <TabsContent value="policies" className="p-4">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {policiesData?.policies?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No policies configured
                      </div>
                    ) : (
                      policiesData?.policies?.map((policy: AgentPolicy) => (
                        <Card key={policy.id} className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-purple-500" />
                                <span className="font-medium">{policy.policyName}</span>
                                <Badge variant={policy.isActive ? "default" : "secondary"}>
                                  {policy.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{policy.policyType}</p>
                              {policy.policyDetails && (
                                <pre className="text-xs text-muted-foreground overflow-x-auto">
                                  {JSON.stringify(policy.policyDetails, null, 2)}
                                </pre>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(policy.createdAt), 'PP')}
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="config" className="p-4">
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Advanced configuration options for {selectedAgent.agentName}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Label>Connection Endpoint</Label>
                    <Input
                      value={selectedAgent.configuration?.endpoint || 'Not configured'}
                      readOnly
                      data-testid="input-endpoint"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Authentication Method</Label>
                    <Select defaultValue={selectedAgent.configuration?.authMethod || 'none'}>
                      <SelectTrigger data-testid="select-auth-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="api_key">API Key</SelectItem>
                        <SelectItem value="oauth">OAuth 2.0</SelectItem>
                        <SelectItem value="jwt">JWT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Retry Policy</Label>
                    <Select defaultValue={selectedAgent.configuration?.retryPolicy || 'exponential'}>
                      <SelectTrigger data-testid="select-retry-policy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Retry</SelectItem>
                        <SelectItem value="linear">Linear Backoff</SelectItem>
                        <SelectItem value="exponential">Exponential Backoff</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Timeout (seconds)</Label>
                    <Input
                      type="number"
                      value={selectedAgent.configuration?.timeout || 30}
                      data-testid="input-timeout"
                    />
                  </div>

                  <Button className="w-full" data-testid="button-save-config">
                    Save Configuration
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Bot className="w-16 h-16 mb-4" />
              <p className="text-lg">Select an agent to view details</p>
            </div>
          )}
        </Card>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Agent Type Distribution</h3>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Connection Types</h3>
          <div className="space-y-3">
            {['api', 'webhook', 'websocket', 'polling'].map((type) => {
              const count = connections?.connections?.filter((c: AgentConnection) => c.connectionType === type).length || 0;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getConnectionIcon(type)}
                      <span className="capitalize">{type}</span>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Rate Limit Configuration Dialog */}
      <Dialog open={configureRateLimitDialog} onOpenChange={setConfigureRateLimitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Rate Limits</DialogTitle>
            <DialogDescription>
              Set rate limits for {selectedAgent?.agentName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Requests per Minute</Label>
              <Input
                type="number"
                value={rateLimitPerMinute}
                onChange={(e) => setRateLimitPerMinute(e.target.value)}
                placeholder="Enter limit (e.g., 60)"
                data-testid="input-rate-limit-minute"
              />
            </div>
            <div>
              <Label>Requests per Hour</Label>
              <Input
                type="number"
                value={rateLimitPerHour}
                onChange={(e) => setRateLimitPerHour(e.target.value)}
                placeholder="Enter limit (e.g., 1000)"
                data-testid="input-rate-limit-hour"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigureRateLimitDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedAgent && rateLimitPerMinute && rateLimitPerHour) {
                  updateRateLimitsMutation.mutate({
                    agentId: selectedAgent.id,
                    rateLimitPerMinute: Number(rateLimitPerMinute),
                    rateLimitPerHour: Number(rateLimitPerHour)
                  });
                }
              }}
              data-testid="button-save-rate-limits"
            >
              Save Limits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
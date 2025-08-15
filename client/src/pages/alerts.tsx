import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { AlertCircle, AlertTriangle, Info, CheckCircle, Clock, Bell, Settings, Plus, Filter, Brain, Shield, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
  priority: number;
  detectedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: number;
  resolvedAt?: string;
  resolvedBy?: number;
  resolution?: string;
  rootCause?: string;
  escalatedTo?: number;
  createdAt: string;
}

export default function AlertsPage() {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [newAlert, setNewAlert] = useState({
    title: '',
    description: '',
    severity: 'medium' as const,
    type: 'custom'
  });
  const [resolution, setResolution] = useState('');
  const [rootCause, setRootCause] = useState('');
  
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
    refetchInterval: 30000
  });

  // Fetch alert statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/alerts/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/alerts/stats');
      return response.json();
    }
  });

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: async (alertData: any) => {
      const response = await apiRequest('POST', '/api/alerts', alertData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/stats'] });
      toast({
        title: "Alert Created",
        description: "New alert has been created successfully."
      });
      setShowCreateDialog(false);
      setNewAlert({ title: '', description: '', severity: 'medium', type: 'custom' });
    }
  });

  // Acknowledge alert mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/alerts/${id}/acknowledge`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({
        title: "Alert Acknowledged",
        description: "The alert has been acknowledged."
      });
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
      toast({
        title: "Alert Resolved",
        description: "The alert has been resolved successfully."
      });
      setShowResolveDialog(false);
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
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'outline';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'acknowledged':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleCreateAlert = () => {
    createAlertMutation.mutate(newAlert);
  };

  const handleResolveAlert = () => {
    if (selectedAlert) {
      resolveMutation.mutate({
        id: selectedAlert.id,
        resolution,
        rootCause
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts Management</h1>
          <p className="text-muted-foreground">Monitor and manage system alerts across your operations</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Alert</DialogTitle>
                <DialogDescription>
                  Create a custom alert for your team to track important events.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newAlert.title}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Alert title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newAlert.description}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of the alert"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={newAlert.severity} onValueChange={(value: any) => setNewAlert(prev => ({ ...prev, severity: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={newAlert.type} onValueChange={(value) => setNewAlert(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateAlert} disabled={createAlertMutation.isPending}>
                  {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.acknowledged || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="all">All Alerts</TabsTrigger>
          <TabsTrigger value="ai-settings" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Settings
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex gap-4 my-4">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
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

        <TabsContent value="active" className="space-y-4">
          {alertsLoading ? (
            <div className="text-center py-8">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No alerts found</div>
          ) : (
            <div className="grid gap-4">
              {alerts.map((alert: Alert) => (
                <Card key={alert.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedAlert(alert)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(alert.severity)}
                        <CardTitle className="text-lg">{alert.title}</CardTitle>
                        <Badge variant={getSeverityColor(alert.severity) as any}>{alert.severity}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(alert.status)}
                        <span className="text-sm text-muted-foreground">{alert.status}</span>
                      </div>
                    </div>
                    <CardDescription>{alert.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Type: {alert.type}</span>
                      <span>Detected: {format(new Date(alert.detectedAt), 'MMM dd, yyyy HH:mm')}</span>
                      <span>Priority: {alert.priority}</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {alert.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            acknowledgeMutation.mutate(alert.id);
                          }}
                          disabled={acknowledgeMutation.isPending}
                        >
                          Acknowledge
                        </Button>
                      )}
                      {(alert.status === 'active' || alert.status === 'acknowledged') && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAlert(alert);
                            setShowResolveDialog(true);
                          }}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="acknowledged">
          <div className="text-center py-8 text-muted-foreground">
            Acknowledged alerts will appear here
          </div>
        </TabsContent>

        <TabsContent value="resolved">
          <div className="text-center py-8 text-muted-foreground">
            Resolved alerts will appear here
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="text-center py-8 text-muted-foreground">
            All alerts will appear here
          </div>
        </TabsContent>

        <TabsContent value="ai-settings" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  AI Alert Generation
                </CardTitle>
                <CardDescription>
                  Control how AI analyzes your data and creates alerts automatically
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="global-ai">Enable AI Alert Generation</Label>
                    <p className="text-sm text-muted-foreground">
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

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="confidence-threshold">AI Confidence Threshold: {aiSettings.confidenceThreshold}%</Label>
                    <span className="text-sm text-muted-foreground">
                      {aiSettings.confidenceThreshold >= 90 ? 'Very Conservative' :
                       aiSettings.confidenceThreshold >= 75 ? 'Conservative' :
                       aiSettings.confidenceThreshold >= 50 ? 'Balanced' : 'Aggressive'}
                    </span>
                  </div>
                  <div className="px-3">
                    <Slider
                      value={[aiSettings.confidenceThreshold]}
                      onValueChange={(value) => 
                        setAiSettings(prev => ({ ...prev, confidenceThreshold: value[0] }))
                      }
                      max={100}
                      min={25}
                      step={5}
                      className="w-full"
                      disabled={!aiSettings.globalAiEnabled}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>More Alerts</span>
                      <span>Fewer Alerts</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Higher values mean AI will only create alerts when very confident, reducing false positives
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-create">Auto-Create Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically create alerts when AI detects issues (requires approval)
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
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-500" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified about AI-generated alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
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
                    <Label htmlFor="smart-filtering">Smart Filtering</Label>
                    <p className="text-sm text-muted-foreground">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-500" />
                  AI Learning & Improvement
                </CardTitle>
                <CardDescription>
                  Help improve AI accuracy through feedback and learning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="learning-mode">Learning Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow AI to learn from your feedback to improve future alerts
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

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">How AI Learning Works</p>
                      <p className="text-sm text-muted-foreground">
                        When you acknowledge, resolve, or dismiss AI alerts, the system learns from your actions. 
                        This helps improve the accuracy and relevance of future alerts for your specific operations.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={() => updateAiSettingsMutation.mutate(aiSettings)}
                disabled={updateAiSettingsMutation.isPending}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {updateAiSettingsMutation.isPending ? 'Saving...' : 'Save AI Settings'}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Resolve Alert Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Provide resolution details for this alert.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="resolution">Resolution</Label>
              <Textarea
                id="resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe how this alert was resolved"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rootCause">Root Cause (Optional)</Label>
              <Textarea
                id="rootCause"
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="What was the root cause of this issue?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleResolveAlert} disabled={resolveMutation.isPending}>
              {resolveMutation.isPending ? 'Resolving...' : 'Resolve Alert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
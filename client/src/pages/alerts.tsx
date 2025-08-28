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
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, AlertTriangle, Info, CheckCircle, Clock, Bell, Settings, Plus, Filter, Sparkles, Shield, Zap, Mail, MessageSquare, Phone, Users, Wrench, Factory, TrendingDown, Package, Calendar, Cpu, Eye } from "lucide-react";
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
    type: 'custom',
    category: '',
    notificationChannels: ['in_app'] as string[],
    recipients: [] as string[],
    priority: 50,
    slaMinutes: 240, // 4 hours default
    dueDate: '',
    plantId: null as number | null,
    resourceId: null as number | null
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

  // Comprehensive alert types and categories
  const alertTypes = {
    production: {
      label: 'Production',
      icon: Factory,
      categories: [
        { value: 'line_down', label: 'Production Line Down', icon: AlertCircle },
        { value: 'capacity_shortage', label: 'Capacity Shortage', icon: TrendingDown },
        { value: 'schedule_delay', label: 'Schedule Delay', icon: Calendar },
        { value: 'yield_variance', label: 'Yield Variance', icon: TrendingDown },
        { value: 'throughput_decline', label: 'Throughput Decline', icon: TrendingDown },
        { value: 'batch_failure', label: 'Batch Failure', icon: AlertTriangle }
      ]
    },
    quality: {
      label: 'Quality',
      icon: Shield,
      categories: [
        { value: 'quality_control_fail', label: 'Quality Control Failure', icon: AlertTriangle },
        { value: 'specification_deviation', label: 'Specification Deviation', icon: Eye },
        { value: 'rework_required', label: 'Rework Required', icon: Wrench },
        { value: 'contamination', label: 'Contamination Detected', icon: AlertCircle },
        { value: 'calibration_due', label: 'Calibration Due', icon: Settings }
      ]
    },
    maintenance: {
      label: 'Maintenance',
      icon: Wrench,
      categories: [
        { value: 'equipment_failure', label: 'Equipment Failure', icon: AlertCircle },
        { value: 'preventive_due', label: 'Preventive Maintenance Due', icon: Calendar },
        { value: 'breakdown', label: 'Equipment Breakdown', icon: AlertTriangle },
        { value: 'performance_degradation', label: 'Performance Degradation', icon: TrendingDown },
        { value: 'vibration_anomaly', label: 'Vibration Anomaly', icon: Zap },
        { value: 'temperature_alert', label: 'Temperature Alert', icon: AlertTriangle }
      ]
    },
    inventory: {
      label: 'Inventory',
      icon: Package,
      categories: [
        { value: 'stock_shortage', label: 'Stock Shortage', icon: AlertTriangle },
        { value: 'material_shortage', label: 'Material Shortage', icon: Package },
        { value: 'excess_inventory', label: 'Excess Inventory', icon: Package },
        { value: 'expiration_warning', label: 'Expiration Warning', icon: Calendar },
        { value: 'supplier_delay', label: 'Supplier Delay', icon: Clock }
      ]
    },
    resource: {
      label: 'Resource',
      icon: Cpu,
      categories: [
        { value: 'resource_conflict', label: 'Resource Conflict', icon: AlertTriangle },
        { value: 'overallocation', label: 'Resource Overallocation', icon: TrendingDown },
        { value: 'underutilization', label: 'Resource Underutilization', icon: TrendingDown },
        { value: 'operator_shortage', label: 'Operator Shortage', icon: Users },
        { value: 'skill_gap', label: 'Skill Gap', icon: Users }
      ]
    },
    safety: {
      label: 'Safety',
      icon: Shield,
      categories: [
        { value: 'safety_incident', label: 'Safety Incident', icon: AlertCircle },
        { value: 'hazard_detected', label: 'Hazard Detected', icon: AlertTriangle },
        { value: 'ppe_violation', label: 'PPE Violation', icon: Shield },
        { value: 'emergency_stop', label: 'Emergency Stop Triggered', icon: AlertCircle },
        { value: 'gas_leak', label: 'Gas Leak Detected', icon: AlertCircle }
      ]
    },
    ai_detected: {
      label: 'AI Detected',
      icon: Sparkles,
      categories: [
        { value: 'anomaly_detection', label: 'Anomaly Detection', icon: Eye },
        { value: 'predictive_failure', label: 'Predictive Failure', icon: TrendingDown },
        { value: 'pattern_deviation', label: 'Pattern Deviation', icon: TrendingDown },
        { value: 'optimization_opportunity', label: 'Optimization Opportunity', icon: Sparkles },
        { value: 'efficiency_decline', label: 'Efficiency Decline', icon: TrendingDown }
      ]
    },
    custom: {
      label: 'Custom',
      icon: Settings,
      categories: [
        { value: 'manual_alert', label: 'Manual Alert', icon: Bell },
        { value: 'custom_rule', label: 'Custom Rule Triggered', icon: Settings },
        { value: 'escalation', label: 'Escalation Required', icon: AlertTriangle }
      ]
    }
  };

  // Available notification channels
  const notificationChannels = [
    { value: 'in_app', label: 'In-App Notification', icon: Bell, description: 'Show alert in dashboard' },
    { value: 'email', label: 'Email', icon: Mail, description: 'Send email notification' },
    { value: 'sms', label: 'SMS/Text', icon: Phone, description: 'Send text message' },
    { value: 'teams', label: 'Microsoft Teams', icon: MessageSquare, description: 'Post to Teams channel' },
    { value: 'slack', label: 'Slack', icon: MessageSquare, description: 'Post to Slack channel' }
  ];

  // Mock users for recipient selection (in real app, fetch from API)
  const availableUsers = [
    { id: 1, name: 'Jim Cerra', email: 'jim@company.com', role: 'Administrator', phone: '+1-555-0001' },
    { id: 2, name: 'Production Manager', email: 'production@company.com', role: 'Production Manager', phone: '+1-555-0002' },
    { id: 3, name: 'Quality Manager', email: 'quality@company.com', role: 'Quality Manager', phone: '+1-555-0003' },
    { id: 4, name: 'Maintenance Manager', email: 'maintenance@company.com', role: 'Maintenance Manager', phone: '+1-555-0004' },
    { id: 5, name: 'Plant Manager', email: 'plant@company.com', role: 'Plant Manager', phone: '+1-555-0005' },
    { id: 6, name: 'Shift Supervisor', email: 'shift@company.com', role: 'Shift Supervisor', phone: '+1-555-0006' }
  ];

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
      if (!response.ok) {
        throw new Error(`Failed to create alert: ${response.status}`);
      }
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
      setNewAlert({
        title: '',
        description: '',
        severity: 'medium',
        type: 'custom',
        category: '',
        notificationChannels: ['in_app'],
        recipients: [],
        priority: 50,
        slaMinutes: 240,
        dueDate: '',
        plantId: null,
        resourceId: null
      });
    },
    onError: (error: any) => {
      console.error('Create alert error:', error);
      toast({
        title: "Error Creating Alert",
        description: error?.message || "Failed to create alert. Please try again.",
        variant: "destructive"
      });
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
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/stats'] });
      toast({
        title: "Alert Resolved",
        description: "The alert has been resolved successfully."
      });
      setShowResolveDialog(false);
      setSelectedAlert(null);
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
    <div className="container mx-auto py-4 sm:py-6 px-3 sm:px-6 max-w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Alerts Management</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Monitor and manage system alerts across your operations</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 w-full sm:w-auto" size="sm">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Alert</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Alert</DialogTitle>
                <DialogDescription>
                  Configure a detailed alert with notification settings and recipient management.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Alert Title</Label>
                      <Input
                        id="title"
                        value={newAlert.title}
                        onChange={(e) => setNewAlert(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter alert title"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="severity">Severity Level</Label>
                      <Select value={newAlert.severity} onValueChange={(value: any) => setNewAlert(prev => ({ ...prev, severity: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">🔴 Critical - Immediate action required</SelectItem>
                          <SelectItem value="high">🟠 High - Action required within 1 hour</SelectItem>
                          <SelectItem value="medium">🟡 Medium - Action required within 4 hours</SelectItem>
                          <SelectItem value="low">🔵 Low - Action required within 24 hours</SelectItem>
                          <SelectItem value="info">ℹ️ Info - For information only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newAlert.description}
                      onChange={(e) => setNewAlert(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed description of the alert and required actions"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Alert Type & Category */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Alert Classification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">Alert Type</Label>
                      <Select value={newAlert.type} onValueChange={(value) => setNewAlert(prev => ({ ...prev, type: value, category: '' }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(alertTypes).map(([key, type]) => {
                            const Icon = type.icon;
                            return (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    {newAlert.type && alertTypes[newAlert.type as keyof typeof alertTypes] && (
                      <div className="grid gap-2">
                        <Label htmlFor="category">Specific Category</Label>
                        <Select value={newAlert.category} onValueChange={(value) => setNewAlert(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select specific category" />
                          </SelectTrigger>
                          <SelectContent>
                            {alertTypes[newAlert.type as keyof typeof alertTypes].categories.map((category) => {
                              const Icon = category.icon;
                              return (
                                <SelectItem key={category.value} value={category.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {category.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority & SLA */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Priority & Response Time</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="priority">Priority Score (1-100)</Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[newAlert.priority]}
                          onValueChange={(value) => setNewAlert(prev => ({ ...prev, priority: value[0] }))}
                          max={100}
                          min={1}
                          step={1}
                          className="flex-1"
                        />
                        <span className="w-12 text-sm font-medium">{newAlert.priority}</span>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sla">Response SLA (minutes)</Label>
                      <Select value={newAlert.slaMinutes.toString()} onValueChange={(value) => setNewAlert(prev => ({ ...prev, slaMinutes: parseInt(value) }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes - Urgent</SelectItem>
                          <SelectItem value="60">1 hour - High</SelectItem>
                          <SelectItem value="240">4 hours - Standard</SelectItem>
                          <SelectItem value="480">8 hours - Normal</SelectItem>
                          <SelectItem value="1440">24 hours - Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Notification Channels */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Delivery</h3>
                  <div className="grid gap-3">
                    <Label>Delivery Methods</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {notificationChannels.map((channel) => {
                        const Icon = channel.icon;
                        return (
                          <div key={channel.value} className="flex items-start space-x-3">
                            <Checkbox
                              id={channel.value}
                              checked={newAlert.notificationChannels.includes(channel.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewAlert(prev => ({
                                    ...prev,
                                    notificationChannels: [...prev.notificationChannels, channel.value]
                                  }));
                                } else {
                                  setNewAlert(prev => ({
                                    ...prev,
                                    notificationChannels: prev.notificationChannels.filter(c => c !== channel.value)
                                  }));
                                }
                              }}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label
                                htmlFor={channel.value}
                                className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                <Icon className="h-4 w-4" />
                                {channel.label}
                              </label>
                              <p className="text-xs text-muted-foreground">
                                {channel.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Recipients */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Alert Recipients</h3>
                  <div className="grid gap-3">
                    <Label>Who should receive this alert?</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
                      {availableUsers.map((user) => (
                        <div key={user.id} className="flex items-start space-x-3">
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={newAlert.recipients.includes(user.id.toString())}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewAlert(prev => ({
                                  ...prev,
                                  recipients: [...prev.recipients, user.id.toString()]
                                }));
                              } else {
                                setNewAlert(prev => ({
                                  ...prev,
                                  recipients: prev.recipients.filter(r => r !== user.id.toString())
                                }));
                              }
                            }}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={`user-${user.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {user.name}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {user.role} • {user.email}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                {(newAlert.notificationChannels.length > 0 || newAlert.recipients.length > 0) && (
                  <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium">Alert Summary</h4>
                    <div className="space-y-2 text-sm">
                      {newAlert.notificationChannels.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-blue-600" />
                          <span>Will send via: {newAlert.notificationChannels.map(ch => notificationChannels.find(c => c.value === ch)?.label).join(', ')}</span>
                        </div>
                      )}
                      {newAlert.recipients.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span>Will notify: {newAlert.recipients.length} recipient{newAlert.recipients.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  disabled={createAlertMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateAlert} 
                  disabled={createAlertMutation.isPending || !newAlert.title.trim()}
                >
                  {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="active" className="text-xs sm:text-sm">Active</TabsTrigger>
          <TabsTrigger value="acknowledged" className="text-xs sm:text-sm">Ack'd</TabsTrigger>
          <TabsTrigger value="resolved" className="text-xs sm:text-sm">Resolved</TabsTrigger>
          <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
          <TabsTrigger value="ai-settings" className="flex items-center gap-1 text-xs sm:text-sm">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">AI Settings</span>
            <span className="sm:hidden">AI</span>
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 my-4">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-full sm:w-48">
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
            <SelectTrigger className="w-full sm:w-48">
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
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getSeverityIcon(alert.severity)}
                        <CardTitle className="text-base sm:text-lg truncate">{alert.title}</CardTitle>
                        <Badge variant={getSeverityColor(alert.severity) as any} className="text-xs shrink-0">{alert.severity}</Badge>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {getStatusIcon(alert.status)}
                        <span className="text-xs sm:text-sm text-muted-foreground">{alert.status}</span>
                      </div>
                    </div>
                    <CardDescription className="text-sm mt-2">{alert.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground mb-4">
                      <span>Type: {alert.type}</span>
                      <span>Detected: {format(new Date(alert.detectedAt), 'MMM dd, HH:mm')}</span>
                      <span>Priority: {alert.priority}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {alert.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto"
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
                          className="w-full sm:w-auto"
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
                  <Sparkles className="h-5 w-5 text-purple-500" />
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Provide resolution details for this alert. Review the alert information below.
            </DialogDescription>
          </DialogHeader>
          
          {/* Alert Context */}
          {selectedAlert && (
            <div className="bg-muted/50 p-4 rounded-lg border mb-4">
              <div className="flex items-start gap-3">
                {getSeverityIcon(selectedAlert.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{selectedAlert.title}</h4>
                    <Badge variant={getSeverityColor(selectedAlert.severity)}>
                      {selectedAlert.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{selectedAlert.description}</p>
                  <div className="text-xs text-muted-foreground">
                    <span>Detected: {format(new Date(selectedAlert.detectedAt), "MMM d, yyyy 'at' h:mm a")}</span>
                    {selectedAlert.type && <span className="ml-4">Type: {selectedAlert.type}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="resolution">Resolution *</Label>
              <Textarea
                id="resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe how this alert was resolved..."
                className="min-h-[80px]"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rootCause">Root Cause (Optional)</Label>
              <Textarea
                id="rootCause"
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="What was the root cause of this issue? This helps prevent similar issues in the future."
                className="min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowResolveDialog(false)}
              disabled={resolveMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleResolveAlert} 
              disabled={resolveMutation.isPending || !resolution.trim()}
            >
              {resolveMutation.isPending ? 'Resolving...' : 'Resolve Alert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
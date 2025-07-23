import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Link2, 
  Zap, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  RefreshCw,
  Eye,
  Trash2,
  Play,
  Pause,
  Activity,
  TrendingUp,
  Settings,
  Code,
  Cloud,
  Server,
  Globe,
  Lock,
  Unlock,
  Plus,
  Edit,
  TestTube,
  BarChart3,
  Sparkles,
  Search,
  Filter,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

interface SystemIntegration {
  id: string;
  name: string;
  type: 'erp' | 'crm' | 'mes' | 'scada' | 'wms' | 'api' | 'database' | 'file_system';
  status: 'connected' | 'disconnected' | 'error' | 'testing' | 'configuring';
  provider: string;
  endpoint?: string;
  lastSync?: string;
  syncFrequency: string;
  dataTypes: string[];
  health: {
    status: 'healthy' | 'warning' | 'critical';
    latency: number;
    uptime: number;
    errorRate: number;
  };
  metrics: {
    recordsProcessed: number;
    dataVolume: string;
    successRate: number;
  };
  configuration: any;
}

interface IntegrationEvent {
  id: string;
  integrationId: string;
  type: 'sync' | 'error' | 'warning' | 'info' | 'config_change';
  message: string;
  timestamp: string;
  data?: any;
  resolved?: boolean;
}

interface AIIntegrationRequest {
  description: string;
  systemType: string;
  requirements: string[];
  dataMapping?: any;
}

const SystemsIntegrationPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<SystemIntegration | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [aiSetupDialog, setAiSetupDialog] = useState(false);
  const [aiRequest, setAiRequest] = useState<AIIntegrationRequest>({
    description: '',
    systemType: '',
    requirements: [],
    dataMapping: {}
  });

  // Mock data for demonstration
  const mockIntegrations: SystemIntegration[] = [
    {
      id: '1',
      name: 'SAP ERP Connection',
      type: 'erp',
      status: 'connected',
      provider: 'SAP',
      endpoint: 'https://sap.company.com/api/v1',
      lastSync: '2025-01-23T14:30:00Z',
      syncFrequency: 'Every 15 minutes',
      dataTypes: ['Orders', 'Inventory', 'Production Plans', 'Resources'],
      health: {
        status: 'healthy',
        latency: 150,
        uptime: 99.8,
        errorRate: 0.2
      },
      metrics: {
        recordsProcessed: 12450,
        dataVolume: '2.4 GB',
        successRate: 99.8
      },
      configuration: {
        authentication: 'OAuth 2.0',
        dataMapping: 'Auto-configured',
        retryPolicy: 'Exponential backoff'
      }
    },
    {
      id: '2',
      name: 'Salesforce CRM',
      type: 'crm',
      status: 'connected',
      provider: 'Salesforce',
      endpoint: 'https://api.salesforce.com/services/data/v58.0',
      lastSync: '2025-01-23T14:25:00Z',
      syncFrequency: 'Every 30 minutes',
      dataTypes: ['Customers', 'Opportunities', 'Accounts', 'Contacts'],
      health: {
        status: 'healthy',
        latency: 95,
        uptime: 99.9,
        errorRate: 0.1
      },
      metrics: {
        recordsProcessed: 8750,
        dataVolume: '1.2 GB',
        successRate: 99.9
      },
      configuration: {
        authentication: 'OAuth 2.0',
        dataMapping: 'Custom mapping',
        retryPolicy: 'Linear retry'
      }
    },
    {
      id: '3',
      name: 'Manufacturing Execution System',
      type: 'mes',
      status: 'error',
      provider: 'Custom MES',
      endpoint: 'https://mes.factory.local/api',
      lastSync: '2025-01-23T12:00:00Z',
      syncFrequency: 'Real-time',
      dataTypes: ['Production Data', 'Quality Metrics', 'Equipment Status'],
      health: {
        status: 'critical',
        latency: 0,
        uptime: 85.2,
        errorRate: 15.8
      },
      metrics: {
        recordsProcessed: 0,
        dataVolume: '0 MB',
        successRate: 0
      },
      configuration: {
        authentication: 'API Key',
        dataMapping: 'Manual mapping required',
        retryPolicy: 'Immediate retry'
      }
    },
    {
      id: '4',
      name: 'Warehouse Management System',
      type: 'wms',
      status: 'testing',
      provider: 'Manhattan WMS',
      endpoint: 'https://wms.warehouse.com/v2/api',
      lastSync: null,
      syncFrequency: 'Every hour',
      dataTypes: ['Inventory Levels', 'Shipments', 'Receiving'],
      health: {
        status: 'warning',
        latency: 300,
        uptime: 0,
        errorRate: 0
      },
      metrics: {
        recordsProcessed: 0,
        dataVolume: '0 MB',
        successRate: 0
      },
      configuration: {
        authentication: 'Basic Auth',
        dataMapping: 'In progress',
        retryPolicy: 'Configuration pending'
      }
    }
  ];

  const mockEvents: IntegrationEvent[] = [
    {
      id: '1',
      integrationId: '1',
      type: 'sync',
      message: 'Successful sync completed - 145 orders processed',
      timestamp: '2025-01-23T14:30:00Z'
    },
    {
      id: '2',
      integrationId: '2',
      type: 'sync',
      message: 'CRM data synchronized - 89 customer records updated',
      timestamp: '2025-01-23T14:25:00Z'
    },
    {
      id: '3',
      integrationId: '3',
      type: 'error',
      message: 'Connection timeout - MES system unreachable',
      timestamp: '2025-01-23T12:00:00Z',
      resolved: false
    },
    {
      id: '4',
      integrationId: '4',
      type: 'info',
      message: 'Test connection initiated for WMS integration',
      timestamp: '2025-01-23T11:30:00Z'
    }
  ];

  // AI Integration Setup Mutation
  const createAiIntegrationMutation = useMutation({
    mutationFn: async (request: AIIntegrationRequest) => {
      const response = await fetch('/api/ai/create-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create AI integration');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Integration Created",
        description: `AI has successfully configured the ${data.systemType} integration. Configuration ready for testing.`
      });
      setAiSetupDialog(false);
      setAiRequest({
        description: '',
        systemType: '',
        requirements: [],
        dataMapping: {}
      });
      // Refresh integrations list
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
    },
    onError: (error) => {
      toast({
        title: "Integration Setup Failed",
        description: "AI was unable to configure the integration. Please check your requirements and try again.",
        variant: "destructive"
      });
    }
  });

  const handleAiIntegrationSetup = () => {
    if (aiRequest.description && aiRequest.systemType) {
      createAiIntegrationMutation.mutate(aiRequest);
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'erp': return <Database className="w-5 h-5" />;
      case 'crm': return <Users className="w-5 h-5" />;
      case 'mes': return <Settings className="w-5 h-5" />;
      case 'wms': return <Package className="w-5 h-5" />;
      case 'scada': return <Activity className="w-5 h-5" />;
      case 'api': return <Code className="w-5 h-5" />;
      case 'database': return <Server className="w-5 h-5" />;
      case 'file_system': return <FileText className="w-5 h-5" />;
      default: return <Link2 className="w-5 h-5" />;
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'testing': return 'bg-blue-100 text-blue-800';
      case 'configuring': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredIntegrations = mockIntegrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || integration.status === filterStatus;
    const matchesType = filterType === 'all' || integration.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const connectedIntegrations = mockIntegrations.filter(i => i.status === 'connected').length;
  const healthyIntegrations = mockIntegrations.filter(i => i.health.status === 'healthy').length;
  const totalDataVolume = mockIntegrations.reduce((sum, i) => {
    const volume = parseFloat(i.metrics.dataVolume.replace(/[^\d.]/g, ''));
    return sum + (isNaN(volume) ? 0 : volume);
  }, 0);
  const avgSuccessRate = mockIntegrations.reduce((sum, i) => sum + i.metrics.successRate, 0) / mockIntegrations.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="md:ml-0 ml-3">
          <h1 className="text-2xl font-semibold text-gray-800">Systems Integration</h1>
          <p className="text-gray-600">Manage connections to external systems with AI-powered setup and monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAiSetupDialog(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none hover:from-purple-600 hover:to-pink-600"
          >
            <Sparkles className="w-4 h-4" />
            AI Setup
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMaximized(!isMaximized)}
            className="flex items-center gap-2"
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Link2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Connected Systems</p>
                <p className="text-2xl font-bold text-green-600">{connectedIntegrations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Healthy Systems</p>
                <p className="text-2xl font-bold text-blue-600">{healthyIntegrations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Database className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Data Volume</p>
                <p className="text-2xl font-bold text-purple-600">{totalDataVolume.toFixed(1)} GB</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-orange-600">{avgSuccessRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="events">Event Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* System Integration Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Integration Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockIntegrations.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getIntegrationIcon(integration.type)}
                        <div>
                          <p className="font-medium">{integration.name}</p>
                          <p className="text-sm text-gray-600">{integration.provider}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusBadgeColor(integration.status)}>
                          {integration.status}
                        </Badge>
                        <div className={`w-3 h-3 rounded-full ${getHealthStatusColor(integration.health.status).replace('text-', 'bg-')}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Latency</span>
                    <span className="font-semibold">145ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Overall Uptime</span>
                    <span className="font-semibold text-green-600">99.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Error Rate</span>
                    <span className="font-semibold text-red-600">0.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Daily Sync Volume</span>
                    <span className="font-semibold">45,200 records</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search integrations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="connected">Connected</SelectItem>
                      <SelectItem value="disconnected">Disconnected</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type-filter">Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="erp">ERP</SelectItem>
                      <SelectItem value="crm">CRM</SelectItem>
                      <SelectItem value="mes">MES</SelectItem>
                      <SelectItem value="wms">WMS</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integrations List */}
          <div className="space-y-4">
            {filteredIntegrations.map((integration) => (
              <Card key={integration.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getIntegrationIcon(integration.type)}
                        <h3 className="text-lg font-semibold">{integration.name}</h3>
                        <Badge className={getStatusBadgeColor(integration.status)}>
                          {integration.status}
                        </Badge>
                        <div className={`w-3 h-3 rounded-full ${getHealthStatusColor(integration.health.status).replace('text-', 'bg-')}`} />
                      </div>
                      <p className="text-gray-600 mb-3">{integration.provider} • {integration.endpoint}</p>
                      
                      {/* Data Types */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {integration.dataTypes.map((type, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Latency:</span>
                          <span className="ml-2 font-medium">{integration.health.latency}ms</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Uptime:</span>
                          <span className="ml-2 font-medium text-green-600">{integration.health.uptime}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Records:</span>
                          <span className="ml-2 font-medium">{integration.metrics.recordsProcessed.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Data Volume:</span>
                          <span className="ml-2 font-medium">{integration.metrics.dataVolume}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <TestTube className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          {/* Real-time Monitoring Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  System Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockIntegrations.map((integration) => (
                    <div key={integration.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getIntegrationIcon(integration.type)}
                          <span className="font-medium">{integration.name}</span>
                        </div>
                        <Badge className={getStatusBadgeColor(integration.status)}>
                          {integration.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Latency</span>
                          <p className="font-semibold">{integration.health.latency}ms</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Uptime</span>
                          <p className="font-semibold text-green-600">{integration.health.uptime}%</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Error Rate</span>
                          <p className="font-semibold text-red-600">{integration.health.errorRate}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-2 border rounded">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        event.type === 'error' ? 'bg-red-500' :
                        event.type === 'warning' ? 'bg-yellow-500' :
                        event.type === 'sync' ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.message}</p>
                        <p className="text-xs text-gray-600">
                          {format(parseISO(event.timestamp), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          {/* Event Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Integration Event Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className={`w-3 h-3 rounded-full mt-1 ${
                      event.type === 'error' ? 'bg-red-500' :
                      event.type === 'warning' ? 'bg-yellow-500' :
                      event.type === 'sync' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{event.message}</p>
                        <Badge variant={event.type === 'error' ? 'destructive' : 'secondary'}>
                          {event.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {format(parseISO(event.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                      </p>
                      {event.type === 'error' && !event.resolved && (
                        <Button variant="outline" size="sm" className="mt-2">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Integration Setup Dialog */}
      <Dialog open={aiSetupDialog} onOpenChange={setAiSetupDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI-Powered Integration Setup
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Describe your integration requirements and our AI will automatically configure the connection, data mapping, and synchronization settings.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="ai-description">Integration Description</Label>
                <Textarea
                  id="ai-description"
                  placeholder="Describe the system you want to integrate (e.g., 'Connect our Oracle ERP to sync production orders and inventory levels every 15 minutes')"
                  value={aiRequest.description}
                  onChange={(e) => setAiRequest({ ...aiRequest, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="ai-system-type">System Type</Label>
                <Select value={aiRequest.systemType} onValueChange={(value) => setAiRequest({ ...aiRequest, systemType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select system type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="erp">ERP System</SelectItem>
                    <SelectItem value="crm">CRM System</SelectItem>
                    <SelectItem value="mes">Manufacturing Execution System</SelectItem>
                    <SelectItem value="wms">Warehouse Management System</SelectItem>
                    <SelectItem value="scada">SCADA System</SelectItem>
                    <SelectItem value="api">REST API</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="file_system">File System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Requirements (Optional)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['Real-time sync', 'Batch processing', 'Data validation', 'Error handling', 'Secure authentication', 'Data encryption'].map((req) => (
                    <div key={req} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={req}
                        checked={aiRequest.requirements.includes(req)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAiRequest({ ...aiRequest, requirements: [...aiRequest.requirements, req] });
                          } else {
                            setAiRequest({ ...aiRequest, requirements: aiRequest.requirements.filter(r => r !== req) });
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={req} className="text-sm">{req}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAiSetupDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAiIntegrationSetup}
                disabled={!aiRequest.description || !aiRequest.systemType || createAiIntegrationMutation.isPending}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none hover:from-purple-600 hover:to-pink-600"
              >
                {createAiIntegrationMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Setting Up...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Integration
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SystemsIntegrationPage;
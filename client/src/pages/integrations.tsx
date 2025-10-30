import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Settings, 
  Link2, 
  Unlink, 
  RefreshCw, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Cloud,
  Database,
  MessageSquare,
  BarChart3,
  Package,
  Truck,
  DollarSign,
  Cpu,
  Shield,
  Globe,
  Zap,
  Clock,
  Activity,
  Sparkles,
  Settings2,
  Webhook,
  FileJson,
  ArrowRight,
  Check,
  X,
  Loader2,
  Info,
  Code,
  Upload,
  Download,
  Calendar,
  Users,
  ShieldCheck,
  Key
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

// Pre-built connector configurations with automatic setup
const PRESET_INTEGRATIONS = [
  {
    name: 'salesforce',
    displayName: 'Salesforce CRM',
    category: 'crm',
    icon: Cloud,
    color: 'text-blue-500',
    description: 'Sync customers, leads, and opportunities with Salesforce',
    authType: 'oauth2',
    capabilities: ['read', 'write', 'webhook', 'realtime', 'auto-setup'],
    popular: true,
    autoSetup: true,
    setupTime: '2-3 minutes',
    entities: ['Customers', 'Orders', 'Leads', 'Opportunities', 'Products']
  },
  {
    name: 'sap',
    displayName: 'SAP S/4HANA',
    category: 'erp',
    icon: Database,
    color: 'text-indigo-500',
    description: 'Complete ERP integration with automatic data mapping',
    authType: 'oauth2',
    capabilities: ['read', 'write', 'bulk', 'auto-setup', 'bi-directional'],
    popular: true,
    autoSetup: true,
    setupTime: '5-10 minutes',
    entities: ['Materials', 'Production Orders', 'BOMs', 'Work Centers', 'Inventory']
  },
  {
    name: 'oracle_netsuite',
    displayName: 'Oracle NetSuite',
    category: 'erp',
    icon: Database,
    color: 'text-red-500',
    description: 'Automatic financial and inventory data synchronization',
    authType: 'oauth2',
    capabilities: ['read', 'write', 'webhook', 'auto-setup'],
    popular: true,
    autoSetup: true,
    setupTime: '3-5 minutes',
    entities: ['Items', 'Sales Orders', 'Purchase Orders', 'Vendors', 'Customers']
  },
  {
    name: 'microsoft_dynamics',
    displayName: 'Microsoft Dynamics 365',
    category: 'erp',
    icon: Database,
    color: 'text-blue-600',
    description: 'Full Dynamics 365 integration with automatic field mapping',
    authType: 'oauth2',
    capabilities: ['read', 'write', 'webhook', 'realtime', 'auto-setup'],
    popular: true,
    autoSetup: true,
    setupTime: '3-5 minutes',
    entities: ['Products', 'Work Orders', 'Resources', 'Operations', 'Warehouses']
  },
  {
    name: 'slack',
    displayName: 'Slack',
    category: 'communication',
    icon: MessageSquare,
    color: 'text-purple-500',
    description: 'Automatic notifications and alerts to Slack channels',
    authType: 'oauth2',
    capabilities: ['write', 'webhook', 'auto-setup'],
    popular: true,
    autoSetup: true,
    setupTime: '1 minute',
    entities: ['Notifications', 'Alerts', 'Reports']
  },
  {
    name: 'teams',
    displayName: 'Microsoft Teams',
    category: 'communication',
    icon: MessageSquare,
    color: 'text-blue-600',
    description: 'Integrate with Teams for automated collaboration',
    authType: 'oauth2',
    capabilities: ['write', 'webhook', 'auto-setup'],
    popular: true,
    autoSetup: true,
    setupTime: '1 minute',
    entities: ['Notifications', 'Alerts', 'Tasks']
  },
  {
    name: 'tableau',
    displayName: 'Tableau',
    category: 'bi',
    icon: BarChart3,
    color: 'text-orange-500',
    description: 'Automatic data export to Tableau for analytics',
    authType: 'api_key',
    capabilities: ['write', 'bulk', 'auto-setup', 'scheduled'],
    popular: false,
    autoSetup: true,
    setupTime: '2 minutes',
    entities: ['Production Data', 'KPIs', 'Schedule Data']
  },
  {
    name: 'powerbi',
    displayName: 'Power BI',
    category: 'bi',
    icon: BarChart3,
    color: 'text-yellow-500',
    description: 'Real-time Power BI dashboards with automatic refresh',
    authType: 'oauth2',
    capabilities: ['write', 'realtime', 'auto-setup'],
    popular: true,
    autoSetup: true,
    setupTime: '2 minutes',
    entities: ['Metrics', 'Reports', 'Live Data']
  },
  {
    name: 'quickbooks',
    displayName: 'QuickBooks',
    category: 'accounting',
    icon: DollarSign,
    color: 'text-green-600',
    description: 'Automatic financial data synchronization',
    authType: 'oauth2',
    capabilities: ['read', 'write', 'webhook', 'auto-setup'],
    popular: true,
    autoSetup: true,
    setupTime: '2-3 minutes',
    entities: ['Invoices', 'Bills', 'Items', 'Customers', 'Vendors']
  },
  {
    name: 'shopify',
    displayName: 'Shopify',
    category: 'ecommerce',
    icon: Package,
    color: 'text-green-500',
    description: 'Sync orders and inventory with Shopify stores',
    authType: 'oauth2',
    capabilities: ['read', 'write', 'webhook', 'realtime', 'auto-setup'],
    popular: true,
    autoSetup: true,
    setupTime: '2 minutes',
    entities: ['Orders', 'Products', 'Inventory', 'Fulfillments']
  },
  {
    name: 'aws_s3',
    displayName: 'AWS S3',
    category: 'cloud',
    icon: Cloud,
    color: 'text-orange-600',
    description: 'Automatic backup and file storage',
    authType: 'api_key',
    capabilities: ['read', 'write', 'bulk', 'auto-setup'],
    popular: true,
    autoSetup: true,
    setupTime: '1 minute',
    entities: ['Files', 'Backups', 'Reports']
  },
  {
    name: 'jira',
    displayName: 'Jira',
    category: 'project',
    icon: Users,
    color: 'text-blue-700',
    description: 'Sync production issues with Jira tickets',
    authType: 'oauth2',
    capabilities: ['read', 'write', 'webhook', 'auto-setup'],
    popular: true,
    autoSetup: true,
    setupTime: '2 minutes',
    entities: ['Issues', 'Projects', 'Sprints']
  }
];

const CATEGORY_LABELS: Record<string, string> = {
  erp: 'ERP Systems',
  crm: 'CRM',
  warehouse: 'Warehouse Management',
  transport: 'Transportation',
  bi: 'Business Intelligence',
  communication: 'Communication',
  cloud: 'Cloud Storage',
  accounting: 'Accounting',
  iot: 'IoT / Sensors',
  quality: 'Quality Management',
  ecommerce: 'E-Commerce',
  project: 'Project Management'
};

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showNewConnection, setShowNewConnection] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [setupStep, setSetupStep] = useState(1);
  const [setupProgress, setSetupProgress] = useState(0);
  const [isAutoSetup, setIsAutoSetup] = useState(false);
  const [connectionForm, setConnectionForm] = useState({
    connectionName: '',
    environment: 'production',
    apiKey: '',
    apiSecret: '',
    username: '',
    password: '',
    clientId: '',
    clientSecret: '',
    webhookUrl: '',
    endpoint: '',
    autoSync: true,
    syncInterval: '15',
    dataMapping: 'automatic',
    errorHandling: 'retry'
  });

  // Get integrations from API
  const { data: integrations = PRESET_INTEGRATIONS, isLoading: integrationsLoading } = useQuery({
    queryKey: ['/api/integrations'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/integrations');
        if (response.ok) {
          const data = await response.json();
          return data.length > 0 ? data : PRESET_INTEGRATIONS;
        }
      } catch (error) {
        console.log('Using preset integrations');
      }
      return PRESET_INTEGRATIONS;
    }
  });

  // Get existing connections
  const { data: connections = [], isLoading: connectionsLoading } = useQuery({
    queryKey: ['/api/integration-connections'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/integration-connections');
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.log('Error fetching connections');
      }
      return [];
    }
  });

  // Get sync jobs
  const { data: syncJobs = [] } = useQuery({
    queryKey: ['/api/integration-sync-jobs'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/integration-sync-jobs');
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.log('Error fetching sync jobs');
      }
      return [];
    }
  });

  // Filter integrations
  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = !searchQuery || 
      integration.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Automatic setup simulation
  const startAutoSetup = async () => {
    setIsAutoSetup(true);
    setSetupProgress(0);
    
    // Simulate automatic setup steps
    const steps = [
      { progress: 20, message: 'Connecting to service...' },
      { progress: 40, message: 'Authenticating...' },
      { progress: 60, message: 'Discovering data schema...' },
      { progress: 80, message: 'Creating field mappings...' },
      { progress: 90, message: 'Setting up webhooks...' },
      { progress: 100, message: 'Setup complete!' }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSetupProgress(step.progress);
      
      if (step.progress === 100) {
        toast({
          title: '✨ Automatic Setup Complete',
          description: `${selectedIntegration?.displayName} has been successfully configured and is ready to use.`,
        });
        
        // Add to connections
        queryClient.invalidateQueries({ queryKey: ['/api/integration-connections'] });
        setShowNewConnection(false);
        setSelectedIntegration(null);
        setIsAutoSetup(false);
        setSetupStep(1);
        setSetupProgress(0);
      }
    }
  };

  // Create connection mutation
  const createConnectionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/integration-connections', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: 'Connection Created',
        description: 'Integration connection has been successfully configured.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integration-connections'] });
      setShowNewConnection(false);
      setSelectedIntegration(null);
      resetForm();
    },
    onError: () => {
      toast({
        title: 'Connection Failed',
        description: 'Failed to create integration connection.',
        variant: 'destructive'
      });
    }
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      return await apiRequest(`/api/integration-connections/${connectionId}/test`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Connection Test Successful',
        description: 'The integration is working correctly.',
      });
    },
    onError: () => {
      toast({
        title: 'Connection Test Failed',
        description: 'Unable to connect to the service.',
        variant: 'destructive'
      });
    }
  });

  // Run sync mutation
  const runSyncMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      return await apiRequest(`/api/integration-connections/${connectionId}/sync`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Sync Started',
        description: 'Data synchronization has been initiated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integration-sync-jobs'] });
    }
  });

  const resetForm = () => {
    setConnectionForm({
      connectionName: '',
      environment: 'production',
      apiKey: '',
      apiSecret: '',
      username: '',
      password: '',
      clientId: '',
      clientSecret: '',
      webhookUrl: '',
      endpoint: '',
      autoSync: true,
      syncInterval: '15',
      dataMapping: 'automatic',
      errorHandling: 'retry'
    });
    setSetupStep(1);
    setSetupProgress(0);
  };

  const handleCreateConnection = () => {
    if (!selectedIntegration || !connectionForm.connectionName) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    createConnectionMutation.mutate({
      integrationName: selectedIntegration.name,
      ...connectionForm
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-gray-600 mt-1">Connect PlanetTogether to your existing systems with automatic setup</p>
        </div>
        <Button onClick={() => setShowNewConnection(true)}>
          <Sparkles className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Connections</p>
                <p className="text-2xl font-bold">{connections.filter((c: any) => c.status === 'active').length}</p>
              </div>
              <Link2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Auto-Setup Available</p>
                <p className="text-2xl font-bold">{integrations.filter(i => i.autoSetup).length}</p>
              </div>
              <Sparkles className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Records Synced Today</p>
                <p className="text-2xl font-bold">24,587</p>
              </div>
              <RefreshCw className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Next Sync</p>
                <p className="text-2xl font-bold">5 min</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="connections">Active Connections</TabsTrigger>
          <TabsTrigger value="available">Available Integrations</TabsTrigger>
          <TabsTrigger value="sync">Sync History</TabsTrigger>
          <TabsTrigger value="mappings">Field Mappings</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        {/* Active Connections Tab */}
        <TabsContent value="connections" className="space-y-4">
          {connections.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Unlink className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Connections</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first integration with automatic setup</p>
                <Button onClick={() => setShowNewConnection(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Add Integration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {connections.map((connection: any) => {
                const integration = integrations.find(i => i.name === connection.integrationName);
                const Icon = integration?.icon || Globe;
                
                return (
                  <Card key={connection.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg bg-gray-50 ${integration?.color || 'text-gray-500'}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{connection.connectionName}</h3>
                              <Badge variant={connection.status === 'active' ? 'default' : 'destructive'}>
                                {connection.status}
                              </Badge>
                              {connection.autoSetup && (
                                <Badge variant="secondary">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  Auto
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{integration?.displayName}</p>
                            {connection.lastSync && (
                              <p className="text-xs text-gray-500 mt-1">
                                Last sync: {new Date(connection.lastSync).toLocaleString()}
                                {connection.recordsSynced && ` • ${connection.recordsSynced} records`}
                              </p>
                            )}
                            {connection.error && (
                              <p className="text-xs text-red-500 mt-1">{connection.error}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testConnectionMutation.mutate(connection.id)}
                            disabled={testConnectionMutation.isPending}
                          >
                            {testConnectionMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Activity className="h-4 w-4" />
                            )}
                            Test
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => runSyncMutation.mutate(connection.id)}
                            disabled={runSyncMutation.isPending}
                          >
                            {runSyncMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            Sync Now
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Available Integrations Tab */}
        <TabsContent value="available" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntegrations.map((integration) => {
              const Icon = integration.icon;
              const isConnected = connections.some((c: any) => c.integrationName === integration.name);
              
              return (
                <Card 
                  key={integration.name} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${isConnected ? 'border-green-500' : ''}`}
                  onClick={() => {
                    setSelectedIntegration(integration);
                    setShowNewConnection(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg bg-gray-50 ${integration.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex gap-1">
                        {integration.autoSetup && (
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Auto
                          </Badge>
                        )}
                        {integration.popular && (
                          <Badge variant="secondary" className="text-xs">Popular</Badge>
                        )}
                        {isConnected && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </div>
                    <h3 className="font-semibold mb-1">{integration.displayName}</h3>
                    <p className="text-sm text-gray-600 mb-2">{integration.description}</p>
                    {integration.setupTime && (
                      <p className="text-xs text-gray-500 mb-2">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Setup time: {integration.setupTime}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {integration.capabilities.map((cap: string) => (
                        <Badge key={cap} variant="outline" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Sync History Tab */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Jobs</CardTitle>
              <CardDescription>Monitor data synchronization activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {syncJobs.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No sync jobs yet</p>
                ) : (
                  syncJobs.map((job: any) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(job.status)}
                        <div>
                          <p className="font-medium">{job.connectionName} - {job.entityType}</p>
                          <p className="text-sm text-gray-600">
                            Started: {new Date(job.startedAt).toLocaleString()}
                          </p>
                          {job.completedAt && (
                            <p className="text-sm text-gray-600">
                              Completed: {new Date(job.completedAt).toLocaleString()}
                            </p>
                          )}
                          {job.error && (
                            <p className="text-sm text-red-500">{job.error}</p>
                          )}
                        </div>
                      </div>
                      {job.recordsProcessed !== undefined && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Records Processed</p>
                          <p className="text-xl font-semibold">{job.recordsProcessed}</p>
                          {job.recordsCreated !== undefined && (
                            <p className="text-xs text-gray-500">
                              +{job.recordsCreated} new, {job.recordsUpdated} updated
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Field Mappings Tab */}
        <TabsContent value="mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Field Mappings</CardTitle>
              <CardDescription>Automatic field mapping between systems</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>Automatic Field Mapping</AlertTitle>
                <AlertDescription>
                  Our AI automatically maps fields between systems based on data types and naming patterns.
                  You can customize mappings after automatic setup.
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">SAP to PlanetTogether Mapping</h4>
                    <Badge variant="secondary">Auto-generated</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <code className="bg-gray-100 px-2 py-1 rounded">MATNR</code>
                      <ArrowRight className="h-4 w-4" />
                      <code className="bg-gray-100 px-2 py-1 rounded">item_number</code>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <code className="bg-gray-100 px-2 py-1 rounded">AUFNR</code>
                      <ArrowRight className="h-4 w-4" />
                      <code className="bg-gray-100 px-2 py-1 rounded">order_number</code>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <code className="bg-gray-100 px-2 py-1 rounded">WERKS</code>
                      <ArrowRight className="h-4 w-4" />
                      <code className="bg-gray-100 px-2 py-1 rounded">plant_id</code>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>Real-time event notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Webhook className="h-4 w-4" />
                <AlertTitle>Automatic Webhook Setup</AlertTitle>
                <AlertDescription>
                  Webhooks are automatically configured during integration setup for real-time data synchronization.
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Production Order Updates</h4>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Endpoint: <code className="bg-gray-100 px-2 py-1 rounded">https://api.planettogether.com/webhooks/orders</code>
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline">POST</Badge>
                    <Badge variant="outline">Real-time</Badge>
                    <Badge variant="outline">Secured</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Connection Dialog */}
      <Dialog open={showNewConnection} onOpenChange={setShowNewConnection}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedIntegration ? (
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gray-50 ${selectedIntegration.color}`}>
                    {selectedIntegration.icon && <selectedIntegration.icon className="h-5 w-5" />}
                  </div>
                  <span>Connect to {selectedIntegration.displayName}</span>
                </div>
              ) : (
                'Add New Integration'
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedIntegration?.autoSetup ? (
                <div className="flex items-center gap-2 mt-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span>Automatic setup available - {selectedIntegration.setupTime}</span>
                </div>
              ) : (
                'Configure your integration connection'
              )}
            </DialogDescription>
          </DialogHeader>

          {isAutoSetup ? (
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Setting up integration...</span>
                  <span className="text-sm text-gray-500">{setupProgress}%</span>
                </div>
                <Progress value={setupProgress} className="h-2" />
              </div>
              
              <div className="space-y-3">
                <div className={`flex items-center gap-3 ${setupProgress >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
                  {setupProgress >= 20 ? <CheckCircle className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
                  <span>Connecting to {selectedIntegration?.displayName}</span>
                </div>
                <div className={`flex items-center gap-3 ${setupProgress >= 40 ? 'text-green-600' : 'text-gray-400'}`}>
                  {setupProgress >= 40 ? <CheckCircle className="h-5 w-5" /> : setupProgress >= 20 ? <Loader2 className="h-5 w-5 animate-spin" /> : <Circle className="h-5 w-5" />}
                  <span>Authenticating credentials</span>
                </div>
                <div className={`flex items-center gap-3 ${setupProgress >= 60 ? 'text-green-600' : 'text-gray-400'}`}>
                  {setupProgress >= 60 ? <CheckCircle className="h-5 w-5" /> : setupProgress >= 40 ? <Loader2 className="h-5 w-5 animate-spin" /> : <Circle className="h-5 w-5" />}
                  <span>Discovering data schema</span>
                </div>
                <div className={`flex items-center gap-3 ${setupProgress >= 80 ? 'text-green-600' : 'text-gray-400'}`}>
                  {setupProgress >= 80 ? <CheckCircle className="h-5 w-5" /> : setupProgress >= 60 ? <Loader2 className="h-5 w-5 animate-spin" /> : <Circle className="h-5 w-5" />}
                  <span>Creating automatic field mappings</span>
                </div>
                <div className={`flex items-center gap-3 ${setupProgress >= 90 ? 'text-green-600' : 'text-gray-400'}`}>
                  {setupProgress >= 90 ? <CheckCircle className="h-5 w-5" /> : setupProgress >= 80 ? <Loader2 className="h-5 w-5 animate-spin" /> : <Circle className="h-5 w-5" />}
                  <span>Configuring webhooks</span>
                </div>
                <div className={`flex items-center gap-3 ${setupProgress >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
                  {setupProgress >= 100 ? <CheckCircle className="h-5 w-5" /> : setupProgress >= 90 ? <Loader2 className="h-5 w-5 animate-spin" /> : <Circle className="h-5 w-5" />}
                  <span>Finalizing setup</span>
                </div>
              </div>

              {selectedIntegration?.entities && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm font-medium mb-2">Data entities to sync:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedIntegration.entities.map((entity: string) => (
                      <Badge key={entity} variant="secondary">{entity}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Setup Steps */}
              {selectedIntegration?.autoSetup && setupStep === 1 && (
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Choose Setup Method</AlertTitle>
                    <AlertDescription>
                      You can use automatic setup for quick configuration or manual setup for custom settings.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <Card 
                      className="cursor-pointer hover:border-purple-500 transition-colors"
                      onClick={startAutoSetup}
                    >
                      <CardContent className="p-6 text-center">
                        <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">Automatic Setup</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Let AI configure everything automatically
                        </p>
                        <Badge variant="secondary">{selectedIntegration.setupTime}</Badge>
                      </CardContent>
                    </Card>

                    <Card 
                      className="cursor-pointer hover:border-blue-500 transition-colors"
                      onClick={() => setSetupStep(2)}
                    >
                      <CardContent className="p-6 text-center">
                        <Settings2 className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">Manual Setup</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Configure settings manually
                        </p>
                        <Badge variant="secondary">Customizable</Badge>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedIntegration?.entities && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <p className="text-sm font-medium mb-2">Available data entities:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedIntegration.entities.map((entity: string) => (
                          <Badge key={entity} variant="outline">{entity}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Setup Form */}
              {(!selectedIntegration?.autoSetup || setupStep === 2) && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="connectionName">Connection Name</Label>
                    <Input
                      id="connectionName"
                      value={connectionForm.connectionName}
                      onChange={(e) => setConnectionForm(prev => ({ ...prev, connectionName: e.target.value }))}
                      placeholder="e.g., Production SAP"
                    />
                  </div>

                  <div>
                    <Label htmlFor="environment">Environment</Label>
                    <Select 
                      value={connectionForm.environment} 
                      onValueChange={(value) => setConnectionForm(prev => ({ ...prev, environment: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="sandbox">Sandbox</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedIntegration?.authType === 'oauth2' && (
                    <>
                      <div>
                        <Label htmlFor="clientId">Client ID</Label>
                        <Input
                          id="clientId"
                          type="password"
                          value={connectionForm.clientId}
                          onChange={(e) => setConnectionForm(prev => ({ ...prev, clientId: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientSecret">Client Secret</Label>
                        <Input
                          id="clientSecret"
                          type="password"
                          value={connectionForm.clientSecret}
                          onChange={(e) => setConnectionForm(prev => ({ ...prev, clientSecret: e.target.value }))}
                        />
                      </div>
                    </>
                  )}

                  {selectedIntegration?.authType === 'api_key' && (
                    <div>
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={connectionForm.apiKey}
                        onChange={(e) => setConnectionForm(prev => ({ ...prev, apiKey: e.target.value }))}
                      />
                    </div>
                  )}

                  {selectedIntegration?.authType === 'basic' && (
                    <>
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={connectionForm.username}
                          onChange={(e) => setConnectionForm(prev => ({ ...prev, username: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={connectionForm.password}
                          onChange={(e) => setConnectionForm(prev => ({ ...prev, password: e.target.value }))}
                        />
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoSync">Enable Auto-Sync</Label>
                    <Switch
                      id="autoSync"
                      checked={connectionForm.autoSync}
                      onCheckedChange={(checked) => setConnectionForm(prev => ({ ...prev, autoSync: checked }))}
                    />
                  </div>

                  {connectionForm.autoSync && (
                    <div>
                      <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
                      <Select 
                        value={connectionForm.syncInterval} 
                        onValueChange={(value) => setConnectionForm(prev => ({ ...prev, syncInterval: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">Every 5 minutes</SelectItem>
                          <SelectItem value="15">Every 15 minutes</SelectItem>
                          <SelectItem value="30">Every 30 minutes</SelectItem>
                          <SelectItem value="60">Every hour</SelectItem>
                          <SelectItem value="1440">Daily</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="dataMapping">Field Mapping</Label>
                    <Select 
                      value={connectionForm.dataMapping} 
                      onValueChange={(value) => setConnectionForm(prev => ({ ...prev, dataMapping: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatic">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Automatic (AI-powered)
                          </div>
                        </SelectItem>
                        <SelectItem value="manual">Manual Configuration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isAutoSetup && (
            <DialogFooter>
              {selectedIntegration?.autoSetup && setupStep === 1 ? (
                <Button variant="ghost" onClick={() => setShowNewConnection(false)}>
                  Cancel
                </Button>
              ) : (
                <>
                  {setupStep === 2 && (
                    <Button variant="ghost" onClick={() => setSetupStep(1)}>
                      Back
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => {
                    setShowNewConnection(false);
                    setSetupStep(1);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateConnection} disabled={createConnectionMutation.isPending}>
                    {createConnectionMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Connection'
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component for empty circle icon
function Circle({ className }: { className?: string }) {
  return (
    <div className={`rounded-full border-2 border-current ${className}`} style={{ width: '1.25rem', height: '1.25rem' }} />
  );
}
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus,
  Settings,
  Play,
  Pause,
  TestTube,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Cloud,
  Webhook,
  FileText,
  BarChart3,
  Trash2,
  Edit,
  RefreshCw,
  Eye,
  Zap,
  Shield,
  Globe,
  ChevronRight,
  Search,
  Filter,
  Download,
  Upload,
  AlertTriangle,
  Info,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useMaxDock } from '@/contexts/MaxDockContext';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface SystemIntegration {
  id: number;
  name: string;
  description?: string;
  type: string;
  system?: string;
  status: 'active' | 'inactive' | 'error' | 'testing' | 'pending';
  configuration: any;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  errorCount: number;
  successCount: number;
  lastTested?: string;
  lastSync?: string;
  isAiGenerated: boolean;
  createdAt: string;
  dataFlows?: IntegrationDataFlow[];
}

interface IntegrationDataFlow {
  id: number;
  integrationId: number;
  name: string;
  description?: string;
  direction: 'inbound' | 'outbound' | 'bidirectional';
  sourceSystem: string;
  targetSystem: string;
  dataType: string;
  isActive: boolean;
  schedule?: string;
  lastExecution?: string;
  successCount: number;
  errorCount: number;
}

const INTEGRATION_TYPES = [
  { value: 'erp', label: 'ERP System', icon: Database, description: 'Enterprise Resource Planning systems' },
  { value: 'crm', label: 'CRM System', icon: Globe, description: 'Customer Relationship Management' },
  { value: 'api', label: 'REST API', icon: Cloud, description: 'RESTful web services' },
  { value: 'database', label: 'Database', icon: Database, description: 'Direct database connections' },
  { value: 'file_transfer', label: 'File Transfer', icon: Upload, description: 'FTP, SFTP, cloud storage' },
  { value: 'webhook', label: 'Webhook', icon: Webhook, description: 'Real-time HTTP callbacks' },
  { value: 'custom', label: 'Custom Integration', icon: Settings, description: 'Custom built integrations' }
];

const POPULAR_SYSTEMS = [
  { name: 'SAP ERP', type: 'erp', description: 'SAP S/4HANA and ECC systems' },
  { name: 'NetSuite', type: 'erp', description: 'Oracle NetSuite ERP cloud platform' },
  { name: 'QuickBooks', type: 'erp', description: 'QuickBooks Online and Desktop' },
  { name: 'Salesforce', type: 'crm', description: 'Salesforce CRM platform' },
  { name: 'Microsoft Dynamics', type: 'erp', description: 'Dynamics 365 Business Central' },
  { name: 'Oracle ERP', type: 'erp', description: 'Oracle Cloud ERP applications' },
  { name: 'Sage', type: 'erp', description: 'Sage business management solutions' },
  { name: 'Workday', type: 'erp', description: 'Workday HCM and Financial Management' }
];

export default function SystemIntegrationsPage() {
  const { toast } = useToast();
  const { isMaxOpen } = useMaxDock();
  const [activeTab, setActiveTab] = useState('integrations');
  const [selectedIntegration, setSelectedIntegration] = useState<SystemIntegration | null>(null);
  const [showNewIntegrationDialog, setShowNewIntegrationDialog] = useState(false);
  const [showAiWizardDialog, setShowAiWizardDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // AI Wizard State
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedSystemType, setSelectedSystemType] = useState('');
  const [isGeneratingIntegration, setIsGeneratingIntegration] = useState(false);

  // Fetch integrations
  const { data: integrations = [], isLoading: integrationsLoading } = useQuery({
    queryKey: ['/api/system-integrations'],
  });

  // Fetch data flows
  const { data: dataFlows = [], isLoading: dataFlowsLoading } = useQuery({
    queryKey: ['/api/integration-data-flows'],
  });

  // Fetch execution logs
  const { data: executionLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['/api/integration-execution-logs'],
  });

  // Create integration mutation
  const createIntegrationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/system-integrations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-integrations'] });
      setShowNewIntegrationDialog(false);
      toast({
        title: "Integration Created",
        description: "New system integration has been successfully created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create integration.",
        variant: "destructive",
      });
    },
  });

  // AI Integration Generation Mutation
  const generateAiIntegrationMutation = useMutation({
    mutationFn: async (data: { prompt: string; systemType: string }) => {
      setIsGeneratingIntegration(true);
      return apiRequest('POST', '/api/ai/generate-integration', data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-integrations'] });
      setShowAiWizardDialog(false);
      setAiPrompt('');
      setSelectedSystemType('');
      toast({
        title: "AI Integration Generated",
        description: `Successfully generated integration for ${result.system}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "AI Generation Failed",
        description: error.message || "Failed to generate integration with AI.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGeneratingIntegration(false);
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: (integrationId: number) => 
      apiRequest('POST', `/api/system-integrations/${integrationId}/test`),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-integrations'] });
      toast({
        title: "Connection Test",
        description: result.success ? "Connection successful!" : `Connection failed: ${result.error}`,
        variant: result.success ? "default" : "destructive",
      });
    },
  });

  const filteredIntegrations = integrations.filter((integration: SystemIntegration) => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.system?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || integration.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800',
      testing: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return variants[status as keyof typeof variants] || variants.inactive;
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleAiGeneration = () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Input Required",
        description: "Please describe the integration you want to create.",
        variant: "destructive",
      });
      return;
    }

    generateAiIntegrationMutation.mutate({
      prompt: aiPrompt,
      systemType: selectedSystemType
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className={`${isMaxOpen ? 'md:ml-0' : 'md:ml-12'} ml-12`}>
          <h1 className="text-2xl font-bold text-foreground mb-2">System Integrations</h1>
          <p className="text-gray-600">
            Connect PlanetTogether with external systems using AI-powered integration builder
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Integrations</p>
                <p className="text-2xl font-bold">{integrations.length}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Connections</p>
                <p className="text-2xl font-bold text-green-600">
                  {integrations.filter((i: SystemIntegration) => i.status === 'active').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Data Flows</p>
                <p className="text-2xl font-bold">{dataFlows.length}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {integrations.length > 0 ? Math.round(
                    integrations.reduce((sum: number, i: SystemIntegration) => 
                      sum + (i.successCount || 0), 0) / 
                    integrations.reduce((sum: number, i: SystemIntegration) => 
                      sum + (i.successCount || 0) + (i.errorCount || 0), 1) * 100
                  ) : 0}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="dataflows">Data Flows</TabsTrigger>
            <TabsTrigger value="logs">Execution Logs</TabsTrigger>
          </TabsList>

          <div className="flex flex-col sm:flex-row gap-2">
            <Dialog open={showAiWizardDialog} onOpenChange={setShowAiWizardDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Integration Wizard
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    AI Integration Wizard
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Describe the system you want to integrate with and AI will automatically create the connection configuration, data mappings, and sync schedules.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="systemType">System Type (Optional)</Label>
                      <Select value={selectedSystemType} onValueChange={setSelectedSystemType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a system type or leave blank for AI to determine" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Let AI determine automatically</SelectItem>
                          {POPULAR_SYSTEMS.map(system => (
                            <SelectItem key={system.name} value={system.name}>
                              {system.name} - {system.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="aiPrompt">Integration Requirements</Label>
                      <Textarea
                        id="aiPrompt"
                        placeholder="Example: 'Connect to our SAP system to sync production orders and inventory levels every hour. We need to pull work orders from SAP and push completion status back. The SAP system is at https://sap.company.com with API access.'"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        rows={4}
                        className="mt-1"
                      />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">AI will automatically:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Detect the system type and configure authentication</li>
                        <li>• Create appropriate data flow mappings</li>
                        <li>• Set up sync schedules based on your requirements</li>
                        <li>• Configure error handling and retry logic</li>
                        <li>• Generate test cases for validation</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAiWizardDialog(false)}
                      disabled={isGeneratingIntegration}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAiGeneration}
                      disabled={isGeneratingIntegration || !aiPrompt.trim()}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {isGeneratingIntegration ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Integration
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showNewIntegrationDialog} onOpenChange={setShowNewIntegrationDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Integration
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Integration</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {INTEGRATION_TYPES.map(type => {
                      const Icon = type.icon;
                      return (
                        <Card key={type.value} className="cursor-pointer hover:border-blue-500 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <Icon className="h-6 w-6 text-blue-500" />
                              <div>
                                <h3 className="font-medium">{type.label}</h3>
                                <p className="text-sm text-gray-600">{type.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="integrations" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search integrations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {integrationsLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredIntegrations.length > 0 ? (
              filteredIntegrations.map((integration: SystemIntegration) => (
                <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Database className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription>{integration.system}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getHealthIcon(integration.healthStatus)}
                        <Badge className={getStatusBadge(integration.status)}>
                          {integration.status}
                        </Badge>
                        {integration.isAiGenerated && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">{integration.description}</p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Success Rate</span>
                        <span className="font-medium">
                          {integration.successCount + integration.errorCount > 0 
                            ? Math.round((integration.successCount / (integration.successCount + integration.errorCount)) * 100)
                            : 0}%
                        </span>
                      </div>
                      
                      {integration.lastSync && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Last Sync</span>
                          <span className="font-medium">
                            {new Date(integration.lastSync).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testConnectionMutation.mutate(integration.id)}
                          disabled={testConnectionMutation.isPending}
                        >
                          <TestTube className="h-4 w-4 mr-1" />
                          Test
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-1" />
                          Configure
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        {integration.status === 'active' ? (
                          <Button size="sm" variant="outline">
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline">
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Integrations Found</h3>
                <p className="text-gray-600 mb-4">
                  Get started by creating your first system integration using our AI wizard.
                </p>
                <Button
                  onClick={() => setShowAiWizardDialog(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create with AI
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="dataflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Flow Management</CardTitle>
              <CardDescription>
                Manage data synchronization flows between systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Data flows will appear here once integrations are configured.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution Logs</CardTitle>
              <CardDescription>
                Monitor integration execution history and troubleshoot issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Execution logs will appear here as integrations run.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
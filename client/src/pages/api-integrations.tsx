import React, { useState } from 'react';
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

interface ApiIntegration {
  id: number;
  name: string;
  description?: string;
  systemType: string;
  provider: string;
  status: 'active' | 'inactive' | 'error' | 'testing' | 'pending';
  healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  endpoint: string;
  authType: string;
  errorCount: number;
  successCount: number;
  lastSync?: string;
  isAiGenerated: boolean;
  createdAt: string;
}

interface ApiMapping {
  id: number;
  integrationId: number;
  name: string;
  direction: 'inbound' | 'outbound' | 'bidirectional';
  sourceSystem: string;
  targetTable: string;
  status: 'active' | 'inactive';
  isAiGenerated: boolean;
}

interface ApiTest {
  id: number;
  integrationId: number;
  name: string;
  testType: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  lastRun?: string;
  duration?: number;
}

// Sample data for demonstration
const sampleIntegrations: ApiIntegration[] = [
  {
    id: 1,
    name: "SAP ERP Integration",
    description: "Production data synchronization with SAP ERP system",
    systemType: "ERP",
    provider: "SAP",
    status: "active",
    healthStatus: "healthy",
    endpoint: "https://api.sap.company.com/production/v1",
    authType: "oauth2",
    errorCount: 2,
    successCount: 1247,
    lastSync: "2025-01-26T21:45:00Z",
    isAiGenerated: false,
    createdAt: "2025-01-20T10:00:00Z"
  },
  {
    id: 2,
    name: "Oracle WMS Connector",
    description: "Warehouse management system integration for inventory tracking",
    systemType: "WMS",
    provider: "Oracle",
    status: "active",
    healthStatus: "degraded",
    endpoint: "https://wms.oracle.company.com/api/v2",
    authType: "api_key",
    errorCount: 15,
    successCount: 892,
    lastSync: "2025-01-26T21:30:00Z",
    isAiGenerated: true,
    createdAt: "2025-01-18T14:30:00Z"
  },
  {
    id: 3,
    name: "Salesforce CRM Link",
    description: "Customer order and production schedule synchronization",
    systemType: "CRM",
    provider: "Salesforce",
    status: "testing",
    healthStatus: "unknown",
    endpoint: "https://company.salesforce.com/services/data/v58.0",
    authType: "oauth2",
    errorCount: 0,
    successCount: 0,
    isAiGenerated: true,
    createdAt: "2025-01-26T09:15:00Z"
  }
];

const sampleMappings: ApiMapping[] = [
  {
    id: 1,
    integrationId: 1,
    name: "Production Orders Sync",
    direction: "inbound",
    sourceSystem: "SAP ERP",
    targetTable: "jobs",
    status: "active",
    isAiGenerated: false
  },
  {
    id: 2,
    integrationId: 1,
    name: "Resource Availability Update",
    direction: "outbound",
    sourceSystem: "PlanetTogether",
    targetTable: "resources",
    status: "active",
    isAiGenerated: false
  },
  {
    id: 3,
    integrationId: 2,
    name: "Inventory Levels Sync",
    direction: "bidirectional",
    sourceSystem: "Oracle WMS",
    targetTable: "inventory",
    status: "active",
    isAiGenerated: true
  }
];

const sampleTests: ApiTest[] = [
  {
    id: 1,
    integrationId: 1,
    name: "Connection Test",
    testType: "connectivity",
    status: "passed",
    lastRun: "2025-01-26T21:45:00Z",
    duration: 1200
  },
  {
    id: 2,
    integrationId: 1,
    name: "Data Validation Test",
    testType: "data_validation",
    status: "passed",
    lastRun: "2025-01-26T21:45:00Z",
    duration: 3400
  },
  {
    id: 3,
    integrationId: 2,
    name: "Authentication Test",
    testType: "authentication",
    status: "failed",
    lastRun: "2025-01-26T21:30:00Z",
    duration: 5600
  }
];

export default function ApiIntegrationsPage() {
  const { toast } = useToast();
  const { isMaxOpen } = useMaxDock();
  const [activeTab, setActiveTab] = useState("integrations");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [integrations] = useState<ApiIntegration[]>(sampleIntegrations);
  const [mappings] = useState<ApiMapping[]>(sampleMappings);
  const [tests] = useState<ApiTest[]>(sampleTests);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

  // Filter integrations based on search and status
  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.systemType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || integration.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'inactive': return 'bg-gray-500 text-white';
      case 'error': return 'bg-red-500 text-white';
      case 'testing': return 'bg-blue-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'unhealthy': return 'text-red-500';
      case 'unknown': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'sap': return <Database className="w-4 h-4" />;
      case 'oracle': return <Cloud className="w-4 h-4" />;
      case 'salesforce': return <Globe className="w-4 h-4" />;
      default: return <Webhook className="w-4 h-4" />;
    }
  };

  const handleTestConnection = (integrationId: number) => {
    toast({
      title: "Testing Connection",
      description: "Running connectivity test for integration...",
    });
  };

  const handleSyncNow = (integrationId: number) => {
    toast({
      title: "Synchronization Started",
      description: "Manual sync initiated for integration...",
    });
  };

  const handleAiGenerate = () => {
    toast({
      title: "AI Integration Generated",
      description: "New integration configuration created with AI assistance.",
    });
    setIsAiDialogOpen(false);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 ${isMaxOpen ? 'md:ml-0' : 'md:ml-12'} transition-all duration-300`}>
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">API Integrations</h1>
              <p className="text-sm text-gray-500">Connect and synchronize with external systems</p>
            </div>
          </div>
          
          <div className="ml-auto flex items-center space-x-3">
            <Button
              onClick={() => setIsAiDialogOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Generate
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Integration
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search integrations, systems, or providers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="mappings">Data Mappings</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <div className="grid gap-6">
              {filteredIntegrations.map((integration) => (
                <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          {getProviderIcon(integration.provider)}
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {integration.name}
                            {integration.isAiGenerated && (
                              <Badge variant="secondary" className="text-xs">
                                <Sparkles className="w-3 h-3 mr-1" />
                                AI Generated
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{integration.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(integration.status)}>
                          {integration.status}
                        </Badge>
                        {integration.healthStatus === 'healthy' && <CheckCircle className={`w-4 h-4 ${getHealthStatusColor(integration.healthStatus)}`} />}
                        {integration.healthStatus === 'degraded' && <AlertTriangle className={`w-4 h-4 ${getHealthStatusColor(integration.healthStatus)}`} />}
                        {integration.healthStatus === 'unhealthy' && <AlertCircle className={`w-4 h-4 ${getHealthStatusColor(integration.healthStatus)}`} />}
                        {integration.healthStatus === 'unknown' && <Clock className={`w-4 h-4 ${getHealthStatusColor(integration.healthStatus)}`} />}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label className="text-xs text-gray-500">System Type</Label>
                        <p className="font-medium">{integration.systemType}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Provider</Label>
                        <p className="font-medium">{integration.provider}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Authentication</Label>
                        <p className="font-medium capitalize">{integration.authType}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label className="text-xs text-gray-500">Success Rate</Label>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={(integration.successCount / (integration.successCount + integration.errorCount)) * 100} 
                            className="flex-1"
                          />
                          <span className="text-sm font-medium">
                            {Math.round((integration.successCount / (integration.successCount + integration.errorCount)) * 100)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Total Requests</Label>
                        <p className="font-medium">{integration.successCount + integration.errorCount}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Last Sync</Label>
                        <p className="font-medium">
                          {integration.lastSync ? new Date(integration.lastSync).toLocaleString() : 'Never'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleTestConnection(integration.id)}>
                        <TestTube className="w-4 h-4 mr-2" />
                        Test
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleSyncNow(integration.id)}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync Now
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Data Mappings Tab */}
          <TabsContent value="mappings">
            <div className="grid gap-4">
              {mappings.map((mapping) => (
                <Card key={mapping.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {mapping.name}
                          {mapping.isAiGenerated && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              AI Generated
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {mapping.sourceSystem} → {mapping.targetTable}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(mapping.status)}>
                        {mapping.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline">
                          {mapping.direction}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Target: {mapping.targetTable}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <TestTube className="w-4 h-4 mr-2" />
                          Test
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests">
            <div className="grid gap-4">
              {tests.map((test) => (
                <Card key={test.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{test.name}</CardTitle>
                        <CardDescription>
                          Type: {test.testType.replace('_', ' ')}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(test.status)}>
                          {test.status}
                        </Badge>
                        {test.status === 'passed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {test.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                        {test.status === 'running' && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <Label className="text-xs text-gray-500">Last Run</Label>
                          <p className="text-sm">
                            {test.lastRun ? new Date(test.lastRun).toLocaleString() : 'Never'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Duration</Label>
                          <p className="text-sm">
                            {test.duration ? `${test.duration}ms` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Play className="w-4 h-4 mr-2" />
                        Run Test
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    System Health Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Healthy Integrations</span>
                      <Badge className="bg-green-500 text-white">1</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Degraded Integrations</span>
                      <Badge className="bg-yellow-500 text-white">1</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Failed Integrations</span>
                      <Badge className="bg-red-500 text-white">0</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Testing/Unknown</span>
                      <Badge className="bg-blue-500 text-white">1</Badge>
                    </div>
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
                    <div>
                      <Label className="text-sm text-gray-500">Overall Success Rate</Label>
                      <div className="flex items-center space-x-2">
                        <Progress value={94} className="flex-1" />
                        <span className="text-sm font-medium">94%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Average Response Time</Label>
                      <p className="text-lg font-semibold">234ms</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Total Requests (24h)</Label>
                      <p className="text-lg font-semibold">2,139</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Generation Dialog */}
      <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI-Powered Integration Generation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-prompt">Describe the integration you need</Label>
              <Textarea
                id="ai-prompt"
                placeholder="e.g., 'Connect to our Salesforce CRM to sync customer orders with production jobs automatically'"
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ai-system-type">System Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select system type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="erp">ERP</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="wms">WMS</SelectItem>
                    <SelectItem value="mes">MES</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="api">REST API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ai-provider">Provider (Optional)</Label>
                <Input placeholder="e.g., SAP, Oracle, Salesforce" />
              </div>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                AI will analyze your requirements and generate a complete integration configuration including authentication, data mappings, and testing scenarios.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsAiDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAiGenerate} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Integration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Integration Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Integration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Integration Name</Label>
              <Input id="name" placeholder="e.g., SAP ERP Production Data Sync" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Brief description of what this integration does" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="system-type">System Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select system type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="erp">ERP</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="wms">WMS</SelectItem>
                    <SelectItem value="mes">MES</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="api">REST API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="provider">Provider</Label>
                <Input id="provider" placeholder="e.g., SAP, Oracle, Salesforce" />
              </div>
            </div>
            <div>
              <Label htmlFor="endpoint">API Endpoint</Label>
              <Input id="endpoint" placeholder="https://api.example.com/v1" />
            </div>
            <div>
              <Label htmlFor="auth-type">Authentication Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select authentication method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>
                Create Integration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Factory, 
  Shield, 
  Box, 
  BarChart3, 
  Users, 
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Settings,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Cpu,
  Database,
  Network,
  Zap,
  Loader2,
  Play,
  Pause
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFederationModule, isFederationInitialized } from '@/lib/federation-bootstrap';
import ShopFloorWidget from '@/components/shop-floor-widget';
import QualityWidget from '@/components/quality-widget';
import InventoryWidget from '@/components/inventory-widget';
import { ReactFlow, Node, Edge, Controls, MiniMap, Background } from 'reactflow';
import 'reactflow/dist/style.css';

interface ModuleStatus {
  id: string;
  name: string;
  status: 'initializing' | 'ready' | 'error' | 'stopped';
  lastError?: string;
  dependencies: string[];
  performance?: {
    loadTime?: number;
    memoryUsage?: number;
    eventCount?: number;
  };
}

interface DataFlow {
  source: string;
  target: string;
  status: 'active' | 'idle' | 'error';
  messagesPerSecond: number;
  lastMessage?: Date;
}

const moduleIcons: Record<string, React.ReactNode> = {
  'core-platform': <Cpu className="h-4 w-4" />,
  'agent-system': <Users className="h-4 w-4" />,
  'production-scheduling': <Factory className="h-4 w-4" />,
  'shop-floor': <Activity className="h-4 w-4" />,
  'quality-management': <Shield className="h-4 w-4" />,
  'inventory-planning': <Box className="h-4 w-4" />,
  'analytics-reporting': <BarChart3 className="h-4 w-4" />,
  'shared-components': <Package className="h-4 w-4" />
};

export default function FederationDashboard() {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [modules, setModules] = useState<ModuleStatus[]>([]);
  const [dataFlows, setDataFlows] = useState<DataFlow[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [flowNodes, setFlowNodes] = useState<Node[]>([]);
  const [flowEdges, setFlowEdges] = useState<Edge[]>([]);

  // Initialize federation system
  useEffect(() => {
    const checkInitialization = async () => {
      const initialized = isFederationInitialized();
      setIsInitialized(initialized);
      
      if (initialized) {
        await loadModuleStatuses();
        setupDataFlowVisualization();
      }
    };
    
    checkInitialization();
    
    // Set up polling for module status
    const interval = setInterval(() => {
      if (autoRefresh && isInitialized) {
        loadModuleStatuses();
        updateDataFlows();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, isInitialized]);

  const loadModuleStatuses = async () => {
    // Simulate getting module statuses
    const moduleList: ModuleStatus[] = [
      {
        id: 'core-platform',
        name: 'Core Platform',
        status: 'ready',
        dependencies: ['shared-components'],
        performance: { loadTime: 45, memoryUsage: 12.5, eventCount: 234 }
      },
      {
        id: 'agent-system',
        name: 'Agent System',
        status: 'ready',
        dependencies: ['core-platform'],
        performance: { loadTime: 120, memoryUsage: 25.3, eventCount: 567 }
      },
      {
        id: 'production-scheduling',
        name: 'Production Scheduling',
        status: 'ready',
        dependencies: ['core-platform', 'shared-components'],
        performance: { loadTime: 230, memoryUsage: 45.7, eventCount: 1234 }
      },
      {
        id: 'shop-floor',
        name: 'Shop Floor',
        status: 'ready',
        dependencies: ['core-platform', 'production-scheduling'],
        performance: { loadTime: 180, memoryUsage: 18.9, eventCount: 892 }
      },
      {
        id: 'quality-management',
        name: 'Quality Management',
        status: 'ready',
        dependencies: ['core-platform', 'shop-floor'],
        performance: { loadTime: 95, memoryUsage: 15.2, eventCount: 345 }
      },
      {
        id: 'inventory-planning',
        name: 'Inventory Planning',
        status: 'ready',
        dependencies: ['core-platform', 'production-scheduling'],
        performance: { loadTime: 110, memoryUsage: 22.8, eventCount: 456 }
      },
      {
        id: 'analytics-reporting',
        name: 'Analytics Reporting',
        status: 'ready',
        dependencies: ['core-platform', 'shared-components'],
        performance: { loadTime: 85, memoryUsage: 30.1, eventCount: 678 }
      },
      {
        id: 'shared-components',
        name: 'Shared Components',
        status: 'ready',
        dependencies: [],
        performance: { loadTime: 25, memoryUsage: 8.4, eventCount: 123 }
      }
    ];
    
    setModules(moduleList);
  };

  const updateDataFlows = () => {
    // Simulate data flows between modules
    const flows: DataFlow[] = [
      {
        source: 'production-scheduling',
        target: 'shop-floor',
        status: 'active',
        messagesPerSecond: Math.random() * 10,
        lastMessage: new Date()
      },
      {
        source: 'shop-floor',
        target: 'quality-management',
        status: 'active',
        messagesPerSecond: Math.random() * 5,
        lastMessage: new Date()
      },
      {
        source: 'quality-management',
        target: 'analytics-reporting',
        status: 'active',
        messagesPerSecond: Math.random() * 3,
        lastMessage: new Date()
      },
      {
        source: 'inventory-planning',
        target: 'production-scheduling',
        status: 'active',
        messagesPerSecond: Math.random() * 2,
        lastMessage: new Date()
      },
      {
        source: 'core-platform',
        target: 'agent-system',
        status: 'active',
        messagesPerSecond: Math.random() * 15,
        lastMessage: new Date()
      }
    ];
    
    setDataFlows(flows);
  };

  const setupDataFlowVisualization = () => {
    // Create nodes for ReactFlow visualization
    const nodes: Node[] = [
      {
        id: 'core-platform',
        position: { x: 250, y: 50 },
        data: { label: '🖥️ Core Platform' },
        style: { background: '#e0f2fe', border: '2px solid #0284c7' }
      },
      {
        id: 'shared-components',
        position: { x: 50, y: 50 },
        data: { label: '📦 Shared Components' },
        style: { background: '#fef3c7', border: '2px solid #f59e0b' }
      },
      {
        id: 'agent-system',
        position: { x: 450, y: 50 },
        data: { label: '🤖 Agent System' },
        style: { background: '#ddd6fe', border: '2px solid #7c3aed' }
      },
      {
        id: 'production-scheduling',
        position: { x: 150, y: 200 },
        data: { label: '🏭 Production Scheduling' },
        style: { background: '#dcfce7', border: '2px solid #22c55e' }
      },
      {
        id: 'shop-floor',
        position: { x: 350, y: 200 },
        data: { label: '⚙️ Shop Floor' },
        style: { background: '#fee2e2', border: '2px solid #ef4444' }
      },
      {
        id: 'quality-management',
        position: { x: 550, y: 200 },
        data: { label: '🛡️ Quality Management' },
        style: { background: '#f3e8ff', border: '2px solid #9333ea' }
      },
      {
        id: 'inventory-planning',
        position: { x: 50, y: 350 },
        data: { label: '📦 Inventory Planning' },
        style: { background: '#ffedd5', border: '2px solid #ea580c' }
      },
      {
        id: 'analytics-reporting',
        position: { x: 350, y: 350 },
        data: { label: '📊 Analytics Reporting' },
        style: { background: '#e0e7ff', border: '2px solid #6366f1' }
      }
    ];

    const edges: Edge[] = [
      { id: 'e1', source: 'shared-components', target: 'core-platform', animated: true },
      { id: 'e2', source: 'core-platform', target: 'agent-system', animated: true },
      { id: 'e3', source: 'core-platform', target: 'production-scheduling', animated: true },
      { id: 'e4', source: 'production-scheduling', target: 'shop-floor', animated: true },
      { id: 'e5', source: 'shop-floor', target: 'quality-management', animated: true },
      { id: 'e6', source: 'production-scheduling', target: 'inventory-planning', animated: true },
      { id: 'e7', source: 'inventory-planning', target: 'production-scheduling', animated: true, style: { stroke: '#f59e0b' } },
      { id: 'e8', source: 'quality-management', target: 'analytics-reporting', animated: true },
      { id: 'e9', source: 'shop-floor', target: 'analytics-reporting', animated: true },
      { id: 'e10', source: 'shared-components', target: 'analytics-reporting', animated: true }
    ];

    setFlowNodes(nodes);
    setFlowEdges(edges);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'initializing':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'initializing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleModuleRestart = async (moduleId: string) => {
    toast({
      title: 'Restarting Module',
      description: `Restarting ${moduleId}...`,
    });
    
    // Simulate module restart
    setTimeout(() => {
      toast({
        title: 'Module Restarted',
        description: `${moduleId} has been restarted successfully`,
      });
      loadModuleStatuses();
    }, 2000);
  };

  if (!isInitialized) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg font-medium">Initializing Federation System...</p>
              <p className="text-sm text-muted-foreground">Loading modules and establishing connections</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Federation Module Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage all federation modules</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            data-testid="button-toggle-refresh"
          >
            {autoRefresh ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {autoRefresh ? 'Pause' : 'Resume'} Auto-Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={loadModuleStatuses} data-testid="button-manual-refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="data-flow">Data Flow</TabsTrigger>
          <TabsTrigger value="shop-floor">Shop Floor</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((module) => (
              <Card 
                key={module.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedModule === module.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedModule(module.id)}
                data-testid={`card-module-${module.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {moduleIcons[module.id]}
                      <CardTitle className="text-sm font-medium">{module.name}</CardTitle>
                    </div>
                    {getStatusIcon(module.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <Badge className={`mb-2 ${getStatusColor(module.status)}`}>
                    {module.status.toUpperCase()}
                  </Badge>
                  
                  {module.performance && (
                    <div className="space-y-2 mt-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Load Time</span>
                        <span>{module.performance.loadTime}ms</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Memory</span>
                        <span>{module.performance.memoryUsage?.toFixed(1)}MB</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Events</span>
                        <span>{module.performance.eventCount}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleModuleRestart(module.id);
                      }}
                      data-testid={`button-restart-${module.id}`}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      data-testid={`button-settings-${module.id}`}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Module Details */}
          {selectedModule && (
            <Card>
              <CardHeader>
                <CardTitle>Module Details: {modules.find(m => m.id === selectedModule)?.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Dependencies</h4>
                    <div className="space-y-1">
                      {modules.find(m => m.id === selectedModule)?.dependencies.map(dep => (
                        <Badge key={dep} variant="outline">{dep}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Data Flows</h4>
                    <div className="space-y-2">
                      {dataFlows
                        .filter(flow => flow.source === selectedModule || flow.target === selectedModule)
                        .map((flow, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">{flow.source}</Badge>
                            <ArrowRight className="h-3 w-3" />
                            <Badge variant="outline">{flow.target}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {flow.messagesPerSecond.toFixed(1)} msg/s
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Data Flow Tab */}
        <TabsContent value="data-flow" className="space-y-4">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle>Inter-Module Data Flow Visualization</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px]">
              <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                fitView
              >
                <Controls />
                <MiniMap />
                <Background variant="dots" gap={12} size={1} />
              </ReactFlow>
            </CardContent>
          </Card>

          {/* Data Flow Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Messages/Sec</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dataFlows.reduce((sum, flow) => sum + flow.messagesPerSecond, 0).toFixed(1)}
                </div>
                <Progress value={75} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Active Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dataFlows.filter(f => f.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dataFlows.length} total connections
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-lg font-medium">Healthy</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  All modules operational
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Shop Floor Tab */}
        <TabsContent value="shop-floor">
          <ShopFloorWidget />
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality">
          <QualityWidget />
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <InventoryWidget />
        </TabsContent>
      </Tabs>
    </div>
  );
}
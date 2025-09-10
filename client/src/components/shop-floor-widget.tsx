import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Factory,
  Gauge,
  Loader2,
  PauseCircle,
  PlayCircle,
  Settings,
  TrendingUp,
  TrendingDown,
  Users,
  Wrench,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFederationModule } from '@/lib/federation-bootstrap';
import { format } from 'date-fns';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Operation {
  id: number;
  jobId: number;
  operationName: string;
  resourceName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'paused' | 'error';
  progress: number;
  startDate: Date;
  endDate: Date;
  actualStartDate?: Date;
  operator?: string;
}

interface Equipment {
  id: number;
  name: string;
  type: string;
  status: 'running' | 'idle' | 'maintenance' | 'error' | 'offline';
  utilization: number;
  currentOperation?: string;
  nextMaintenance?: Date;
  efficiency: number;
}

interface OperatorTask {
  id: number;
  operatorName: string;
  taskName: string;
  status: 'assigned' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueTime: Date;
}

export default function ShopFloorWidget() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [operatorTasks, setOperatorTasks] = useState<OperatorTask[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Shop floor metrics
  const [metrics, setMetrics] = useState({
    totalOperations: 0,
    completedToday: 0,
    avgCycleTime: 0,
    overallEfficiency: 0,
    activeOperators: 0,
    equipmentUtilization: 0
  });

  useEffect(() => {
    loadShopFloorData();
    
    // Set up real-time updates
    const interval = setInterval(loadShopFloorData, 10000); // Update every 10 seconds
    setRefreshInterval(interval);
    
    // Subscribe to shop floor events
    subscribeToShopFloorEvents();
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  const loadShopFloorData = async () => {
    try {
      setLoading(true);
      const shopFloorModule = await getFederationModule('shop-floor');
      
      // Get current operations
      const opsResult = await shopFloorModule.getCurrentOperations(1); // Plant ID 1
      if (opsResult.success && opsResult.data) {
        // Transform data or use mock data for demo
        const mockOps: Operation[] = [
          {
            id: 1,
            jobId: 101,
            operationName: 'CNC Machining - Part A',
            resourceName: 'CNC Machine 1',
            status: 'in_progress',
            progress: 65,
            startDate: new Date(),
            endDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
            actualStartDate: new Date(Date.now() - 60 * 60 * 1000),
            operator: 'John Smith'
          },
          {
            id: 2,
            jobId: 102,
            operationName: 'Assembly - Unit B',
            resourceName: 'Assembly Line 2',
            status: 'in_progress',
            progress: 30,
            startDate: new Date(),
            endDate: new Date(Date.now() + 3 * 60 * 60 * 1000),
            operator: 'Sarah Johnson'
          },
          {
            id: 3,
            jobId: 103,
            operationName: 'Quality Inspection',
            resourceName: 'QC Station 1',
            status: 'pending',
            progress: 0,
            startDate: new Date(Date.now() + 60 * 60 * 1000),
            endDate: new Date(Date.now() + 2 * 60 * 60 * 1000)
          },
          {
            id: 4,
            jobId: 104,
            operationName: 'Packaging',
            resourceName: 'Packaging Line 1',
            status: 'completed',
            progress: 100,
            startDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
            endDate: new Date(Date.now() - 60 * 60 * 1000),
            actualStartDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
            operator: 'Mike Wilson'
          }
        ];
        setOperations(mockOps);
      }
      
      // Get equipment status
      const equipResult = await shopFloorModule.getEquipmentStatus(1);
      if (equipResult.success) {
        // Use mock equipment data for demo
        const mockEquipment: Equipment[] = [
          {
            id: 1,
            name: 'CNC Machine 1',
            type: 'CNC',
            status: 'running',
            utilization: 85,
            currentOperation: 'Part A Machining',
            nextMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            efficiency: 92
          },
          {
            id: 2,
            name: 'Assembly Line 2',
            type: 'Assembly',
            status: 'running',
            utilization: 70,
            currentOperation: 'Unit B Assembly',
            efficiency: 88
          },
          {
            id: 3,
            name: 'QC Station 1',
            type: 'Quality Control',
            status: 'idle',
            utilization: 45,
            efficiency: 95
          },
          {
            id: 4,
            name: 'Packaging Line 1',
            type: 'Packaging',
            status: 'maintenance',
            utilization: 0,
            nextMaintenance: new Date(),
            efficiency: 0
          },
          {
            id: 5,
            name: 'Welding Robot 1',
            type: 'Welding',
            status: 'running',
            utilization: 90,
            currentOperation: 'Frame Welding',
            efficiency: 94
          }
        ];
        setEquipment(mockEquipment);
      }
      
      // Get operator tasks
      const tasksResult = await shopFloorModule.getOperatorTasks(1);
      if (tasksResult.success) {
        // Use mock tasks for demo
        const mockTasks: OperatorTask[] = [
          {
            id: 1,
            operatorName: 'John Smith',
            taskName: 'Complete CNC Operation',
            status: 'in_progress',
            priority: 'high',
            dueTime: new Date(Date.now() + 60 * 60 * 1000)
          },
          {
            id: 2,
            operatorName: 'Sarah Johnson',
            taskName: 'Assembly Unit B',
            status: 'in_progress',
            priority: 'medium',
            dueTime: new Date(Date.now() + 2 * 60 * 60 * 1000)
          },
          {
            id: 3,
            operatorName: 'Mike Wilson',
            taskName: 'Prepare QC Station',
            status: 'assigned',
            priority: 'low',
            dueTime: new Date(Date.now() + 3 * 60 * 60 * 1000)
          }
        ];
        setOperatorTasks(mockTasks);
      }
      
      // Calculate metrics
      updateMetrics();
      
    } catch (error) {
      console.error('Error loading shop floor data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load shop floor data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToShopFloorEvents = async () => {
    try {
      const shopFloorModule = await getFederationModule('shop-floor');
      
      // Subscribe to operation status changes
      shopFloorModule.onOperationStatusChange((operation: any) => {
        toast({
          title: 'Operation Status Update',
          description: `Operation ${operation.operationName} is now ${operation.status}`,
        });
        loadShopFloorData(); // Reload data
      });
      
      // Subscribe to equipment alerts
      shopFloorModule.onEquipmentAlert((alert: any) => {
        toast({
          title: 'Equipment Alert',
          description: alert.message,
          variant: alert.severity === 'high' ? 'destructive' : 'default'
        });
      });
    } catch (error) {
      console.error('Error subscribing to shop floor events:', error);
    }
  };

  const updateMetrics = () => {
    const totalOps = operations.length;
    const completed = operations.filter(op => op.status === 'completed').length;
    const avgUtilization = equipment.reduce((sum, eq) => sum + eq.utilization, 0) / equipment.length;
    const avgEfficiency = equipment.filter(eq => eq.status === 'running')
      .reduce((sum, eq) => sum + eq.efficiency, 0) / equipment.filter(eq => eq.status === 'running').length;
    
    setMetrics({
      totalOperations: totalOps,
      completedToday: completed,
      avgCycleTime: 2.5, // hours (mock)
      overallEfficiency: avgEfficiency || 0,
      activeOperators: operatorTasks.filter(t => t.status === 'in_progress').length,
      equipmentUtilization: avgUtilization || 0
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'running': 'bg-green-100 text-green-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'idle': 'bg-yellow-100 text-yellow-800',
      'pending': 'bg-gray-100 text-gray-800',
      'maintenance': 'bg-orange-100 text-orange-800',
      'error': 'bg-red-100 text-red-800',
      'paused': 'bg-yellow-100 text-yellow-800',
      'offline': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'idle':
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'paused':
        return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-orange-500" />;
      case 'error':
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleOperationUpdate = async (operationId: number, status: string) => {
    try {
      const shopFloorModule = await getFederationModule('shop-floor');
      const result = await shopFloorModule.updateOperationStatus(operationId, status);
      
      if (result.success) {
        toast({
          title: 'Operation Updated',
          description: `Operation status changed to ${status}`,
        });
        loadShopFloorData();
      }
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update operation status',
        variant: 'destructive'
      });
    }
  };

  // Chart data
  const efficiencyData = equipment.map(eq => ({
    name: eq.name,
    efficiency: eq.efficiency,
    utilization: eq.utilization
  }));

  const statusDistribution = [
    { name: 'Running', value: equipment.filter(e => e.status === 'running').length, color: '#10b981' },
    { name: 'Idle', value: equipment.filter(e => e.status === 'idle').length, color: '#f59e0b' },
    { name: 'Maintenance', value: equipment.filter(e => e.status === 'maintenance').length, color: '#f97316' },
    { name: 'Error', value: equipment.filter(e => e.status === 'error').length, color: '#ef4444' }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading shop floor data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalOperations}</div>
            <p className="text-xs text-muted-foreground">Active today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.completedToday}</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Cycle Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgCycleTime}h</div>
            <p className="text-xs text-muted-foreground">Per operation</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overallEfficiency.toFixed(1)}%</div>
            <Progress value={metrics.overallEfficiency} className="mt-1 h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Operators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeOperators}</div>
            <p className="text-xs text-muted-foreground">On floor</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Equipment Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.equipmentUtilization.toFixed(1)}%</div>
            <Progress value={metrics.equipmentUtilization} className="mt-1 h-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="operators">Operators</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Current Operations</CardTitle>
                <Button size="sm" variant="outline" onClick={loadShopFloorData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {operations.map((operation) => (
                    <Card 
                      key={operation.id}
                      className={`cursor-pointer transition-all ${
                        selectedOperation?.id === operation.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedOperation(operation)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(operation.status)}
                              <h4 className="font-medium">{operation.operationName}</h4>
                            </div>
                            <Badge className={getStatusColor(operation.status)}>
                              {operation.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Job ID: {operation.jobId}</p>
                              <p>Resource: {operation.resourceName}</p>
                              {operation.operator && <p>Operator: {operation.operator}</p>}
                              <p>Start: {format(operation.startDate, 'HH:mm')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{operation.progress}%</div>
                            <Progress value={operation.progress} className="w-24 mt-2" />
                            <div className="mt-3 space-x-2">
                              {operation.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOperationUpdate(operation.id, 'in_progress');
                                  }}
                                >
                                  Start
                                </Button>
                              )}
                              {operation.status === 'in_progress' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOperationUpdate(operation.id, 'paused');
                                    }}
                                  >
                                    Pause
                                  </Button>
                                  <Button 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOperationUpdate(operation.id, 'completed');
                                    }}
                                  >
                                    Complete
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {equipment.map((eq) => (
                  <Card key={eq.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{eq.name}</h4>
                          <p className="text-sm text-muted-foreground">{eq.type}</p>
                        </div>
                        {getStatusIcon(eq.status)}
                      </div>
                      
                      <Badge className={`mb-3 ${getStatusColor(eq.status)}`}>
                        {eq.status.toUpperCase()}
                      </Badge>
                      
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Utilization</span>
                            <span>{eq.utilization}%</span>
                          </div>
                          <Progress value={eq.utilization} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Efficiency</span>
                            <span>{eq.efficiency}%</span>
                          </div>
                          <Progress value={eq.efficiency} className="h-2" />
                        </div>
                        
                        {eq.currentOperation && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground">Current Operation</p>
                            <p className="text-sm font-medium">{eq.currentOperation}</p>
                          </div>
                        )}
                        
                        {eq.nextMaintenance && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground">Next Maintenance</p>
                            <p className="text-sm font-medium">
                              {format(eq.nextMaintenance, 'MMM dd, yyyy')}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operators Tab */}
        <TabsContent value="operators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operator Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {operatorTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{task.operatorName}</p>
                        <p className="text-sm text-muted-foreground">{task.taskName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={task.priority === 'high' ? 'destructive' : 
                                task.priority === 'medium' ? 'default' : 'secondary'}
                      >
                        {task.priority}
                      </Badge>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Due: {format(task.dueTime, 'HH:mm')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={efficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="efficiency" fill="#10b981" name="Efficiency %" />
                    <Bar dataKey="utilization" fill="#3b82f6" name="Utilization %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Equipment Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Factory, 
  Package, 
  ArrowRight,
  Zap,
  Target,
  Users,
  BarChart3,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Wand2
} from 'lucide-react';
import { format, addDays, differenceInHours, parseISO } from 'date-fns';

interface PendingOrder {
  id: number;
  orderNumber: string;
  productName: string;
  quantity: number;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  requiredOperations: string[];
  estimatedDuration: number; // in hours
  customerName: string;
  orderValue: number;
  complexity: number; // 1-5 scale
}

interface SchedulingOption {
  id: string;
  startDate: string;
  endDate: string;
  impact: {
    delayedOrders: number;
    resourceUtilization: number;
    completionDate: string;
    costImpact: number;
  };
  feasibility: 'optimal' | 'acceptable' | 'challenging';
  resources: string[];
}

interface ResourceCapacity {
  resourceId: number;
  name: string;
  currentUtilization: number;
  availableHours: number;
  scheduledHours: number;
  department: string;
}

export default function OrderOptimization() {
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [optimizationMode, setOptimizationMode] = useState<'minimize_delay' | 'maximize_throughput' | 'balanced'>('balanced');
  const [schedulingHorizon, setSchedulingHorizon] = useState(30); // days
  const [showImpactAnalysis, setShowImpactAnalysis] = useState(false);
  const queryClient = useQueryClient();

  // Fetch pending orders
  const { data: pendingOrders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['/api/orders/pending']
  });

  // Fetch current operations for impact analysis
  const { data: currentOperations = [] } = useQuery({
    queryKey: ['/api/operations']
  });

  // Fetch resource capacity
  const { data: resources = [] } = useQuery({
    queryKey: ['/api/resources']
  });

  // Generate scheduling options mutation
  const generateOptionsMutation = useMutation({
    mutationFn: async (orderIds: number[]) => {
      return apiRequest(`/api/scheduling/optimize`, {
        method: 'POST',
        body: { 
          orderIds, 
          mode: optimizationMode,
          horizon: schedulingHorizon 
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/operations'] });
      toast({
        title: "Scheduling Options Generated",
        description: "Multiple scheduling scenarios have been analyzed"
      });
    }
  });

  // Apply scheduling mutation
  const applySchedulingMutation = useMutation({
    mutationFn: async (option: SchedulingOption) => {
      return apiRequest(`/api/scheduling/apply`, {
        method: 'POST',
        body: option
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/operations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/pending'] });
      setSelectedOrders([]);
      toast({
        title: "Schedule Applied",
        description: "Orders have been successfully scheduled"
      });
    }
  });

  // Mock scheduling options (replace with actual API data)
  const schedulingOptions: SchedulingOption[] = useMemo(() => {
    if (selectedOrders.length === 0) return [];
    
    return [
      {
        id: 'optimal',
        startDate: new Date().toISOString(),
        endDate: addDays(new Date(), 5).toISOString(),
        impact: {
          delayedOrders: 0,
          resourceUtilization: 85,
          completionDate: addDays(new Date(), 5).toISOString(),
          costImpact: 0
        },
        feasibility: 'optimal',
        resources: ['Brew Kettle 1', 'Fermenter A']
      },
      {
        id: 'fast',
        startDate: new Date().toISOString(),
        endDate: addDays(new Date(), 3).toISOString(),
        impact: {
          delayedOrders: 2,
          resourceUtilization: 95,
          completionDate: addDays(new Date(), 3).toISOString(),
          costImpact: 1500
        },
        feasibility: 'challenging',
        resources: ['Brew Kettle 1', 'Brew Kettle 2', 'Fermenter A']
      }
    ];
  }, [selectedOrders]);

  const handleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getFeasibilityColor = (feasibility: string) => {
    switch (feasibility) {
      case 'optimal': return 'text-green-600';
      case 'acceptable': return 'text-yellow-600';
      case 'challenging': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const selectedOrdersData = pendingOrders.filter((order: PendingOrder) => 
    selectedOrders.includes(order.id)
  );

  const totalQuantity = selectedOrdersData.reduce((sum: number, order: PendingOrder) => 
    sum + order.quantity, 0
  );

  const totalValue = selectedOrdersData.reduce((sum: number, order: PendingOrder) => 
    sum + order.orderValue, 0
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Order Optimization</h1>
            <p className="text-muted-foreground">
              Schedule pending orders with minimal impact on existing production
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1">
              <Factory className="w-4 h-4 mr-2" />
              {pendingOrders.length} Pending Orders
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Users className="w-4 h-4 mr-2" />
              {resources.length} Resources Available
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Order Selection */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Pending Orders
                </CardTitle>
                <CardDescription>
                  Select orders to schedule together for optimal resource utilization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="optimization-mode">Optimization Mode</Label>
                    <Select value={optimizationMode} onValueChange={(value: any) => setOptimizationMode(value)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimize_delay">Minimize Delays</SelectItem>
                        <SelectItem value="maximize_throughput">Maximize Throughput</SelectItem>
                        <SelectItem value="balanced">Balanced Approach</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor="horizon">Planning Horizon</Label>
                    <Select value={schedulingHorizon.toString()} onValueChange={(value) => setSchedulingHorizon(parseInt(value))}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">1 Week</SelectItem>
                        <SelectItem value="14">2 Weeks</SelectItem>
                        <SelectItem value="30">1 Month</SelectItem>
                        <SelectItem value="60">2 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="my-4" />

                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {loadingOrders ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Loading orders...
                      </div>
                    ) : pendingOrders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        No pending orders
                      </div>
                    ) : (
                      pendingOrders.map((order: PendingOrder) => (
                        <div
                          key={order.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedOrders.includes(order.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => handleOrderSelection(order.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{order.orderNumber}</h4>
                              <p className="text-sm text-muted-foreground">{order.productName}</p>
                            </div>
                            <Badge variant={getPriorityColor(order.priority)}>
                              {order.priority}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>Qty: {order.quantity}</div>
                            <div>Due: {format(parseISO(order.dueDate), 'MMM dd')}</div>
                            <div>Est: {order.estimatedDuration}h</div>
                            <div>${(order.orderValue / 1000).toFixed(1)}k</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {selectedOrders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Selection Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Orders:</span>
                      <span className="ml-2 font-medium">{selectedOrders.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Qty:</span>
                      <span className="ml-2 font-medium">{totalQuantity}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Total Value:</span>
                      <span className="ml-2 font-medium">${(totalValue / 1000).toFixed(1)}k</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => generateOptionsMutation.mutate(selectedOrders)}
                    disabled={generateOptionsMutation.isPending}
                    className="w-full"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    {generateOptionsMutation.isPending ? 'Analyzing...' : 'Generate Options'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Scheduling Options & Analysis */}
          <div className="lg:col-span-2 space-y-4">
            {selectedOrders.length === 0 ? (
              <Card className="h-96 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Select Orders to Optimize</h3>
                  <p>Choose one or more pending orders to see scheduling options and impact analysis</p>
                </div>
              </Card>
            ) : (
              <Tabs defaultValue="options" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="options">Scheduling Options</TabsTrigger>
                  <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
                  <TabsTrigger value="resources">Resource View</TabsTrigger>
                </TabsList>

                <TabsContent value="options" className="space-y-4">
                  {schedulingOptions.map((option) => (
                    <Card key={option.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              option.feasibility === 'optimal' ? 'bg-green-500' :
                              option.feasibility === 'acceptable' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            {option.id === 'optimal' ? 'Optimal Schedule' : 'Fast Track Schedule'}
                          </CardTitle>
                          <Badge variant="outline" className={getFeasibilityColor(option.feasibility)}>
                            {option.feasibility}
                          </Badge>
                        </div>
                        <CardDescription>
                          {format(parseISO(option.startDate), 'MMM dd, HH:mm')} - {format(parseISO(option.endDate), 'MMM dd, HH:mm')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="text-center p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{option.impact.delayedOrders}</div>
                            <div className="text-xs text-muted-foreground">Delayed Orders</div>
                          </div>
                          <div className="text-center p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{option.impact.resourceUtilization}%</div>
                            <div className="text-xs text-muted-foreground">Resource Util.</div>
                          </div>
                          <div className="text-center p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              {differenceInHours(parseISO(option.endDate), parseISO(option.startDate))}h
                            </div>
                            <div className="text-xs text-muted-foreground">Total Duration</div>
                          </div>
                          <div className="text-center p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">
                              ${(option.impact.costImpact / 1000).toFixed(1)}k
                            </div>
                            <div className="text-xs text-muted-foreground">Cost Impact</div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Required Resources</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {option.resources.map((resource) => (
                              <Badge key={resource} variant="secondary">
                                {resource}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => applySchedulingMutation.mutate(option)}
                            disabled={applySchedulingMutation.isPending}
                            className="flex-1"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Apply Schedule
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="impact" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Schedule Impact Analysis
                      </CardTitle>
                      <CardDescription>
                        Understand how scheduling these orders affects your current production plan
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Adding these orders may delay 2 existing orders by an average of 4 hours.
                          Consider resource optimization or priority adjustments.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-3">
                        <h4 className="font-medium">Affected Operations</h4>
                        {currentOperations.slice(0, 3).map((op: any) => (
                          <div key={op.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{op.name}</div>
                              <div className="text-sm text-muted-foreground">{op.description}</div>
                            </div>
                            <Badge variant="outline">+2h delay</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="resources" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Resource Capacity Analysis
                      </CardTitle>
                      <CardDescription>
                        Current resource utilization and availability for new orders
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {resources.slice(0, 5).map((resource: any) => (
                          <div key={resource.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{resource.name}</div>
                                <div className="text-sm text-muted-foreground">{resource.department || 'Production'}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">85%</div>
                                <div className="text-sm text-muted-foreground">utilized</div>
                              </div>
                            </div>
                            <Progress value={85} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
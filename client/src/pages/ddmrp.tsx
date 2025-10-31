import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Activity, AlertCircle, BarChart3, Package, TrendingUp, 
  Zap, Shield, Clock, Settings, RefreshCw, Info, Loader2
} from "lucide-react";

export default function DDMRP() {
  const [activeView, setActiveView] = useState("buffers");
  const { toast } = useToast();
  
  // Fetch DDMRP buffers
  const { data: buffers = [], isLoading: buffersLoading, error: buffersError } = useQuery({
    queryKey: ['/api/ddmrp/buffers']
  });
  
  // Fetch DDMRP metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/ddmrp/metrics']
  });
  
  // Fetch DDMRP alerts
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/ddmrp/alerts']
  });
  
  // Fetch supply orders
  const { data: supplyOrders = [] } = useQuery({
    queryKey: ['/api/ddmrp/supply-orders']
  });
  
  // Mutation for recalculating all buffers
  const recalculateAllMutation = useMutation({
    mutationFn: () => apiRequest('/api/ddmrp/buffers/recalculate-all', {
      method: 'POST'
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ddmrp/buffers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ddmrp/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ddmrp/alerts'] });
      toast({
        title: "Buffers Recalculated",
        description: data.message || "All buffers have been recalculated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Recalculation Failed",
        description: error.message || "Failed to recalculate buffers",
        variant: "destructive"
      });
    }
  });
  
  // Mutation for acknowledging alerts
  const acknowledgeAlertMutation = useMutation({
    mutationFn: (alertId: number) => apiRequest(`/api/ddmrp/alerts/${alertId}/acknowledge`, {
      method: 'POST'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ddmrp/alerts'] });
      toast({
        title: "Alert Acknowledged",
        description: "The alert has been acknowledged"
      });
    }
  });
  
  // Mutation for creating supply orders
  const createSupplyOrderMutation = useMutation({
    mutationFn: (orderData: any) => apiRequest('/api/ddmrp/supply-orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ddmrp/supply-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ddmrp/buffers'] });
      toast({
        title: "Order Created",
        description: "Supply order has been created successfully"
      });
    }
  });

  const getBufferColor = (status: string) => {
    switch(status) {
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-yellow-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getBufferTextColor = (status: string) => {
    switch(status) {
      case 'red': return 'text-red-600';
      case 'yellow': return 'text-yellow-600';
      case 'green': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" />
            Demand-Driven MRP (DDMRP)
          </h1>
          <p className="text-muted-foreground mt-1">
            Strategic inventory positioning and buffer management for improved flow
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button 
            onClick={() => recalculateAllMutation.mutate()}
            disabled={recalculateAllMutation.isPending}
          >
            {recalculateAllMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Recalculating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalculate Buffers
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              Buffer Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.bufferPerformance || 0}%</div>
                <p className="text-xs text-muted-foreground">Items in optimal zone</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Critical Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.criticalItems || 0}</div>
                <p className="text-xs text-muted-foreground">Require immediate action</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Flow Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.flowIndex || 0}</div>
                <p className="text-xs text-muted-foreground">Optimal flow indicator</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              Avg Lead Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.avgLeadTime || 0} days</div>
                <p className="text-xs text-muted-foreground">Average buffer lead time</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="buffers">Buffer Status</TabsTrigger>
          <TabsTrigger value="planning">Planning Priority</TabsTrigger>
          <TabsTrigger value="execution">Execution Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="buffers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Strategic Buffer Management</CardTitle>
              <CardDescription>
                Real-time buffer status and replenishment signals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {buffersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-40 w-full" />
                  ))}
                </div>
              ) : buffersError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load DDMRP buffers. Please try again.
                  </AlertDescription>
                </Alert>
              ) : buffers.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No DDMRP buffers configured yet. Use the Configure button to add buffers.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {buffers.map((buffer: any) => {
                    // Calculate zone percentages for visualization
                    const totalBuffer = (parseFloat(buffer.redZone || 0) + 
                                       parseFloat(buffer.yellowZone || 0) + 
                                       parseFloat(buffer.greenZone || 0)) || 1;
                    const redPercent = (parseFloat(buffer.redZone || 0) / totalBuffer) * 100;
                    const yellowPercent = (parseFloat(buffer.yellowZone || 0) / totalBuffer) * 100;
                    const greenPercent = (parseFloat(buffer.greenZone || 0) / totalBuffer) * 100;
                    
                    // Get supply orders for this buffer
                    const bufferSupplyOrders = supplyOrders.filter(
                      (order: any) => order.bufferId === buffer.id && order.status !== 'received'
                    );
                    const openSupply = bufferSupplyOrders.reduce(
                      (sum: number, order: any) => sum + parseFloat(order.orderQuantity || 0), 0
                    );
                    
                    return (
                      <div key={buffer.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">
                              {buffer.item?.itemName || buffer.itemName || `Item #${buffer.itemId}`}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {buffer.bufferType || 'Strategic'} • Lead Time: {buffer.leadTime} days
                            </p>
                          </div>
                          <Badge className={getBufferColor(buffer.bufferStatus || 'gray')}>
                            {(buffer.bufferStatus || 'unknown').toUpperCase()} ZONE
                          </Badge>
                        </div>
                        
                        {/* Buffer Visualization */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Current Stock: {parseFloat(buffer.currentStock || 0).toFixed(0)}</span>
                            <span className={getBufferTextColor(buffer.bufferStatus || 'gray')}>
                              {parseFloat(buffer.bufferPercentage || 0).toFixed(0)}% of buffer
                            </span>
                          </div>
                          
                          <div className="relative h-8 bg-gray-200 rounded overflow-hidden">
                            {/* Red Zone */}
                            <div 
                              className="absolute left-0 h-full bg-red-200"
                              style={{ width: `${redPercent}%` }}
                            />
                            {/* Yellow Zone */}
                            <div 
                              className="absolute h-full bg-yellow-200"
                              style={{ left: `${redPercent}%`, width: `${yellowPercent}%` }}
                            />
                            {/* Green Zone */}
                            <div 
                              className="absolute h-full bg-green-200"
                              style={{ left: `${redPercent + yellowPercent}%`, width: `${greenPercent}%` }}
                            />
                            {/* Current Stock Indicator */}
                            <div 
                              className="absolute top-0 h-full w-1 bg-black"
                              style={{ 
                                left: `${Math.min(100, Math.max(0, parseFloat(buffer.bufferPercentage || 0)))}%` 
                              }}
                            />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <span className="text-red-600">
                                Red: {parseFloat(buffer.redZone || 0).toFixed(0)}
                              </span>
                            </div>
                            <div className="text-center">
                              <span className="text-yellow-600">
                                Yellow: {parseFloat(buffer.yellowZone || 0).toFixed(0)}
                              </span>
                            </div>
                            <div className="text-center">
                              <span className="text-green-600">
                                Green: {parseFloat(buffer.greenZone || 0).toFixed(0)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between mt-3 pt-3 border-t text-sm">
                          <span>Orders: {bufferSupplyOrders.length}</span>
                          <span>Open Supply: {openSupply.toFixed(0)}</span>
                          <span>
                            Avg Daily Usage: {parseFloat(buffer.averageDailyUsage || 0).toFixed(1)}
                          </span>
                          <span>
                            Variability: {parseFloat(buffer.variabilityFactor || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Planning Priority View</CardTitle>
              <CardDescription>
                Prioritized list of items requiring replenishment planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              {buffersLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  {buffers.filter((b: any) => b.bufferStatus === 'red' || b.bufferStatus === 'yellow').length > 0 && (
                    <Alert className="mb-4">
                      <Zap className="h-4 w-4" />
                      <AlertDescription>
                        {buffers.filter((b: any) => b.bufferStatus === 'red' || b.bufferStatus === 'yellow').length} items 
                        require planning attention based on buffer penetration
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-3">
                    {/* Red zone buffers first */}
                    {buffers.filter((b: any) => b.bufferStatus === 'red').map((buffer: any) => (
                      <div key={buffer.id} className="border-l-4 border-red-500 pl-4 py-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-semibold">
                              {buffer.item?.itemName || buffer.itemName || `Item #${buffer.itemId}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Red zone penetration - Generate order immediately
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Current Stock: {parseFloat(buffer.currentStock || 0).toFixed(0)} | 
                              Red Zone: {parseFloat(buffer.redZone || 0).toFixed(0)}
                            </p>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => {
                              const orderQty = parseFloat(buffer.topOfGreen || buffer.greenZone || 0);
                              createSupplyOrderMutation.mutate({
                                bufferId: buffer.id,
                                orderQuantity: orderQty.toString(),
                                orderDate: new Date().toISOString(),
                                dueDate: new Date(Date.now() + buffer.leadTime * 24 * 60 * 60 * 1000).toISOString(),
                                status: 'planned'
                              });
                            }}
                            disabled={createSupplyOrderMutation.isPending}
                          >
                            {createSupplyOrderMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Create Order'
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Yellow zone buffers */}
                    {buffers.filter((b: any) => b.bufferStatus === 'yellow').map((buffer: any) => (
                      <div key={buffer.id} className="border-l-4 border-yellow-500 pl-4 py-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-semibold">
                              {buffer.item?.itemName || buffer.itemName || `Item #${buffer.itemId}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Yellow zone - Monitor closely, prepare for order
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Current Stock: {parseFloat(buffer.currentStock || 0).toFixed(0)} | 
                              Yellow Zone: {parseFloat(buffer.yellowZone || 0).toFixed(0)}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">Review</Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show message if all buffers are green */}
                    {buffers.filter((b: any) => b.bufferStatus === 'red' || b.bufferStatus === 'yellow').length === 0 && (
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          All buffers are in the green zone. No immediate planning actions required.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution Alerts</CardTitle>
              <CardDescription>
                Real-time alerts for supply and demand variations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : alerts.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No active alerts. All buffers are operating within normal parameters.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert: any) => (
                    <Alert key={alert.id}>
                      {alert.severity === 'critical' ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <Info className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <strong>{alert.alertType?.replace('_', ' ').toUpperCase()}:</strong> {alert.message}
                            {alert.details && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {typeof alert.details === 'object' ? (
                                  Object.entries(alert.details).map(([key, value]) => (
                                    <span key={key} className="mr-3">
                                      {key}: {String(value)}
                                    </span>
                                  ))
                                ) : (
                                  String(alert.details)
                                )}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground mt-1">
                              Created: {new Date(alert.createdAt).toLocaleString()}
                            </div>
                          </div>
                          {!alert.acknowledgedAt && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                              disabled={acknowledgeAlertMutation.isPending}
                            >
                              {acknowledgeAlertMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Acknowledge'
                              )}
                            </Button>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>DDMRP Performance Analytics</CardTitle>
              <CardDescription>
                Key metrics and trends for buffer management optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="grid grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i}>
                      <Skeleton className="h-4 w-24 mb-3" />
                      <Skeleton className="h-2 w-full mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Buffer Reliability</h3>
                    <Progress value={metrics?.bufferPerformance || 0} className="mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {metrics?.bufferPerformance || 0}% of buffers maintained optimal levels
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Stockout Prevention</h3>
                    <Progress value={metrics?.stockoutPrevention || 0} className="mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {metrics?.stockoutPrevention || 0}% stockout prevention rate with DDMRP
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Inventory Reduction</h3>
                    <Progress value={metrics?.inventoryReduction || 0} className="mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {metrics?.inventoryReduction || 0}% average inventory reduction achieved
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Lead Time Compression</h3>
                    <Progress value={metrics?.leadTimeCompression || 0} className="mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {metrics?.leadTimeCompression || 0}% reduction in cumulative lead time
                    </p>
                  </div>
                </div>
              )}
              
              {metrics && (
                <div className="mt-6 pt-6 border-t grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-sm font-semibold text-green-600">Green Buffers</div>
                    <div className="text-2xl font-bold">{metrics.greenBuffers || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-yellow-600">Yellow Buffers</div>
                    <div className="text-2xl font-bold">{metrics.yellowBuffers || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-red-600">Red Buffers</div>
                    <div className="text-2xl font-bold">{metrics.redBuffers || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-blue-600">Active Alerts</div>
                    <div className="text-2xl font-bold">{metrics.activeAlerts || 0}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
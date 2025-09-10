import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Box,
  ShoppingCart,
  RefreshCw,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  Clock,
  Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFederationModule } from '@/lib/federation-bootstrap';
import { format } from 'date-fns';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface InventoryItem {
  id: number;
  itemCode: string;
  itemName: string;
  category: string;
  quantityOnHand: number;
  quantityAllocated: number;
  quantityAvailable: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  location: string;
  lastUpdated: Date;
  status: 'normal' | 'low' | 'critical' | 'overstocked';
}

interface ReorderRecommendation {
  itemId: number;
  itemName: string;
  currentStock: number;
  recommendedQuantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedLeadTime: number;
  supplier: string;
  cost: number;
}

interface InventoryTransaction {
  id: number;
  itemId: number;
  itemName: string;
  type: 'receipt' | 'issue' | 'adjustment' | 'transfer';
  quantity: number;
  reference: string;
  date: Date;
  user: string;
}

interface DemandForecast {
  itemId: number;
  itemName: string;
  period: string;
  forecastQuantity: number;
  actualQuantity?: number;
  accuracy?: number;
}

export default function InventoryWidget() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [reorderRecommendations, setReorderRecommendations] = useState<ReorderRecommendation[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');

  // Inventory KPIs
  const [kpis, setKpis] = useState({
    totalValue: 0,
    turnoverRate: 0,
    stockoutRisk: 0,
    excessInventory: 0,
    averageLeadTime: 0,
    fillRate: 0
  });

  useEffect(() => {
    loadInventoryData();
    
    // Set up real-time updates
    const interval = setInterval(loadInventoryData, 20000); // Update every 20 seconds
    
    // Subscribe to inventory events
    subscribeToInventoryEvents();
    
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const inventoryModule = await getFederationModule('inventory-planning');
      
      // Get inventory items
      const itemsResult = await inventoryModule.getInventoryItems(1); // Plant ID 1
      
      if (itemsResult.success) {
        // Use mock data for demo
        const mockItems: InventoryItem[] = [
          {
            id: 1,
            itemCode: 'RAW-001',
            itemName: 'Steel Plate 10mm',
            category: 'Raw Materials',
            quantityOnHand: 500,
            quantityAllocated: 200,
            quantityAvailable: 300,
            reorderPoint: 250,
            reorderQuantity: 1000,
            unitCost: 45.50,
            location: 'Warehouse A-1',
            lastUpdated: new Date(),
            status: 'normal'
          },
          {
            id: 2,
            itemCode: 'RAW-002',
            itemName: 'Aluminum Sheet 5mm',
            category: 'Raw Materials',
            quantityOnHand: 150,
            quantityAllocated: 100,
            quantityAvailable: 50,
            reorderPoint: 200,
            reorderQuantity: 500,
            unitCost: 68.25,
            location: 'Warehouse A-2',
            lastUpdated: new Date(),
            status: 'low'
          },
          {
            id: 3,
            itemCode: 'COMP-001',
            itemName: 'Bearing Assembly',
            category: 'Components',
            quantityOnHand: 75,
            quantityAllocated: 70,
            quantityAvailable: 5,
            reorderPoint: 100,
            reorderQuantity: 200,
            unitCost: 125.00,
            location: 'Warehouse B-1',
            lastUpdated: new Date(),
            status: 'critical'
          },
          {
            id: 4,
            itemCode: 'FIN-001',
            itemName: 'Product Assembly X',
            category: 'Finished Goods',
            quantityOnHand: 250,
            quantityAllocated: 50,
            quantityAvailable: 200,
            reorderPoint: 50,
            reorderQuantity: 100,
            unitCost: 450.00,
            location: 'Warehouse C-1',
            lastUpdated: new Date(),
            status: 'overstocked'
          },
          {
            id: 5,
            itemCode: 'TOOL-001',
            itemName: 'Cutting Tool Set',
            category: 'Tools',
            quantityOnHand: 30,
            quantityAllocated: 10,
            quantityAvailable: 20,
            reorderPoint: 15,
            reorderQuantity: 50,
            unitCost: 85.00,
            location: 'Tool Crib',
            lastUpdated: new Date(),
            status: 'normal'
          }
        ];
        setInventoryItems(mockItems);
      }
      
      // Get reorder recommendations
      const reorderResult = await inventoryModule.getReorderRecommendations();
      if (reorderResult.success) {
        const mockRecommendations: ReorderRecommendation[] = [
          {
            itemId: 2,
            itemName: 'Aluminum Sheet 5mm',
            currentStock: 150,
            recommendedQuantity: 500,
            urgency: 'high',
            estimatedLeadTime: 7,
            supplier: 'Metal Suppliers Inc.',
            cost: 34125.00
          },
          {
            itemId: 3,
            itemName: 'Bearing Assembly',
            currentStock: 75,
            recommendedQuantity: 200,
            urgency: 'critical',
            estimatedLeadTime: 3,
            supplier: 'Precision Parts Co.',
            cost: 25000.00
          },
          {
            itemId: 1,
            itemName: 'Steel Plate 10mm',
            currentStock: 500,
            recommendedQuantity: 1000,
            urgency: 'medium',
            estimatedLeadTime: 10,
            supplier: 'Steel Works Ltd.',
            cost: 45500.00
          }
        ];
        setReorderRecommendations(mockRecommendations);
      }
      
      // Get recent transactions
      const transResult = await inventoryModule.getInventoryTransactions({ limit: 10 });
      if (transResult.success) {
        const mockTransactions: InventoryTransaction[] = [
          {
            id: 1,
            itemId: 1,
            itemName: 'Steel Plate 10mm',
            type: 'issue',
            quantity: -50,
            reference: 'JOB-101',
            date: new Date(),
            user: 'John Smith'
          },
          {
            id: 2,
            itemId: 2,
            itemName: 'Aluminum Sheet 5mm',
            type: 'receipt',
            quantity: 200,
            reference: 'PO-2024-123',
            date: new Date(Date.now() - 2 * 60 * 60 * 1000),
            user: 'Sarah Johnson'
          },
          {
            id: 3,
            itemId: 3,
            itemName: 'Bearing Assembly',
            type: 'issue',
            quantity: -25,
            reference: 'JOB-102',
            date: new Date(Date.now() - 4 * 60 * 60 * 1000),
            user: 'Mike Wilson'
          },
          {
            id: 4,
            itemId: 4,
            itemName: 'Product Assembly X',
            type: 'adjustment',
            quantity: 5,
            reference: 'ADJ-001',
            date: new Date(Date.now() - 6 * 60 * 60 * 1000),
            user: 'System'
          }
        ];
        setTransactions(mockTransactions);
      }
      
      // Get demand forecast
      const forecastResult = await inventoryModule.getDemandForecast();
      if (forecastResult.success) {
        const mockForecasts: DemandForecast[] = [
          { itemId: 1, itemName: 'Steel Plate', period: 'Week 1', forecastQuantity: 250, actualQuantity: 240, accuracy: 96 },
          { itemId: 1, itemName: 'Steel Plate', period: 'Week 2', forecastQuantity: 280, actualQuantity: 275, accuracy: 98 },
          { itemId: 1, itemName: 'Steel Plate', period: 'Week 3', forecastQuantity: 300, actualQuantity: 310, accuracy: 97 },
          { itemId: 1, itemName: 'Steel Plate', period: 'Week 4', forecastQuantity: 320 },
          { itemId: 1, itemName: 'Steel Plate', period: 'Week 5', forecastQuantity: 350 },
          { itemId: 1, itemName: 'Steel Plate', period: 'Week 6', forecastQuantity: 330 }
        ];
        setForecasts(mockForecasts);
      }
      
      // Update KPIs
      updateKPIs();
      
    } catch (error) {
      console.error('Error loading inventory data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToInventoryEvents = async () => {
    try {
      const inventoryModule = await getFederationModule('inventory-planning');
      
      // Subscribe to stock level changes
      inventoryModule.onStockLevelChange((item: any) => {
        toast({
          title: 'Stock Level Update',
          description: `${item.itemName} stock level changed to ${item.quantity}`,
        });
        loadInventoryData();
      });
      
      // Subscribe to reorder alerts
      inventoryModule.onReorderAlert((alert: any) => {
        toast({
          title: 'Reorder Alert',
          description: alert.message,
          variant: alert.urgency === 'critical' ? 'destructive' : 'default'
        });
      });
    } catch (error) {
      console.error('Error subscribing to inventory events:', error);
    }
  };

  const updateKPIs = () => {
    const totalValue = inventoryItems.reduce((sum, item) => sum + (item.quantityOnHand * item.unitCost), 0);
    const lowStockItems = inventoryItems.filter(item => item.status === 'low' || item.status === 'critical').length;
    const overstockedItems = inventoryItems.filter(item => item.status === 'overstocked').length;
    const avgLeadTime = reorderRecommendations.reduce((sum, r) => sum + r.estimatedLeadTime, 0) / 
                        (reorderRecommendations.length || 1);
    
    setKpis({
      totalValue,
      turnoverRate: 12.5, // Mock value
      stockoutRisk: (lowStockItems / inventoryItems.length) * 100,
      excessInventory: (overstockedItems / inventoryItems.length) * 100,
      averageLeadTime: avgLeadTime,
      fillRate: 94.5 // Mock value
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'normal': 'bg-green-100 text-green-800',
      'low': 'bg-yellow-100 text-yellow-800',
      'critical': 'bg-red-100 text-red-800',
      'overstocked': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      'low': 'text-blue-600',
      'medium': 'text-yellow-600',
      'high': 'text-orange-600',
      'critical': 'text-red-600'
    };
    return colors[urgency] || 'text-gray-600';
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'receipt':
        return <ArrowDownRight className="h-4 w-4 text-green-500" />;
      case 'issue':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'adjustment':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'transfer':
        return <Truck className="h-4 w-4 text-purple-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleUpdateInventory = async (itemId: number, quantity: number, reason: string) => {
    try {
      const inventoryModule = await getFederationModule('inventory-planning');
      const result = await inventoryModule.updateInventoryLevel(itemId, quantity, reason);
      
      if (result.success) {
        toast({
          title: 'Inventory Updated',
          description: `Inventory level updated successfully`,
        });
        loadInventoryData();
      }
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update inventory level',
        variant: 'destructive'
      });
    }
  };

  // Chart data
  const inventoryTrendData = forecasts.map(f => ({
    period: f.period,
    forecast: f.forecastQuantity,
    actual: f.actualQuantity
  }));

  const categoryDistribution = [
    { name: 'Raw Materials', value: inventoryItems.filter(i => i.category === 'Raw Materials').length * 100, fill: '#10b981' },
    { name: 'Components', value: inventoryItems.filter(i => i.category === 'Components').length * 80, fill: '#3b82f6' },
    { name: 'Finished Goods', value: inventoryItems.filter(i => i.category === 'Finished Goods').length * 60, fill: '#f59e0b' },
    { name: 'Tools', value: inventoryItems.filter(i => i.category === 'Tools').length * 40, fill: '#8b5cf6' }
  ];

  const stockStatusData = [
    { status: 'Normal', count: inventoryItems.filter(i => i.status === 'normal').length },
    { status: 'Low', count: inventoryItems.filter(i => i.status === 'low').length },
    { status: 'Critical', count: inventoryItems.filter(i => i.status === 'critical').length },
    { status: 'Overstocked', count: inventoryItems.filter(i => i.status === 'overstocked').length }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading inventory data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(kpis.totalValue / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">Inventory value</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Turnover Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.turnoverRate.toFixed(1)}x</div>
            <p className="text-xs text-muted-foreground">Annual</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stockout Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{kpis.stockoutRisk.toFixed(0)}%</div>
            <Progress value={100 - kpis.stockoutRisk} className="mt-1 h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Excess Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.excessInventory.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Overstocked</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Lead Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.averageLeadTime.toFixed(1)}d</div>
            <p className="text-xs text-muted-foreground">Days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fill Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kpis.fillRate}%</div>
            <Progress value={kpis.fillRate} className="mt-1 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {reorderRecommendations.filter(r => r.urgency === 'critical').length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Critical Inventory Alert</AlertTitle>
          <AlertDescription>
            {reorderRecommendations.filter(r => r.urgency === 'critical').length} items require immediate reordering to prevent stockouts.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="reorders">Reorders</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Current Inventory</CardTitle>
                <Button size="sm" variant="outline" onClick={loadInventoryData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {inventoryItems.map((item) => (
                    <Card 
                      key={item.id}
                      className={`cursor-pointer transition-all ${
                        selectedItem?.id === item.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Box className="h-4 w-4 text-blue-500" />
                              <h4 className="font-medium">{item.itemName}</h4>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline">{item.itemCode}</Badge>
                              <Badge className={getStatusColor(item.status)}>
                                {item.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Category: {item.category}</p>
                              <p>Location: {item.location}</p>
                              <p>Unit Cost: ${item.unitCost.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div>
                              <div className="text-2xl font-bold">{item.quantityOnHand}</div>
                              <p className="text-sm text-muted-foreground">On Hand</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-medium">{item.quantityAllocated}</p>
                                <p className="text-xs text-muted-foreground">Allocated</p>
                              </div>
                              <div>
                                <p className="font-medium text-green-600">{item.quantityAvailable}</p>
                                <p className="text-xs text-muted-foreground">Available</p>
                              </div>
                            </div>
                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground">Reorder Point</p>
                              <Progress 
                                value={(item.quantityOnHand / item.reorderPoint) * 100} 
                                className="h-2 mt-1"
                              />
                              <p className="text-xs mt-1">{item.reorderPoint} units</p>
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

        {/* Reorders Tab */}
        <TabsContent value="reorders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reorder Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reorderRecommendations.map((rec) => (
                  <div 
                    key={rec.itemId}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className={`h-4 w-4 ${getUrgencyColor(rec.urgency)}`} />
                        <h4 className="font-medium">{rec.itemName}</h4>
                        <Badge 
                          variant={rec.urgency === 'critical' ? 'destructive' : 
                                  rec.urgency === 'high' ? 'default' : 'secondary'}
                        >
                          {rec.urgency.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Current Stock: {rec.currentStock} units</p>
                        <p>Supplier: {rec.supplier}</p>
                        <p>Lead Time: {rec.estimatedLeadTime} days</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{rec.recommendedQuantity} units</div>
                      <p className="text-sm text-muted-foreground">
                        ${(rec.cost / 1000).toFixed(1)}K
                      </p>
                      <Button size="sm" className="mt-2">
                        Create PO
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((trans) => (
                  <div 
                    key={trans.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(trans.type)}
                      <div>
                        <p className="font-medium">{trans.itemName}</p>
                        <p className="text-sm text-muted-foreground">
                          {trans.type.charAt(0).toUpperCase() + trans.type.slice(1)} • {trans.reference}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${trans.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trans.quantity > 0 ? '+' : ''}{trans.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(trans.date, 'MMM dd, HH:mm')}
                      </p>
                      <p className="text-xs text-muted-foreground">{trans.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demand Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={inventoryTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="forecast" stroke="#3b82f6" name="Forecast" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="actual" stroke="#10b981" name="Actual" />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="mt-4 grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Forecast Accuracy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">96.8%</div>
                    <p className="text-xs text-muted-foreground">Last 3 months</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <span className="text-lg font-medium">+12%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Expected growth</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Safety Stock</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">15%</div>
                    <p className="text-xs text-muted-foreground">Recommended buffer</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Stock Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stockStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Inventory Value Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={[
                  { month: 'Jan', value: 185000 },
                  { month: 'Feb', value: 192000 },
                  { month: 'Mar', value: 188000 },
                  { month: 'Apr', value: 195000 },
                  { month: 'May', value: 201000 },
                  { month: 'Jun', value: 198000 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `$${(value / 1000).toFixed(0)}K`} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
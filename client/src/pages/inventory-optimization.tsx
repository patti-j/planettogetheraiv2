import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Package, TrendingUp, TrendingDown, BarChart3, DollarSign, Zap, Brain,
  Plus, Calendar, Eye, AlertCircle, CheckCircle, Clock, RefreshCw,
  ArrowUp, ArrowDown, Activity, Target, Settings
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ComposedChart, Area } from "recharts";

interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  location: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  unitCost: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'excess-stock';
  createdAt: string;
}

interface InventoryBalance {
  id: number;
  itemId: number;
  itemName?: string;
  itemSku?: string;
  location: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lastUpdated: string;
}

interface OptimizationRecommendation {
  id: number;
  scenarioId: number;
  itemId: number;
  itemName?: string;
  itemSku?: string;
  recommendationType: 'reorder' | 'reduce' | 'transfer' | 'dispose';
  currentQuantity: number;
  recommendedQuantity: number;
  priority: 'high' | 'medium' | 'low';
  potentialSavings: number;
  reason: string;
  createdAt: string;
}

interface OptimizationScenario {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalItems: number;
  totalRecommendations: number;
  potentialSavings: number;
  createdAt: string;
}

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'];

const STATUS_COLORS = {
  'in-stock': 'bg-green-100 text-green-800',
  'low-stock': 'bg-yellow-100 text-yellow-800',
  'out-of-stock': 'bg-red-100 text-red-800',
  'excess-stock': 'bg-purple-100 text-purple-800'
};

const PRIORITY_COLORS = {
  'high': 'bg-red-100 text-red-800',
  'medium': 'bg-yellow-100 text-yellow-800',
  'low': 'bg-green-100 text-green-800'
};

const RECOMMENDATION_COLORS = {
  'reorder': 'bg-blue-100 text-blue-800',
  'reduce': 'bg-orange-100 text-orange-800',
  'transfer': 'bg-purple-100 text-purple-800',
  'dispose': 'bg-red-100 text-red-800'
};

export default function InventoryOptimizationPage() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [newScenarioDialog, setNewScenarioDialog] = useState(false);
  const [scenarioForm, setScenarioForm] = useState({
    name: "",
    description: "",
    includeCategories: [] as string[],
    optimizationGoal: "cost-reduction"
  });
  const { toast } = useToast();

  // Data queries
  const { data: inventoryItems = [], isLoading: itemsLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory/items"],
  });

  const { data: inventoryBalances = [], isLoading: balancesLoading } = useQuery<InventoryBalance[]>({
    queryKey: ["/api/inventory/balances"],
  });

  const { data: optimizationScenarios = [], isLoading: scenariosLoading } = useQuery<OptimizationScenario[]>({
    queryKey: ["/api/inventory/optimization-scenarios"],
  });

  const { data: recommendations = [], isLoading: recommendationsLoading } = useQuery<OptimizationRecommendation[]>({
    queryKey: ["/api/inventory/recommendations"],
  });

  // Mutations
  const createScenarioMutation = useMutation({
    mutationFn: async (data: typeof scenarioForm) => {
      return apiRequest(`/api/inventory/optimization-scenarios`, {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/optimization-scenarios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/recommendations"] });
      setNewScenarioDialog(false);
      setScenarioForm({ name: "", description: "", includeCategories: [], optimizationGoal: "cost-reduction" });
      toast({ title: "Success", description: "Optimization scenario created successfully" });
    }
  });

  const runOptimizationMutation = useMutation({
    mutationFn: async (scenarioId: number) => {
      return apiRequest(`/api/inventory/optimization-scenarios/${scenarioId}/run`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/optimization-scenarios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/recommendations"] });
      toast({ title: "Success", description: "Optimization analysis started" });
    }
  });

  // Calculate inventory metrics
  const inventoryMetrics = {
    totalItems: inventoryItems.length,
    totalValue: inventoryItems.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0),
    lowStockItems: inventoryItems.filter(item => item.status === 'low-stock' || item.status === 'out-of-stock').length,
    excessStockItems: inventoryItems.filter(item => item.status === 'excess-stock').length,
    totalRecommendations: recommendations.length,
    potentialSavings: recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0)
  };

  // Stock status distribution
  const stockStatusData = [
    { name: 'In Stock', value: inventoryItems.filter(item => item.status === 'in-stock').length, color: '#10b981' },
    { name: 'Low Stock', value: inventoryItems.filter(item => item.status === 'low-stock').length, color: '#f59e0b' },
    { name: 'Out of Stock', value: inventoryItems.filter(item => item.status === 'out-of-stock').length, color: '#ef4444' },
    { name: 'Excess Stock', value: inventoryItems.filter(item => item.status === 'excess-stock').length, color: '#8b5cf6' }
  ];

  // Category breakdown
  const categoryData = inventoryItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.currentStock * item.unitCost;
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.entries(categoryData).map(([category, value]) => ({
    category,
    value: Math.round(value)
  }));

  // Recommendations by type
  const recommendationTypeData = [
    { type: 'Reorder', count: recommendations.filter(r => r.recommendationType === 'reorder').length, color: '#3b82f6' },
    { type: 'Reduce', count: recommendations.filter(r => r.recommendationType === 'reduce').length, color: '#f97316' },
    { type: 'Transfer', count: recommendations.filter(r => r.recommendationType === 'transfer').length, color: '#8b5cf6' },
    { type: 'Dispose', count: recommendations.filter(r => r.recommendationType === 'dispose').length, color: '#ef4444' }
  ];

  const getStockLevelColor = (item: InventoryItem) => {
    const stockRatio = item.currentStock / item.maxStockLevel;
    if (stockRatio < 0.2) return 'text-red-600';
    if (stockRatio < 0.5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStockLevelPercentage = (item: InventoryItem) => {
    return Math.min(100, (item.currentStock / item.maxStockLevel) * 100);
  };

  if (itemsLoading || balancesLoading || scenariosLoading || recommendationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory optimization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="md:ml-0 ml-12">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800">Inventory Optimization</h1>
            <p className="text-sm md:text-base text-gray-600">AI-powered inventory management and cost optimization</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Dialog open={newScenarioDialog} onOpenChange={setNewScenarioDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  New Scenario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Optimization Scenario</DialogTitle>
                  <DialogDescription>
                    Configure a new inventory optimization analysis
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="scenario-name">Scenario Name</Label>
                    <Input
                      id="scenario-name"
                      placeholder="e.g. Q1 Cost Reduction"
                      value={scenarioForm.name}
                      onChange={(e) => setScenarioForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="scenario-description">Description</Label>
                    <Input
                      id="scenario-description"
                      placeholder="Brief description of optimization goals"
                      value={scenarioForm.description}
                      onChange={(e) => setScenarioForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="optimization-goal">Optimization Goal</Label>
                    <Select value={scenarioForm.optimizationGoal} onValueChange={(value) => 
                      setScenarioForm(prev => ({ ...prev, optimizationGoal: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cost-reduction">Cost Reduction</SelectItem>
                        <SelectItem value="service-level">Service Level Optimization</SelectItem>
                        <SelectItem value="space-utilization">Space Utilization</SelectItem>
                        <SelectItem value="balanced">Balanced Approach</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setNewScenarioDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => createScenarioMutation.mutate(scenarioForm)}
                      disabled={createScenarioMutation.isPending || !scenarioForm.name}
                    >
                      {createScenarioMutation.isPending ? "Creating..." : "Create Scenario"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button className="bg-primary hover:bg-blue-700 text-white"
                    onClick={() => optimizationScenarios.length > 0 && 
                      runOptimizationMutation.mutate(optimizationScenarios[0].id)}
                    disabled={runOptimizationMutation.isPending || optimizationScenarios.length === 0}>
              {runOptimizationMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Optimizing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Run Optimization
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-semibold">{inventoryMetrics.totalItems.toLocaleString()}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-semibold">${inventoryMetrics.totalValue.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Action Needed</p>
                  <p className="text-2xl font-semibold text-red-600">
                    {inventoryMetrics.lowStockItems + inventoryMetrics.excessStockItems}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Potential Savings</p>
                  <p className="text-2xl font-semibold text-green-600">${inventoryMetrics.potentialSavings.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stock Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Stock Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stockStatusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {stockStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Value Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Inventory Value by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Value']} />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Optimization Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {recommendationTypeData.map((item) => (
                    <div key={item.type} className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-semibold" style={{ color: item.color }}>
                        {item.count}
                      </div>
                      <div className="text-sm text-gray-600">{item.type}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Items</CardTitle>
                <CardDescription>{inventoryItems.length} items across all locations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Stock Level</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                            </div>
                          </TableCell>
                          <TableCell>{item.location}</TableCell>
                          <TableCell className="font-medium">{item.currentStock.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Progress value={getStockLevelPercentage(item)} className="w-20" />
                              <span className={`text-sm ${getStockLevelColor(item)}`}>
                                {getStockLevelPercentage(item).toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>${item.unitCost.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[item.status]}>
                              {item.status.replace('-', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedItem(item)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {recommendations.map((recommendation) => (
                <Card key={recommendation.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{recommendation.itemName || recommendation.itemSku}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={RECOMMENDATION_COLORS[recommendation.recommendationType]}>
                          {recommendation.recommendationType}
                        </Badge>
                        <Badge className={PRIORITY_COLORS[recommendation.priority]}>
                          {recommendation.priority}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{recommendation.reason}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Current Quantity:</span>
                        <span className="font-medium">{recommendation.currentQuantity.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Recommended:</span>
                        <span className="font-medium">{recommendation.recommendedQuantity.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Potential Savings:</span>
                        <span className="font-medium text-green-600">
                          ${recommendation.potentialSavings.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Created:</span>
                        <span className="text-gray-600">
                          {new Date(recommendation.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {optimizationScenarios.map((scenario) => (
                <Card key={scenario.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{scenario.name}</CardTitle>
                      <Badge className={
                        scenario.status === 'completed' ? 'bg-green-100 text-green-800' :
                        scenario.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        scenario.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {scenario.status}
                      </Badge>
                    </div>
                    <CardDescription>{scenario.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Total Items:</span>
                        <span className="font-medium">{scenario.totalItems.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Recommendations:</span>
                        <span className="font-medium">{scenario.totalRecommendations.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Potential Savings:</span>
                        <span className="font-medium text-green-600">
                          ${scenario.potentialSavings.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Created:</span>
                        <span className="text-gray-600">
                          {new Date(scenario.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => runOptimizationMutation.mutate(scenario.id)}
                          disabled={runOptimizationMutation.isPending || scenario.status === 'running'}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Run
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
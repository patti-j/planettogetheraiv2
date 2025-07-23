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
  TrendingUp, TrendingDown, BarChart3, Activity, Brain, Target,
  Plus, Calendar, Eye, AlertCircle, CheckCircle, Clock,
  ArrowUp, ArrowDown, Zap
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAITheme } from "@/hooks/use-ai-theme";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, Area, AreaChart } from "recharts";

interface DemandForecast {
  id: number;
  itemId: number;
  itemSku?: string;
  itemName?: string;
  forecastDate: string;
  forecastedDemand: number;
  actualDemand?: number;
  confidenceLevel: number;
  modelType: 'linear' | 'seasonal' | 'exponential' | 'arima' | 'ml';
  createdAt: string;
  accuracy?: number;
}

interface DemandDriver {
  id: number;
  name: string;
  type: 'seasonal' | 'promotional' | 'economic' | 'weather' | 'event';
  impact: number;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface DemandHistory {
  id: number;
  itemId: number;
  date: string;
  actualDemand: number;
  forecastedDemand?: number;
  variance?: number;
}

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'];

const MODEL_NAMES = {
  linear: 'Linear Regression',
  seasonal: 'Seasonal Decomposition',
  exponential: 'Exponential Smoothing',
  arima: 'ARIMA',
  ml: 'Machine Learning'
};

const DRIVER_COLORS = {
  seasonal: 'bg-blue-100 text-blue-800',
  promotional: 'bg-purple-100 text-purple-800',
  economic: 'bg-green-100 text-green-800',
  weather: 'bg-yellow-100 text-yellow-800',
  event: 'bg-red-100 text-red-800'
};

// Sample chart data
const sampleForecastData = [
  { month: 'Jan', actual: 2400, forecasted: 2200, confidence: 85 },
  { month: 'Feb', actual: 1398, forecasted: 1600, confidence: 78 },
  { month: 'Mar', actual: 9800, forecasted: 9200, confidence: 92 },
  { month: 'Apr', actual: 3908, forecasted: 4100, confidence: 88 },
  { month: 'May', actual: 4800, forecasted: 4900, confidence: 90 },
  { month: 'Jun', actual: 3800, forecasted: 3600, confidence: 85 },
  { month: 'Jul', actual: null, forecasted: 4200, confidence: 82 },
  { month: 'Aug', actual: null, forecasted: 4800, confidence: 79 },
  { month: 'Sep', actual: null, forecasted: 5100, confidence: 76 }
];

const sampleAccuracyData = [
  { model: 'Linear', accuracy: 72, mae: 450 },
  { model: 'Seasonal', accuracy: 89, mae: 280 },
  { model: 'Exponential', accuracy: 85, mae: 320 },
  { model: 'ARIMA', accuracy: 91, mae: 250 },
  { model: 'ML Ensemble', accuracy: 94, mae: 180 }
];

const sampleSeasonalTrends = [
  { period: 'Q1', demand: 4200, growth: 12 },
  { period: 'Q2', demand: 5800, growth: 25 },
  { period: 'Q3', demand: 6900, growth: 35 },
  { period: 'Q4', demand: 8100, growth: 18 }
];

const sampleDriverImpact = [
  { name: 'Holiday Season', impact: 35, type: 'seasonal' },
  { name: 'Marketing Campaign', impact: 22, type: 'promotional' },
  { name: 'Economic Growth', impact: 18, type: 'economic' },
  { name: 'Weather Pattern', impact: 15, type: 'weather' },
  { name: 'Industry Events', impact: 10, type: 'event' }
];

export default function DemandForecastingPage() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedForecast, setSelectedForecast] = useState<DemandForecast | null>(null);
  const [newDriverDialog, setNewDriverDialog] = useState(false);
  const [driverForm, setDriverForm] = useState({
    name: "",
    type: "seasonal" as keyof typeof DRIVER_COLORS,
    impact: 10,
    description: "",
    startDate: "",
    endDate: ""
  });
  const [forecastPeriod, setForecastPeriod] = useState("30");
  const [selectedModel, setSelectedModel] = useState("ml");
  const { toast } = useToast();

  // Data queries
  const { data: demandForecasts = [], isLoading: forecastsLoading } = useQuery<DemandForecast[]>({
    queryKey: ["/api/demand/forecasts"],
  });

  const { data: demandDrivers = [], isLoading: driversLoading } = useQuery<DemandDriver[]>({
    queryKey: ["/api/demand/drivers"],
  });

  const { data: demandHistory = [], isLoading: historyLoading } = useQuery<DemandHistory[]>({
    queryKey: ["/api/demand/history"],
  });

  // Mutations
  const createDriverMutation = useMutation({
    mutationFn: async (data: typeof driverForm) => {
      return apiRequest(`/api/demand/drivers`, {
        method: "POST",
        body: JSON.stringify({ ...data, isActive: true })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/demand/drivers"] });
      setNewDriverDialog(false);
      setDriverForm({ name: "", type: "seasonal", impact: 10, description: "", startDate: "", endDate: "" });
      toast({ title: "Success", description: "Demand driver created successfully" });
    }
  });

  const generateForecastMutation = useMutation({
    mutationFn: async ({ period, model }: { period: string, model: string }) => {
      return apiRequest(`/api/demand/forecasts/generate`, {
        method: "POST",
        body: JSON.stringify({ forecastPeriodDays: parseInt(period), modelType: model })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/demand/forecasts"] });
      toast({ title: "Success", description: "Demand forecasts generated successfully" });
    }
  });

  // Calculate forecast metrics
  const forecastMetrics = {
    totalForecasts: demandForecasts.length,
    averageAccuracy: demandForecasts.length > 0 ? 
      demandForecasts.filter(f => f.accuracy).reduce((sum, f) => sum + (f.accuracy || 0), 0) / 
      demandForecasts.filter(f => f.accuracy).length || 0 : 0,
    activeDrivers: demandDrivers.filter(d => d.isActive).length,
    forecastHorizon: Math.max(...demandForecasts.map(f => 
      Math.ceil((new Date(f.forecastDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    )) || 0
  };

  // Prepare forecast trend data
  const forecastTrendData = demandHistory
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30)
    .map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      actual: item.actualDemand,
      forecast: item.forecastedDemand || 0,
      variance: item.variance || 0
    }));

  // Model performance data
  const modelPerformanceData = Object.entries(
    demandForecasts.reduce((acc, forecast) => {
      if (forecast.accuracy && forecast.modelType) {
        acc[forecast.modelType] = acc[forecast.modelType] || [];
        acc[forecast.modelType].push(forecast.accuracy);
      }
      return acc;
    }, {} as Record<string, number[]>)
  ).map(([model, accuracies]) => ({
    model: MODEL_NAMES[model as keyof typeof MODEL_NAMES] || model,
    accuracy: accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length,
    forecasts: accuracies.length
  }));

  // Accuracy distribution
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600';
    if (accuracy >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyBadge = (accuracy: number) => {
    if (accuracy >= 90) return 'bg-green-100 text-green-800';
    if (accuracy >= 80) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getVarianceColor = (variance: number) => {
    if (Math.abs(variance) <= 10) return 'text-green-600';
    if (Math.abs(variance) <= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (forecastsLoading || driversLoading || historyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading demand forecasting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="md:ml-0 ml-12">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
              <Brain className="w-6 h-6 mr-2" />
              Demand Forecasting
            </h1>
            <p className="text-sm md:text-base text-gray-600">AI-powered demand prediction and analysis for optimal planning</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Dialog open={newDriverDialog} onOpenChange={setNewDriverDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Driver
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Demand Driver</DialogTitle>
                  <DialogDescription>
                    Define a factor that influences demand patterns
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="driver-name">Driver Name</Label>
                    <Input
                      id="driver-name"
                      placeholder="e.g. Holiday Season"
                      value={driverForm.name}
                      onChange={(e) => setDriverForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="driver-type">Type</Label>
                    <Select value={driverForm.type} onValueChange={(value) => 
                      setDriverForm(prev => ({ ...prev, type: value as keyof typeof DRIVER_COLORS }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seasonal">Seasonal</SelectItem>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="economic">Economic</SelectItem>
                        <SelectItem value="weather">Weather</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="impact">Impact (%)</Label>
                      <Input
                        id="impact"
                        type="number"
                        min="-100"
                        max="200"
                        value={driverForm.impact}
                        onChange={(e) => setDriverForm(prev => ({ ...prev, impact: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Brief description of the driver"
                      value={driverForm.description}
                      onChange={(e) => setDriverForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={driverForm.startDate}
                        onChange={(e) => setDriverForm(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={driverForm.endDate}
                        onChange={(e) => setDriverForm(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setNewDriverDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => createDriverMutation.mutate(driverForm)}
                      disabled={createDriverMutation.isPending || !driverForm.name}
                    >
                      {createDriverMutation.isPending ? "Creating..." : "Create Driver"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button className="bg-primary hover:bg-blue-700 text-white"
                    onClick={() => generateForecastMutation.mutate({ period: forecastPeriod, model: selectedModel })}
                    disabled={generateForecastMutation.isPending}>
              {generateForecastMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Generate Forecasts
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Forecast Configuration */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="forecast-period">Forecast Period</Label>
                <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="14">14 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="60">60 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="model-type">Forecasting Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ml">Machine Learning</SelectItem>
                    <SelectItem value="arima">ARIMA</SelectItem>
                    <SelectItem value="seasonal">Seasonal Decomposition</SelectItem>
                    <SelectItem value="exponential">Exponential Smoothing</SelectItem>
                    <SelectItem value="linear">Linear Regression</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Forecasts</p>
                  <p className="text-2xl font-semibold">{forecastMetrics.totalForecasts.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Accuracy</p>
                  <p className={`text-2xl font-semibold ${getAccuracyColor(forecastMetrics.averageAccuracy)}`}>
                    {forecastMetrics.averageAccuracy.toFixed(1)}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Drivers</p>
                  <p className="text-2xl font-semibold text-purple-600">{forecastMetrics.activeDrivers}</p>
                </div>
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Forecast Horizon</p>
                  <p className="text-2xl font-semibold">{forecastMetrics.forecastHorizon} days</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
            <TabsTrigger value="drivers">Demand Drivers</TabsTrigger>
            <TabsTrigger value="performance">Model Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Forecast vs Actual Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Forecast vs Actual Demand</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={sampleForecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="Actual Demand" />
                      <Line type="monotone" dataKey="forecasted" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="Forecasted Demand" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Model Performance Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Model Accuracy Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sampleAccuracyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="model" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Accuracy']} />
                      <Bar dataKey="accuracy" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            
            {/* Additional Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Seasonal Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Seasonal Demand Trends</CardTitle>
                  <CardDescription>Quarterly demand patterns and growth rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={sampleSeasonalTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="demand" fill="#3b82f6" name="Demand Volume" />
                      <Line yAxisId="right" type="monotone" dataKey="growth" stroke="#ef4444" strokeWidth={2} name="Growth %" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Demand Driver Impact */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Demand Driver Impact</CardTitle>
                  <CardDescription>Key factors influencing demand patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sampleDriverImpact} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Impact']} />
                      <Bar dataKey="impact" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="forecasts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Demand Forecasts</CardTitle>
                <CardDescription>{demandForecasts.length} forecasts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Forecast Date</TableHead>
                        <TableHead>Forecasted Demand</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Accuracy</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {demandForecasts.map((forecast) => (
                        <TableRow key={forecast.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{forecast.itemName || forecast.itemSku}</div>
                              <div className="text-sm text-gray-500">SKU: {forecast.itemSku}</div>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(forecast.forecastDate).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{forecast.forecastedDemand.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {MODEL_NAMES[forecast.modelType] || forecast.modelType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={forecast.confidenceLevel} className="w-16" />
                              <span className="text-sm">{forecast.confidenceLevel}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {forecast.accuracy ? (
                              <Badge className={getAccuracyBadge(forecast.accuracy)}>
                                {forecast.accuracy.toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-sm text-gray-400">Pending</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedForecast(forecast)}>
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

          <TabsContent value="drivers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {demandDrivers.map((driver) => (
                <Card key={driver.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{driver.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={DRIVER_COLORS[driver.type]}>
                          {driver.type}
                        </Badge>
                        {driver.isActive ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <CardDescription>{driver.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Impact:</span>
                        <span className={`font-medium flex items-center gap-1 ${
                          driver.impact > 0 ? 'text-green-600' : driver.impact < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {driver.impact > 0 && <ArrowUp className="w-3 h-3" />}
                          {driver.impact < 0 && <ArrowDown className="w-3 h-3" />}
                          {Math.abs(driver.impact)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Period:</span>
                        <span className="font-medium">
                          {new Date(driver.startDate).toLocaleDateString()} - {new Date(driver.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Status:</span>
                        <span className={`font-medium ${driver.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                          {driver.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Forecast Accuracy Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Forecast Accuracy Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={forecastTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="variance" 
                        stroke="#ef4444" 
                        fill="#ef444420"
                        name="Forecast Variance %" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Model Performance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Model Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {modelPerformanceData.map((model, index) => (
                      <div key={model.model} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{model.model}</div>
                          <div className="text-sm text-gray-600">{model.forecasts} forecasts</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${getAccuracyColor(model.accuracy)}`}>
                            {model.accuracy.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">accuracy</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
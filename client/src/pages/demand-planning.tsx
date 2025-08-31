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
  TrendingUp, TrendingDown, BarChart3, Activity, Target,
  Plus, Calendar, Eye, AlertCircle, CheckCircle, Clock,
  ArrowUp, ArrowDown, Zap, Sparkles
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

// Enhanced sample chart data with realistic manufacturing patterns
const sampleForecastData = [
  { month: 'Jan', week: 1, actual: 4200, forecasted: 4100, confidence: 92, upperBound: 4500, lowerBound: 3700 },
  { month: 'Feb', week: 5, actual: 4580, forecasted: 4650, confidence: 89, upperBound: 5100, lowerBound: 4200 },
  { month: 'Mar', week: 9, actual: 5200, forecasted: 5050, confidence: 94, upperBound: 5400, lowerBound: 4700 },
  { month: 'Apr', week: 13, actual: 4890, forecasted: 4920, confidence: 91, upperBound: 5300, lowerBound: 4540 },
  { month: 'May', week: 17, actual: 5680, forecasted: 5550, confidence: 87, upperBound: 6000, lowerBound: 5100 },
  { month: 'Jun', week: 21, actual: 6200, forecasted: 6180, confidence: 95, upperBound: 6500, lowerBound: 5860 },
  { month: 'Jul', week: 25, actual: null, forecasted: 6450, confidence: 88, upperBound: 7000, lowerBound: 5900 },
  { month: 'Aug', week: 29, actual: null, forecasted: 6780, confidence: 85, upperBound: 7300, lowerBound: 6260 },
  { month: 'Sep', week: 33, actual: null, forecasted: 7100, confidence: 82, upperBound: 7800, lowerBound: 6400 },
  { month: 'Oct', week: 37, actual: null, forecasted: 6920, confidence: 79, upperBound: 7600, lowerBound: 6240 },
  { month: 'Nov', week: 41, actual: null, forecasted: 7850, confidence: 86, upperBound: 8500, lowerBound: 7200 },
  { month: 'Dec', week: 45, actual: null, forecasted: 9200, confidence: 83, upperBound: 10100, lowerBound: 8300 }
];

const sampleAccuracyData = [
  { 
    model: 'Linear Regression', 
    accuracy: 76.2, 
    mae: 420, 
    mape: 8.5, 
    rmse: 580,
    forecastCount: 156,
    lastUpdated: '2025-08-26',
    complexity: 'Low'
  },
  { 
    model: 'Seasonal ARIMA', 
    accuracy: 89.4, 
    mae: 280, 
    mape: 5.2, 
    rmse: 340,
    forecastCount: 142,
    lastUpdated: '2025-08-26',
    complexity: 'Medium'
  },
  { 
    model: 'Exponential Smoothing', 
    accuracy: 85.7, 
    mae: 315, 
    mape: 6.1, 
    rmse: 395,
    forecastCount: 168,
    lastUpdated: '2025-08-26',
    complexity: 'Low'
  },
  { 
    model: 'LSTM Neural Network', 
    accuracy: 92.8, 
    mae: 195, 
    mape: 3.8, 
    rmse: 245,
    forecastCount: 89,
    lastUpdated: '2025-08-26',
    complexity: 'High'
  },
  { 
    model: 'XGBoost Ensemble', 
    accuracy: 94.6, 
    mae: 165, 
    mape: 3.2, 
    rmse: 210,
    forecastCount: 92,
    lastUpdated: '2025-08-26',
    complexity: 'High'
  },
  { 
    model: 'Prophet (Meta)', 
    accuracy: 88.1, 
    mae: 295, 
    mape: 5.8, 
    rmse: 365,
    forecastCount: 134,
    lastUpdated: '2025-08-26',
    complexity: 'Medium'
  }
];

const sampleSeasonalTrends = [
  { period: 'Q1 2025', demand: 14280, growth: 8.2, variance: 12.5, products: 45 },
  { period: 'Q2 2025', demand: 16870, growth: 18.1, variance: 15.8, products: 52 },
  { period: 'Q3 2025', demand: 20130, growth: 19.3, variance: 18.2, products: 58 },
  { period: 'Q4 2025', demand: 23450, growth: 16.5, variance: 22.1, products: 61 },
  { period: 'Q1 2026', demand: 15850, growth: 11.0, variance: 14.2, products: 48 },
  { period: 'Q2 2026', demand: 19250, growth: 14.1, variance: 16.5, products: 55 }
];

const sampleDriverImpact = [
  { 
    name: 'Holiday Season Demand', 
    impact: 42.5, 
    type: 'seasonal',
    duration: '8 weeks',
    reliability: 95,
    historicalData: 8
  },
  { 
    name: 'Summer Promotion Campaign', 
    impact: 28.3, 
    type: 'promotional',
    duration: '6 weeks',
    reliability: 87,
    historicalData: 5
  },
  { 
    name: 'Economic Recovery Trend', 
    impact: 22.1, 
    type: 'economic',
    duration: '52 weeks',
    reliability: 78,
    historicalData: 12
  },
  { 
    name: 'Weather-Related Surge', 
    impact: 18.7, 
    type: 'weather',
    duration: '4 weeks',
    reliability: 83,
    historicalData: 6
  },
  { 
    name: 'Industry Trade Show', 
    impact: 15.2, 
    type: 'event',
    duration: '3 weeks',
    reliability: 91,
    historicalData: 4
  },
  { 
    name: 'New Product Launch', 
    impact: 35.8, 
    type: 'promotional',
    duration: '12 weeks',
    reliability: 74,
    historicalData: 3
  }
];

// Additional enhanced data sets
const sampleDemandByProduct = [
  { product: 'Premium IPA', current: 3200, forecasted: 3450, growth: 7.8, category: 'Premium' },
  { product: 'Classic Lager', current: 5800, forecasted: 6100, growth: 5.2, category: 'Standard' },
  { product: 'Wheat Beer', current: 2900, forecasted: 3350, growth: 15.5, category: 'Specialty' },
  { product: 'Seasonal Ale', current: 1800, forecasted: 2800, growth: 55.6, category: 'Seasonal' },
  { product: 'Light Beer', current: 4200, forecasted: 4050, growth: -3.6, category: 'Light' },
  { product: 'Craft Porter', current: 1900, forecasted: 2150, growth: 13.2, category: 'Craft' }
];

const sampleMarketSegments = [
  { segment: 'Retail Chains', share: 38.5, growth: 12.3, volume: 18500 },
  { segment: 'Restaurants', share: 24.2, growth: 8.7, volume: 11600 },
  { segment: 'Bars & Pubs', share: 18.9, growth: 6.1, volume: 9100 },
  { segment: 'Direct Sales', share: 12.4, growth: 22.1, volume: 5950 },
  { segment: 'Distributors', share: 6.0, growth: 4.2, volume: 2880 }
];

const sampleForecastAccuracyTrend = [
  { month: 'Jan', accuracy: 87.2, targetAccuracy: 90, bias: -2.1, mae: 285 },
  { month: 'Feb', accuracy: 89.1, targetAccuracy: 90, bias: 1.4, mae: 265 },
  { month: 'Mar', accuracy: 91.5, targetAccuracy: 90, bias: -0.8, mae: 220 },
  { month: 'Apr', accuracy: 88.9, targetAccuracy: 90, bias: 3.2, mae: 298 },
  { month: 'May', accuracy: 92.3, targetAccuracy: 90, bias: -1.1, mae: 195 },
  { month: 'Jun', accuracy: 94.1, targetAccuracy: 90, bias: 0.3, mae: 168 },
  { month: 'Jul', accuracy: 93.8, targetAccuracy: 90, bias: 0.7, mae: 178 },
  { month: 'Aug', accuracy: 95.2, targetAccuracy: 90, bias: -0.4, mae: 152 }
];

const sampleVolumeByChannel = [
  { channel: 'Online Direct', volume: 2850, growth: 28.5, share: 32.1 },
  { channel: 'Retail Partners', volume: 4200, growth: 15.2, share: 47.3 },
  { channel: 'Distributors', volume: 1450, growth: 8.7, share: 16.4 },
  { channel: 'B2B Sales', volume: 380, growth: -5.2, share: 4.2 }
];

const sampleRegionalDemand = [
  { region: 'North America', demand: 8950, forecast: 9200, variance: 2.8 },
  { region: 'Europe', demand: 6420, forecast: 6150, variance: -4.2 },
  { region: 'Asia Pacific', demand: 4850, forecast: 5100, variance: 5.2 },
  { region: 'Latin America', demand: 2380, forecast: 2450, variance: 2.9 },
  { region: 'Rest of World', demand: 1650, forecast: 1580, variance: -4.2 }
];

export default function DemandPlanningPage() {
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
  const { aiTheme } = useAITheme();

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
      return apiRequest("POST", `/api/demand/drivers`, { ...data, isActive: true });
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
      return apiRequest("POST", `/api/demand/forecasts/generate`, { forecastPeriodDays: parseInt(period), modelType: model });
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
          <p className="text-gray-600">Loading demand planning...</p>
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
            <h1 className="text-xl md:text-2xl font-semibold text-foreground flex items-center">
              <Sparkles className="w-6 h-6 mr-2" />
              Demand Planning
            </h1>
            <p className="text-sm md:text-base text-gray-600">AI-powered demand planning and analysis for optimal production scheduling</p>
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
            <Button className={`${aiTheme.gradient} hover:opacity-90 text-white`}
                    onClick={() => generateForecastMutation.mutate({ period: forecastPeriod, model: selectedModel })}
                    disabled={generateForecastMutation.isPending}>
              {generateForecastMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
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
            {/* Enhanced Executive Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Monthly Demand</p>
                      <p className="text-2xl font-bold text-gray-900">6,450</p>
                      <p className="text-xs text-green-600 flex items-center">
                        <ArrowUp className="w-3 h-3 mr-1" />
                        +12.3% vs last month
                      </p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600">Forecast Accuracy</p>
                      <p className="text-2xl font-bold text-gray-900">94.6%</p>
                      <p className="text-xs text-gray-500">XGBoost Ensemble</p>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Target className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Demand Variance</p>
                      <p className="text-2xl font-bold text-gray-900">±18.2%</p>
                      <p className="text-xs text-yellow-600">Seasonal patterns</p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Active Drivers</p>
                      <p className="text-2xl font-bold text-gray-900">6</p>
                      <p className="text-xs text-gray-500">Impacting demand</p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <Zap className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enhanced Forecast vs Actual with Confidence Bands */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                    Demand Forecast Analysis
                  </CardTitle>
                  <CardDescription>
                    12-month rolling forecast with confidence intervals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={sampleForecastData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          typeof value === 'number' ? value.toLocaleString() : value, 
                          name
                        ]}
                        labelFormatter={(label) => `Month: ${label}`}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      
                      {/* Confidence bands */}
                      <Area 
                        type="monotone" 
                        dataKey="upperBound" 
                        stackId="1" 
                        stroke="none" 
                        fill="#3b82f6" 
                        fillOpacity={0.1}
                        name="Confidence Range"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="lowerBound" 
                        stackId="1" 
                        stroke="none" 
                        fill="#ffffff" 
                        fillOpacity={1}
                      />
                      
                      {/* Actual demand line */}
                      <Line 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#10b981' }}
                        name="Actual Demand" 
                      />
                      
                      {/* Forecasted demand line */}
                      <Line 
                        type="monotone" 
                        dataKey="forecasted" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        strokeDasharray="8 4"
                        dot={{ r: 4, fill: '#3b82f6' }}
                        name="Forecasted Demand" 
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                    <span>Confidence: 85.2% avg</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      High Accuracy
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Model Performance with Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-emerald-600" />
                    Model Performance Rankings
                  </CardTitle>
                  <CardDescription>
                    Accuracy comparison across forecasting algorithms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={sampleAccuracyData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        type="number" 
                        domain={[70, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="model" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11 }}
                        width={120}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`${Number(value).toFixed(1)}%`, 'Accuracy']}
                        labelFormatter={(label) => `Model: ${label}`}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="accuracy" 
                        fill="#10b981"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Best Model</p>
                      <p className="font-semibold text-emerald-600">XGBoost</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Avg MAE</p>
                      <p className="font-semibold">292</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Total Models</p>
                      <p className="font-semibold text-blue-600">6</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* New Product Category Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                    Demand by Product Category
                  </CardTitle>
                  <CardDescription>
                    Current vs forecasted demand across product lines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sampleDemandByProduct}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="product" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip 
                        formatter={(value, name) => [value.toLocaleString(), name]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="current" fill="#6366f1" name="Current Demand" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="forecasted" fill="#10b981" name="Forecasted Demand" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-orange-600" />
                    Market Segment Analysis
                  </CardTitle>
                  <CardDescription>
                    Revenue distribution across customer segments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sampleMarketSegments}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="segment" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        yAxisId="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          name.includes('Share') ? `${value}%` : value.toLocaleString(),
                          name
                        ]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="share" fill="#f59e0b" name="Market Share %" radius={[2, 2, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#ef4444" strokeWidth={2} name="Volume" />
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
            {/* Enhanced Drivers Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Driver Impact Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-orange-600" />
                    Driver Impact Analysis
                  </CardTitle>
                  <CardDescription>
                    Influence of demand drivers on forecast accuracy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={sampleDriverImpact} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        type="number" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={140}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`${value}%`, 'Impact']}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                        {sampleDriverImpact.map((entry, index) => (
                          <Bar 
                            key={`cell-${index}`} 
                            fill={
                              entry.type === 'seasonal' ? '#3b82f6' :
                              entry.type === 'promotional' ? '#8b5cf6' :
                              entry.type === 'economic' ? '#10b981' :
                              entry.type === 'weather' ? '#f59e0b' :
                              '#ef4444'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Driver Reliability Scores */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Target className="w-5 h-5 mr-2 text-emerald-600" />
                    Driver Reliability Metrics
                  </CardTitle>
                  <CardDescription>
                    Historical accuracy and prediction confidence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sampleDriverImpact.map((driver, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={`${DRIVER_COLORS[driver.type]} text-xs`}>
                              {driver.type}
                            </Badge>
                            <span className="font-medium text-sm">{driver.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            {driver.reliability}% reliable
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="text-center">
                            <p className="text-gray-600">Impact</p>
                            <p className="font-semibold text-blue-600">{driver.impact}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600">Duration</p>
                            <p className="font-semibold">{driver.duration}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600">History</p>
                            <p className="font-semibold text-green-600">{driver.historicalData} yrs</p>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-600">Reliability</span>
                            <span className="text-xs font-medium">{driver.reliability}%</span>
                          </div>
                          <Progress value={driver.reliability} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Demand Drivers Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-purple-600" />
                    Active Demand Drivers
                  </span>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    {sampleDriverImpact.length} drivers configured
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Configured demand drivers and their current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sampleDriverImpact.map((driver, index) => (
                    <Card key={index} className={`border-l-4 ${
                      driver.type === 'seasonal' ? 'border-l-blue-500' :
                      driver.type === 'promotional' ? 'border-l-purple-500' :
                      driver.type === 'economic' ? 'border-l-emerald-500' :
                      driver.type === 'weather' ? 'border-l-yellow-500' :
                      'border-l-red-500'
                    }`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{driver.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge className={`${DRIVER_COLORS[driver.type]} text-xs`}>
                              {driver.type}
                            </Badge>
                            <div className={`w-2 h-2 rounded-full ${
                              driver.reliability > 90 ? 'bg-green-500' :
                              driver.reliability > 80 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`} />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Impact:</span>
                            <div className="flex items-center gap-1">
                              {driver.impact > 30 ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : driver.impact > 15 ? (
                                <ArrowUp className="w-4 h-4 text-blue-600" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-gray-600" />
                              )}
                              <span className="text-sm font-semibold text-blue-600">
                                +{driver.impact}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Duration:</span>
                            <span className="text-sm font-medium">{driver.duration}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Reliability:</span>
                            <div className="flex items-center gap-2">
                              <Progress value={driver.reliability} className="w-12 h-2" />
                              <span className="text-xs font-medium">{driver.reliability}%</span>
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {driver.historicalData} years of data
                              </span>
                              <Badge variant="outline" className={`text-xs ${
                                driver.reliability > 90 ? 'bg-green-50 text-green-700' :
                                driver.reliability > 80 ? 'bg-yellow-50 text-yellow-700' :
                                'bg-red-50 text-red-700'
                              }`}>
                                {driver.reliability > 90 ? 'High Confidence' :
                                 driver.reliability > 80 ? 'Medium Confidence' :
                                 'Low Confidence'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Additional drivers from database (if any) */}
            {demandDrivers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Custom Demand Drivers</CardTitle>
                  <CardDescription>{demandDrivers.length} custom drivers configured</CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Performance Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600">Best Model</p>
                      <p className="text-lg font-bold text-gray-900">XGBoost</p>
                      <p className="text-xs text-emerald-600">94.6% accuracy</p>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Award className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Avg MAE</p>
                      <p className="text-lg font-bold text-gray-900">210</p>
                      <p className="text-xs text-green-600">↓ 15% improvement</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Target className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Forecast Bias</p>
                      <p className="text-lg font-bold text-gray-900">0.3%</p>
                      <p className="text-xs text-green-600">Within target ±2%</p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Activity className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Models Active</p>
                      <p className="text-lg font-bold text-gray-900">6</p>
                      <p className="text-xs text-gray-500">Ensemble approach</p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enhanced Forecast Accuracy Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
                    Forecast Accuracy Trends
                  </CardTitle>
                  <CardDescription>
                    Monthly accuracy performance vs 90% target
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={sampleForecastAccuracyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value}%`}
                        domain={[80, 100]}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          typeof value === 'number' ? `${value.toFixed(1)}%` : value,
                          name
                        ]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      
                      {/* Target line */}
                      <Line 
                        type="monotone" 
                        dataKey="targetAccuracy" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        strokeDasharray="8 4"
                        dot={false}
                        name="Target (90%)" 
                      />
                      
                      {/* Actual accuracy area */}
                      <Area 
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="#10b981" 
                        fill="#10b98120"
                        strokeWidth={3}
                        name="Forecast Accuracy" 
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Current Month</p>
                      <p className="font-semibold text-emerald-600">95.2%</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Avg 6 Month</p>
                      <p className="font-semibold">91.8%</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Improvement</p>
                      <p className="font-semibold text-green-600">+4.1%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Model Performance Detailed Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Detailed Model Metrics
                  </CardTitle>
                  <CardDescription>
                    Comprehensive performance analysis across algorithms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sampleAccuracyData.map((model, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-medium text-gray-900">{model.model}</div>
                            <div className="text-xs text-gray-500">
                              {model.forecastCount} forecasts • {model.complexity} complexity
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-semibold ${getAccuracyColor(model.accuracy)}`}>
                              {model.accuracy.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">accuracy</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="text-center p-2 bg-white rounded">
                            <p className="text-gray-600">MAE</p>
                            <p className="font-semibold text-blue-600">{model.mae}</p>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <p className="text-gray-600">MAPE</p>
                            <p className="font-semibold text-purple-600">{model.mape}%</p>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <p className="text-gray-600">RMSE</p>
                            <p className="font-semibold text-orange-600">{model.rmse}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-600">Performance Score</span>
                            <span className="text-xs font-medium">{model.accuracy.toFixed(1)}%</span>
                          </div>
                          <Progress value={model.accuracy} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Regional Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-purple-600" />
                    Regional Forecast Performance
                  </CardTitle>
                  <CardDescription>
                    Demand accuracy by geographic region
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sampleRegionalDemand}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="region" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip 
                        formatter={(value, name) => [value.toLocaleString(), name]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="demand" fill="#6366f1" name="Actual Demand" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="forecast" fill="#10b981" name="Forecasted" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sales Channel Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
                    Channel Volume Distribution
                  </CardTitle>
                  <CardDescription>
                    Demand patterns across sales channels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={sampleVolumeByChannel}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="channel" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        yAxisId="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          name.includes('Growth') ? `${value}%` : value.toLocaleString(),
                          name
                        ]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="volume" fill="#3b82f6" name="Volume" radius={[2, 2, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="growth" stroke="#ef4444" strokeWidth={2} name="Growth %" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
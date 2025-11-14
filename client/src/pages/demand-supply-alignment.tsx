import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Package,
  Factory,
  Target,
  Filter,
  Download,
  RefreshCw,
  Eye,
  ArrowUpDown,
  Zap,
  Clock,
  MessageSquare,
  Plus,
  X
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ComposedChart } from "recharts";
import { format, addWeeks, startOfWeek, endOfWeek, addDays, parseISO } from "date-fns";
import { CommentsPanel } from "@/components/comments/comments-panel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface SupplyDemandData {
  periodStart: string;
  periodEnd: string;
  weekNumber: number;
  year: number;
  // Demand components
  actualDemand: number;
  forecastDemand: number;
  salesOrderDemand: number;
  safetyStockDemand: number;
  totalDemand: number;
  // Supply components
  productionScheduled: number;
  productionPlanned: number;
  inventoryOnHand: number;
  inventoryInTransit: number;
  totalSupply: number;
  // Alignment metrics
  supplyDemandGap: number;
  supplyRatio: number;
  cumulativeGap: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  // Additional insights
  leadTimeBuffer: number;
  capacityUtilization: number;
  supplierRisk: number;
  demandVariability: number;
}

interface AlignmentItem {
  itemId: number;
  itemNumber: string;
  itemDescription: string;
  plantId: number;
  plantName: string;
  category: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  data: SupplyDemandData[];
  overallAlignment: number; // 0-100 score
  trends: {
    demandTrend: 'increasing' | 'decreasing' | 'stable';
    supplyTrend: 'increasing' | 'decreasing' | 'stable';
    gapTrend: 'improving' | 'worsening' | 'stable';
  };
  alerts: Array<{
    type: 'shortage' | 'excess' | 'capacity' | 'supplier' | 'demand_volatility';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    period: string;
    recommendation: string;
  }>;
}

export default function DemandSupplyAlignmentPage() {
  const [selectedPlant, setSelectedPlant] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<string>("all");
  const [timeHorizon, setTimeHorizon] = useState<number>(26); // weeks
  const [viewMode, setViewMode] = useState<"summary" | "detailed" | "drill-down">("detailed");
  const [selectedCriticality, setSelectedCriticality] = useState<string>("all");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("all");
  const [selectedAlignmentLevel, setSelectedAlignmentLevel] = useState<string>("all");
  const [chartType, setChartType] = useState<"line" | "area" | "bar" | "composed">("composed");
  const [drillDownItem, setDrillDownItem] = useState<number | null>(null);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [commentsEntityId, setCommentsEntityId] = useState<number | null>(null);
  const [commentsEntityType, setCommentsEntityType] = useState<string>("demand-supply-alignment");

  // Fetch demand forecasts, production schedules, and inventory data
  const { data: demandForecasts = [] } = useQuery<any[]>({
    queryKey: ["/api/demand-forecasts"],
  });

  const { data: salesForecasts = [] } = useQuery<any[]>({
    queryKey: ["/api/sales-forecasts"],
  });

  const { data: masterProductionSchedule = [] } = useQuery<any[]>({
    queryKey: ["/api/master-production-schedule"],
  });

  const { data: inventory = [] } = useQuery<any[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: plants = [] } = useQuery<any[]>({
    queryKey: ["/api/plants"],
  });

  const { data: productionOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/jobs"],
  });

  // Generate mock supply-demand alignment data (replace with real API data)
  const alignmentData = useMemo<AlignmentItem[]>(() => {
    if (!plants.length) return [];

    return [
      {
        itemId: 1,
        itemNumber: "IBUPROFEN-400MG",
        itemDescription: "Ibuprofen 400mg Tablets",
        plantId: 6,
        plantName: "APAC Hub",
        category: "Pharmaceutical Tablets",
        criticality: "high",
        overallAlignment: 75,
        trends: {
          demandTrend: "increasing",
          supplyTrend: "stable",
          gapTrend: "worsening"
        },
        alerts: [
          {
            type: "shortage",
            severity: "high",
            message: "Projected shortage in weeks 8-10",
            period: "2025-W08-W10",
            recommendation: "Increase production by 25% or expedite supplier orders"
          },
          {
            type: "capacity",
            severity: "medium",
            message: "Capacity utilization approaching 90%",
            period: "2025-W06-W12",
            recommendation: "Consider overtime shifts or additional equipment"
          }
        ],
        data: Array.from({ length: timeHorizon }, (_, i) => {
          const weekStart = addWeeks(startOfWeek(new Date()), i);
          const baseSupply = 10000;
          const baseDemand = 9500;
          const supplyVariation = Math.sin(i * 0.3) * 1500;
          const demandVariation = Math.cos(i * 0.4) * 2000;
          const actualDemand = Math.max(0, baseDemand + demandVariation + (Math.random() - 0.5) * 1000);
          const forecastDemand = actualDemand * (1 + (Math.random() - 0.5) * 0.1);
          const salesOrderDemand = actualDemand * 0.7;
          const safetyStockDemand = actualDemand * 0.1;
          const totalDemand = forecastDemand + safetyStockDemand;
          const productionScheduled = Math.max(0, baseSupply + supplyVariation + (Math.random() - 0.5) * 800);
          const inventoryOnHand = Math.max(0, 5000 + (Math.random() - 0.5) * 2000);
          const totalSupply = productionScheduled + inventoryOnHand;
          const gap = totalSupply - totalDemand;
          
          return {
            periodStart: format(weekStart, 'yyyy-MM-dd'),
            periodEnd: format(addDays(weekStart, 6), 'yyyy-MM-dd'),
            weekNumber: i + 1,
            year: 2025,
            actualDemand,
            forecastDemand,
            salesOrderDemand,
            safetyStockDemand,
            totalDemand,
            productionScheduled,
            productionPlanned: productionScheduled * 1.1,
            inventoryOnHand,
            inventoryInTransit: inventoryOnHand * 0.1,
            totalSupply,
            supplyDemandGap: gap,
            supplyRatio: totalSupply / totalDemand * 100,
            cumulativeGap: gap,
            riskLevel: Math.abs(gap) / totalDemand > 0.2 ? 'critical' : 
                      Math.abs(gap) / totalDemand > 0.1 ? 'high' : 
                      Math.abs(gap) / totalDemand > 0.05 ? 'medium' : 'low' as any,
            leadTimeBuffer: 7,
            capacityUtilization: 75 + (Math.random() * 20),
            supplierRisk: Math.random() * 30,
            demandVariability: Math.abs(demandVariation) / baseDemand * 100
          };
        })
      },
      {
        itemId: 2,
        itemNumber: "ACETAMINOPHEN-500MG",
        itemDescription: "Acetaminophen 500mg Capsules",
        plantId: 7,
        plantName: "Europe Hub",
        category: "Pharmaceutical Capsules",
        criticality: "medium",
        overallAlignment: 88,
        trends: {
          demandTrend: "stable",
          supplyTrend: "increasing",
          gapTrend: "improving"
        },
        alerts: [
          {
            type: "excess",
            severity: "low",
            message: "Projected excess inventory in weeks 15-20",
            period: "2025-W15-W20",
            recommendation: "Consider reducing production or finding additional demand channels"
          }
        ],
        data: Array.from({ length: timeHorizon }, (_, i) => {
          const weekStart = addWeeks(startOfWeek(new Date()), i);
          const baseSupply = 8000;
          const baseDemand = 7200;
          const supplyVariation = Math.sin(i * 0.2) * 800;
          const demandVariation = Math.cos(i * 0.3) * 600;
          const actualDemand = Math.max(0, baseDemand + demandVariation + (Math.random() - 0.5) * 400);
          const forecastDemand = actualDemand * (1 + (Math.random() - 0.5) * 0.08);
          const salesOrderDemand = actualDemand * 0.8;
          const safetyStockDemand = actualDemand * 0.15;
          const totalDemand = forecastDemand + safetyStockDemand;
          const productionScheduled = Math.max(0, baseSupply + supplyVariation + (Math.random() - 0.5) * 500);
          const inventoryOnHand = Math.max(0, 4000 + (Math.random() - 0.5) * 1500);
          const totalSupply = productionScheduled + inventoryOnHand;
          const gap = totalSupply - totalDemand;
          
          return {
            periodStart: format(weekStart, 'yyyy-MM-dd'),
            periodEnd: format(addDays(weekStart, 6), 'yyyy-MM-dd'),
            weekNumber: i + 1,
            year: 2025,
            actualDemand,
            forecastDemand,
            salesOrderDemand,
            safetyStockDemand,
            totalDemand,
            productionScheduled,
            productionPlanned: productionScheduled * 1.05,
            inventoryOnHand,
            inventoryInTransit: inventoryOnHand * 0.05,
            totalSupply,
            supplyDemandGap: gap,
            supplyRatio: totalSupply / totalDemand * 100,
            cumulativeGap: gap,
            riskLevel: Math.abs(gap) / totalDemand > 0.2 ? 'critical' : 
                      Math.abs(gap) / totalDemand > 0.1 ? 'high' : 
                      Math.abs(gap) / totalDemand > 0.05 ? 'medium' : 'low' as any,
            leadTimeBuffer: 10,
            capacityUtilization: 65 + (Math.random() * 15),
            supplierRisk: Math.random() * 20,
            demandVariability: Math.abs(demandVariation) / baseDemand * 100
          };
        })
      }
    ];
  }, [timeHorizon, plants]);

  // Filter and sort data based on user selections
  const filteredAlignmentData = useMemo(() => {
    return alignmentData.filter(item => {
      if (selectedPlant !== "all" && item.plantId.toString() !== selectedPlant) return false;
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      if (selectedItem !== "all" && item.itemId.toString() !== selectedItem) return false;
      if (selectedCriticality !== "all" && item.criticality !== selectedCriticality) return false;
      
      // Filter by alignment level
      if (selectedAlignmentLevel !== "all") {
        const alignmentCategory = getAlignmentCategory(item.overallAlignment);
        if (alignmentCategory !== selectedAlignmentLevel) return false;
      }
      
      // Filter by risk level (check if any period has the selected risk level)
      if (selectedRiskLevel !== "all") {
        const hasRiskLevel = item.data.some(period => period.riskLevel === selectedRiskLevel);
        if (!hasRiskLevel) return false;
      }
      
      return true;
    });
  }, [alignmentData, selectedPlant, selectedCategory, selectedItem, selectedCriticality, selectedAlignmentLevel, selectedRiskLevel]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlignmentColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getAlignmentCategory = (score: number) => {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  };

  const getAlignmentBadgeColor = (category: string) => {
    switch (category) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'fair': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decreasing': case 'worsening': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <ArrowUpDown className="h-4 w-4 text-gray-600" />;
      default: return null;
    }
  };

  // Render different chart types
  const renderChart = (data: SupplyDemandData[]) => {
    const chartData = data.map(d => ({
      week: `W${d.weekNumber}`,
      'Total Demand': d.totalDemand,
      'Total Supply': d.totalSupply,
      'Supply Gap': d.supplyDemandGap,
      'Supply Ratio': d.supplyRatio,
      'Forecast Demand': d.forecastDemand,
      'Production Scheduled': d.productionScheduled,
      'Inventory On Hand': d.inventoryOnHand,
    }));

    switch (chartType) {
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Line type="monotone" dataKey="Total Demand" stroke="#ef4444" strokeWidth={2} />
            <Line type="monotone" dataKey="Total Supply" stroke="#22c55e" strokeWidth={2} />
            <Line type="monotone" dataKey="Supply Gap" stroke="#f59e0b" strokeWidth={2} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Area type="monotone" dataKey="Total Demand" stackId="1" stroke="#ef4444" fill="#ef444450" />
            <Area type="monotone" dataKey="Total Supply" stackId="2" stroke="#22c55e" fill="#22c55e50" />
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="Total Demand" fill="#ef4444" />
            <Bar dataKey="Total Supply" fill="#22c55e" />
          </BarChart>
        );
      case 'composed':
      default:
        return (
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <RechartsTooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="Total Demand" fill="#ef444450" name="Total Demand" />
            <Bar yAxisId="left" dataKey="Total Supply" fill="#22c55e50" name="Total Supply" />
            <Line yAxisId="right" type="monotone" dataKey="Supply Ratio" stroke="#f59e0b" strokeWidth={3} name="Supply Ratio %" />
          </ComposedChart>
        );
    }
  };

  if (drillDownItem) {
    const item = filteredAlignmentData.find(i => i.itemId === drillDownItem);
    if (!item) return <div>Item not found</div>;

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setDrillDownItem(null)}
            className="mb-4"
          >
            ← Back to Overview
          </Button>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Demand/Supply Analysis: {item.itemDescription}
          </h1>
          <p className="text-gray-600">
            {item.itemNumber} • {item.plantName} • {item.category}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Overall Alignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getAlignmentColor(item.overallAlignment)}`}>
                {item.overallAlignment}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Demand Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {getTrendIcon(item.trends.demandTrend)}
                <span className="ml-2 text-sm capitalize">{item.trends.demandTrend}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Supply Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {getTrendIcon(item.trends.supplyTrend)}
                <span className="ml-2 text-sm capitalize">{item.trends.supplyTrend}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Gap Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {getTrendIcon(item.trends.gapTrend)}
                <span className="ml-2 text-sm capitalize">{item.trends.gapTrend}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {item.alerts.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Active Alerts ({item.alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {item.alerts.map((alert, index) => (
                  <div key={index} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <Badge variant="outline" className={getRiskColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="ml-2 text-sm text-gray-600 capitalize">{alert.type.replace('_', ' ')}</span>
                          <span className="ml-2 text-xs text-gray-500">{alert.period}</span>
                        </div>
                        <p className="text-sm text-gray-800 mb-2">{alert.message}</p>
                        <p className="text-xs text-blue-600">💡 {alert.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Supply vs Demand Analysis</CardTitle>
              <div className="flex items-center space-x-2">
                <Select value={chartType} onValueChange={setChartType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="composed">Combined</SelectItem>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="area">Area Chart</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                {renderChart(item.data)}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Data Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Weekly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Week</th>
                    <th className="text-right p-2">Forecast Demand</th>
                    <th className="text-right p-2">Production Scheduled</th>
                    <th className="text-right p-2">Inventory On Hand</th>
                    <th className="text-right p-2">Total Supply</th>
                    <th className="text-right p-2">Supply Gap</th>
                    <th className="text-right p-2">Supply Ratio</th>
                    <th className="text-center p-2">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {item.data.slice(0, 12).map((week, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2">W{week.weekNumber}</td>
                      <td className="text-right p-2">{week.forecastDemand.toLocaleString()}</td>
                      <td className="text-right p-2">{week.productionScheduled.toLocaleString()}</td>
                      <td className="text-right p-2">{week.inventoryOnHand.toLocaleString()}</td>
                      <td className="text-right p-2">{week.totalSupply.toLocaleString()}</td>
                      <td className={`text-right p-2 ${week.supplyDemandGap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {week.supplyDemandGap > 0 ? '+' : ''}{week.supplyDemandGap.toLocaleString()}
                      </td>
                      <td className="text-right p-2">{week.supplyRatio.toFixed(1)}%</td>
                      <td className="text-center p-2">
                        <Badge variant="outline" className={getRiskColor(week.riskLevel)}>
                          {week.riskLevel}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Demand/Supply Alignment</h1>
            <p className="text-gray-600">
              Monitor how well supply is meeting demand across your planning horizon
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCommentsEntityType("demand-supply-alignment");
                setCommentsEntityId(1); // General page comments
                setShowComments(true);
              }}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Page Comments
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Analysis
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters & Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div>
              <Label htmlFor="plant">Plant</Label>
              <Select value={selectedPlant} onValueChange={setSelectedPlant}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plants</SelectItem>
                  {plants.map((plant) => (
                    <SelectItem key={plant.id} value={plant.id.toString()}>
                      {plant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Pharmaceutical Tablets">Tablets</SelectItem>
                  <SelectItem value="Pharmaceutical Capsules">Capsules</SelectItem>
                  <SelectItem value="Injectable Solutions">Injectables</SelectItem>
                  <SelectItem value="API">API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="criticality">Criticality</Label>
              <Select value={selectedCriticality} onValueChange={setSelectedCriticality}>
                <SelectTrigger>
                  <SelectValue placeholder="Select criticality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="alignment">Alignment Level</Label>
              <Select value={selectedAlignmentLevel} onValueChange={setSelectedAlignmentLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select alignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="excellent">Excellent (90%+)</SelectItem>
                  <SelectItem value="good">Good (75-89%)</SelectItem>
                  <SelectItem value="fair">Fair (60-74%)</SelectItem>
                  <SelectItem value="poor">Poor (below 60%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="risk">Risk Level</Label>
              <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="horizon">Time Horizon (Weeks)</Label>
              <Select value={timeHorizon.toString()} onValueChange={(value) => setTimeHorizon(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 weeks</SelectItem>
                  <SelectItem value="26">26 weeks</SelectItem>
                  <SelectItem value="52">52 weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="chart-type">Chart Type</Label>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="composed">Combined</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refresh">Actions</Label>
              <Button className="w-full" data-testid="button-refresh-data">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters Summary */}
      {(selectedPlant !== "all" || selectedCategory !== "all" || selectedCriticality !== "all" || 
        selectedAlignmentLevel !== "all" || selectedRiskLevel !== "all") && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedPlant !== "all" && (
                <Badge variant="secondary" className="flex items-center">
                  Plant: {plants.find(p => p.id.toString() === selectedPlant)?.name || selectedPlant}
                  <button 
                    onClick={() => setSelectedPlant("all")}
                    className="ml-1 hover:bg-gray-200 rounded-full p-1"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="flex items-center">
                  Category: {selectedCategory}
                  <button 
                    onClick={() => setSelectedCategory("all")}
                    className="ml-1 hover:bg-gray-200 rounded-full p-1"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedCriticality !== "all" && (
                <Badge variant="secondary" className="flex items-center">
                  Criticality: {selectedCriticality}
                  <button 
                    onClick={() => setSelectedCriticality("all")}
                    className="ml-1 hover:bg-gray-200 rounded-full p-1"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedAlignmentLevel !== "all" && (
                <Badge variant="secondary" className="flex items-center">
                  Alignment: {selectedAlignmentLevel}
                  <button 
                    onClick={() => setSelectedAlignmentLevel("all")}
                    className="ml-1 hover:bg-gray-200 rounded-full p-1"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedRiskLevel !== "all" && (
                <Badge variant="secondary" className="flex items-center">
                  Risk: {selectedRiskLevel}
                  <button 
                    onClick={() => setSelectedRiskLevel("all")}
                    className="ml-1 hover:bg-gray-200 rounded-full p-1"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSelectedPlant("all");
                  setSelectedCategory("all"); 
                  setSelectedCriticality("all");
                  setSelectedAlignmentLevel("all");
                  setSelectedRiskLevel("all");
                }}
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Filter Actions */}
      <Card className="mb-6">
        <CardHeader className="py-2">
          <CardTitle className="text-sm font-medium text-gray-600">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={selectedAlignmentLevel === "poor" ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedAlignmentLevel(selectedAlignmentLevel === "poor" ? "all" : "poor")}
            >
              Show Poor Alignment
            </Button>
            <Button 
              variant={selectedCriticality === "critical" ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedCriticality(selectedCriticality === "critical" ? "all" : "critical")}
            >
              Critical Items Only
            </Button>
            <Button 
              variant={selectedRiskLevel === "critical" ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedRiskLevel(selectedRiskLevel === "critical" ? "all" : "critical")}
            >
              High Risk Items
            </Button>
            <Button 
              variant={selectedAlignmentLevel === "excellent" ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedAlignmentLevel(selectedAlignmentLevel === "excellent" ? "all" : "excellent")}
            >
              Excellent Alignment
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={viewMode} onValueChange={setViewMode} className="mb-6">
        <TabsList>
          <TabsTrigger value="summary">Summary View</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Items Analyzed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredAlignmentData.length}</div>
                <p className="text-xs text-gray-500">Active SKUs in scope</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Alignment Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {filteredAlignmentData.length > 0 
                    ? Math.round(filteredAlignmentData.reduce((sum, item) => sum + item.overallAlignment, 0) / filteredAlignmentData.length)
                    : 0}%
                </div>
                <p className="text-xs text-gray-500">Supply meeting demand</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Critical Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {filteredAlignmentData.filter(item => item.criticality === 'critical').length}
                </div>
                <p className="text-xs text-gray-500">Require immediate attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Alignment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Excellent (90%+)</span>
                    <span className="font-medium">{filteredAlignmentData.filter(item => item.overallAlignment >= 90).length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-yellow-600">Good (75-89%)</span>
                    <span className="font-medium">{filteredAlignmentData.filter(item => item.overallAlignment >= 75 && item.overallAlignment < 90).length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-orange-600">Fair (60-74%)</span>
                    <span className="font-medium">{filteredAlignmentData.filter(item => item.overallAlignment >= 60 && item.overallAlignment < 75).length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-red-600">Poor (below 60%)</span>
                    <span className="font-medium">{filteredAlignmentData.filter(item => item.overallAlignment < 60).length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items List */}
          <Card>
            <CardHeader>
              <CardTitle>Supply/Demand Alignment Summary</CardTitle>
              <CardDescription>
                Click on any item to drill down into detailed analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAlignmentData.map((item) => (
                  <div
                    key={item.itemId}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setDrillDownItem(item.itemId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="font-medium text-gray-800">{item.itemDescription}</h3>
                          <Badge variant="outline" className={`ml-2 ${
                            item.criticality === 'critical' ? 'border-red-200 text-red-800' :
                            item.criticality === 'high' ? 'border-orange-200 text-orange-800' :
                            item.criticality === 'medium' ? 'border-yellow-200 text-yellow-800' :
                            'border-green-200 text-green-800'
                          }`}>
                            {item.criticality.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={`ml-2 ${getAlignmentBadgeColor(getAlignmentCategory(item.overallAlignment))}`}>
                            {getAlignmentCategory(item.overallAlignment).toUpperCase()}
                          </Badge>
                          {item.alerts.length > 0 && (
                            <Badge variant="outline" className="ml-2 border-red-200 text-red-800">
                              {item.alerts.length} Alert{item.alerts.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {item.itemNumber} • {item.plantName} • {item.category}
                        </p>
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">Alignment:</span>
                            <span className={`font-medium ${getAlignmentColor(item.overallAlignment)}`}>
                              {item.overallAlignment}%
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">Demand Trend:</span>
                            {getTrendIcon(item.trends.demandTrend)}
                            <span className="ml-1 text-sm capitalize">{item.trends.demandTrend}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">Supply Trend:</span>
                            {getTrendIcon(item.trends.supplyTrend)}
                            <span className="ml-1 text-sm capitalize">{item.trends.supplyTrend}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCommentsEntityType("demand-supply-item");
                            setCommentsEntityId(item.itemId);
                            setShowComments(true);
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Comments
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredAlignmentData.length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No items found matching the selected filters.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedPlant("all");
                      setSelectedCategory("all");
                      setSelectedCriticality("all");
                      setSelectedAlignmentLevel("all");
                      setSelectedRiskLevel("all");
                    }}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed">
          {filteredAlignmentData.length > 0 ? (
            <div className="space-y-6">
              {filteredAlignmentData.map((item) => (
                <Card key={item.itemId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{item.itemDescription}</CardTitle>
                        <CardDescription>
                          {item.itemNumber} • {item.plantName}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={`${
                          item.criticality === 'critical' ? 'border-red-200 text-red-800' :
                          item.criticality === 'high' ? 'border-orange-200 text-orange-800' :
                          item.criticality === 'medium' ? 'border-yellow-200 text-yellow-800' :
                          'border-green-200 text-green-800'
                        }`}>
                          {item.criticality.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className={`${getAlignmentBadgeColor(getAlignmentCategory(item.overallAlignment))}`}>
                          {getAlignmentCategory(item.overallAlignment).toUpperCase()}
                        </Badge>
                        <span className={`font-medium ${getAlignmentColor(item.overallAlignment)}`}>
                          {item.overallAlignment}% Aligned
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCommentsEntityType("demand-supply-item");
                            setCommentsEntityId(item.itemId);
                            setShowComments(true);
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Comments
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setDrillDownItem(item.itemId)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Drill Down
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        {renderChart(item.data)}
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No items found matching the selected filters.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {commentsEntityType === "demand-supply-alignment" 
                ? "Page Comments - Demand/Supply Alignment" 
                : `Item Comments - ${filteredAlignmentData.find(item => item.itemId === commentsEntityId)?.itemDescription || 'Unknown Item'}`
              }
            </DialogTitle>
            <DialogDescription>
              {commentsEntityType === "demand-supply-alignment"
                ? "Collaborate on general demand/supply alignment topics, share insights, and discuss improvement strategies."
                : "Discuss specific issues, alignment concerns, and solutions for this item."
              }
            </DialogDescription>
          </DialogHeader>
          
          {commentsEntityId && (
            <div className="flex-1 overflow-hidden">
              <CommentsPanel
                entityType={commentsEntityType}
                entityId={commentsEntityId}
                height="60vh"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
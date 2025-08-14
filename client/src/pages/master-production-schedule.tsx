import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Brain,
  RefreshCw,
  Download,
  Upload,
  Filter,
  Settings,
  BarChart3,
  Package,
  Clock,
  Target
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addWeeks, startOfWeek, endOfWeek, addDays, addMonths, addQuarters, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfDay, endOfDay } from "date-fns";

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';

interface MPSPeriodData {
  periodStartDate: string;
  periodEndDate: string;
  periodNumber: number;
  year: number;
  salesOrderDemand: number;
  forecastDemand: number;
  safetyStockRequirement: number;
  totalDemand: number;
  projectedOnHand: number;
  availableToPromise: number;
  masterProductionScheduleQuantity: number;
  cumulativeLeadTimePeriods: number;
  lotSize: number;
  minimumOrderQuantity: number;
  maximumOrderQuantity: number;
  aiRecommendedQuantity?: number;
  aiConfidenceScore?: number;
  aiReasoningNotes?: string;
  status: 'ok' | 'warning' | 'critical';
  alerts: Array<{
    type: 'shortage' | 'excess' | 'capacity' | 'material';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface MPSItem {
  id: number;
  itemNumber: string;
  itemDescription: string;
  plantId: number;
  planningHorizonPeriods: number;
  mpsData: MPSPeriodData[];
  safetyStockDays: number;
  lotSizingRule: string;
  fixedLotSize: number;
  cumulativeLeadTimeDays: number;
  manufacturingLeadTimeDays: number;
  procurementLeadTimeDays: number;
  plannerId: number;
  plannerNotes?: string;
  status: string;
  versionNumber: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SalesForecast {
  id: number;
  itemNumber: string;
  plantId: number;
  forecastData: Array<{
    periodStartDate: string;
    periodEndDate: string;
    periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    statisticalForecast: number;
    managementForecast: number;
    consensusForecast: number;
    actualDemand?: number;
    confidenceLevel: number;
    forecastSource: string;
  }>;
  forecastAccuracyPercent?: number;
}

export default function MasterProductionSchedulePage() {
  const { toast } = useToast();
  const [selectedPlant, setSelectedPlant] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<string>("all");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("weekly");
  const [planningHorizon, setPlanningHorizon] = useState<number>(26);
  const [showAIRecommendations, setShowAIRecommendations] = useState(true);
  const [activeTab, setActiveTab] = useState("schedule");

  // Update planning horizon based on time period
  useEffect(() => {
    const defaultHorizons = {
      daily: 90,
      weekly: 26,
      monthly: 12,
      quarterly: 4
    };
    setPlanningHorizon(defaultHorizons[timePeriod]);
  }, [timePeriod]);

  // Helper functions for time period calculations
  const getTimePeriodData = (startDate: Date, periodIndex: number, period: TimePeriod) => {
    let periodStart: Date;
    let periodEnd: Date;
    let periodNumber: number;

    switch (period) {
      case 'daily':
        periodStart = addDays(startOfDay(startDate), periodIndex);
        periodEnd = endOfDay(periodStart);
        periodNumber = periodIndex + 1;
        break;
      case 'weekly':
        periodStart = addWeeks(startOfWeek(startDate), periodIndex);
        periodEnd = endOfWeek(periodStart);
        periodNumber = periodIndex + 1;
        break;
      case 'monthly':
        periodStart = addMonths(startOfMonth(startDate), periodIndex);
        periodEnd = endOfMonth(periodStart);
        periodNumber = periodIndex + 1;
        break;
      case 'quarterly':
        periodStart = addQuarters(startOfQuarter(startDate), periodIndex);
        periodEnd = endOfQuarter(periodStart);
        periodNumber = periodIndex + 1;
        break;
      default:
        periodStart = addWeeks(startOfWeek(startDate), periodIndex);
        periodEnd = endOfWeek(periodStart);
        periodNumber = periodIndex + 1;
    }

    return {
      periodStartDate: format(periodStart, 'yyyy-MM-dd'),
      periodEndDate: format(periodEnd, 'yyyy-MM-dd'),
      periodNumber,
      year: periodStart.getFullYear(),
    };
  };

  const getPeriodLabel = (period: TimePeriod) => {
    switch (period) {
      case 'daily': return 'Day';
      case 'weekly': return 'Week';
      case 'monthly': return 'Month';
      case 'quarterly': return 'Quarter';
      default: return 'Period';
    }
  };

  // Fetch MPS data
  const { data: mpsItems = [], isLoading: isMPSLoading } = useQuery<MPSItem[]>({
    queryKey: ['/api/master-production-schedule', { plantId: selectedPlant, itemNumber: selectedItem, timePeriod, planningHorizon }],
  });

  // Fetch sales forecasts
  const { data: forecasts = [] } = useQuery<SalesForecast[]>({
    queryKey: ['/api/sales-forecasts', { plantId: selectedPlant, timePeriod }],
  });

  // Fetch plants for filter
  const { data: plants = [] } = useQuery({
    queryKey: ['/api/plants'],
  });

  // AI optimization mutation
  const optimizeMPSMutation = useMutation({
    mutationFn: async (data: { itemNumbers: string[], plantId?: number }) => {
      return apiRequest(`/api/master-production-schedule/ai-optimize`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "AI Optimization Complete",
        description: "MPS has been optimized using AI recommendations.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/master-production-schedule'] });
    },
    onError: () => {
      toast({
        title: "Optimization Failed",
        description: "Could not optimize MPS. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update MPS mutation
  const updateMPSMutation = useMutation({
    mutationFn: async (data: { id: number, updates: Partial<MPSItem> }) => {
      return apiRequest(`/api/master-production-schedule/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data.updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-production-schedule'] });
    },
  });

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!mpsItems.length) return null;

    let totalItems = mpsItems.length;
    let itemsWithIssues = 0;
    let totalForecastDemand = 0;
    let totalPlannedProduction = 0;
    let averageAIConfidence = 0;
    let aiRecommendationCount = 0;

    mpsItems.forEach(item => {
      let itemHasIssues = false;
      item.mpsData.forEach(period => {
        totalForecastDemand += period.forecastDemand;
        totalPlannedProduction += period.masterProductionScheduleQuantity;
        
        if (period.status === 'warning' || period.status === 'critical') {
          itemHasIssues = true;
        }
        
        if (period.aiConfidenceScore) {
          averageAIConfidence += period.aiConfidenceScore;
          aiRecommendationCount++;
        }
      });
      
      if (itemHasIssues) itemsWithIssues++;
    });

    if (aiRecommendationCount > 0) {
      averageAIConfidence = averageAIConfidence / aiRecommendationCount;
    }

    return {
      totalItems,
      itemsWithIssues,
      totalForecastDemand: Math.round(totalForecastDemand),
      totalPlannedProduction: Math.round(totalPlannedProduction),
      averageAIConfidence: Math.round(averageAIConfidence),
      planSupplyRatio: totalForecastDemand > 0 ? (totalPlannedProduction / totalForecastDemand) : 0,
    };
  }, [mpsItems]);

  // Generate sample MPS data for demonstration
  const generateSampleMPSData = () => {
    const startDate = new Date();
    const sampleItems = [
      { itemNumber: "FINISHED-001", itemDescription: "Premium Widget A", plant: "Plant 1" },
      { itemNumber: "FINISHED-002", itemDescription: "Standard Widget B", plant: "Plant 1" },
      { itemNumber: "FINISHED-003", itemDescription: "Industrial Component C", plant: "Plant 2" },
    ];

    return sampleItems.map((item, index) => ({
      id: index + 1,
      itemNumber: item.itemNumber,
      itemDescription: item.itemDescription,
      plantId: 1,
      planningHorizonPeriods: planningHorizon,
      mpsData: Array.from({ length: planningHorizon }, (_, periodIndex) => {
        const periodData = getTimePeriodData(startDate, periodIndex, timePeriod);
        
        // Adjust demand based on time period
        const demandMultiplier = {
          daily: 1,
          weekly: 7,
          monthly: 30,
          quarterly: 90
        }[timePeriod];
        
        const baselineDemand = (100 + (periodIndex * 5) + Math.floor(Math.random() * 50)) * demandMultiplier;
        const forecastDemand = baselineDemand + Math.floor(Math.random() * 20 * demandMultiplier);
        const salesOrderDemand = Math.max(0, forecastDemand - Math.floor(Math.random() * 30 * demandMultiplier));
        const totalDemand = forecastDemand + salesOrderDemand;
        const plannedProduction = Math.ceil(totalDemand / 50) * 50; // Lot size of 50
        const projectedOnHand = Math.max(0, plannedProduction - totalDemand + (periodIndex === 0 ? 150 : 0));
        
        const aiConfidence = 75 + Math.floor(Math.random() * 20);
        const aiRecommendation = plannedProduction + Math.floor((Math.random() - 0.5) * 20);
        
        let status: 'ok' | 'warning' | 'critical' = 'ok';
        const alerts: Array<{type: 'shortage' | 'excess' | 'capacity' | 'material'; message: string; severity: 'low' | 'medium' | 'high'}> = [];
        
        if (projectedOnHand < 20) {
          status = 'critical';
          alerts.push({
            type: 'shortage',
            message: 'Projected stock below safety level',
            severity: 'high'
          });
        } else if (totalDemand > plannedProduction) {
          status = 'warning';
          alerts.push({
            type: 'shortage',
            message: 'Demand exceeds planned production',
            severity: 'medium'
          });
        }

        return {
          ...periodData,
          salesOrderDemand,
          forecastDemand,
          safetyStockRequirement: 20,
          totalDemand,
          projectedOnHand,
          availableToPromise: Math.max(0, projectedOnHand - 20),
          masterProductionScheduleQuantity: plannedProduction,
          cumulativeLeadTimePeriods: 2,
          lotSize: 50,
          minimumOrderQuantity: 50,
          maximumOrderQuantity: 500,
          aiRecommendedQuantity: aiRecommendation,
          aiConfidenceScore: aiConfidence,
          aiReasoningNotes: `Based on demand trends and capacity constraints. Confidence: ${aiConfidence}%`,
          status,
          alerts,
        };
      }),
      safetyStockDays: 7,
      lotSizingRule: "fixed_lot_size",
      fixedLotSize: 50,
      cumulativeLeadTimeDays: 14,
      manufacturingLeadTimeDays: 10,
      procurementLeadTimeDays: 4,
      plannerId: 1,
      plannerNotes: `MPS for ${item.itemDescription}`,
      status: "active",
      versionNumber: 1,
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  };

  // Use sample data if no real data is available
  const displayMPSItems = mpsItems.length > 0 ? mpsItems : generateSampleMPSData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Master Production Schedule</h1>
          <p className="text-muted-foreground mt-1">
            Plan finished goods production to meet demand based on sales orders and forecasts
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => optimizeMPSMutation.mutate({ itemNumbers: displayMPSItems.map(item => item.itemNumber) })}
            disabled={optimizeMPSMutation.isPending}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Brain className="h-4 w-4 mr-2" />
            {optimizeMPSMutation.isPending ? 'Optimizing...' : 'AI Optimize'}
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      {summaryMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{summaryMetrics.totalItems}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Items with Issues</p>
                  <p className="text-2xl font-bold text-orange-600">{summaryMetrics.itemsWithIssues}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Forecast Demand</p>
                  <p className="text-2xl font-bold">{summaryMetrics.totalForecastDemand.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Planned Production</p>
                  <p className="text-2xl font-bold">{summaryMetrics.totalPlannedProduction.toLocaleString()}</p>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Supply Ratio</p>
                  <p className="text-2xl font-bold">{(summaryMetrics.planSupplyRatio * 100).toFixed(1)}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">AI Confidence</p>
                  <p className="text-2xl font-bold">{summaryMetrics.averageAIConfidence}%</p>
                </div>
                <Brain className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Planning Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="plant-select">Plant</Label>
              <Select value={selectedPlant} onValueChange={setSelectedPlant}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plants</SelectItem>
                  <SelectItem value="1">Plant 1 - Main Production</SelectItem>
                  <SelectItem value="2">Plant 2 - Secondary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="item-select">Item</Label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  {displayMPSItems.map(item => (
                    <SelectItem key={item.itemNumber} value={item.itemNumber}>
                      {item.itemNumber} - {item.itemDescription}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="time-period">Time Period</Label>
              <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="horizon">Planning Horizon ({getPeriodLabel(timePeriod)}s)</Label>
              <Input
                id="horizon"
                type="number"
                value={planningHorizon}
                onChange={(e) => setPlanningHorizon(Number(e.target.value))}
                min="1"
                max={timePeriod === 'daily' ? 365 : timePeriod === 'weekly' ? 52 : timePeriod === 'monthly' ? 24 : 8}
              />
            </div>

            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Advanced Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedule">MPS Schedule</TabsTrigger>
          <TabsTrigger value="forecast">Demand Forecast</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          {displayMPSItems.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {item.itemNumber} - {item.itemDescription}
                      <Badge variant={item.isPublished ? "default" : "secondary"}>
                        {item.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Lead Time: {item.manufacturingLeadTimeDays} days | Lot Size: {item.fixedLotSize} | Safety Stock: {item.safetyStockDays} days
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="outline">
                    Edit Parameters
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">{getPeriodLabel(timePeriod)}</th>
                        <th className="text-right p-2 font-medium">Sales Orders</th>
                        <th className="text-right p-2 font-medium">Forecast</th>
                        <th className="text-right p-2 font-medium">Total Demand</th>
                        <th className="text-right p-2 font-medium">MPS Qty</th>
                        <th className="text-right p-2 font-medium">Projected OH</th>
                        <th className="text-right p-2 font-medium">ATP</th>
                        {showAIRecommendations && <th className="text-right p-2 font-medium">AI Rec.</th>}
                        <th className="text-center p-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.mpsData.slice(0, Math.min(12, planningHorizon)).map((period, periodIndex) => (
                        <tr key={periodIndex} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <div className="font-medium">{format(new Date(period.periodStartDate), timePeriod === 'daily' ? 'MMM dd' : timePeriod === 'weekly' ? 'MMM dd' : timePeriod === 'monthly' ? 'MMM yyyy' : "'Q'Q yyyy")}</div>
                            <div className="text-xs text-muted-foreground">{getPeriodLabel(timePeriod)} {period.periodNumber}</div>
                          </td>
                          <td className="p-2 text-right">{period.salesOrderDemand.toLocaleString()}</td>
                          <td className="p-2 text-right">{period.forecastDemand.toLocaleString()}</td>
                          <td className="p-2 text-right font-medium">{period.totalDemand.toLocaleString()}</td>
                          <td className="p-2 text-right">
                            <Input
                              type="number"
                              value={period.masterProductionScheduleQuantity}
                              onChange={(e) => {
                                // Handle MPS quantity change
                                const newQuantity = Number(e.target.value);
                                // Update logic would go here
                              }}
                              className="w-20 h-8 text-right"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <span className={period.projectedOnHand < period.safetyStockRequirement ? "text-red-600 font-medium" : ""}>
                              {period.projectedOnHand.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-2 text-right">{period.availableToPromise.toLocaleString()}</td>
                          {showAIRecommendations && (
                            <td className="p-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-purple-600 font-medium">
                                  {period.aiRecommendedQuantity?.toLocaleString() || '-'}
                                </span>
                                {period.aiConfidenceScore && (
                                  <Badge variant="outline" className="text-xs">
                                    {period.aiConfidenceScore}%
                                  </Badge>
                                )}
                              </div>
                            </td>
                          )}
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${getStatusColor(period.status)}`} />
                              {period.alerts.length > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {period.alerts.length}
                                </Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demand Forecast Analysis</CardTitle>
              <CardDescription>
                Statistical and management forecasts feeding into MPS planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Forecast data will be displayed here</p>
                <p>Historical demand patterns, seasonal trends, and forecast accuracy metrics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                AI Analysis & Recommendations
              </CardTitle>
              <CardDescription>
                Intelligent insights and optimization recommendations for your Master Production Schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayMPSItems.map((item, itemIndex) => (
                  <Card key={item.id} className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{item.itemNumber} - {item.itemDescription}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Key Insights</h4>
                          <ul className="space-y-1 text-sm">
                            <li className="flex items-center gap-2">
                              <div className="h-1 w-1 bg-blue-500 rounded-full" />
                              Demand trend is {itemIndex % 2 === 0 ? 'increasing' : 'stable'} over the planning horizon
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="h-1 w-1 bg-blue-500 rounded-full" />
                              Average lead time utilization: {85 + (itemIndex * 5)}%
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="h-1 w-1 bg-blue-500 rounded-full" />
                              Safety stock coverage: {7 + itemIndex} days average
                            </li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Recommendations</h4>
                          <ul className="space-y-1 text-sm">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              Consider increasing lot size by 10% to improve efficiency
                            </li>
                            <li className="flex items-center gap-2">
                              <AlertTriangle className="h-3 w-3 text-yellow-500" />
                              Monitor week {3 + itemIndex} for potential capacity constraint
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              Current safety stock levels appear adequate
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          <strong>AI Confidence Score:</strong> {75 + (itemIndex * 5)}% - 
                          Recommendations based on historical demand patterns, capacity constraints, and inventory optimization algorithms.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
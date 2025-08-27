import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowRight, BarChart3, Clock, Package, AlertCircle, CheckCircle, RefreshCw, Calendar as CalendarIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Cell, Pie, PieChart } from "recharts";

interface KPIMetric {
  id: string;
  title: string;
  value: number;
  unit: string;
  change: number;
  trend: "up" | "down" | "stable";
  target?: number;
  status: "good" | "warning" | "critical";
  description?: string;
}

export default function KPIPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<string>("7d");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  // Sample KPI data - in a real app this would come from the API
  const kpiData: KPIMetric[] = [
    {
      id: "oee",
      title: "Overall Equipment Effectiveness",
      value: 82.5,
      unit: "%",
      change: 3.2,
      trend: "up",
      target: 85,
      status: "warning",
      description: "Combined measure of availability, performance, and quality"
    },
    {
      id: "on-time-delivery",
      title: "On-Time Delivery",
      value: 94.3,
      unit: "%",
      change: -1.5,
      trend: "down",
      target: 95,
      status: "warning",
      description: "Percentage of orders delivered on schedule"
    },
    {
      id: "cycle-time",
      title: "Average Cycle Time",
      value: 4.2,
      unit: "hours",
      change: -0.5,
      trend: "down",
      target: 4.0,
      status: "good",
      description: "Average time to complete a production cycle"
    },
    {
      id: "quality-rate",
      title: "First Pass Yield",
      value: 97.8,
      unit: "%",
      change: 0.8,
      trend: "up",
      target: 98,
      status: "good",
      description: "Percentage of products that pass quality inspection on first attempt"
    },
    {
      id: "inventory-turnover",
      title: "Inventory Turnover",
      value: 8.5,
      unit: "turns",
      change: 0.3,
      trend: "up",
      target: 8,
      status: "good",
      description: "How many times inventory is sold and replaced"
    },
    {
      id: "resource-utilization",
      title: "Resource Utilization",
      value: 76.4,
      unit: "%",
      change: -2.1,
      trend: "down",
      target: 80,
      status: "warning",
      description: "Percentage of available resource capacity being used"
    }
  ];

  // Sample trend data for charts
  const trendData = [
    { date: "Mon", oee: 78, delivery: 96, quality: 97 },
    { date: "Tue", oee: 80, delivery: 94, quality: 98 },
    { date: "Wed", oee: 79, delivery: 95, quality: 96 },
    { date: "Thu", oee: 82, delivery: 93, quality: 97 },
    { date: "Fri", oee: 81, delivery: 94, quality: 98 },
    { date: "Sat", oee: 83, delivery: 95, quality: 98 },
    { date: "Sun", oee: 82.5, delivery: 94.3, quality: 97.8 }
  ];

  const departmentPerformance = [
    { name: "Assembly", value: 88, color: "#10b981" },
    { name: "Packaging", value: 85, color: "#3b82f6" },
    { name: "Quality", value: 92, color: "#8b5cf6" },
    { name: "Warehouse", value: 79, color: "#f59e0b" },
    { name: "Maintenance", value: 84, color: "#ef4444" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good": return "text-green-600 dark:text-green-400";
      case "warning": return "text-yellow-600 dark:text-yellow-400";
      case "critical": return "text-red-600 dark:text-red-400";
      default: return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good": return <CheckCircle className="w-4 h-4" />;
      case "warning": return <AlertCircle className="w-4 h-4" />;
      case "critical": return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Key Performance Indicators</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor your factory's critical performance metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="assembly">Assembly</SelectItem>
              <SelectItem value="packaging">Packaging</SelectItem>
              <SelectItem value="quality">Quality Control</SelectItem>
              <SelectItem value="warehouse">Warehouse</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setRefreshKey(prev => prev + 1)}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiData.map((kpi) => (
          <Card key={kpi.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-medium">{kpi.title}</CardTitle>
                <div className={`flex items-center gap-1 ${getStatusColor(kpi.status)}`}>
                  {getStatusIcon(kpi.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold">
                    {kpi.value}{kpi.unit === "%" ? "" : " "}
                    <span className="text-sm font-normal text-gray-500">{kpi.unit}</span>
                  </span>
                  <div className={`flex items-center gap-1 text-sm ${kpi.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                    {kpi.trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>{Math.abs(kpi.change)}{kpi.unit === "%" ? "%" : ` ${kpi.unit}`}</span>
                  </div>
                </div>
                
                {kpi.target && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Target: {kpi.target}{kpi.unit}</span>
                      <span className="text-gray-500">
                        {((kpi.value / kpi.target) * 100).toFixed(0)}% of target
                      </span>
                    </div>
                    <Progress value={(kpi.value / kpi.target) * 100} className="h-2" />
                  </div>
                )}
                
                {kpi.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                oee: { label: "OEE %", color: "#10b981" },
                delivery: { label: "On-Time Delivery %", color: "#3b82f6" },
                quality: { label: "Quality %", color: "#8b5cf6" },
              }}
              className="h-80"
            >
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="oee"
                  stroke="var(--color-oee)"
                  strokeWidth={2}
                  name="OEE %"
                />
                <Line
                  type="monotone"
                  dataKey="delivery"
                  stroke="var(--color-delivery)"
                  strokeWidth={2}
                  name="On-Time Delivery %"
                />
                <Line
                  type="monotone"
                  dataKey="quality"
                  stroke="var(--color-quality)"
                  strokeWidth={2}
                  name="Quality %"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: "Performance %", color: "#3b82f6" },
              }}
              className="h-80"
            >
              <BarChart data={departmentPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {departmentPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{kpiData.filter(k => k.status === "good").length}</div>
              <div className="text-sm text-gray-500">Meeting Target</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{kpiData.filter(k => k.status === "warning").length}</div>
              <div className="text-sm text-gray-500">Need Attention</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{kpiData.filter(k => k.status === "critical").length}</div>
              <div className="text-sm text-gray-500">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{kpiData.filter(k => k.trend === "up").length}</div>
              <div className="text-sm text-gray-500">Improving</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
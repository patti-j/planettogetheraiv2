import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { 
  Bot, 
  Settings, 
  Activity, 
  TrendingUp, 
  Zap, 
  Building, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Brain,
  Gauge,
  PlayCircle,
  RefreshCw,
  BarChart3,
  History,
  Cpu,
  Sparkles,
  TrendingDown,
  Shield,
  DollarSign
} from "lucide-react";

export default function AutonomousOptimizationPage() {
  const [selectedProfile, setSelectedProfile] = useState("standard");
  const [globalOptimizationEnabled, setGlobalOptimizationEnabled] = useState(false);
  const [timeRange, setTimeRange] = useState("24h");
  
  // Fetch plants data
  const { data: plants = [] } = useQuery({
    queryKey: ["/api/plants"],
  });

  // Mock metrics data
  const currentMetrics = {
    totalOptimizations: 1847,
    successRate: 94.2,
    averageImprovement: 12.8,
    costSavings: 485000
  };

  // Performance data for charts
  const performanceData = [
    { time: "00:00", efficiency: 88, quality: 95, cost: 92 },
    { time: "04:00", efficiency: 90, quality: 96, cost: 91 },
    { time: "08:00", efficiency: 92, quality: 94, cost: 89 },
    { time: "12:00", efficiency: 94, quality: 97, cost: 88 },
    { time: "16:00", efficiency: 91, quality: 96, cost: 90 },
    { time: "20:00", efficiency: 93, quality: 95, cost: 89 },
    { time: "24:00", efficiency: 95, quality: 98, cost: 87 },
  ];

  const plantPerformance = [
    { plant: "Chicago", value: 94, status: "optimal" },
    { plant: "Munich", value: 89, status: "good" },
    { plant: "Shanghai", value: 96, status: "optimal" },
    { plant: "Tokyo", value: 91, status: "good" },
    { plant: "Mexico City", value: 87, status: "attention" },
    { plant: "São Paulo", value: 92, status: "good" },
  ];

  const optimizationHistory = [
    { id: 1, timestamp: "14:20", type: "Demand Adjustment", plant: "Chicago", impact: "+12%", status: "success" },
    { id: 2, timestamp: "13:45", type: "Resource Reallocation", plant: "Munich", impact: "+8%", status: "success" },
    { id: 3, timestamp: "12:30", type: "Quality Optimization", plant: "Shanghai", impact: "+15%", status: "success" },
    { id: 4, timestamp: "11:15", type: "Disruption Response", plant: "Tokyo", impact: "Resolved", status: "warning" },
    { id: 5, timestamp: "10:00", type: "Cost Reduction", plant: "Mexico City", impact: "-5%", status: "success" },
  ];

  const distributionData = [
    { name: "Production", value: 35, color: "#3B82F6" },
    { name: "Quality", value: 25, color: "#10B981" },
    { name: "Logistics", value: 20, color: "#F59E0B" },
    { name: "Maintenance", value: 12, color: "#8B5CF6" },
    { name: "Safety", value: 8, color: "#EF4444" },
  ];

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  // Simulated data updates
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real app, this would fetch new data
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
        <div className="container mx-auto p-4 lg:p-6 space-y-6">
          
          {/* Enhanced Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Autonomous Optimization Control Center
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    AI-powered production orchestration and intelligent resource management
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant={globalOptimizationEnabled ? "default" : "outline"}
                  className={globalOptimizationEnabled ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700" : ""}
                  onClick={() => setGlobalOptimizationEnabled(!globalOptimizationEnabled)}
                >
                  {globalOptimizationEnabled ? (
                    <>
                      <Cpu className="w-4 h-4 mr-2 animate-pulse" />
                      AI Active
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Activate AI
                    </>
                  )}
                </Button>
                <Button variant="outline" size="icon">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Metrics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Active Optimizations</p>
                    <p className="text-3xl font-bold text-green-800 dark:text-green-300 mt-2">{currentMetrics.totalOptimizations.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-600">+12% from last hour</span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Success Rate</p>
                    <p className="text-3xl font-bold text-blue-800 dark:text-blue-300 mt-2">{currentMetrics.successRate}%</p>
                    <Progress value={currentMetrics.successRate} className="mt-2 h-2" />
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Avg Improvement</p>
                    <p className="text-3xl font-bold text-purple-800 dark:text-purple-300 mt-2">+{currentMetrics.averageImprovement}%</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-purple-600">AI-optimized</span>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Cost Savings</p>
                    <p className="text-3xl font-bold text-amber-800 dark:text-amber-300 mt-2">${(currentMetrics.costSavings / 1000).toFixed(0)}K</p>
                    <div className="flex items-center gap-1 mt-2">
                      <DollarSign className="w-4 h-4 text-amber-600" />
                      <span className="text-xs text-amber-600">This month</span>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                    <Gauge className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Real-Time Performance Metrics
                </CardTitle>
                <CardDescription>
                  Live tracking of efficiency, quality, and cost optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="efficiency" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="quality" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="cost" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Plant Performance Distribution
                </CardTitle>
                <CardDescription>
                  Optimization efficiency across all facilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={plantPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="plant" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {plantPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Main Control and Monitoring Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Optimization Control Panel */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Optimization Control Panel
                  </CardTitle>
                  <CardDescription>
                    Configure and monitor autonomous optimization parameters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="parameters" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="parameters">Parameters</TabsTrigger>
                      <TabsTrigger value="distribution">Distribution</TabsTrigger>
                      <TabsTrigger value="constraints">Constraints</TabsTrigger>
                    </TabsList>

                    <TabsContent value="parameters" className="space-y-4 mt-4">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Demand Response Sensitivity</Label>
                            <span className="text-sm text-gray-500">75%</span>
                          </div>
                          <Slider defaultValue={[75]} max={100} step={5} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Disruption Tolerance</Label>
                            <span className="text-sm text-gray-500">60%</span>
                          </div>
                          <Slider defaultValue={[60]} max={100} step={5} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Quality Threshold</Label>
                            <span className="text-sm text-gray-500">95%</span>
                          </div>
                          <Slider defaultValue={[95]} max={100} step={1} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Efficiency Target</Label>
                            <span className="text-sm text-gray-500">85%</span>
                          </div>
                          <Slider defaultValue={[85]} max={100} step={5} />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="distribution" className="mt-4">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={distributionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}: ${entry.value}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {distributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </TabsContent>

                    <TabsContent value="constraints" className="space-y-4 mt-4">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Max Resource Utilization</Label>
                            <span className="text-sm text-gray-500">90%</span>
                          </div>
                          <Slider defaultValue={[90]} max={100} step={5} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Min Quality Level</Label>
                            <span className="text-sm text-gray-500">95%</span>
                          </div>
                          <Slider defaultValue={[95]} max={100} step={1} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Max Cost Increase</Label>
                            <span className="text-sm text-gray-500">5%</span>
                          </div>
                          <Slider defaultValue={[5]} max={20} step={1} />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">Safety buffers enabled</span>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* AI Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Detected demand spike in Product Line A. Optimization adjusted production by +15%.
                      </AlertDescription>
                    </Alert>
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Successfully resolved material shortage through automated supplier switching.
                      </AlertDescription>
                    </Alert>
                    <Alert>
                      <Zap className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Predictive maintenance scheduled for Shanghai equipment.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>

              {/* Optimization History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Recent Optimizations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-2">
                      {optimizationHistory.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                          <div className={`p-1 rounded-full ${
                            item.status === 'success' ? 'bg-green-100' : 'bg-yellow-100'
                          }`}>
                            {item.status === 'success' ? 
                              <CheckCircle className="w-3 h-3 text-green-600" /> :
                              <AlertTriangle className="w-3 h-3 text-yellow-600" />
                            }
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">{item.type}</p>
                              <Badge variant="secondary" className="text-xs">
                                {item.impact}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">{item.plant} • {item.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
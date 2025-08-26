import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  DollarSign,
  Power,
  Factory,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Sliders,
  Package,
  Users,
  Truck
} from "lucide-react";

interface PlanningProcessAlgorithms {
  productionScheduling: string; // Algorithm ID for production scheduling
  orderOptimization: string; // Algorithm ID for order optimization
  resequencing: string; // Algorithm ID for drag & drop resequencing
  demandPlanning: string; // Algorithm ID for demand planning
  mrp: string; // Algorithm ID for Material Requirements Planning
  mps: string; // Algorithm ID for Master Production Schedule
  capacityPlanning: string; // Algorithm ID for capacity planning
}

interface OptimizationModules {
  scheduling: boolean;
  productionPlanning: boolean;
  demandPlanning: boolean;
  inventoryOptimization: boolean;
  resourceAllocation: boolean;
  qualityControl: boolean;
  maintenancePlanning: boolean;
  supplyChain: boolean;
}

interface PlantOptimizationSettings {
  [plantId: number]: {
    enabled: boolean;
    profile: string;
    priority: number;
    modules: OptimizationModules;
    algorithms: PlanningProcessAlgorithms;
    constraints: {
      maxUtilization: number;
      minQuality: number;
      maxCost: number;
    };
  };
}

export default function AutonomousOptimizationPage() {
  const [selectedProfile, setSelectedProfile] = useState("standard");
  const [globalOptimizationEnabled, setGlobalOptimizationEnabled] = useState(false);
  const [timeRange, setTimeRange] = useState("24h");
  const [showPlantSettings, setShowPlantSettings] = useState(false);
  const [plantSettings, setPlantSettings] = useState<PlantOptimizationSettings>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch plants data
  const { data: plants = [] as any[] } = useQuery({
    queryKey: ["/api/plants"],
  });

  // Fetch available algorithms for selection
  const { data: algorithms = [] as any[] } = useQuery({
    queryKey: ['/api/optimization/algorithms'],
    queryFn: async () => {
      const response = await fetch('/api/optimization/algorithms');
      if (!response.ok) throw new Error('Failed to fetch algorithms');
      return response.json();
    }
  });

  // Fetch existing plant optimization settings
  const { data: savedPlantSettings = {} } = useQuery({
    queryKey: ['/api/plant-optimization-settings'],
    queryFn: async () => {
      const response = await fetch('/api/plant-optimization-settings');
      if (!response.ok) throw new Error('Failed to fetch plant settings');
      return response.json();
    }
  });

  // Initialize plant settings when plants data is loaded, merging with saved settings
  useEffect(() => {
    if (plants.length > 0 && algorithms.length > 0 && Object.keys(plantSettings).length === 0) {
      const initialSettings: PlantOptimizationSettings = {};
      
      // Get default algorithms by category
      const getDefaultAlgorithm = (category: string) => {
        const categoryAlgorithms = algorithms.filter((alg: any) => 
          alg.category?.toLowerCase().includes(category.toLowerCase()) || 
          alg.name?.toLowerCase().includes(category.toLowerCase())
        );
        return categoryAlgorithms.length > 0 ? categoryAlgorithms[0].name : 'Standard Algorithm';
      };

      plants.forEach((plant: any) => {
        // Check if we have saved settings for this plant
        const savedForPlant = savedPlantSettings[plant.id];
        
        initialSettings[plant.id] = savedForPlant || {
          enabled: plant.isActive || false,
          profile: "standard",
          priority: 1,
          modules: {
            scheduling: true,
            productionPlanning: true,
            demandPlanning: true,
            inventoryOptimization: false,
            resourceAllocation: true,
            qualityControl: false,
            maintenancePlanning: false,
            supplyChain: false
          },
          algorithms: {
            productionScheduling: getDefaultAlgorithm('scheduling'),
            orderOptimization: getDefaultAlgorithm('optimization'),
            resequencing: getDefaultAlgorithm('sequence'),
            demandPlanning: getDefaultAlgorithm('demand'),
            mrp: getDefaultAlgorithm('mrp'),
            mps: getDefaultAlgorithm('mps'),
            capacityPlanning: getDefaultAlgorithm('capacity')
          },
          constraints: {
            maxUtilization: 90,
            minQuality: 95,
            maxCost: 105
          }
        };
      });
      setPlantSettings(initialSettings);
    }
  }, [plants, algorithms, savedPlantSettings]);

  // Save plant optimization settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: PlantOptimizationSettings) => {
      const response = await fetch('/api/plant-optimization-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save plant settings');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plant-optimization-settings'] });
      setShowPlantSettings(false);
      toast({ 
        title: "Settings saved successfully", 
        description: "Plant optimization settings have been updated." 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error saving settings", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Toggle plant optimization
  const togglePlantOptimization = (plantId: number) => {
    setPlantSettings(prev => ({
      ...prev,
      [plantId]: {
        ...prev[plantId],
        enabled: !prev[plantId]?.enabled
      }
    }));
  };

  // Update plant profile
  const updatePlantProfile = (plantId: number, profile: string) => {
    setPlantSettings(prev => ({
      ...prev,
      [plantId]: {
        ...prev[plantId],
        profile
      }
    }));
  };

  // Update plant priority
  const updatePlantPriority = (plantId: number, priority: number) => {
    setPlantSettings(prev => ({
      ...prev,
      [plantId]: {
        ...prev[plantId],
        priority
      }
    }));
  };

  // Update plant algorithm for specific planning process
  const updatePlantAlgorithm = (plantId: number, processType: keyof PlanningProcessAlgorithms, algorithm: string) => {
    setPlantSettings(prev => ({
      ...prev,
      [plantId]: {
        ...prev[plantId],
        algorithms: {
          ...prev[plantId]?.algorithms,
          [processType]: algorithm
        }
      }
    }));
  };

  // Mock metrics data
  const currentMetrics = {
    totalOptimizations: 1847,
    successRate: 94.2,
    averageImprovement: 12.8,
    costSavings: 485000,
    activePlants: Object.values(plantSettings).filter(s => s?.enabled).length,
    totalPlants: plants.length
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
        <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
          
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
                  variant="outline"
                  onClick={() => setShowPlantSettings(true)}
                  className="relative"
                >
                  <Sliders className="w-4 h-4 mr-2" />
                  Plant Settings
                  {currentMetrics.activePlants > 0 && (
                    <Badge variant="default" className="ml-2 bg-green-500">
                      {currentMetrics.activePlants}/{currentMetrics.totalPlants}
                    </Badge>
                  )}
                </Button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Active Optimizations</p>
                    <p className="text-2xl lg:text-3xl font-bold text-green-800 dark:text-green-300 mt-1 truncate">{currentMetrics.totalOptimizations.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-green-600 flex-shrink-0" />
                      <span className="text-xs text-green-600 truncate">+12% from last hour</span>
                    </div>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full flex-shrink-0">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Success Rate</p>
                    <p className="text-2xl lg:text-3xl font-bold text-blue-800 dark:text-blue-300 mt-1">{currentMetrics.successRate}%</p>
                    <Progress value={currentMetrics.successRate} className="mt-2 h-1.5" />
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full flex-shrink-0">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Avg Improvement</p>
                    <p className="text-2xl lg:text-3xl font-bold text-purple-800 dark:text-purple-300 mt-1">+{currentMetrics.averageImprovement}%</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Sparkles className="w-3 h-3 text-purple-600 flex-shrink-0" />
                      <span className="text-xs text-purple-600 truncate">AI-optimized</span>
                    </div>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-full flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Cost Savings</p>
                    <p className="text-2xl lg:text-3xl font-bold text-amber-800 dark:text-amber-300 mt-1 truncate">${(currentMetrics.costSavings / 1000).toFixed(0)}K</p>
                    <div className="flex items-center gap-1 mt-1">
                      <DollarSign className="w-3 h-3 text-amber-600 flex-shrink-0" />
                      <span className="text-xs text-amber-600 truncate">This month</span>
                    </div>
                  </div>
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full flex-shrink-0">
                    <Gauge className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
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
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
            {/* Optimization Control Panel */}
            <div className="lg:col-span-3">
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
            <div className="lg:col-span-2 space-y-4">
              {/* Plant Optimization Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Factory className="w-5 h-5" />
                    Plant Status
                  </CardTitle>
                  <CardDescription>
                    {currentMetrics.activePlants} of {currentMetrics.totalPlants} plants optimized
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[240px]">
                    <div className="space-y-3">
                      {plants.map((plant: any) => {
                        const settings = plantSettings[plant.id];
                        return (
                          <div 
                            key={plant.id} 
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                            onClick={() => setShowPlantSettings(true)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full ${
                                settings?.enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                              }`} />
                              <div>
                                <p className="font-medium text-sm">{plant.name}</p>
                                <p className="text-xs text-gray-500">{plant.location || plant.city}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {settings?.enabled && (
                                <Badge variant="outline" className="text-xs">
                                  {settings.profile}
                                </Badge>
                              )}
                              <Power className={`w-4 h-4 ${
                                settings?.enabled ? 'text-green-600' : 'text-gray-400'
                              }`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

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
                  <ScrollArea className="h-[320px]">
                    <div className="space-y-3">
                      {optimizationHistory.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className={`p-1.5 rounded-full ${
                            item.status === 'success' ? 'bg-green-100' : 'bg-yellow-100'
                          }`}>
                            {item.status === 'success' ? 
                              <CheckCircle className="w-4 h-4 text-green-600" /> :
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm truncate">{item.type}</p>
                              <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                                {item.impact}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{item.plant}</p>
                            <p className="text-xs text-gray-400 mt-1">{item.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Plant Settings Dialog */}
          <Dialog open={showPlantSettings} onOpenChange={setShowPlantSettings}>
            <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Factory className="w-5 h-5" />
                  Plant Optimization Settings
                </DialogTitle>
                <DialogDescription>
                  Configure autonomous optimization for individual plants
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Label>Quick Actions:</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newSettings = { ...plantSettings };
                        Object.keys(newSettings).forEach(id => {
                          newSettings[parseInt(id)].enabled = true;
                        });
                        setPlantSettings(newSettings);
                      }}
                    >
                      Enable All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newSettings = { ...plantSettings };
                        Object.keys(newSettings).forEach(id => {
                          newSettings[parseInt(id)].enabled = false;
                        });
                        setPlantSettings(newSettings);
                      }}
                    >
                      Disable All
                    </Button>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    {Object.values(plantSettings).filter(s => s?.enabled).length} of {plants.length} Active
                  </Badge>
                </div>

                <ScrollArea className="h-[50vh] pr-4">
                  <div className="space-y-4">
                    {plants.map((plant: any) => {
                      const settings = plantSettings[plant.id];
                      if (!settings) return null;
                      
                      return (
                        <Card key={plant.id} className={settings.enabled ? "border-green-500" : ""}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Switch
                                  checked={settings.enabled}
                                  onCheckedChange={() => togglePlantOptimization(plant.id)}
                                />
                                <div>
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {plant.name}
                                  </CardTitle>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {plant.city}, {plant.country}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={settings.enabled ? "default" : "secondary"}>
                                {settings.enabled ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                          </CardHeader>
                          
                          {settings.enabled && (
                            <CardContent className="pt-0">
                              <Tabs defaultValue="general" className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                  <TabsTrigger value="general">General</TabsTrigger>
                                  <TabsTrigger value="algorithms">Algorithms</TabsTrigger>
                                  <TabsTrigger value="modules">Modules</TabsTrigger>
                                  <TabsTrigger value="constraints">Constraints</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="general" className="space-y-4 mt-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-sm">Optimization Profile</Label>
                                      <Select 
                                        value={settings.profile} 
                                        onValueChange={(value) => updatePlantProfile(plant.id, value)}
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="standard">Standard</SelectItem>
                                          <SelectItem value="aggressive">Aggressive</SelectItem>
                                          <SelectItem value="quality">Quality-First</SelectItem>
                                          <SelectItem value="cost">Cost-Optimized</SelectItem>
                                          <SelectItem value="balanced">Balanced</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label className="text-sm">Priority Level</Label>
                                      <Select 
                                        value={settings.priority.toString()} 
                                        onValueChange={(value) => updatePlantPriority(plant.id, parseInt(value))}
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="1">High Priority</SelectItem>
                                          <SelectItem value="2">Medium Priority</SelectItem>
                                          <SelectItem value="3">Low Priority</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label className="text-sm">Current Status</Label>
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${plant.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                        <span className="text-sm">
                                          {plant.operationalMetrics?.efficiency || 85}% Efficiency
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </TabsContent>

                                <TabsContent value="algorithms" className="space-y-4 mt-4">
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                      <Brain className="w-4 h-4 text-blue-600" />
                                      <Label className="text-sm font-medium">Planning Process Algorithms</Label>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                      {/* Production Scheduling */}
                                      <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Clock className="w-4 h-4 text-blue-600" />
                                          <Label className="text-sm font-medium">Production Scheduling</Label>
                                        </div>
                                        <Select 
                                          value={settings.algorithms?.productionScheduling || 'Standard Algorithm'} 
                                          onValueChange={(value) => updatePlantAlgorithm(plant.id, 'productionScheduling', value)}
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Select algorithm..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {algorithms.filter((alg: any) => 
                                              alg.category?.toLowerCase().includes('scheduling') || 
                                              alg.name?.toLowerCase().includes('scheduling') ||
                                              alg.name?.toLowerCase().includes('asap') ||
                                              alg.name?.toLowerCase().includes('alap')
                                            ).map((alg: any) => (
                                              <SelectItem key={alg.id} value={alg.name}>{alg.displayName || alg.name}</SelectItem>
                                            ))}
                                            <SelectItem value="Standard Algorithm">Standard Algorithm</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Order Optimization */}
                                      <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Target className="w-4 h-4 text-green-600" />
                                          <Label className="text-sm font-medium">Order Optimization</Label>
                                        </div>
                                        <Select 
                                          value={settings.algorithms?.orderOptimization || 'Standard Algorithm'} 
                                          onValueChange={(value) => updatePlantAlgorithm(plant.id, 'orderOptimization', value)}
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Select algorithm..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {algorithms.filter((alg: any) => 
                                              alg.category?.toLowerCase().includes('optimization') || 
                                              alg.name?.toLowerCase().includes('optimization') ||
                                              alg.name?.toLowerCase().includes('order')
                                            ).map((alg: any) => (
                                              <SelectItem key={alg.id} value={alg.name}>{alg.displayName || alg.name}</SelectItem>
                                            ))}
                                            <SelectItem value="Standard Algorithm">Standard Algorithm</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Resequencing (Drag & Drop) */}
                                      <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <div className="flex items-center gap-2 mb-2">
                                          <RefreshCw className="w-4 h-4 text-purple-600" />
                                          <Label className="text-sm font-medium">Resequencing (Drag & Drop)</Label>
                                        </div>
                                        <Select 
                                          value={settings.algorithms?.resequencing || 'Standard Algorithm'} 
                                          onValueChange={(value) => updatePlantAlgorithm(plant.id, 'resequencing', value)}
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Select algorithm..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {algorithms.filter((alg: any) => 
                                              alg.category?.toLowerCase().includes('sequence') || 
                                              alg.name?.toLowerCase().includes('sequence') ||
                                              alg.name?.toLowerCase().includes('resequence')
                                            ).map((alg: any) => (
                                              <SelectItem key={alg.id} value={alg.name}>{alg.displayName || alg.name}</SelectItem>
                                            ))}
                                            <SelectItem value="Standard Algorithm">Standard Algorithm</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Demand Planning */}
                                      <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <div className="flex items-center gap-2 mb-2">
                                          <TrendingUp className="w-4 h-4 text-orange-600" />
                                          <Label className="text-sm font-medium">Demand Planning</Label>
                                        </div>
                                        <Select 
                                          value={settings.algorithms?.demandPlanning || 'Standard Algorithm'} 
                                          onValueChange={(value) => updatePlantAlgorithm(plant.id, 'demandPlanning', value)}
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Select algorithm..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {algorithms.filter((alg: any) => 
                                              alg.category?.toLowerCase().includes('demand') || 
                                              alg.name?.toLowerCase().includes('demand') ||
                                              alg.name?.toLowerCase().includes('forecast')
                                            ).map((alg: any) => (
                                              <SelectItem key={alg.id} value={alg.name}>{alg.displayName || alg.name}</SelectItem>
                                            ))}
                                            <SelectItem value="Standard Algorithm">Standard Algorithm</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* MRP */}
                                      <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Package className="w-4 h-4 text-red-600" />
                                          <Label className="text-sm font-medium">Material Requirements Planning (MRP)</Label>
                                        </div>
                                        <Select 
                                          value={settings.algorithms?.mrp || 'Standard Algorithm'} 
                                          onValueChange={(value) => updatePlantAlgorithm(plant.id, 'mrp', value)}
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Select algorithm..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {algorithms.filter((alg: any) => 
                                              alg.category?.toLowerCase().includes('mrp') || 
                                              alg.name?.toLowerCase().includes('mrp') ||
                                              alg.name?.toLowerCase().includes('material')
                                            ).map((alg: any) => (
                                              <SelectItem key={alg.id} value={alg.name}>{alg.displayName || alg.name}</SelectItem>
                                            ))}
                                            <SelectItem value="Standard Algorithm">Standard Algorithm</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* MPS */}
                                      <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <div className="flex items-center gap-2 mb-2">
                                          <BarChart3 className="w-4 h-4 text-indigo-600" />
                                          <Label className="text-sm font-medium">Master Production Schedule (MPS)</Label>
                                        </div>
                                        <Select 
                                          value={settings.algorithms?.mps || 'Standard Algorithm'} 
                                          onValueChange={(value) => updatePlantAlgorithm(plant.id, 'mps', value)}
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Select algorithm..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {algorithms.filter((alg: any) => 
                                              alg.category?.toLowerCase().includes('mps') || 
                                              alg.name?.toLowerCase().includes('mps') ||
                                              alg.name?.toLowerCase().includes('master')
                                            ).map((alg: any) => (
                                              <SelectItem key={alg.id} value={alg.name}>{alg.displayName || alg.name}</SelectItem>
                                            ))}
                                            <SelectItem value="Standard Algorithm">Standard Algorithm</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Capacity Planning */}
                                      <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Gauge className="w-4 h-4 text-teal-600" />
                                          <Label className="text-sm font-medium">Capacity Planning</Label>
                                        </div>
                                        <Select 
                                          value={settings.algorithms?.capacityPlanning || 'Standard Algorithm'} 
                                          onValueChange={(value) => updatePlantAlgorithm(plant.id, 'capacityPlanning', value)}
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Select algorithm..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {algorithms.filter((alg: any) => 
                                              alg.category?.toLowerCase().includes('capacity') || 
                                              alg.name?.toLowerCase().includes('capacity') ||
                                              alg.name?.toLowerCase().includes('resource')
                                            ).map((alg: any) => (
                                              <SelectItem key={alg.id} value={alg.name}>{alg.displayName || alg.name}</SelectItem>
                                            ))}
                                            <SelectItem value="Standard Algorithm">Standard Algorithm</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                                      <div className="flex items-start gap-2">
                                        <Bot className="w-4 h-4 text-blue-600 mt-0.5" />
                                        <div className="text-sm">
                                          <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Algorithm Selection Note</p>
                                          <p className="text-blue-700 dark:text-blue-300">
                                            These algorithms will be used when autonomous optimization is triggered for this plant. 
                                            Each planning process can use a different algorithm optimized for its specific requirements.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="modules" className="space-y-4 mt-4">
                                  <div className="space-y-3">
                                    <Label className="text-sm font-medium">Active Optimization Modules</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <Clock className="w-4 h-4 text-blue-600" />
                                          <Label className="text-sm font-normal cursor-pointer">Production Scheduling</Label>
                                        </div>
                                        <Switch
                                          checked={settings.modules?.scheduling || false}
                                          onCheckedChange={(checked) => {
                                            setPlantSettings(prev => ({
                                              ...prev,
                                              [plant.id]: {
                                                ...prev[plant.id],
                                                modules: {
                                                  ...prev[plant.id].modules,
                                                  scheduling: checked
                                                }
                                              }
                                            }));
                                          }}
                                        />
                                      </div>
                                      
                                      <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <Factory className="w-4 h-4 text-green-600" />
                                          <Label className="text-sm font-normal cursor-pointer">Production Planning</Label>
                                        </div>
                                        <Switch
                                          checked={settings.modules?.productionPlanning || false}
                                          onCheckedChange={(checked) => {
                                            setPlantSettings(prev => ({
                                              ...prev,
                                              [plant.id]: {
                                                ...prev[plant.id],
                                                modules: {
                                                  ...prev[plant.id].modules,
                                                  productionPlanning: checked
                                                }
                                              }
                                            }));
                                          }}
                                        />
                                      </div>
                                      
                                      <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <TrendingUp className="w-4 h-4 text-purple-600" />
                                          <Label className="text-sm font-normal cursor-pointer">Demand Planning</Label>
                                        </div>
                                        <Switch
                                          checked={settings.modules?.demandPlanning || false}
                                          onCheckedChange={(checked) => {
                                            setPlantSettings(prev => ({
                                              ...prev,
                                              [plant.id]: {
                                                ...prev[plant.id],
                                                modules: {
                                                  ...prev[plant.id].modules,
                                                  demandPlanning: checked
                                                }
                                              }
                                            }));
                                          }}
                                        />
                                      </div>
                                      
                                      <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <Package className="w-4 h-4 text-orange-600" />
                                          <Label className="text-sm font-normal cursor-pointer">Inventory Optimization</Label>
                                        </div>
                                        <Switch
                                          checked={settings.modules?.inventoryOptimization || false}
                                          onCheckedChange={(checked) => {
                                            setPlantSettings(prev => ({
                                              ...prev,
                                              [plant.id]: {
                                                ...prev[plant.id],
                                                modules: {
                                                  ...prev[plant.id].modules,
                                                  inventoryOptimization: checked
                                                }
                                              }
                                            }));
                                          }}
                                        />
                                      </div>
                                      
                                      <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <Users className="w-4 h-4 text-cyan-600" />
                                          <Label className="text-sm font-normal cursor-pointer">Resource Allocation</Label>
                                        </div>
                                        <Switch
                                          checked={settings.modules?.resourceAllocation || false}
                                          onCheckedChange={(checked) => {
                                            setPlantSettings(prev => ({
                                              ...prev,
                                              [plant.id]: {
                                                ...prev[plant.id],
                                                modules: {
                                                  ...prev[plant.id].modules,
                                                  resourceAllocation: checked
                                                }
                                              }
                                            }));
                                          }}
                                        />
                                      </div>
                                      
                                      <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                                          <Label className="text-sm font-normal cursor-pointer">Quality Control</Label>
                                        </div>
                                        <Switch
                                          checked={settings.modules?.qualityControl || false}
                                          onCheckedChange={(checked) => {
                                            setPlantSettings(prev => ({
                                              ...prev,
                                              [plant.id]: {
                                                ...prev[plant.id],
                                                modules: {
                                                  ...prev[plant.id].modules,
                                                  qualityControl: checked
                                                }
                                              }
                                            }));
                                          }}
                                        />
                                      </div>
                                      
                                      <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <Settings className="w-4 h-4 text-gray-600" />
                                          <Label className="text-sm font-normal cursor-pointer">Maintenance Planning</Label>
                                        </div>
                                        <Switch
                                          checked={settings.modules?.maintenancePlanning || false}
                                          onCheckedChange={(checked) => {
                                            setPlantSettings(prev => ({
                                              ...prev,
                                              [plant.id]: {
                                                ...prev[plant.id],
                                                modules: {
                                                  ...prev[plant.id].modules,
                                                  maintenancePlanning: checked
                                                }
                                              }
                                            }));
                                          }}
                                        />
                                      </div>
                                      
                                      <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <Truck className="w-4 h-4 text-indigo-600" />
                                          <Label className="text-sm font-normal cursor-pointer">Supply Chain</Label>
                                        </div>
                                        <Switch
                                          checked={settings.modules?.supplyChain || false}
                                          onCheckedChange={(checked) => {
                                            setPlantSettings(prev => ({
                                              ...prev,
                                              [plant.id]: {
                                                ...prev[plant.id],
                                                modules: {
                                                  ...prev[plant.id].modules,
                                                  supplyChain: checked
                                                }
                                              }
                                            }));
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                      {Object.values(settings.modules || {}).filter(Boolean).length} of 8 modules active
                                    </div>
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="constraints" className="space-y-4 mt-4">
                                  <div className="space-y-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs">Max Utilization</Label>
                                        <span className="text-xs text-gray-500">{settings.constraints.maxUtilization}%</span>
                                      </div>
                                      <Slider
                                        value={[settings.constraints.maxUtilization]}
                                        onValueChange={(value) => {
                                          setPlantSettings(prev => ({
                                            ...prev,
                                            [plant.id]: {
                                              ...prev[plant.id],
                                              constraints: {
                                                ...prev[plant.id].constraints,
                                                maxUtilization: value[0]
                                              }
                                            }
                                          }));
                                        }}
                                        max={100}
                                        step={5}
                                        className="h-1"
                                      />
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs">Min Quality</Label>
                                        <span className="text-xs text-gray-500">{settings.constraints.minQuality}%</span>
                                      </div>
                                      <Slider
                                        value={[settings.constraints.minQuality]}
                                        onValueChange={(value) => {
                                          setPlantSettings(prev => ({
                                            ...prev,
                                            [plant.id]: {
                                              ...prev[plant.id],
                                              constraints: {
                                                ...prev[plant.id].constraints,
                                                minQuality: value[0]
                                              }
                                            }
                                          }));
                                        }}
                                        max={100}
                                        step={1}
                                        className="h-1"
                                      />
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs">Max Cost Increase</Label>
                                        <span className="text-xs text-gray-500">{settings.constraints.maxCost - 100}%</span>
                                      </div>
                                      <Slider
                                        value={[settings.constraints.maxCost - 100]}
                                        onValueChange={(value) => {
                                          setPlantSettings(prev => ({
                                            ...prev,
                                            [plant.id]: {
                                              ...prev[plant.id],
                                              constraints: {
                                                ...prev[plant.id].constraints,
                                                maxCost: value[0] + 100
                                              }
                                            }
                                          }));
                                        }}
                                        max={20}
                                        step={1}
                                        className="h-1"
                                      />
                                    </div>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
                
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowPlantSettings(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-blue-500 to-purple-600"
                    onClick={() => saveSettingsMutation.mutate(plantSettings)}
                    disabled={saveSettingsMutation.isPending}
                  >
                    {saveSettingsMutation.isPending ? 'Saving...' : 'Apply Settings'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </TooltipProvider>
  );
}
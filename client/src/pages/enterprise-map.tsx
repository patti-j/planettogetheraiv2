import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
  Line
} from 'react-simple-maps';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LineChart,
  Line as RechartsLine,
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
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { 
  Factory, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  Package, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Globe,
  ZoomIn,
  ZoomOut,
  Home,
  Truck,
  DollarSign,
  BarChart3,
  Gauge,
  Building,
  Network,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Filter,
  Download,
  Settings,
  Layers,
  Eye,
  EyeOff,
  Maximize2,
  Route,
  Target
} from 'lucide-react';

// World map topology URL - using reliable CDN source
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

interface Plant {
  id: number;
  name: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: string;
  longitude?: string;
  timezone: string;
  isActive: boolean;
  plantType: string;
  capacity: Record<string, any>;
  operationalMetrics: Record<string, any>;
  defaultAlgorithmId?: number | null;
  createdAt: string;
}

export default function EnterpriseMapPage() {
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [showMetrics, setShowMetrics] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('efficiency');
  const [zoom, setZoom] = useState(1.2);
  const [center, setCenter] = useState<{ coordinates: [number, number], zoom: number }>({ 
    coordinates: [0, 20], 
    zoom: 1.2 
  });
  const [viewMode, setViewMode] = useState<'world' | 'region'>('world');
  const [showConnections, setShowConnections] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);

  // Fetch plants data
  const { data: plants = [], isLoading } = useQuery<Plant[]>({
    queryKey: ['/api/plants'],
  });

  // Fetch optimization algorithms
  const { data: algorithms = [] } = useQuery<any[]>({
    queryKey: ['/api/optimization-algorithms'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutation to update plant default algorithm
  const updatePlantAlgorithm = useMutation({
    mutationFn: async ({ plantId, algorithmId }: { plantId: number; algorithmId: number | null }) => {
      return await apiRequest(`/api/plants/${plantId}/default-algorithm`, 'PATCH', { defaultAlgorithmId: algorithmId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Default algorithm updated successfully",
      });
      // Invalidate and refetch plants data
      queryClient.invalidateQueries({ queryKey: ['/api/plants'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update default algorithm",
        variant: "destructive",
      });
    },
  });

  const handleAlgorithmChange = (plantId: number | undefined, value: string) => {
    if (!plantId) return;
    
    const algorithmId = value === "none" ? null : parseInt(value);
    updatePlantAlgorithm.mutate({ plantId, algorithmId });
  };

  // Mock supply chain connections
  const supplyChainConnections = [
    { from: [41.8781, -87.6298], to: [48.1351, 11.5820], type: 'materials' }, // Chicago to Munich
    { from: [31.2304, 121.4737], to: [35.6762, 139.6503], type: 'products' }, // Shanghai to Tokyo
    { from: [19.4326, -99.1332], to: [-23.5505, -46.6333], type: 'materials' }, // Mexico City to São Paulo
  ];

  // Performance data for charts
  const performanceData = [
    { time: '00:00', efficiency: 88, utilization: 82, quality: 95 },
    { time: '04:00', efficiency: 90, utilization: 85, quality: 96 },
    { time: '08:00', efficiency: 92, utilization: 88, quality: 94 },
    { time: '12:00', efficiency: 94, utilization: 90, quality: 97 },
    { time: '16:00', efficiency: 91, utilization: 87, quality: 96 },
    { time: '20:00', efficiency: 93, utilization: 86, quality: 95 },
  ];

  const regionalDistribution = [
    { region: 'North America', plants: 2, value: 35, color: '#3B82F6' },
    { region: 'Europe', plants: 1, value: 20, color: '#10B981' },
    { region: 'Asia Pacific', plants: 2, value: 30, color: '#F59E0B' },
    { region: 'Latin America', plants: 2, value: 15, color: '#8B5CF6' },
  ];

  const plantStatusData = plants.map(plant => ({
    name: plant.name,
    efficiency: plant.operationalMetrics?.efficiency || Math.floor(Math.random() * 20) + 80,
    utilization: plant.operationalMetrics?.utilization || Math.floor(Math.random() * 20) + 75,
    quality: plant.operationalMetrics?.quality || Math.floor(Math.random() * 10) + 90,
  }));

  // Calculate aggregated metrics
  const aggregatedMetrics = useMemo(() => {
    const activePlants = plants.filter(p => p.isActive);
    const totalEfficiency = activePlants.reduce((sum, p) => 
      sum + (p.operationalMetrics?.efficiency || 85), 0
    );
    const totalUtilization = activePlants.reduce((sum, p) => 
      sum + (p.operationalMetrics?.utilization || 78), 0
    );
    const totalWorkforce = plants.reduce((sum, p) => 
      sum + (p.operationalMetrics?.workforce || 150), 0
    );
    const totalCapacity = plants.reduce((sum, p) => 
      sum + (p.capacity?.total || 1000), 0
    );

    return {
      totalPlants: plants.length,
      activePlants: activePlants.length,
      avgEfficiency: activePlants.length ? Math.round(totalEfficiency / activePlants.length) : 0,
      avgUtilization: activePlants.length ? Math.round(totalUtilization / activePlants.length) : 0,
      totalWorkforce,
      totalCapacity,
      countries: [...new Set(plants.map(p => p.country).filter(Boolean))].length,
      regions: [...new Set(plants.map(p => getRegion(p.country)))].length,
    };
  }, [plants]);

  // Helper function to determine region from country
  function getRegion(country?: string): string {
    if (!country) return 'Unknown';
    const regionMap: Record<string, string> = {
      'USA': 'North America',
      'Canada': 'North America',
      'Germany': 'Europe',
      'France': 'Europe',
      'China': 'Asia Pacific',
      'Japan': 'Asia Pacific',
      'Brazil': 'Latin America',
      'Mexico': 'Latin America',
    };
    return regionMap[country] || 'Other';
  }

  // Get marker color based on metric
  const getMarkerColor = (plant: Plant) => {
    if (!showMetrics) return '#3B82F6';
    
    const metricValue = selectedMetric === 'efficiency' 
      ? plant.operationalMetrics?.efficiency || 85
      : selectedMetric === 'utilization'
      ? plant.operationalMetrics?.utilization || 78
      : selectedMetric === 'status'
      ? (plant.isActive ? 100 : 0)
      : 85;

    if (metricValue >= 90) return '#10B981'; // green
    if (metricValue >= 75) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  const resetView = () => {
    setZoom(1.2);
    setCenter({ coordinates: [0, 20], zoom: 1.2 });
    setViewMode('world');
  };

  const focusRegion = (region: string) => {
    const regionCenters: Record<string, [number, number]> = {
      'north-america': [-100, 45],
      'europe': [10, 50],
      'asia-pacific': [110, 20],
      'latin-america': [-70, -15],
    };
    
    if (regionCenters[region]) {
      setCenter({ coordinates: regionCenters[region], zoom: 2.5 });
      setZoom(2.5);
      setViewMode('region');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
        <div className="container mx-auto p-4 lg:p-6 space-y-6">
          
          {/* Enhanced Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 lg:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-start gap-3 lg:gap-4">
                  <div className="p-2 lg:p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                    <Globe className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      Global Control Tower
                    </h1>
                    <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 mt-1">
                      Real-time visualization of worldwide operations and supply chain network
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (plants.length > 0) {
                        setSelectedPlant(plants[0]);
                      }
                    }}
                    className="gap-2 text-sm"
                    size="sm"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Plant Settings</span>
                    <span className="sm:hidden">Settings</span>
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <Download className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                  
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <Settings className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Configure</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Command Center - Enhanced KPI Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 lg:gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400 truncate">Total Plants</p>
                    <p className="text-lg lg:text-2xl font-bold text-blue-800 dark:text-blue-300">{aggregatedMetrics.totalPlants}</p>
                  </div>
                  <Factory className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 truncate">Active</p>
                    <p className="text-lg lg:text-2xl font-bold text-green-800 dark:text-green-300">{aggregatedMetrics.activePlants}</p>
                  </div>
                  <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-green-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-purple-700 dark:text-purple-400 truncate">Countries</p>
                    <p className="text-lg lg:text-2xl font-bold text-purple-800 dark:text-purple-300">{aggregatedMetrics.countries}</p>
                  </div>
                  <Globe className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 truncate">Efficiency</p>
                    <p className="text-lg lg:text-2xl font-bold text-amber-800 dark:text-amber-300">{aggregatedMetrics.avgEfficiency}%</p>
                  </div>
                  <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-amber-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-cyan-200 dark:border-cyan-800">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-cyan-700 dark:text-cyan-400 truncate">Utilization</p>
                    <p className="text-lg lg:text-2xl font-bold text-cyan-800 dark:text-cyan-300">{aggregatedMetrics.avgUtilization}%</p>
                  </div>
                  <Activity className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-indigo-700 dark:text-indigo-400 truncate">Workforce</p>
                    <p className="text-lg lg:text-2xl font-bold text-indigo-800 dark:text-indigo-300">{(aggregatedMetrics.totalWorkforce / 1000).toFixed(1)}K</p>
                  </div>
                  <Users className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border-rose-200 dark:border-rose-800">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-rose-700 dark:text-rose-400 truncate">Capacity</p>
                    <p className="text-lg lg:text-2xl font-bold text-rose-800 dark:text-rose-300">{(aggregatedMetrics.totalCapacity / 1000).toFixed(0)}K</p>
                  </div>
                  <Package className="w-4 h-4 lg:w-5 lg:h-5 text-rose-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200 dark:border-gray-800">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-400 truncate">Regions</p>
                    <p className="text-lg lg:text-2xl font-bold text-gray-800 dark:text-gray-300">{aggregatedMetrics.regions}</p>
                  </div>
                  <Network className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Executive Strategic Command Center */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
            {/* Financial Performance Dashboard */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Financial Performance
                  </span>
                  <Badge variant="outline" className="text-green-600">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +12.5%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Revenue (MTD)</span>
                    <span className="font-bold">$45.2M</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Profit Margin</span>
                    <span className="font-bold">18.3%</span>
                  </div>
                  <Progress value={83} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Operating Costs</span>
                    <span className="font-bold">$37.1M</span>
                  </div>
                  <Progress value={62} className="h-2" />
                </div>
                <Button className="w-full" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Detailed Analytics
                </Button>
              </CardContent>
            </Card>

            {/* Risk Management Center */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Risk Management
                  </span>
                  <Badge variant="outline" className="text-orange-600">
                    3 Active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Supply chain disruption risk in Asia-Pacific region
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Overall Risk Score</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="font-bold">Medium</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Compliance Status</span>
                    <Badge variant="default" className="text-xs">98% Compliant</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Quality Issues</span>
                    <span className="font-bold text-green-600">2 Minor</span>
                  </div>
                </div>
                <Button className="w-full" size="sm" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Risk Thresholds
                </Button>
              </CardContent>
            </Card>

            {/* Plant Optimization Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    Optimization Settings
                  </span>
                  <Badge variant="outline" className="text-blue-600">
                    {aggregatedMetrics.totalPlants} Plants
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {plants.slice(0, 3).map((plant, index) => (
                    <div key={plant.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${plant.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-sm font-medium">{plant.name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedPlant(plant)}
                        className="h-6 px-2 text-xs"
                      >
                        Configure
                      </Button>
                    </div>
                  ))}
                  {plants.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{plants.length - 3} more plants
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Autonomous Optimization</span>
                    <span className="font-bold text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Default Algorithms</span>
                    <span className="font-bold">Configured</span>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  size="sm"
                  onClick={() => {
                    if (plants.length > 0) {
                      setSelectedPlant(plants[0]);
                    }
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage All Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Supply Chain Optimization Controls */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Supply Chain Optimization Suite
                </span>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button size="sm" variant="outline" className="w-full sm:w-auto">
                    <Download className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Export Report</span>
                    <span className="sm:hidden">Export</span>
                  </Button>
                  <Button size="sm" className="w-full sm:w-auto">
                    <Settings className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Optimize Now</span>
                    <span className="sm:hidden">Optimize</span>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="inventory" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1">
                  <TabsTrigger value="inventory" className="text-xs md:text-sm">Inventory</TabsTrigger>
                  <TabsTrigger value="production" className="text-xs md:text-sm">Production</TabsTrigger>
                  <TabsTrigger value="logistics" className="text-xs md:text-sm">Logistics</TabsTrigger>
                  <TabsTrigger value="allocation" className="text-xs md:text-sm">Allocation</TabsTrigger>
                  <TabsTrigger value="scenarios" className="text-xs md:text-sm col-span-2 md:col-span-1">Scenarios</TabsTrigger>
                </TabsList>
                
                <TabsContent value="inventory" className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Total Inventory Value</p>
                      <p className="text-xl lg:text-2xl font-bold">$128.4M</p>
                      <p className="text-xs text-green-600">-5.2% vs last month</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Turnover Rate</p>
                      <p className="text-xl lg:text-2xl font-bold">12.3x</p>
                      <p className="text-xs text-green-600">+0.8x improvement</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Stock-out Risk</p>
                      <p className="text-xl lg:text-2xl font-bold">3.2%</p>
                      <p className="text-xs text-yellow-600">2 items at risk</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Days of Supply</p>
                      <p className="text-xl lg:text-2xl font-bold">42 days</p>
                      <p className="text-xs text-green-600">Optimal range</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <Button size="sm" variant="outline" className="w-full sm:w-auto">Reorder Points Analysis</Button>
                    <Button size="sm" variant="outline" className="w-full sm:w-auto">Safety Stock Optimization</Button>
                    <Button size="sm" variant="outline" className="w-full sm:w-auto">ABC Classification</Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="production" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm font-medium mb-2">Production Efficiency</p>
                        <Progress value={87} className="mb-1" />
                        <p className="text-xs text-gray-500">87% - Above target</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm font-medium mb-2">Capacity Utilization</p>
                        <Progress value={78} className="mb-1" />
                        <p className="text-xs text-gray-500">78% - Room for growth</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm font-medium mb-2">Schedule Adherence</p>
                        <Progress value={92} className="mb-1" />
                        <p className="text-xs text-gray-500">92% - Excellent</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button size="sm" className="w-full sm:w-auto">Balance Production Lines</Button>
                      <Button size="sm" variant="outline" className="w-full sm:w-auto">Shift Optimization</Button>
                      <Button size="sm" variant="outline" className="w-full sm:w-auto">Changeover Reduction</Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="logistics" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <Truck className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm font-medium">245 Shipments</p>
                        <p className="text-xs text-gray-500">This week</p>
                      </div>
                      <div className="text-center">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-green-600" />
                        <p className="text-sm font-medium">98.2% On-time</p>
                        <p className="text-xs text-gray-500">Delivery rate</p>
                      </div>
                      <div className="text-center">
                        <DollarSign className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                        <p className="text-sm font-medium">$4.2M</p>
                        <p className="text-xs text-gray-500">Monthly costs</p>
                      </div>
                      <div className="text-center">
                        <Route className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                        <p className="text-sm font-medium">12 Routes</p>
                        <p className="text-xs text-gray-500">Optimized daily</p>
                      </div>
                    </div>
                    <Button className="w-full" size="sm">
                      <Route className="w-4 h-4 mr-2" />
                      Run Route Optimization Algorithm
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="allocation" className="mt-4">
                  <div className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Resource allocation optimizer suggests reallocating 15% of Plant #2 capacity to Plant #4 for improved efficiency.
                      </AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm font-medium mb-2">Current Allocation Efficiency</p>
                        <p className="text-2xl font-bold">82%</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm font-medium mb-2">Optimized Efficiency</p>
                        <p className="text-2xl font-bold text-green-600">94%</p>
                      </div>
                    </div>
                    <Button className="w-full">Apply Optimized Allocation</Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="scenarios" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="cursor-pointer hover:border-blue-500 transition-colors">
                        <CardContent className="p-3">
                          <p className="font-medium text-sm mb-1">Peak Season Scenario</p>
                          <p className="text-xs text-gray-500">+40% demand surge</p>
                          <Badge className="mt-2" variant="outline">Ready</Badge>
                        </CardContent>
                      </Card>
                      <Card className="cursor-pointer hover:border-blue-500 transition-colors">
                        <CardContent className="p-3">
                          <p className="font-medium text-sm mb-1">Supply Disruption</p>
                          <p className="text-xs text-gray-500">-30% raw materials</p>
                          <Badge className="mt-2" variant="outline">Analyzed</Badge>
                        </CardContent>
                      </Card>
                      <Card className="cursor-pointer hover:border-blue-500 transition-colors">
                        <CardContent className="p-3">
                          <p className="font-medium text-sm mb-1">New Market Entry</p>
                          <p className="text-xs text-gray-500">Europe expansion</p>
                          <Badge className="mt-2" variant="outline">Draft</Badge>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm">Create New Scenario</Button>
                      <Button size="sm" variant="outline">Run Simulation</Button>
                      <Button size="sm" variant="outline">Compare Scenarios</Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Executive Decision Support & Automated Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Strategic Decision Support */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-indigo-600" />
                  Strategic Decision Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Factory className="w-5 h-5 text-blue-600" />
                        <Badge variant="outline" className="text-xs">Urgent</Badge>
                      </div>
                      <p className="text-sm font-medium">Capacity Expansion</p>
                      <p className="text-xs text-gray-500 mt-1">Plant #3 needs 20% more capacity</p>
                      <Button size="sm" className="w-full mt-2">Analyze Impact</Button>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <Badge variant="outline" className="text-xs">High ROI</Badge>
                      </div>
                      <p className="text-sm font-medium">Market Opportunity</p>
                      <p className="text-xs text-gray-500 mt-1">Asia-Pacific demand +35%</p>
                      <Button size="sm" className="w-full mt-2">View Strategy</Button>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                        <Badge variant="outline" className="text-xs">$4.2M</Badge>
                      </div>
                      <p className="text-sm font-medium">Cost Reduction</p>
                      <p className="text-xs text-gray-500 mt-1">Supply chain optimization</p>
                      <Button size="sm" className="w-full mt-2">Implement</Button>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Users className="w-5 h-5 text-orange-600" />
                        <Badge variant="outline" className="text-xs">Critical</Badge>
                      </div>
                      <p className="text-sm font-medium">Workforce Planning</p>
                      <p className="text-xs text-gray-500 mt-1">Skill gap in Plant #2</p>
                      <Button size="sm" className="w-full mt-2">Action Plan</Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Automated Actions & Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-red-600" />
                  Automated Actions & Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Auto-Rebalancing</p>
                        <p className="text-xs text-gray-500">Optimize production distribution</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium">Risk Mitigation</p>
                        <p className="text-xs text-gray-500">Automatic contingency activation</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Demand Response</p>
                        <p className="text-xs text-gray-500">Auto-adjust to market changes</p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium">Cost Optimization</p>
                        <p className="text-xs text-gray-500">AI-driven resource allocation</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-xs">
                    3 automated optimizations executed today, saving $127K
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Section - Takes 2 columns */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Global Operations Network
                      </CardTitle>
                      {showMetrics && (
                        <Badge variant="outline" className="ml-2">
                          Showing: {selectedMetric}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={showConnections ? "default" : "outline"}
                              size="sm"
                              onClick={() => setShowConnections(!showConnections)}
                            >
                              <Route className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Toggle supply chain routes</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={heatmapEnabled ? "default" : "outline"}
                              size="sm"
                              onClick={() => setHeatmapEnabled(!heatmapEnabled)}
                            >
                              <Layers className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Toggle heatmap overlay</TooltipContent>
                        </Tooltip>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setZoom(Math.min(zoom * 1.5, 8))}
                          disabled={zoom >= 8}
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setZoom(Math.max(zoom / 1.5, 0.5))}
                          disabled={zoom <= 0.5}
                        >
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetView}
                        >
                          <Home className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="show-metrics" className="text-sm">Show Metrics</Label>
                      <Switch
                        id="show-metrics"
                        checked={showMetrics}
                        onCheckedChange={setShowMetrics}
                      />
                    </div>
                    
                    <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efficiency">Efficiency</SelectItem>
                        <SelectItem value="utilization">Utilization</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => focusRegion('north-america')}
                      >
                        NA
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => focusRegion('europe')}
                      >
                        EU
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => focusRegion('asia-pacific')}
                      >
                        APAC
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => focusRegion('latin-america')}
                      >
                        LATAM
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="w-full h-[500px] border rounded-lg overflow-hidden relative" 
                    style={{
                      background: 'linear-gradient(to bottom right, #f0f9ff, #e0f2fe)',
                      backgroundImage: `
                        linear-gradient(to bottom right, #f0f9ff, #e0f2fe),
                        linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
                      `,
                      backgroundSize: '100% 100%, 50px 50px, 50px 50px'
                    }}
                  >
                    <ComposableMap
                      projection="geoMercator"
                      projectionConfig={{
                        scale: 147,
                        center: center.coordinates,
                      }}
                      className="w-full h-full"
                    >
                      <ZoomableGroup 
                        zoom={zoom} 
                        center={center.coordinates}
                        onMoveEnd={(geo: { coordinates: [number, number], zoom: number }) => setCenter(geo)}>
                        {/* Base Map */}
                        <Geographies geography={geoUrl}>
                          {({ geographies }) =>
                            geographies ? geographies.map((geo) => (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill={heatmapEnabled ? "#e0f2fe" : "#f0f9ff"}
                                stroke="#94a3b8"
                                strokeWidth={0.5}
                                style={{
                                  default: {
                                    fill: heatmapEnabled ? "#e0f2fe" : "#f0f9ff",
                                    outline: "none"
                                  },
                                  hover: {
                                    fill: "#dbeafe",
                                    outline: "none"
                                  },
                                  pressed: {
                                    fill: "#bfdbfe",
                                    outline: "none"
                                  }
                                }}
                              />
                            )) : (
                              // Fallback simple world representation
                              <g>
                                <rect x="-180" y="-90" width="360" height="180" fill="#f0f9ff" stroke="#94a3b8" strokeWidth="0.5" />
                                <text x="0" y="0" textAnchor="middle" fill="#64748b" fontSize="14">
                                  Loading world map...
                                </text>
                              </g>
                            )
                          }
                        </Geographies>
                        
                        {/* Supply Chain Connections */}
                        {showConnections && supplyChainConnections.map((connection, index) => (
                          <Line
                            key={index}
                            from={connection.from}
                            to={connection.to}
                            stroke="#3B82F6"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeDasharray="5,5"
                            className="animate-pulse"
                          />
                        ))}
                        
                        {/* Plant Markers */}
                        {plants.map((plant) => {
                          if (!plant.latitude || !plant.longitude) return null;
                          
                          const lat = parseFloat(plant.latitude);
                          const lng = parseFloat(plant.longitude);
                          
                          if (isNaN(lat) || isNaN(lng)) return null;
                          
                          const markerColor = getMarkerColor(plant);
                          
                          return (
                            <Marker 
                              key={plant.id} 
                              coordinates={[lng, lat]}
                              onClick={() => setSelectedPlant(plant)}
                            >
                              <g className="cursor-pointer group">
                                {/* Outer glow effect */}
                                <circle
                                  r={15}
                                  fill={markerColor}
                                  fillOpacity={0.2}
                                  className="animate-ping"
                                />
                                {/* Main marker */}
                                <circle
                                  r={12}
                                  fill={markerColor}
                                  stroke="#ffffff"
                                  strokeWidth={3}
                                  className="transition-all duration-200"
                                  fillOpacity={0.95}
                                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                                />
                                {heatmapEnabled && (
                                  <circle
                                    r={35}
                                    fill={markerColor}
                                    fillOpacity={0.15}
                                    className="animate-pulse"
                                  />
                                )}
                                <Factory
                                  x={-7}
                                  y={-7}
                                  width={14}
                                  height={14}
                                  fill="white"
                                  className="pointer-events-none"
                                />
                                {/* Plant name label */}
                                <text
                                  y={25}
                                  textAnchor="middle"
                                  fill="#1e293b"
                                  fontSize="11"
                                  fontWeight="600"
                                  className="pointer-events-none"
                                  style={{
                                    filter: 'drop-shadow(0 1px 2px rgba(255,255,255,0.8))'
                                  }}
                                >
                                  {plant.name}
                                </text>
                              </g>
                            </Marker>
                          );
                        })}
                      </ZoomableGroup>
                    </ComposableMap>
                  </div>
                  
                  {/* Map Legend */}
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Optimal (≥90%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Good (75-89%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Needs Attention (&lt;75%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Panel */}
            <div className="space-y-6">
              {/* Regional Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Regional Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={regionalDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {regionalDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-4">
                    {regionalDistribution.map((region) => (
                      <div key={region.region} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: region.color }}></div>
                          <span className="text-sm">{region.region}</span>
                        </div>
                        <span className="text-sm font-medium">{region.plants} plants</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <RechartsTooltip />
                      <RechartsLine type="monotone" dataKey="efficiency" stroke="#3B82F6" strokeWidth={2} />
                      <RechartsLine type="monotone" dataKey="utilization" stroke="#10B981" strokeWidth={2} />
                      <RechartsLine type="monotone" dataKey="quality" stroke="#F59E0B" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Plant List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Plant Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {plants.map((plant) => (
                        <div
                          key={plant.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                          onClick={() => setSelectedPlant(plant)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              plant.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                            }`}></div>
                            <div>
                              <p className="font-medium text-sm">{plant.name}</p>
                              <p className="text-xs text-gray-500">{plant.city}, {plant.country}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {plant.operationalMetrics?.efficiency || 85}%
                            </p>
                            <p className="text-xs text-gray-500">efficiency</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Plant Details Dialog */}
          <Dialog open={!!selectedPlant} onOpenChange={() => setSelectedPlant(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Factory className="w-5 h-5" />
                  {selectedPlant?.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedPlant?.city}, {selectedPlant?.country}
                </DialogDescription>
              </DialogHeader>
              
              {selectedPlant && (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge variant={selectedPlant.isActive ? "default" : "secondary"}>
                        {selectedPlant.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium">{selectedPlant.plantType || 'Manufacturing'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Timezone</p>
                      <p className="font-medium">{selectedPlant.timezone}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Capacity</p>
                      <p className="font-medium">{selectedPlant.capacity?.total || 1000} units</p>
                    </div>
                  </div>
                  
                  <Tabs defaultValue="metrics" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="metrics">Metrics</TabsTrigger>
                      <TabsTrigger value="performance">Performance</TabsTrigger>
                      <TabsTrigger value="algorithm">Algorithm</TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="metrics" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Efficiency</span>
                            <span className="text-sm font-medium">
                              {selectedPlant.operationalMetrics?.efficiency || 85}%
                            </span>
                          </div>
                          <Progress value={selectedPlant.operationalMetrics?.efficiency || 85} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Utilization</span>
                            <span className="text-sm font-medium">
                              {selectedPlant.operationalMetrics?.utilization || 78}%
                            </span>
                          </div>
                          <Progress value={selectedPlant.operationalMetrics?.utilization || 78} />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="performance" className="mt-4">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={[
                          { metric: 'Efficiency', value: selectedPlant.operationalMetrics?.efficiency || 85 },
                          { metric: 'Utilization', value: selectedPlant.operationalMetrics?.utilization || 78 },
                          { metric: 'Quality', value: 95 },
                          { metric: 'OEE', value: 82 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="metric" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </TabsContent>
                    
                    <TabsContent value="algorithm" className="mt-4">
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                            Plant Optimization Settings
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                            Configure default algorithms for each planning process and enable autonomous optimization.
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          {/* Production Scheduling */}
                          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <Label className="text-sm font-medium">Production Scheduling</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch 
                                  checked={false}
                                  onCheckedChange={() => {}}
                                />
                                <span className="text-xs text-gray-500">Autonomous</span>
                              </div>
                            </div>
                            <Select defaultValue="none">
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select algorithm..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Standard Algorithm</SelectItem>
                                {algorithms && algorithms.filter((alg: any) => 
                                  alg.category?.toLowerCase().includes('scheduling') || 
                                  alg.name?.toLowerCase().includes('scheduling') ||
                                  alg.name?.toLowerCase().includes('asap') ||
                                  alg.name?.toLowerCase().includes('alap')
                                ).map((alg: any) => (
                                  <SelectItem key={alg.id} value={alg.id.toString()}>
                                    {alg.displayName || alg.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-2">
                              Used for production schedule optimization and sequencing
                            </p>
                          </div>

                          {/* Order Optimization */}
                          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-green-600" />
                                <Label className="text-sm font-medium">Order Optimization</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch 
                                  checked={false}
                                  onCheckedChange={() => {}}
                                />
                                <span className="text-xs text-gray-500">Autonomous</span>
                              </div>
                            </div>
                            <Select defaultValue="none">
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select algorithm..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Standard Algorithm</SelectItem>
                                {algorithms && algorithms.filter((alg: any) => 
                                  alg.category?.toLowerCase().includes('optimization') || 
                                  alg.name?.toLowerCase().includes('optimization') ||
                                  alg.name?.toLowerCase().includes('order')
                                ).map((alg: any) => (
                                  <SelectItem key={alg.id} value={alg.id.toString()}>
                                    {alg.displayName || alg.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-2">
                              Used for order prioritization and allocation optimization
                            </p>
                          </div>

                          {/* Demand Planning */}
                          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-orange-600" />
                                <Label className="text-sm font-medium">Demand Planning</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch 
                                  checked={false}
                                  onCheckedChange={() => {}}
                                />
                                <span className="text-xs text-gray-500">Autonomous</span>
                              </div>
                            </div>
                            <Select defaultValue="none">
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select algorithm..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Standard Algorithm</SelectItem>
                                {algorithms && algorithms.filter((alg: any) => 
                                  alg.category?.toLowerCase().includes('demand') || 
                                  alg.name?.toLowerCase().includes('demand') ||
                                  alg.name?.toLowerCase().includes('forecast')
                                ).map((alg: any) => (
                                  <SelectItem key={alg.id} value={alg.id.toString()}>
                                    {alg.displayName || alg.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-2">
                              Used for demand forecasting and planning optimization
                            </p>
                          </div>

                          {/* Resource Allocation */}
                          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-purple-600" />
                                <Label className="text-sm font-medium">Resource Allocation</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch 
                                  checked={false}
                                  onCheckedChange={() => {}}
                                />
                                <span className="text-xs text-gray-500">Autonomous</span>
                              </div>
                            </div>
                            <Select defaultValue="none">
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select algorithm..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Standard Algorithm</SelectItem>
                                {algorithms && algorithms.filter((alg: any) => 
                                  alg.category?.toLowerCase().includes('resource') || 
                                  alg.name?.toLowerCase().includes('resource') ||
                                  alg.name?.toLowerCase().includes('allocation')
                                ).map((alg: any) => (
                                  <SelectItem key={alg.id} value={alg.id.toString()}>
                                    {alg.displayName || alg.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-2">
                              Used for optimal resource and capacity allocation
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">Autonomous Optimization</p>
                              <p className="text-amber-700 dark:text-amber-300">
                                When enabled, algorithms will automatically run optimization at scheduled intervals. 
                                When disabled, algorithms serve as defaults for manual optimization runs.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="details" className="mt-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Address</span>
                          <span className="text-sm">{selectedPlant.address || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Workforce</span>
                          <span className="text-sm">
                            {selectedPlant.operationalMetrics?.workforce || 150} employees
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Created</span>
                          <span className="text-sm">
                            {new Date(selectedPlant.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </TooltipProvider>
  );
}
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { 
  Factory, 
  MapPin, 
  TrendingUp, 
  Activity, 
  Users, 
  Package, 
  CheckCircle,
  Globe,
  ZoomIn,
  ZoomOut,
  Home,
  DollarSign,
  Building,
  Bot,
  Play,
  Pause,
  ArrowUpRight,
  Download,
  Route,
  Layers,
  AlertTriangle,
  Target,
  Settings,
  Cog
} from 'lucide-react';

// World map topology URL
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
  const [selectedMetric, setSelectedMetric] = useState('efficiency');
  const [zoom, setZoom] = useState(1.2);
  const [center, setCenter] = useState<{ coordinates: [number, number], zoom: number }>({ 
    coordinates: [0, 20], 
    zoom: 1.2 
  });
  const [showConnections, setShowConnections] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [showAlgorithmConfig, setShowAlgorithmConfig] = useState(false);
  const [algorithmConfigs, setAlgorithmConfigs] = useState<Record<string, Record<string, number>>>({});

  // Fetch plants data
  const { data: plants = [], isLoading } = useQuery<Plant[]>({
    queryKey: ['/api/plants/map'],
  });

  // Fetch optimization algorithms
  const { data: algorithms = [] } = useQuery<any[]>({
    queryKey: ['/api/optimization-algorithms'],
    staleTime: 5 * 60 * 1000,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch monitoring agent status
  const { data: monitoringStatus } = useQuery({
    queryKey: ['/api/monitoring-agent/status'],
    refetchInterval: 30000,
  });

  // Planning processes that can have algorithm configurations
  const planningProcesses = [
    { id: 'scheduling', name: 'Production Scheduling', description: 'Optimize production schedules and resource allocation' },
    { id: 'master_production_schedule', name: 'Master Production Schedule', description: 'Plan and manage master production schedules' },
    { id: 'inventory_optimization', name: 'Inventory Optimization', description: 'Optimize inventory levels and reorder points' },
    { id: 'capacity_planning', name: 'Capacity Planning', description: 'Plan and optimize resource capacity' },
    { id: 'demand_forecasting', name: 'Demand Forecasting', description: 'Forecast demand and plan accordingly' },
    { id: 'supply_chain_optimization', name: 'Supply Chain Optimization', description: 'Optimize supply chain operations' },
    { id: 'labor_planning', name: 'Labor Planning', description: 'Optimize workforce planning and scheduling' },
    { id: 'quality_management', name: 'Quality Management', description: 'Optimize quality control processes' }
  ];

  // Mutation to update plant algorithm configurations
  const updatePlantAlgorithmConfig = useMutation({
    mutationFn: async ({ plantId, process, algorithmId }: { plantId: number, process: string, algorithmId: number }) => {
      return await apiRequest('PUT', `/api/plants/${plantId}/algorithm-config`, {
        process,
        algorithmId
      });
    },
    onSuccess: () => {
      toast({
        title: "Algorithm Configuration Updated",
        description: "Default algorithm has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/plants/map'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update algorithm configuration",
        variant: "destructive",
      });
    },
  });

  // Mutations for monitoring agent control
  const startMonitoringAgent = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/monitoring-agent/start', {});
    },
    onSuccess: () => {
      toast({
        title: "AI Monitoring Agent",
        description: "Monitoring agent started successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/monitoring-agent/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start monitoring agent",
        variant: "destructive",
      });
    },
  });

  const stopMonitoringAgent = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/monitoring-agent/stop', {});
    },
    onSuccess: () => {
      toast({
        title: "AI Monitoring Agent", 
        description: "Monitoring agent stopped successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/monitoring-agent/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to stop monitoring agent",
        variant: "destructive",
      });
    },
  });

  // Mock data for charts
  const performanceData = [
    { time: '00:00', efficiency: 85, utilization: 78, quality: 92 },
    { time: '04:00', efficiency: 88, utilization: 82, quality: 90 },
    { time: '08:00', efficiency: 92, utilization: 85, quality: 94 },
    { time: '12:00', efficiency: 89, utilization: 79, quality: 91 },
    { time: '16:00', efficiency: 91, utilization: 88, quality: 93 },
    { time: '20:00', efficiency: 87, utilization: 83, quality: 89 },
  ];

  // Supply chain connections for visualization
  const supplyChainConnections = [
    { from: [-74.006, 40.7128], to: [-87.6298, 41.8781] }, // NY to Chicago
    { from: [-87.6298, 41.8781], to: [-118.2437, 34.0522] }, // Chicago to LA
    { from: [2.3522, 48.8566], to: [13.4050, 52.5200] }, // Paris to Berlin
  ];

  // Calculate aggregated metrics
  const aggregatedMetrics = useMemo(() => {
    const totalPlants = plants.length;
    const activePlants = plants.filter(p => p.isActive).length;
    const avgEfficiency = Math.round(
      plants.reduce((acc, p) => acc + (p.operationalMetrics?.efficiency || 85), 0) / (totalPlants || 1)
    );
    const avgUtilization = Math.round(
      plants.reduce((acc, p) => acc + (p.operationalMetrics?.utilization || 78), 0) / (totalPlants || 1)
    );
    const totalWorkforce = plants.reduce((acc, p) => acc + (p.operationalMetrics?.workforce || 150), 0);
    const totalCapacity = plants.reduce((acc, p) => acc + (p.capacity?.daily || 1000), 0);

    return {
      totalPlants,
      activePlants,
      avgEfficiency,
      avgUtilization,
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto p-6 space-y-8">
          
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Global Control Tower
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Real-time operations and supply chain monitoring across all facilities
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-40">
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
                  size="sm"
                  onClick={() => setShowAlgorithmConfig(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Algorithm Config
                </Button>
                
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Key Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Plants</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{aggregatedMetrics.totalPlants}</p>
                  </div>
                  <Factory className="w-6 h-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Plants</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{aggregatedMetrics.activePlants}</p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Efficiency</p>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{aggregatedMetrics.avgEfficiency}%</p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Utilization</p>
                    <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">{aggregatedMetrics.avgUtilization}%</p>
                  </div>
                  <Activity className="w-6 h-6 text-cyan-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Map Section - Takes 2 columns */}
            <div className="xl:col-span-2">
              <Card className="border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      Global Operations Network
                    </CardTitle>
                    
                    <div className="flex items-center gap-3">
                      <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="efficiency">Efficiency</SelectItem>
                          <SelectItem value="utilization">Utilization</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex items-center gap-1">
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
                      </div>
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
                            )) : null
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

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* AI Monitoring Agent */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5" />
                      AI Agent
                    </div>
                    {monitoringStatus?.isRunning ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Activity className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                        Stopped
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {monitoringStatus?.lastCheck && (
                    <div>
                      <div className="text-sm font-medium">Last Check</div>
                      <div className="text-sm text-gray-600">
                        {new Date(monitoringStatus.lastCheck).toLocaleString()}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {monitoringStatus?.isRunning ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => stopMonitoringAgent.mutate()}
                        disabled={stopMonitoringAgent.isPending}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => startMonitoringAgent.mutate()}
                        disabled={startMonitoringAgent.isPending}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Plant Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Plant Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {plants.slice(0, 8).map((plant) => (
                        <div
                          key={plant.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedPlant(plant)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              plant.isActive ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                            <div>
                              <p className="font-medium text-sm">{plant.name}</p>
                              <p className="text-xs text-gray-500">{plant.city}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {plant.operationalMetrics?.efficiency || 85}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" fontSize={12} />
                      <YAxis fontSize={12} />
                      <RechartsTooltip />
                      <RechartsLine type="monotone" dataKey="efficiency" stroke="#3B82F6" strokeWidth={2} />
                      <RechartsLine type="monotone" dataKey="utilization" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Plant Details Dialog */}
          <Dialog open={!!selectedPlant} onOpenChange={() => setSelectedPlant(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Factory className="w-5 h-5" />
                  {selectedPlant?.name}
                </DialogTitle>
                <DialogDescription>
                  Plant details and optimization settings
                </DialogDescription>
              </DialogHeader>
              
              {selectedPlant && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Location</div>
                      <div className="text-sm">{selectedPlant.city}, {selectedPlant.country}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Status</div>
                      <div className="text-sm">
                        {selectedPlant.isActive ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Efficiency</div>
                      <div className="text-sm">{selectedPlant.operationalMetrics?.efficiency || 85}%</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Utilization</div>
                      <div className="text-sm">{selectedPlant.operationalMetrics?.utilization || 78}%</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-2">Default Algorithm</div>
                    <Select 
                      value={selectedPlant.defaultAlgorithmId?.toString() || ''} 
                      onValueChange={(value) => {
                        // Handle algorithm change
                        console.log('Algorithm changed to:', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select algorithm" />
                      </SelectTrigger>
                      <SelectContent>
                        {algorithms.map((alg: any) => (
                          <SelectItem key={alg.id} value={alg.id.toString()}>
                            {alg.displayName || alg.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Algorithm Configuration Dialog */}
          <Dialog open={showAlgorithmConfig} onOpenChange={setShowAlgorithmConfig}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Cog className="w-5 h-5" />
                  Central Algorithm Configuration
                </DialogTitle>
                <DialogDescription>
                  Configure default optimization algorithms for each plant and planning process
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Algorithm Categories Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{algorithms.filter(a => a.category === 'schedule_optimization').length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Scheduling Algorithms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{algorithms.filter(a => a.category === 'inventory_optimization').length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Inventory Algorithms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{algorithms.filter(a => a.category === 'capacity_optimization').length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Capacity Algorithms</div>
                  </div>
                </div>

                {/* Configuration Matrix */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Algorithm Configuration Matrix</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Apply configurations to all plants
                        plants.forEach(plant => {
                          planningProcesses.forEach(process => {
                            const config = algorithmConfigs[plant.id.toString()]?.[process.id];
                            if (config) {
                              updatePlantAlgorithmConfig.mutate({
                                plantId: plant.id,
                                process: process.id,
                                algorithmId: config
                              });
                            }
                          });
                        });
                      }}
                      disabled={updatePlantAlgorithmConfig.isPending}
                    >
                      Save All Changes
                    </Button>
                  </div>

                  {plants.map((plant) => (
                    <Card key={plant.id} className="border-gray-200 dark:border-gray-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Factory className="w-4 h-4" />
                          {plant.name}
                          <Badge variant={plant.isActive ? "secondary" : "outline"} className={plant.isActive ? "bg-green-100 text-green-800" : ""}>
                            {plant.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </CardTitle>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {plant.city}, {plant.country} • Efficiency: {plant.operationalMetrics?.efficiency || 85}%
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {planningProcesses.map((process) => (
                            <div key={process.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-sm">{process.name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{process.description}</div>
                                </div>
                              </div>
                              <Select
                                value={algorithmConfigs[plant.id.toString()]?.[process.id]?.toString() || plant.defaultAlgorithmId?.toString() || ''}
                                onValueChange={(value) => {
                                  setAlgorithmConfigs(prev => ({
                                    ...prev,
                                    [plant.id.toString()]: {
                                      ...prev[plant.id.toString()],
                                      [process.id]: parseInt(value)
                                    }
                                  }));
                                }}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select algorithm" />
                                </SelectTrigger>
                                <SelectContent>
                                  {algorithms
                                    .filter(alg => {
                                      // Filter algorithms by relevant category for the process
                                      const processAlgorithmMap = {
                                        'scheduling': 'schedule_optimization',
                                        'master_production_schedule': 'schedule_optimization',
                                        'inventory_optimization': 'inventory_optimization',
                                        'capacity_planning': 'capacity_optimization',
                                        'demand_forecasting': 'demand_forecasting',
                                        'supply_chain_optimization': 'ctp_optimization',
                                        'labor_planning': 'schedule_optimization',
                                        'quality_management': 'schedule_optimization'
                                      };
                                      return alg.category === processAlgorithmMap[process.id] || alg.isStandard;
                                    })
                                    .map((alg: any) => (
                                      <SelectItem key={alg.id} value={alg.id.toString()}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{alg.displayName || alg.name}</span>
                                          {alg.isStandard && (
                                            <Badge variant="outline" className="ml-2 text-xs">Standard</Badge>
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Set standard algorithms for all plants
                      const standardSchedulingAlg = algorithms.find(a => a.isStandard && a.category === 'schedule_optimization');
                      const standardInventoryAlg = algorithms.find(a => a.isStandard && a.category === 'inventory_optimization');
                      
                      if (standardSchedulingAlg || standardInventoryAlg) {
                        const newConfigs: Record<string, Record<string, number>> = {};
                        plants.forEach(plant => {
                          newConfigs[plant.id.toString()] = {};
                          planningProcesses.forEach(process => {
                            if (['scheduling', 'master_production_schedule', 'labor_planning'].includes(process.id) && standardSchedulingAlg) {
                              newConfigs[plant.id.toString()][process.id] = standardSchedulingAlg.id;
                            } else if (process.id === 'inventory_optimization' && standardInventoryAlg) {
                              newConfigs[plant.id.toString()][process.id] = standardInventoryAlg.id;
                            }
                          });
                        });
                        setAlgorithmConfigs(newConfigs);
                      }
                    }}
                  >
                    Apply Standard Algorithms
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Clear all configurations
                      setAlgorithmConfigs({});
                    }}
                  >
                    Clear All
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Copy configuration from first plant to all others
                      if (plants.length > 0) {
                        const sourceConfig = algorithmConfigs[plants[0].id.toString()];
                        if (sourceConfig) {
                          const newConfigs: Record<string, Record<string, number>> = {};
                          plants.forEach(plant => {
                            newConfigs[plant.id.toString()] = { ...sourceConfig };
                          });
                          setAlgorithmConfigs(newConfigs);
                        }
                      }
                    }}
                  >
                    Copy from {plants[0]?.name}
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
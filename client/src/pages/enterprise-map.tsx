import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from 'react-simple-maps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  Home
} from 'lucide-react';

// World map topology URL (you can also use a local file)
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@3.2/world/110m.json";

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
  createdAt: string;
}

interface MapMetric {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  getValue: (plant: Plant) => number | string;
  getColor: (value: number | string) => string;
  format: (value: number | string) => string;
}

// Define available metrics for plants
const mapMetrics: MapMetric[] = [
  {
    id: 'efficiency',
    name: 'Efficiency',
    icon: TrendingUp,
    getValue: (plant) => plant.operationalMetrics?.efficiency || 85,
    getColor: (value) => {
      const num = typeof value === 'number' ? value : 85;
      if (num >= 90) return '#10b981'; // green
      if (num >= 75) return '#f59e0b'; // yellow
      return '#ef4444'; // red
    },
    format: (value) => `${value}%`
  },
  {
    id: 'utilization',
    name: 'Utilization',
    icon: Activity,
    getValue: (plant) => plant.operationalMetrics?.utilization || 78,
    getColor: (value) => {
      const num = typeof value === 'number' ? value : 78;
      if (num >= 85) return '#10b981';
      if (num >= 70) return '#f59e0b';
      return '#ef4444';
    },
    format: (value) => `${value}%`
  },
  {
    id: 'capacity',
    name: 'Capacity',
    icon: Package,
    getValue: (plant) => plant.capacity?.total || 1000,
    getColor: () => '#3b82f6', // blue
    format: (value) => `${typeof value === 'number' ? value.toLocaleString() : value} units`
  },
  {
    id: 'workforce',
    name: 'Workforce',
    icon: Users,
    getValue: (plant) => plant.operationalMetrics?.workforce || 150,
    getColor: () => '#8b5cf6', // purple
    format: (value) => `${value} employees`
  },
  {
    id: 'status',
    name: 'Status',
    icon: CheckCircle,
    getValue: (plant) => plant.isActive ? 'Active' : 'Inactive',
    getColor: (value) => value === 'Active' ? '#10b981' : '#ef4444',
    format: (value) => String(value)
  }
];

export default function EnterprisePage() {
  const [selectedMetric, setSelectedMetric] = useState<string>('efficiency');
  const [showMetrics, setShowMetrics] = useState(true);
  const [mapProjection, setMapProjection] = useState<'world' | 'usa'>('world');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);

  const { data: plants = [], isLoading } = useQuery<Plant[]>({
    queryKey: ['/api/plants'],
  });

  // Determine geographic scope based on plant locations
  const geographicScope = useMemo(() => {
    if (!plants.length) return 'world';
    
    const countries = [...new Set(plants.map(plant => plant.country).filter(Boolean))];
    const hasInternational = countries.length > 1 || countries.some(c => c && c.toLowerCase() !== 'usa' && c.toLowerCase() !== 'united states');
    
    return hasInternational ? 'world' : 'usa';
  }, [plants]);

  // Get current metric definition
  const currentMetric = mapMetrics.find(m => m.id === selectedMetric) || mapMetrics[0];

  // Calculate aggregated metrics
  const aggregatedMetrics = useMemo(() => {
    if (!plants.length) return {};
    
    const activePlants = plants.filter(p => p.isActive);
    const totalCapacity = activePlants.reduce((sum, plant) => sum + (plant.capacity?.total || 0), 0);
    const avgEfficiency = activePlants.reduce((sum, plant) => sum + (plant.operationalMetrics?.efficiency || 0), 0) / activePlants.length;
    const avgUtilization = activePlants.reduce((sum, plant) => sum + (plant.operationalMetrics?.utilization || 0), 0) / activePlants.length;
    const totalWorkforce = activePlants.reduce((sum, plant) => sum + (plant.operationalMetrics?.workforce || 0), 0);

    return {
      totalPlants: plants.length,
      activePlants: activePlants.length,
      totalCapacity,
      avgEfficiency: Math.round(avgEfficiency),
      avgUtilization: Math.round(avgUtilization),
      totalWorkforce,
      countries: [...new Set(plants.map(p => p.country).filter(Boolean))].length,
    };
  }, [plants]);

  const resetView = () => {
    setZoom(1);
    setCenter([0, 20]);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Enterprise Map
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Global overview of plant operations and performance metrics
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="show-metrics">Show Metrics</Label>
            <Switch
              id="show-metrics"
              checked={showMetrics}
              onCheckedChange={setShowMetrics}
            />
          </div>
          
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mapMetrics.map((metric) => (
                <SelectItem key={metric.id} value={metric.id}>
                  <div className="flex items-center space-x-2">
                    <metric.icon className="w-4 h-4" />
                    <span>{metric.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Factory className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Plants</p>
                <p className="text-xl font-bold">{aggregatedMetrics.totalPlants || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-xl font-bold">{aggregatedMetrics.activePlants || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Countries</p>
                <p className="text-xl font-bold">{aggregatedMetrics.countries || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Efficiency</p>
                <p className="text-xl font-bold">{aggregatedMetrics.avgEfficiency || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Utilization</p>
                <p className="text-xl font-bold">{aggregatedMetrics.avgUtilization || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Workforce</p>
                <p className="text-xl font-bold">{(aggregatedMetrics.totalWorkforce || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Plant Locations</span>
              {showMetrics && (
                <Badge variant="outline" className="ml-2">
                  {currentMetric.name}
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center space-x-2">
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
        </CardHeader>
        
        <CardContent>
          <div className="w-full h-96 lg:h-[500px] border rounded-lg overflow-hidden">
            <TooltipProvider>
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                  scale: geographicScope === 'usa' ? 1000 : 147,
                  center: geographicScope === 'usa' ? [-100, 40] : center,
                }}
                className="w-full h-full"
              >
                <ZoomableGroup zoom={zoom} center={center} onMoveEnd={setCenter}>
                  <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill="#f3f4f6"
                          stroke="#e5e7eb"
                          strokeWidth={0.5}
                          className="hover:fill-gray-200 transition-colors duration-200"
                        />
                      ))
                    }
                  </Geographies>
                  
                  {/* Plant Markers */}
                  {plants.map((plant) => {
                    if (!plant.latitude || !plant.longitude) return null;
                    
                    const lat = parseFloat(plant.latitude);
                    const lng = parseFloat(plant.longitude);
                    
                    if (isNaN(lat) || isNaN(lng)) return null;
                    
                    const metricValue = currentMetric.getValue(plant);
                    const markerColor = showMetrics ? currentMetric.getColor(metricValue) : '#3b82f6';
                    
                    return (
                      <Tooltip key={plant.id}>
                        <TooltipTrigger asChild>
                          <Marker coordinates={[lng, lat]} onClick={() => setSelectedPlant(plant)}>
                            <circle
                              r={8}
                              fill={markerColor}
                              stroke="#ffffff"
                              strokeWidth={2}
                              className="hover:r-10 transition-all duration-200 cursor-pointer"
                            />
                            <Factory
                              x={-6}
                              y={-6}
                              width={12}
                              height={12}
                              fill="white"
                              className="pointer-events-none"
                            />
                          </Marker>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-semibold">{plant.name}</p>
                            <p className="text-sm text-gray-600">
                              {plant.city && plant.country ? `${plant.city}, ${plant.country}` : plant.location}
                            </p>
                            {showMetrics && (
                              <p className="text-sm">
                                <span className="font-medium">{currentMetric.name}:</span> {currentMetric.format(metricValue)}
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </ZoomableGroup>
              </ComposableMap>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Plant Detail Dialog */}
      <Dialog open={!!selectedPlant} onOpenChange={() => setSelectedPlant(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Factory className="w-5 h-5" />
              <span>{selectedPlant?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Detailed plant information and operational metrics
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlant && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Location</h4>
                  <p className="text-sm">
                    {selectedPlant.city && selectedPlant.country 
                      ? `${selectedPlant.city}, ${selectedPlant.state || ''} ${selectedPlant.country}`.trim()
                      : selectedPlant.location || 'Not specified'
                    }
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Type</h4>
                  <Badge variant="outline">
                    {selectedPlant.plantType || 'Manufacturing'}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Status</h4>
                  <Badge variant={selectedPlant.isActive ? "default" : "secondary"}>
                    {selectedPlant.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Timezone</h4>
                  <p className="text-sm">{selectedPlant.timezone}</p>
                </div>
              </div>

              {/* Metrics */}
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Operational Metrics</h4>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {mapMetrics.map((metric) => {
                    const value = metric.getValue(selectedPlant);
                    const color = metric.getColor(value);
                    
                    return (
                      <div key={metric.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <metric.icon className="w-5 h-5" style={{ color }} />
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{metric.name}</p>
                          <p className="font-semibold" style={{ color }}>
                            {metric.format(value)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Additional Details */}
              {selectedPlant.address && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Full Address</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPlant.address}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Legend */}
      {showMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Legend - {currentMetric.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {currentMetric.id === 'efficiency' || currentMetric.id === 'utilization' ? (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-sm">
                      {currentMetric.id === 'efficiency' ? '≥90%' : '≥85%'} - Excellent
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span className="text-sm">
                      {currentMetric.id === 'efficiency' ? '75-89%' : '70-84%'} - Good
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-sm">
                      {currentMetric.id === 'efficiency' ? '<75%' : '<70%'} - Needs Attention
                    </span>
                  </div>
                </>
              ) : currentMetric.id === 'status' ? (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-sm">Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-sm">Inactive</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Plant Location</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Settings, BarChart, Calendar, Play, Edit2, Trash2, ChevronRight, Clock, Package, Palette } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import type { PtProductWheel, PtProductWheelSegment } from "@shared/schema";

export default function ProductWheelsPage() {
  const [selectedWheel, setSelectedWheel] = useState<PtProductWheel | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("designer");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all product wheels
  const { data: wheels = [], isLoading: wheelsLoading } = useQuery<PtProductWheel[]>({
    queryKey: ['/api/product-wheels'],
  });

  // Fetch plants for selection
  const { data: plants = [], isLoading: plantsLoading } = useQuery<any[]>({
    queryKey: ['/api/ptplants'],
  });

  // Fetch resources for selection
  const { data: resources = [], isLoading: resourcesLoading } = useQuery<any[]>({
    queryKey: ['/api/ptresources'],
  });

  // Fetch segments for selected wheel
  const { data: segments = [] } = useQuery<PtProductWheelSegment[]>({
    queryKey: ['/api/product-wheels', selectedWheel?.id, 'segments'],
    enabled: !!selectedWheel,
  });

  // Create wheel mutation
  const createWheel = useMutation({
    mutationFn: (data: any) => apiRequest('/api/product-wheels', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-wheels'] });
      setIsCreateDialogOpen(false);
      toast({ title: "Product wheel created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create product wheel", variant: "destructive" });
    }
  });

  const calculateTotalCycleTime = () => {
    return segments.reduce((acc: number, segment: PtProductWheelSegment) => 
      acc + parseFloat(segment.allocatedHours || '0'), 0
    );
  };

  const getWheelStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'draft': return 'secondary';
      case 'archived': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Product Wheels</h1>
          <p className="text-muted-foreground">
            Optimize production cycles with campaign wheel scheduling
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Product Wheel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create Product Wheel</DialogTitle>
              <DialogDescription>
                Define a new cyclic production campaign for optimized scheduling
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createWheel.mutate({
                name: formData.get('name'),
                description: formData.get('description'),
                plantId: parseInt(formData.get('plantId') as string),
                resourceId: parseInt(formData.get('resourceId') as string),
                cycleDurationHours: parseFloat(formData.get('cycleDurationHours') as string),
                status: 'draft'
              });
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Wheel Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Line 1 Weekly Cycle"
                    required
                    data-testid="input-wheel-name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the wheel purpose and products..."
                    data-testid="input-wheel-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="plantId">Plant</Label>
                    <Select name="plantId" required>
                      <SelectTrigger data-testid="select-plant">
                        <SelectValue placeholder="Select plant" />
                      </SelectTrigger>
                      <SelectContent>
                        {plants.map((plant: any) => (
                          <SelectItem key={plant.id} value={plant.id.toString()}>
                            {plant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="resourceId">Resource</Label>
                    <Select name="resourceId" required>
                      <SelectTrigger data-testid="select-resource">
                        <SelectValue placeholder="Select resource" />
                      </SelectTrigger>
                      <SelectContent>
                        {resources.map((resource: any) => (
                          <SelectItem key={resource.id} value={resource.id.toString()}>
                            {resource.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cycleDurationHours">Cycle Duration (hours)</Label>
                  <Input
                    id="cycleDurationHours"
                    name="cycleDurationHours"
                    type="number"
                    step="0.5"
                    placeholder="e.g., 168 for weekly"
                    required
                    data-testid="input-cycle-duration"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createWheel.isPending}>
                  {createWheel.isPending ? "Creating..." : "Create Wheel"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Wheels List */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Available Wheels</CardTitle>
              <CardDescription>Select a wheel to view details</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {wheelsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading wheels...</p>
                  ) : wheels.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No wheels created yet</p>
                  ) : (
                    wheels.map((wheel: PtProductWheel) => (
                      <div
                        key={wheel.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedWheel?.id === wheel.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedWheel(wheel)}
                        data-testid={`wheel-item-${wheel.id}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{wheel.name}</h3>
                          <Badge variant={wheel.status === 'active' ? 'default' : 'secondary'}>
                            {wheel.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {wheel.description}
                        </p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {wheel.cycleDurationHours}h
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Wheel Details */}
        <div className="col-span-9">
          {selectedWheel ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedWheel.name}</CardTitle>
                    <CardDescription>{selectedWheel.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {selectedWheel.status === 'draft' && (
                      <Button>
                        <Play className="w-4 h-4 mr-2" />
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="designer">Designer</TabsTrigger>
                    <TabsTrigger value="visualization">Visualization</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                  </TabsList>

                  <TabsContent value="designer" className="space-y-4">
                    <WheelDesigner wheel={selectedWheel} segments={segments} />
                  </TabsContent>

                  <TabsContent value="visualization">
                    <WheelVisualization wheel={selectedWheel} segments={segments} />
                  </TabsContent>

                  <TabsContent value="schedule">
                    <WheelSchedule wheel={selectedWheel} />
                  </TabsContent>

                  <TabsContent value="performance">
                    <WheelPerformance wheel={selectedWheel} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-[600px] text-muted-foreground">
                <div className="text-center">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a product wheel to view details</p>
                  <p className="text-sm mt-2">or create a new one to get started</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-components for tabs
function WheelDesigner({ wheel, segments }: { wheel: PtProductWheel; segments: PtProductWheelSegment[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Product Segments</h3>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Segment
        </Button>
      </div>
      <div className="space-y-2">
        {segments.map((segment, index) => (
          <Card key={segment.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold text-muted-foreground">
                  #{segment.sequenceNumber}
                </div>
                <div>
                  <p className="font-medium">{segment.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    {segment.productCode} • {segment.allocatedHours}h allocated
                  </p>
                </div>
                {segment.colorCode && (
                  <div 
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: segment.colorCode }}
                  />
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WheelVisualization({ wheel, segments }: { wheel: PtProductWheel; segments: PtProductWheelSegment[] }) {
  const totalHours = segments.reduce((acc, seg) => acc + parseFloat(seg.allocatedHours || '0'), 0);
  
  // Calculate angles for each segment
  const calculateSegmentPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = Math.cos(startAngleRad);
    const y1 = Math.sin(startAngleRad);
    const x2 = Math.cos(endAngleRad);
    const y2 = Math.sin(endAngleRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `
      M ${x1 * innerRadius} ${y1 * innerRadius}
      L ${x1 * outerRadius} ${y1 * outerRadius}
      A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2 * outerRadius} ${y2 * outerRadius}
      L ${x2 * innerRadius} ${y2 * innerRadius}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1 * innerRadius} ${y1 * innerRadius}
      Z
    `;
  };
  
  let currentAngle = -90; // Start at top
  
  return (
    <div className="space-y-4">
      {/* Circular Wheel Visualization */}
      <div className="flex justify-center">
        <div className="relative">
          <svg width="400" height="400" viewBox="-200 -200 400 400">
            {/* Background circle */}
            <circle
              cx="0"
              cy="0"
              r="180"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="2"
            />
            
            {/* Segments */}
            {segments.map((segment, index) => {
              const segmentHours = parseFloat(segment.allocatedHours || '0');
              const segmentAngle = (segmentHours / totalHours) * 360;
              const path = calculateSegmentPath(currentAngle, currentAngle + segmentAngle, 80, 180);
              const midAngle = currentAngle + segmentAngle / 2;
              const midAngleRad = (midAngle * Math.PI) / 180;
              const labelRadius = 130;
              const labelX = Math.cos(midAngleRad) * labelRadius;
              const labelY = Math.sin(midAngleRad) * labelRadius;
              
              const element = (
                <g key={segment.id}>
                  <path
                    d={path}
                    fill={segment.colorCode || '#94a3b8'}
                    stroke="white"
                    strokeWidth="2"
                    opacity="0.9"
                    className="hover:opacity-100 transition-opacity cursor-pointer"
                  />
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-white font-medium text-sm pointer-events-none"
                  >
                    {segment.productCode}
                  </text>
                  <text
                    x={labelX}
                    y={labelY + 15}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-white text-xs pointer-events-none"
                  >
                    {segmentHours}h
                  </text>
                </g>
              );
              
              currentAngle += segmentAngle;
              return element;
            })}
            
            {/* Center text */}
            <text
              x="0"
              y="-10"
              textAnchor="middle"
              className="fill-gray-700 font-bold text-lg"
            >
              {wheel.name}
            </text>
            <text
              x="0"
              y="10"
              textAnchor="middle"
              className="fill-gray-500 text-sm"
            >
              {wheel.cycleDurationHours}h cycle
            </text>
          </svg>
        </div>
      </div>
      
      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto">
        {segments.map((segment) => (
          <div key={segment.id} className="flex items-center space-x-2 p-2 border rounded-lg">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: segment.colorCode || '#94a3b8' }}
            />
            <div className="flex-1">
              <p className="text-sm font-medium">{segment.productName}</p>
              <p className="text-xs text-muted-foreground">
                {segment.allocatedHours}h ({Math.round((parseFloat(segment.allocatedHours || '0') / totalHours) * 100)}%)
                • {segment.changeoverFromPrevious}min changeover
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Metrics Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Cycle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wheel.cycleDurationHours}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((totalHours / parseFloat(wheel.cycleDurationHours as any)) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function WheelSchedule({ wheel }: { wheel: PtProductWheel }) {
  const [selectedView, setSelectedView] = useState<'calendar' | 'timeline'>('calendar');
  
  // Generate sample scheduled cycles
  const generateScheduledCycles = () => {
    const cycles = [];
    const now = new Date();
    const cycleHours = parseFloat(wheel.cycleDurationHours as any);
    
    for (let i = 0; i < 12; i++) {
      const startDate = new Date(now);
      startDate.setHours(now.getHours() + (i * cycleHours));
      
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + cycleHours);
      
      cycles.push({
        id: i + 1,
        cycleNumber: i + 1,
        startDate,
        endDate,
        status: i === 0 ? 'running' : i < 3 ? 'scheduled' : 'planned',
        actualStart: i === 0 ? startDate : null,
        actualEnd: null,
        performance: i === 0 ? 87 : null,
        notes: i === 0 ? 'Currently in progress' : i === 1 ? 'Next cycle ready' : ''
      });
    }
    
    return cycles;
  };
  
  const scheduledCycles = generateScheduledCycles();
  const currentCycle = scheduledCycles.find(c => c.status === 'running');
  const upcomingCycles = scheduledCycles.filter(c => c.status === 'scheduled');
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="font-medium">Production Schedule</h3>
          <div className="flex gap-2">
            <Button 
              variant={selectedView === 'calendar' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedView('calendar')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </Button>
            <Button 
              variant={selectedView === 'timeline' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedView('timeline')}
            >
              <Clock className="w-4 h-4 mr-2" />
              Timeline
            </Button>
          </div>
        </div>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Schedule New Cycle
        </Button>
      </div>
      
      {/* Current Cycle Status */}
      {currentCycle && (
        <Card className="border-green-500">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                Current Cycle Running
              </CardTitle>
              <Badge variant="default">Cycle #{currentCycle.cycleNumber}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Started</p>
                <p className="font-medium">{currentCycle.actualStart?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expected End</p>
                <p className="font-medium">{currentCycle.endDate.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <div className="flex items-center gap-2">
                  <Progress value={35} className="flex-1" />
                  <span className="text-sm font-medium">35%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Performance</p>
                <p className="font-medium text-green-600">{currentCycle.performance}% OEE</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* View Content */}
      {selectedView === 'calendar' ? (
        <div className="space-y-4">
          {/* Week View */}
          <Card>
            <CardHeader>
              <CardTitle className="text-md">7-Day Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                  const date = new Date();
                  date.setDate(date.getDate() + dayOffset);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = date.getDate();
                  
                  const cyclesOnDay = scheduledCycles.filter(cycle => {
                    const cycleDate = new Date(cycle.startDate);
                    return cycleDate.toDateString() === date.toDateString();
                  });
                  
                  return (
                    <div key={dayOffset} className="border rounded-lg p-2">
                      <div className="text-center mb-2">
                        <p className="text-xs text-muted-foreground">{dayName}</p>
                        <p className="font-bold">{dayNum}</p>
                      </div>
                      <div className="space-y-1">
                        {cyclesOnDay.map(cycle => (
                          <div
                            key={cycle.id}
                            className={`text-xs p-1 rounded ${
                              cycle.status === 'running' ? 'bg-green-100 text-green-700' :
                              cycle.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            Cycle #{cycle.cycleNumber}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          {/* Upcoming Cycles List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-md">Upcoming Cycles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingCycles.slice(0, 5).map((cycle) => (
                  <div key={cycle.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">#{cycle.cycleNumber}</Badge>
                      <div>
                        <p className="font-medium">Cycle {cycle.cycleNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {cycle.startDate.toLocaleDateString()} {cycle.startDate.toLocaleTimeString()} - 
                          {cycle.endDate.toLocaleDateString()} {cycle.endDate.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={cycle.status === 'scheduled' ? 'default' : 'secondary'}>
                        {cycle.status}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Timeline View */
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Production Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline header with hours */}
              <div className="flex justify-between mb-2 text-xs text-muted-foreground">
                <span>Now</span>
                <span>+24h</span>
                <span>+48h</span>
                <span>+72h</span>
                <span>+96h</span>
                <span>+120h</span>
                <span>+144h</span>
                <span>+168h</span>
              </div>
              
              {/* Timeline bars */}
              <div className="space-y-2">
                {scheduledCycles.slice(0, 8).map((cycle) => {
                  const totalHours = 168; // 1 week view
                  const startOffset = (cycle.startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
                  const duration = parseFloat(wheel.cycleDurationHours as any);
                  const leftPercent = Math.max(0, (startOffset / totalHours) * 100);
                  const widthPercent = (duration / totalHours) * 100;
                  
                  return (
                    <div key={cycle.id} className="relative h-10">
                      <div className="absolute inset-0 bg-gray-100 rounded" />
                      <div
                        className={`absolute h-full rounded flex items-center px-2 ${
                          cycle.status === 'running' ? 'bg-green-500' :
                          cycle.status === 'scheduled' ? 'bg-blue-500' :
                          'bg-gray-400'
                        }`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                      >
                        <span className="text-xs text-white font-medium">
                          Cycle #{cycle.cycleNumber}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Current time indicator */}
              <div className="absolute top-8 bottom-0 left-0 w-0.5 bg-red-500" />
            </div>
            
            {/* Legend */}
            <div className="flex gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>Running</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span>Scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded" />
                <span>Planned</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Schedule Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Schedule Adherence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Cycle Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parseFloat(wheel.cycleDurationHours as any) * 0.98}h</div>
            <p className="text-xs text-muted-foreground">vs {wheel.cycleDurationHours}h target</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cycles Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">This month: 24</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Next Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8 cycles</div>
            <p className="text-xs text-muted-foreground">~{parseFloat(wheel.cycleDurationHours as any) * 8}h</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function WheelPerformance({ wheel }: { wheel: PtProductWheel }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">OEE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.5%</div>
            <p className="text-xs text-muted-foreground">+2.5% from last cycle</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Changeovers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">15 min avg</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inventory Turns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.2x</div>
            <p className="text-xs text-muted-foreground">Target: 7.5x</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
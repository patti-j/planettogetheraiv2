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
  return (
    <div className="flex items-center justify-center h-[400px]">
      <div className="text-center text-muted-foreground">
        <BarChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Circular wheel visualization coming soon</p>
        <p className="text-sm mt-2">Will display segments as a circular diagram</p>
      </div>
    </div>
  );
}

function WheelSchedule({ wheel }: { wheel: PtProductWheel }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Scheduled Cycles</h3>
        <Button size="sm">
          <Calendar className="w-4 h-4 mr-2" />
          Schedule New Cycle
        </Button>
      </div>
      <div className="text-center text-muted-foreground py-8">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No cycles scheduled yet</p>
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
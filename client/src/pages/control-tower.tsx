import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Globe, 
  TrendingUp, 
  Target, 
  Settings, 
  Plus, 
  Edit,
  Trash2,
  PlayCircle,
  PauseCircle,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Brain,
  Activity
} from "lucide-react";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, BarChart } from "recharts";

interface Plant {
  id: number;
  name: string;
  location: string;
  isActive: boolean;
}

interface PlantKpiTarget {
  id: number;
  plantId: number;
  kpiName: string;
  kpiType: string;
  targetValue: number;
  unitOfMeasure: string;
  weight: number;
  isActive: boolean;
  description: string;
  excellentThreshold: number;
  goodThreshold: number;
  warningThreshold: number;
  plant?: Plant;
}

interface PlantKpiPerformance {
  id: number;
  plantKpiTargetId: number;
  measurementDate: string;
  actualValue: number;
  targetValue: number;
  performanceRatio: number;
  performanceGrade: string;
}

interface AutonomousOptimization {
  id: number;
  name: string;
  description: string;
  plantId: number;
  isEnabled: boolean;
  optimizationObjective: string;
  targetKpiIds: number[];
  allowedAlgorithms: string[];
  currentAlgorithm: string;
  autoAlgorithmSelection: boolean;
  enableParameterTuning: boolean;
  learningMode: string;
  performanceThreshold: number;
  evaluationPeriodMinutes: number;
  totalOptimizations: number;
  successfulOptimizations: number;
  lastOptimizationAt: string;
  lastPerformanceScore: number;
  plant?: Plant;
}

// KPI Target Form Component
function KpiTargetForm({ kpi, plants, onSave, isLoading }: {
  kpi: PlantKpiTarget | null;
  plants: Plant[];
  onSave: (data: Partial<PlantKpiTarget>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    plantId: kpi?.plantId || 0,
    kpiName: kpi?.kpiName || "",
    kpiType: kpi?.kpiType || "efficiency",
    targetValue: kpi?.targetValue || 0,
    unitOfMeasure: kpi?.unitOfMeasure || "%",
    isActive: kpi?.isActive ?? true,
    description: kpi?.description || "",
    goodThreshold: kpi?.goodThreshold || 0.90,
    warningThreshold: kpi?.warningThreshold || 0.80,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="plantId">Plant</Label>
          <Select
            value={formData.plantId.toString()}
            onValueChange={(value) => setFormData({ ...formData, plantId: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Plant" />
            </SelectTrigger>
            <SelectContent>
              {plants.map((plant) => (
                <SelectItem key={plant.id} value={plant.id.toString()}>
                  {plant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="kpiType">KPI Type</Label>
          <Select
            value={formData.kpiType}
            onValueChange={(value) => setFormData({ ...formData, kpiType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="efficiency">Efficiency</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
              <SelectItem value="throughput">Throughput</SelectItem>
              <SelectItem value="cost">Cost</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="safety">Safety</SelectItem>
              <SelectItem value="oee">OEE</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="kpiName">KPI Name</Label>
        <Input
          value={formData.kpiName}
          onChange={(e) => setFormData({ ...formData, kpiName: e.target.value })}
          placeholder="e.g., Overall Equipment Effectiveness"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what this KPI measures and why it's important"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="targetValue">Target Value</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.targetValue}
            onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) })}
            required
          />
        </div>

        <div>
          <Label htmlFor="unitOfMeasure">Unit</Label>
          <Input
            value={formData.unitOfMeasure}
            onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
            placeholder="%"
            required
          />
        </div>

      </div>

      <div className="grid grid-cols-3 gap-4">

        <div>
          <Label htmlFor="goodThreshold">Good Threshold</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="2"
            value={formData.goodThreshold}
            onChange={(e) => setFormData({ ...formData, goodThreshold: parseFloat(e.target.value) })}
          />
        </div>

        <div>
          <Label htmlFor="warningThreshold">Warning Threshold</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="2"
            value={formData.warningThreshold}
            onChange={(e) => setFormData({ ...formData, warningThreshold: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : kpi ? "Update KPI Target" : "Create KPI Target"}
        </Button>
      </div>
    </form>
  );
}

// Optimization Configuration Form Component
function OptimizationConfigForm({ optimization, plants, kpiTargets, onSave, isLoading }: {
  optimization: AutonomousOptimization | null;
  plants: Plant[];
  kpiTargets: PlantKpiTarget[];
  onSave: (data: Partial<AutonomousOptimization>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: optimization?.name || "",
    description: optimization?.description || "",
    plantId: optimization?.plantId || 0,
    isEnabled: optimization?.isEnabled ?? false,
    optimizationObjective: optimization?.optimizationObjective || "maximize_weighted_kpis",
    targetKpiIds: optimization?.targetKpiIds || [],
    allowedAlgorithms: optimization?.allowedAlgorithms || ["ASAP", "ALAP", "CRITICAL_PATH"],
    currentAlgorithm: optimization?.currentAlgorithm || "ASAP",
    autoAlgorithmSelection: optimization?.autoAlgorithmSelection ?? true,
    enableParameterTuning: optimization?.enableParameterTuning ?? true,
    learningMode: optimization?.learningMode || "adaptive",
    performanceThreshold: optimization?.performanceThreshold || 0.85,
    evaluationPeriodMinutes: optimization?.evaluationPeriodMinutes || 60,
  });

  const plantKpis = kpiTargets.filter(kpi => kpi.plantId === formData.plantId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleKpiToggle = (kpiId: number) => {
    const targetKpiIds = formData.targetKpiIds.includes(kpiId)
      ? formData.targetKpiIds.filter(id => id !== kpiId)
      : [...formData.targetKpiIds, kpiId];
    setFormData({ ...formData, targetKpiIds });
  };

  const handleAlgorithmToggle = (algorithm: string) => {
    const allowedAlgorithms = formData.allowedAlgorithms.includes(algorithm)
      ? formData.allowedAlgorithms.filter(alg => alg !== algorithm)
      : [...formData.allowedAlgorithms, algorithm];
    setFormData({ ...formData, allowedAlgorithms });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Configuration Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Main Plant Auto-Optimization"
            required
          />
        </div>

        <div>
          <Label htmlFor="plantId">Plant</Label>
          <Select
            value={formData.plantId.toString()}
            onValueChange={(value) => setFormData({ ...formData, plantId: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Plant" />
            </SelectTrigger>
            <SelectContent>
              {plants.map((plant) => (
                <SelectItem key={plant.id} value={plant.id.toString()}>
                  {plant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the optimization goals and approach"
        />
      </div>

      <div>
        <Label>Target KPIs (Select multiple KPIs to optimize)</Label>
        <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto border rounded p-2">
          {plantKpis.map((kpi) => (
            <div key={kpi.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`kpi-${kpi.id}`}
                checked={formData.targetKpiIds.includes(kpi.id)}
                onChange={() => handleKpiToggle(kpi.id)}
                className="rounded"
              />
              <Label htmlFor={`kpi-${kpi.id}`} className="text-sm">
                {kpi.kpiName} (Weight: {kpi.weight})
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Allowed Algorithms</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {["ASAP", "ALAP", "CRITICAL_PATH", "LEVEL_RESOURCES", "DRUM_TOC"].map((algorithm) => (
            <div key={algorithm} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`alg-${algorithm}`}
                checked={formData.allowedAlgorithms.includes(algorithm)}
                onChange={() => handleAlgorithmToggle(algorithm)}
                className="rounded"
              />
              <Label htmlFor={`alg-${algorithm}`} className="text-sm">
                {algorithm.replace("_", " ")}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currentAlgorithm">Current Algorithm</Label>
          <Select
            value={formData.currentAlgorithm}
            onValueChange={(value) => setFormData({ ...formData, currentAlgorithm: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formData.allowedAlgorithms.map((alg) => (
                <SelectItem key={alg} value={alg}>
                  {alg.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="learningMode">Learning Mode</Label>
          <Select
            value={formData.learningMode}
            onValueChange={(value) => setFormData({ ...formData, learningMode: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="adaptive">Adaptive</SelectItem>
              <SelectItem value="conservative">Conservative</SelectItem>
              <SelectItem value="aggressive">Aggressive</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="performanceThreshold">Performance Threshold</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={formData.performanceThreshold}
            onChange={(e) => setFormData({ ...formData, performanceThreshold: parseFloat(e.target.value) })}
          />
        </div>

        <div>
          <Label htmlFor="evaluationPeriod">Evaluation Period (minutes)</Label>
          <Input
            type="number"
            min="1"
            max="1440"
            value={formData.evaluationPeriodMinutes}
            onChange={(e) => setFormData({ ...formData, evaluationPeriodMinutes: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Switch
            id="autoAlgorithmSelection"
            checked={formData.autoAlgorithmSelection}
            onCheckedChange={(checked) => setFormData({ ...formData, autoAlgorithmSelection: checked })}
          />
          <Label htmlFor="autoAlgorithmSelection">Enable Automatic Algorithm Selection</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="enableParameterTuning"
            checked={formData.enableParameterTuning}
            onCheckedChange={(checked) => setFormData({ ...formData, enableParameterTuning: checked })}
          />
          <Label htmlFor="enableParameterTuning">Enable Automatic Parameter Tuning</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isEnabled"
            checked={formData.isEnabled}
            onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
          />
          <Label htmlFor="isEnabled">Enable Autonomous Optimization</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : optimization ? "Update Configuration" : "Create Configuration"}
        </Button>
      </div>
    </form>
  );
}

export default function ControlTower() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlant, setSelectedPlant] = useState<number | null>(null);
  const [isKpiDialogOpen, setIsKpiDialogOpen] = useState(false);
  const [isOptimizationDialogOpen, setIsOptimizationDialogOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<PlantKpiTarget | null>(null);
  const [editingOptimization, setEditingOptimization] = useState<AutonomousOptimization | null>(null);

  // Fetch plants
  const { data: plants = [] } = useQuery({
    queryKey: ["/api/plants"],
  });

  // Fetch KPI targets
  const { data: kpiTargets = [] } = useQuery({
    queryKey: ["/api/plant-kpi-targets"],
  });

  // Fetch KPI performance data
  const { data: kpiPerformance = [] } = useQuery({
    queryKey: ["/api/plant-kpi-performance"],
  });

  // Fetch autonomous optimization configurations
  const { data: optimizationConfigs = [] } = useQuery({
    queryKey: ["/api/autonomous-optimization"],
  });

  // Create/Update KPI Target
  const saveKpiMutation = useMutation({
    mutationFn: async (data: Partial<PlantKpiTarget>) => {
      if (editingKpi) {
        return apiRequest(`/api/plant-kpi-targets/${editingKpi.id}`, "PATCH", data);
      } else {
        return apiRequest("/api/plant-kpi-targets", "POST", data);
      }
    },
    onSuccess: () => {
      toast({ title: "KPI target saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/plant-kpi-targets"] });
      setIsKpiDialogOpen(false);
      setEditingKpi(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving KPI target",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create/Update Autonomous Optimization
  const saveOptimizationMutation = useMutation({
    mutationFn: async (data: Partial<AutonomousOptimization>) => {
      if (editingOptimization) {
        return apiRequest(`/api/autonomous-optimization/${editingOptimization.id}`, "PATCH", data);
      } else {
        return apiRequest("/api/autonomous-optimization", "POST", data);
      }
    },
    onSuccess: () => {
      toast({ title: "Autonomous optimization saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-optimization"] });
      setIsOptimizationDialogOpen(false);
      setEditingOptimization(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving autonomous optimization",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete KPI Target
  const deleteKpiMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/plant-kpi-targets/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "KPI target deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/plant-kpi-targets"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting KPI target",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle optimization status
  const toggleOptimizationMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: number; isEnabled: boolean }) => {
      return apiRequest(`/api/autonomous-optimization/${id}`, "PATCH", { isEnabled });
    },
    onSuccess: () => {
      toast({ title: "Optimization status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/autonomous-optimization"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating optimization status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter data by selected plant
  const filteredKpiTargets = selectedPlant 
    ? (kpiTargets as PlantKpiTarget[]).filter((kpi: PlantKpiTarget) => kpi.plantId === selectedPlant)
    : (kpiTargets as PlantKpiTarget[]);

  const filteredOptimizationConfigs = selectedPlant
    ? (optimizationConfigs as AutonomousOptimization[]).filter((config: AutonomousOptimization) => config.plantId === selectedPlant)
    : (optimizationConfigs as AutonomousOptimization[]);

  // Calculate overall plant performance
  const getPlantPerformance = (plantId: number) => {
    const plantKpis = (kpiTargets as PlantKpiTarget[]).filter((kpi: PlantKpiTarget) => kpi.plantId === plantId && kpi.isActive);
    if (plantKpis.length === 0) return null;

    const totalWeight = plantKpis.reduce((sum: number, kpi: PlantKpiTarget) => sum + kpi.weight, 0);
    let weightedScore = 0;

    plantKpis.forEach((kpi: PlantKpiTarget) => {
      const latestPerformance = (kpiPerformance as PlantKpiPerformance[])
        .filter((perf: PlantKpiPerformance) => perf.plantKpiTargetId === kpi.id)
        .sort((a: PlantKpiPerformance, b: PlantKpiPerformance) => 
          new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime()
        )[0];

      if (latestPerformance) {
        weightedScore += (latestPerformance.performanceRatio * kpi.weight);
      }
    });

    return totalWeight > 0 ? weightedScore / totalWeight : 0;
  };

  // Performance grade based on score
  const getPerformanceGrade = (score: number) => {
    if (score >= 0.95) return { grade: "Excellent", color: "text-green-600", bgColor: "bg-green-100" };
    if (score >= 0.90) return { grade: "Good", color: "text-blue-600", bgColor: "bg-blue-100" };
    if (score >= 0.80) return { grade: "Warning", color: "text-yellow-600", bgColor: "bg-yellow-100" };
    return { grade: "Critical", color: "text-red-600", bgColor: "bg-red-100" };
  };

  // Generate chart data for KPI performance
  const getKpiChartData = (kpiTargetId: number) => {
    return (kpiPerformance as PlantKpiPerformance[])
      .filter(perf => perf.plantKpiTargetId === kpiTargetId)
      .sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime())
      .slice(-7) // Last 7 data points
      .map(perf => ({
        date: new Date(perf.measurementDate).toLocaleDateString(),
        value: perf.actualValue,
        target: perf.targetValue,
        ratio: perf.performanceRatio * 100
      }));
  };



  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Globe className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Global Control Tower</h1>
            <p className="text-gray-600">Plant performance monitoring and autonomous optimization</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={selectedPlant?.toString() || "all"} onValueChange={(value) => setSelectedPlant(value === "all" ? null : parseInt(value))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Plants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plants</SelectItem>
              {plants.map((plant: Plant) => (
                <SelectItem key={plant.id} value={plant.id.toString()}>
                  {plant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Plant Performance Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plants.map((plant: Plant) => {
          const performance = getPlantPerformance(plant.id);
          const grade = performance ? getPerformanceGrade(performance) : null;
          const plantOptimization = optimizationConfigs.find((config: AutonomousOptimization) => config.plantId === plant.id);
          
          return (
            <Card key={plant.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plant.name}</CardTitle>
                  {plantOptimization?.isEnabled && (
                    <Badge className="bg-green-100 text-green-800">
                      <Zap className="h-3 w-3 mr-1" />
                      Auto-Optimizing
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{plant.location}</p>
              </CardHeader>
              <CardContent>
                {performance !== null ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Performance</span>
                      <Badge className={`${grade?.bgColor} ${grade?.color}`}>
                        {grade?.grade}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(performance * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {(performance * 100).toFixed(1)}%
                    </div>
                    {plantOptimization && (
                      <div className="text-sm text-gray-600">
                        <div>Algorithm: {plantOptimization.currentAlgorithm}</div>
                        <div>Optimizations: {plantOptimization.totalOptimizations}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No KPI targets configured</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="kpis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="kpis">KPI Management</TabsTrigger>
          <TabsTrigger value="optimization">Autonomous Optimization</TabsTrigger>
          <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
        </TabsList>

        {/* KPI Management Tab */}
        <TabsContent value="kpis" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">KPI Targets</h2>
            <Dialog open={isKpiDialogOpen} onOpenChange={setIsKpiDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingKpi(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add KPI Target
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingKpi ? "Edit KPI Target" : "Add KPI Target"}
                  </DialogTitle>
                </DialogHeader>
                <KpiTargetForm
                  kpi={editingKpi}
                  plants={plants as Plant[]}
                  onSave={(data) => saveKpiMutation.mutate(data)}
                  isLoading={saveKpiMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {filteredKpiTargets.map((kpi: PlantKpiTarget) => {
              const latestPerformance = (kpiPerformance as PlantKpiPerformance[])
                .filter((perf: PlantKpiPerformance) => perf.plantKpiTargetId === kpi.id)
                .sort((a: PlantKpiPerformance, b: PlantKpiPerformance) => 
                  new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime()
                )[0];

              const chartData = getKpiChartData(kpi.id);
              
              return (
                <Card key={kpi.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <Target className="h-5 w-5 text-blue-600" />
                          <span>{kpi.kpiName}</span>
                          <Badge variant="outline">Weight: {kpi.weight}</Badge>
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {kpi.plant?.name} • Target: {kpi.targetValue} {kpi.unitOfMeasure}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingKpi(kpi);
                            setIsKpiDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteKpiMutation.mutate(kpi.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {latestPerformance ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Current Performance</span>
                              <Badge className={
                                latestPerformance.performanceGrade === "excellent" ? "bg-green-100 text-green-800" :
                                latestPerformance.performanceGrade === "good" ? "bg-blue-100 text-blue-800" :
                                latestPerformance.performanceGrade === "warning" ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              }>
                                {latestPerformance.performanceGrade}
                              </Badge>
                            </div>
                            <div className="text-2xl font-bold">
                              {latestPerformance.actualValue} {kpi.unitOfMeasure}
                            </div>
                            <div className="text-sm text-gray-600">
                              {(latestPerformance.performanceRatio * 100).toFixed(1)}% of target
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">No performance data</p>
                          </div>
                        )}
                      </div>
                      <div>
                        {chartData.length > 0 && (
                          <div className="h-32">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" fontSize={10} />
                                <YAxis fontSize={10} />
                                <Tooltip />
                                <Line 
                                  type="monotone" 
                                  dataKey="actual" 
                                  stroke="#3b82f6" 
                                  strokeWidth={2}
                                  name="Actual"
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="target" 
                                  stroke="#ef4444" 
                                  strokeWidth={1}
                                  strokeDasharray="5 5"
                                  name="Target"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Autonomous Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Autonomous Optimization</h2>
            <Dialog open={isOptimizationDialogOpen} onOpenChange={setIsOptimizationDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingOptimization(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Configure Optimization
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingOptimization ? "Edit Optimization Configuration" : "Configure Autonomous Optimization"}
                  </DialogTitle>
                </DialogHeader>
                <OptimizationConfigForm
                  optimization={editingOptimization}
                  plants={plants as Plant[]}
                  kpiTargets={kpiTargets as PlantKpiTarget[]}
                  onSave={(data) => saveOptimizationMutation.mutate(data)}
                  isLoading={saveOptimizationMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {filteredOptimizationConfigs.map((config: AutonomousOptimization) => (
              <Card key={config.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Brain className="h-5 w-5 text-purple-600" />
                        <span>{config.name}</span>
                        <Badge className={config.isEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {config.isEnabled ? "Active" : "Inactive"}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {config.plant?.name} • {config.currentAlgorithm} Algorithm
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.isEnabled}
                        onCheckedChange={(isEnabled) => 
                          toggleOptimizationMutation.mutate({ id: config.id, isEnabled })
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingOptimization(config);
                          setIsOptimizationDialogOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Configuration</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Objective: {config.optimizationObjective}</div>
                        <div>Auto Algorithm: {config.autoAlgorithmSelection ? "Yes" : "No"}</div>
                        <div>Parameter Tuning: {config.enableParameterTuning ? "Yes" : "No"}</div>
                        <div>Learning Mode: {config.learningMode}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Performance</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Total Optimizations: {config.totalOptimizations}</div>
                        <div>Success Rate: {config.totalOptimizations > 0 ? 
                          `${((config.successfulOptimizations / config.totalOptimizations) * 100).toFixed(1)}%` : 
                          "N/A"
                        }</div>
                        <div>Last Score: {config.lastPerformanceScore ? 
                          `${(config.lastPerformanceScore * 100).toFixed(1)}%` : 
                          "N/A"
                        }</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Status</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Threshold: {(config.performanceThreshold * 100).toFixed(0)}%</div>
                        <div>Evaluation: Every {config.evaluationPeriodMinutes}min</div>
                        <div>Last Run: {config.lastOptimizationAt ? 
                          new Date(config.lastOptimizationAt).toLocaleDateString() : 
                          "Never"
                        }</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Performance Analytics Tab */}
        <TabsContent value="performance" className="space-y-6">
          <h2 className="text-2xl font-bold">Performance Analytics</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Overall Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Plant Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={plants.map((plant: Plant) => ({
                      name: plant.name,
                      performance: (getPlantPerformance(plant.id) || 0) * 100,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, "Performance"]} />
                      <Bar dataKey="performance" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Optimization Success Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Optimization Success Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={optimizationConfigs.map((config: AutonomousOptimization) => ({
                      name: config.plant?.name || "Unknown",
                      successRate: config.totalOptimizations > 0 ? 
                        (config.successfulOptimizations / config.totalOptimizations) * 100 : 0,
                      totalOptimizations: config.totalOptimizations,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, "Success Rate"]} />
                      <Bar dataKey="successRate" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Default export is handled by the ControlTower function above

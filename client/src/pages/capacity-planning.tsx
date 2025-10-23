import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, Users, Settings, Target, TrendingUp, AlertTriangle, Plus, BookOpen, Zap, Briefcase,
  Clock, Activity, BarChart3, Factory, Gauge, Timer, Wrench, UserCheck, ClipboardList, 
  ChevronUp, ChevronDown, Info, Building2, MapPin, LineChart, PieChart, Grid3X3
} from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isWeekend, differenceInDays } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCapacityPlanningScenarioSchema, insertStaffingPlanSchema, insertShiftPlanSchema, insertEquipmentPlanSchema, insertCapacityProjectionSchema } from "@shared/schema";
import type { CapacityPlanningScenario, StaffingPlan, ShiftPlan, EquipmentPlan, CapacityProjection, Resource, ShiftTemplate, ProductionOrder } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAITheme } from "@/hooks/use-ai-theme";
import { useMaxDock } from "@/contexts/MaxDockContext";
import CapacityGridView from "@/components/capacity-planning/capacity-grid-view";
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import type { PtPlant } from '@shared/schema';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Plant Capacity Timeline Component
const PlantCapacityTimeline = ({ plants, timeframe }: { plants: any[], timeframe: string }) => {
  const generateTimelineData = () => {
    const labels = [];
    const datasets = [];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    
    // Generate dates based on timeframe
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      if (timeframe === 'week') {
        labels.push(format(addDays(now, i * 7), 'MMM dd'));
      } else if (timeframe === 'month') {
        labels.push(format(addDays(now, i * 30), 'MMM yyyy'));
      } else {
        labels.push(format(addDays(now, i), 'MMM dd'));
      }
    }

    plants.forEach((plant, index) => {
      datasets.push({
        label: `${plant.name} Capacity`,
        data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 200) + 150),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        fill: false,
        tension: 0.4
      });
      
      datasets.push({
        label: `${plant.name} Demand`,
        data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 180) + 100),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '40',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4
      });
    });

    return { labels, datasets };
  };

  const chartData = generateTimelineData();
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Plant Capacity vs Demand Timeline'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours'
        }
      }
    }
  };

  return <Line data={chartData} options={options} />;
};

// Work Center Capacity Analysis Component
const WorkCenterCapacityAnalysis = ({ resources, timeframe }: { resources: any[], timeframe: string }) => {
  const workCenters = useMemo(() => {
    // Group resources by work center (using type as work center)
    const grouped = resources.reduce((acc, resource) => {
      const workCenter = resource.type || 'General';
      if (!acc[workCenter]) {
        acc[workCenter] = [];
      }
      acc[workCenter].push(resource);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(grouped).map(([name, resources]) => ({
      name,
      resources,
      totalCapacity: resources.reduce((sum, r) => sum + (r.capacity || 40), 0),
      currentUtilization: resources.reduce((sum, r) => sum + (r.utilization || Math.floor(Math.random() * 100)), 0) / resources.length,
      futureProjection: Array.from({ length: 12 }, () => Math.floor(Math.random() * 100) + 20)
    }));
  }, [resources]);

  const chartData = {
    labels: Array.from({ length: 12 }, (_, i) => {
      const date = addDays(new Date(), timeframe === 'week' ? i * 7 : timeframe === 'month' ? i * 30 : i);
      return format(date, timeframe === 'month' ? 'MMM yyyy' : 'MMM dd');
    }),
    datasets: workCenters.map((wc, index) => ({
      label: wc.name,
      data: wc.futureProjection,
      backgroundColor: `hsl(${index * 60}, 70%, 50%)`,
      borderColor: `hsl(${index * 60}, 70%, 40%)`,
      borderWidth: 2
    }))
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Work Center Utilization Forecast'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Utilization %'
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workCenters.map((wc, index) => (
          <Card key={wc.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{wc.name}</span>
                <Badge variant={wc.currentUtilization >= 85 ? 'destructive' : wc.currentUtilization >= 75 ? 'secondary' : 'default'}>
                  {wc.currentUtilization.toFixed(1)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Resources:</span>
                  <span>{wc.resources.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Capacity:</span>
                  <span>{wc.totalCapacity}h</span>
                </div>
                <Progress value={wc.currentUtilization} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Resource Detailed Analysis Component
const ResourceDetailedAnalysis = ({ resources, timeframe }: { resources: any[], timeframe: string }) => {
  const [selectedResourceType, setSelectedResourceType] = useState<string>('all');
  
  const resourceTypes = useMemo(() => {
    const types = Array.from(new Set(resources.map(r => r.type || 'General')));
    return ['all', ...types];
  }, [resources]);

  const filteredResources = useMemo(() => {
    return selectedResourceType === 'all' 
      ? resources 
      : resources.filter(r => (r.type || 'General') === selectedResourceType);
  }, [resources, selectedResourceType]);

  const generateResourceChart = () => {
    const labels = filteredResources.map(r => r.name || `Resource ${r.id}`);
    const capacityData = filteredResources.map(r => r.capacity || Math.floor(Math.random() * 60) + 20);
    const utilizationData = filteredResources.map(r => (r.utilization || Math.floor(Math.random() * 100)) / 100 * (r.capacity || 40));

    return {
      labels,
      datasets: [
        {
          label: 'Total Capacity',
          data: capacityData,
          backgroundColor: 'rgba(59, 130, 246, 0.3)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2
        },
        {
          label: 'Current Load',
          data: utilizationData,
          backgroundColor: 'rgba(16, 185, 129, 0.3)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2
        }
      ]
    };
  };

  const chartData = generateResourceChart();
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Resource Capacity vs Current Load'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours'
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Resource Analysis</h3>
        <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {resourceTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type === 'all' ? 'All Resource Types' : type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default function CapacityPlanning() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTimeframe, setSelectedTimeframe] = useState("week");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showCreateScenario, setShowCreateScenario] = useState(false);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const { toast } = useToast();
  const { aiTheme } = useAITheme();
  const { isMaxOpen } = useMaxDock();

  // Queries for real resource data
  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  // Fetch plants data for the Plant Capacity Timeline
  const { data: plants = [] } = useQuery<PtPlant[]>({
    queryKey: ["/api/plants"],
  });

  const { data: shiftTemplates = [] } = useQuery<ShiftTemplate[]>({
    queryKey: ["/api/shift-templates"],
  });

  const { data: productionOrders = [] } = useQuery<ProductionOrder[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: scenarios = [], isLoading: loadingScenarios } = useQuery<CapacityPlanningScenario[]>({
    queryKey: ["/api/capacity-planning-scenarios"],
  });

  const { data: staffingPlans = [] } = useQuery<StaffingPlan[]>({
    queryKey: ["/api/staffing-plans"],
  });

  const { data: shiftPlans = [] } = useQuery<ShiftPlan[]>({
    queryKey: ["/api/shift-plans"],
  });

  const { data: equipmentPlans = [] } = useQuery<EquipmentPlan[]>({
    queryKey: ["/api/equipment-plans"],
  });

  const { data: capacityProjections = [] } = useQuery<CapacityProjection[]>({
    queryKey: ["/api/capacity-projections"],
  });

  // Helper functions for capacity calculations
  const calculateResourceCapacity = (resource: Resource) => {
    // Calculate standard capacity based on resource type and shifts
    const standardHoursPerDay = 8; // Standard 8-hour day
    const standardDaysPerWeek = 5; // Standard work week
    const standardWeeksPerMonth = 4.33; // Average weeks per month
    
    // Get applicable shifts for this resource
    const applicableShifts = shiftTemplates.filter(shift => 
      shift.description?.toLowerCase().includes(resource.type?.toLowerCase() || '') ||
      shift.name?.toLowerCase().includes(resource.type?.toLowerCase() || '')
    );
    
    // Calculate shift-based capacity
    let totalShiftHours = 0;
    applicableShifts.forEach(shift => {
      const startTime = new Date(`2024-01-01 ${shift.startTime}`);
      const endTime = new Date(`2024-01-01 ${shift.endTime}`);
      const shiftDuration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      totalShiftHours += shiftDuration;
    });
    
    const dailyCapacity = Math.max(standardHoursPerDay, totalShiftHours);
    const weeklyCapacity = dailyCapacity * standardDaysPerWeek;
    const monthlyCapacity = weeklyCapacity * standardWeeksPerMonth;
    
    // Calculate current utilization based on production orders
    const assignedOrders = productionOrders.filter(order => 
      order.description?.includes(resource.name) || 
      order.name?.includes(resource.type || '')
    );
    
    const currentUtilization = Math.min(95, assignedOrders.length * 20); // Rough estimate
    
    return {
      standardHours: standardHoursPerDay,
      dailyCapacity,
      weeklyCapacity,
      monthlyCapacity,
      currentUtilization,
      availableCapacity: 100 - currentUtilization,
      overtimeHours: Math.max(0, totalShiftHours - standardHoursPerDay),
      shiftCount: applicableShifts.length,
      efficiency: Math.max(75, 100 - assignedOrders.length * 5) // Efficiency decreases with load
    };
  };

  const getCapacityStatus = (utilization: number) => {
    if (utilization >= 90) return { color: "text-red-600", bg: "bg-red-100", label: "Overloaded" };
    if (utilization >= 75) return { color: "text-orange-600", bg: "bg-orange-100", label: "High" };
    if (utilization >= 50) return { color: "text-yellow-600", bg: "bg-yellow-100", label: "Moderate" };
    return { color: "text-green-600", bg: "bg-green-100", label: "Available" };
  };

  const aggregateCapacityByType = () => {
    const typeGroups: { [key: string]: Resource[] } = {};
    resources.forEach(resource => {
      const type = resource.type || 'Other';
      if (!typeGroups[type]) typeGroups[type] = [];
      typeGroups[type].push(resource);
    });

    return Object.entries(typeGroups).map(([type, resourceList]) => {
      const capacities = resourceList.map(calculateResourceCapacity);
      const totalCapacity = capacities.reduce((sum, cap) => sum + cap.weeklyCapacity, 0);
      const avgUtilization = capacities.reduce((sum, cap) => sum + cap.currentUtilization, 0) / capacities.length;
      const totalShifts = capacities.reduce((sum, cap) => sum + cap.shiftCount, 0);
      const totalOvertimeHours = capacities.reduce((sum, cap) => sum + cap.overtimeHours, 0);
      
      return {
        type,
        resourceCount: resourceList.length,
        totalCapacity,
        avgUtilization,
        totalShifts,
        totalOvertimeHours,
        status: getCapacityStatus(avgUtilization)
      };
    });
  };

  // Mutations
  const createScenarioMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/capacity-planning-scenarios", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/capacity-planning-scenarios"] });
      setShowCreateScenario(false);
      toast({ title: "Success", description: "Capacity planning scenario created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create capacity planning scenario", variant: "destructive" });
    },
  });

  const createStaffingPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/staffing-plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staffing-plans"] });
      toast({ title: "Success", description: "Staffing plan created successfully" });
    },
  });

  const createShiftPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/shift-plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shift-plans"] });
      toast({ title: "Success", description: "Shift plan created successfully" });
    },
  });

  const createEquipmentPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/equipment-plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-plans"] });
      toast({ title: "Success", description: "Equipment plan created successfully" });
    },
  });

  // Form handlers
  const scenarioForm = useForm({
    resolver: zodResolver(insertCapacityPlanningScenarioSchema),
    defaultValues: {
      name: "",
      description: "",
      planningPeriod: "quarterly",
      status: "draft",
      createdBy: "current_user",
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    },
  });

  const onSubmitScenario = (data: any) => {
    createScenarioMutation.mutate(data);
  };

  // Capacity Visualization Component
  const CapacityVisualization = () => {
    const [selectedWeek, setSelectedWeek] = useState(0);
    const [expandedResource, setExpandedResource] = useState<number | null>(null);
    
    // Generate capacity data for visualization
    const capacityData = useMemo(() => {
      const startDate = new Date();
      const weeks = Array.from({ length: 12 }, (_, i) => {
        const weekStart = addDays(startDate, i * 7);
        const weekEnd = addDays(weekStart, 6);
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
        
        return {
          weekNumber: i + 1,
          weekStart,
          weekEnd,
          label: `Week ${i + 1} (${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')})`,
          days: days.map(day => ({
            date: day,
            isWeekend: isWeekend(day),
            isHoliday: false, // TODO: Add holiday logic
            workingHours: isWeekend(day) ? 0 : 16, // 2 shifts × 8 hours
          })),
          resources: resources.map(resource => {
            const baseCapacity = 16; // 2 shifts × 8 hours per day
            const demandVariation = Math.sin(i * 0.5) * 0.3 + 0.7; // Simulate demand variation
            const capacityUtilization = Math.min(demandVariation + (Math.random() * 0.2), 1);
            
            return {
              id: resource.id,
              name: resource.name,
              type: resource.type,
              capacity: baseCapacity * 5, // 5 working days
              demand: Math.floor(baseCapacity * 5 * capacityUtilization),
              utilization: Math.floor(capacityUtilization * 100),
              overtime: Math.max(0, Math.floor((capacityUtilization - 0.9) * baseCapacity * 5)),
              efficiency: 85 + Math.floor(Math.random() * 15), // 85-100%
              issues: capacityUtilization > 0.95 ? ['High utilization risk'] : 
                     capacityUtilization < 0.6 ? ['Underutilized capacity'] : [],
              shifts: [
                { name: 'Day Shift', hours: 8, staff: 2, efficiency: 90 },
                { name: 'Night Shift', hours: 8, staff: 1, efficiency: 85 }
              ]
            };
          })
        };
      });
      
      return weeks;
    }, [resources]);

    const currentWeek = capacityData[selectedWeek];
    
    const weeklyStats = useMemo(() => {
      if (!currentWeek) return { totalCapacity: 0, totalDemand: 0, avgUtilization: 0, overtimeHours: 0 };
      
      return currentWeek.resources.reduce((acc, resource) => ({
        totalCapacity: acc.totalCapacity + resource.capacity,
        totalDemand: acc.totalDemand + resource.demand,
        avgUtilization: acc.avgUtilization + resource.utilization,
        overtimeHours: acc.overtimeHours + resource.overtime
      }), { totalCapacity: 0, totalDemand: 0, avgUtilization: 0, overtimeHours: 0 });
    }, [currentWeek]);

    if (currentWeek) {
      weeklyStats.avgUtilization = Math.floor(weeklyStats.avgUtilization / currentWeek.resources.length);
    }

    return (
      <Card className="col-span-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Capacity vs Demand Analysis
              </CardTitle>
              <CardDescription>
                12-week capacity planning view with shift schedules, holidays, and production demands
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWeek(Math.max(0, selectedWeek - 1))}
                disabled={selectedWeek === 0}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {currentWeek?.label}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWeek(Math.min(capacityData.length - 1, selectedWeek + 1))}
                disabled={selectedWeek === capacityData.length - 1}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Weekly Overview Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Factory className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Total Capacity</span>
              </div>
              <div className="text-lg font-bold text-blue-900">{weeklyStats.totalCapacity}h</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Total Demand</span>
              </div>
              <div className="text-lg font-bold text-orange-900">{weeklyStats.totalDemand}h</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Gauge className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Avg Utilization</span>
              </div>
              <div className="text-lg font-bold text-green-900">{weeklyStats.avgUtilization}%</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">Overtime</span>
              </div>
              <div className="text-lg font-bold text-red-900">{weeklyStats.overtimeHours}h</div>
            </div>
          </div>

          {/* Resource Capacity Chart */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Resource Capacity Analysis</h4>
            {currentWeek?.resources.map((resource) => (
              <div key={resource.id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedResource(expandedResource === resource.id ? null : resource.id)}
                      className="p-1"
                    >
                      {expandedResource === resource.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                    <div>
                      <h5 className="font-medium text-gray-900">{resource.name}</h5>
                      <span className="text-sm text-gray-500">{resource.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Utilization</div>
                      <div className={`text-lg font-bold ${
                        resource.utilization >= 90 ? 'text-red-600' :
                        resource.utilization >= 75 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {resource.utilization}%
                      </div>
                    </div>
                    {resource.issues.length > 0 && (
                      <Badge variant={resource.utilization >= 90 ? 'destructive' : 'secondary'}>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {resource.issues.length} Issue{resource.issues.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Capacity vs Demand Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Capacity vs Demand</span>
                    <span>{resource.demand}h / {resource.capacity}h</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    {/* Capacity bar (background) */}
                    <div className="w-full h-full bg-blue-100"></div>
                    {/* Demand bar (foreground) */}
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        resource.utilization >= 95 ? 'bg-red-500' :
                        resource.utilization >= 85 ? 'bg-orange-500' :
                        resource.utilization >= 75 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(resource.utilization, 100)}%` }}
                    ></div>
                    {/* Overtime indicator */}
                    {resource.overtime > 0 && (
                      <div 
                        className="absolute top-0 h-full bg-red-700 opacity-80"
                        style={{ 
                          left: `${Math.min(resource.utilization, 100)}%`,
                          width: `${Math.min((resource.overtime / resource.capacity) * 100, 100 - resource.utilization)}%`
                        }}
                      ></div>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedResource === resource.id && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    {/* Shift Details */}
                    <div>
                      <h6 className="font-medium text-gray-900 mb-2">Shift Schedule</h6>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {resource.shifts.map((shift, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-sm">{shift.name}</div>
                                <div className="text-xs text-gray-600">{shift.hours}h × {shift.staff} staff</div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {shift.efficiency}% efficiency
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Issues and Recommendations */}
                    {resource.issues.length > 0 && (
                      <div>
                        <h6 className="font-medium text-gray-900 mb-2">Issues & Recommendations</h6>
                        <div className="space-y-2">
                          {resource.issues.map((issue, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-gray-900 dark:text-white">{issue}</div>
                                <div className="text-gray-600 text-xs mt-1">
                                  {issue.includes('High utilization') && 
                                    'Consider adding overtime shifts or redistributing workload to other resources.'
                                  }
                                  {issue.includes('Underutilized') && 
                                    'Resource has excess capacity. Consider scheduling additional production orders or maintenance.'
                                  }
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Week Timeline View */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">Daily Schedule Overview</h4>
            <div className="grid grid-cols-7 gap-2">
              {currentWeek?.days.map((day, index) => (
                <div key={index} className={`p-3 rounded-lg text-center ${
                  day.isWeekend ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' : 
                  day.isHoliday ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300' : 
                  'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200'
                }`}>
                  <div className="text-xs font-medium">
                    {format(day.date, 'EEE')}
                  </div>
                  <div className="text-lg font-bold">
                    {format(day.date, 'd')}
                  </div>
                  <div className="text-xs mt-1">
                    {day.workingHours}h
                  </div>
                  {day.isHoliday && (
                    <div className="text-xs mt-1 text-red-600">Holiday</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Capacity Improvement Recommendations */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">Capacity Optimization Opportunities</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* High Utilization Alert */}
              {currentWeek?.resources.filter(r => r.utilization >= 90).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-red-900">High Utilization Risk</h5>
                      <p className="text-sm text-red-700 mt-1">
                        {currentWeek.resources.filter(r => r.utilization >= 90).length} resources are operating at 90%+ capacity.
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium text-red-800">Recommended Actions:</p>
                        <ul className="text-xs text-red-700 space-y-1 pl-4">
                          <li>• Consider adding overtime shifts or weekend coverage</li>
                          <li>• Redistribute workload to underutilized resources</li>
                          <li>• Schedule preventive maintenance during low-demand periods</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Underutilization Opportunity */}
              {currentWeek?.resources.filter(r => r.utilization < 60).length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-yellow-900">Capacity Opportunity</h5>
                      <p className="text-sm text-yellow-700 mt-1">
                        {currentWeek.resources.filter(r => r.utilization < 60).length} resources have available capacity.
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium text-yellow-800">Optimization Ideas:</p>
                        <ul className="text-xs text-yellow-700 space-y-1 pl-4">
                          <li>• Schedule additional production orders</li>
                          <li>• Move workload from overutilized resources</li>
                          <li>• Plan training or maintenance activities</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Balanced Capacity */}
              {currentWeek?.resources.filter(r => r.utilization >= 60 && r.utilization < 90).length === currentWeek?.resources.length && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 md:col-span-2">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-green-900">Optimal Capacity Balance</h5>
                      <p className="text-sm text-green-700 mt-1">
                        All resources are operating within optimal utilization range (60-90%). 
                        Capacity is well-aligned with current demand.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Capacity Trend Analysis */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">12-Week Capacity Trend</h4>
            <div className="bg-white border rounded-lg p-4">
              <div className="grid grid-cols-12 gap-1 mb-4">
                {capacityData.map((week, index) => {
                  const avgUtil = Math.floor(week.resources.reduce((sum, r) => sum + r.utilization, 0) / week.resources.length);
                  return (
                    <div key={index} className="text-center">
                      <div className="text-xs text-gray-600 mb-1">W{week.weekNumber}</div>
                      <div 
                        className={`h-16 rounded cursor-pointer transition-all ${
                          index === selectedWeek ? 'ring-2 ring-blue-500' :
                          avgUtil >= 90 ? 'bg-red-500' :
                          avgUtil >= 75 ? 'bg-orange-500' :
                          avgUtil >= 60 ? 'bg-green-500' :
                          'bg-gray-400'
                        }`}
                        style={{ opacity: index === selectedWeek ? 1 : 0.7 }}
                        onClick={() => setSelectedWeek(index)}
                        title={`Week ${week.weekNumber}: ${avgUtil}% avg utilization`}
                      />
                      <div className="text-xs text-gray-600 mt-1">{avgUtil}%</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Critical (90%+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span>High (75-89%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Optimal (60-74%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded"></div>
                  <span>Low (&lt;60%)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // AI Recommendations Component
  const AIRecommendationsPanel = () => (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-600" />
          AI Capacity Recommendations
        </CardTitle>
        <CardDescription>
          AI-powered insights for optimal capacity planning decisions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold text-sm text-purple-700">Staffing Optimization</h4>
            <p className="text-xs text-gray-600 mt-1">
              Current staffing levels are 15% below optimal for Q2 demand forecasts. 
              Recommend adding 3 CNC operators and 2 quality inspectors.
            </p>
            <Button size="sm" variant="outline" className="mt-2">
              Apply Recommendation
            </Button>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold text-sm text-purple-700">Equipment Investment</h4>
            <p className="text-xs text-gray-600 mt-1">
              ROI analysis suggests investing in 2 additional CNC machines 
              will reduce bottlenecks by 40% and improve delivery times.
            </p>
            <Button size="sm" variant="outline" className="mt-2">
              View Analysis
            </Button>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold text-sm text-purple-700">Shift Strategy</h4>
            <p className="text-xs text-gray-600 mt-1">
              Adding a partial third shift (4 hours) on CNC operations 
              would optimize machine utilization without overtime costs.
            </p>
            <Button size="sm" variant="outline" className="mt-2">
              Configure Shift
            </Button>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold text-sm text-purple-700">Capacity Forecast</h4>
            <p className="text-xs text-gray-600 mt-1">
              Based on demand trends, current capacity will reach 
              95% utilization by Q3. Plan expansion now to avoid delays.
            </p>
            <Button size="sm" variant="outline" className="mt-2">
              View Forecast
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const capacityByType = aggregateCapacityByType();
  const totalResources = resources.length;
  const avgUtilization = capacityByType.reduce((sum, type) => sum + type.avgUtilization, 0) / (capacityByType.length || 1);
  const totalOvertimeHours = capacityByType.reduce((sum, type) => sum + type.totalOvertimeHours, 0);
  const alertCount = capacityByType.filter(type => type.avgUtilization >= 85).length;

  return (
    <div className="h-full overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
            Resource Capacity Analysis
          </h1>
          <p className="text-sm md:text-base text-gray-600">Monitor resource capacity, utilization, shifts, and overtime across all manufacturing operations</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => setShowAIRecommendations(!showAIRecommendations)}
            className={`${aiTheme.gradient} text-white text-sm`}
            size="sm"
          >
            <Zap className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">AI Insights</span>
            <span className="sm:hidden">AI</span>
          </Button>
        </div>
      </div>

      {/* AI Recommendations Panel */}
      {showAIRecommendations && <AIRecommendationsPanel />}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Factory className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Resources</p>
                <p className="text-xl font-semibold">{totalResources}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Gauge className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Utilization</p>
                <p className="text-xl font-semibold">{avgUtilization.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Overtime Hours</p>
                <p className="text-xl font-semibold">{totalOvertimeHours.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Capacity Alerts</p>
                <p className="text-xl font-semibold">{alertCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full overflow-x-auto scrollbar-hide sm:grid sm:grid-cols-4 lg:grid-cols-10">
          <TabsTrigger value="overview" className="text-xs sm:text-sm flex-shrink-0">
            <BarChart3 className="w-4 h-4 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="grid" className="text-xs sm:text-sm flex-shrink-0">
            <Grid3X3 className="w-4 h-4 mr-1" />
            Grid View
          </TabsTrigger>
          <TabsTrigger value="plants" className="text-xs sm:text-sm flex-shrink-0">
            <Building2 className="w-4 h-4 mr-1" />
            Plants
          </TabsTrigger>
          <TabsTrigger value="workcenters" className="text-xs sm:text-sm flex-shrink-0">
            <MapPin className="w-4 h-4 mr-1" />
            Work Centers
          </TabsTrigger>
          <TabsTrigger value="resources" className="text-xs sm:text-sm flex-shrink-0">
            <Wrench className="w-4 h-4 mr-1" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="shifts" className="text-xs sm:text-sm flex-shrink-0">
            <Clock className="w-4 h-4 mr-1" />
            Shifts
          </TabsTrigger>
          <TabsTrigger value="utilization" className="text-xs sm:text-sm flex-shrink-0">
            <Activity className="w-4 h-4 mr-1" />
            Utilization
          </TabsTrigger>
          <TabsTrigger value="overtime" className="text-xs sm:text-sm flex-shrink-0">
            <Timer className="w-4 h-4 mr-1" />
            Overtime
          </TabsTrigger>
          <TabsTrigger value="forecast" className="text-xs sm:text-sm flex-shrink-0">
            <LineChart className="w-4 h-4 mr-1" />
            Forecast
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="text-xs sm:text-sm flex-shrink-0">
            <ClipboardList className="w-4 h-4 mr-1" />
            Scenarios
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Add the capacity visualization as the main feature */}
          <CapacityVisualization />
          {/* Capacity by Resource Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Capacity Overview by Resource Type
              </CardTitle>
              <CardDescription>
                {selectedTimeframe.charAt(0).toUpperCase() + selectedTimeframe.slice(1)} capacity analysis across all resource types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {capacityByType.map((typeData) => (
                  <div key={typeData.type} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Factory className="w-6 h-6 text-blue-600" />
                        <div>
                          <h4 className="font-semibold">{typeData.type}</h4>
                          <p className="text-sm text-gray-600">{typeData.resourceCount} resources</p>
                        </div>
                      </div>
                      <Badge className={`${typeData.status.bg} ${typeData.status.color} border-0`}>
                        {typeData.status.label}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Weekly Capacity</p>
                        <p className="text-lg font-semibold">{typeData.totalCapacity.toFixed(1)}h</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Utilization</p>
                        <div className="flex items-center gap-2">
                          <Progress value={typeData.avgUtilization} className="flex-1" />
                          <span className="text-sm font-medium">{typeData.avgUtilization.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Active Shifts</p>
                        <p className="text-lg font-semibold">{typeData.totalShifts}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Overtime Hours</p>
                        <p className="text-lg font-semibold">{typeData.totalOvertimeHours.toFixed(1)}h</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grid View Tab - Excel-like capacity grid */}
        <TabsContent value="grid" className="space-y-6">
          <CapacityGridView 
            resources={resources}
            scenarios={scenarios}
            projections={capacityProjections}
          />
        </TabsContent>

        {/* Plants Tab - New detailed plant capacity timeline */}
        <TabsContent value="plants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Plant Capacity Timeline Analysis
              </CardTitle>
              <CardDescription>
                Future capacity forecasting and demand analysis by plant location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlantCapacityTimeline plants={plants} timeframe={selectedTimeframe} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Centers Tab - New detailed work center analysis */}
        <TabsContent value="workcenters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Work Center Capacity Analysis
              </CardTitle>
              <CardDescription>
                Detailed capacity utilization forecasting by work center with resource breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkCenterCapacityAnalysis resources={resources} timeframe={selectedTimeframe} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <ResourceDetailedAnalysis resources={resources} timeframe={selectedTimeframe} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Individual Resource Capacity Details
              </CardTitle>
              <CardDescription>
                Detailed capacity analysis for each resource including standard time, shifts, and utilization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resources.map((resource) => {
                  const capacity = calculateResourceCapacity(resource);
                  const status = getCapacityStatus(capacity.currentUtilization);
                  
                  return (
                    <div key={resource.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Wrench className="w-5 h-5 text-blue-600" />
                          <div>
                            <h4 className="font-semibold">{resource.name}</h4>
                            <p className="text-sm text-gray-600">{resource.type || 'General Resource'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${status.bg} ${status.color} border-0`}>
                            {status.label}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedResource(resource)}
                          >
                            Details
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Standard Hours</p>
                          <p className="text-lg font-semibold">{capacity.standardHours}h/day</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Daily Capacity</p>
                          <p className="text-lg font-semibold">{capacity.dailyCapacity.toFixed(1)}h</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Weekly Capacity</p>
                          <p className="text-lg font-semibold">{capacity.weeklyCapacity.toFixed(1)}h</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Utilization</p>
                          <div className="flex items-center gap-1">
                            <Progress value={capacity.currentUtilization} className="flex-1 h-2" />
                            <span className="text-sm font-medium">{capacity.currentUtilization.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Overtime</p>
                          <p className="text-lg font-semibold">{capacity.overtimeHours.toFixed(1)}h</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Efficiency</p>
                          <p className="text-lg font-semibold">{capacity.efficiency.toFixed(1)}%</p>
                        </div>
                      </div>

                      {capacity.shiftCount > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700 mb-2">Active Shifts: {capacity.shiftCount}</p>
                          <div className="flex flex-wrap gap-2">
                            {shiftTemplates
                              .filter(shift => 
                                shift.description?.toLowerCase().includes(resource.type?.toLowerCase() || '') ||
                                shift.name?.toLowerCase().includes(resource.type?.toLowerCase() || '')
                              )
                              .map(shift => (
                                <Badge key={shift.id} variant="outline">
                                  {shift.name} ({shift.startTime} - {shift.endTime})
                                </Badge>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shifts Tab */}
        <TabsContent value="shifts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Shift Configuration & Capacity
              </CardTitle>
              <CardDescription>
                Current shift templates and their impact on overall capacity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shiftTemplates.map((shift) => {
                  const startTime = new Date(`2024-01-01 ${shift.startTime}`);
                  const endTime = new Date(`2024-01-01 ${shift.endTime}`);
                  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                  const isOvertimeShift = duration > 8;
                  
                  return (
                    <div key={shift.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-blue-600" />
                          <div>
                            <h4 className="font-semibold">{shift.name}</h4>
                            <p className="text-sm text-gray-600">{shift.description || 'Standard production shift'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOvertimeShift && (
                            <Badge className="bg-orange-100 text-orange-800">Overtime</Badge>
                          )}
                          <Badge variant="outline">
                            {duration.toFixed(1)}h
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Start Time</p>
                          <p className="text-lg font-semibold">{shift.startTime}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">End Time</p>
                          <p className="text-lg font-semibold">{shift.endTime}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Duration</p>
                          <p className="text-lg font-semibold">{duration.toFixed(1)} hours</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Type</p>
                          <p className="text-lg font-semibold">{isOvertimeShift ? 'Extended' : 'Standard'}</p>
                        </div>
                      </div>

                      {shift.description && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                          <p className="text-sm text-gray-600">{shift.description}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilization Tab */}
        <TabsContent value="utilization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Resource Utilization Analysis
              </CardTitle>
              <CardDescription>
                Current utilization rates and capacity availability across all resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Utilization Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{resources.filter(r => calculateResourceCapacity(r).currentUtilization < 50).length}</div>
                    <div className="text-sm text-green-700">Available Resources</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{resources.filter(r => {
                      const util = calculateResourceCapacity(r).currentUtilization;
                      return util >= 50 && util < 85;
                    }).length}</div>
                    <div className="text-sm text-yellow-700">Moderate Load</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{resources.filter(r => calculateResourceCapacity(r).currentUtilization >= 85).length}</div>
                    <div className="text-sm text-red-700">High Utilization</div>
                  </div>
                </div>

                {/* Detailed Utilization List */}
                <div className="space-y-3">
                  {resources
                    .sort((a, b) => calculateResourceCapacity(b).currentUtilization - calculateResourceCapacity(a).currentUtilization)
                    .map((resource) => {
                      const capacity = calculateResourceCapacity(resource);
                      const status = getCapacityStatus(capacity.currentUtilization);
                      
                      return (
                        <div key={resource.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${status.bg}`}></div>
                            <div>
                              <p className="font-medium">{resource.name}</p>
                              <p className="text-sm text-gray-600">{resource.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Available</p>
                              <p className="font-semibold">{capacity.availableCapacity.toFixed(1)}%</p>
                            </div>
                            <div className="w-32">
                              <Progress value={capacity.currentUtilization} className="h-2" />
                            </div>
                            <div className="text-right min-w-[80px]">
                              <p className="font-semibold">{capacity.currentUtilization.toFixed(1)}%</p>
                              <p className="text-xs text-gray-600">{status.label}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overtime Tab */}
        <TabsContent value="overtime" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5" />
                Overtime Analysis & Management
              </CardTitle>
              <CardDescription>
                Track overtime usage, costs, and optimize shift scheduling to minimize overtime needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Overtime Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{totalOvertimeHours.toFixed(1)}</div>
                    <div className="text-sm text-orange-700">Total Overtime Hours</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{shiftTemplates.filter(s => {
                      const start = new Date(`2024-01-01 ${s.startTime}`);
                      const end = new Date(`2024-01-01 ${s.endTime}`);
                      return (end.getTime() - start.getTime()) / (1000 * 60 * 60) > 8;
                    }).length}</div>
                    <div className="text-sm text-blue-700">Extended Shifts</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      ${(totalOvertimeHours * 35).toFixed(0)}
                    </div>
                    <div className="text-sm text-purple-700">Est. Overtime Cost</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {resources.filter(r => calculateResourceCapacity(r).overtimeHours === 0).length}
                    </div>
                    <div className="text-sm text-green-700">No Overtime</div>
                  </div>
                </div>

                {/* Overtime by Resource */}
                <div className="space-y-3">
                  <h4 className="font-medium">Overtime by Resource</h4>
                  {resources
                    .filter(r => calculateResourceCapacity(r).overtimeHours > 0)
                    .sort((a, b) => calculateResourceCapacity(b).overtimeHours - calculateResourceCapacity(a).overtimeHours)
                    .map((resource) => {
                      const capacity = calculateResourceCapacity(resource);
                      const overtimeCost = capacity.overtimeHours * 35; // $35/hour overtime rate
                      
                      return (
                        <div key={resource.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <Timer className="w-4 h-4 text-orange-600" />
                            <div>
                              <p className="font-medium">{resource.name}</p>
                              <p className="text-sm text-gray-600">{resource.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Overtime Hours</p>
                              <p className="font-semibold">{capacity.overtimeHours.toFixed(1)}h</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Est. Cost</p>
                              <p className="font-semibold">${overtimeCost.toFixed(0)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">% of Capacity</p>
                              <p className="font-semibold">{((capacity.overtimeHours / capacity.dailyCapacity) * 100).toFixed(1)}%</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  
                  {resources.filter(r => calculateResourceCapacity(r).overtimeHours > 0).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Timer className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No overtime hours detected</p>
                      <p className="text-sm">All resources operating within standard hours</p>
                    </div>
                  )}
                </div>

                {/* Overtime Optimization Recommendations */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Optimization Opportunities</h4>
                  <div className="space-y-2">
                    {totalOvertimeHours > 20 && (
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <p className="text-sm text-blue-800">
                          Consider adding a partial third shift to reduce overtime costs by an estimated ${(totalOvertimeHours * 10).toFixed(0)}
                        </p>
                      </div>
                    )}
                    {avgUtilization > 85 && (
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <p className="text-sm text-blue-800">
                          High utilization detected. Consider capacity expansion to improve efficiency and reduce overtime
                        </p>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <p className="text-sm text-blue-800">
                        Review shift schedules to better distribute workload and minimize peak hour overtime
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forecast Tab - New comprehensive capacity forecasting */}
        <TabsContent value="forecast" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Capacity vs Demand Forecast */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Capacity vs Demand Forecast
                </CardTitle>
                <CardDescription>
                  12-{selectedTimeframe} forecast showing capacity availability vs projected demand
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlantCapacityTimeline plants={[]} timeframe={selectedTimeframe} />
              </CardContent>
            </Card>

            {/* Resource Utilization Projection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Resource Utilization Projection
                </CardTitle>
                <CardDescription>
                  Future utilization trends by resource type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Doughnut 
                    data={{
                      labels: Array.from(new Set(resources.map(r => r.type || 'General'))),
                      datasets: [{
                        label: 'Future Avg Utilization %',
                        data: Array.from(new Set(resources.map(r => r.type || 'General'))).map(() => 
                          Math.floor(Math.random() * 40) + 60
                        ),
                        backgroundColor: [
                          'rgba(59, 130, 246, 0.8)',
                          'rgba(16, 185, 129, 0.8)',
                          'rgba(245, 158, 11, 0.8)',
                          'rgba(239, 68, 68, 0.8)',
                          'rgba(139, 92, 246, 0.8)',
                          'rgba(6, 182, 212, 0.8)'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        },
                        title: {
                          display: true,
                          text: `${selectedTimeframe.charAt(0).toUpperCase() + selectedTimeframe.slice(1)} Utilization Forecast`
                        }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Capacity Bottleneck Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Capacity Bottleneck Forecast
              </CardTitle>
              <CardDescription>
                Predicted capacity constraints and resource bottlenecks in upcoming periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* High-Risk Periods */}
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-red-800">High Risk Periods</h4>
                  </div>
                  <div className="space-y-2">
                    {['Week 3-4', 'Week 8-9', 'Week 11-12'].map((period, index) => (
                      <div key={period} className="flex justify-between items-center">
                        <span className="text-sm text-red-700">{period}</span>
                        <Badge className="bg-red-200 text-red-800">
                          {90 + Math.floor(Math.random() * 10)}% util
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resource Constraints */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-5 h-5 text-orange-600" />
                    <h4 className="font-semibold text-orange-800">Resource Constraints</h4>
                  </div>
                  <div className="space-y-2">
                    {resources.slice(0, 3).map((resource, index) => (
                      <div key={resource.id} className="flex justify-between items-center">
                        <span className="text-sm text-orange-700">{resource.name}</span>
                        <Badge className="bg-orange-200 text-orange-800">
                          Risk {index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">Recommendations</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-blue-700">
                      • Add temp resources in Week 3
                    </div>
                    <div className="text-sm text-blue-700">
                      • Schedule maintenance early
                    </div>
                    <div className="text-sm text-blue-700">
                      • Consider overtime approval
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Scenarios List */}
            <Card className="xl:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardList className="w-5 h-5" />
                  Planning Scenarios
                </CardTitle>
                <CardDescription className="text-sm">
                  Create and manage capacity planning scenarios
                </CardDescription>
                <Button 
                  onClick={() => setShowCreateScenario(true)}
                  className="mt-2"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Scenario
                </Button>
              </CardHeader>
              <CardContent>
                {loadingScenarios ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : scenarios.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No scenarios created yet</p>
                    <p className="text-sm">Create your first capacity planning scenario</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {scenarios.map((scenario: CapacityPlanningScenario) => (
                      <div
                        key={scenario.id}
                        className="p-3 border rounded-lg cursor-pointer transition-colors hover:border-blue-300"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{scenario.name}</h4>
                          <Badge variant={scenario.status === "active" ? "default" : "secondary"}>
                            {scenario.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{scenario.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500 capitalize">{scenario.planningPeriod}</span>
                          <span className="text-xs font-medium text-blue-600">
                            {new Date(scenario.startDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scenario Details */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Scenario Details</CardTitle>
                <CardDescription>
                  View and analyze capacity planning scenario results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Select a Scenario</p>
                  <p className="text-sm">Choose a planning scenario from the left to view detailed analysis and recommendations</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Scenario Dialog */}
      <Dialog open={showCreateScenario} onOpenChange={setShowCreateScenario}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Capacity Planning Scenario</DialogTitle>
            <DialogDescription>
              Create a new scenario to analyze different capacity planning options
            </DialogDescription>
          </DialogHeader>
          <Form {...scenarioForm}>
            <form onSubmit={scenarioForm.handleSubmit(onSubmitScenario)} className="space-y-4">
              <FormField
                control={scenarioForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scenario Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Q3 Expansion Plan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={scenarioForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the scenario..." rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={scenarioForm.control}
                name="planningPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planning Period</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateScenario(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createScenarioMutation.isPending}>
                  {createScenarioMutation.isPending ? "Creating..." : "Create Scenario"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

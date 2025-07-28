import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, Users, Settings, Target, TrendingUp, AlertTriangle, Plus, BookOpen, Zap, Briefcase,
  Clock, Activity, BarChart3, Factory, Gauge, Timer, Wrench, UserCheck, ClipboardList
} from "lucide-react";
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

  const { data: shiftTemplates = [] } = useQuery<ShiftTemplate[]>({
    queryKey: ["/api/shift-templates"],
  });

  const { data: productionOrders = [] } = useQuery<ProductionOrder[]>({
    queryKey: ["/api/production-orders"],
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
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className={`${isMaxOpen ? 'md:ml-0' : 'md:ml-12'} ml-12`}>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
            <Factory className="w-6 h-6 mr-2" />
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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            <BarChart3 className="w-4 h-4 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="resources" className="text-xs sm:text-sm">
            <Wrench className="w-4 h-4 mr-1" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="shifts" className="text-xs sm:text-sm">
            <Clock className="w-4 h-4 mr-1" />
            Shifts
          </TabsTrigger>
          <TabsTrigger value="utilization" className="text-xs sm:text-sm">
            <Activity className="w-4 h-4 mr-1" />
            Utilization
          </TabsTrigger>
          <TabsTrigger value="overtime" className="text-xs sm:text-sm">
            <Timer className="w-4 h-4 mr-1" />
            Overtime
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="text-xs sm:text-sm">
            <ClipboardList className="w-4 h-4 mr-1" />
            Scenarios
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
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

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
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

                      {shift.breaks && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700 mb-1">Break Schedule</p>
                          <p className="text-sm text-gray-600">{shift.breaks}</p>
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

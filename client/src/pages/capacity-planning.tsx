import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, Settings, Target, TrendingUp, AlertTriangle, Plus, BookOpen, Zap, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCapacityPlanningScenarioSchema, insertStaffingPlanSchema, insertShiftPlanSchema, insertEquipmentPlanSchema, insertCapacityProjectionSchema } from "@shared/schema";
import type { CapacityPlanningScenario, StaffingPlan, ShiftPlan, EquipmentPlan, CapacityProjection } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAITheme } from "@/hooks/use-ai-theme";

export default function CapacityPlanning() {
  const [activeTab, setActiveTab] = useState("scenarios");
  const [selectedScenario, setSelectedScenario] = useState<CapacityPlanningScenario | null>(null);
  const [showCreateScenario, setShowCreateScenario] = useState(false);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const { toast } = useToast();
  const { aiTheme } = useAITheme();

  // Queries
  const { data: scenarios = [], isLoading: loadingScenarios } = useQuery<CapacityPlanningScenario[]>({
    queryKey: ["/api/capacity-planning-scenarios"],
  });

  const { data: staffingPlans = [] } = useQuery<StaffingPlan[]>({
    queryKey: ["/api/staffing-plans"],
    enabled: !!selectedScenario,
  });

  const { data: shiftPlans = [] } = useQuery<ShiftPlan[]>({
    queryKey: ["/api/shift-plans"],
    enabled: !!selectedScenario,
  });

  const { data: equipmentPlans = [] } = useQuery<EquipmentPlan[]>({
    queryKey: ["/api/equipment-plans"],
    enabled: !!selectedScenario,
  });

  const { data: capacityProjections = [] } = useQuery<CapacityProjection[]>({
    queryKey: ["/api/capacity-projections"],
    enabled: !!selectedScenario,
  });

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

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="md:ml-0 ml-12">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
            <Briefcase className="w-6 h-6 mr-2" />
            Capacity Planning
          </h1>
          <p className="text-sm md:text-base text-gray-600">Plan staffing, shifts, and equipment investments for optimal production capacity</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={() => setShowAIRecommendations(!showAIRecommendations)}
            className={`${aiTheme.gradient} text-white text-sm`}
            size="sm"
          >
            <Zap className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">AI Insights</span>
            <span className="sm:hidden">Insights</span>
          </Button>
          <Button 
            onClick={() => setShowCreateScenario(true)}
            className="text-sm"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">New Scenario</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* AI Recommendations Panel */}
      {showAIRecommendations && <AIRecommendationsPanel />}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Active Scenarios</p>
                <p className="text-xl font-semibold">{scenarios.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Current Utilization</p>
                <p className="text-xl font-semibold">82%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Projected Growth</p>
                <p className="text-xl font-semibold">15%</p>
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
                <p className="text-xl font-semibold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Scenarios List */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5" />
              Planning Scenarios
            </CardTitle>
            <CardDescription className="text-sm">
              Select a scenario to view detailed capacity plans
            </CardDescription>
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
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No scenarios created yet</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setShowCreateScenario(true)}
                >
                  Create First Scenario
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {scenarios.map((scenario: CapacityPlanningScenario) => (
                  <div
                    key={scenario.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedScenario?.id === scenario.id 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedScenario(scenario)}
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
                        Status: {scenario.status}
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
            <CardTitle className="text-lg">
              {selectedScenario ? selectedScenario.name : "Select a Scenario"}
            </CardTitle>
            <CardDescription className="text-sm">
              {selectedScenario 
                ? "Detailed capacity planning for the selected scenario"
                : "Choose a scenario from the list to view detailed capacity plans"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedScenario ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="overflow-x-auto">
                  <TabsList className="grid w-full grid-cols-5 min-w-max">
                    <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                    <TabsTrigger value="staffing" className="text-xs sm:text-sm">Staffing</TabsTrigger>
                    <TabsTrigger value="shifts" className="text-xs sm:text-sm">Shifts</TabsTrigger>
                    <TabsTrigger value="equipment" className="text-xs sm:text-sm">Equipment</TabsTrigger>
                    <TabsTrigger value="projections" className="text-xs sm:text-sm">Projections</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Scenario Details</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Planning Period:</span>
                          <span className="capitalize">{selectedScenario.planningPeriod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Start Date:</span>
                          <span>{new Date(selectedScenario.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">End Date:</span>
                          <span>{new Date(selectedScenario.endDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge variant={selectedScenario.status === "active" ? "default" : "secondary"}>
                            {selectedScenario.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created By:</span>
                          <span>{selectedScenario.createdBy}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Current Progress</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Staffing Plans</span>
                            <span>{staffingPlans.length}/5</span>
                          </div>
                          <Progress value={(staffingPlans.length / 5) * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Shift Plans</span>
                            <span>{shiftPlans.length}/3</span>
                          </div>
                          <Progress value={(shiftPlans.length / 3) * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Equipment Plans</span>
                            <span>{equipmentPlans.length}/4</span>
                          </div>
                          <Progress value={(equipmentPlans.length / 4) * 100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="staffing" className="space-y-4 mt-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <h4 className="font-semibold text-base">Staffing Plans</h4>
                    <Button size="sm" className="text-xs">
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Add Plan</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </div>
                  {staffingPlans.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No staffing plans created yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {staffingPlans.map((plan: StaffingPlan) => (
                        <div key={plan.id} className="p-3 sm:p-4 border rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm sm:text-base">{plan.department}</h5>
                              <p className="text-xs sm:text-sm text-gray-600">{plan.jobRole}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Current: {plan.currentStaffCount} → Target: {plan.targetStaffCount}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs self-start">{plan.priority}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="shifts" className="space-y-4 mt-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <h4 className="font-semibold text-base">Shift Plans</h4>
                    <Button size="sm" className="text-xs">
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Add Plan</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </div>
                  {shiftPlans.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No shift plans created yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {shiftPlans.map((plan: ShiftPlan) => (
                        <div key={plan.id} className="p-3 sm:p-4 border rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm sm:text-base">{plan.shiftName}</h5>
                              <p className="text-xs sm:text-sm text-gray-600">Days: {plan.daysOfWeek?.join(", ")}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {plan.startTime} - {plan.endTime}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs self-start">{plan.staffCount} staff</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="equipment" className="space-y-4 mt-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <h4 className="font-semibold text-base">Equipment Plans</h4>
                    <Button size="sm" className="text-xs">
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Add Plan</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </div>
                  {equipmentPlans.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No equipment plans created yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {equipmentPlans.map((plan: EquipmentPlan) => (
                        <div key={plan.id} className="p-3 sm:p-4 border rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm sm:text-base">{plan.equipmentType}</h5>
                              <p className="text-xs sm:text-sm text-gray-600">{plan.action}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Cost: ${plan.estimatedCost?.toLocaleString()}, Qty: {plan.quantity}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs self-start">{plan.priority}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="projections" className="space-y-4 mt-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <h4 className="font-semibold text-base">Capacity Projections</h4>
                    <Button size="sm" className="text-xs">
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Add Projection</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </div>
                  {capacityProjections.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No capacity projections created yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {capacityProjections.map((projection: CapacityProjection) => (
                        <div key={projection.id} className="p-3 sm:p-4 border rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm sm:text-base">{projection.resourceType}</h5>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Current: {projection.currentCapacity} → Projected: {projection.projectedCapacity}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Valid from: {new Date(projection.validFromDate).toLocaleDateString()} to {new Date(projection.validToDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right self-start">
                              <p className="text-xs sm:text-sm font-medium">
                                Growth: {projection.projectedGrowthRate}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Scenario Selected</h3>
                <p>Choose a scenario from the left panel to view capacity planning details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Scenario Dialog */}
      <Dialog open={showCreateScenario} onOpenChange={setShowCreateScenario}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Capacity Planning Scenario</DialogTitle>
            <DialogDescription>
              Define a new scenario for capacity planning analysis
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
                      <Input placeholder="Q2 2024 Expansion Plan" {...field} />
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
                      <Textarea placeholder="Describe the capacity planning scenario..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={scenarioForm.control}
                  name="planningPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planning Period</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                          <SelectItem value="multi-year">Multi-year</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={scenarioForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={scenarioForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                          onChange={(e) => field.onChange(new Date(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={scenarioForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                          onChange={(e) => field.onChange(new Date(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={scenarioForm.control}
                name="createdBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Created By</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
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
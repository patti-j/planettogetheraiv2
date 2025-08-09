import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Bot, 
  Settings, 
  Activity, 
  TrendingUp, 
  Zap, 
  Building, 
  Factory, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Brain,
  Gauge,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  Shield,
  BarChart3,
  Calendar,
  Users,
  Wrench
} from "lucide-react";

interface OptimizationProfile {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  parameters: {
    demandResponseSensitivity: number;
    disruptionTolerance: number;
    qualityThreshold: number;
    efficiencyTarget: number;
    costOptimization: number;
  };
  scope: {
    plants: string[];
    departments: string[];
    resources: string[];
  };
  schedule: {
    enabled: boolean;
    frequency: 'continuous' | '15min' | '30min' | '1hour' | '4hour' | '8hour' | '24hour';
    maintenanceWindow: string;
  };
  constraints: {
    maxResourceUtilization: number;
    minQualityLevel: number;
    maxCostIncrease: number;
    safetyBuffers: boolean;
  };
}

interface OptimizationMetrics {
  totalOptimizations: number;
  successRate: number;
  averageImprovement: number;
  activePlants: number;
  disruptionsHandled: number;
  costSavings: number;
}

export default function AutonomousOptimizationPage() {
  const [selectedProfile, setSelectedProfile] = useState<string>("default");
  const [globalOptimizationEnabled, setGlobalOptimizationEnabled] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<OptimizationMetrics>({
    totalOptimizations: 1847,
    successRate: 94.2,
    averageImprovement: 12.8,
    activePlants: 6,
    disruptionsHandled: 23,
    costSavings: 485000
  });

  // Fetch plants data
  const { data: plants = [] } = useQuery({
    queryKey: ["/api/plants"],
  });

  // Mock optimization profiles - in real app, these would come from API
  const [optimizationProfiles, setOptimizationProfiles] = useState<OptimizationProfile[]>([
    {
      id: "default",
      name: "Standard Production Optimization",
      description: "Balanced optimization focusing on efficiency and quality",
      isActive: true,
      priority: "high",
      parameters: {
        demandResponseSensitivity: 75,
        disruptionTolerance: 60,
        qualityThreshold: 95,
        efficiencyTarget: 85,
        costOptimization: 70
      },
      scope: {
        plants: ["all"],
        departments: ["production", "quality", "logistics"],
        resources: ["machinery", "workforce", "materials"]
      },
      schedule: {
        enabled: true,
        frequency: "30min",
        maintenanceWindow: "02:00-04:00"
      },
      constraints: {
        maxResourceUtilization: 90,
        minQualityLevel: 95,
        maxCostIncrease: 5,
        safetyBuffers: true
      }
    },
    {
      id: "aggressive",
      name: "Aggressive Throughput Maximization",
      description: "Maximum production output with acceptable quality trade-offs",
      isActive: false,
      priority: "critical",
      parameters: {
        demandResponseSensitivity: 95,
        disruptionTolerance: 40,
        qualityThreshold: 90,
        efficiencyTarget: 95,
        costOptimization: 50
      },
      scope: {
        plants: ["chicago", "shanghai", "munich"],
        departments: ["production"],
        resources: ["machinery", "workforce"]
      },
      schedule: {
        enabled: true,
        frequency: "15min",
        maintenanceWindow: "01:00-03:00"
      },
      constraints: {
        maxResourceUtilization: 98,
        minQualityLevel: 90,
        maxCostIncrease: 10,
        safetyBuffers: false
      }
    },
    {
      id: "quality_first",
      name: "Quality-First Optimization",
      description: "Prioritizes quality metrics over speed and cost efficiency",
      isActive: false,
      priority: "medium",
      parameters: {
        demandResponseSensitivity: 50,
        disruptionTolerance: 80,
        qualityThreshold: 99,
        efficiencyTarget: 75,
        costOptimization: 40
      },
      scope: {
        plants: ["munich", "tokyo"],
        departments: ["production", "quality", "inspection"],
        resources: ["quality_equipment", "testing_labs"]
      },
      schedule: {
        enabled: true,
        frequency: "1hour",
        maintenanceWindow: "03:00-05:00"
      },
      constraints: {
        maxResourceUtilization: 80,
        minQualityLevel: 98,
        maxCostIncrease: 15,
        safetyBuffers: true
      }
    }
  ]);

  const currentProfile = optimizationProfiles.find(p => p.id === selectedProfile) || optimizationProfiles[0];

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<OptimizationProfile>) => {
      // In real app, this would call the API
      console.log("Updating optimization profile:", updates);
      return updates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/optimization-profiles"] });
    },
  });

  const handleParameterChange = (parameter: keyof OptimizationProfile['parameters'], value: number[]) => {
    const updatedProfiles = optimizationProfiles.map(profile => 
      profile.id === selectedProfile 
        ? {
            ...profile,
            parameters: {
              ...profile.parameters,
              [parameter]: value[0]
            }
          }
        : profile
    );
    setOptimizationProfiles(updatedProfiles);
  };

  const handleScheduleChange = (field: keyof OptimizationProfile['schedule'], value: any) => {
    const updatedProfiles = optimizationProfiles.map(profile => 
      profile.id === selectedProfile 
        ? {
            ...profile,
            schedule: {
              ...profile.schedule,
              [field]: value
            }
          }
        : profile
    );
    setOptimizationProfiles(updatedProfiles);
  };

  const handleConstraintChange = (field: keyof OptimizationProfile['constraints'], value: any) => {
    const updatedProfiles = optimizationProfiles.map(profile => 
      profile.id === selectedProfile 
        ? {
            ...profile,
            constraints: {
              ...profile.constraints,
              [field]: value
            }
          }
        : profile
    );
    setOptimizationProfiles(updatedProfiles);
  };

  const toggleProfileActive = (profileId: string) => {
    const updatedProfiles = optimizationProfiles.map(profile => ({
      ...profile,
      isActive: profile.id === profileId ? !profile.isActive : false
    }));
    setOptimizationProfiles(updatedProfiles);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600' : 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Bot className="w-8 h-8 text-blue-600" />
              Autonomous Optimization Control Center
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Intelligent automation for production planning, scheduling, and resource optimization
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="global-optimization">Master Control</Label>
              <Switch
                id="global-optimization"
                checked={globalOptimizationEnabled}
                onCheckedChange={setGlobalOptimizationEnabled}
              />
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Optimizations</p>
                  <p className="text-2xl font-bold text-green-600">{currentMetrics.totalOptimizations}</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{currentMetrics.successRate}%</p>
                </div>
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Improvement</p>
                  <p className="text-2xl font-bold text-purple-600">{currentMetrics.averageImprovement}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cost Savings</p>
                  <p className="text-2xl font-bold text-green-600">${currentMetrics.costSavings.toLocaleString()}</p>
                </div>
                <Gauge className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Control Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Optimization Profiles */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Optimization Profiles
                </CardTitle>
                <CardDescription>
                  Configure and manage automation strategies for different scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Profile Selection */}
                  <div className="flex items-center gap-4">
                    <Label className="w-24">Active Profile:</Label>
                    <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {optimizationProfiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${profile.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                              {profile.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant={currentProfile.isActive ? "destructive" : "default"}
                      onClick={() => toggleProfileActive(currentProfile.id)}
                    >
                      {currentProfile.isActive ? (
                        <>
                          <PauseCircle className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Profile Details */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{currentProfile.name}</h3>
                      <Badge className={getPriorityColor(currentProfile.priority)}>
                        {currentProfile.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {currentProfile.description}
                    </p>

                    <Tabs defaultValue="parameters" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="parameters">Parameters</TabsTrigger>
                        <TabsTrigger value="scope">Scope</TabsTrigger>
                        <TabsTrigger value="schedule">Schedule</TabsTrigger>
                        <TabsTrigger value="constraints">Constraints</TabsTrigger>
                      </TabsList>

                      <TabsContent value="parameters" className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                              Demand Response Sensitivity
                              <span className="text-sm text-gray-500">{currentProfile.parameters.demandResponseSensitivity}%</span>
                            </Label>
                            <Slider
                              value={[currentProfile.parameters.demandResponseSensitivity]}
                              onValueChange={(value) => handleParameterChange('demandResponseSensitivity', value)}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                              Disruption Tolerance
                              <span className="text-sm text-gray-500">{currentProfile.parameters.disruptionTolerance}%</span>
                            </Label>
                            <Slider
                              value={[currentProfile.parameters.disruptionTolerance]}
                              onValueChange={(value) => handleParameterChange('disruptionTolerance', value)}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                              Quality Threshold
                              <span className="text-sm text-gray-500">{currentProfile.parameters.qualityThreshold}%</span>
                            </Label>
                            <Slider
                              value={[currentProfile.parameters.qualityThreshold]}
                              onValueChange={(value) => handleParameterChange('qualityThreshold', value)}
                              max={100}
                              step={1}
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                              Efficiency Target
                              <span className="text-sm text-gray-500">{currentProfile.parameters.efficiencyTarget}%</span>
                            </Label>
                            <Slider
                              value={[currentProfile.parameters.efficiencyTarget]}
                              onValueChange={(value) => handleParameterChange('efficiencyTarget', value)}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                              Cost Optimization Priority
                              <span className="text-sm text-gray-500">{currentProfile.parameters.costOptimization}%</span>
                            </Label>
                            <Slider
                              value={[currentProfile.parameters.costOptimization]}
                              onValueChange={(value) => handleParameterChange('costOptimization', value)}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="scope" className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label>Plants</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {currentProfile.scope.plants.map((plant, index) => (
                                <Badge key={index} variant="secondary">
                                  <Building className="w-3 h-3 mr-1" />
                                  {plant === 'all' ? 'All Plants' : plant}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label>Departments</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {currentProfile.scope.departments.map((dept, index) => (
                                <Badge key={index} variant="secondary">
                                  <Factory className="w-3 h-3 mr-1" />
                                  {dept}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label>Resources</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {currentProfile.scope.resources.map((resource, index) => (
                                <Badge key={index} variant="secondary">
                                  <Wrench className="w-3 h-3 mr-1" />
                                  {resource}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="schedule" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={currentProfile.schedule.enabled}
                              onCheckedChange={(checked) => handleScheduleChange('enabled', checked)}
                            />
                            <Label>Enable Scheduled Optimization</Label>
                          </div>

                          <div className="space-y-2">
                            <Label>Optimization Frequency</Label>
                            <Select 
                              value={currentProfile.schedule.frequency} 
                              onValueChange={(value) => handleScheduleChange('frequency', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="continuous">Continuous</SelectItem>
                                <SelectItem value="15min">Every 15 minutes</SelectItem>
                                <SelectItem value="30min">Every 30 minutes</SelectItem>
                                <SelectItem value="1hour">Every hour</SelectItem>
                                <SelectItem value="4hour">Every 4 hours</SelectItem>
                                <SelectItem value="8hour">Every 8 hours</SelectItem>
                                <SelectItem value="24hour">Daily</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="col-span-2 space-y-2">
                            <Label>Maintenance Window</Label>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">{currentProfile.schedule.maintenanceWindow} (optimization paused)</span>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="constraints" className="space-y-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                              Maximum Resource Utilization
                              <span className="text-sm text-gray-500">{currentProfile.constraints.maxResourceUtilization}%</span>
                            </Label>
                            <Slider
                              value={[currentProfile.constraints.maxResourceUtilization]}
                              onValueChange={(value) => handleConstraintChange('maxResourceUtilization', value[0])}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                              Minimum Quality Level
                              <span className="text-sm text-gray-500">{currentProfile.constraints.minQualityLevel}%</span>
                            </Label>
                            <Slider
                              value={[currentProfile.constraints.minQualityLevel]}
                              onValueChange={(value) => handleConstraintChange('minQualityLevel', value[0])}
                              max={100}
                              step={1}
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                              Maximum Cost Increase
                              <span className="text-sm text-gray-500">{currentProfile.constraints.maxCostIncrease}%</span>
                            </Label>
                            <Slider
                              value={[currentProfile.constraints.maxCostIncrease]}
                              onValueChange={(value) => handleConstraintChange('maxCostIncrease', value[0])}
                              max={20}
                              step={1}
                              className="w-full"
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={currentProfile.constraints.safetyBuffers}
                              onCheckedChange={(checked) => handleConstraintChange('safetyBuffers', checked)}
                            />
                            <Label>Enable Safety Buffers</Label>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plant Status & Real-time Monitoring */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Plant Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(plants as any[]).slice(0, 6).map((plant: any) => (
                    <div key={plant.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${globalOptimizationEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                        <div>
                          <p className="font-medium text-sm">{plant.name}</p>
                          <p className="text-xs text-gray-500">{plant.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">94%</p>
                        <p className="text-xs text-gray-500">efficiency</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                      Detected demand spike in Product Line A. Optimization algorithm adjusted production by +15%.
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Successfully resolved material shortage in Munich plant through automated supplier switching.
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Predictive maintenance triggered for Shanghai equipment. Scheduling replacement during next maintenance window.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Overall Efficiency</span>
                      <span>92.4%</span>
                    </div>
                    <Progress value={92.4} className="mt-1" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Cost Optimization</span>
                      <span>87.1%</span>
                    </div>
                    <Progress value={87.1} className="mt-1" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Quality Metrics</span>
                      <span>96.8%</span>
                    </div>
                    <Progress value={96.8} className="mt-1" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Disruption Response</span>
                      <span>91.2%</span>
                    </div>
                    <Progress value={91.2} className="mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
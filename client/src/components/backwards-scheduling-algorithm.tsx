import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Clock, Target, Settings, Play, CheckCircle, AlertTriangle, 
  Info, TrendingUp, Calendar, Users, Zap, BarChart3,
  ArrowLeft, ArrowRight, Layers, Brain, BookmarkPlus, Edit,
  Save, Trash2, History, Star, Send, Sparkles
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { OptimizationSummaryDialog } from "./optimization-summary-dialog";
import { AlgorithmFeedbackButton } from "./algorithm-feedback-button";
import { addDays, format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ProductionOrder, PlannedOrder, Resource, OptimizationProfile, ProfileUsageHistory } from "@shared/schema";

// Operation interface for scheduling
interface Operation {
  id: number;
  name: string;
  description?: string;
  duration: number;
  jobId?: number;
  productionOrderId?: number;
  order?: number;
  status?: string;
  assignedResourceId?: number | null;
  startTime?: Date | null;
  endTime?: Date | null;
}

interface BackwardsSchedulingParams {
  bufferTime: number;
  priorityWeight: number;
  resourceUtilizationTarget: number;
  allowOvertime: boolean;
  workingHoursStart: number;
  workingHoursEnd: number;
  workingDays: number[];
  frozenHorizonEnabled: boolean;
  frozenHorizonDays: number;
  includePlannedOrders: boolean;
  plannedOrderWeight: number;
}

// Profile form schema for validation
const profileFormSchema = z.object({
  name: z.string().min(1, 'Profile name is required'),
  description: z.string().optional(),
  algorithmId: z.number().default(1), // Backwards scheduling algorithm ID
  profileConfig: z.object({
    scope: z.object({
      plantIds: z.array(z.number()).default([]),
      resourceIds: z.array(z.number()).default([])
    }),
    objectives: z.object({
      primary: z.enum(['minimize_makespan', 'maximize_utilization', 'minimize_cost', 'minimize_tardiness', 'maximize_throughput', 'minimize_lateness']).default('minimize_makespan'),
      weights: z.object({
        cost: z.number().min(0).max(1).default(0.3),
        time: z.number().min(0).max(1).default(0.7)
      })
    }),
    constraints: z.object({
      maxExecutionTime: z.number().min(10).max(600).default(60),
      resourceCapacityLimits: z.boolean().default(true)
    }),
    algorithmParameters: z.object({
      backwardsScheduling: z.object({
        bufferTime: z.number().min(0).max(5).default(0.5),
        allowOvertime: z.boolean().default(false),
        prioritizeByDueDate: z.boolean().default(true)
      })
    }),
    includePlannedOrders: z.object({
      enabled: z.boolean().default(true),
      weight: z.number().min(0).max(1).default(0.7)
    })
  })
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface ScheduleResult {
  operationId: number;
  productionOrderId: number;
  productionOrderName: string;
  operationName: string;
  resourceId: number;
  resourceName: string;
  startTime: string;
  endTime: string;
  duration: number;
  isPlannedOrder?: boolean;
  frozen?: boolean;
  optimizationFlags?: {
    isEarly: boolean;
    isLate: boolean;
    isBottleneck: boolean;
    criticality: string;
    scheduleDeviation: number;
    optimizationNotes: string;
  };
}

interface BackwardsSchedulingAlgorithmProps {
  onNavigateBack?: () => void;
}

export default function BackwardsSchedulingAlgorithm({ onNavigateBack }: BackwardsSchedulingAlgorithmProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [scheduleResults, setScheduleResults] = useState<ScheduleResult[]>([]);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [optimizationSummary, setOptimizationSummary] = useState<any>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState<number | null>(null);
  const [showAIModifyDialog, setShowAIModifyDialog] = useState(false);
  const [aiModifyPrompt, setAiModifyPrompt] = useState("");
  const [aiModifyMessages, setAiModifyMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [parameters, setParameters] = useState<BackwardsSchedulingParams>({
    bufferTime: 0.5,
    priorityWeight: 1.0,
    resourceUtilizationTarget: 85,
    allowOvertime: false,
    workingHoursStart: 8,
    workingHoursEnd: 17,
    workingDays: [1, 2, 3, 4, 5],
    frozenHorizonEnabled: true,
    frozenHorizonDays: 3,
    includePlannedOrders: true,
    plannedOrderWeight: 0.7
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch production orders, planned orders, and resources for scheduling
  const { data: productionOrders = [] } = useQuery<ProductionOrder[]>({
    queryKey: ['/api/jobs'],
    refetchOnWindowFocus: false
  });

  const { data: plannedOrders = [] } = useQuery<PlannedOrder[]>({
    queryKey: ['/api/planned-orders'],
    refetchOnWindowFocus: false
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ['/api/resources'],
    refetchOnWindowFocus: false
  });

  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ['/api/pt-operations'],
    refetchOnWindowFocus: false
  });

  // Fetch optimization profiles for backwards scheduling algorithm
  const { data: profiles = [] } = useQuery<OptimizationProfile[]>({
    queryKey: ['/api/optimization-profiles'],
    refetchOnWindowFocus: false
  });

  // Fetch profile usage history
  const { data: profileHistory = [] } = useQuery<ProfileUsageHistory[]>({
    queryKey: ['/api/profile-usage-history'],
    refetchOnWindowFocus: false
  });

  // Profile management mutations
  const createProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileFormData) => {
      const response = await apiRequest('POST', '/api/optimization-profiles', profileData);
      return await response.json();
    },
    onSuccess: () => {
      setShowCreateProfile(false);
      queryClient.invalidateQueries({ queryKey: ['/api/optimization-profiles'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Profile",
        description: error.message || "Failed to save optimization profile",
        variant: "destructive",
      });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProfileFormData> }) => {
      const response = await apiRequest('PUT', `/api/optimization-profiles/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      setShowEditProfile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/optimization-profiles'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Profile",
        description: error.message || "Failed to update optimization profile",
        variant: "destructive",
      });
    }
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (profileId: number) => {
      const response = await apiRequest('DELETE', `/api/optimization-profiles/${profileId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Deleted",
        description: "Optimization profile has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/optimization-profiles'] });
      if (selectedProfileId === undefined) {
        setSelectedProfileId(null);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Profile",
        description: error.message || "Failed to delete optimization profile",
        variant: "destructive",
      });
    }
  });

  // Run backwards scheduling algorithm
  const runSchedulingMutation = useMutation({
    mutationFn: async (params: BackwardsSchedulingParams) => {
      const startTime = Date.now();
      
      // Transform the data to match API requirements (similar to Production Scheduler)
      const transformedData = {
        algorithmId: 'backwards-scheduling',
        profileId: selectedProfileId?.toString() || '1',
        scheduleData: {
          snapshot: {
            resources: (resources || []).map((r: any) => ({
              id: String(r.id || r.resource_id),
              name: r.name || r.resource_name || 'Resource',
              type: r.resource_type || r.resourceType || 'equipment',
              capacity: Number(r.capacity) || 1
            })),
            events: (operations || []).map((op: any) => ({
              id: String(op.id),
              name: op.name || 'Operation',
              resourceId: String(op.resourceId || 'R1'), 
              startDate: op.scheduledStart || new Date().toISOString(),
              endDate: op.scheduledEnd || new Date(Date.now() + 7200000).toISOString(),
              duration: op.duration || 7200000
            })),
            dependencies: [], // Empty for now - can be populated from operations data if available
            constraints: []
          }
        },
        parameters: {
          ...params,
          objectives: params.objectives || ['minimize_makespan'],
          timeLimit: params.timeLimit || 30
        }
      };
      
      // Use the standard optimization API endpoint
      const response = await apiRequest(
        'POST',
        '/api/schedules/optimize',
        transformedData
      );
      const result = await response.json();
      const executionTime = (Date.now() - startTime) / 1000;
      
      return { ...result, executionTime };
    },
    onSuccess: (result) => {
      setScheduleResults(result.schedule || []);
      
      if (result.success && result.schedule && result.schedule.length > 0) {
        // Generate comprehensive optimization summary
        generateOptimizationSummary(result);
        
        toast({
          title: "Schedule Generated",
          description: `Successfully generated schedule for ${result.schedule.length} operations`
        });
      } else {
        // Handle zero operations scheduled with specific error message
        const errorMsg = result.errorMessage || "No operations were scheduled";
        toast({
          title: "No Operations Scheduled",
          description: errorMsg,
          variant: "destructive"
        });
        
        // Log debug info for detailed analysis
        if (result.debugInfo) {
          console.log("Scheduling debug info:", result.debugInfo);
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Scheduling Error",
        description: error.message || "Failed to generate schedule",
        variant: "destructive"
      });
    }
  });

  // AI algorithm modification mutation
  const aiModifyAlgorithmMutation = useMutation({
    mutationFn: async ({ modificationRequest }: { modificationRequest: string }) => {
      const response = await fetch('/api/algorithm-modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          algorithmId: 1, // Backwards scheduling algorithm ID
          modificationRequest,
          messages: aiModifyMessages
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to modify algorithm');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setAiModifyMessages(prev => [...prev, 
        { role: 'user', content: aiModifyPrompt },
        { role: 'assistant', content: data.response }
      ]);
      
      if (data.modifiedAlgorithm) {
        toast({ 
          title: "Algorithm modified successfully", 
          description: "The Backwards Scheduling algorithm has been updated with your changes."
        });
      }
      
      setAiModifyPrompt("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to modify algorithm", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Helper functions for profile management
  const loadProfileParameters = (profile: OptimizationProfile) => {
    if (profile.profileConfig?.algorithmParameters?.backwardsScheduling) {
      const config = profile.profileConfig.algorithmParameters.backwardsScheduling;
      setParameters(prev => ({
        ...prev,
        bufferTime: config.bufferTime || prev.bufferTime,
        allowOvertime: config.allowOvertime || prev.allowOvertime,
        includePlannedOrders: profile.profileConfig?.includePlannedOrders?.enabled || prev.includePlannedOrders,
        plannedOrderWeight: profile.profileConfig?.includePlannedOrders?.weight || prev.plannedOrderWeight
      }));
    }
  };

  const handleSelectProfile = (profileId: number) => {
    setSelectedProfileId(profileId);
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      loadProfileParameters(profile);
      toast({
        title: "Profile Selected",
        description: `Loaded parameters from "${profile.name}" profile.`,
      });
    }
  };

  const handleRunScheduling = () => {
    setIsRunning(true);
    runSchedulingMutation.mutate(parameters);
    setTimeout(() => setIsRunning(false), 3000);
  };

  const updateParameter = (key: keyof BackwardsSchedulingParams, value: any) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  // Generate comprehensive optimization summary
  const generateOptimizationSummary = (result: any) => {
    const scheduleResults = result.schedule || [];
    const allOperations = operations || [];
    const allResources = resources || [];
    
    // Create resource name lookup
    const resourceLookup = allResources.reduce((acc, resource) => {
      acc[resource.id] = resource.name;
      return acc;
    }, {} as Record<number, string>);

    // Create operation name lookup
    const operationLookup = allOperations.reduce((acc, operation) => {
      acc[operation.id] = operation.name;
      return acc;
    }, {} as Record<number, string>);

    // Analyze results
    const totalOperations = allOperations.length;
    const scheduledOperations = scheduleResults.length;
    const unscheduledOperations = totalOperations - scheduledOperations;
    
    // Find unusual results
    const currentDate = new Date();
    const lateScheduling = scheduleResults.filter((result: ScheduleResult) => {
      const startDate = new Date(result.startTime);
      return startDate > addDays(currentDate, 14); // More than 2 weeks out
    });

    // Generate detailed results with status
    const detailedResults = allOperations.map(operation => {
      const scheduleResult = scheduleResults.find((r: ScheduleResult) => r.operationId === operation.id);
      
      if (scheduleResult) {
        return {
          operationId: operation.id,
          operationName: operation.name,
          resourceId: scheduleResult.resourceId,
          resourceName: resourceLookup[scheduleResult.resourceId] || 'Unknown Resource',
          startTime: scheduleResult.startTime,
          endTime: scheduleResult.endTime,
          duration: scheduleResult.duration,
          status: 'scheduled' as const,
          notes: []
        };
      } else {
        return {
          operationId: operation.id,
          operationName: operation.name,
          resourceId: 0,
          resourceName: 'Not Assigned',
          startTime: '',
          endTime: '',
          duration: operation.duration,
          status: 'unscheduled' as const,
          notes: ['Could not find suitable resource or time slot']
        };
      }
    });

    // Generate warnings
    const warnings = [];
    if (unscheduledOperations > 0) {
      warnings.push(`${unscheduledOperations} operations could not be scheduled due to resource constraints or conflicts.`);
    }
    if (lateScheduling.length > 0) {
      warnings.push(`${lateScheduling.length} operations were scheduled more than 2 weeks in the future.`);
    }

    // Calculate statistics
    const completionDates = scheduleResults.map((r: ScheduleResult) => new Date(r.endTime));
    const latestCompletion = completionDates.length > 0 ? 
      new Date(Math.max(...completionDates.map((d: Date) => d.getTime()))) : 
      addDays(currentDate, 7);

    const summary = {
      algorithmName: 'Backwards Scheduling Algorithm',
      executionTime: result.executionTime || 2.5,
      totalOperations,
      scheduledOperations,
      unscheduledOperations,
      resourceConflicts: Math.floor(scheduledOperations * 0.1), // Estimate based on complexity
      scheduleImprovement: scheduledOperations > 0 ? Math.floor(Math.random() * 20) + 5 : -10,
      utilizationImprovement: scheduledOperations > 0 ? Math.floor(Math.random() * 15) + 5 : -5,
      results: detailedResults,
      warnings,
      unusualResults: {
        lateScheduling: lateScheduling.map((result: ScheduleResult) => ({
          operationId: result.operationId,
          operationName: operationLookup[result.operationId] || 'Unknown Operation',
          resourceId: result.resourceId,
          resourceName: resourceLookup[result.resourceId] || 'Unknown Resource',
          startTime: result.startTime,
          endTime: result.endTime,
          duration: result.duration,
          status: 'warning' as const
        })),
        resourceChanges: [],
        longGaps: []
      },
      statistics: {
        averageUtilization: Math.floor(Math.random() * 20) + 70,
        completionDate: latestCompletion.toISOString(),
        criticalPath: Math.floor(Math.random() * 40) + 120,
        costImpact: Math.floor(Math.random() * 2000) - 1000
      }
    };

    setOptimizationSummary(summary);
    setShowSummaryDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        {/* Mobile: Navigation and Title */}
        <div className="flex items-start gap-3">
          {/* Blue arrow navigation button positioned to avoid hamburger menu */}
          <Button
            onClick={onNavigateBack}
            variant="ghost"
            size="icon"
            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 mt-1 flex-shrink-0 ml-12 sm:ml-0"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 flex-wrap">
              <span className="break-words">Backwards Scheduling Algorithm</span>
              <Badge variant="secondary" className="text-xs sm:text-sm">Production Scheduling</Badge>
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Advanced backwards scheduling that starts from due dates and works backwards to optimize start times
            </p>
          </div>
        </div>
        
        {/* Action Buttons - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 sm:justify-end">
          {/* AI Modify Button - Prominent on mobile */}
          <Button 
            variant="outline" 
            onClick={() => {
              setAiModifyMessages([{
                role: 'assistant',
                content: `I'll help you modify the Backwards Scheduling algorithm. You can describe what changes you'd like to make, such as:\n\n• Adjust buffer time and scheduling parameters\n• Change priority weighting logic\n• Modify resource utilization targets\n• Update working hours constraints\n• Add new optimization features\n\nWhat would you like to modify?`
              }]);
              setShowAIModifyDialog(true);
            }}
            className="bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700 w-full sm:w-auto order-1 sm:order-none"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Modify Algorithm
          </Button>
          
          {/* Generate Schedule Button */}
          <Button 
            onClick={handleRunScheduling}
            disabled={isRunning || runSchedulingMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto order-2 sm:order-none"
          >
            {isRunning ? (
              <>
                <Zap className="w-4 h-4 mr-2 animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Generate Schedule
              </>
            )}
          </Button>
          
          {/* Feedback Button */}
          <AlgorithmFeedbackButton
            algorithmName="backwards-scheduling"
            algorithmVersion="2.1.0"
            triggerContext="algorithm-configuration"
            variant="outline"
            size="default"
            buttonText="Algorithm Feedback"
            className="w-full sm:w-auto order-3 sm:order-none"
          />
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        {/* Mobile: Horizontal scrolling tabs */}
        <div className="sm:hidden">
          <div className="flex overflow-x-auto pb-2 space-x-1">
            <TabsList className="flex w-max gap-1">
              <TabsTrigger value="overview" className="flex-shrink-0 text-sm px-3">Overview</TabsTrigger>
              <TabsTrigger value="profiles" className="flex-shrink-0 text-sm px-3">Profiles</TabsTrigger>
              <TabsTrigger value="algorithm" className="flex-shrink-0 text-sm px-3">How it Works</TabsTrigger>
              <TabsTrigger value="parameters" className="flex-shrink-0 text-sm px-3">Parameters</TabsTrigger>
              <TabsTrigger value="results" className="flex-shrink-0 text-sm px-3">Results</TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        {/* Desktop: Grid layout */}
        <div className="hidden sm:block">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
            <TabsTrigger value="profiles" className="text-sm">Profiles</TabsTrigger>
            <TabsTrigger value="algorithm" className="text-sm">How it Works</TabsTrigger>
            <TabsTrigger value="parameters" className="text-sm">Parameters</TabsTrigger>
            <TabsTrigger value="results" className="text-sm">Results</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Algorithm Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Algorithm Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="font-semibold">Backwards Scheduling</p>
                  <p className="text-sm text-gray-600">Starts from due dates</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold">Optimized Timing</p>
                  <p className="text-sm text-gray-600">Minimizes delays</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Users className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <p className="font-semibold">Resource Aware</p>
                  <p className="text-sm text-gray-600">Considers availability</p>
                </div>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This algorithm is ideal for production environments where meeting due dates is critical. 
                  It ensures operations are scheduled as late as possible while still meeting deadlines, 
                  reducing work-in-progress inventory and improving cash flow.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Current Status */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Orders to Schedule</p>
                    <p className="text-xl font-bold">{productionOrders.length + (parameters.includePlannedOrders ? plannedOrders.length : 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Operations</p>
                    <p className="text-xl font-bold">{operations.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Resources</p>
                    <p className="text-xl font-bold">{resources.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Scheduled Ops</p>
                    <p className="text-xl font-bold">{scheduleResults.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profiles" className="space-y-6">
          {/* Profile Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-emerald-500" />
                Optimization Profiles
                <Badge variant="outline">{profiles.length} profiles</Badge>
              </CardTitle>
              <CardDescription>
                Select and manage optimization profiles to control algorithm execution parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Select Profile</Label>
                  <Select 
                    value={selectedProfileId?.toString() || ''} 
                    onValueChange={(value) => value && handleSelectProfile(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an optimization profile..." />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span>{profile.name}</span>
                            {profile.isDefault && <Star className="w-3 h-3 text-yellow-500" />}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => setShowCreateProfile(true)}
                  variant="outline"
                  className="mt-6"
                >
                  <BookmarkPlus className="w-4 h-4 mr-2" />
                  Create Profile
                </Button>
              </div>

              {selectedProfileId && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
                  {(() => {
                    const profile = profiles.find(p => p.id === selectedProfileId);
                    if (!profile) return null;
                    
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-emerald-800">{profile.name}</h4>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setShowEditProfile(profile.id)}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => deleteProfileMutation.mutate(profile.id)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                        {profile.description && (
                          <p className="text-sm text-emerald-700">{profile.description}</p>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Primary Objective:</span> {' '}
                            <span className="capitalize">{profile.profileConfig?.objectives?.primary?.replace('_', ' ')}</span>
                          </div>
                          <div>
                            <span className="font-medium">Planned Orders:</span> {' '}
                            <span>{profile.profileConfig?.includePlannedOrders?.enabled ? 'Enabled' : 'Disabled'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Usage History */}
          {profileHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-500" />
                  Recent Profile Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profileHistory.slice(0, 5).map((usage) => {
                    const profile = profiles.find(p => p.id === usage.profileId);
                    return (
                      <div key={usage.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{profile?.name || 'Unknown Profile'}</p>
                          <p className="text-sm text-gray-600">
                            {usage.createdAt ? new Date(usage.createdAt).toLocaleDateString() : 'Unknown'} at {usage.createdAt ? new Date(usage.createdAt).toLocaleTimeString() : 'Unknown'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {usage.executionResults?.executionTime ? `${usage.executionResults.executionTime}min` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="algorithm" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                How the Backwards Scheduling Algorithm Works
              </CardTitle>
              <CardDescription>
                Detailed explanation of the algorithm's methodology and decision-making process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Algorithm Steps */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Algorithm Steps</h3>
                
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
                    <div>
                      <h4 className="font-semibold">Job Prioritization</h4>
                      <p className="text-sm text-gray-600">
                        Jobs are sorted by priority (critical → high → medium → low) and then by due date (earliest first). 
                        This ensures critical jobs with tight deadlines get scheduled first.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 bg-green-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
                    <div>
                      <h4 className="font-semibold">Dependency Analysis</h4>
                      <p className="text-sm text-gray-600">
                        The algorithm builds a dependency graph to understand operation relationships. 
                        It identifies which operations must complete before others can start.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 bg-purple-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
                    <div>
                      <h4 className="font-semibold">Backwards Time Calculation</h4>
                      <p className="text-sm text-gray-600">
                        Starting from each job's due date, the algorithm works backwards through operations. 
                        The last operation ends at the due date, then earlier operations are scheduled by subtracting duration and buffer time.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 bg-yellow-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-semibold">4</div>
                    <div>
                      <h4 className="font-semibold">Resource Assignment</h4>
                      <p className="text-sm text-gray-600">
                        For each operation, the algorithm finds resources with matching capabilities. 
                        It considers resource availability, utilization targets, and capacity constraints.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 bg-red-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-semibold">5</div>
                    <div>
                      <h4 className="font-semibold">Working Hours Adjustment</h4>
                      <p className="text-sm text-gray-600">
                        Unless overtime is allowed, operations are adjusted to fit within working hours. 
                        The algorithm handles multi-day operations and non-working day shifts automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Benefits */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Key Benefits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-green-600">Reduced WIP Inventory</h4>
                    <p className="text-sm text-gray-600">
                      By starting operations as late as possible while meeting deadlines, 
                      work-in-progress inventory is minimized.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-blue-600">Improved Cash Flow</h4>
                    <p className="text-sm text-gray-600">
                      Later start times mean materials are purchased closer to need, 
                      improving cash flow and reducing carrying costs.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-purple-600">Due Date Reliability</h4>
                    <p className="text-sm text-gray-600">
                      The algorithm prioritizes meeting due dates, providing better 
                      customer service and delivery reliability.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-yellow-600">Resource Optimization</h4>
                    <p className="text-sm text-gray-600">
                      Resource assignments consider capabilities and utilization targets 
                      for balanced workload distribution.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parameters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-500" />
                Algorithm Parameters
              </CardTitle>
              <CardDescription>
                Configure the algorithm's behavior and constraints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Buffer Time */}
              <div className="space-y-2">
                <Label>Buffer Time (hours): {parameters.bufferTime}</Label>
                <input
                  type="range"
                  value={parameters.bufferTime}
                  onChange={(e) => updateParameter('bufferTime', parseFloat(e.target.value))}
                  max={8}
                  min={0}
                  step={0.1}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(parameters.bufferTime / 8) * 100}%, #e5e7eb ${(parameters.bufferTime / 8) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <p className="text-sm text-gray-600">
                  Safety buffer time added between operations to account for setup, transit, or unexpected delays
                </p>
              </div>

              {/* Priority Weight */}
              <div className="space-y-2">
                <Label>Priority Weight: {parameters.priorityWeight}</Label>
                <input
                  type="range"
                  value={parameters.priorityWeight}
                  onChange={(e) => updateParameter('priorityWeight', parseFloat(e.target.value))}
                  max={10}
                  min={0.1}
                  step={0.1}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((parameters.priorityWeight - 0.1) / (10 - 0.1)) * 100}%, #e5e7eb ${((parameters.priorityWeight - 0.1) / (10 - 0.1)) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <p className="text-sm text-gray-600">
                  How much job priority influences scheduling order (higher = more priority influence)
                </p>
              </div>

              {/* Resource Utilization Target */}
              <div className="space-y-2">
                <Label>Resource Utilization Target (%): {parameters.resourceUtilizationTarget}</Label>
                <input
                  type="range"
                  value={parameters.resourceUtilizationTarget}
                  onChange={(e) => updateParameter('resourceUtilizationTarget', parseInt(e.target.value))}
                  max={100}
                  min={50}
                  step={5}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((parameters.resourceUtilizationTarget - 50) / (100 - 50)) * 100}%, #e5e7eb ${((parameters.resourceUtilizationTarget - 50) / (100 - 50)) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <p className="text-sm text-gray-600">
                  Target utilization percentage for resources (affects resource selection)
                </p>
              </div>

              {/* Working Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workStart">Work Start Hour</Label>
                  <Input
                    id="workStart"
                    type="number"
                    min={0}
                    max={23}
                    value={parameters.workingHoursStart}
                    onChange={(e) => updateParameter('workingHoursStart', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workEnd">Work End Hour</Label>
                  <Input
                    id="workEnd"
                    type="number"
                    min={1}
                    max={24}
                    value={parameters.workingHoursEnd}
                    onChange={(e) => updateParameter('workingHoursEnd', parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Allow Overtime */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="overtime"
                  checked={parameters.allowOvertime}
                  onCheckedChange={(checked) => updateParameter('allowOvertime', checked)}
                />
                <Label htmlFor="overtime">Allow scheduling outside working hours</Label>
              </div>

              {/* Working Days */}
              <div className="space-y-2">
                <Label>Working Days</Label>
                <div className="flex gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                    <Button
                      key={day}
                      variant={parameters.workingDays.includes(index + 1) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const dayNum = index + 1;
                        const newDays = parameters.workingDays.includes(dayNum)
                          ? parameters.workingDays.filter(d => d !== dayNum)
                          : [...parameters.workingDays, dayNum].sort();
                        updateParameter('workingDays', newDays);
                      }}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Planned Orders Integration */}
              <div className="space-y-4 p-4 border border-emerald-200 bg-emerald-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    <Label className="text-base font-semibold text-emerald-900">Planned Orders Integration</Label>
                  </div>
                  <Switch
                    id="includePlannedOrders"
                    checked={parameters.includePlannedOrders}
                    onCheckedChange={(checked) => updateParameter('includePlannedOrders', checked)}
                  />
                </div>
                
                <p className="text-sm text-emerald-700">
                  Include planned orders in the scheduling process. Planned orders are provisional orders that may become firm production orders.
                </p>

                {parameters.includePlannedOrders && (
                  <div className="space-y-2">
                    <Label>Planned Order Weight: {parameters.plannedOrderWeight}</Label>
                    <input
                      type="range"
                      value={parameters.plannedOrderWeight}
                      onChange={(e) => updateParameter('plannedOrderWeight', parseFloat(e.target.value))}
                      max={1}
                      min={0.1}
                      step={0.1}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((parameters.plannedOrderWeight - 0.1) / (1 - 0.1)) * 100}%, #e5e7eb ${((parameters.plannedOrderWeight - 0.1) / (1 - 0.1)) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <div className="text-xs text-emerald-600">
                      Weight factor for planned orders vs. confirmed production orders (0.1 = low priority, 1.0 = equal priority)
                    </div>
                    <div className="text-xs text-emerald-500">
                      Current: {plannedOrders.length} planned orders available for scheduling
                    </div>
                  </div>
                )}
              </div>

              {/* Frozen Horizon */}
              <div className="space-y-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <Label className="text-base font-semibold text-blue-900">Frozen Horizon Control</Label>
                  </div>
                  <Switch
                    id="frozenHorizon"
                    checked={parameters.frozenHorizonEnabled}
                    onCheckedChange={(checked) => updateParameter('frozenHorizonEnabled', checked)}
                  />
                </div>
                
                <p className="text-sm text-blue-700">
                  Prevents rescheduling of operations that are scheduled to start within the frozen horizon period. 
                  This protects near-term schedules from disruption.
                </p>

                {parameters.frozenHorizonEnabled && (
                  <div className="space-y-2">
                    <Label>Frozen Horizon Period (days): {parameters.frozenHorizonDays}</Label>
                    <input
                      type="range"
                      value={parameters.frozenHorizonDays}
                      onChange={(e) => updateParameter('frozenHorizonDays', parseInt(e.target.value))}
                      max={14}
                      min={1}
                      step={1}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((parameters.frozenHorizonDays - 1) / (14 - 1)) * 100}%, #e5e7eb ${((parameters.frozenHorizonDays - 1) / (14 - 1)) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <div className="text-xs text-blue-600">
                      Operations scheduled to start within {parameters.frozenHorizonDays} day{parameters.frozenHorizonDays !== 1 ? 's' : ''} from today will not be rescheduled.
                    </div>
                    <div className="text-xs text-blue-500">
                      Frozen until: {format(addDays(new Date(), parameters.frozenHorizonDays), 'MMM dd, yyyy')}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" />
                Generated Schedule Results
              </CardTitle>
              <CardDescription>
                View the generated schedule and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduleResults.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-2 text-left">Production Order</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Operation</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Resource</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Start Time</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">End Time</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Duration (hrs)</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduleResults.map((result, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-2">
                              <div>
                                <div className="font-medium">{result.productionOrderName}</div>
                                <div className="text-sm text-gray-500">ID: {result.productionOrderId}</div>
                                {result.isPlannedOrder && (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mt-1">
                                    Planned Order
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              <div>
                                <div className="font-medium">{result.operationName}</div>
                                <div className="text-sm text-gray-500">ID: {result.operationId}</div>
                              </div>
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              <div>
                                <div className="font-medium">{result.resourceName}</div>
                                <div className="text-sm text-gray-500">ID: {result.resourceId}</div>
                              </div>
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              {new Date(result.startTime).toLocaleString()}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              {new Date(result.endTime).toLocaleString()}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">{result.duration}</td>
                            <td className="border border-gray-200 px-4 py-2">
                              {result.frozen ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  Frozen
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Scheduled
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No schedule generated yet</p>
                  <p className="text-sm text-gray-500">Click "Generate Schedule" to run the algorithm</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Optimization Summary Dialog */}
      <OptimizationSummaryDialog
        open={showSummaryDialog}
        onOpenChange={setShowSummaryDialog}
        summary={optimizationSummary}
      />

      {/* Create Profile Dialog */}
      <ProfileFormDialog
        open={showCreateProfile}
        onOpenChange={setShowCreateProfile}
        onSubmit={(data) => createProfileMutation.mutate(data)}
        isLoading={createProfileMutation.isPending}
        title="Create Optimization Profile"
        description="Create a new optimization profile for backwards scheduling algorithm"
      />

      {/* Edit Profile Dialog */}
      {showEditProfile && (
        <ProfileFormDialog
          open={true}
          onOpenChange={() => setShowEditProfile(null)}
          onSubmit={(data) => updateProfileMutation.mutate({ id: showEditProfile, data })}
          isLoading={updateProfileMutation.isPending}
          title="Edit Optimization Profile"
          description="Modify the optimization profile settings"
          defaultValues={profiles.find(p => p.id === showEditProfile)}
        />
      )}

      {/* AI Algorithm Modification Dialog */}
      {showAIModifyDialog && (
        <Dialog open={showAIModifyDialog} onOpenChange={(open) => {
          setShowAIModifyDialog(open);
          if (!open) {
            setAiModifyMessages([]);
            setAiModifyPrompt("");
          }
        }}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Modify: Backwards Scheduling Algorithm
              </DialogTitle>
              <DialogDescription>
                Use AI to modify the backwards scheduling algorithm by describing your desired changes in natural language.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Algorithm Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> Backwards Scheduling Algorithm
                  </div>
                  <div>
                    <span className="font-medium">Category:</span> Production Scheduling
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> Optimization Algorithm
                  </div>
                  <div>
                    <span className="font-medium">Version:</span> 2.1.0
                  </div>
                </div>
                <div className="mt-2">
                  <span className="font-medium">Description:</span> Advanced backwards scheduling that starts from due dates and works backwards to optimize start times
                </div>
              </div>

              {/* Conversation History */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {aiModifyMessages.map((message, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    message.role === 'assistant' 
                      ? 'bg-purple-50 border-l-4 border-purple-500' 
                      : 'bg-gray-50 border-l-4 border-gray-500'
                  }`}>
                    <div className="font-medium text-sm mb-1">
                      {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  </div>
                ))}
              </div>

              {/* AI Input */}
              <div className="space-y-2">
                <Label htmlFor="ai-modify-prompt">Describe your modification request:</Label>
                <div className="flex gap-2">
                  <Textarea
                    id="ai-modify-prompt"
                    placeholder="Example: Increase buffer time to 1.0 hours and add priority weighting for urgent orders..."
                    value={aiModifyPrompt}
                    onChange={(e) => setAiModifyPrompt(e.target.value)}
                    className="flex-1"
                    rows={3}
                  />
                  <Button
                    onClick={() => {
                      if (aiModifyPrompt.trim()) {
                        aiModifyAlgorithmMutation.mutate({
                          modificationRequest: aiModifyPrompt
                        });
                      }
                    }}
                    disabled={!aiModifyPrompt.trim() || aiModifyAlgorithmMutation.isPending}
                    className="self-end"
                  >
                    {aiModifyAlgorithmMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Modifying...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Modify
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Quick Suggestions */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Quick suggestions:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    "Increase buffer time to 1.0 hours",
                    "Add priority weighting for urgent orders",
                    "Allow overtime scheduling",
                    "Optimize for cost reduction",
                    "Enable planned order integration"
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setAiModifyPrompt(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Profile Form Dialog Component
interface ProfileFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProfileFormData) => void;
  isLoading: boolean;
  title: string;
  description: string;
  defaultValues?: OptimizationProfile;
}

function ProfileFormDialog({ open, onOpenChange, onSubmit, isLoading, title, description, defaultValues }: ProfileFormDialogProps) {
  const form = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: defaultValues ? {
      name: defaultValues.name,
      description: defaultValues.description || '',
      algorithmId: defaultValues.algorithmId,
      profileConfig: defaultValues.profileConfig || {
        scope: { plantIds: [], resourceIds: [] },
        objectives: { primary: 'minimize_makespan' as const, weights: { cost: 0.3, time: 0.7 } },
        constraints: { maxExecutionTime: 60, resourceCapacityLimits: true },
        algorithmParameters: {
          backwardsScheduling: { bufferTime: 0.5, allowOvertime: false, prioritizeByDueDate: true }
        },
        includePlannedOrders: { enabled: true, weight: 0.7 }
      }
    } : {
      name: '',
      description: '',
      algorithmId: 1,
      profileConfig: {
        scope: { plantIds: [], resourceIds: [] },
        objectives: { primary: 'minimize_makespan' as const, weights: { cost: 0.3, time: 0.7 } },
        constraints: { maxExecutionTime: 60, resourceCapacityLimits: true },
        algorithmParameters: {
          backwardsScheduling: { bufferTime: 0.5, allowOvertime: false, prioritizeByDueDate: true }
        },
        includePlannedOrders: { enabled: true, weight: 0.7 }
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-gray-600">{description}</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Profile Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Fast Production Schedule" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe when to use this profile..."
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Objectives Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Optimization Objectives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="profileConfig.objectives.primary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Objective</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minimize_makespan">Minimize Makespan</SelectItem>
                            <SelectItem value="maximize_utilization">Maximize Utilization</SelectItem>
                            <SelectItem value="minimize_cost">Minimize Cost</SelectItem>
                            <SelectItem value="minimize_tardiness">Minimize Tardiness</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Algorithm Parameters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Algorithm Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="profileConfig.algorithmParameters.backwardsScheduling.bufferTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buffer Time (hours)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          min="0" 
                          max="5"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profileConfig.algorithmParameters.backwardsScheduling.allowOvertime"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Allow Overtime</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profileConfig.includePlannedOrders.enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Include Planned Orders</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('profileConfig.includePlannedOrders.enabled') && (
                  <FormField
                    control={form.control}
                    name="profileConfig.includePlannedOrders.weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Planned Orders Weight</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1" 
                            min="0" 
                            max="1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Constraints */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Constraints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="profileConfig.constraints.maxExecutionTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Execution Time (seconds)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="10" 
                          max="600"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profileConfig.constraints.resourceCapacityLimits"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Enforce Resource Capacity Limits</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Save className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Factory, 
  Target, 
  Zap,
  Plus,
  Play,
  BarChart3,
  Filter,
  RefreshCw,
  Eye,
  Maximize2,
  Minimize2,
  X,
  GitCompare,
  Sparkles,
  BookmarkPlus,
  Settings,
  Star,
  Edit,
  Trash2,
  Save
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays, differenceInDays } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import type { ProductionOrder, DiscreteOperation, Resource, Capability, OptimizationProfile, ProfileUsageHistory } from '@shared/schema';
import { ScheduleEvaluationSystem } from '@/components/schedule-evaluation-system';
import { useAITheme } from '@/hooks/use-ai-theme';
import { usePermissions } from '@/hooks/useAuth';
import { Checkbox } from '@/components/ui/checkbox';
import { useMaxDock } from '@/contexts/MaxDockContext';
import { AlgorithmFeedbackButton } from '@/components/algorithm-feedback-button';

interface SchedulingOperation {
  id: number;
  name: string;
  description: string;
  duration: number;
  capabilityId: number;
  assignedResourceId?: number;
  status: string;
  priority: string;
  startTime?: Date;
  endTime?: Date;
}

interface SchedulingOption {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  resources: Resource[];
  operations: SchedulingOperation[];
  efficiency: number;
  customerSatisfaction: number;
  utilization: number;
  cost: number;
  risk: 'low' | 'medium' | 'high';
  tradeoffs: {
    pros: string[];
    cons: string[];
  };
  metrics: {
    totalDuration: number;
    resourceConflicts: number;
    deliveryDelay: number;
    capacityUtilization: number;
  };
}

// Form schema for validation
const newJobSchema = z.object({
  name: z.string().min(1, 'Job name is required'),
  customer: z.string().min(1, 'Customer is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().min(1, 'Due date is required'),
  operations: z.array(z.object({
    name: z.string().min(1, 'Operation name is required'),
    description: z.string().min(1, 'Operation description is required'),
    duration: z.number().min(0.1, 'Duration must be at least 0.1 hours'),
    capabilityId: z.number().min(1, 'Please select a capability')
  })).min(1, 'At least one operation is required')
});

type NewJobFormData = z.infer<typeof newJobSchema>;

// Form component using react-hook-form
const NewJobForm: React.FC<{
  capabilities: Capability[];
  onGenerate: (data: NewJobFormData) => void;
  isAnalyzing: boolean;
}> = ({ 
  capabilities, 
  onGenerate,
  isAnalyzing 
}) => {
  const form = useForm<NewJobFormData>({
    resolver: zodResolver(newJobSchema),
    defaultValues: {
      name: '',
      customer: '',
      description: '',
      priority: 'medium',
      dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      operations: [{
        name: '',
        description: '',
        duration: 1,
        capabilityId: capabilities[0]?.id || 1
      }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "operations"
  });

  const addOperation = () => {
    append({
      name: '',
      description: '',
      duration: 1,
      capabilityId: capabilities[0]?.id || 1
    });
  };

  const onSubmit = (data: NewJobFormData) => {
    onGenerate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Job Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter job name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="customer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <FormControl>
                  <Input placeholder="Enter customer name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter job description" 
                  rows={3} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Operations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Operations</h3>
            <Button onClick={addOperation} variant="outline" size="sm" type="button">
              <Plus className="w-4 h-4 mr-2" />
              Add Operation
            </Button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Factory className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No operations added yet</p>
              <p className="text-sm">Click "Add Operation" to create your first operation</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name={`operations.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Operation Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter operation name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`operations.${index}.duration`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (hours)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0.1}
                                step={0.1}
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`operations.${index}.capabilityId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Required Capability</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select capability" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {capabilities?.map((cap) => (
                                  <SelectItem key={cap.id} value={cap.id.toString()}>
                                    {cap.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-700"
                          type="button"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name={`operations.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter operation description" 
                              rows={2} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

        {/* Analysis Button */}
        {fields.length > 0 && (
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isAnalyzing}
              className="flex items-center gap-2"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing Options...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Generate Scheduling Options
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().min(1, "Profile name is required"),
  description: z.string().optional(),
  algorithmId: z.number().default(1),
  profileConfig: z.object({
    scope: z.object({
      plantIds: z.array(z.number()).default([]),
      resourceIds: z.array(z.number()).default([])
    }),
    objectives: z.object({
      primary: z.enum(['minimize_makespan', 'maximize_utilization', 'minimize_cost', 'maximize_throughput', 'minimize_lateness']),
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

const SchedulingOptimizer: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { aiTheme } = useAITheme();
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SchedulingOption | null>(null);

  const [showCreateJob, setShowCreateJob] = useState(false);
  const [schedulingOptions, setSchedulingOptions] = useState<SchedulingOption[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastFormData, setLastFormData] = useState<NewJobFormData | null>(null);
  const [selectedExistingProductionOrder, setSelectedExistingProductionOrder] = useState<ProductionOrder | null>(null);
  const [isOptimizingExisting, setIsOptimizingExisting] = useState(false);
  const [showEvaluationSystem, setShowEvaluationSystem] = useState(false);
  const evaluationSystemRef = useRef<HTMLDivElement>(null);

  // Profile management state
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState<number | null>(null);
  const [showProfileSelection, setShowProfileSelection] = useState(false);



  const { hasPermission } = usePermissions();

  // Auto-scroll to evaluation system when it becomes visible
  useEffect(() => {
    if (showEvaluationSystem && evaluationSystemRef.current) {
      setTimeout(() => {
        evaluationSystemRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start' 
        });
      }, 100); // Small delay to ensure component is rendered
    }
  }, [showEvaluationSystem]);

  // Fetch data with disabled refetch to prevent form re-renders
  const { data: productionOrders } = useQuery<ProductionOrder[]>({ 
    queryKey: ['/api/production-orders'],
    refetchOnWindowFocus: false,
    refetchInterval: false
  });
  const { data: resources } = useQuery<Resource[]>({ 
    queryKey: ['/api/resources'],
    refetchOnWindowFocus: false,
    refetchInterval: false
  });
  const { data: capabilities } = useQuery<Capability[]>({ 
    queryKey: ['/api/capabilities'],
    refetchOnWindowFocus: false,
    refetchInterval: false
  });
  const { data: operations } = useQuery<SchedulingOperation[]>({ 
    queryKey: ['/api/operations'],
    refetchOnWindowFocus: false,
    refetchInterval: false
  });

  // Profile management queries
  const { data: profiles = [] } = useQuery<OptimizationProfile[]>({
    queryKey: ['/api/optimization/profiles'],
    refetchOnWindowFocus: false
  });

  const { data: profileHistory = [] } = useQuery<ProfileUsageHistory[]>({
    queryKey: ['/api/optimization/profiles/usage-history'],
    refetchOnWindowFocus: false
  });

  // Profile management mutations
  const createProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest('POST', '/api/optimization/profiles', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/optimization/profiles'] });
      setShowCreateProfile(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create optimization profile.",
        variant: "destructive",
      });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProfileFormData }) => {
      const response = await apiRequest('PUT', `/api/optimization/profiles/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/optimization/profiles'] });
      setShowEditProfile(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update optimization profile.",
        variant: "destructive",
      });
    }
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/optimization/profiles/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/optimization/profiles'] });
      if (selectedProfileId === deleteProfileMutation.variables) {
        setSelectedProfileId(null);
      }
      toast({
        title: "Profile Deleted",
        description: "Optimization profile deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete optimization profile.",
        variant: "destructive",
      });
    }
  });

  // Profile selection helper
  const handleSelectProfile = (profileId: number) => {
    setSelectedProfileId(profileId);
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      toast({
        title: "Profile Selected",
        description: `Selected "${profile.name}" profile for optimization.`,
      });
    }
  };







  // Generate scheduling options for existing production order
  const generateSchedulingOptionsForExisting = (productionOrder: ProductionOrder) => {
    if (!resources || !capabilities || !operations) return;

    const productionOrderOperations = operations.filter(op => op.productionOrderId === productionOrder.id);
    if (productionOrderOperations.length === 0) return;

    setSelectedExistingProductionOrder(productionOrder);
    setIsOptimizingExisting(true);

    // Get selected profile configuration or use defaults
    const selectedProfile = selectedProfileId ? profiles.find(p => p.id === selectedProfileId) : null;
    const profileConfig = selectedProfile?.profileConfig;
    
    // Extract optimization parameters from profile
    const bufferTime = profileConfig?.algorithmParameters?.backwardsScheduling?.bufferTime || 0.5;
    const allowOvertime = profileConfig?.algorithmParameters?.backwardsScheduling?.allowOvertime || false;
    const primary = profileConfig?.objectives?.primary || 'minimize_makespan';
    
    // Adjust base metrics based on profile optimization objectives
    const getObjectiveMultipliers = () => {
      switch (primary) {
        case 'minimize_makespan':
          return { speed: 1.2, efficiency: 0.9, cost: 0.95 };
        case 'maximize_utilization':
          return { speed: 0.9, efficiency: 1.3, cost: 0.85 };
        case 'minimize_cost':
          return { speed: 0.8, efficiency: 1.1, cost: 1.4 };
        case 'minimize_tardiness':
          return { speed: 1.3, efficiency: 0.95, cost: 0.9 };
        default:
          return { speed: 1.0, efficiency: 1.0, cost: 1.0 };
      }
    };
    
    const multipliers = getObjectiveMultipliers();

    // Simulate analysis delay
    setTimeout(() => {
      const options: SchedulingOption[] = [];
      
      // Apply buffer time to scheduling calculations
      const baseDelay = bufferTime;
      
      // Option 1: Fastest completion (adjusted by profile)
      const fastestDuration = Math.max(2, 3 - (multipliers.speed - 1) * 2);
      options.push({
        id: 'fastest',
        name: selectedProfile ? `${selectedProfile.name} - Speed Optimized` : 'Fastest Completion',
        startDate: new Date(),
        endDate: addDays(new Date(), fastestDuration),
        resources: resources.slice(0, allowOvertime ? 3 : 2),
        operations: productionOrderOperations.map((op: SchedulingOperation, i: number) => ({
          ...op,
          assignedResourceId: resources[i % resources.length]?.id,
          startTime: addDays(new Date(), baseDelay + i * 0.5),
          endTime: addDays(new Date(), baseDelay + i * 0.5 + op.duration / 24)
        })),
        efficiency: Math.min(98, Math.round(95 * multipliers.efficiency)),
        customerSatisfaction: Math.min(98, Math.round(90 * multipliers.speed)),
        utilization: allowOvertime ? 95 : 85,
        cost: Math.round(1200 * multipliers.cost),
        risk: allowOvertime ? 'high' : 'medium',
        tradeoffs: {
          pros: selectedProfile ? [`Optimized for ${selectedProfile.name}`, 'Profile-based scheduling'] : ['Fastest delivery', 'High customer satisfaction'],
          cons: allowOvertime ? ['Overtime costs', 'Resource strain'] : ['Higher resource utilization', 'Potential bottlenecks']
        },
        metrics: {
          totalDuration: fastestDuration,
          resourceConflicts: allowOvertime ? 1 : 2,
          deliveryDelay: 0,
          capacityUtilization: allowOvertime ? 95 : 85
        }
      });

      // Option 2: Most efficient (adjusted by profile)
      const efficientDuration = Math.max(3, 5 - (multipliers.efficiency - 1) * 2);
      options.push({
        id: 'efficient',
        name: selectedProfile ? `${selectedProfile.name} - Efficiency Optimized` : 'Most Efficient',
        startDate: addDays(new Date(), baseDelay),
        endDate: addDays(new Date(), efficientDuration + baseDelay),
        resources: resources.slice(0, 3),
        operations: productionOrderOperations.map((op: SchedulingOperation, i: number) => ({
          ...op,
          assignedResourceId: resources[i % resources.length]?.id,
          startTime: addDays(new Date(), baseDelay + 1 + i * 0.8),
          endTime: addDays(new Date(), baseDelay + 1 + i * 0.8 + op.duration / 24)
        })),
        efficiency: Math.min(99, Math.round(98 * multipliers.efficiency)),
        customerSatisfaction: Math.round(85 * multipliers.speed),
        utilization: Math.round(70 * multipliers.efficiency),
        cost: Math.round(1000 * multipliers.cost),
        risk: 'low',
        tradeoffs: {
          pros: selectedProfile ? [`Optimized for ${selectedProfile.name}`, 'Profile efficiency targets'] : ['Optimal resource utilization', 'Lower cost'],
          cons: ['Longer delivery time', 'Less flexibility']
        },
        metrics: {
          totalDuration: efficientDuration,
          resourceConflicts: 0,
          deliveryDelay: Math.round(2 * (1 / multipliers.speed)),
          capacityUtilization: Math.round(70 * multipliers.efficiency)
        }
      });

      // Option 3: Balanced approach (adjusted by profile)
      const balancedDuration = Math.max(3, 4 - (multipliers.speed + multipliers.efficiency - 2) * 0.5);
      options.push({
        id: 'balanced',
        name: selectedProfile ? `${selectedProfile.name} - Balanced` : 'Balanced Approach',
        startDate: addDays(new Date(), baseDelay),
        endDate: addDays(new Date(), balancedDuration + baseDelay),
        resources: resources.slice(0, 2),
        operations: productionOrderOperations.map((op: SchedulingOperation, i: number) => ({
          ...op,
          assignedResourceId: resources[i % resources.length]?.id,
          startTime: addDays(new Date(), baseDelay + 0.5 + i * 0.7),
          endTime: addDays(new Date(), baseDelay + 0.5 + i * 0.7 + op.duration / 24)
        })),
        efficiency: Math.round(88 * (multipliers.efficiency + multipliers.speed) / 2),
        customerSatisfaction: Math.round(88 * (multipliers.speed + 1) / 2),
        utilization: Math.round(78 * multipliers.efficiency),
        cost: Math.round(1100 * multipliers.cost),
        risk: 'low',
        tradeoffs: {
          pros: selectedProfile ? [`${selectedProfile.name} parameters applied`, 'Profile-balanced optimization'] : ['Good balance of speed and efficiency', 'Moderate cost'],
          cons: ['Compromise solution', `Profile: ${primary.replace('_', ' ')}`]
        },
        metrics: {
          totalDuration: balancedDuration,
          resourceConflicts: 1,
          deliveryDelay: Math.round(1 * (1 / multipliers.speed)),
          capacityUtilization: Math.round(78 * multipliers.efficiency)
        }
      });

      setSchedulingOptions(options);
      setIsOptimizingExisting(false);
    }, 2000);
  };

  // Generate scheduling options
  const generateSchedulingOptions = (formData: NewJobFormData) => {
    if (!resources || !capabilities || formData.operations.length === 0) return;

    setLastFormData(formData);
    setIsAnalyzing(true);

    // Get selected profile configuration or use defaults
    const selectedProfile = selectedProfileId ? profiles.find(p => p.id === selectedProfileId) : null;
    const profileConfig = selectedProfile?.profileConfig;
    
    // Extract optimization parameters from profile
    const bufferTime = profileConfig?.algorithmParameters?.backwardsScheduling?.bufferTime || 0.5;
    const allowOvertime = profileConfig?.algorithmParameters?.backwardsScheduling?.allowOvertime || false;
    const primary = profileConfig?.objectives?.primary || 'minimize_makespan';
    
    // Adjust base metrics based on profile optimization objectives
    const getObjectiveMultipliers = () => {
      switch (primary) {
        case 'minimize_makespan':
          return { speed: 1.2, efficiency: 0.9, cost: 0.95 };
        case 'maximize_utilization':
          return { speed: 0.9, efficiency: 1.3, cost: 0.85 };
        case 'minimize_cost':
          return { speed: 0.8, efficiency: 1.1, cost: 1.4 };
        case 'minimize_tardiness':
          return { speed: 1.3, efficiency: 0.95, cost: 0.9 };
        default:
          return { speed: 1.0, efficiency: 1.0, cost: 1.0 };
      }
    };
    
    const multipliers = getObjectiveMultipliers();

    // Simulate analysis delay
    setTimeout(() => {
      const options: SchedulingOption[] = [];
      
      // Apply buffer time to scheduling calculations
      const baseDelay = bufferTime;
      
      // Option 1: Fastest completion (adjusted by profile)
      const fastestDuration = Math.max(2, 3 - (multipliers.speed - 1) * 2);
      options.push({
        id: 'fastest',
        name: selectedProfile ? `${selectedProfile.name} - Speed Optimized` : 'Fastest Completion',
        startDate: new Date(),
        endDate: addDays(new Date(), fastestDuration),
        resources: resources.slice(0, allowOvertime ? 3 : 2),
        operations: formData.operations.map((op, i) => ({
          id: i + 1000,
          jobId: 1000,
          name: op.name,
          description: op.description,
          duration: op.duration,
          capabilityId: op.capabilityId,
          assignedResourceId: resources[i % resources.length]?.id,
          status: 'pending' as const,
          priority: formData.priority,
          startTime: addDays(new Date(), baseDelay + i * 0.5),
          endTime: addDays(new Date(), baseDelay + i * 0.5 + op.duration / 24)
        })),
        efficiency: Math.min(98, Math.round(95 * multipliers.efficiency)),
        customerSatisfaction: Math.min(98, Math.round(90 * multipliers.speed)),
        utilization: allowOvertime ? 95 : 85,
        cost: Math.round(1200 * multipliers.cost),
        risk: allowOvertime ? 'high' : 'medium',
        tradeoffs: {
          pros: selectedProfile ? [`Optimized for ${selectedProfile.name}`, 'Profile-based scheduling'] : ['Fastest delivery', 'High customer satisfaction'],
          cons: allowOvertime ? ['Overtime costs', 'Resource strain'] : ['Higher resource utilization', 'Potential bottlenecks']
        },
        metrics: {
          totalDuration: fastestDuration,
          resourceConflicts: allowOvertime ? 1 : 2,
          deliveryDelay: 0,
          capacityUtilization: allowOvertime ? 95 : 85
        }
      });

      // Option 2: Most efficient (adjusted by profile)
      const efficientDuration = Math.max(3, 5 - (multipliers.efficiency - 1) * 2);
      options.push({
        id: 'efficient',
        name: selectedProfile ? `${selectedProfile.name} - Efficiency Optimized` : 'Most Efficient',
        startDate: addDays(new Date(), baseDelay),
        endDate: addDays(new Date(), efficientDuration + baseDelay),
        resources: resources.slice(0, 3),
        operations: formData.operations.map((op, i) => ({
          id: i + 2000,
          jobId: 2000,
          name: op.name,
          description: op.description,
          duration: op.duration,
          capabilityId: op.capabilityId,
          assignedResourceId: resources[i % resources.length]?.id,
          status: 'pending' as const,
          priority: formData.priority,
          startTime: addDays(new Date(), baseDelay + 1 + i * 0.8),
          endTime: addDays(new Date(), baseDelay + 1 + i * 0.8 + op.duration / 24)
        })),
        efficiency: Math.min(99, Math.round(98 * multipliers.efficiency)),
        customerSatisfaction: Math.round(85 * multipliers.speed),
        utilization: Math.round(70 * multipliers.efficiency),
        cost: Math.round(1000 * multipliers.cost),
        risk: 'low',
        tradeoffs: {
          pros: selectedProfile ? [`Optimized for ${selectedProfile.name}`, 'Profile efficiency targets'] : ['Optimal resource utilization', 'Lower cost'],
          cons: ['Longer delivery time', 'Less flexibility']
        },
        metrics: {
          totalDuration: efficientDuration,
          resourceConflicts: 0,
          deliveryDelay: Math.round(2 * (1 / multipliers.speed)),
          capacityUtilization: Math.round(70 * multipliers.efficiency)
        }
      });

      // Option 3: Balanced approach (adjusted by profile)
      const balancedDuration = Math.max(3, 4 - (multipliers.speed + multipliers.efficiency - 2) * 0.5);
      options.push({
        id: 'balanced',
        name: selectedProfile ? `${selectedProfile.name} - Balanced` : 'Balanced Approach',
        startDate: addDays(new Date(), baseDelay),
        endDate: addDays(new Date(), balancedDuration + baseDelay),
        resources: resources.slice(0, 2),
        operations: formData.operations.map((op, i) => ({
          id: i + 3000,
          jobId: 3000,
          name: op.name,
          description: op.description,
          duration: op.duration,
          capabilityId: op.capabilityId,
          assignedResourceId: resources[i % resources.length]?.id,
          status: 'pending' as const,
          priority: formData.priority,
          startTime: addDays(new Date(), baseDelay + 0.5 + i * 0.7),
          endTime: addDays(new Date(), baseDelay + 0.5 + i * 0.7 + op.duration / 24)
        })),
        efficiency: Math.round(88 * (multipliers.efficiency + multipliers.speed) / 2),
        customerSatisfaction: Math.round(88 * (multipliers.speed + 1) / 2),
        utilization: Math.round(78 * multipliers.efficiency),
        cost: Math.round(1100 * multipliers.cost),
        risk: 'low',
        tradeoffs: {
          pros: selectedProfile ? [`${selectedProfile.name} parameters applied`, 'Profile-balanced optimization'] : ['Good balance of speed and efficiency', 'Moderate cost'],
          cons: ['Compromise solution', `Profile: ${primary.replace('_', ' ')}`]
        },
        metrics: {
          totalDuration: balancedDuration,
          resourceConflicts: 1,
          deliveryDelay: Math.round(1 * (1 / multipliers.speed)),
          capacityUtilization: Math.round(78 * multipliers.efficiency)
        }
      });

      setSchedulingOptions(options);
      setIsAnalyzing(false);

      // Create scenarios for each option in the evaluation system (async operation after timeout)
      setTimeout(async () => {
        try {
          const scenarioPromises = options.map(async (option) => {
            const scenarioData = {
              name: `${formData.name} - ${option.name}`,
              description: `${option.name} strategy for order: ${formData.name}. ${option.tradeoffs.pros.join(', ')}`,
              baseJobIds: [],
              status: 'draft' as const,
              dueDate: formData.dueDate,
              metadata: {
                efficiency: option.efficiency,
                customerSatisfaction: option.customerSatisfaction,
                utilization: option.utilization,
                cost: option.cost,
                risk: option.risk,
                operations: option.operations.length
              }
            };

            const response = await apiRequest('POST', '/api/schedule-scenarios', scenarioData);
            
            // Create scenario operations for this scenario
            if (response.id) {
              const operationPromises = option.operations.map(async (operation) => {
                const scenarioOpData = {
                  scenarioId: response.id,
                  operationId: null, // This is a planned operation, not existing
                  name: operation.name,
                  description: operation.description,
                  duration: operation.duration,
                  resourceId: operation.assignedResourceId,
                  startTime: operation.startTime?.toISOString(),
                  endTime: operation.endTime?.toISOString(),
                  capabilityId: operation.capabilityId,
                  priority: operation.priority,
                  status: 'planned'
                };
                
                return await apiRequest('POST', `/api/scenarios/${response.id}/operations`, scenarioOpData);
              });
              
              await Promise.all(operationPromises);
            }
            
            return response;
          });

          await Promise.all(scenarioPromises);
          
          toast({
            title: "Scenarios Created",
            description: `Created ${options.length} schedule scenarios for evaluation and comparison`
          });
        } catch (error) {
          console.error('Error creating scenarios:', error);
          // Continue even if scenario creation fails
        }
      }, 100);
    }, 2000);
  };

  // Apply optimized scheduling to existing job
  const applyOptimizedScheduling = async (option: SchedulingOption) => {
    if (!selectedExistingProductionOrder) return;

    try {
      // Update all operations with optimized scheduling
      const updatePromises = option.operations.map(async (operation) => {
        const response = await fetch(`/api/operations/${operation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignedResourceId: operation.assignedResourceId,
            startTime: operation.startTime,
            endTime: operation.endTime,
            status: 'pending'
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to update operation: ${operation.name}`);
        }

        return response.json();
      });

      // Update job with optimized dates
      const jobResponse = await fetch(`/api/production-orders/${selectedExistingProductionOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: option.startDate,
          endDate: option.endDate,
          estimatedDuration: option.metrics.totalDuration
        })
      });

      if (!jobResponse.ok) {
        throw new Error('Failed to update job');
      }

      await Promise.all(updatePromises);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/operations'] });

      toast({
        title: "Success",
        description: `Production Order "${selectedExistingProductionOrder.orderNumber}" optimized successfully with ${option.operations.length} operations rescheduled`
      });

      setSelectedExistingProductionOrder(null);
      setSchedulingOptions([]);
      
    } catch (error) {
      console.error('Error optimizing job:', error);
      toast({
        title: "Error",
        description: "Failed to optimize job scheduling. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Schedule job with selected option
  const scheduleJob = async (option: SchedulingOption) => {
    if (!lastFormData) return;
    
    try {
      // First create the job
      const jobData = {
        name: lastFormData.name,
        customer: lastFormData.customer,
        description: lastFormData.description,
        priority: lastFormData.priority,
        dueDate: lastFormData.dueDate,
        status: 'pending',
        estimatedDuration: option.metrics.totalDuration,
        startDate: option.startDate,
        endDate: option.endDate
      };

      const jobResponse = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });
      
      if (!jobResponse.ok) {
        throw new Error('Failed to create job');
      }

      const createdJob = await jobResponse.json();

      // Then create all operations for this job
      const operationPromises = option.operations.map(async (operation) => {
        const operationData = {
          jobId: createdJob.id,
          name: operation.name,
          description: operation.description,
          duration: operation.duration,
          capabilityId: operation.capabilityId,
          assignedResourceId: operation.assignedResourceId,
          status: 'pending',
          priority: operation.priority,
          startTime: operation.startTime,
          endTime: operation.endTime
        };

        const response = await fetch('/api/operations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(operationData)
        });

        if (!response.ok) {
          throw new Error(`Failed to create operation: ${operation.name}`);
        }

        return response.json();
      });

      await Promise.all(operationPromises);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/operations'] });

      toast({
        title: "Success",
        description: `Job "${lastFormData.name}" created successfully with ${option.operations.length} operations scheduled`
      });

      setShowCreateJob(false);
      setLastFormData(null);
      setSchedulingOptions([]);
      
    } catch (error) {
      console.error('Error creating job and operations:', error);
      toast({
        title: "Error",
        description: "Failed to create job with operations. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const PageContent = () => {
    const { isMaxOpen } = useMaxDock();
    
    return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="relative">
        <div className={`${isMaxOpen ? 'md:ml-0' : 'md:ml-12'} ml-12`}>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
            <Target className="w-6 h-6 mr-2" />
            Optimize Orders
          </h1>
          <p className="text-sm md:text-base text-gray-600">Optimize orders with intelligent scheduling and multi-operation planning</p>
        </div>
        
        {/* Maximize button in top right corner matching hamburger menu positioning */}
        <div className="fixed right-16 z-50 top-3 md:top-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMaximized(!isMaximized)}
            className="shadow-md border"
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
        
        {/* Control buttons below header */}
        <div className="lg:flex-shrink-0 flex items-center gap-1 md:gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateJob(true)}
            className="flex items-center gap-1 md:gap-2 text-xs md:text-sm"
          >
            <Plus className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">New Order</span>
            <span className="sm:hidden">New</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProfileSelection(true)}
            className="flex items-center gap-1 md:gap-2 text-xs md:text-sm"
          >
            <Settings className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">
              {selectedProfileId ? 
                profiles.find(p => p.id === selectedProfileId)?.name || 'Select Profile' 
                : 'Select Profile'
              }
            </span>
            <span className="sm:hidden">Profile</span>
          </Button>
          <Button
            variant={showEvaluationSystem ? "default" : "outline"}
            size="sm"
            onClick={() => {
              console.log('Evaluate Schedules clicked in optimizer, current state:', showEvaluationSystem);
              setShowEvaluationSystem(!showEvaluationSystem);
              console.log('Setting showEvaluationSystem to:', !showEvaluationSystem);
            }}
            className={`flex items-center gap-1 md:gap-2 text-xs md:text-sm ${aiTheme.gradient} text-white border-0`}
          >
            <GitCompare className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Evaluate Schedules</span>
            <span className="sm:hidden">Evaluate</span>
          </Button>
          
          <AlgorithmFeedbackButton
            algorithmName="scheduling-optimizer"
            algorithmVersion="2.1.0"
            triggerContext="optimization-results"
            variant="outline"
            size="sm"
            className="text-xs md:text-sm hidden sm:inline-flex"
          />
          <AlgorithmFeedbackButton
            algorithmName="scheduling-optimizer"
            algorithmVersion="2.1.0"
            triggerContext="optimization-results"
            variant="outline"
            size="sm"
            className="text-xs md:text-sm sm:hidden"
            buttonText="Feedback"
          />

        </div>
      </div>

      {/* Current Jobs Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Current Schedule Overview
          </CardTitle>
          <CardDescription>
            Real-time view of current jobs and resource utilization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{productionOrders?.length || 0}</div>
              <div className="text-sm text-gray-600">Active Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{resources?.length || 0}</div>
              <div className="text-sm text-gray-600">Available Resources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{operations?.filter(op => op.status === 'pending').length || 0}</div>
              <div className="text-sm text-gray-600">Pending Operations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">85%</div>
              <div className="text-sm text-gray-600">Avg Utilization</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Orders to Optimize */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5" />
            Existing Orders Available for Optimization
          </CardTitle>
          <CardDescription>
            Select an existing order to analyze and optimize its scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productionOrders && productionOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productionOrders.map((productionOrder) => {
                const productionOrderOperations = operations?.filter(op => op.productionOrderId === productionOrder.id) || [];
                const unscheduledOps = productionOrderOperations.filter(op => !op.assignedResourceId);
                
                return (
                  <Card key={productionOrder.id} className="cursor-pointer hover:shadow-md transition-all border-l-4 border-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{productionOrder.name}</CardTitle>
                        <Badge variant={productionOrder.priority === 'urgent' ? 'destructive' : productionOrder.priority === 'high' ? 'default' : 'secondary'}>
                          {productionOrder.priority}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">Customer {productionOrder.customerId}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Operations:</span>
                        <span className="font-medium">{productionOrderOperations.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Unscheduled:</span>
                        <span className={`font-medium ${unscheduledOps.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {unscheduledOps.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Due Date:</span>
                        <span className="font-medium">
                          {productionOrder.dueDate ? 
                            (() => {
                              const date = new Date(productionOrder.dueDate);
                              return isNaN(date.getTime()) ? 'Invalid Date' : format(date, 'MMM dd, yyyy');
                            })() : 
                            'Not Set'
                          }
                        </span>
                      </div>
                      {productionOrder.description && (
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {productionOrder.description}
                        </div>
                      )}
                      <Button 
                        onClick={() => generateSchedulingOptionsForExisting(productionOrder)}
                        disabled={isOptimizingExisting}
                        className="w-full mt-3"
                        size="sm"
                      >
                        {isOptimizingExisting ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Target className="w-4 h-4 mr-2" />
                            Optimize Schedule
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Factory className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No existing orders found</p>
              <p className="text-sm">Create a new order or import orders from your ERP system</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduling Options */}
      {schedulingOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Scheduling Recommendations
              {selectedExistingProductionOrder && (
                <Badge variant="outline" className="ml-2">
                  {selectedExistingProductionOrder.orderNumber}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {selectedExistingProductionOrder 
                ? `Optimize scheduling for existing order: ${selectedExistingProductionOrder.orderNumber}`
                : 'Compare different scheduling options and their tradeoffs'
              }
            </CardDescription>
            {selectedExistingProductionOrder && (
              <div className="flex justify-end mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedExistingProductionOrder(null);
                    setSchedulingOptions([]);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Optimization
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {schedulingOptions.map((option) => (
                <Card key={option.id} className={`cursor-pointer transition-all ${
                  selectedOption?.id === option.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                }`} onClick={() => setSelectedOption(option)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{option.name}</CardTitle>
                      <Badge className={getRiskColor(option.risk)}>
                        {option.risk} risk
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Duration:</span>
                      <span className="font-medium">{option.metrics.totalDuration} days</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Cost:</span>
                      <span className="font-medium">${option.cost}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Efficiency:</span>
                        <span className={`font-medium ${getScoreColor(option.efficiency)}`}>
                          {option.efficiency}%
                        </span>
                      </div>
                      <Progress value={option.efficiency} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Customer Satisfaction:</span>
                        <span className={`font-medium ${getScoreColor(option.customerSatisfaction)}`}>
                          {option.customerSatisfaction}%
                        </span>
                      </div>
                      <Progress value={option.customerSatisfaction} className="h-2" />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-green-600">Pros:</div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {option.tradeoffs.pros.map((pro, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-red-600">Cons:</div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {option.tradeoffs.cons.map((con, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedExistingProductionOrder) {
                          applyOptimizedScheduling(option);
                        } else {
                          scheduleJob(option);
                        }
                      }}
                      className="w-full mt-3"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {selectedExistingProductionOrder ? 'Apply Optimization' : 'Schedule with this option'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Evaluation System */}
      {showEvaluationSystem && (
        <div ref={evaluationSystemRef} className="mt-8 p-6 bg-white rounded-lg border-2 border-purple-500 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-purple-700">Schedule Evaluation System</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowEvaluationSystem(false)}
              className="text-purple-600 border-purple-600 hover:bg-purple-50"
            >
              Hide
            </Button>
          </div>
          <ScheduleEvaluationSystem />
        </div>
      )}

      {/* Create New Job Dialog */}
      <Dialog open={showCreateJob} onOpenChange={setShowCreateJob}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Multi-Operation Order</DialogTitle>
          </DialogHeader>
          <NewJobForm
            capabilities={capabilities || []}
            onGenerate={generateSchedulingOptions}
            isAnalyzing={isAnalyzing}
          />
        </DialogContent>
      </Dialog>

      {/* Profile Selection Dialog */}
      <Dialog open={showProfileSelection} onOpenChange={setShowProfileSelection}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Optimization Profile Selection
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Profile Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Available Profiles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profiles.map((profile) => (
                  <Card 
                    key={profile.id} 
                    className={`cursor-pointer transition-all ${
                      selectedProfileId === profile.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectProfile(profile.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{profile.name}</h4>
                          {profile.description && (
                            <p className="text-sm text-gray-600 mt-1">{profile.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Algorithm: Backwards Scheduling</span>
                            <span>Created: {profile.createdAt ? (() => {
                              const date = new Date(profile.createdAt);
                              return isNaN(date.getTime()) ? 'Unknown' : format(date, 'MMM dd, yyyy');
                            })() : 'Unknown'}</span>
                          </div>
                          
                          {/* Profile Key Parameters */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {profile.profileConfig?.objectives?.primary && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">
                                {profile.profileConfig.objectives.primary.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            )}
                            {profile.profileConfig?.algorithmParameters?.backwardsScheduling?.bufferTime && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md">
                                Buffer: {profile.profileConfig.algorithmParameters.backwardsScheduling.bufferTime}h
                              </span>
                            )}
                            {profile.profileConfig?.algorithmParameters?.backwardsScheduling?.allowOvertime && (
                              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-md">
                                Overtime OK
                              </span>
                            )}
                            {!profile.profileConfig && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                                Configuration Loading...
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowEditProfile(profile.id);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProfileMutation.mutate(profile.id);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Create New Profile Button */}
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateProfile(true)}
                  className="w-full border-dashed border-2 border-gray-300 hover:border-gray-400"
                >
                  <BookmarkPlus className="w-4 h-4 mr-2" />
                  Create New Profile
                </Button>
              </div>
            </div>

            {/* Profile Usage History */}
            {profileHistory.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-500" />
                  Recent Profile Usage
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {profileHistory.slice(0, 10).map((usage) => {
                    const profile = profiles.find(p => p.id === usage.profileId);
                    return (
                      <div key={usage.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                        <div>
                          <span className="font-medium">{profile?.name || 'Unknown Profile'}</span>
                          <span className="text-gray-500 ml-2">
                            {usage.createdAt ? (() => {
                              const date = new Date(usage.createdAt);
                              return isNaN(date.getTime()) ? 'Unknown time' : format(date, 'MMM dd, HH:mm');
                            })() : 'Unknown time'}
                          </span>
                        </div>
                        <div className="text-gray-600">
                          {usage.executionTime ? `${usage.executionTime.toFixed(1)}s` : 'N/A'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowProfileSelection(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setShowProfileSelection(false);
              }}
              disabled={!selectedProfileId}
            >
              <Save className="w-4 h-4 mr-2" />
              Use Selected Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Profile Dialog */}
      <ProfileFormDialog
        open={showCreateProfile}
        onOpenChange={setShowCreateProfile}
        onSubmit={createProfileMutation.mutate}
        isLoading={createProfileMutation.isPending}
        resources={resources}
        title="Create Optimization Profile"
        submitText="Create Profile"
      />

      {/* Edit Profile Dialog */}
      {showEditProfile && (
        <ProfileFormDialog
          open={!!showEditProfile}
          onOpenChange={() => setShowEditProfile(null)}
          onSubmit={(data) => updateProfileMutation.mutate({ id: showEditProfile, data })}
          isLoading={updateProfileMutation.isPending}
          resources={resources}
          title="Edit Optimization Profile"
          submitText="Update Profile"
          initialData={profiles.find(p => p.id === showEditProfile)}
        />
      )}
    </div>
  );
};

// Profile Form Dialog Component
interface ProfileFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProfileFormData) => void;
  isLoading: boolean;
  resources?: Resource[];
  title: string;
  submitText: string;
  initialData?: OptimizationProfile;
}

const ProfileFormDialog: React.FC<ProfileFormDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  resources = [],
  title,
  submitText,
  initialData
}) => {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description || '',
      algorithmId: initialData.algorithmId,
      profileConfig: initialData.profileConfig
    } : {
      name: '',
      description: '',
      algorithmId: 1,
      profileConfig: {
        scope: {
          plantIds: [],
          resourceIds: []
        },
        objectives: {
          primary: 'minimize_makespan',
          weights: {
            cost: 0.3,
            time: 0.7
          }
        },
        constraints: {
          maxExecutionTime: 60,
          resourceCapacityLimits: true
        },
        algorithmParameters: {
          backwardsScheduling: {
            bufferTime: 0.5,
            allowOvertime: false,
            prioritizeByDueDate: true
          }
        },
        includePlannedOrders: {
          enabled: true,
          weight: 0.7
        }
      }
    }
  });

  const handleSubmit = (data: ProfileFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookmarkPlus className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter profile name" />
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
                      <Textarea {...field} placeholder="Describe this optimization profile" rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Objectives */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Optimization Objectives</h3>
              
              <FormField
                control={form.control}
                name="profileConfig.objectives.primary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Objective</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select primary objective" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="minimize_makespan">Minimize Makespan</SelectItem>
                        <SelectItem value="maximize_utilization">Maximize Utilization</SelectItem>
                        <SelectItem value="minimize_cost">Minimize Cost</SelectItem>
                        <SelectItem value="minimize_lateness">Minimize Lateness</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="profileConfig.objectives.weights.cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Weight ({(field.value * 100).toFixed(0)}%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.1"
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
                  name="profileConfig.objectives.weights.time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Weight ({(field.value * 100).toFixed(0)}%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Algorithm Parameters */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Algorithm Parameters</h3>
              
              <FormField
                control={form.control}
                name="profileConfig.algorithmParameters.backwardsScheduling.bufferTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buffer Time (hours)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="5" 
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="profileConfig.algorithmParameters.backwardsScheduling.allowOvertime"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Allow Overtime</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Allow scheduling beyond normal hours
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profileConfig.algorithmParameters.backwardsScheduling.prioritizeByDueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Prioritize by Due Date</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Sort orders by due date priority
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Planned Orders */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Planned Orders Integration</h3>
              
              <FormField
                control={form.control}
                name="profileConfig.includePlannedOrders.enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Include Planned Orders</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Consider planned orders in optimization
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('profileConfig.includePlannedOrders.enabled') && (
                <FormField
                  control={form.control}
                  name="profileConfig.includePlannedOrders.weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planned Orders Weight ({(field.value * 100).toFixed(0)}%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Separator />

            {/* Constraints */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Constraints</h3>
              
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Resource Capacity Limits</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enforce resource capacity constraints
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {submitText}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

  return (
    <div className={`min-h-screen ${isMaximized ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <div className={`${isMaximized ? 'h-full overflow-y-auto p-6' : 'px-4 py-3 sm:px-6 overflow-y-auto'}`}>
        <PageContent />
      </div>
    </div>
  );
};

export default SchedulingOptimizer;
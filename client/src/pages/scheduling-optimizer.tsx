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
  X
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
import { useToast } from '@/hooks/use-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays, differenceInDays } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import type { Job, Operation, Resource, Capability } from '@shared/schema';

interface SchedulingOption {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  resources: Resource[];
  operations: Operation[];
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

const SchedulingOptimizer: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SchedulingOption | null>(null);

  const [showCreateJob, setShowCreateJob] = useState(false);
  const [schedulingOptions, setSchedulingOptions] = useState<SchedulingOption[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastFormData, setLastFormData] = useState<NewJobFormData | null>(null);
  const [selectedExistingJob, setSelectedExistingJob] = useState<Job | null>(null);
  const [isOptimizingExisting, setIsOptimizingExisting] = useState(false);

  // Fetch data with disabled refetch to prevent form re-renders
  const { data: jobs } = useQuery<Job[]>({ 
    queryKey: ['/api/jobs'],
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
  const { data: operations } = useQuery<Operation[]>({ 
    queryKey: ['/api/operations'],
    refetchOnWindowFocus: false,
    refetchInterval: false
  });





  // Generate scheduling options for existing job
  const generateSchedulingOptionsForExisting = (job: Job) => {
    if (!resources || !capabilities || !operations) return;

    const jobOperations = operations.filter(op => op.jobId === job.id);
    if (jobOperations.length === 0) return;

    setSelectedExistingJob(job);
    setIsOptimizingExisting(true);

    // Simulate analysis delay
    setTimeout(() => {
      const options: SchedulingOption[] = [];
      
      // Option 1: Fastest completion
      options.push({
        id: 'fastest',
        name: 'Fastest Completion',
        startDate: new Date(),
        endDate: addDays(new Date(), 3),
        resources: resources.slice(0, 2),
        operations: jobOperations.map((op, i) => ({
          ...op,
          assignedResourceId: resources[i % resources.length]?.id,
          startTime: addDays(new Date(), i * 0.5),
          endTime: addDays(new Date(), i * 0.5 + op.duration / 24)
        })),
        efficiency: 95,
        customerSatisfaction: 90,
        utilization: 85,
        cost: 1200,
        risk: 'medium',
        tradeoffs: {
          pros: ['Fastest delivery', 'High customer satisfaction', 'Meets urgent deadlines'],
          cons: ['Higher resource utilization', 'Potential bottlenecks', 'Higher cost']
        },
        metrics: {
          totalDuration: 3,
          resourceConflicts: 2,
          deliveryDelay: 0,
          capacityUtilization: 85
        }
      });

      // Option 2: Most efficient
      options.push({
        id: 'efficient',
        name: 'Most Efficient',
        startDate: addDays(new Date(), 1),
        endDate: addDays(new Date(), 5),
        resources: resources.slice(0, 3),
        operations: jobOperations.map((op, i) => ({
          ...op,
          assignedResourceId: resources[i % resources.length]?.id,
          startTime: addDays(new Date(), 1 + i * 0.8),
          endTime: addDays(new Date(), 1 + i * 0.8 + op.duration / 24)
        })),
        efficiency: 98,
        customerSatisfaction: 85,
        utilization: 70,
        cost: 1000,
        risk: 'low',
        tradeoffs: {
          pros: ['Optimal resource utilization', 'Lower cost', 'Reduced risk'],
          cons: ['Longer delivery time', 'Less flexibility', 'Potential customer wait']
        },
        metrics: {
          totalDuration: 5,
          resourceConflicts: 0,
          deliveryDelay: 2,
          capacityUtilization: 70
        }
      });

      // Option 3: Balanced approach
      options.push({
        id: 'balanced',
        name: 'Balanced Approach',
        startDate: addDays(new Date(), 0.5),
        endDate: addDays(new Date(), 4),
        resources: resources.slice(0, 2),
        operations: jobOperations.map((op, i) => ({
          ...op,
          assignedResourceId: resources[i % resources.length]?.id,
          startTime: addDays(new Date(), 0.5 + i * 0.7),
          endTime: addDays(new Date(), 0.5 + i * 0.7 + op.duration / 24)
        })),
        efficiency: 88,
        customerSatisfaction: 88,
        utilization: 78,
        cost: 1100,
        risk: 'low',
        tradeoffs: {
          pros: ['Good balance of speed and efficiency', 'Moderate cost', 'Flexible scheduling'],
          cons: ['Not the fastest option', 'Not the most efficient', 'Compromise solution']
        },
        metrics: {
          totalDuration: 4,
          resourceConflicts: 1,
          deliveryDelay: 1,
          capacityUtilization: 78
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

    // Simulate analysis delay
    setTimeout(() => {
      const options: SchedulingOption[] = [];
      
      // Option 1: Fastest completion
      options.push({
        id: 'fastest',
        name: 'Fastest Completion',
        startDate: new Date(),
        endDate: addDays(new Date(), 3),
        resources: resources.slice(0, 2),
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
          startTime: addDays(new Date(), i * 0.5),
          endTime: addDays(new Date(), i * 0.5 + op.duration / 24)
        })),
        efficiency: 95,
        customerSatisfaction: 90,
        utilization: 85,
        cost: 1200,
        risk: 'medium',
        tradeoffs: {
          pros: ['Fastest delivery', 'High customer satisfaction', 'Meets urgent deadlines'],
          cons: ['Higher resource utilization', 'Potential bottlenecks', 'Higher cost']
        },
        metrics: {
          totalDuration: 3,
          resourceConflicts: 2,
          deliveryDelay: 0,
          capacityUtilization: 85
        }
      });

      // Option 2: Most efficient
      options.push({
        id: 'efficient',
        name: 'Most Efficient',
        startDate: addDays(new Date(), 1),
        endDate: addDays(new Date(), 5),
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
          startTime: addDays(new Date(), 1 + i * 0.8),
          endTime: addDays(new Date(), 1 + i * 0.8 + op.duration / 24)
        })),
        efficiency: 98,
        customerSatisfaction: 85,
        utilization: 70,
        cost: 1000,
        risk: 'low',
        tradeoffs: {
          pros: ['Optimal resource utilization', 'Lower cost', 'Reduced risk'],
          cons: ['Longer delivery time', 'Less flexibility', 'Potential customer wait']
        },
        metrics: {
          totalDuration: 5,
          resourceConflicts: 0,
          deliveryDelay: 2,
          capacityUtilization: 70
        }
      });

      // Option 3: Balanced approach
      options.push({
        id: 'balanced',
        name: 'Balanced Approach',
        startDate: addDays(new Date(), 0.5),
        endDate: addDays(new Date(), 4),
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
          startTime: addDays(new Date(), 0.5 + i * 0.7),
          endTime: addDays(new Date(), 0.5 + i * 0.7 + op.duration / 24)
        })),
        efficiency: 88,
        customerSatisfaction: 88,
        utilization: 78,
        cost: 1100,
        risk: 'low',
        tradeoffs: {
          pros: ['Good balance of speed and efficiency', 'Moderate cost', 'Flexible scheduling'],
          cons: ['Not the fastest option', 'Not the most efficient', 'Compromise solution']
        },
        metrics: {
          totalDuration: 4,
          resourceConflicts: 1,
          deliveryDelay: 1,
          capacityUtilization: 78
        }
      });

      setSchedulingOptions(options);
      setIsAnalyzing(false);
    }, 2000);
  };

  // Apply optimized scheduling to existing job
  const applyOptimizedScheduling = async (option: SchedulingOption) => {
    if (!selectedExistingJob) return;

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
      const jobResponse = await fetch(`/api/jobs/${selectedExistingJob.id}`, {
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
        description: `Job "${selectedExistingJob.name}" optimized successfully with ${option.operations.length} operations rescheduled`
      });

      setSelectedExistingJob(null);
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

  const PageContent = () => (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Optimize Orders</h1>
          <p className="text-gray-600">Optimize orders with intelligent scheduling and multi-operation planning</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateJob(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Order
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMaximized(!isMaximized)}
            className="flex items-center gap-2"
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
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
              <div className="text-2xl font-bold text-blue-600">{jobs?.length || 0}</div>
              <div className="text-sm text-gray-600">Active Jobs</div>
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
          {jobs && jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => {
                const jobOperations = operations?.filter(op => op.jobId === job.id) || [];
                const unscheduledOps = jobOperations.filter(op => !op.assignedResourceId);
                
                return (
                  <Card key={job.id} className="cursor-pointer hover:shadow-md transition-all border-l-4 border-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{job.name}</CardTitle>
                        <Badge variant={job.priority === 'urgent' ? 'destructive' : job.priority === 'high' ? 'default' : 'secondary'}>
                          {job.priority}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">{job.customer}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Operations:</span>
                        <span className="font-medium">{jobOperations.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Unscheduled:</span>
                        <span className={`font-medium ${unscheduledOps.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {unscheduledOps.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Due Date:</span>
                        <span className="font-medium">{format(new Date(job.dueDate), 'MMM dd, yyyy')}</span>
                      </div>
                      {job.description && (
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {job.description}
                        </div>
                      )}
                      <Button 
                        onClick={() => generateSchedulingOptionsForExisting(job)}
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
              {selectedExistingJob && (
                <Badge variant="outline" className="ml-2">
                  {selectedExistingJob.name}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {selectedExistingJob 
                ? `Optimize scheduling for existing order: ${selectedExistingJob.name}`
                : 'Compare different scheduling options and their tradeoffs'
              }
            </CardDescription>
            {selectedExistingJob && (
              <div className="flex justify-end mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedExistingJob(null);
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
                        if (selectedExistingJob) {
                          applyOptimizedScheduling(option);
                        } else {
                          scheduleJob(option);
                        }
                      }}
                      className="w-full mt-3"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {selectedExistingJob ? 'Apply Optimization' : 'Schedule with this option'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
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
    </div>
  );

  return (
    <div className={`min-h-screen ${isMaximized ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <div className={`${isMaximized ? 'h-full overflow-y-auto p-6' : 'px-4 py-3 sm:px-6 overflow-y-auto'}`}>
        <PageContent />
      </div>
    </div>
  );
};

export default SchedulingOptimizer;
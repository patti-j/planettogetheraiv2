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
  Minimize2
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
import { useToast } from '@/hooks/use-toast';
import { format, addDays, differenceInDays } from 'date-fns';
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

interface NewJobData {
  name: string;
  customer: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  operations: {
    name: string;
    description: string;
    duration: number;
    capabilityId: number;
  }[];
}

// Form component with focus preservation
const NewJobForm: React.FC<{
  newJobData: NewJobData;
  setNewJobData: (data: NewJobData) => void;
  capabilities: Capability[];
  onGenerate: () => void;
  isAnalyzing: boolean;
}> = ({ 
  newJobData, 
  setNewJobData,
  capabilities, 
  onGenerate,
  isAnalyzing 
}) => {
  const focusedElementRef = useRef<string | null>(null);
  
  const handleJobFieldChange = useCallback((field: string, value: any) => {
    // Track which field is currently focused
    focusedElementRef.current = field;
    setNewJobData({ ...newJobData, [field]: value });
  }, [newJobData, setNewJobData]);

  // Restore focus after re-render
  useEffect(() => {
    if (focusedElementRef.current) {
      const elementId = focusedElementRef.current === 'name' ? 'job-name' : focusedElementRef.current;
      const element = document.getElementById(elementId);
      if (element) {
        // Use setTimeout to ensure DOM has updated
        setTimeout(() => {
          element.focus();
          // For text inputs, restore cursor position to end
          if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.setSelectionRange(element.value.length, element.value.length);
          }
        }, 0);
      }
      focusedElementRef.current = null;
    }
  });

  const handleOperationChange = (index: number, field: string, value: any) => {
    const updatedOperations = [...newJobData.operations];
    updatedOperations[index] = { ...updatedOperations[index], [field]: value };
    setNewJobData({ ...newJobData, operations: updatedOperations });
  };

  const addOperation = () => {
    const newOperation = {
      name: '',
      description: '',
      duration: 1,
      capabilityId: capabilities[0]?.id || 1
    };
    setNewJobData({
      ...newJobData,
      operations: [...newJobData.operations, newOperation]
    });
  };

  const removeOperation = (index: number) => {
    const updatedOperations = newJobData.operations.filter((_, i) => i !== index);
    setNewJobData({ ...newJobData, operations: updatedOperations });
  };

  return (
    <div className="space-y-6">
      {/* Job Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="job-name">Job Name</Label>
          <Input
            id="job-name"
            value={newJobData.name}
            onChange={(e) => handleJobFieldChange('name', e.target.value)}
            placeholder="Enter job name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer">Customer</Label>
          <Input
            id="customer"
            value={newJobData.customer}
            onChange={(e) => handleJobFieldChange('customer', e.target.value)}
            placeholder="Enter customer name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={newJobData.description}
          onChange={(e) => handleJobFieldChange('description', e.target.value)}
          placeholder="Enter job description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={newJobData.priority}
            onValueChange={(value: any) => handleJobFieldChange('priority', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="due-date">Due Date</Label>
          <Input
            id="due-date"
            type="date"
            value={newJobData.dueDate}
            onChange={(e) => handleJobFieldChange('dueDate', e.target.value)}
          />
        </div>
      </div>

      <Separator />

      {/* Operations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Operations</h3>
          <Button onClick={addOperation} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Operation
          </Button>
        </div>

        {newJobData.operations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Factory className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No operations added yet</p>
            <p className="text-sm">Click "Add Operation" to create your first operation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {newJobData.operations.map((operation, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Operation Name</Label>
                      <Input
                        value={operation.name}
                        onChange={(e) => handleOperationChange(index, 'name', e.target.value)}
                        placeholder="Enter operation name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (hours)</Label>
                      <Input
                        type="number"
                        value={operation.duration}
                        onChange={(e) => handleOperationChange(index, 'duration', parseInt(e.target.value) || 1)}
                        min={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Required Capability</Label>
                      <Select
                        value={operation.capabilityId.toString()}
                        onValueChange={(value) => handleOperationChange(index, 'capabilityId', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {capabilities?.map((cap) => (
                            <SelectItem key={cap.id} value={cap.id.toString()}>
                              {cap.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeOperation(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={operation.description}
                      onChange={(e) => handleOperationChange(index, 'description', e.target.value)}
                      placeholder="Enter operation description"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Analysis Button */}
      {newJobData.operations.length > 0 && (
        <div className="flex justify-center">
          <Button
            onClick={onGenerate}
            disabled={isAnalyzing || !newJobData.name || !newJobData.customer}
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
    </div>
  );
};

const SchedulingOptimizer: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SchedulingOption | null>(null);
  const [newJobData, setNewJobData] = useState<NewJobData>({
    name: '',
    customer: '',
    description: '',
    priority: 'medium',
    dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    operations: []
  });
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [schedulingOptions, setSchedulingOptions] = useState<SchedulingOption[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: "Success",
        description: "Job created successfully with optimized schedule"
      });
    }
  });



  // Generate scheduling options
  const generateSchedulingOptions = () => {
    if (!resources || !capabilities || newJobData.operations.length === 0) return;

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
        operations: newJobData.operations.map((op, i) => ({
          id: i + 1000,
          jobId: 1000,
          name: op.name,
          description: op.description,
          duration: op.duration,
          capabilityId: op.capabilityId,
          assignedResourceId: resources[i % resources.length]?.id,
          status: 'pending' as const,
          priority: newJobData.priority,
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
        operations: newJobData.operations.map((op, i) => ({
          id: i + 2000,
          jobId: 2000,
          name: op.name,
          description: op.description,
          duration: op.duration,
          capabilityId: op.capabilityId,
          assignedResourceId: resources[i % resources.length]?.id,
          status: 'pending' as const,
          priority: newJobData.priority,
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
        operations: newJobData.operations.map((op, i) => ({
          id: i + 3000,
          jobId: 3000,
          name: op.name,
          description: op.description,
          duration: op.duration,
          capabilityId: op.capabilityId,
          assignedResourceId: resources[i % resources.length]?.id,
          status: 'pending' as const,
          priority: newJobData.priority,
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

  // Schedule job with selected option
  const scheduleJob = async (option: SchedulingOption) => {
    const jobData = {
      name: newJobData.name,
      customer: newJobData.customer,
      description: newJobData.description,
      priority: newJobData.priority,
      dueDate: newJobData.dueDate,
      status: 'pending',
      estimatedDuration: option.metrics.totalDuration,
      startDate: option.startDate,
      endDate: option.endDate
    };

    createJobMutation.mutate(jobData);
    setShowCreateJob(false);
    setNewJobData({
      name: '',
      customer: '',
      description: '',
      priority: 'medium',
      dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      operations: []
    });
    setSchedulingOptions([]);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Scheduling Optimizer</h1>
          <p className="text-gray-600">Optimize scheduling for multi-operation orders with intelligent recommendations</p>
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

      {/* Scheduling Options */}
      {schedulingOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Scheduling Recommendations
            </CardTitle>
            <CardDescription>
              Compare different scheduling options and their tradeoffs
            </CardDescription>
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
                        scheduleJob(option);
                      }}
                      className="w-full mt-3"
                      disabled={createJobMutation.isPending}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Schedule with this option
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
            newJobData={newJobData}
            setNewJobData={setNewJobData}
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
      <div className={`${isMaximized ? 'h-full overflow-y-auto' : ''}`}>
        <div className={`${isMaximized ? 'p-6' : 'px-4 py-3 sm:px-6'}`}>
          <PageContent />
        </div>
      </div>
    </div>
  );
};

export default SchedulingOptimizer;
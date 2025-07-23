import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  Edit, 
  Settings, 
  Zap, 
  Clock, 
  Activity, 
  Bell, 
  Mail, 
  Webhook,
  GitBranch,
  CheckCircle,
  XCircle,
  RotateCcw,
  BarChart3,
  Workflow,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface WorkflowStudioProps {
  onClose?: () => void;
}

interface Workflow {
  id: number;
  name: string;
  description?: string;
  category: string;
  createdBy: number;
  isActive: boolean;
  executionCount: number;
  lastExecuted?: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowTrigger {
  id: number;
  workflowId: number;
  triggerType: 'event' | 'schedule' | 'manual' | 'webhook' | 'condition';
  eventType?: string;
  scheduleExpression?: string;
  configuration: Record<string, any>;
  isActive: boolean;
}

interface WorkflowAction {
  id: number;
  name: string;
  actionType: 'notification' | 'api_call' | 'email' | 'schedule_update' | 'resource_assignment' | 'custom';
  configuration: Record<string, any>;
}

interface WorkflowExecution {
  id: number;
  workflowId: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  context: Record<string, any>;
  startTime: string;
  endTime?: string;
  errorMessage?: string;
}

export function WorkflowStudio({ onClose }: WorkflowStudioProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [activeTab, setActiveTab] = useState<string>('workflows');
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  const [showCreateTrigger, setShowCreateTrigger] = useState(false);
  const [showCreateAction, setShowCreateAction] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    category: 'automation'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['/api/workflows'],
    enabled: true
  });

  const { data: triggers } = useQuery({
    queryKey: ['/api/workflow-triggers'],
    enabled: !!selectedWorkflow
  });

  const { data: actions } = useQuery({
    queryKey: ['/api/workflow-actions'],
    enabled: true
  });

  const { data: executions } = useQuery({
    queryKey: ['/api/workflow-executions'],
    enabled: !!selectedWorkflow
  });

  // Mutations
  const createWorkflowMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/workflows', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      setShowCreateWorkflow(false);
      setNewWorkflow({ name: '', description: '', category: 'automation' });
      toast({ title: 'Workflow created successfully' });
    }
  });

  const executeWorkflowMutation = useMutation({
    mutationFn: async ({ id, context }: { id: number; context?: any }) => {
      const response = await apiRequest('POST', `/api/workflows/${id}/execute`, { context: context || {} });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflow-executions'] });
      toast({ title: 'Workflow execution started' });
    }
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/workflows/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      toast({ title: 'Workflow updated successfully' });
    }
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/workflows/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      setSelectedWorkflow(null);
      toast({ title: 'Workflow deleted successfully' });
    }
  });

  const handleCreateWorkflow = () => {
    if (!newWorkflow.name.trim()) {
      toast({ title: 'Please enter a workflow name', variant: 'destructive' });
      return;
    }

    createWorkflowMutation.mutate({
      ...newWorkflow,
      createdBy: 1 // This should come from auth context
    });
  };

  const handleExecuteWorkflow = (workflow: Workflow) => {
    executeWorkflowMutation.mutate({ id: workflow.id });
  };

  const handleToggleWorkflow = (workflow: Workflow) => {
    updateWorkflowMutation.mutate({
      id: workflow.id,
      data: { isActive: !workflow.isActive }
    });
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'event': return <Zap className="w-4 h-4" />;
      case 'schedule': return <Clock className="w-4 h-4" />;
      case 'manual': return <Play className="w-4 h-4" />;
      case 'webhook': return <Webhook className="w-4 h-4" />;
      case 'condition': return <GitBranch className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'notification': return <Bell className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'api_call': return <Webhook className="w-4 h-4" />;
      case 'schedule_update': return <Clock className="w-4 h-4" />;
      case 'resource_assignment': return <Target className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center space-x-3">
          <Workflow className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Workflow Studio</h1>
            <p className="text-sm text-gray-600">Create and manage automation workflows</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowCreateWorkflow(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Workflow
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r bg-gray-50 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Workflows</h3>
            <div className="space-y-2">
              {workflowsLoading ? (
                <div className="text-sm text-gray-500">Loading workflows...</div>
              ) : !workflows || workflows.length === 0 ? (
                <div className="text-sm text-gray-500">No workflows found</div>
              ) : (
                workflows.map((workflow: Workflow) => (
                  <div
                    key={workflow.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedWorkflow?.id === workflow.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedWorkflow(workflow)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{workflow.name}</h4>
                      <div className="flex items-center space-x-1">
                        <Badge
                          variant={workflow.isActive ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {workflow.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    {workflow.description && (
                      <p className="text-xs text-gray-600 mb-2">{workflow.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{workflow.executionCount} runs</span>
                      <span>{workflow.category}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedWorkflow ? (
            <div className="flex-1 flex flex-col">
              {/* Workflow Header */}
              <div className="p-6 border-b bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-bold">{selectedWorkflow.name}</h2>
                    <Badge
                      variant={selectedWorkflow.isActive ? 'default' : 'secondary'}
                    >
                      {selectedWorkflow.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleWorkflow(selectedWorkflow)}
                    >
                      {selectedWorkflow.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {selectedWorkflow.isActive ? 'Pause' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleExecuteWorkflow(selectedWorkflow)}
                      disabled={executeWorkflowMutation.isPending}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Execute
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteWorkflowMutation.mutate(selectedWorkflow.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {selectedWorkflow.description && (
                  <p className="text-gray-600 mb-4">{selectedWorkflow.description}</p>
                )}
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <span>Executions: {selectedWorkflow.executionCount}</span>
                  <span>Category: {selectedWorkflow.category}</span>
                  {selectedWorkflow.lastExecuted && (
                    <span>
                      Last run: {new Date(selectedWorkflow.lastExecuted).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Workflow Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="border-b px-6">
                  <TabsList className="h-10">
                    <TabsTrigger value="triggers">Triggers</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                    <TabsTrigger value="executions">Executions</TabsTrigger>
                    <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="triggers" className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Workflow Triggers</h3>
                      <Button
                        size="sm"
                        onClick={() => setShowCreateTrigger(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Trigger
                      </Button>
                    </div>
                    
                    <div className="grid gap-4">
                      {triggers && Array.isArray(triggers) ? triggers.filter((t: WorkflowTrigger) => t.workflowId === selectedWorkflow.id)
                        .map((trigger: WorkflowTrigger) => (
                        <Card key={trigger.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {getTriggerIcon(trigger.triggerType)}
                                <CardTitle className="text-base">
                                  {trigger.triggerType.charAt(0).toUpperCase() + trigger.triggerType.slice(1)} Trigger
                                </CardTitle>
                              </div>
                              <Badge variant={trigger.isActive ? 'default' : 'secondary'}>
                                {trigger.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {trigger.eventType && (
                              <p className="text-sm text-gray-600 mb-2">
                                Event Type: {trigger.eventType}
                              </p>
                            )}
                            {trigger.scheduleExpression && (
                              <p className="text-sm text-gray-600 mb-2">
                                Schedule: {trigger.scheduleExpression}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 mt-3">
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )) : <div className="text-sm text-gray-500">No triggers found</div>}
                    </div>
                  </TabsContent>

                  <TabsContent value="actions" className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Workflow Actions</h3>
                      <Button
                        size="sm"
                        onClick={() => setShowCreateAction(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Action
                      </Button>
                    </div>
                    
                    <div className="grid gap-4">
                      {actions && Array.isArray(actions) ? actions.map((action: WorkflowAction) => (
                        <Card key={action.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center space-x-2">
                              {getActionIcon(action.actionType)}
                              <CardTitle className="text-base">{action.name}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-600 mb-3">
                              Type: {action.actionType.replace('_', ' ').charAt(0).toUpperCase() + action.actionType.replace('_', ' ').slice(1)}
                            </p>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )) : <div className="text-sm text-gray-500">No actions found</div>}
                    </div>
                  </TabsContent>

                  <TabsContent value="executions" className="p-6 space-y-4">
                    <h3 className="text-lg font-medium">Recent Executions</h3>
                    
                    <div className="space-y-3">
                      {executions && Array.isArray(executions) ? executions.filter((e: WorkflowExecution) => e.workflowId === selectedWorkflow.id)
                        .map((execution: WorkflowExecution) => (
                        <Card key={execution.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {execution.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-600" />}
                                {execution.status === 'failed' && <XCircle className="w-5 h-5 text-red-600" />}
                                {execution.status === 'running' && <RotateCcw className="w-5 h-5 text-blue-600 animate-spin" />}
                                {execution.status === 'pending' && <Clock className="w-5 h-5 text-yellow-600" />}
                                
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">Execution #{execution.id}</span>
                                    <Badge className={`text-xs ${getStatusColor(execution.status)}`}>
                                      {execution.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Started: {new Date(execution.startTime).toLocaleString()}
                                  </p>
                                  {execution.endTime && (
                                    <p className="text-sm text-gray-600">
                                      Ended: {new Date(execution.endTime).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <Button size="sm" variant="outline">
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Details
                              </Button>
                            </div>
                            
                            {execution.errorMessage && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-800">{execution.errorMessage}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )) : <div className="text-sm text-gray-500">No executions found</div>}
                    </div>
                  </TabsContent>

                  <TabsContent value="monitoring" className="p-6 space-y-4">
                    <h3 className="text-lg font-medium">Workflow Monitoring</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Success Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">95%</div>
                          <p className="text-sm text-gray-600">Last 30 days</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Avg. Execution Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-600">2.3s</div>
                          <p className="text-sm text-gray-600">Average duration</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Total Runs</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-purple-600">{selectedWorkflow.executionCount}</div>
                          <p className="text-sm text-gray-600">All time</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Workflow className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Workflow</h3>
                <p className="text-gray-600 mb-4">Choose a workflow from the sidebar to view and edit it</p>
                <Button
                  onClick={() => setShowCreateWorkflow(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Workflow
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Workflow Dialog */}
      <Dialog open={showCreateWorkflow} onOpenChange={setShowCreateWorkflow}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Create a new automation workflow for your manufacturing processes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workflow Name</Label>
              <Input
                id="name"
                value={newWorkflow.name}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                placeholder="Enter workflow name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newWorkflow.description}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                placeholder="Enter workflow description"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newWorkflow.category}
                onValueChange={(value) => setNewWorkflow({ ...newWorkflow, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automation">Automation</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="quality">Quality Control</SelectItem>
                  <SelectItem value="scheduling">Scheduling</SelectItem>
                  <SelectItem value="notifications">Notifications</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateWorkflow(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateWorkflow}
                disabled={createWorkflowMutation.isPending}
              >
                {createWorkflowMutation.isPending ? 'Creating...' : 'Create Workflow'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
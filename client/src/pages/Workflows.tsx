import { useState, useCallback } from 'react';
import { Plus, Play, Pause, Archive, Sparkles, ChevronRight, Clock, Activity, Calendar, Settings2, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Workflow } from '@/../../shared/schema';

export default function Workflows() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const { toast } = useToast();

  // Fetch workflows
  const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ['/api/workflows'],
  });

  // Filter workflows
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesCategory = selectedCategory === 'all' || workflow.category === selectedCategory;
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          workflow.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Execute workflow mutation
  const executeWorkflow = useMutation({
    mutationFn: async (workflowId: number) => {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to execute workflow');
      return response.json();
    },
    onSuccess: (data, workflowId) => {
      toast({
        title: 'Workflow Started',
        description: `Execution ID: ${data.executionId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workflow-executions'] });
    },
    onError: () => {
      toast({
        title: 'Execution Failed',
        description: 'Could not start workflow execution',
        variant: 'destructive',
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'archived': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'schedule': return <Clock className="w-4 h-4" />;
      case 'event': return <Activity className="w-4 h-4" />;
      case 'manual': return <Play className="w-4 h-4" />;
      default: return <Settings2 className="w-4 h-4" />;
    }
  };

  if (showBuilder) {
    return <WorkflowBuilder onClose={() => setShowBuilder(false)} />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            AI Workflow Automation
          </h1>
          <p className="text-muted-foreground mt-1">
            Build and manage intelligent workflows with AI assistance
          </p>
        </div>
        <Button 
          onClick={() => setShowBuilder(true)}
          size="lg"
          className="gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Workflow
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="manufacturing">Manufacturing</SelectItem>
            <SelectItem value="quality">Quality Control</SelectItem>
            <SelectItem value="inventory">Inventory</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="scheduling">Scheduling</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="my-workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-workflows">My Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
        </TabsList>

        <TabsContent value="my-workflows" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent>
                <p className="text-muted-foreground mb-4">No workflows found</p>
                <Button onClick={() => setShowBuilder(true)}>
                  Create Your First Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkflows.map(workflow => (
                <WorkflowCard 
                  key={workflow.id} 
                  workflow={workflow} 
                  onExecute={() => executeWorkflow.mutate(workflow.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <TemplateGallery />
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <ExecutionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Workflow Card Component
function WorkflowCard({ workflow, onExecute }: { workflow: Workflow; onExecute: () => void }) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {workflow.aiEnabled && <Sparkles className="w-4 h-4 text-primary" />}
              {workflow.name}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {workflow.description}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(workflow.status || 'draft')}>
            {workflow.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            {getTriggerIcon(workflow.triggerType || 'manual')}
            {workflow.triggerType}
          </span>
          {workflow.executionCount !== undefined && (
            <span>
              {workflow.executionCount} runs
            </span>
          )}
        </div>
        {workflow.tags && workflow.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {workflow.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          {workflow.status === 'active' && (
            <Button 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                onExecute();
              }}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-1" />
              Execute
            </Button>
          )}
          <Button size="sm" variant="outline" className="flex-1">
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    case 'archived': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}

function getTriggerIcon(triggerType: string) {
  switch (triggerType) {
    case 'schedule': return <Clock className="w-4 h-4" />;
    case 'event': return <Activity className="w-4 h-4" />;
    case 'manual': return <Play className="w-4 h-4" />;
    default: return <Settings2 className="w-4 h-4" />;
  }
}

// Template Gallery Component
function TemplateGallery() {
  const templates = [
    {
      id: 1,
      name: 'Daily Production Report',
      description: 'Automatically generate and distribute daily production reports',
      category: 'reporting',
      usageCount: 245,
    },
    {
      id: 2,
      name: 'Quality Alert Response',
      description: 'Respond to quality issues with automated escalation and remediation',
      category: 'quality',
      usageCount: 189,
    },
    {
      id: 3,
      name: 'Maintenance Schedule',
      description: 'Schedule and track preventive maintenance activities',
      category: 'maintenance',
      usageCount: 156,
    },
    {
      id: 4,
      name: 'Inventory Reorder',
      description: 'Automatically reorder materials when stock reaches threshold',
      category: 'inventory',
      usageCount: 312,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map(template => (
        <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription>{template.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <Badge variant="secondary">{template.category}</Badge>
              <span className="text-sm text-muted-foreground">
                {template.usageCount} uses
              </span>
            </div>
            <Button className="w-full mt-4" variant="outline">
              Use Template
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Execution History Component
function ExecutionHistory() {
  const executions = [
    {
      id: '1',
      workflowName: 'Daily Production Report',
      status: 'completed',
      startedAt: '2025-10-28T09:00:00',
      duration: 45,
      triggeredBy: 'schedule',
    },
    {
      id: '2',
      workflowName: 'Quality Alert Response',
      status: 'running',
      startedAt: '2025-10-28T13:30:00',
      duration: null,
      triggeredBy: 'event',
    },
    {
      id: '3',
      workflowName: 'Inventory Reorder',
      status: 'failed',
      startedAt: '2025-10-28T12:00:00',
      duration: 15,
      triggeredBy: 'manual',
    },
  ];

  return (
    <div className="space-y-2">
      {executions.map(execution => (
        <Card key={execution.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full ${
                execution.status === 'completed' ? 'bg-green-500' :
                execution.status === 'running' ? 'bg-blue-500 animate-pulse' :
                'bg-red-500'
              }`} />
              <div>
                <p className="font-medium">{execution.workflowName}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(execution.startedAt).toLocaleString()}
                  {execution.duration && ` • ${execution.duration}s`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{execution.triggeredBy}</Badge>
              <Button size="sm" variant="ghost">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Workflow Builder Component with AI generation
function WorkflowBuilder({ onClose }: { onClose: () => void }) {
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatedWorkflow, setGeneratedWorkflow] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('manufacturing');
  const { toast } = useToast();

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please describe the workflow you want to create',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/workflows/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          category: selectedCategory,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate workflow');
      
      const workflow = await response.json();
      setGeneratedWorkflow(workflow);
      setWorkflowName(workflow.name || '');
      setWorkflowDescription(workflow.description || '');
      
      toast({
        title: 'Workflow Generated!',
        description: 'AI has created a workflow based on your description',
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Could not generate workflow. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveWorkflow = async () => {
    if (generatedWorkflow) {
      try {
        const response = await fetch(`/api/workflows/${generatedWorkflow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...generatedWorkflow,
            name: workflowName,
            description: workflowDescription,
            status: 'active',
          }),
        });

        if (!response.ok) throw new Error('Failed to save workflow');

        toast({
          title: 'Workflow Saved',
          description: 'Your workflow has been saved and activated',
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
        onClose();
      } catch (error) {
        toast({
          title: 'Save Failed',
          description: 'Could not save workflow',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          AI Workflow Builder
        </h2>
        <Button onClick={onClose} variant="outline">Close</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Generation Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Describe Your Workflow</CardTitle>
            <CardDescription>
              Tell AI what you want to automate and it will create a workflow for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="quality">Quality Control</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Describe what you want to automate
              </label>
              <textarea
                className="w-full min-h-[150px] p-3 border rounded-md"
                placeholder="Example: Create a workflow that monitors production line efficiency every hour. If efficiency drops below 80%, send alerts to the production manager and create a maintenance ticket. Also generate a daily summary report."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleAiGenerate}
              className="w-full"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate with AI
                </>
              )}
            </Button>

            {/* Sample Prompts */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Try these examples:</p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => setAiPrompt('Monitor inventory levels and automatically create purchase orders when stock falls below minimum thresholds')}
                >
                  Inventory Auto-Reorder
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => setAiPrompt('Schedule daily quality checks, collect data, and escalate any issues that exceed tolerance limits')}
                >
                  Quality Monitoring
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => setAiPrompt('Generate production reports every shift with KPIs, send to managers, and flag any anomalies')}
                >
                  Shift Reporting
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Preview Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Preview</CardTitle>
            <CardDescription>
              Review and customize your AI-generated workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedWorkflow ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Name</label>
                  <Input
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="Workflow name"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <textarea
                    className="w-full min-h-[80px] p-3 border rounded-md"
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                    placeholder="Workflow description"
                  />
                </div>

                {/* Workflow Steps */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Workflow Steps</label>
                  <div className="space-y-2">
                    {generatedWorkflow.definition?.steps?.map((step: any, index: number) => (
                      <div key={index} className="p-3 border rounded-md bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                            {index + 1}
                          </div>
                          <span className="font-medium">{step.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 ml-8">
                          {step.description}
                        </p>
                        <div className="flex gap-2 mt-2 ml-8">
                          <Badge variant="outline" className="text-xs">
                            {step.stepType}
                          </Badge>
                          {step.actionType && (
                            <Badge variant="secondary" className="text-xs">
                              {step.actionType}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveWorkflow}
                    className="flex-1"
                  >
                    Save & Activate
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => setGeneratedWorkflow(null)}
                  >
                    Start Over
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Your AI-generated workflow will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
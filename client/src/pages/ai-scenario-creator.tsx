import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Sparkles, 
  Building2, 
  Settings, 
  Play, 
  Save, 
  Eye,
  Zap,
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle,
  Loader2,
  RotateCcw,
  Plus,
  Minus,
  Database,
  GitBranch,
  Factory,
  Users
} from 'lucide-react';

interface Plant {
  id: number;
  name: string;
  location?: string;
  isActive: boolean;
}

interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  targetAudience: string[];
  parameters: Record<string, any>;
}

interface ScenarioConfiguration {
  name: string;
  description: string;
  selectedPlants: number[];
  schedulingStrategy: 'fastest' | 'most_efficient' | 'balanced' | 'custom';
  optimizationPriorities: Array<'delivery_time' | 'resource_utilization' | 'cost_efficiency' | 'customer_satisfaction'>;
  constraints: {
    max_overtime_hours?: number;
    resource_availability?: Record<string, any>;
    deadline_priorities?: Record<string, number>;
  };
  dataModifications: Array<{
    table: string;
    field: string;
    operation: 'increase' | 'decrease' | 'set' | 'multiply';
    value: number | string;
    condition?: string;
  }>;
  newDataGeneration: {
    generateOrders?: {
      count: number;
      priority: 'high' | 'medium' | 'low';
      dueDate: string;
    };
    generateResources?: {
      count: number;
      type: string;
      capacity: number;
    };
  };
}

const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    id: 'capacity_expansion',
    name: 'Capacity Expansion Analysis',
    description: 'Evaluate impact of adding new equipment or expanding production capacity',
    category: 'capacity',
    targetAudience: ['directors', 'planners'],
    parameters: {
      new_equipment_count: 1,
      capacity_increase_percent: 25,
      investment_cost: 100000
    }
  },
  {
    id: 'rush_order_impact',
    name: 'Rush Order Impact Assessment',
    description: 'Analyze how urgent orders affect existing production schedule',
    category: 'planning',
    targetAudience: ['sales', 'planners'],
    parameters: {
      rush_order_priority: 'high',
      delivery_time_reduction: 50,
      order_quantity: 1000
    }
  },
  {
    id: 'demand_surge',
    name: 'Demand Surge Response',
    description: 'Test system response to sudden increase in customer demand',
    category: 'demand',
    targetAudience: ['directors', 'sales', 'planners'],
    parameters: {
      demand_increase_percent: 40,
      duration_weeks: 8,
      affected_products: 'top_sellers'
    }
  },
  {
    id: 'resource_optimization',
    name: 'Resource Utilization Optimization',
    description: 'Find optimal resource allocation to maximize efficiency',
    category: 'efficiency',
    targetAudience: ['planners', 'directors'],
    parameters: {
      target_utilization: 85,
      shift_flexibility: true,
      overtime_tolerance: 20
    }
  },
  {
    id: 'supplier_disruption',
    name: 'Supplier Disruption Scenario',
    description: 'Evaluate impact of supplier delays or quality issues',
    category: 'risk',
    targetAudience: ['directors', 'planners'],
    parameters: {
      affected_materials: 'key_components',
      delay_days: 7,
      alternative_suppliers: true
    }
  }
];

export default function AIScenarioCreator() {
  const { toast } = useToast();
  
  // State management
  const [activeTab, setActiveTab] = useState<'guided' | 'advanced' | 'results'>('guided');
  const [selectedTemplate, setSelectedTemplate] = useState<ScenarioTemplate | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [scenarioConfig, setScenarioConfig] = useState<ScenarioConfiguration>({
    name: '',
    description: '',
    selectedPlants: [],
    schedulingStrategy: 'balanced',
    optimizationPriorities: ['delivery_time', 'resource_utilization'],
    constraints: {},
    dataModifications: [],
    newDataGeneration: {}
  });
  const [generatedScenarios, setGeneratedScenarios] = useState<any[]>([]);

  // Fetch available plants from database
  const { data: plants = [], isLoading: plantsLoading, isError: plantsError } = useQuery({
    queryKey: ['/api/plants'],
  });

  // AI scenario generation mutation
  const generateScenarioMutation = useMutation({
    mutationFn: async ({ prompt, template, plants }: { prompt: string; template?: ScenarioTemplate; plants: number[] }) => {
      const response = await apiRequest('POST', '/api/scenarios/generate', {
        prompt,
        template: template?.id,
        selectedPlants: plants,
        includeCurrentData: true
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedScenarios(data.scenarios || [data]);
      setActiveTab('results');
      toast({
        title: "AI Scenario Generated",
        description: "New scenario options have been created based on your requirements"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate scenarios with AI",
        variant: "destructive"
      });
    }
  });

  // Create scenario mutation
  const createScenarioMutation = useMutation({
    mutationFn: async (scenarioData: any) => {
      const response = await apiRequest('POST', '/api/schedule-scenarios', scenarioData);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Scenario Created",
        description: `Scenario "${data.name}" has been created successfully`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create scenario",
        variant: "destructive"
      });
    }
  });

  const handleTemplateSelect = (template: ScenarioTemplate) => {
    setSelectedTemplate(template);
    setScenarioConfig(prev => ({
      ...prev,
      name: template.name,
      description: template.description
    }));
  };

  const handleAIGenerate = () => {
    if (!aiPrompt.trim() && !selectedTemplate) {
      toast({
        title: "Input Required",
        description: "Please provide a description or select a template",
        variant: "destructive"
      });
      return;
    }

    if (scenarioConfig.selectedPlants.length === 0) {
      toast({
        title: "Plants Required",
        description: "Please select at least one plant for the scenario",
        variant: "destructive"
      });
      return;
    }

    generateScenarioMutation.mutate({
      prompt: aiPrompt || selectedTemplate?.description || '',
      template: selectedTemplate || undefined,
      plants: scenarioConfig.selectedPlants
    });
  };

  const handleCreateScenario = (scenario: any) => {
    createScenarioMutation.mutate({
      name: scenario.name,
      description: scenario.description,
      status: 'draft',
      createdBy: 'current_user', // This should come from auth context
      configuration: {
        scheduling_strategy: scenario.scheduling_strategy,
        optimization_priorities: scenario.optimization_priorities,
        constraints: scenario.constraints
      },
      metrics: scenario.predicted_metrics
    });
  };

  const getTemplatesByCategory = (category: string) => {
    return SCENARIO_TEMPLATES.filter(template => template.category === category);
  };

  const getAudienceColor = (audience: string) => {
    const colors: Record<string, string> = {
      'directors': 'bg-purple-100 text-purple-800',
      'planners': 'bg-blue-100 text-blue-800',
      'sales': 'bg-green-100 text-green-800'
    };
    return colors[audience] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <GitBranch className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          <span className="hidden sm:inline">AI Scenario Creator</span>
          <span className="sm:hidden">Scenario Creator</span>
        </h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Create and evaluate manufacturing scenarios using AI-powered analysis
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
          <TabsTrigger value="guided" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI Guided Setup</span>
            <span className="sm:hidden">AI Guided</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced Configuration</span>
            <span className="sm:hidden">Advanced</span>
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Generated Scenarios</span>
            <span className="sm:hidden">Results</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guided" className="space-y-4 sm:space-y-6">
          {/* Plant Selection */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Factory className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Select Plants for Analysis</span>
                <span className="sm:hidden">Select Plants</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Choose manufacturing facilities for your scenario
              </CardDescription>
            </CardHeader>
            <CardContent>
              {plantsLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-500">Loading plants...</span>
                </div>
              ) : (plants as Plant[]).length === 0 ? (
                <div className="text-center py-8">
                  <Factory className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    {plantsError ? "Error loading plants from database" : "No plants available"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {(plants as Plant[]).map((plant) => (
                    <div
                      key={plant.id}
                      className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
                        scenarioConfig.selectedPlants.includes(plant.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setScenarioConfig(prev => ({
                          ...prev,
                          selectedPlants: prev.selectedPlants.includes(plant.id)
                            ? prev.selectedPlants.filter(id => id !== plant.id)
                            : [...prev.selectedPlants, plant.id]
                        }));
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{plant.name}</h3>
                          <p className="text-sm text-gray-500">{plant.location || 'Location not specified'}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          scenarioConfig.selectedPlants.includes(plant.id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scenario Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Scenario Templates
              </CardTitle>
              <CardDescription>
                Choose a pre-built template or describe your custom scenario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template Categories */}
              {['capacity', 'planning', 'demand', 'efficiency', 'risk'].map(category => {
                const templates = getTemplatesByCategory(category);
                return (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-3 capitalize">{category} Scenarios</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {templates.map(template => (
                        <div
                          key={template.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedTemplate?.id === template.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <h4 className="font-medium mb-2">{template.name}</h4>
                          <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {template.targetAudience.map(audience => (
                              <Badge key={audience} className={getAudienceColor(audience)}>
                                <Users className="h-3 w-3 mr-1" />
                                {audience}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* AI Prompt */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <GitBranch className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Describe Your Scenario</span>
                <span className="sm:hidden">Describe Scenario</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Tell AI what you want to analyze (optional if using template)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <Textarea
                placeholder="Example: What if we received 50% more orders next month? How would 2 new machines affect delivery times?"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                className="mb-4 text-sm sm:text-base"
              />
              <Button
                onClick={handleAIGenerate}
                disabled={generateScenarioMutation.isPending}
                className="w-full"
                size="lg"
              >
                {generateScenarioMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Generating Scenarios...</span>
                    <span className="sm:hidden">Generating...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Generate AI Scenarios</span>
                    <span className="sm:hidden">Generate</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Configuration</CardTitle>
              <CardDescription>
                Fine-tune scenario parameters for detailed analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Scheduling Strategy */}
              <div>
                <label className="text-sm font-medium mb-2 block">Scheduling Strategy</label>
                <Select 
                  value={scenarioConfig.schedulingStrategy} 
                  onValueChange={(value: any) => setScenarioConfig(prev => ({
                    ...prev,
                    schedulingStrategy: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fastest">Fastest Delivery</SelectItem>
                    <SelectItem value="most_efficient">Most Efficient</SelectItem>
                    <SelectItem value="balanced">Balanced Approach</SelectItem>
                    <SelectItem value="custom">Custom Strategy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Optimization Priorities */}
              <div>
                <label className="text-sm font-medium mb-2 block">Optimization Priorities</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'delivery_time', label: 'Delivery Time' },
                    { id: 'resource_utilization', label: 'Resource Utilization' },
                    { id: 'cost_efficiency', label: 'Cost Efficiency' },
                    { id: 'customer_satisfaction', label: 'Customer Satisfaction' }
                  ].map(priority => (
                    <label key={priority.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={scenarioConfig.optimizationPriorities.includes(priority.id as any)}
                        onChange={(e) => {
                          setScenarioConfig(prev => ({
                            ...prev,
                            optimizationPriorities: e.target.checked
                              ? [...prev.optimizationPriorities, priority.id as any]
                              : prev.optimizationPriorities.filter(p => p !== priority.id)
                          }));
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{priority.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Constraints */}
              <div>
                <label className="text-sm font-medium mb-2 block">Constraints</label>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Maximum Overtime Hours</label>
                    <Input
                      type="number"
                      placeholder="20"
                      value={scenarioConfig.constraints.max_overtime_hours || ''}
                      onChange={(e) => setScenarioConfig(prev => ({
                        ...prev,
                        constraints: {
                          ...prev.constraints,
                          max_overtime_hours: parseInt(e.target.value) || undefined
                        }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {generatedScenarios.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <GitBranch className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Scenarios Generated</h3>
                  <p className="text-gray-500">Use the AI Guided Setup to create scenarios for evaluation</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {generatedScenarios.map((scenario, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{scenario.name}</span>
                      <Badge variant="outline">
                        {scenario.confidence_score}% confidence
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {typeof scenario.description === 'object' && scenario.description !== null 
                        ? (scenario.description.content || 
                           JSON.stringify(scenario.description, null, 2))
                        : scenario.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Predicted Metrics */}
                    {scenario.predicted_metrics && (
                      <div>
                        <h4 className="font-medium mb-2">Predicted Impact</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                            <div className="text-sm font-medium">Efficiency</div>
                            <div className="text-lg font-bold text-blue-600">
                              {scenario.predicted_metrics.production_efficiency || scenario.predicted_metrics.efficiency_score || 0}%
                            </div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <Target className="h-5 w-5 mx-auto mb-1 text-green-500" />
                            <div className="text-sm font-medium">On-Time</div>
                            <div className="text-lg font-bold text-green-600">
                              {scenario.predicted_metrics.on_time_delivery || scenario.predicted_metrics.on_time_delivery_percent || 0}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Key Changes */}
                    {scenario.key_changes && (
                      <div>
                        <h4 className="font-medium mb-2">Key Changes</h4>
                        <ul className="space-y-1">
                          {scenario.key_changes.map((change: string, changeIndex: number) => (
                            <li key={changeIndex} className="text-sm flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              {change}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleCreateScenario(scenario)}
                        disabled={createScenarioMutation.isPending}
                        className="flex-1"
                      >
                        {createScenarioMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Create Scenario
                      </Button>
                      <Button variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
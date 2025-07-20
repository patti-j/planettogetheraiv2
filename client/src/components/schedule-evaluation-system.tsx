import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  MessageSquare,
  Star,
  Edit,
  Trash2,
  Plus,
  Target,
  Factory,
  Zap,
  Eye,
  GitCompare
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, differenceInDays } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import type { 
  ScheduleScenario, 
  ScenarioOperation, 
  ScenarioEvaluation, 
  ScenarioDiscussion,
  Operation,
  Resource,
  Job
} from '@shared/schema';

interface ScenarioMetrics {
  efficiency: number;
  utilization: number;
  deliveryPerformance: number;
  cost: number;
  totalDuration: number;
  resourceConflicts: number;
  deliveryDelay: number;
}

interface EvaluationCriteria {
  name: string;
  weight: number;
  score: number;
}

// Calculate scenario metrics function moved to top level
const calculateScenarioMetrics = (scenario: ScheduleScenario, scenarioOps: ScenarioOperation[], resources: Resource[]): ScenarioMetrics => {
  const totalDuration = scenarioOps.reduce((sum, op) => {
    if (op.startTime && op.endTime) {
      return sum + (new Date(op.endTime).getTime() - new Date(op.startTime).getTime()) / (1000 * 60 * 60);
    }
    return sum + op.duration;
  }, 0);

  const resourceConflicts = scenarioOps.filter((op1, index) => 
    scenarioOps.slice(index + 1).some(op2 => 
      op1.resourceId === op2.resourceId &&
      op1.startTime && op1.endTime && op2.startTime && op2.endTime &&
      new Date(op1.startTime) < new Date(op2.endTime) &&
      new Date(op2.startTime) < new Date(op1.endTime)
    )
  ).length;

  const plannedEndDate = new Date(scenario.createdAt);
  plannedEndDate.setDate(plannedEndDate.getDate() + Math.ceil(totalDuration / 8)); // Assuming 8-hour days
  
  const deliveryDelay = scenario.dueDate ? 
    Math.max(0, differenceInDays(plannedEndDate, new Date(scenario.dueDate))) : 0;

  return {
    efficiency: Math.max(0, 100 - (resourceConflicts * 10) - (deliveryDelay * 5)),
    utilization: Math.min(100, (scenarioOps.length / resources.length) * 100),
    deliveryPerformance: Math.max(0, 100 - (deliveryDelay * 10)),
    cost: totalDuration * 100, // Simple cost calculation
    totalDuration,
    resourceConflicts,
    deliveryDelay
  };
};

// ScenarioCard component moved outside to prevent hooks issues
const ScenarioCard: React.FC<{ 
  scenario: ScheduleScenario, 
  selectedScenarios: number[], 
  setSelectedScenarios: (scenarios: number[]) => void,
  resources: Resource[]
}> = ({ scenario, selectedScenarios, setSelectedScenarios, resources }) => {
  const { data: scenarioOps = [] } = useQuery<ScenarioOperation[]>({
    queryKey: [`/api/scenarios/${scenario.id}/operations`],
  });

  const { data: evaluations = [] } = useQuery<ScenarioEvaluation[]>({
    queryKey: [`/api/scenarios/${scenario.id}/evaluations`],
  });

  const { data: discussions = [] } = useQuery<ScenarioDiscussion[]>({
    queryKey: [`/api/scenarios/${scenario.id}/discussions`],
  });

  const metrics = calculateScenarioMetrics(scenario, scenarioOps, resources);
  const isSelected = selectedScenarios.includes(scenario.id);

  return (
    <Card className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedScenarios([...selectedScenarios, scenario.id]);
                } else {
                  setSelectedScenarios(selectedScenarios.filter(id => id !== scenario.id));
                }
              }}
              className="rounded border-gray-300"
            />
            <CardTitle className="text-lg">{scenario.name}</CardTitle>
          </div>
          <Badge variant={scenario.status === 'approved' ? 'default' : scenario.status === 'rejected' ? 'destructive' : 'secondary'}>
            {scenario.status}
          </Badge>
        </div>
        <CardDescription>{scenario.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Efficiency</span>
              <span className="text-sm font-medium">{metrics.efficiency.toFixed(1)}%</span>
            </div>
            <Progress value={metrics.efficiency} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Resource Utilization</span>
              <span className="text-sm font-medium">{metrics.utilization.toFixed(1)}%</span>
            </div>
            <Progress value={metrics.utilization} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
            <div>
              <div className="font-medium">{scenarioOps.length}</div>
              <div className="text-gray-500">Operations</div>
            </div>
            <div>
              <div className="font-medium">{evaluations.length}</div>
              <div className="text-gray-500">Evaluations</div>
            </div>
            <div>
              <div className="font-medium">{discussions.length}</div>
              <div className="text-gray-500">Comments</div>
            </div>
          </div>

          <div className="mt-4 flex space-x-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="w-4 h-4 mr-1" />
              View Details
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Separate component for discussion rendering to handle hooks properly
const ScenarioDiscussionCard: React.FC<{ 
  scenarioId: number, 
  scenario: ScheduleScenario | undefined 
}> = ({ scenarioId, scenario }) => {
  const { data: discussions = [] } = useQuery<ScenarioDiscussion[]>({
    queryKey: [`/api/scenarios/${scenarioId}/discussions`],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discussion: {scenario?.name}</CardTitle>
        <CardDescription>Collaborative feedback and decision-making</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {discussions.map((discussion: ScenarioDiscussion) => (
          <div key={discussion.id} className="border-l-4 border-blue-200 pl-4 py-2">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">{discussion.authorName}</span>
              <span className="text-sm text-gray-500">
                {discussion.createdAt && format(new Date(discussion.createdAt), 'MMM d, yyyy HH:mm')}
              </span>
            </div>
            <p className="text-sm text-gray-700">{discussion.message}</p>
            {discussion.messageType === 'decision' && (
              <Badge variant="default" className="mt-1">Decision</Badge>
            )}
          </div>
        ))}
        
        <div className="mt-4 space-y-2">
          <Textarea placeholder="Add your comment or feedback..." />
          <div className="flex justify-between">
            <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comment">Comment</SelectItem>
                <SelectItem value="concern">Concern</SelectItem>
                <SelectItem value="suggestion">Suggestion</SelectItem>
                <SelectItem value="decision">Decision</SelectItem>
              </SelectContent>
            </Select>
            <Button>Post Comment</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ScheduleEvaluationSystem: React.FC = () => {
  const [selectedScenarios, setSelectedScenarios] = useState<number[]>([]);
  const [evaluationMode, setEvaluationMode] = useState<'create' | 'compare' | 'analyze'>('create');
  const [activeTab, setActiveTab] = useState('scenarios');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch schedule scenarios
  const { data: scenarios = [], isLoading: scenariosLoading } = useQuery({
    queryKey: ['/api/schedule-scenarios'],
  });

  // Fetch operations and resources for scenario creation
  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ['/api/operations'],
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ['/api/resources'],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
  });



  // Create scenario mutation
  const createScenarioMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/schedule-scenarios', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-scenarios'] });
      toast({ title: 'Success', description: 'Scenario created successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create scenario', variant: 'destructive' });
    }
  });

  // Create evaluation mutation
  const createEvaluationMutation = useMutation({
    mutationFn: async ({ scenarioId, data }: { scenarioId: number, data: any }) => {
      return await apiRequest('POST', `/api/scenarios/${scenarioId}/evaluations`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scenarios'] });
      toast({ title: 'Success', description: 'Evaluation saved successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save evaluation', variant: 'destructive' });
    }
  });

  // Create discussion mutation
  const createDiscussionMutation = useMutation({
    mutationFn: async ({ scenarioId, data }: { scenarioId: number, data: any }) => {
      return await apiRequest('POST', `/api/scenarios/${scenarioId}/discussions`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scenarios'] });
      toast({ title: 'Success', description: 'Comment added successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add comment', variant: 'destructive' });
    }
  });

  const createScenarioFromCurrentSchedule = async () => {
    const scenarioData = {
      name: `Scenario ${scenarios.length + 1}`,
      description: 'Generated from current production schedule',
      baseJobIds: jobs.map(job => job.id),
      status: 'draft' as const,
      dueDate: addDays(new Date(), 30).toISOString()
    };

    createScenarioMutation.mutate(scenarioData);
  };



  const ComparisonView: React.FC = () => {
    if (selectedScenarios.length < 2) {
      return (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Select at least 2 scenarios to compare their performance metrics and characteristics.
          </AlertDescription>
        </Alert>
      );
    }

    const selectedScenarioData = scenarios.filter((s: ScheduleScenario) => selectedScenarios.includes(s.id));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedScenarioData.map((scenario: ScheduleScenario) => (
            <ScenarioCard 
              key={scenario.id} 
              scenario={scenario} 
              selectedScenarios={selectedScenarios}
              setSelectedScenarios={setSelectedScenarios}
              resources={resources}
            />
          ))}
        </div>
      </div>
    );
  };



  const EvaluationForm: React.FC<{ scenarioId: number }> = ({ scenarioId }) => {
    const [evaluatorName, setEvaluatorName] = useState('');
    const [department, setDepartment] = useState('');
    const [overallScore, setOverallScore] = useState(0);
    const [notes, setNotes] = useState('');

    const criteria: EvaluationCriteria[] = [
      { name: 'Schedule Feasibility', weight: 25, score: 0 },
      { name: 'Resource Optimization', weight: 20, score: 0 },
      { name: 'Cost Effectiveness', weight: 20, score: 0 },
      { name: 'Risk Management', weight: 15, score: 0 },
      { name: 'Customer Impact', weight: 20, score: 0 }
    ];

    const [scores, setScores] = useState<{ [key: string]: number }>({});

    const handleSubmitEvaluation = () => {
      const evaluationData = {
        evaluatorName,
        department,
        overallScore,
        criteriaScores: criteria.map(c => ({
          criterion: c.name,
          score: scores[c.name] || 0,
          weight: c.weight
        })),
        notes,
        evaluatedAt: new Date().toISOString()
      };

      createEvaluationMutation.mutate({ scenarioId, data: evaluationData });
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="evaluatorName">Evaluator Name</Label>
            <Input
              id="evaluatorName"
              value={evaluatorName}
              onChange={(e) => setEvaluatorName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
                <SelectItem value="management">Management</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Evaluation Criteria</Label>
          {criteria.map((criterion) => (
            <div key={criterion.name} className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">{criterion.name}</span>
                <span className="text-sm text-gray-500">Weight: {criterion.weight}%</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={scores[criterion.name] || 0}
                    onChange={(e) => setScores({...scores, [criterion.name]: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>
                <div className="w-12 text-right">
                  <span className="text-sm font-medium">{scores[criterion.name] || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <Label htmlFor="overallScore">Overall Score (0-100)</Label>
          <Input
            id="overallScore"
            type="number"
            min="0"
            max="100"
            value={overallScore}
            onChange={(e) => setOverallScore(parseInt(e.target.value) || 0)}
          />
        </div>

        <div>
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter any additional comments or recommendations..."
            rows={4}
          />
        </div>

        <Button onClick={handleSubmitEvaluation} className="w-full">
          Submit Evaluation
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Schedule Evaluation System</h2>
          <p className="text-gray-600">Compare production schedules and gather stakeholder feedback for optimal decision-making</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={createScenarioFromCurrentSchedule}>
            <Plus className="w-4 h-4 mr-2" />
            Create from Current Schedule
          </Button>
          <Button 
            variant={selectedScenarios.length >= 2 ? "default" : "outline"}
            disabled={selectedScenarios.length < 2}
            onClick={() => setActiveTab('compare')}
          >
            <GitCompare className="w-4 h-4 mr-2" />
            Compare Selected ({selectedScenarios.length})
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
          <TabsTrigger value="evaluate">Evaluate</TabsTrigger>
          <TabsTrigger value="discuss">Discuss</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-4">
          {scenariosLoading ? (
            <div className="text-center py-8">Loading scenarios...</div>
          ) : scenarios.length === 0 ? (
            <Alert>
              <Factory className="h-4 w-4" />
              <AlertDescription>
                No schedule scenarios found. Create your first scenario from the current production schedule.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios.map((scenario: ScheduleScenario) => (
                <ScenarioCard 
                  key={scenario.id} 
                  scenario={scenario} 
                  selectedScenarios={selectedScenarios}
                  setSelectedScenarios={setSelectedScenarios}
                  resources={resources}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compare">
          <ComparisonView />
        </TabsContent>

        <TabsContent value="evaluate" className="space-y-4">
          {selectedScenarios.length === 0 ? (
            <Alert>
              <Star className="h-4 w-4" />
              <AlertDescription>
                Select a scenario from the Scenarios tab to provide your evaluation and feedback.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selectedScenarios.map(scenarioId => (
                <Card key={scenarioId}>
                  <CardHeader>
                    <CardTitle>Evaluate Scenario</CardTitle>
                    <CardDescription>
                      Provide your professional assessment of this schedule scenario
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EvaluationForm scenarioId={scenarioId} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discuss" className="space-y-4">
          {selectedScenarios.length === 0 ? (
            <Alert>
              <MessageSquare className="h-4 w-4" />
              <AlertDescription>
                Select a scenario to participate in collaborative discussions and decision-making.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {selectedScenarios.map(scenarioId => {
                const scenario = scenarios.find((s: ScheduleScenario) => s.id === scenarioId);
                return (
                  <ScenarioDiscussionCard 
                    key={scenarioId} 
                    scenarioId={scenarioId} 
                    scenario={scenario} 
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScheduleEvaluationSystem;
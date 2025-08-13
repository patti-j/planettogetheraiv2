import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  ArrowRight, 
  Brain, 
  Calendar, 
  Factory, 
  TrendingUp, 
  Users, 
  Zap,
  Clock,
  Target,
  BarChart3,
  Workflow,
  CheckCircle,
  PlayCircle,
  Info,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PlanningStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  inputs: string[];
  outputs: string[];
  keyMetrics: string[];
  bestPractices: string[];
  navigationPath: string;
  timeHorizon: string;
  stakeholders: string[];
}

const planningSteps: PlanningStep[] = [
  {
    id: 'demand-planning',
    title: 'Demand Planning',
    description: 'Forecast customer demand using statistical models, market intelligence, and AI to predict future sales.',
    icon: TrendingUp,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    inputs: ['Historical Sales Data', 'Market Intelligence', 'Customer Orders', 'Economic Indicators'],
    outputs: ['Statistical Forecast', 'Consensus Forecast', 'Demand Plan'],
    keyMetrics: ['Forecast Accuracy', 'Bias', 'MAD/MAPE', 'Demand Variability'],
    bestPractices: [
      'Use multiple forecasting models for accuracy',
      'Incorporate market intelligence and promotions',
      'Review and adjust forecasts regularly',
      'Measure and improve forecast accuracy'
    ],
    navigationPath: '/demand-planning',
    timeHorizon: '3-18 months',
    stakeholders: ['Sales Team', 'Marketing', 'Demand Planners']
  },
  {
    id: 'master-production-schedule',
    title: 'Master Production Schedule',
    description: 'Create a detailed production plan that balances demand forecasts with production capacity and inventory targets.',
    icon: Calendar,
    color: 'text-green-600 bg-green-50 border-green-200',
    inputs: ['Demand Forecast', 'Current Inventory', 'Production Capacity', 'Safety Stock Targets'],
    outputs: ['MPS Quantities', 'Available to Promise', 'Production Timeline'],
    keyMetrics: ['Service Level', 'Inventory Turns', 'ATP Accuracy', 'Plan Stability'],
    bestPractices: [
      'Align MPS with demand forecasts',
      'Consider capacity constraints early',
      'Maintain appropriate safety stock levels',
      'Freeze MPS within lead time fences'
    ],
    navigationPath: '/master-production-schedule',
    timeHorizon: '1-6 months',
    stakeholders: ['Production Planners', 'Sales Operations', 'Supply Chain']
  },
  {
    id: 'production-planning',
    title: 'Production Planning',
    description: 'Transform the MPS into detailed material and resource requirements using MRP and capacity planning.',
    icon: Factory,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    inputs: ['Master Production Schedule', 'Bill of Materials', 'Inventory Levels', 'Lead Times'],
    outputs: ['Material Requirements', 'Work Orders', 'Purchase Orders'],
    keyMetrics: ['Material Availability', 'Planned Order Coverage', 'Inventory Investment'],
    bestPractices: [
      'Maintain accurate BOMs and lead times',
      'Use lot sizing rules effectively',
      'Consider safety stock at component level',
      'Regular MRP regeneration'
    ],
    navigationPath: '/production-planning',
    timeHorizon: '2-12 weeks',
    stakeholders: ['Production Planners', 'Materials Management', 'Procurement']
  },
  {
    id: 'capacity-planning',
    title: 'Capacity Planning',
    description: 'Analyze resource requirements and identify capacity constraints to ensure production feasibility.',
    icon: BarChart3,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    inputs: ['Production Plan', 'Resource Capacity', 'Work Center Data', 'Routing Information'],
    outputs: ['Capacity Requirements', 'Bottleneck Analysis', 'Resource Utilization'],
    keyMetrics: ['Capacity Utilization', 'Bottleneck Efficiency', 'Resource Availability'],
    bestPractices: [
      'Identify and manage bottleneck resources',
      'Plan capacity changes ahead of demand',
      'Use rough-cut capacity planning first',
      'Consider both labor and machine capacity'
    ],
    navigationPath: '/capacity-planning',
    timeHorizon: '1-12 weeks',
    stakeholders: ['Production Managers', 'Industrial Engineering', 'HR']
  },
  {
    id: 'production-scheduling',
    title: 'Production Scheduling',
    description: 'Create detailed schedules that optimize resource utilization while meeting delivery commitments.',
    icon: Clock,
    color: 'text-red-600 bg-red-50 border-red-200',
    inputs: ['Work Orders', 'Resource Availability', 'Priority Rules', 'Constraints'],
    outputs: ['Detailed Schedule', 'Resource Assignments', 'Sequence Plans'],
    keyMetrics: ['On-Time Delivery', 'Resource Utilization', 'Setup Time', 'Cycle Time'],
    bestPractices: [
      'Use finite capacity scheduling',
      'Consider setup and changeover times',
      'Apply appropriate priority rules',
      'Monitor and adjust schedules dynamically'
    ],
    navigationPath: '/production-schedule',
    timeHorizon: '1 day - 4 weeks',
    stakeholders: ['Shop Floor Supervisors', 'Production Schedulers', 'Operations']
  }
];

const PlanningOverview = () => {
  const [, navigate] = useLocation();
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const navigateToStep = (path: string) => {
    navigate(path);
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-200">
          <Workflow className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">Planning Process Guide</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Supply Chain Planning Overview</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Understand how demand planning, master production scheduling, capacity planning, and production scheduling 
          work together to optimize your manufacturing operations and meet business goals.
        </p>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Process Flow
          </TabsTrigger>
          <TabsTrigger value="steps" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Planning Steps
          </TabsTrigger>
          <TabsTrigger value="integration" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Integration
          </TabsTrigger>
          <TabsTrigger value="getting-started" className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            Getting Started
          </TabsTrigger>
        </TabsList>

        {/* Process Flow Tab */}
        <TabsContent value="overview" className="space-y-8">
          {/* Process Flow Diagram */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Supply Chain Planning Process Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Visual Flow */}
                <div className="relative">
                  <div className="flex items-center justify-between space-x-4">
                    {planningSteps.map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div key={step.id} className="flex items-center space-x-4">
                          <div
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
                              selectedStep === step.id 
                                ? step.color + ' shadow-lg scale-105' 
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedStep(selectedStep === step.id ? null : step.id)}
                          >
                            <div className="text-center space-y-2">
                              <Icon className={`h-8 w-8 mx-auto ${
                                selectedStep === step.id ? step.color.split(' ')[0] : 'text-gray-600'
                              }`} />
                              <h3 className="font-semibold text-sm">{step.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {step.timeHorizon}
                              </Badge>
                            </div>
                          </div>
                          {index < planningSteps.length - 1 && (
                            <ArrowRight className="h-6 w-6 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Step Details */}
                {selectedStep && (
                  <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
                    {(() => {
                      const step = planningSteps.find(s => s.id === selectedStep);
                      if (!step) return null;
                      const Icon = step.icon;
                      
                      return (
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Icon className={`h-6 w-6 ${step.color.split(' ')[0]}`} />
                              <div>
                                <h3 className="text-xl font-semibold">{step.title}</h3>
                                <p className="text-gray-600">{step.description}</p>
                              </div>
                            </div>
                            <Button onClick={() => navigateToStep(step.navigationPath)}>
                              Go to {step.title}
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-semibold text-sm text-gray-700 mb-2">Key Inputs</h4>
                              <ul className="space-y-1">
                                {step.inputs.map((input, idx) => (
                                  <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                    {input}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="font-semibold text-sm text-gray-700 mb-2">Key Outputs</h4>
                              <ul className="space-y-1">
                                {step.outputs.map((output, idx) => (
                                  <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                    {output}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="font-semibold text-sm text-gray-700 mb-2">Key Metrics</h4>
                              <ul className="space-y-1">
                                {step.keyMetrics.map((metric, idx) => (
                                  <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                                    {metric}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Planning Steps Details Tab */}
        <TabsContent value="steps" className="space-y-6">
          {planningSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={step.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${step.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-2xl font-bold">Step {index + 1}: {step.title}</span>
                        <div className="flex items-center gap-4 mt-1">
                          <Badge variant="outline">{step.timeHorizon}</Badge>
                          <span className="text-sm text-gray-600">
                            Stakeholders: {step.stakeholders.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => navigateToStep(step.navigationPath)}>
                      Open Tool <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-6">{step.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Best Practices
                        </h4>
                        <ul className="space-y-2">
                          {step.bestPractices.map((practice, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {practice}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Success Metrics
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {step.keyMetrics.map((metric, idx) => (
                            <div key={idx} className="p-2 bg-gray-50 rounded text-xs text-center">
                              {metric}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Integration Tab */}
        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                How Planning Steps Integrate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Data Flow Integration</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="font-semibold text-blue-800">Demand → MPS</div>
                      <div className="text-sm text-blue-700">Forecasts become production requirements</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="font-semibold text-green-800">MPS → Production Planning</div>
                      <div className="text-sm text-green-700">MPS drives material and resource requirements</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="font-semibold text-purple-800">Planning → Capacity</div>
                      <div className="text-sm text-purple-700">Resource requirements validate feasibility</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="font-semibold text-red-800">Capacity → Scheduling</div>
                      <div className="text-sm text-red-700">Constraints shape detailed schedules</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Feedback Loops</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="font-semibold text-yellow-800">Capacity Feedback</div>
                      <div className="text-sm text-yellow-700">Capacity constraints update MPS feasibility</div>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div className="font-semibold text-indigo-800">Execution Feedback</div>
                      <div className="text-sm text-indigo-700">Actual performance improves future planning</div>
                    </div>
                    <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                      <div className="font-semibold text-pink-800">Demand Sensing</div>
                      <div className="text-sm text-pink-700">Real demand updates forecasts continuously</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">AI Integration Points</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <Brain className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="font-semibold text-blue-800">Smart Forecasting</div>
                    <div className="text-sm text-blue-700">AI improves demand prediction accuracy</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="font-semibold text-green-800">Optimization</div>
                    <div className="text-sm text-green-700">AI optimizes MPS and capacity allocation</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <Lightbulb className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <div className="font-semibold text-purple-800">Insights</div>
                    <div className="text-sm text-purple-700">AI provides actionable planning insights</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Getting Started Tab */}
        <TabsContent value="getting-started" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5" />
                Getting Started with Supply Chain Planning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Implementation Roadmap
                  </h3>
                  <div className="space-y-4">
                    {[
                      { phase: "Phase 1", title: "Data Foundation", desc: "Set up master data, BOMs, and historical data", duration: "2-4 weeks" },
                      { phase: "Phase 2", title: "Demand Planning", desc: "Implement forecasting and demand planning processes", duration: "3-6 weeks" },
                      { phase: "Phase 3", title: "Supply Planning", desc: "Configure MPS and production planning", duration: "4-8 weeks" },
                      { phase: "Phase 4", title: "Execution", desc: "Deploy capacity and production scheduling", duration: "2-4 weeks" }
                    ].map((phase, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{phase.phase}: {phase.title}</div>
                          <div className="text-sm text-gray-600">{phase.desc}</div>
                          <Badge variant="outline" className="text-xs mt-1">{phase.duration}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Quick Wins
                  </h3>
                  <div className="space-y-3">
                    {[
                      "Start with basic demand forecasting to improve visibility",
                      "Implement MPS to balance supply and demand",
                      "Use capacity planning to identify bottlenecks early",
                      "Apply AI recommendations to optimize decisions",
                      "Monitor KPIs to measure improvement"
                    ].map((win, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                        <span className="text-sm">{win}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Need Help Getting Started?</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Our planning tools include guided setup wizards and AI recommendations to help you get started quickly.
                    </p>
                    <Button 
                      size="sm" 
                      onClick={() => navigate('/demand-planning')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Start with Demand Planning
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlanningOverview;